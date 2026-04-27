import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { MOCK_BOOKS, READING_CALENDAR } from "@/lib/mockData";
import {
  Plus,
  Flame,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  BookOpen,
  PenLine,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useShelf } from "@/contexts/ShelfContext";
import ShelfCard from "@/components/ShelfCard";

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
    active: "bg-primary text-primary-foreground border border-primary",
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

const STATUS_TABS = [
  { value: "all", label: "전체" },
  { value: "reading", label: "읽는 중" },
  { value: "want", label: "읽고 싶음" },
  { value: "done", label: "완독" },
];

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

function ReadingBookPopup({ book, onClose, onStatusChange, onDelete }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(book.status ?? null);
  const [saving, setSaving] = useState(false);

  const progress = bookProgress(book);

  const fireCompletionConfetti = () => {
    const colors = [
      "#ff6b9d",
      "#c084fc",
      "#60a5fa",
      "#34d399",
      "#fbbf24",
      "#f97316",
    ];
    const burst = (origin, angle) =>
      confetti({
        particleCount: 60,
        angle,
        spread: 70,
        origin,
        colors,
        scalar: 1.1,
      });

    burst({ x: 0.5, y: 0.6 }, 90);
    setTimeout(() => {
      burst({ x: 0.2, y: 0.7 }, 60);
      burst({ x: 0.8, y: 0.7 }, 120);
    }, 250);
    setTimeout(() => {
      burst({ x: 0.35, y: 0.55 }, 75);
      burst({ x: 0.65, y: 0.55 }, 105);
    }, 550);
    setTimeout(() => {
      burst({ x: 0.5, y: 0.5 }, 90);
    }, 850);
  };

  const handleSave = async () => {
    if (selected === book.status) {
      onClose();
      return;
    }
    const isFirstCompletion = selected === "done" && book.status !== "done";
    setSaving(true);
    try {
      if (!selected) {
        await onDelete(book.id);
      } else {
        await onStatusChange(book.id, selected);
      }
      if (isFirstCompletion) {
        fireCompletionConfetti();
        toast.success("🎉 완독을 축하드려요!");
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-background shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            독서 상태
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-4 px-5 pb-4">
          <img
            src={book.thumbnail || "/placeholder.png"}
            alt={book.title}
            className="h-24 w-16 flex-shrink-0 rounded-lg object-cover shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
          />
          <div className="min-w-0 flex-1 py-1">
            <h4 className="mb-0.5 line-clamp-2 text-sm font-bold leading-snug">
              {book.title}
            </h4>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {book.author}
            </p>
            {book.totalPage > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {book.status === "done" ? book.totalPage : book.currentPage}
                    p / {book.totalPage}p
                  </span>
                  <span className="font-bold text-primary">{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/40" />

        <div className="space-y-3 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            독서 상태 변경
          </p>
          <div className="grid grid-cols-3 gap-2">
            {READING_STATUS_OPTS.map(opt => (
              <button
                key={opt.value}
                onClick={() =>
                  setSelected(prev => (prev === opt.value ? null : opt.value))
                }
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold transition-all ${
                  selected === opt.value ? opt.active : opt.inactive
                }`}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
          {selected && (
            <button
              onClick={() => setSelected(null)}
              className="w-full py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
            >
              ✕ 선택 취소
            </button>
          )}
        </div>

        <div className="flex gap-3 px-5 pb-6">
          <button
            onClick={() => {
              navigate(`/book/${book.id}`);
              onClose();
            }}
            className="h-12 w-28 flex-shrink-0 rounded-xl border border-border text-xs font-bold text-muted-foreground transition-all hover:bg-secondary"
          >
            상세 보기 →
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selected === book.status}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Library() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { books, mainBook, loading, error, removeBook, updateStatus } =
    useShelf();

  const today = new Date();
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [popupBook, setPopupBook] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const calendarBooks = books;

  // 가장 최근 기록된 도서 — 실제 데이터 (mainBook 우선, 없으면 reading 중 최신)
  const featured = useMemo(() => {
    if (mainBook) return mainBook;
    const readingList = books.filter(b => b.status === "reading");
    if (readingList.length === 0) return null;
    return readingList.reduce((latest, current) => {
      if (!latest.lastReadDate) return current;
      if (!current.lastReadDate) return latest;
      return new Date(current.lastReadDate) > new Date(latest.lastReadDate)
        ? current
        : latest;
    });
  }, [books, mainBook]);

  // 읽는 중 목록 — 실제 데이터, 대표 도서 제외
  const readingBooks = useMemo(
    () => books.filter(b => b.status === "reading" && b.id !== featured?.id),
    [books, featured]
  );

  const streak = useMemo(() => calculateStreak(calendarBooks), [calendarBooks]);

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const monthName = `${calYear}년 ${calMonth + 1}월`;
  const todayStr = new Date().toISOString().slice(0, 10);

  const monthCalendarData = useMemo(() => {
    const prefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    const countByDate = {};
    calendarBooks.forEach(book => {
      (book.checkedDates || []).forEach(d => {
        if (d.startsWith(prefix)) {
          countByDate[d] = (countByDate[d] || 0) + 1;
        }
      });
    });
    return countByDate;
  }, [calYear, calMonth, calendarBooks]);

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
  }, [calYear, calMonth, calendarBooks]);

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

  const booksOnDate = useMemo(() => {
    if (!selectedDate) return [];
    return calendarBooks.filter(b =>
      (b.checkedDates || []).includes(selectedDate)
    );
  }, [selectedDate, calendarBooks]);

  const featuredProgress = bookProgress(featured);

  // 왼쪽 열 레이블: 날짜 선택 시 해당 날짜로 교체
  const leftLabel = selectedDate
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
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <ArrowLeft size={13} />
                </button>
              )}
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {leftLabel}
              </h2>
            </div>

            {/* 단일 카드 — 날짜 선택 여부에 따라 내용 전환 */}
            <div className="book-card flex flex-1 min-h-0 flex-col overflow-hidden">
              {selectedDate ? (
                /* ── 날짜별 기록 패널 ── */
                booksOnDate.length === 0 ? (
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
                    <p className="mb-3 text-xs text-muted-foreground">
                      {booksOnDate.length}권의 책을 읽었어요
                    </p>
                    <div className="space-y-2.5">
                      {booksOnDate.map(book => {
                        const prog = bookProgress(book);
                        return (
                          <div
                            key={book.id}
                            className="flex cursor-pointer gap-3 rounded-xl border border-border/60 p-3 transition-colors hover:bg-secondary/50"
                            onClick={() => setPopupBook(book)}
                          >
                            <img
                              src={book.thumbnail || "/placeholder.png"}
                              alt={book.title}
                              className="h-16 w-11 shrink-0 rounded-lg object-cover shadow-sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                {book.status === "reading"
                                  ? "읽는 중"
                                  : book.status === "done"
                                    ? "완독"
                                    : "읽고 싶음"}
                              </p>
                              <h4 className="line-clamp-1 text-sm font-bold">
                                {book.title}
                              </h4>
                              <p className="mb-1.5 text-[11px] text-muted-foreground">
                                {book.author}
                              </p>
                              {book.totalPage > 0 && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-muted-foreground">
                                      {book.status === "done"
                                        ? book.totalPage
                                        : book.currentPage || 0}
                                      p / {book.totalPage}p
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
                              {book.memo && (
                                <p className="mt-1 line-clamp-1 text-[10px] italic text-muted-foreground">
                                  "{book.memo}"
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              ) : (
                /* ── 일반 뷰: 최근 읽은 도서 + 읽는 중 ── */
                <>
                  {/* 최근 읽은 도서 */}
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
                      onClick={() => setPopupBook(featured)}
                    >
                      {/* items-center → 이미지 세로 가운데 정렬 */}
                      <div className="flex items-center gap-4">
                        <img
                          src={featured.thumbnail || "/placeholder.png"}
                          alt={featured.title}
                          className="shrink-0 rounded-xl object-cover shadow-md"
                          style={{ width: 88, height: 128 }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            {featured.status === "reading"
                              ? "읽는 중"
                              : featured.status === "done"
                                ? "완독"
                                : "읽고 싶음"}
                          </p>
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

                          {featured.memo && (
                            <p className="mt-2 line-clamp-1 text-xs italic text-muted-foreground">
                              "{featured.memo}"
                            </p>
                          )}

                          <button
                            className="mt-3 flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                            onClick={e => {
                              e.stopPropagation();
                              navigate(`/book/${featured.id}`);
                            }}
                          >
                            <PenLine size={12} />
                            기록하러 가기
                          </button>
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

                  {/* 구분선 */}
                  <div className="shrink-0 border-t border-border/40" />

                  {/* 읽는 중 섹션 — flex-1 로 남은 높이를 모두 채움 */}
                  <div className="flex flex-1 min-h-0 flex-col">
                    {/* 읽는 중 레이블 */}
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

                    {/* 책 목록 — flex-1 으로 빈 공간까지 채우고, 넘치면 스크롤 */}
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
                                onClick={() => setPopupBook(book)}
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

                    {/* 책 추가 버튼 — 스크롤 영향 없이 항상 하단 고정 */}
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
              <div className="grid grid-cols-7 gap-y-1">
                {calendarCells.map((cell, idx) => {
                  if (cell.type !== "current") {
                    return (
                      <div
                        key={`${cell.type}-${idx}`}
                        className="relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs text-muted-foreground/30"
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
                      onClick={() =>
                        setSelectedDate(isSelected ? null : dateKey)
                      }
                      className={`relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg text-xs transition-all duration-200 ${
                        isSelected
                          ? "font-bold ring-2 ring-primary ring-offset-1"
                          : level > 0
                            ? "font-semibold hover:opacity-80"
                            : isToday
                              ? "bg-secondary font-semibold text-foreground ring-1 ring-primary/30"
                              : "text-muted-foreground hover:bg-secondary/60"
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: "var(--primary)",
                              color: "var(--primary-foreground)",
                            }
                          : level > 0
                            ? heatStyle
                            : undefined
                      }
                    >
                      <span>{cell.day}</span>
                      {level > 0 && !isSelected && (
                        <span
                          className="absolute bottom-0.5 h-1 w-1 rounded-full"
                          style={{
                            backgroundColor: `var(--heatmap-${Math.min(level + 1, 4)})`,
                          }}
                        />
                      )}
                      {isToday && level === 0 && !isSelected && (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                      )}
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
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      독서한 날
                    </span>
                    <span
                      className="text-xl font-bold leading-none"
                      style={{ color: "var(--stat-color-1)" }}
                    >
                      {monthStats.readingDays}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      일
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      총 페이지
                    </span>
                    <span
                      className="text-xl font-bold leading-none"
                      style={{ color: "var(--stat-color-2)" }}
                    >
                      {monthStats.totalPages.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">p</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      일 평균
                    </span>
                    <span
                      className="text-xl font-bold leading-none"
                      style={{ color: "var(--stat-color-1)" }}
                    >
                      {monthStats.avgPages}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      p/일
                    </span>
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
                  className="flex-1 rounded-lg py-2 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm"
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
                  ? books
                  : books.filter(b => b.status === tab.value);
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
                    <div className="grid grid-cols-2 gap-3">
                      {tabBooks.map((book, idx) => (
                        <motion.div
                          key={book.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                        >
                          <ShelfCard
                            book={book}
                            variant="compact"
                            onStatusChange={updateStatus}
                            onDelete={removeBook}
                            onClick={() => setPopupBook(book)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                      {tabBooks.map((book, idx) => (
                        <motion.div
                          key={book.id}
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: idx * 0.04 }}
                        >
                          <ShelfCard
                            book={book}
                            variant="grid"
                            onStatusChange={updateStatus}
                            onDelete={removeBook}
                            onClick={() => setPopupBook(book)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </motion.div>
      </div>

      {popupBook && (
        <ReadingBookPopup
          book={popupBook}
          onClose={() => setPopupBook(null)}
          onStatusChange={updateStatus}
          onDelete={removeBook}
        />
      )}
    </>
  );
}
