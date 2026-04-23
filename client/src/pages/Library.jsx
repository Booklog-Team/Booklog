import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { READING_CALENDAR } from "@/lib/mockData";
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

function getLevelColor(level) {
  switch (level) {
    case 1: return "bg-orange-400/20";
    case 2: return "bg-orange-400/40";
    case 3: return "bg-orange-400/60";
    case 4: return "bg-orange-400/80";
    default: return "";
  }
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function calculateStreak(shelf) {
  const all = new Set();
  shelf.forEach(b => (b.checkedDates || []).forEach(d => all.add(d)));
  if (!all.size) return 0;

  const sorted = [...all].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000)
    .toISOString()
    .slice(0, 10);

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

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

function ReadingBookPopup({ book, onClose, onStatusChange, onDelete }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(book.status ?? null);
  const [saving, setSaving] = useState(false);

  const progress =
    book.status === "done"
      ? 100
      : book.totalPage && book.currentPage
        ? Math.round((book.currentPage / book.totalPage) * 100)
        : 0;

  const handleSave = async () => {
    if (selected === book.status) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      if (!selected) {
        await onDelete(book.id);
      } else {
        await onStatusChange(book.id, selected);
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
                    {book.status === "done" ? book.totalPage : book.currentPage}p / {book.totalPage}p
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

  const featured = useMemo(() => {
    if (mainBook) return mainBook;
    return (
      [...books].sort((a, b) => {
        const aDate = a.lastReadDate ? new Date(a.lastReadDate).getTime() : 0;
        const bDate = b.lastReadDate ? new Date(b.lastReadDate).getTime() : 0;
        return bDate - aDate;
      })[0] || null
    );
  }, [books, mainBook]);

  const filteredBooks = useMemo(() => {
    if (activeTab === "all") return books;
    return books.filter(book => book.status === activeTab);
  }, [books, activeTab]);

  const readingDates = useMemo(() => {
    const set = new Set();
    books.forEach(book => {
      (book.checkedDates || []).forEach(date => set.add(date));
    });
    return set;
  }, [books]);

  const streak = useMemo(() => calculateStreak(books), [books]);

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const monthName = `${calYear}년 ${calMonth + 1}월`;
  const todayStr = new Date().toISOString().slice(0, 10);

  const monthReadCount = useMemo(() => {
    const prefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    return [...readingDates].filter(date => date.startsWith(prefix)).length;
  }, [readingDates, calYear, calMonth]);

  const monthCalendarData = useMemo(() => {
    const prefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    return Object.fromEntries(
      Object.entries(READING_CALENDAR).filter(([date]) => date.startsWith(prefix))
    );
  }, [calYear, calMonth]);

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

  const featuredProgress =
    featured?.status === "done"
      ? 100
      : featured?.totalPage && featured?.currentPage
        ? Math.round((featured.currentPage / featured.totalPage) * 100)
        : 0;

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 flex items-start justify-between gap-4">
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
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            서재를 불러오는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_0.95fr]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                대표 도서
              </h2>
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <Flame size={14} className="text-amber-500" />
                {streak}일 연속 독서
              </div>
            </div>

            {loading ? (
              <div className="book-card flex min-h-[240px] items-center gap-4 p-6">
                <Skeleton className="h-40 w-28 rounded-xl" />
                <Skeleton className="flex-1 rounded-lg" />
              </div>
            ) : featured ? (
              <div
                className="book-card cursor-pointer p-5 transition-shadow hover:shadow-md"
                onClick={() => setPopupBook(featured)}
              >
                <div className="flex gap-4">
                  <img
                    src={featured.thumbnail || "/placeholder.png"}
                    alt={featured.title}
                    className="h-40 w-28 rounded-xl object-cover shadow-md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                          {featured.status === "reading"
                            ? "읽는 중"
                            : featured.status === "done"
                              ? "완독"
                              : "읽고 싶음"}
                        </p>
                        <h3 className="line-clamp-2 text-xl font-bold leading-snug">
                          {featured.title}
                        </h3>
                      </div>
                    </div>
                    <p className="mb-3 text-xs text-muted-foreground">
                      {featured.author}
                    </p>
                    {featured.totalPage > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {featured.status === "done" ? featured.totalPage : (featured.currentPage || 0)}p / {featured.totalPage}p
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
                  </div>
                </div>
              </div>
            ) : (
              <div className="book-card flex flex-col items-center justify-center gap-3 p-8 text-center">
                <BookOpen size={32} className="text-muted-foreground/30" />
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
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              독서 캘린더
            </h2>
            <div className="book-card p-4">
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
                  const levelColor = getLevelColor(level);
                  const isToday = dateKey === todayStr;

                  return (
                    <div
                      key={dateKey}
                      className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition-all ${
                        level > 0
                          ? `${levelColor} font-semibold ${level >= 3 ? "text-white" : "text-orange-600"}`
                          : isToday
                            ? "bg-secondary font-semibold text-foreground ring-1 ring-primary/30"
                            : "text-muted-foreground"
                      }`}
                    >
                      <span>{cell.day}</span>
                      {level > 0 && (
                        <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-orange-400/60" />
                      )}
                      {isToday && level === 0 && (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground mr-0.5">적음</span>
                  {[1, 2, 3, 4].map(l => (
                    <div key={l} className={`h-3 w-3 rounded ${getLevelColor(l)}`} />
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-0.5">많음</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame size={12} className="text-amber-500" />
                  <span className="text-[11px] text-muted-foreground">
                    이번 달 {monthReadCount}일
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
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
                    <div className="grid grid-cols-2 gap-3 stagger-children">
                      {tabBooks.map(book => (
                        <ShelfCard
                          key={book.id}
                          book={book}
                          variant="compact"
                          onStatusChange={updateStatus}
                          onDelete={removeBook}
                          onClick={() => setPopupBook(book)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 stagger-children">
                      {tabBooks.map(book => (
                        <ShelfCard
                          key={book.id}
                          book={book}
                          variant="grid"
                          onStatusChange={updateStatus}
                          onDelete={removeBook}
                          onClick={() => setPopupBook(book)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
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
