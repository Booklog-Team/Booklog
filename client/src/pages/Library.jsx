import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Plus,
  Flame,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  BookOpen,
  PenLine,
  ArrowLeft,
  CalendarDays,
  FileText,
  Trash2,
  X,
  GripVertical,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { ko } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useShelf } from "@/contexts/ShelfContext";
import { usePoint } from "@/contexts/PointContext";
import ShelfCard from "@/components/ShelfCard";
import { getReadingStatusStyle } from "@/utils/readingStatus";

const READING_STATUS_OPTS = [
  {
    value: "want",
    label: "읽고 싶음",
    emoji: "🔖",
    inactive:
      "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100",
    active: "bg-amber-400 text-white border border-amber-400",
  },
  {
    value: "reading",
    label: "읽는 중",
    emoji: "📖",
    inactive:
      "bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10",
    active: "bg-sky-50 text-sky-700 border-2 border-sky-400",
  },
  {
    value: "done",
    label: "완독",
    emoji: "✅",
    inactive:
      "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100",
    active: "bg-emerald-500 text-white border border-emerald-500",
  },
];

const PAGE_SIZE = 6;

const STATUS_TABS = [
  { value: "all", label: "전체" },
  { value: "reading", label: "읽는 중" },
  { value: "want", label: "읽고 싶음" },
  { value: "done", label: "완독" },
];

const LOG_SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "oldest", label: "등록순" },
];

function getStatusStyle(status) {
  return getReadingStatusStyle(status);
}

function StatusBadge({ status, className = "" }) {
  const style = getStatusStyle(status);
  return (
    <span
      className={`inline-flex w-fit items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${style.badge} ${className}`}
    >
      {style.label}
    </span>
  );
}

function LogSortToggle({ value, onChange }) {
  return (
    <div className="flex shrink-0 rounded-lg bg-secondary/70 p-0.5">
      {LOG_SORT_OPTIONS.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
            value === option.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function RatingPicker({ value, onChange, disabled = false }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(score => {
        const active = score <= value;
        return (
          <button
            key={score}
            type="button"
            disabled={disabled}
            onClick={() => onChange(score === value ? 0 : score)}
            className="rounded-md p-1 transition-colors hover:bg-secondary disabled:opacity-60"
            aria-label={`${score}점`}
          >
            <Star
              size={22}
              className={
                active
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              }
            />
          </button>
        );
      })}
    </div>
  );
}

function getColorLevel(count) {
  if (!count || count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

function getHeatStyle(level) {
  if (level === 0) return {};
  return {
    backgroundColor: `var(--heatmap-${level})`,
    color: level >= 3 ? "var(--heatmap-text)" : "var(--foreground)",
  };
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function calculateStreak(shelf) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const all = new Set();
  shelf.forEach(b =>
    (b.checkedDates || []).forEach(d => {
      if (d <= todayStr) all.add(d);
    })
  );
  if (!all.size) return 0;

  const sorted = [...all].sort().reverse();
  const yesterday = new Date(Date.now() - 86_400_000)
    .toISOString()
    .slice(0, 10);

  if (sorted[0] !== todayStr && sorted[0] !== yesterday) return 0;

  let count = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round(
      (new Date(sorted[i - 1]) - new Date(sorted[i])) / 86_400_000
    );
    if (diff === 1) count += 1;
    else break;
  }
  return count;
}

function formatDateKo(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-");
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
}

function formatDateShort(dateStr) {
  if (!dateStr) return null;
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}월 ${parseInt(d)}일`;
}

function bookProgress(book) {
  if (!book) return 0;
  if (book.status === "done") return 100;
  if (book.totalPage && book.currentPage)
    return Math.round((book.currentPage / book.totalPage) * 100);
  return 0;
}

function getTodayKey() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function clampNumber(value, min, max) {
  const next = Number(value);
  if (!Number.isFinite(next)) return min;
  return Math.max(min, Math.min(next, max));
}

function getSliderThumbAlignedStyle(value, max) {
  const percent = max > 0 ? clampNumber((value / max) * 100, 0, 100) : 0;
  const thumbHalfWidth = 8;
  const thumbOffset = thumbHalfWidth - (percent / 50) * thumbHalfWidth;
  return { left: `calc(${percent}% + ${thumbOffset}px)` };
}

function getStatusEventText(log, dateOverride, { isFirstLog = false } = {}) {
  const dateLabel = formatDateShort(dateOverride || log?.date);
  if (!dateLabel) return null;

  if (isFirstLog) return `${dateLabel}에 내 서재에 등록`;
  if (!log?.eventType || log.eventType === "want_added") return null;
  if (log.eventType === "reading_started") return `${dateLabel}에 읽기 시작`;
  if (log.eventType === "completed") return `${dateLabel}에 완독`;
  return null;
}

function getDateSummaryText(log, dateOverride) {
  const dateLabel = formatDateShort(dateOverride || log?.date);
  if (!dateLabel || !log?.status) return null;

  if (log.status === "want") {
    return {
      text: `${dateLabel}에 내 서재에 등록`,
      className: "text-muted-foreground",
    };
  }
  if (log.status === "reading") {
    return {
      text: `${dateLabel}부터 읽기 시작`,
      className: "text-muted-foreground",
    };
  }
  if (log.status === "done") {
    return {
      text: "완독했어요! 🎉",
      className: "font-semibold text-emerald-600",
    };
  }
  return null;
}

function getStatusEventClassName(log) {
  if (log?.status === "done") return "text-emerald-600";
  if (log?.status === "reading") return "text-primary";
  return "text-muted-foreground";
}

function shouldShowLogPages(log) {
  if (log?.status === "want") return false;
  return Number(log?.fromPage || 0) > 0 || Number(log?.toPage || 0) > 0;
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

function logUpdateMs(log) {
  return (
    timestampMs(log?.orderUpdatedAt) ||
    timestampMs(log?.updatedAt) ||
    timestampMs(log?.createdAt) ||
    timestampMs(log?.date)
  );
}

function hasManualSortOrder(log) {
  return Number.isFinite(Number(log?.sortOrder));
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

function sortLogs(logs, order = "latest") {
  const compareLatest = (a, b) => {
    const dateDiff = (b.date || "").localeCompare(a.date || "");
    if (dateDiff !== 0) return dateDiff;
    return compareLogsSameDate(a, b);
  };

  return [...logs].sort((a, b) => {
    const result = compareLatest(a, b);
    return order === "oldest" ? -result : result;
  });
}

function getLatestLogId(logs) {
  const realLogs = logs.filter(log => !log.isSnapshot);
  const candidates = realLogs.length > 0 ? realLogs : logs;
  return sortLogs(candidates, "latest")[0]?.id || null;
}

function getFirstLogId(logs) {
  const realLogs = logs.filter(log => !log.isSnapshot);
  return sortLogs(realLogs, "oldest")[0]?.id || null;
}

function shouldShowStatusBadge(logs, index) {
  if (index <= 0) return true;
  return logs[index - 1]?.status !== logs[index]?.status;
}

function getLatestBookActivityMs(book, latestLogUpdatedMsByBook) {
  return Math.max(
    timestampMs(book?.updatedAt),
    timestampMs(book?.addedAt),
    timestampMs(book?.createdAt),
    latestLogUpdatedMsByBook.get(book?.id) || 0
  );
}

function getBookStartDate(book, logs = []) {
  const candidates = [
    book?.startDate,
    book?.lastReadDate,
    ...(book?.checkedDates || []),
    ...logs.map(log => log.date),
  ].filter(Boolean);

  if (!candidates.length) return null;
  return candidates.sort()[0];
}

function normalizeLog(log, book) {
  const fromPage = Number(log.fromPage ?? 0) || 0;
  const toPage = Number(log.toPage ?? log.currentPage ?? 0) || 0;
  const pagesRead =
    Number(log.pagesRead ?? Math.max(0, toPage - fromPage)) || 0;

  return {
    ...log,
    title: log.title || book?.title || "제목 없음",
    author: log.author || book?.author || "",
    thumbnail: log.thumbnail || book?.thumbnail || "",
    status: log.status || book?.status || "reading",
    fromPage,
    toPage,
    pagesRead,
    totalPage: Number(log.totalPage ?? book?.totalPage ?? 0) || 0,
    memo: log.memo || "",
  };
}

function buildDisplayLogs(books, logs) {
  const bookMap = new Map(books.map(book => [book.id, book]));
  const normalized = logs
    .filter(log => bookMap.has(log.bookId))
    .map(log => normalizeLog(log, bookMap.get(log.bookId)));
  const realLogKeys = new Set(
    normalized.map(log => `${log.bookId}|${log.date}`)
  );
  const fallbackLogs = [];

  books.forEach(book => {
    const checkedDates = [...(book.checkedDates || [])].sort();
    const totalRead =
      book.status === "done"
        ? book.totalPage || book.currentPage || 0
        : book.currentPage || 0;
    const estimatedPages = checkedDates.length
      ? Math.max(1, Math.round(totalRead / checkedDates.length))
      : 0;

    checkedDates.forEach((date, index) => {
      const key = `${book.id}|${date}`;
      if (realLogKeys.has(key)) return;

      const fromPage = Math.min(totalRead, estimatedPages * index);
      const toPage = Math.min(totalRead, fromPage + estimatedPages);

      fallbackLogs.push(
        normalizeLog(
          {
            id: `snapshot-${book.id}-${date}`,
            bookId: book.id,
            date,
            status: book.status,
            fromPage,
            toPage,
            currentPage: toPage,
            pagesRead: Math.max(0, toPage - fromPage),
            memo: book.memo || "",
            isSnapshot: true,
          },
          book
        )
      );
    });
  });

  return sortLogs([...normalized, ...fallbackLogs], "latest");
}

export default function Library() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();
  const {
    books,
    readingLogs,
    loading,
    error,
    removeBook,
    updateStatus,
    addReadingLog,
    deleteReadingLog,
    moveReadingLog,
  } = useShelf();
  const { addPoint } = usePoint();

  const today = new Date();
  const todayStr = getTodayKey();
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [focusedBookId, setFocusedBookId] = useState(null);
  const [logModalBookId, setLogModalBookId] = useState(null);
  const [expandedDateBookIds, setExpandedDateBookIds] = useState(new Set());
  const [dateDetailSort, setDateDetailSort] = useState("latest");
  const [bookLogSort, setBookLogSort] = useState("latest");
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [recordBookId, setRecordBookId] = useState(null);
  const [recordSyncLeftPanel, setRecordSyncLeftPanel] = useState(true);
  const [recordSaving, setRecordSaving] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [recordDate, setRecordDate] = useState(todayStr);
  const [recordStatus, setRecordStatus] = useState("reading");
  const [recordFromPage, setRecordFromPage] = useState(0);
  const [recordToPage, setRecordToPage] = useState(0);
  const [recordFromStr, setRecordFromStr] = useState("0");
  const [recordToStr, setRecordToStr] = useState("0");
  const [prevFromMarker, setPrevFromMarker] = useState(0);
  const [prevToMarker, setPrevToMarker] = useState(0);
  const [recordMemo, setRecordMemo] = useState("");
  const [recordRating, setRecordRating] = useState(0);
  const [confirmDeleteLogId, setConfirmDeleteLogId] = useState(null);
  const [draggedLogId, setDraggedLogId] = useState(null);
  const [dragOverLogId, setDragOverLogId] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);
  const draggedLogIdRef = useRef(null);
  const [shelfPage, setShelfPage] = useState(1);
  const [confirmDeleteShelfBookId, setConfirmDeleteShelfBookId] =
    useState(null);
  const [removeBookConfirm, setRemoveBookConfirm] = useState(false);

  const calendarBooks = books;
  const bookMap = useMemo(
    () => new Map(books.map(book => [book.id, book])),
    [books]
  );
  const displayLogs = useMemo(
    () => buildDisplayLogs(books, readingLogs),
    [books, readingLogs]
  );
  const latestLogUpdatedMsByBook = useMemo(() => {
    const map = new Map();
    readingLogs.forEach(log => {
      const next = logUpdateMs(log);
      if (next > (map.get(log.bookId) || 0)) map.set(log.bookId, next);
    });
    return map;
  }, [readingLogs]);
  const sortedBooks = useMemo(
    () =>
      [...books].sort((a, b) => {
        const activityDiff =
          getLatestBookActivityMs(b, latestLogUpdatedMsByBook) -
          getLatestBookActivityMs(a, latestLogUpdatedMsByBook);
        if (activityDiff !== 0) return activityDiff;
        return (a.title || "").localeCompare(b.title || "", "ko");
      }),
    [books, latestLogUpdatedMsByBook]
  );

  const readingActivityBooks = useMemo(
    () => sortedBooks.filter(b => b.status === "reading"),
    [sortedBooks]
  );

  // 가장 최근 날짜에 기록된 읽는 중 도서
  const featured = useMemo(() => {
    if (readingActivityBooks.length === 0) return null;
    return readingActivityBooks[0];
  }, [readingActivityBooks]);

  // 읽는 중 목록 — 실제 데이터, 대표 도서 제외
  const readingBooks = useMemo(
    () => readingActivityBooks.filter(b => b.id !== featured?.id),
    [readingActivityBooks, featured]
  );

  const streak = useMemo(() => calculateStreak(calendarBooks), [calendarBooks]);

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const monthName = `${calYear}년 ${calMonth + 1}월`;

  const monthCalendarData = useMemo(() => {
    const prefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    const booksByDate = {};
    displayLogs.forEach(log => {
      if (!log.date?.startsWith(prefix)) return;
      if (!booksByDate[log.date]) booksByDate[log.date] = new Set();
      booksByDate[log.date].add(log.bookId);
    });
    return Object.fromEntries(
      Object.entries(booksByDate).map(([date, bookIds]) => [date, bookIds.size])
    );
  }, [calYear, calMonth, displayLogs]);

  const monthStats = useMemo(() => {
    const prefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    const daysSet = new Set();
    let totalPages = 0;

    calendarBooks.forEach(book => {
      const bookMonthDates = (book.checkedDates || []).filter(d =>
        d.startsWith(prefix)
      );
      bookMonthDates.forEach(d => daysSet.add(d));
      if (bookMonthDates.length > 0) {
        const totalChecked = (book.checkedDates || []).length || 1;
        const pagesEarned =
          book.status === "done" ? book.totalPage || 0 : book.currentPage || 0;
        totalPages += Math.round(
          (pagesEarned / totalChecked) * bookMonthDates.length
        );
      }
    });

    const readingDays = daysSet.size;
    return {
      readingDays,
      totalPages,
      avgPages: readingDays > 0 ? Math.round(totalPages / readingDays) : 0,
    };
  }, [calYear, calMonth, displayLogs]);

  const calendarCells = useMemo(() => {
    const cells = [];
    const prevMonth = calMonth === 0 ? 11 : calMonth - 1;
    const prevYear = calMonth === 0 ? calYear - 1 : calYear;
    const daysInPrev = getDaysInMonth(prevYear, prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ type: "prev", day: daysInPrev - i });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ type: "current", day });
    }
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      cells.push({ type: "next", day });
    }
    return cells;
  }, [calYear, calMonth, daysInMonth, firstDay]);

  const logsOnDate = useMemo(() => {
    if (!selectedDate) return [];
    return displayLogs.filter(log => log.date === selectedDate);
  }, [selectedDate, displayLogs]);

  const logsOnDateGrouped = useMemo(() => {
    const groups = new Map();
    logsOnDate.forEach(log => {
      if (!groups.has(log.bookId))
        groups.set(log.bookId, { real: [], snapshot: null });
      if (log.isSnapshot) groups.get(log.bookId).snapshot = log;
      else groups.get(log.bookId).real.push(log);
    });
    return Array.from(groups.entries())
      .map(([bookId, { real, snapshot }]) => {
        const sortedReal = sortLogs(real, dateDetailSort);
        return {
          bookId,
          primaryLog: sortedReal.length > 0 ? sortedReal[0] : snapshot,
          realLogs: sortedReal,
          hasMultiple: sortedReal.length > 1,
        };
      })
      .sort((a, b) => {
        const result = compareLogsSameDate(a.primaryLog, b.primaryLog);
        return dateDetailSort === "oldest" ? -result : result;
      });
  }, [logsOnDate, dateDetailSort]);

  const selectedDateBookCount = useMemo(
    () => new Set(logsOnDate.map(log => log.bookId)).size,
    [logsOnDate]
  );

  const focusedBook = focusedBookId ? bookMap.get(focusedBookId) : null;
  const recordBook = recordBookId ? bookMap.get(recordBookId) : null;

  const focusedBookLogs = useMemo(
    () => displayLogs.filter(log => log.bookId === focusedBookId),
    [displayLogs, focusedBookId]
  );
  const recordBookLogs = useMemo(
    () => displayLogs.filter(log => log.bookId === recordBookId),
    [displayLogs, recordBookId]
  );
  const sortedFocusedBookLogs = useMemo(
    () => sortLogs(focusedBookLogs, bookLogSort),
    [focusedBookLogs, bookLogSort]
  );
  const focusedLatestLogId = useMemo(
    () => getLatestLogId(focusedBookLogs),
    [focusedBookLogs]
  );
  const focusedFirstLogId = useMemo(
    () => getFirstLogId(focusedBookLogs),
    [focusedBookLogs]
  );
  const focusedRegistrationDate = useMemo(() => {
    const firstLog = focusedBookLogs.find(log => log.id === focusedFirstLogId);
    return firstLog?.date || null;
  }, [focusedBookLogs, focusedFirstLogId]);

  const focusedBookStartDate = useMemo(
    () => (focusedBook ? getBookStartDate(focusedBook, focusedBookLogs) : null),
    [focusedBook, focusedBookLogs]
  );

  const logModalBook = logModalBookId ? bookMap.get(logModalBookId) : null;
  const logModalLogs = useMemo(
    () => displayLogs.filter(log => log.bookId === logModalBookId),
    [displayLogs, logModalBookId]
  );
  const sortedLogModalLogs = useMemo(
    () => sortLogs(logModalLogs, bookLogSort),
    [logModalLogs, bookLogSort]
  );
  const logModalLatestLogId = useMemo(
    () => getLatestLogId(logModalLogs),
    [logModalLogs]
  );
  const logModalFirstLogId = useMemo(
    () => getFirstLogId(logModalLogs),
    [logModalLogs]
  );

  const firstLogIdByBook = useMemo(() => {
    const groups = new Map();
    displayLogs.forEach(log => {
      if (log.isSnapshot) return;
      if (!groups.has(log.bookId)) groups.set(log.bookId, []);
      groups.get(log.bookId).push(log);
    });

    const map = new Map();
    groups.forEach((logs, bookId) => {
      map.set(bookId, getFirstLogId(logs));
    });
    return map;
  }, [displayLogs]);

  const featuredProgress = bookProgress(featured);

  const prepareRecordForm = (book, bookLogs = []) => {
    if (!book) return;

    const nextStatus = book.status || "reading";

    // 삭제된 로그를 제외하고 남아있는 가장 최신 로그의 toPage를 시작 페이지로 사용
    // (book.currentPage는 로그 삭제 시 갱신되지 않아 stale할 수 있음)
    const lastRealLog = bookLogs.find(l => !l.isSnapshot);
    const effectiveCurrentPage = lastRealLog
      ? Number(lastRealLog.toPage ?? lastRealLog.currentPage) || 0
      : Number(book.currentPage) || 0;

    const fromPage = nextStatus === "want" ? 0 : effectiveCurrentPage;
    const toPage =
      nextStatus === "done" && book.totalPage ? book.totalPage : fromPage;

    setPrevFromMarker(lastRealLog ? Number(lastRealLog.fromPage) || 0 : 0);
    setPrevToMarker(fromPage);

    setRecordDate(todayStr);
    setRecordStatus(nextStatus);
    setRecordFromPage(fromPage);
    setRecordFromStr(String(fromPage));
    setRecordToPage(toPage);
    setRecordToStr(String(toPage));
    setRecordMemo("");
    setRecordRating(Number(book.rating) || 0);
  };

  const openBookLogs = bookId => {
    if (!bookId) return;
    setFocusedBookId(bookId);
  };

  const openRecordForBook = (bookId, { syncLeftPanel = true } = {}) => {
    const book = bookMap.get(bookId);
    if (!book) return;
    const bookLogs = displayLogs.filter(
      l => l.bookId === bookId && !l.isSnapshot
    );
    if (syncLeftPanel) {
      setFocusedBookId(bookId);
    }
    setRecordBookId(bookId);
    setRecordSyncLeftPanel(syncLeftPanel);
    prepareRecordForm(book, bookLogs);
    setDatePickerOpen(false);
    setRecordModalOpen(true);
  };

  useEffect(() => {
    setExpandedDateBookIds(new Set());
  }, [selectedDate]);

  useEffect(() => {
    setShelfPage(1);
  }, [activeTab]);

  useEffect(() => {
    const queryBookId = searchParams.get("bookId");
    if (!queryBookId || !bookMap.has(queryBookId)) return;

    setSelectedDate(null);
    setFocusedBookId(queryBookId);
    if (searchParams.get("record") === "1") {
      const queryBook = bookMap.get(queryBookId);
      const queryBookLogs = displayLogs.filter(
        l => l.bookId === queryBookId && !l.isSnapshot
      );
      setRecordBookId(queryBookId);
      setRecordSyncLeftPanel(true);
      prepareRecordForm(queryBook, queryBookLogs);
      setRecordModalOpen(true);
    }
    setSearchParams({}, { replace: true });
  }, [bookMap, displayLogs, searchParams, setSearchParams]);

  const handleBackLeftPanel = () => {
    if (focusedBookId) {
      setFocusedBookId(null);
      return;
    }
    if (selectedDate) {
      setSelectedDate(null);
    }
  };

  const handleDateSelect = dateKey => {
    const next = selectedDate === dateKey ? null : dateKey;
    setSelectedDate(next);
    setExpandedDateBookIds(new Set());
    if (next) {
      setFocusedBookId(null);
    }
  };

  const clearDragState = () => {
    draggedLogIdRef.current = null;
    setDraggedLogId(null);
    setDragOverLogId(null);
    setDragOverDate(null);
  };

  const getDraggedLog = event => {
    const id =
      event?.dataTransfer?.getData("text/plain") ||
      draggedLogIdRef.current ||
      draggedLogId;
    if (!id) return null;
    return displayLogs.find(log => log.id === id && !log.isSnapshot) || null;
  };

  const getBlockedDropMessage = (draggedLog, targetDate) => {
    if (!draggedLog || !targetDate || draggedLog.date === targetDate) {
      return null;
    }
    if (targetDate < draggedLog.date) {
      return "설정한 날짜보다 이전 날짜로는 이동할 수 없어요.";
    }
    return "로그 날짜는 기록할 때 선택한 날짜로 유지돼요.";
  };

  const buildDropOrder = (draggedLog, targetDate, targetLog, insertAfter) => {
    const sameDateLogs = sortLogs(
      displayLogs.filter(
        log =>
          !log.isSnapshot &&
          log.bookId === draggedLog.bookId &&
          log.date === targetDate &&
          log.id !== draggedLog.id
      ),
      "latest"
    );
    let targetIndex = sameDateLogs.length;

    if (targetLog) {
      const foundIndex = sameDateLogs.findIndex(log => log.id === targetLog.id);
      targetIndex = foundIndex >= 0 ? foundIndex : sameDateLogs.length;
      if (insertAfter) targetIndex += 1;
    }

    const nextLogs = [...sameDateLogs];
    nextLogs.splice(targetIndex, 0, draggedLog);
    return nextLogs.map(log => log.id);
  };

  const handleLogDragStart = (event, log) => {
    if (log.isSnapshot) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", log.id);
    event.dataTransfer.setData("application/x-booklog-log-id", log.id);
    draggedLogIdRef.current = log.id;
    setDraggedLogId(log.id);
  };

  const handleLogDragOver = (event, targetLog) => {
    const draggedLog = getDraggedLog(event);
    if (!draggedLog || !targetLog || targetLog.isSnapshot) return;
    event.preventDefault();
    event.stopPropagation();
    const isBlocked =
      draggedLog.bookId !== targetLog.bookId ||
      !!getBlockedDropMessage(draggedLog, targetLog.date);
    event.dataTransfer.dropEffect = isBlocked ? "none" : "move";
    setDragOverLogId(isBlocked ? null : targetLog.id);
  };

  const handleLogDropOnLog = async (event, targetLog) => {
    event.preventDefault();
    event.stopPropagation();

    const draggedLog = getDraggedLog(event);
    if (!draggedLog || !targetLog || targetLog.isSnapshot) {
      clearDragState();
      return;
    }
    if (draggedLog.id === targetLog.id) {
      clearDragState();
      return;
    }
    if (draggedLog.bookId !== targetLog.bookId) {
      toast.error("같은 책의 로그끼리만 순서를 바꿀 수 있어요.");
      clearDragState();
      return;
    }
    const blockedMessage = getBlockedDropMessage(draggedLog, targetLog.date);
    if (blockedMessage) {
      toast.error(blockedMessage);
      clearDragState();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const insertAfter = event.clientY > rect.top + rect.height / 2;
    const orderedLogIds = buildDropOrder(
      draggedLog,
      targetLog.date,
      targetLog,
      insertAfter
    );

    try {
      await moveReadingLog({
        logId: draggedLog.id,
        targetDate: targetLog.date,
        orderedLogIds,
      });
      toast.success("로그 순서를 변경했습니다.");
    } catch (err) {
      console.error(err);
      toast.error("로그 이동에 실패했어요.");
    } finally {
      clearDragState();
    }
  };

  const handleLogDropOnDate = async (event, targetDate) => {
    const draggedLog = getDraggedLog(event);
    if (!draggedLog) {
      clearDragState();
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const blockedMessage = getBlockedDropMessage(draggedLog, targetDate);
    if (blockedMessage) {
      toast.error(blockedMessage);
      clearDragState();
      return;
    }

    toast.info("같은 날짜 안의 로그 위에 놓으면 순서를 바꿀 수 있어요.");
    clearDragState();
  };

  const fireCompletionConfetti = () => {
    const colors = ["#ff6b9d", "#c084fc", "#60a5fa", "#34d399", "#fbbf24", "#f97316"];
    const burst = (origin, angle) =>
      confetti({ particleCount: 60, angle, spread: 70, origin, colors, scalar: 1.1 });
    burst({ x: 0.5, y: 0.6 }, 90);
    setTimeout(() => { burst({ x: 0.2, y: 0.7 }, 60); burst({ x: 0.8, y: 0.7 }, 120); }, 250);
    setTimeout(() => { burst({ x: 0.35, y: 0.55 }, 75); burst({ x: 0.65, y: 0.55 }, 105); }, 550);
    setTimeout(() => { burst({ x: 0.5, y: 0.5 }, 90); }, 850);
  };

  const handleRecordStatusChange = nextStatus => {
    setRecordStatus(nextStatus);
    if (nextStatus === "done") {
      setRecordRating(prev => prev || Number(recordBook?.rating) || 0);
    }
    if (nextStatus === "want") return;
    if (nextStatus === "done" && recordBook?.totalPage) {
      setRecordToPage(recordBook.totalPage);
      setRecordToStr(String(recordBook.totalPage));
    } else if (nextStatus === "reading") {
      const lastRealLog = recordBookLogs.find(l => !l.isSnapshot);
      const from = lastRealLog
        ? Number(lastRealLog.toPage ?? lastRealLog.currentPage) || 0
        : Number(recordBook?.currentPage) || 0;
      setRecordFromPage(from);
      setRecordFromStr(String(from));
      setRecordToPage(from);
      setRecordToStr(String(from));
    }
  };

  const handleRecordSubmit = async e => {
    e.preventDefault();
    if (!recordBook) return;

    const selectedRecordDate = recordDate || todayStr;
    const isBackdatedRecord = selectedRecordDate < todayStr;
    const maxPage = recordBook.totalPage || 99999;
    const fromPage =
      recordStatus === "want"
        ? 0
        : clampNumber(recordFromPage, 0, maxPage);
    const toPage =
      recordStatus === "want"
        ? 0
        : clampNumber(recordToPage, fromPage, maxPage);
    const pagesRead = Math.max(0, toPage - fromPage);
    const statusChanged = recordStatus !== recordBook.status;
    const ratingChanged =
      recordStatus === "done" &&
      recordRating !== (Number(recordBook.rating) || 0);
    const eventType =
      recordStatus === "done"
        ? "completed"
        : statusChanged && recordStatus === "reading"
          ? "reading_started"
          : statusChanged && recordStatus === "want"
            ? "want_added"
            : undefined;

    if (
      !statusChanged &&
      !ratingChanged &&
      !isBackdatedRecord &&
      recordStatus !== "want" &&
      pagesRead <= 0 &&
      !recordMemo.trim()
    ) {
      toast.error("읽은 페이지나 메모를 남겨주세요.");
      return;
    }

    setRecordSaving(true);
    try {
      await addReadingLog(recordBook.id, {
        date: selectedRecordDate,
        status: recordStatus,
        pagesRead,
        fromPage,
        currentPage: toPage,
        memo: recordMemo,
        rating: recordStatus === "done" ? recordRating : undefined,
        eventType,
      });

      if (recordStatus === "reading" || recordStatus === "done") {
        addPoint("reading_check").catch(() => {});
      }
      if (recordMemo.trim()) {
        addPoint("memo").catch(() => {});
      }

      toast.success("독서 로그를 저장했습니다.");
      if (recordStatus === "done") fireCompletionConfetti();
      if (recordSyncLeftPanel) {
        setSelectedDate(recordDate || todayStr);
      }
      setRecordModalOpen(false);
      setRecordBookId(null);
      setRecordSyncLeftPanel(true);
    } catch (err) {
      console.error(err);
      toast.error("기록 저장에 실패했어요.");
    } finally {
      setRecordSaving(false);
    }
  };

  const handleDeleteLog = async logId => {
    try {
      await deleteReadingLog(logId);
      toast.success("기록이 삭제되었습니다.");
      setConfirmDeleteLogId(null);
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const showBackButton = selectedDate || focusedBookId;
  const leftLabel = focusedBook
    ? "책별 로그"
    : selectedDate
      ? `${formatDateShort(selectedDate)} 기록`
      : "최근 읽은 도서";

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 lg:px-8">
        {/* 페이지 헤더 */}
        <motion.div
          className="mb-6 flex items-start justify-between gap-4"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">내 서재</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile?.nickname ? `${profile.nickname}님의` : "나의"} 독서
              흐름을 한눈에 확인해보세요.
            </p>
          </div>
          <Button
            onClick={() => navigate("/search")}
            className="shrink-0 rounded-xl"
          >
            <Plus size={16} className="mr-1.5" />책 추가
          </Button>
        </motion.div>

        {error && (
          <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            서재를 불러오는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.
          </div>
        )}

        {/* ── 메인 그리드 (두 열 항상 동일 높이) ── */}
        <motion.div
          className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-stretch"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          {/* ── 왼쪽 열 ── */}
          <div className="flex flex-col lg:h-0 lg:min-h-full">
            {/* 레이블 — 날짜 선택 시 텍스트 교체 */}
            <div className="mb-3 flex items-center gap-1.5">
              {showBackButton && (
                <button
                  onClick={handleBackLeftPanel}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <ArrowLeft size={13} />
                </button>
              )}
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {leftLabel}
              </h2>
            </div>

            {/* 단일 카드 — 최근 도서, 날짜별 로그, 책별 로그를 같은 자리에서 전환 */}
            <div className="book-card flex flex-1 min-h-0 flex-col overflow-hidden">
              {focusedBook ? (
                <>
                  <div className="shrink-0 border-b border-border/40 p-5">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/book/${focusedBook.id}`)}
                        className="shrink-0 transition-opacity hover:opacity-75"
                      >
                        <img
                          src={focusedBook.thumbnail || "/placeholder.png"}
                          alt={focusedBook.title}
                          className="h-28 w-[76px] rounded-xl object-cover shadow-md"
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <StatusBadge status={focusedBook.status} />
                          <button
                            type="button"
                            onClick={() => navigate(`/book/${focusedBook.id}`)}
                            className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground/50 transition-colors hover:text-primary"
                          >
                            <BookOpen size={10} />
                            도서 상세
                          </button>
                        </div>
                        <h3 className="line-clamp-2 text-lg font-bold leading-snug">
                          {focusedBook.title}
                        </h3>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {focusedBook.author}
                        </p>
                        {focusedBook.status === "done" &&
                        focusedBook.lastReadDate ? (
                          <p className="mt-1.5 text-xs font-semibold text-emerald-600">
                            {formatDateKo(focusedBook.lastReadDate)}에 완독
                          </p>
                        ) : focusedBook.status === "reading" &&
                          focusedBookStartDate ? (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {formatDateKo(focusedBookStartDate)}부터 읽기 시작
                          </p>
                        ) : focusedBook.status === "want" &&
                          (focusedRegistrationDate ||
                            focusedBook.addedAt ||
                            focusedBook.lastReadDate) ? (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {formatDateKo(
                              focusedRegistrationDate ||
                                focusedBook.addedAt ||
                                focusedBook.lastReadDate
                            )}
                            에 내 서재에 등록
                          </p>
                        ) : null}
                        {focusedBook.totalPage > 0 && (
                          <div className="mt-2.5 space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                {focusedBook.status === "done"
                                  ? focusedBook.totalPage
                                  : focusedBook.currentPage || 0}
                                p / {focusedBook.totalPage}p
                              </span>
                              <span className="font-bold text-primary">
                                {bookProgress(focusedBook)}%
                              </span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${bookProgress(focusedBook)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {focusedBookLogs.length === 0 ? (
                      <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center p-4">
                        <CalendarDays
                          size={28}
                          className="text-muted-foreground/30"
                        />
                        <p className="text-sm text-muted-foreground">
                          아직 이 책의 로그가 없어요
                        </p>
                        <button
                          type="button"
                          onClick={() => openRecordForBook(focusedBook.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                        >
                          <PenLine size={12} />
                          기록하기
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <FileText
                              size={13}
                              className="text-muted-foreground/60"
                            />
                            <span className="text-xs text-muted-foreground">
                              총{" "}
                              <span className="font-semibold text-foreground">
                                {
                                  focusedBookLogs.filter(l => !l.isSnapshot)
                                    .length
                                }
                              </span>
                              개의 기록
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <LogSortToggle
                              value={bookLogSort}
                              onChange={setBookLogSort}
                            />
                            <button
                              type="button"
                              onClick={() => openRecordForBook(focusedBook.id)}
                              className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/70"
                            >
                              <PenLine size={11} />
                              기록 · 상태 변경
                            </button>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          {sortedFocusedBookLogs.map((log, idx) => {
                            const pagesRead = Number(log.pagesRead || 0);
                            const statusStyle = getStatusStyle(log.status);
                            const isLatestLog = log.id === focusedLatestLogId;
                            const showStatusBadge = shouldShowStatusBadge(
                              sortedFocusedBookLogs,
                              idx
                            );
                            const eventText = getStatusEventText(log, null, {
                              isFirstLog: log.id === focusedFirstLogId,
                            });
                            return (
                              <div
                                key={log.id}
                                draggable={!log.isSnapshot}
                                onDragStart={event =>
                                  handleLogDragStart(event, log)
                                }
                                onDragEnd={clearDragState}
                                onDragOver={event =>
                                  handleLogDragOver(event, log)
                                }
                                onDragLeave={() => setDragOverLogId(null)}
                                onDrop={event => handleLogDropOnLog(event, log)}
                                className={`flex gap-3 rounded-xl px-2 py-2 -mx-2 ${
                                  isLatestLog
                                    ? "bg-black/[0.04] ring-1 ring-black/10 dark:bg-white/[0.06] dark:ring-white/10"
                                    : ""
                                } ${
                                  dragOverLogId === log.id
                                    ? "outline outline-2 outline-primary/35"
                                    : ""
                                } ${
                                  !log.isSnapshot
                                    ? "cursor-grab active:cursor-grabbing"
                                    : ""
                                }`}
                              >
                                <div className="flex flex-col items-center pt-1">
                                  <div
                                    className={`h-2 w-2 shrink-0 rounded-full ${statusStyle.dot}`}
                                  />
                                  {idx < sortedFocusedBookLogs.length - 1 && (
                                    <div className="mt-1 w-px flex-1 bg-border/50" />
                                  )}
                                </div>
                                <div className="mb-3 min-w-0 flex-1">
                                  <div className="mb-1.5 flex items-center justify-between">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {!log.isSnapshot && (
                                        <GripVertical
                                          size={12}
                                          className="shrink-0 text-muted-foreground/35"
                                        />
                                      )}
                                      <span className="text-xs font-bold text-foreground">
                                        {formatDateKo(log.date)}
                                      </span>
                                      {showStatusBadge && (
                                        <StatusBadge status={log.status} />
                                      )}
                                      {isLatestLog && (
                                        <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[9px] font-semibold text-foreground/70">
                                          최신
                                        </span>
                                      )}
                                    </div>
                                    {!log.isSnapshot && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setConfirmDeleteLogId(
                                            confirmDeleteLogId === log.id
                                              ? null
                                              : log.id
                                          )
                                        }
                                        className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/30 transition-colors hover:bg-destructive/10 hover:text-destructive"
                                      >
                                        <X size={11} />
                                      </button>
                                    )}
                                  </div>
                                  {confirmDeleteLogId === log.id && (
                                    <div className="mb-2 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-2.5 py-1.5">
                                      <span className="flex-1 text-xs text-destructive">
                                        삭제하시겠어요?
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteLog(log.id)}
                                        className="rounded px-2 py-0.5 text-[11px] font-bold text-white bg-destructive hover:bg-destructive/90"
                                      >
                                        삭제
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setConfirmDeleteLogId(null)
                                        }
                                        className="rounded bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground hover:bg-secondary/70"
                                      >
                                        취소
                                      </button>
                                    </div>
                                  )}
                                  {eventText && (
                                    <p
                                      className={`mb-1.5 text-[11px] font-semibold ${getStatusEventClassName(log)}`}
                                    >
                                      {eventText}
                                    </p>
                                  )}
                                  {shouldShowLogPages(log) && (
                                    <div className="mb-1.5 flex items-baseline gap-1.5">
                                      <span className="text-sm font-bold text-foreground">
                                        {pagesRead > 0
                                          ? `${pagesRead.toLocaleString()}p`
                                          : "—"}
                                      </span>
                                      {log.fromPage > 0 && log.toPage > 0 && (
                                        <span className="text-[11px] text-muted-foreground">
                                          ({log.fromPage}p → {log.toPage}p)
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {log.memo && (
                                    <div className="mt-2 rounded-lg border border-l-[3px] border-primary/25 bg-amber-50/60 px-2.5 py-1.5 dark:bg-amber-950/20">
                                      <p className="line-clamp-3 whitespace-pre-wrap text-xs italic leading-relaxed text-amber-900/75 dark:text-amber-100/60">
                                        {log.memo}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : selectedDate ? (
                logsOnDate.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
                    <BookOpen size={28} className="text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      이 날은 독서 기록이 없어요
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      달력에서 다른 날짜를 선택해보세요
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {selectedDateBookCount}권의 책을 읽었어요
                      </p>
                      <LogSortToggle
                        value={dateDetailSort}
                        onChange={setDateDetailSort}
                      />
                    </div>
                    <div className="space-y-2.5">
                      {logsOnDateGrouped.map(
                        ({ bookId, primaryLog, realLogs, hasMultiple }) => {
                          const book = bookMap.get(bookId);
                          const startDate = getBookStartDate(
                            book,
                            displayLogs.filter(item => item.bookId === bookId)
                          );
                          const dateGroupKey = `${selectedDate}-${bookId}`;
                          const isExpanded =
                            expandedDateBookIds.has(dateGroupKey);
                          const log = primaryLog;
                          const dateLogs = sortLogs(
                            realLogs.length > 0 ? realLogs : [log],
                            dateDetailSort
                          );
                          const latestDateLogId = getLatestLogId(dateLogs);
                          const summaryText = getDateSummaryText(
                            log,
                            selectedDate
                          );
                          return (
                            <div
                              key={bookId}
                              draggable={!primaryLog?.isSnapshot}
                              onDragStart={event =>
                                handleLogDragStart(event, primaryLog)
                              }
                              onDragEnd={clearDragState}
                              onDragOver={event =>
                                handleLogDragOver(event, primaryLog)
                              }
                              onDragLeave={() => setDragOverLogId(null)}
                              onDrop={event =>
                                handleLogDropOnLog(event, primaryLog)
                              }
                              className={`rounded-xl border border-border/60 overflow-hidden ${
                                dragOverLogId === primaryLog?.id
                                  ? "outline outline-2 outline-primary/35"
                                  : ""
                              } ${
                                !primaryLog?.isSnapshot
                                  ? "cursor-grab active:cursor-grabbing"
                                  : ""
                              }`}
                            >
                              <div className="flex items-stretch">
                                <button
                                  type="button"
                                  className="flex flex-1 gap-3 p-3 text-left transition-colors hover:bg-secondary/50"
                                  onClick={() => openBookLogs(bookId)}
                                >
                                  <img
                                    src={log.thumbnail || "/placeholder.png"}
                                    alt={log.title}
                                    className="h-16 w-11 shrink-0 rounded-lg object-cover shadow-sm"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                      <StatusBadge status={log.status} />
                                      {log.isSnapshot && (
                                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                          현재 기록
                                        </span>
                                      )}
                                      {hasMultiple && (
                                        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                          {realLogs.length}회 기록
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="line-clamp-1 text-sm font-bold">
                                      {log.title}
                                    </h4>
                                    <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                      {log.author}
                                    </p>
                                    {summaryText ? (
                                      <p
                                        className={`mt-1 text-[11px] ${summaryText.className}`}
                                      >
                                        {summaryText.text}
                                      </p>
                                    ) : startDate ? (
                                      <p className="mt-1 text-[11px] text-muted-foreground">
                                        {formatDateShort(startDate)}부터 읽기
                                        시작
                                      </p>
                                    ) : null}
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  className="flex items-center px-2.5 transition-colors hover:bg-secondary/50"
                                  onClick={() =>
                                    setExpandedDateBookIds(prev => {
                                      const next = new Set(prev);
                                      if (next.has(dateGroupKey))
                                        next.delete(dateGroupKey);
                                      else next.add(dateGroupKey);
                                      return next;
                                    })
                                  }
                                  aria-label={
                                    isExpanded
                                      ? "날짜별 기록 접기"
                                      : "날짜별 기록 펼치기"
                                  }
                                >
                                  <ChevronDown
                                    size={14}
                                    className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                  />
                                </button>
                              </div>
                              {isExpanded && (
                                <div className="border-t border-border/40 bg-secondary/10 px-3 pt-3 pb-1">
                                  {dateLogs.map((rl, i) => {
                                    const rlPagesRead = Number(
                                      rl.pagesRead || 0
                                    );
                                    const rlStatusStyle = getStatusStyle(
                                      rl.status
                                    );
                                    const isLatestDateLog =
                                      rl.id === latestDateLogId;
                                    const showStatusBadge =
                                      shouldShowStatusBadge(dateLogs, i);
                                    const rlEventText =
                                      rl.status === "done"
                                        ? null
                                        : getStatusEventText(
                                            rl,
                                            selectedDate,
                                            {
                                              isFirstLog:
                                                rl.id ===
                                                firstLogIdByBook.get(bookId),
                                            }
                                          );
                                    return (
                                      <div
                                        key={rl.id}
                                        draggable={!rl.isSnapshot}
                                        onDragStart={event =>
                                          handleLogDragStart(event, rl)
                                        }
                                        onDragEnd={clearDragState}
                                        onDragOver={event =>
                                          handleLogDragOver(event, rl)
                                        }
                                        onDragLeave={() =>
                                          setDragOverLogId(null)
                                        }
                                        onDrop={event =>
                                          handleLogDropOnLog(event, rl)
                                        }
                                        className={`flex gap-2.5 rounded-lg px-2 py-1 -mx-2 ${
                                          isLatestDateLog
                                            ? "bg-black/[0.04] ring-1 ring-black/10 dark:bg-white/[0.06] dark:ring-white/10"
                                            : ""
                                        } ${
                                          dragOverLogId === rl.id
                                            ? "outline outline-2 outline-primary/35"
                                            : ""
                                        } ${
                                          !rl.isSnapshot
                                            ? "cursor-grab active:cursor-grabbing"
                                            : ""
                                        }`}
                                      >
                                        <div className="flex flex-col items-center pt-1">
                                          <div
                                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${rlStatusStyle.dot}`}
                                          />
                                          {i < dateLogs.length - 1 && (
                                            <div className="mt-0.5 w-px flex-1 bg-border/40" />
                                          )}
                                        </div>
                                        <div className="mb-2.5 min-w-0 flex-1">
                                          <div className="mb-0.5 flex items-center gap-1.5">
                                            {!rl.isSnapshot && (
                                              <GripVertical
                                                size={11}
                                                className="shrink-0 text-muted-foreground/35"
                                              />
                                            )}
                                            <span className="text-[10px] font-semibold text-muted-foreground">
                                              기록 {i + 1}
                                            </span>
                                            {showStatusBadge && (
                                              <StatusBadge
                                                status={rl.status}
                                                className="text-[9px]"
                                              />
                                            )}
                                            {isLatestDateLog && (
                                              <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[9px] font-semibold text-foreground/70">
                                                최신
                                              </span>
                                            )}
                                          </div>
                                          {rlEventText ? (
                                            <p
                                              className={`text-[11px] font-semibold ${getStatusEventClassName(rl)}`}
                                            >
                                              {rlEventText}
                                            </p>
                                          ) : (
                                            rl.status === "done" && (
                                              <p className="text-[11px] font-semibold text-emerald-600">
                                                완독했어요! 🎉
                                              </p>
                                            )
                                          )}
                                          {rl.status !== "want" &&
                                            rl.status !== "done" &&
                                            (rl.fromPage > 0 ||
                                              rl.toPage > 0) && (
                                              <p className="text-[11px]">
                                                <span className="font-semibold text-foreground">
                                                  {rlPagesRead > 0
                                                    ? `${rlPagesRead.toLocaleString()}p 읽음`
                                                    : "—"}
                                                </span>
                                                {rl.fromPage > 0 &&
                                                  rl.toPage > 0 && (
                                                    <span className="ml-1 text-[10px] text-muted-foreground/70">
                                                      ({rl.fromPage}~{rl.toPage}
                                                      p)
                                                    </span>
                                                  )}
                                              </p>
                                            )}
                                          {rl.memo && (
                                            <div className="mt-1 rounded-lg border border-l-[3px] border-primary/25 bg-amber-50/60 px-2 py-1 dark:bg-amber-950/20">
                                              <p className="line-clamp-2 whitespace-pre-wrap text-[10px] italic leading-relaxed text-amber-900/75 dark:text-amber-100/60">
                                                {rl.memo}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )
              ) : (
                <>
                  {loading ? (
                    <div className="shrink-0 flex items-center gap-4 p-5">
                      <Skeleton className="h-32 w-[88px] shrink-0 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-1/4" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-7 w-28 rounded-lg" />
                      </div>
                    </div>
                  ) : featured ? (
                    <div
                      className="shrink-0 cursor-pointer p-5 transition-colors hover:bg-secondary/20"
                      onClick={() => openBookLogs(featured.id)}
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={featured.thumbnail || "/placeholder.png"}
                          alt={featured.title}
                          className="h-28 w-[76px] shrink-0 rounded-xl object-cover shadow-md"
                        />
                        <div className="min-w-0 flex-1">
                          <StatusBadge
                            status={featured.status}
                            className="mb-1"
                          />
                          <h3 className="line-clamp-2 text-lg font-bold leading-snug">
                            {featured.title}
                          </h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {featured.author}
                          </p>

                          {featured.lastReadDate && (
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              마지막 기록{" "}
                              <span className="font-semibold text-foreground">
                                {formatDateKo(featured.lastReadDate)}
                              </span>
                            </p>
                          )}

                          {featured.totalPage > 0 && (
                            <div className="mt-2.5 space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {featured.status === "done"
                                    ? featured.totalPage
                                    : featured.currentPage || 0}
                                  p / {featured.totalPage}p
                                </span>
                                <span className="font-bold text-primary">
                                  {featuredProgress}%
                                </span>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ width: `${featuredProgress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="shrink-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
                      <BookOpen
                        size={32}
                        className="text-muted-foreground/30"
                      />
                      <p className="text-sm text-muted-foreground">
                        아직 서재에 등록된 책이 없어요
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/search")}
                      >
                        <Plus size={14} className="mr-1" />책 추가하기
                      </Button>
                    </div>
                  )}

                  <div className="shrink-0 border-t border-border/40" />

                  <div className="flex flex-1 min-h-0 flex-col">
                    <div className="flex shrink-0 items-center gap-2 px-4 pt-3 pb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        읽는 중
                      </span>
                      {readingBooks.length > 0 && (
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                          {readingBooks.length}
                        </span>
                      )}
                    </div>

                    {loading ? (
                      <div className="flex-1 min-h-0 space-y-1.5 overflow-hidden px-3 pb-1">
                        {[1, 2].map(i => (
                          <div
                            key={i}
                            className="flex items-center gap-3 rounded-xl p-2"
                          >
                            <Skeleton className="h-12 w-9 shrink-0 rounded-lg" />
                            <div className="flex-1 space-y-1.5">
                              <Skeleton className="h-3 w-3/4" />
                              <Skeleton className="h-2.5 w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : readingBooks.length === 0 ? (
                      <div className="flex flex-1 min-h-0 items-center justify-center px-4 py-4">
                        <p className="text-xs text-muted-foreground">
                          읽고 있는 책이 없어요
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0 overflow-y-auto px-3">
                        <div className="space-y-1.5 py-1">
                          {readingBooks.map(book => {
                            const prog =
                              book.totalPage && book.currentPage
                                ? Math.round(
                                    (book.currentPage / book.totalPage) * 100
                                  )
                                : 0;
                            return (
                              <div
                                key={book.id}
                                className="flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/60"
                                onClick={() => openBookLogs(book.id)}
                              >
                                <img
                                  src={book.thumbnail || "/placeholder.png"}
                                  alt={book.title}
                                  className="h-12 w-9 shrink-0 rounded-lg object-cover shadow-sm"
                                />
                                <div className="min-w-0 flex-1">
                                  <h4 className="line-clamp-1 text-sm font-semibold">
                                    {book.title}
                                  </h4>
                                  <p className="text-[11px] text-muted-foreground">
                                    {book.author}
                                  </p>
                                  {book.totalPage > 0 && (
                                    <div className="mt-1 space-y-0.5">
                                      <div className="flex justify-between text-[10px]">
                                        <span className="text-muted-foreground">
                                          {book.currentPage || 0}p /{" "}
                                          {book.totalPage}p
                                        </span>
                                        <span className="font-bold text-primary">
                                          {prog}%
                                        </span>
                                      </div>
                                      <div className="progress-bar">
                                        <div
                                          className="progress-fill"
                                          style={{ width: `${prog}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="shrink-0 border-t border-border/40 p-3">
                      <button
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-secondary py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
                        onClick={() => navigate("/search")}
                      >
                        <Plus size={13} />책 추가하기
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── 오른쪽 열: 독서 캘린더 ── */}
          <div className="flex flex-col">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              독서 캘린더
            </h2>

            <div className="book-card flex flex-1 flex-col p-4">
              {/* 월 네비게이션 */}
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (calMonth === 0) {
                      setCalMonth(11);
                      setCalYear(y => y - 1);
                    } else {
                      setCalMonth(m => m - 1);
                    }
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-secondary"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold">{monthName}</span>
                <button
                  onClick={() => {
                    if (calMonth === 11) {
                      setCalMonth(0);
                      setCalYear(y => y + 1);
                    } else {
                      setCalMonth(m => m + 1);
                    }
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-secondary"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* 요일 헤더 */}
              <div className="mb-2 grid grid-cols-7">
                {["일", "월", "화", "수", "목", "금", "토"].map(d => (
                  <div
                    key={d}
                    className="py-1 text-center text-[11px] font-medium text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* 날짜 셀 — 클릭 시 왼쪽 패널 전환 */}
              <div className="grid grid-cols-7 gap-0.5">
                {calendarCells.map((cell, idx) => {
                  if (cell.type !== "current") {
                    return (
                      <div
                        key={`${cell.type}-${idx}`}
                        className="flex aspect-square items-center justify-center text-xs text-muted-foreground/30"
                      >
                        {cell.day}
                      </div>
                    );
                  }

                  const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
                  const count = monthCalendarData[dateKey] || 0;
                  const level = getColorLevel(count);
                  const isToday = dateKey === todayStr;
                  const isSelected = dateKey === selectedDate;
                  const heatStyle = getHeatStyle(level);

                  return (
                    <div
                      key={dateKey}
                      onClick={() => handleDateSelect(dateKey)}
                      onDragOver={event => {
                        const draggedLog = getDraggedLog(event);
                        if (!draggedLog) return;
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "none";
                        setDragOverDate(
                          draggedLog.date === dateKey ? dateKey : null
                        );
                      }}
                      onDragLeave={() => setDragOverDate(null)}
                      onDrop={event => handleLogDropOnDate(event, dateKey)}
                      className="flex aspect-square cursor-pointer items-center justify-center"
                    >
                      <div
                        className={`flex h-[92%] w-[92%] transform-gpu items-center justify-center rounded-full text-xs transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:shadow-md ${
                          isSelected
                            ? "font-bold shadow-md"
                            : level > 0
                              ? "font-semibold shadow-sm hover:opacity-80 ring-1 ring-black/20 dark:ring-white/25"
                              : isToday
                                ? "bg-secondary font-semibold text-foreground ring-2 ring-primary/40"
                                : "text-muted-foreground hover:bg-secondary/60"
                        } ${
                          dragOverDate === dateKey
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                            : ""
                        }`}
                        style={
                          isSelected
                            ? {
                                backgroundColor: "var(--cal-select-bg)",
                                color: "white",
                                boxShadow:
                                  "0 0 0 2px var(--card), 0 0 0 4px var(--cal-select-ring)",
                              }
                            : level > 0
                              ? heatStyle
                              : undefined
                        }
                      >
                        {cell.day}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 통계 영역 */}
              <div className="mt-3 border-t border-border/40 pt-3">
                {/* 월 단위 표시 헤더 */}
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {calMonth + 1}월 독서 현황
                </p>

                {/* 독서한 날 · 총 페이지 · 일 평균 */}
                <div className="mb-3 grid grid-cols-3 divide-x divide-border/40 rounded-xl bg-secondary/50 py-3">
                  <div className="flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-card/35">
                    <span className="text-[10px] text-muted-foreground">
                      독서한 날
                    </span>
                    <div className="flex items-baseline gap-0.5">
                      <span
                        className="text-xl font-bold leading-none"
                        style={{ color: "var(--stat-color-1)" }}
                      >
                        {monthStats.readingDays}
                      </span>
                      <span className="text-xs text-muted-foreground">일</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-card/35">
                    <span className="text-[10px] text-muted-foreground">
                      총 페이지
                    </span>
                    <span
                      className="text-xl font-bold leading-none"
                      style={{ color: "var(--stat-color-2)" }}
                    >
                      {monthStats.totalPages.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-card/35">
                    <span className="text-[10px] text-muted-foreground">
                      하루 평균
                    </span>
                    <div className="flex items-baseline gap-0.5">
                      <span
                        className="text-xl font-bold leading-none"
                        style={{ color: "var(--stat-color-1)" }}
                      >
                        {monthStats.avgPages}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        페이지
                      </span>
                    </div>
                  </div>
                </div>

                {/* 독서량 강도 범례 + 연속 독서 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="mr-0.5 text-[10px] text-muted-foreground">
                      적음
                    </span>
                    {[0, 1, 2, 3, 4].map(l => (
                      <div
                        key={l}
                        className="h-3 w-3 rounded transition-colors duration-200"
                        style={{
                          backgroundColor: `var(--heatmap-${l})`,
                          border: "1px solid rgba(128,128,128,0.18)",
                        }}
                      />
                    ))}
                    <span className="ml-0.5 text-[10px] text-muted-foreground">
                      많음
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Flame size={12} className="text-amber-500" />
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {streak}일 연속 독서 중
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── 서재 전체 탭 ── */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
        >
          <div className="mb-3 flex justify-end">
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-lg p-1.5 transition-colors ${
                  viewMode === "list"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-lg p-1.5 transition-colors ${
                  viewMode === "grid"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 h-auto w-full rounded-xl bg-secondary p-1">
              {STATUS_TABS.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 transform-gpu rounded-lg py-2 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:bg-card/70 hover:text-foreground data-[state=active]:bg-card data-[state=active]:shadow-sm"
                >
                  {tab.label}
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    (
                    {tab.value === "all"
                      ? books.length
                      : books.filter(b => b.status === tab.value).length}
                    )
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {STATUS_TABS.map(tab => {
              const tabBooks =
                tab.value === "all"
                  ? sortedBooks
                  : sortedBooks.filter(b => b.status === tab.value);
              const totalTabPages = Math.ceil(tabBooks.length / PAGE_SIZE);
              const pagedBooks = tabBooks.slice(
                (shelfPage - 1) * PAGE_SIZE,
                shelfPage * PAGE_SIZE
              );
              const Pagination =
                totalTabPages > 1 ? (
                  <div className="mt-4 flex items-center justify-center gap-1">
                    {Array.from({ length: totalTabPages }, (_, i) => i + 1).map(
                      page => (
                        <button
                          key={page}
                          onClick={() => setShelfPage(page)}
                          className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${
                            shelfPage === page
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>
                ) : null;
              return (
                <TabsContent key={tab.value} value={tab.value} className="mt-0">
                  {loading ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
                      ))}
                    </div>
                  ) : tabBooks.length === 0 ? (
                    <div className="py-16 text-center">
                      <p className="text-sm text-muted-foreground">
                        아직 책이 없어요
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => navigate("/search")}
                      >
                        <Plus size={14} className="mr-1" />책 추가하기
                      </Button>
                    </div>
                  ) : viewMode === "list" ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {pagedBooks.map((book, idx) => (
                          <motion.div
                            key={book.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.04 }}
                            className="group relative"
                          >
                            <ShelfCard
                              book={book}
                              variant="compact"
                              onStatusChange={updateStatus}
                              onDelete={removeBook}
                              onClick={() => setLogModalBookId(book.id)}
                            />
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setConfirmDeleteShelfBookId(book.id);
                              }}
                              className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X size={11} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                      {Pagination}
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                        {pagedBooks.map((book, idx) => (
                          <motion.div
                            key={book.id}
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: idx * 0.04 }}
                            className="group relative"
                          >
                            <ShelfCard
                              book={book}
                              variant="grid"
                              onStatusChange={updateStatus}
                              onDelete={removeBook}
                              onClick={() => setLogModalBookId(book.id)}
                            />
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setConfirmDeleteShelfBookId(book.id);
                              }}
                              className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X size={12} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                      {Pagination}
                    </>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </motion.div>
      </div>

      {/* ── 책별 로그 팝업 모달 ── */}
      <Dialog
        open={!!logModalBookId}
        onOpenChange={open => {
          if (!open) setLogModalBookId(null);
        }}
      >
        <DialogContent className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-2xl p-0 flex flex-col">
          {logModalBook && (
            <>
              <DialogHeader className="shrink-0 border-b border-border/40 px-5 pt-5 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setLogModalBookId(null);
                    navigate(`/book/${logModalBook.id}`);
                  }}
                  className="flex w-full items-start gap-3 text-left transition-opacity hover:opacity-75"
                >
                  <img
                    src={logModalBook.thumbnail || "/placeholder.png"}
                    alt={logModalBook.title}
                    className="h-20 w-14 shrink-0 rounded-lg object-cover shadow-md"
                  />
                  <div className="min-w-0 flex-1">
                    <StatusBadge
                      status={logModalBook.status}
                      className="mb-0.5"
                    />
                    <DialogTitle className="line-clamp-2 text-base font-bold leading-snug">
                      {logModalBook.title}
                    </DialogTitle>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {logModalBook.author}
                    </p>
                    {logModalBook.totalPage > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {logModalBook.status === "done"
                              ? logModalBook.totalPage
                              : logModalBook.currentPage || 0}
                            p / {logModalBook.totalPage}p
                          </span>
                          <span className="font-bold text-primary">
                            {bookProgress(logModalBook)}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${bookProgress(logModalBook)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto">
                {logModalLogs.length === 0 ? (
                  <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center">
                    <CalendarDays
                      size={28}
                      className="text-muted-foreground/30"
                    />
                    <p className="text-sm text-muted-foreground">
                      아직 이 책의 로그가 없어요
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setLogModalBookId(null);
                        openRecordForBook(logModalBook.id, {
                          syncLeftPanel: false,
                        });
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                    >
                      <PenLine size={12} />
                      기록하기
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <FileText
                          size={13}
                          className="text-muted-foreground/60"
                        />
                        <span className="text-xs text-muted-foreground">
                          총{" "}
                          <span className="font-semibold text-foreground">
                            {logModalLogs.filter(l => !l.isSnapshot).length}
                          </span>
                          개의 기록
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <LogSortToggle
                          value={bookLogSort}
                          onChange={setBookLogSort}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLogModalBookId(null);
                            openRecordForBook(logModalBook.id, {
                              syncLeftPanel: false,
                            });
                          }}
                          className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/70"
                        >
                          <PenLine size={11} />
                          기록 · 상태 변경
                        </button>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {sortedLogModalLogs.map((log, idx) => {
                        const pagesRead = Number(log.pagesRead || 0);
                        const statusStyle = getStatusStyle(log.status);
                        const isLatestLog = log.id === logModalLatestLogId;
                        const showStatusBadge = shouldShowStatusBadge(
                          sortedLogModalLogs,
                          idx
                        );
                        const eventText = getStatusEventText(log, null, {
                          isFirstLog: log.id === logModalFirstLogId,
                        });
                        return (
                          <div
                            key={log.id}
                            draggable={!log.isSnapshot}
                            onDragStart={event =>
                              handleLogDragStart(event, log)
                            }
                            onDragEnd={clearDragState}
                            onDragOver={event => handleLogDragOver(event, log)}
                            onDragLeave={() => setDragOverLogId(null)}
                            onDrop={event => handleLogDropOnLog(event, log)}
                            className={`flex gap-3 rounded-xl px-2 py-2 -mx-2 ${
                              isLatestLog
                                ? "bg-black/[0.04] ring-1 ring-black/10 dark:bg-white/[0.06] dark:ring-white/10"
                                : ""
                            } ${
                              dragOverLogId === log.id
                                ? "outline outline-2 outline-primary/35"
                                : ""
                            } ${
                              !log.isSnapshot
                                ? "cursor-grab active:cursor-grabbing"
                                : ""
                            }`}
                          >
                            <div className="flex flex-col items-center pt-1">
                              <div
                                className={`h-2 w-2 shrink-0 rounded-full ${statusStyle.dot}`}
                              />
                              {idx < sortedLogModalLogs.length - 1 && (
                                <div className="mt-1 w-px flex-1 bg-border/50" />
                              )}
                            </div>
                            <div className="mb-3 min-w-0 flex-1">
                              <div className="mb-1.5 flex items-center justify-between">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {!log.isSnapshot && (
                                    <GripVertical
                                      size={12}
                                      className="shrink-0 text-muted-foreground/35"
                                    />
                                  )}
                                  <span className="text-xs font-bold text-foreground">
                                    {formatDateKo(log.date)}
                                  </span>
                                  {showStatusBadge && (
                                    <StatusBadge status={log.status} />
                                  )}
                                  {isLatestLog && (
                                    <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[9px] font-semibold text-foreground/70">
                                      최신
                                    </span>
                                  )}
                                </div>
                                {!log.isSnapshot && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmDeleteLogId(
                                        confirmDeleteLogId === log.id
                                          ? null
                                          : log.id
                                      )
                                    }
                                    className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/30 transition-colors hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <X size={11} />
                                  </button>
                                )}
                              </div>
                              {confirmDeleteLogId === log.id && (
                                <div className="mb-2 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-2.5 py-1.5">
                                  <span className="flex-1 text-xs text-destructive">
                                    삭제하시겠어요?
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="rounded px-2 py-0.5 text-[11px] font-bold text-white bg-destructive hover:bg-destructive/90"
                                  >
                                    삭제
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteLogId(null)}
                                    className="rounded bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground hover:bg-secondary/70"
                                  >
                                    취소
                                  </button>
                                </div>
                              )}
                              {eventText && (
                                <p
                                  className={`mb-1.5 text-[11px] font-semibold ${getStatusEventClassName(log)}`}
                                >
                                  {eventText}
                                </p>
                              )}
                              {shouldShowLogPages(log) && (
                                <div className="mb-1.5 flex items-baseline gap-1.5">
                                  <span className="text-sm font-bold text-foreground">
                                    {pagesRead > 0
                                      ? `${pagesRead.toLocaleString()}p`
                                      : "—"}
                                  </span>
                                  {log.fromPage > 0 && log.toPage > 0 && (
                                    <span className="text-[11px] text-muted-foreground">
                                      ({log.fromPage}p → {log.toPage}p)
                                    </span>
                                  )}
                                </div>
                              )}
                              {log.memo && (
                                <div className="mt-2 rounded-lg border border-l-[3px] border-primary/25 bg-amber-50/60 px-2.5 py-1.5 dark:bg-amber-950/20">
                                  <p className="line-clamp-3 whitespace-pre-wrap text-xs italic leading-relaxed text-amber-900/75 dark:text-amber-100/60">
                                    {log.memo}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 서재 도서 삭제 확인 다이얼로그 ── */}
      <Dialog
        open={!!confirmDeleteShelfBookId}
        onOpenChange={open => {
          if (!open) setConfirmDeleteShelfBookId(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base">
              {bookMap.get(confirmDeleteShelfBookId)?.title
                ? `"${bookMap.get(confirmDeleteShelfBookId).title}"`
                : "이 책"}
              을(를) 삭제할까요?
            </DialogTitle>
          </DialogHeader>
          <p className="py-1 text-sm text-muted-foreground">
            서재에서 삭제하면 모든 독서 기록도 함께 사라져요.
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteShelfBookId(null)}
              className="flex-1 rounded-xl"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await removeBook(confirmDeleteShelfBookId);
                  toast.success("서재에서 삭제되었습니다.");
                } catch {
                  toast.error("삭제에 실패했습니다.");
                }
                setConfirmDeleteShelfBookId(null);
              }}
              className="flex-1 rounded-xl"
            >
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── 기록하기 팝업 모달 ── */}
      <Dialog
        open={recordModalOpen}
        onOpenChange={open => {
          if (!open) {
            setRecordModalOpen(false);
            setRecordBookId(null);
            setRecordSyncLeftPanel(true);
            setDatePickerOpen(false);
            setRemoveBookConfirm(false);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[90vh] w-full max-w-sm overflow-hidden rounded-2xl p-0 flex flex-col"
        >
          {recordBook && (
            <form
              onSubmit={handleRecordSubmit}
              className="flex flex-1 min-h-0 flex-col overflow-hidden"
            >
              <DialogHeader className="shrink-0 border-b border-border/40 px-4 pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={recordBook.thumbnail || "/placeholder.png"}
                    alt={recordBook.title}
                    className="h-16 w-11 shrink-0 rounded-lg object-cover shadow-md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <StatusBadge status={recordBook.status} />
                      {!removeBookConfirm && (
                        <button
                          type="button"
                          onClick={() => setRemoveBookConfirm(true)}
                          className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[10px] font-medium text-muted-foreground/45 transition-colors hover:text-destructive"
                        >
                          <Trash2 size={10} />
                          서재에서 제거하기
                        </button>
                      )}
                    </div>
                    <DialogTitle className="line-clamp-2 text-sm font-bold leading-snug">
                      {recordBook.title}
                    </DialogTitle>
                    <p className="line-clamp-1 text-[11px] text-muted-foreground">
                      {recordBook.author}
                    </p>
                    {removeBookConfirm && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-2 py-1.5">
                        <span className="min-w-0 flex-1 text-[11px] text-destructive">
                          서재에서 제거할까요?
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await removeBook(recordBook.id);
                              toast.success("서재에서 제거되었습니다.");
                            } catch {
                              toast.error("제거에 실패했습니다.");
                            }
                            setRemoveBookConfirm(false);
                            setRecordModalOpen(false);
                            setRecordBookId(null);
                            setRecordSyncLeftPanel(true);
                            if (focusedBookId === recordBook.id) {
                              setFocusedBookId(null);
                            }
                          }}
                          className="rounded bg-destructive px-2 py-0.5 text-[11px] font-bold text-white hover:bg-destructive/90"
                        >
                          제거
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemoveBookConfirm(false)}
                          className="rounded bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground hover:bg-secondary/70"
                        >
                          취소
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {/* 독서 상태 */}
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {READING_STATUS_OPTS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleRecordStatusChange(opt.value)}
                        className={`rounded-xl px-2 py-2.5 text-xs font-bold transition-colors ${
                          recordStatus === opt.value ? opt.active : opt.inactive
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 기록 날짜 — 테마 캘린더 */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">
                    기록 날짜
                  </span>
                  <Popover
                    open={datePickerOpen}
                    onOpenChange={setDatePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex h-10 w-full items-center gap-2 rounded-xl bg-secondary/40 px-3 text-left text-sm transition-colors hover:bg-secondary/60"
                      >
                        <CalendarDays
                          size={14}
                          className="shrink-0 text-muted-foreground"
                        />
                        <span
                          className={
                            recordDate
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {recordDate ? formatDateKo(recordDate) : "날짜 선택"}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        locale={ko}
                        selected={
                          recordDate
                            ? new Date(recordDate + "T00:00:00")
                            : undefined
                        }
                        onSelect={date => {
                          if (date) {
                            const local = new Date(
                              date.getTime() - date.getTimezoneOffset() * 60000
                            );
                            setRecordDate(local.toISOString().slice(0, 10));
                            setDatePickerOpen(false);
                          }
                        }}
                        disabled={date => date > new Date()}
                        endMonth={new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 페이지 범위 */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">
                        시작 페이지
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={recordFromStr}
                        disabled={recordStatus === "want"}
                        onChange={e => {
                          const raw = e.target.value;
                          setRecordFromStr(raw);
                          const n = parseInt(raw, 10);
                          if (raw !== "" && Number.isFinite(n) && n >= 0) {
                            const clamped = Math.min(
                              n,
                              recordBook.totalPage || 99999
                            );
                            setRecordFromPage(clamped);
                            if (recordToPage < clamped) {
                              setRecordToPage(clamped);
                              setRecordToStr(String(clamped));
                            }
                          }
                        }}
                        onBlur={() => {
                          const n = parseInt(recordFromStr, 10);
                          const max = recordBook.totalPage || 99999;
                          const clamped =
                            Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0;
                          setRecordFromPage(clamped);
                          setRecordFromStr(String(clamped));
                          if (recordToPage < clamped) {
                            setRecordToPage(clamped);
                            setRecordToStr(String(clamped));
                          }
                        }}
                        className="h-10 rounded-xl bg-secondary/40"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">
                        끝 페이지
                      </span>
                      <Input
                        type="number"
                        min={0}
                        max={recordBook.totalPage || undefined}
                        value={recordToStr}
                        disabled={recordStatus === "want"}
                        onChange={e => setRecordToStr(e.target.value)}
                        onBlur={() => {
                          const n = parseInt(recordToStr, 10);
                          const max = recordBook.totalPage || 99999;
                          const clamped =
                            Number.isFinite(n) && n >= 0
                              ? Math.max(recordFromPage, Math.min(n, max))
                              : recordFromPage;
                          setRecordToPage(clamped);
                          setRecordToStr(String(clamped));
                        }}
                        className="h-10 rounded-xl bg-secondary/40"
                      />
                    </label>
                  </div>

                  {recordStatus !== "want" && recordBook.totalPage > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>
                          시작{" "}
                          <span className="font-semibold text-foreground">
                            {recordFromPage}p
                          </span>
                        </span>
                        <span>
                          끝{" "}
                          <span className="font-semibold text-primary">
                            {recordToPage}p
                          </span>{" "}
                          / {recordBook.totalPage}p
                        </span>
                      </div>
                      <div className="relative py-1">
                        <Slider
                          value={[recordFromPage, recordToPage]}
                          min={0}
                          max={recordBook.totalPage}
                          step={1}
                          onValueChange={([from, to]) => {
                            setRecordFromPage(from);
                            setRecordFromStr(String(from));
                            setRecordToPage(to);
                            setRecordToStr(String(to));
                          }}
                          disabled={recordStatus === "want"}
                        />
                        {prevToMarker > 0 && (
                          <div
                            className="pointer-events-none absolute top-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/55"
                            style={getSliderThumbAlignedStyle(
                              prevToMarker,
                              recordBook.totalPage
                            )}
                          />
                        )}
                      </div>
                      {prevToMarker > 0 && (
                        <div className="relative h-4">
                          <span
                            className="absolute -translate-x-1/2 whitespace-nowrap rounded-sm bg-primary/8 px-1 py-px text-[9px] font-medium text-primary/70"
                            style={getSliderThumbAlignedStyle(
                              prevToMarker,
                              recordBook.totalPage
                            )}
                          >
                            {prevToMarker}p
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {recordStatus !== "want" && (
                    <div className="rounded-xl bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                      오늘 기록될 페이지:{" "}
                      <span className="font-bold text-primary">
                        {Math.max(
                          0,
                          recordToPage - recordFromPage
                        ).toLocaleString()}
                        p
                      </span>
                    </div>
                  )}
                </div>

                {recordStatus === "done" && (
                  <div className="space-y-1.5 rounded-xl bg-secondary/40 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-muted-foreground">
                        완독 별점
                      </span>
                      <span className="text-[11px] font-semibold text-amber-600">
                        {recordRating > 0 ? `${recordRating}/5` : "미선택"}
                      </span>
                    </div>
                    <RatingPicker
                      value={recordRating}
                      onChange={setRecordRating}
                      disabled={recordSaving}
                    />
                  </div>
                )}

                {/* 메모 */}
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">
                    메모
                  </span>
                  <Textarea
                    value={recordMemo}
                    onChange={e => setRecordMemo(e.target.value)}
                    placeholder={
                      recordStatus === "want"
                        ? "이 책에 대한 기대나 메모를 적어보세요."
                        : "오늘 읽으며 남기고 싶은 생각을 적어보세요."
                    }
                    className="h-24 resize-none overflow-y-auto rounded-xl border-none bg-secondary/40 p-3 text-sm"
                  />
                </label>
              </div>

              <div className="flex shrink-0 gap-2 border-t border-border/40 p-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRecordModalOpen(false);
                    setRecordBookId(null);
                    setRecordSyncLeftPanel(true);
                    setDatePickerOpen(false);
                  }}
                  className="h-10 flex-1 rounded-xl"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={recordSaving}
                  className="h-10 flex-1 rounded-xl font-bold"
                >
                  {recordSaving ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      저장 중
                    </>
                  ) : (
                    "저장하기"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
