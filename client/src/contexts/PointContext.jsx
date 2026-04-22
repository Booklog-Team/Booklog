// Booklog — PointContext
// 포인트 시스템 전역 관리 (적립, 기부, 조회)
// PRD.md §9 포인트 & 기부 시스템 상세, §12 팀원 역할 분담 참조
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  collection,
  onSnapshot,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";

/**
 * @typedef {Object} PointRecord
 * @property {string}   action      - 'read' | 'memo' | 'meeting-post' | 'board-post'
 * @property {number}   points      - 적립된 포인트
 * @property {string}   date        - YYYY-MM-DD
 * @property {string}   bookId      - (선택) 관련 도서 ID
 */

/**
 * @typedef {Object} PointContextValue
 * @property {number}           userPoints      - 사용자 보유 포인트
 * @property {number}           globalDonated   - 전체 누적 기부 포인트
 * @property {number}           goalAmount      - 기부 목표 포인트
 * @property {PointRecord[]}    history         - 포인트 적립 내역
 * @property {boolean}          loading         - 로딩 상태
 * @property {Error|null}       error           - 에러 상태
 * @property {Function}         addPoints       - 포인트 추가 (일일 제한 체크)
 * @property {Function}         donate          - 포인트 기부 (포인트 차감)
 * @property {Function}         canEarnToday    - 오늘 특정 행동으로 포인트 얻을 수 있는지 확인
 * @property {Function}         refreshPoints   - 포인트 데이터 재로드
 */

const PointContext = createContext(undefined);

// 포인트 규칙 (일일 제한)
const POINT_RULES = {
  read: { points: 10, maxPerDay: 1 }, // 독서 체크
  memo: { points: 5, maxPerDay: 1 }, // 메모 작성
  "meeting-post": { points: 5, maxPerDay: 1 }, // 모임 게시글
  "board-post": { points: 3, maxPerDay: 1 }, // 자유 게시판
};

/**
 * PointProvider
 * - 사용자 포인트와 전역 기부 포인트를 실시간으로 구독
 */
export function PointProvider({ children }) {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState(0);
  const [globalDonated, setGlobalDonated] = useState(0);
  const [goalAmount, setGoalAmount] = useState(100000); // 기본 목표액
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 사용자 포인트 구독
  useEffect(() => {
    if (!user) {
      setUserPoints(0);
      setHistory([]);
      return;
    }

    setLoading(true);

    // 사용자 포인트 구독
    const userRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(
      userRef,
      snapshot => {
        try {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setUserPoints(data.totalPoints || 0);
          }
          setError(null);
        } catch (err) {
          console.error("[PointContext] 사용자 포인트 로드 실패:", err);
          setError(err);
        } finally {
          setLoading(false);
        }
      },
      err => {
        console.error("[PointContext] 사용자 포인트 구독 에러:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribeUser();
  }, [user]);

  // 전역 기부 포인트 구독
  useEffect(() => {
    const globalRef = doc(db, "points", "global");

    const unsubscribeGlobal = onSnapshot(
      globalRef,
      snapshot => {
        try {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setGlobalDonated(data.totalDonated || 0);
            setGoalAmount(data.goalAmount || 100000);
          }
          setError(null);
        } catch (err) {
          console.error("[PointContext] 전역 포인트 로드 실패:", err);
          setError(err);
        }
      },
      err => {
        console.error("[PointContext] 전역 포인트 구독 에러:", err);
        setError(err);
      }
    );

    return () => unsubscribeGlobal();
  }, []);

  /**
   * 오늘 해당 행동으로 포인트를 얻을 수 있는지 확인
   * @param {string} action - 'read' | 'memo' | 'meeting-post' | 'board-post'
   * @returns {boolean}
   */
  const canEarnToday = async action => {
    if (!user || !POINT_RULES[action]) return false;

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return true; // 신규 사용자

      const today = new Date().toISOString().split("T")[0];
      const lastPointDate = userSnap.data().lastPointDate;

      // lastPointDate가 다른 날이면 포인트 재설정
      if (lastPointDate !== today) {
        return true;
      }

      // 같은 날이면, 해당 action의 일일 제한 확인 (여기서는 단순화: 1회만 가능)
      // 실제로는 pointHistory를 더 자세히 관리해야 함
      return false;
    } catch (err) {
      console.error("[PointContext] canEarnToday 실패:", err);
      return false;
    }
  };

  /**
   * 포인트 추가 (일일 제한 체크 포함)
   * @param {string} action - 'read' | 'memo' | 'meeting-post' | 'board-post'
   * @param {string} bookId - (선택) 관련 도서 ID
   * @returns {boolean} 포인트 추가 성공 여부
   */
  const addPoints = async (action, bookId = null) => {
    if (!user) {
      throw new Error("사용자가 로그인하지 않았습니다.");
    }

    if (!POINT_RULES[action]) {
      throw new Error("유효하지 않은 행동입니다.");
    }

    try {
      const today = new Date().toISOString().split("T")[0];
      const { points } = POINT_RULES[action];

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // 사용자 첫 생성 시 기초 데이터 설정
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          totalPoints: points,
          lastPointDate: today,
          nickname: user.displayName || user.email?.split("@")[0] || "User",
          email: user.email,
          isOnboarded: false,
          genres: [],
        });
      } else {
        const data = userSnap.data();
        const lastPointDate = data.lastPointDate;

        // 다른 날짜이면 포인트 추가 가능
        if (lastPointDate !== today) {
          await updateDoc(userRef, {
            totalPoints: increment(points),
            lastPointDate: today,
          });
        } else {
          // 같은 날이면 추가 불가 (간단한 구현, 실제로는 더 정교한 히스토리 필요)
          return false;
        }
      }

      // 전역 기부 포인트 업데이트
      const globalRef = doc(db, "points", "global");
      const globalSnap = await getDoc(globalRef);

      if (globalSnap.exists()) {
        await updateDoc(globalRef, {
          totalDonated: increment(points),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(globalRef, {
          totalDonated: points,
          goalAmount: 100000,
          updatedAt: serverTimestamp(),
        });
      }

      return true;
    } catch (err) {
      console.error("[PointContext] 포인트 추가 실패:", err);
      setError(err);
      throw err;
    }
  };

  /**
   * 포인트 기부 (사용자 포인트 차감 및 기부액 증가)
   * @param {number} amount - 기부 포인트
   */
  const donate = async amount => {
    if (!user) {
      throw new Error("사용자가 로그인하지 않았습니다.");
    }

    if (amount <= 0) {
      throw new Error("0 이상의 포인트를 입력하세요.");
    }

    if (userPoints < amount) {
      throw new Error("포인트가 부족합니다.");
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        totalPoints: increment(-amount),
      });

      const globalRef = doc(db, "points", "global");
      await updateDoc(globalRef, {
        totalDonated: increment(amount),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("[PointContext] 기부 실패:", err);
      setError(err);
      throw err;
    }
  };

  /**
   * 포인트 데이터 재로드
   */
  const refreshPoints = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserPoints(userSnap.data().totalPoints || 0);
      }

      const globalRef = doc(db, "points", "global");
      const globalSnap = await getDoc(globalRef);

      if (globalSnap.exists()) {
        setGlobalDonated(globalSnap.data().totalDonated || 0);
        setGoalAmount(globalSnap.data().goalAmount || 100000);
      }

      setError(null);
    } catch (err) {
      console.error("[PointContext] 포인트 재로드 실패:", err);
      setError(err);
    }
  };

  const value = {
    userPoints,
    globalDonated,
    goalAmount,
    history,
    loading,
    error,
    addPoints,
    donate,
    canEarnToday,
    refreshPoints,
  };

  return (
    <PointContext.Provider value={value}>{children}</PointContext.Provider>
  );
}

/**
 * usePoint 커스텀 훅
 */
export function usePoint() {
  const context = useContext(PointContext);
  if (context === undefined) {
    throw new Error("usePoint는 PointProvider 하위에서 사용해야 합니다.");
  }
  return context;
}

export default PointContext;
