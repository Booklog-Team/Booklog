// Booklog — ShelfContext
// 서재 상태 전역 관리 (도서 추가/삭제/상태 변경)
// PRD.md §7 Firestore 데이터 구조, §12 팀원 역할 분담 참조
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  onSnapshot,
  arrayUnion,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";

/**
 * @typedef {Object} BookShelf
 * @property {string}   id            - bookId (Google Books API ID)
 * @property {string}   title         - 책 제목
 * @property {string}   author        - 저자
 * @property {string}   thumbnail     - 표지 이미지 URL
 * @property {string}   status        - 'want' | 'reading' | 'done'
 * @property {number}   currentPage   - 현재까지 읽은 페이지
 * @property {number}   totalPage     - 전체 페이지 수
 * @property {string}   lastReadDate  - 마지막 읽은 날 (YYYY-MM-DD)
 * @property {string[]} checkedDates  - 독서한 날 배열
 * @property {string}   memo          - 한줄 메모
 */

/**
 * @typedef {Object} ShelfContextValue
 * @property {BookShelf[]}      books           - 서재 도서 목록
 * @property {Object[]}         readingLogs     - 독서 로그 목록
 * @property {BookShelf|null}   mainBook        - 대표 도서 (lastReadDate 기준)
 * @property {boolean}          loading         - 로딩 상태
 * @property {Error|null}       error           - 에러 상태
 * @property {Function}         addBook         - 도서 추가
 * @property {Function}         removeBook      - 도서 삭제
 * @property {Function}         updateBook      - 도서 정보 업데이트
 * @property {Function}         updateStatus    - 도서 상태 변경
 * @property {Function}         checkTodayRead  - 오늘 독서 체크
 * @property {Function}         updateMemo      - 메모 업데이트
 * @property {Function}         updateProgress  - 읽은 페이지 업데이트
 * @property {Function}         addReadingLog   - 독서 로그 추가
 * @property {Function}         getBooksByStatus - 상태별 도서 조회
 */

const ShelfContext = createContext(undefined);

function getTodayKey() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function timestampMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (typeof value === "string") {
    const parsed = Date.parse(value.length <= 10 ? `${value}T00:00:00` : value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function hasManualSortOrder(log) {
  return Number.isFinite(Number(log?.sortOrder));
}

function logUpdateMs(log) {
  return (
    timestampMs(log?.orderUpdatedAt) ||
    timestampMs(log?.updatedAt) ||
    timestampMs(log?.createdAt) ||
    timestampMs(log?.date)
  );
}

function compareLogsSameDate(a, b) {
  const aManual = hasManualSortOrder(a);
  const bManual = hasManualSortOrder(b);
  if (aManual || bManual) {
    if (aManual && bManual) {
      const diff = Number(a.sortOrder) - Number(b.sortOrder);
      if (diff !== 0) return diff;
    }
    if (aManual !== bManual) return aManual ? -1 : 1;
  }

  const updateDiff = logUpdateMs(b) - logUpdateMs(a);
  if (updateDiff !== 0) return updateDiff;
  return String(a.id || "").localeCompare(String(b.id || ""));
}

function sortBookLogsLatest(logs) {
  return [...logs].sort((a, b) => {
    const dateDiff = (b.date || "").localeCompare(a.date || "");
    if (dateDiff !== 0) return dateDiff;
    return compareLogsSameDate(a, b);
  });
}

function getBookLogStateUpdates(book, logs) {
  const sortedLogs = sortBookLogsLatest(logs.filter(log => log?.bookId));
  const latestLog = sortedLogs[0] || null;
  const readingDates = [
    ...new Set(
      logs
        .filter(log => log.status !== "want" && log.date)
        .map(log => log.date)
    ),
  ].sort();

  if (!latestLog) {
    return {
      status: "want",
      currentPage: 0,
      lastReadDate: null,
      startDate: null,
      endDate: null,
      checkedDates: [],
      updatedAt: serverTimestamp(),
    };
  }

  const nextStatus = latestLog.status || book?.status || "want";
  const nextCurrentPage =
    nextStatus === "want"
      ? 0
      : Number(latestLog.currentPage ?? latestLog.toPage ?? 0) || 0;
  const updates = {
    status: nextStatus,
    currentPage:
      nextStatus === "done"
        ? Number(latestLog.totalPage || book?.totalPage || nextCurrentPage) || 0
        : nextCurrentPage,
    lastReadDate: readingDates[readingDates.length - 1] || null,
    startDate: readingDates[0] || null,
    checkedDates: readingDates,
    updatedAt: serverTimestamp(),
  };

  if (nextStatus === "done") {
    updates.endDate = latestLog.date || null;
    if (Number.isFinite(Number(latestLog.rating))) {
      updates.rating = Number(latestLog.rating) || 0;
    }
  } else {
    updates.endDate = null;
  }

  return updates;
}

/**
 * ShelfProvider
 * - useAuth 로부터 user를 얻어 shelf 데이터 구독
 * - Firestore users/{uid}/shelf 컬렉션의 변경사항을 실시간 추적
 */
export function ShelfProvider({ children }) {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [readingLogs, setReadingLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Firestore 실시간 구독 (사용자 변경 시)
  useEffect(() => {
    if (!user) {
      setBooks([]);
      return;
    }

    setLoading(true);
    const shelfRef = collection(db, "users", user.uid, "shelf");
    const unsubscribe = onSnapshot(
      shelfRef,
      snapshot => {
        try {
          const booksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setBooks(booksData);
          setError(null);
        } catch (err) {
          console.error("[ShelfContext] 도서 목록 로드 실패:", err);
          setError(err);
        } finally {
          setLoading(false);
        }
      },
      err => {
        console.error("[ShelfContext] Firestore 구독 에러:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setReadingLogs([]);
      return;
    }

    const logsRef = collection(db, "users", user.uid, "readingLogs");
    const unsubscribe = onSnapshot(
      logsRef,
      snapshot => {
        const logsData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            if ((b.date || "") !== (a.date || "")) {
              return (b.date || "").localeCompare(a.date || "");
            }
            return timestampMs(b.createdAt) - timestampMs(a.createdAt);
          });
        setReadingLogs(logsData);
      },
      err => {
        console.error("[ShelfContext] 독서 로그 구독 실패:", err);
        setError(err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  /**
   * 도서 추가
   * @param {BookShelf} book
   */
  const addBook = async book => {
    if (!user) throw new Error("사용자가 로그인하지 않았습니다.");

    try {
      const bookRef = doc(db, "users", user.uid, "shelf", book.id);
      await setDoc(bookRef, {
        ...book,
        status: book.status || "want",
        currentPage: book.currentPage || 0,
        totalPage: book.totalPage || 0,
        lastReadDate: book.lastReadDate || null,
        checkedDates: book.checkedDates || [],
        memo: book.memo || "",
        addedAt: getTodayKey(),
        createdAt: book.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("[ShelfContext] 도서 추가 실패:", err);
      setError(err);
      throw err;
    }
  };

  /**
   * 도서 삭제
   * @param {string} bookId
   */
  const removeBook = async bookId => {
    if (!user) throw new Error("사용자가 로그인하지 않았습니다.");

    try {
      const bookRef = doc(db, "users", user.uid, "shelf", bookId);
      const logsSnapshot = await getDocs(
        query(
          collection(db, "users", user.uid, "readingLogs"),
          where("bookId", "==", bookId)
        )
      );
      const docsToDelete = [bookRef, ...logsSnapshot.docs.map(item => item.ref)];

      for (let i = 0; i < docsToDelete.length; i += 500) {
        const batch = writeBatch(db);
        docsToDelete.slice(i, i + 500).forEach(ref => batch.delete(ref));
        await batch.commit();
      }
    } catch (err) {
      console.error("[ShelfContext] 도서 삭제 실패:", err);
      setError(err);
      throw err;
    }
  };

  /**
   * 도서 정보 업데이트
   * @param {string} bookId
   * @param {Partial<BookShelf>} updates
   */
  const updateBook = async (bookId, updates) => {
    if (!user) throw new Error("사용자가 로그인하지 않았습니다.");

    try {
      const bookRef = doc(db, "users", user.uid, "shelf", bookId);
      await updateDoc(bookRef, updates);
    } catch (err) {
      console.error("[ShelfContext] 도서 업데이트 실패:", err);
      setError(err);
      throw err;
    }
  };

  /**
   * 도서 상태 변경 (want / reading / done)
   * @param {string} bookId
   * @param {string} status - 'want' | 'reading' | 'done'
   */
  const updateStatus = async (bookId, status) => {
    if (!user) throw new Error("사용자가 로그인하지 않았습니다.");
    if (!["want", "reading", "done"].includes(status)) {
      throw new Error("유효하지 않은 상태입니다.");
    }

    try {
      const bookRef = doc(db, "users", user.uid, "shelf", bookId);
      const currentBook = books.find(b => b.id === bookId);
      const updates = { status, updatedAt: serverTimestamp() };
      if (status === "done") {
        const today = getTodayKey();
        updates.currentPage = currentBook?.totalPage || currentBook?.currentPage || 0;
        updates.lastReadDate = today;
        updates.checkedDates = arrayUnion(today);
        if (!currentBook?.startDate) updates.startDate = today;
      } else if (status === "want" || currentBook?.status === "done") {
        updates.currentPage = 0;
      }
      await updateDoc(bookRef, updates);

      if (status === "done" && currentBook && currentBook.status !== "done") {
        const today = getTodayKey();
        const totalPage = Number(currentBook.totalPage) || 0;
        const targetPage = totalPage || Number(currentBook.currentPage) || 0;
        const fromPage = Number(currentBook.currentPage) || 0;
        await addDoc(collection(db, "users", user.uid, "readingLogs"), {
          bookId,
          title: currentBook.title || "제목 없음",
          author: currentBook.author || "",
          thumbnail: currentBook.thumbnail || "",
          status: "done",
          eventType: "completed",
          date: today,
          pagesRead: Math.max(0, targetPage - fromPage),
          fromPage,
          toPage: targetPage,
          currentPage: targetPage,
          totalPage,
          memo: "",
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("[ShelfContext] 상태 변경 실패:", err);
      setError(err);
      throw err;
    }
  };

  /**
   * 오늘 독서 체크 (checkedDates 배열에 오늘 날짜 추가)
   * @param {string} bookId
   * @returns {boolean} 새로 추가된 경우 true, 이미 존재하면 false
   */
  const checkTodayRead = async bookId => {
    if (!user) throw new Error("사용자가 로그인하지 않았습니다.");

    try {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const bookRef = doc(db, "users", user.uid, "shelf", bookId);
      const bookSnap = await getDoc(bookRef);

      if (!bookSnap.exists()) {
        throw new Error("도서를 찾을 수 없습니다.");
      }

      const checkedDates = bookSnap.data().checkedDates || [];
      const alreadyChecked = checkedDates.includes(today);

      if (!alreadyChecked) {
        await updateDoc(bookRef, {
          checkedDates: arrayUnion(today),
          lastReadDate: today,
        });
        return true; // 새로 추가됨 (포인트 적립 신호)
      }

      return false; // 이미 체크됨
    } catch (err) {
      console.error("[ShelfContext] 독서 체크 실패:", err);
      setError(err);
      throw err;
    }
  };

  /**
   * 메모 업데이트
   * @param {string} bookId
   * @param {string} memo
   */
  const updateMemo = async (bookId, memo) => {
    if (!user) throw new Error("사용자가 로그인하지 않았습니다.");

    try {
      const bookRef = doc(db, "users", user.uid, "shelf", bookId);
      await updateDoc(bookRef, { memo });
    } catch (err) {
      console.error("[ShelfContext] 메모 업데이트 실패:", err);
      setError(err);
      throw err;
    }
  };

  /**
   * 읽은 페이지 업데이트
   * @param {string} bookId
   * @param {number} currentPage
   */
  const updateProgress = async (bookId, currentPage) => {
    if (!user) throw new Error("사용자가 로그인하지 않았습니다.");

    try {
      const bookRef = doc(db, "users", user.uid, "shelf", bookId);
      await updateDoc(bookRef, { currentPage });
    } catch (err) {
      console.error("[ShelfContext] 진행률 업데이트 실패:", err);
      setError(err);
      throw err;
    }
  };

  /**
   * 독서 로그 추가
   * @param {string} bookId
   * @param {Object} entry
   * @param {string} entry.date - YYYY-MM-DD
   * @param {number} entry.pagesRead - 이번에 읽은 페이지 수
   * @param {number} entry.currentPage - 기록 후 현재 페이지
   * @param {string} entry.memo - 기록 메모
   * @param {string} entry.status - 'want' | 'reading' | 'done'
   */
  const addReadingLog = async (bookId, entry = {}) => {
    if (!user) throw new Error("사용자가 로그인하지 않았습니다.");

    const currentBook = books.find(book => book.id === bookId);
    if (!currentBook) throw new Error("서재에서 책을 찾을 수 없습니다.");

    const date = entry.date || getTodayKey();
    const totalPage = Number(currentBook.totalPage) || 0;
    const nextStatus = entry.status || currentBook.status || "reading";
    const rawFromPage =
      Number(entry.fromPage ?? currentBook.currentPage ?? 0) || 0;
    const fromPage = nextStatus === "want" ? 0 : rawFromPage;
    const requestedCurrentPage =
      nextStatus === "want" ? 0 : Number(entry.currentPage ?? fromPage) || 0;
    const currentPage =
      nextStatus === "want"
        ? 0
        : nextStatus === "done" && totalPage
          ? totalPage
          : Math.max(0, Math.min(requestedCurrentPage, totalPage || 99999));
    const pagesRead =
      nextStatus === "want" ? 0 : Math.max(0, Number(entry.pagesRead) || 0);
    const memo = (entry.memo || "").trim();
    const rating = Math.max(0, Math.min(5, Number(entry.rating) || 0));
    const eventType = entry.eventType || null;

    try {
      await addDoc(collection(db, "users", user.uid, "readingLogs"), {
        bookId,
        title: currentBook.title || "제목 없음",
        author: currentBook.author || "",
        thumbnail: currentBook.thumbnail || "",
        status: nextStatus,
        date,
        pagesRead,
        fromPage,
        toPage: currentPage,
        currentPage,
        totalPage,
        memo,
        ...(eventType && { eventType }),
        ...(nextStatus === "done" && { rating }),
        createdAt: serverTimestamp(),
      });

      const bookRef = doc(db, "users", user.uid, "shelf", bookId);
      const updates = {
        status: nextStatus,
        memo,
        updatedAt: serverTimestamp(),
      };

      if (nextStatus === "reading" || nextStatus === "done") {
        updates.currentPage = currentPage;
        updates.lastReadDate = date;
        updates.checkedDates = arrayUnion(date);
        if (!currentBook.startDate) updates.startDate = date;
      } else if (nextStatus === "want") {
        updates.currentPage = 0;
      }

      if (nextStatus === "done") {
        updates.rating = rating;
        updates.endDate = date;
      }

      await updateDoc(bookRef, updates);

      if (nextStatus !== "want" && pagesRead > 0) {
        const statRef = doc(db, "users", user.uid, "readingStats", date);
        await setDoc(
          statRef,
          {
            date,
            pagesRead: increment(pagesRead),
            count: increment(1),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.error("[ShelfContext] 독서 로그 추가 실패:", err);
      setError(err);
      throw err;
    }
  };

  /**
   * 독서 로그 삭제
   * @param {string} logId
   */
  const deleteReadingLog = async logId => {
    if (!user) throw new Error("사용자가 로그인하지 않았습니다.");
    const targetLog = readingLogs.find(log => log.id === logId);
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "users", user.uid, "readingLogs", logId));

      if (targetLog?.bookId) {
        const remainingBookLogs = readingLogs.filter(
          log => log.id !== logId && log.bookId === targetLog.bookId
        );
        const currentBook = books.find(book => book.id === targetLog.bookId);
        const bookRef = doc(db, "users", user.uid, "shelf", targetLog.bookId);
        batch.update(
          bookRef,
          getBookLogStateUpdates(currentBook, remainingBookLogs)
        );
      }

      await batch.commit();
    } catch (err) {
      console.error("[ShelfContext] 독서 로그 삭제 실패:", err);
      setError(err);
      throw err;
    }
  };

  /**
   * 독서 로그 정렬 순서 변경
   * @param {Object} payload
   * @param {string} payload.logId
   * @param {string} payload.targetDate - 현재 로그 날짜(YYYY-MM-DD)
   * @param {string[]} payload.orderedLogIds - 같은 날짜 내 표시 순서
   */
  const moveReadingLog = async ({ logId, targetDate, orderedLogIds = [] }) => {
    if (!user) throw new Error("사용자가 로그인하지 않았습니다.");
    if (!logId || !targetDate) throw new Error("이동할 로그 정보가 없습니다.");

    const currentLog = readingLogs.find(log => log.id === logId);
    if (!currentLog) throw new Error("독서 로그를 찾을 수 없습니다.");
    if (currentLog.date !== targetDate) {
      throw new Error("로그 날짜는 드래그앤드랍으로 변경할 수 없습니다.");
    }

    const uniqueOrderedIds = [...new Set(orderedLogIds.filter(Boolean))];
    const idsToUpdate = uniqueOrderedIds.includes(logId)
      ? uniqueOrderedIds
      : [logId, ...uniqueOrderedIds];

    try {
      const batch = writeBatch(db);
      const now = serverTimestamp();

      idsToUpdate.forEach((id, index) => {
        const updates = {
          sortOrder: (index + 1) * 1000,
          orderUpdatedAt: now,
          updatedAt: now,
        };
        batch.update(doc(db, "users", user.uid, "readingLogs", id), updates);
      });

      const sortOrderById = new Map(
        idsToUpdate.map((id, index) => [id, (index + 1) * 1000])
      );
      const nextBookLogs = readingLogs
        .filter(log => log.bookId === currentLog.bookId)
        .map(log =>
          sortOrderById.has(log.id)
            ? {
                ...log,
                sortOrder: sortOrderById.get(log.id),
                orderUpdatedAt: Date.now(),
                updatedAt: Date.now(),
              }
            : log
        );
      const currentBook = books.find(book => book.id === currentLog.bookId);
      batch.update(
        doc(db, "users", user.uid, "shelf", currentLog.bookId),
        getBookLogStateUpdates(currentBook, nextBookLogs)
      );

      await batch.commit();
    } catch (err) {
      console.error("[ShelfContext] 독서 로그 이동 실패:", err);
      setError(err);
      throw err;
    }
  };

  /**
   * 일일 독서 기록 저장 (Firestore users/{uid}/readingStats/{date})
   * @param {string} date - YYYY-MM-DD
   * @param {number} pagesRead - 읽은 페이지 수
   * @param {number} count - 체크한 책 수
   */
  const recordDailyReading = async (date, pagesRead, count) => {
    if (!user) return;
    try {
      const statRef = doc(db, "users", user.uid, "readingStats", date);
      const snap = await getDoc(statRef);
      if (snap.exists()) {
        const existing = snap.data();
        await updateDoc(statRef, {
          pagesRead: Math.max(existing.pagesRead || 0, pagesRead),
          count: (existing.count || 0) + count,
        });
      } else {
        await setDoc(statRef, { date, pagesRead, count });
      }
    } catch (err) {
      console.error("[ShelfContext] 일일 독서 기록 실패:", err);
    }
  };

  /**
   * 월별 일일 독서 통계 조회
   * @param {number} year
   * @param {number} month - 0-based
   * @returns {Promise<Object>} { 'YYYY-MM-DD': { pagesRead, count } }
   */
  const getDailyReadingStats = async (year, month) => {
    if (!user) return {};
    try {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      const stats = {};

      // Firestore에서 해당 월의 모든 readingStats 문서 가져오기
      const statsRef = collection(db, "users", user.uid, "readingStats");
      const q = query(statsRef);
      const snapshot = await getDoc(
        collection(db, "users", user.uid, "readingStats")
      );

      // 실제로는 날짜 범위 쿼리가 필요하지만, 간단히 모든 문서를 가져와 필터링
      const allStats = await Promise.all(
        Array.from({ length: endDate.getDate() }, (_, i) => {
          const date = new Date(year, month, i + 1).toISOString().split("T")[0];
          const statRef = doc(db, "users", user.uid, "readingStats", date);
          return getDoc(statRef).then(snap =>
            snap.exists() ? { date, ...snap.data() } : null
          );
        })
      );

      allStats.filter(Boolean).forEach(stat => {
        stats[stat.date] = {
          pagesRead: stat.pagesRead || 0,
          count: stat.count || 0,
        };
      });

      return stats;
    } catch (err) {
      console.error("[ShelfContext] 월별 통계 조회 실패:", err);
      return {};
    }
  };

  /**
   * 상태별 도서 조회
   * @param {string} status - 'want' | 'reading' | 'done' 또는 null (전체)
   * @returns {BookShelf[]}
   */
  const getBooksByStatus = status => {
    if (!status) return books;
    return books.filter(book => book.status === status);
  };

  /**
   * 대표 도서 계산 (lastReadDate 기준, reading 우선)
   */
  const mainBook = (() => {
    const readingBooks = books.filter(b => b.status === "reading");
    if (readingBooks.length === 0) return null;

    return readingBooks.reduce((latest, current) => {
      if (!latest.lastReadDate) return current;
      if (!current.lastReadDate) return latest;
      return new Date(current.lastReadDate) > new Date(latest.lastReadDate)
        ? current
        : latest;
    });
  })();

  const value = {
    books,
    readingLogs,
    mainBook,
    loading,
    error,
    addBook,
    removeBook,
    updateBook,
    updateStatus,
    checkTodayRead,
    updateMemo,
    updateProgress,
    addReadingLog,
    deleteReadingLog,
    moveReadingLog,
    getBooksByStatus,
    recordDailyReading,
    getDailyReadingStats,
  };

  return (
    <ShelfContext.Provider value={value}>{children}</ShelfContext.Provider>
  );
}

/**
 * useShelf 커스텀 훅
 */
export function useShelf() {
  const context = useContext(ShelfContext);
  if (context === undefined) {
    throw new Error("useShelf는 ShelfProvider 하위에서 사용해야 합니다.");
  }
  return context;
}

export default ShelfContext;
