// Booklog Library — 「따뜻한 라이브러리」
// 서재: featured book, status tabs, reading calendar, streak visualization
// FR-24~40: 대표 도서, 상태별 목록, 캘린더, streak
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Flame,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ShelfCard from "@/components/ShelfCard";
import { useShelf } from "@/contexts/ShelfContext";
import { useAuth } from "@/contexts/AuthContext";
import { READING_CALENDAR } from "@/lib/mockData";
const STATUS_TABS = [
  { value: "all", label: "전체" },
  { value: "reading", label: "읽는 중" },
  { value: "want", label: "읽고 싶음" },
  { value: "done", label: "완독" },
];

// Calendar helpers
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// 읽은 책 수(count) → 색상 레벨 0~4
function getColorLevel(count) {
  if (!count || count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

// 색상 레벨 → Tailwind 클래스 (Warm Library 테마: 아이보리 → 테라코타)
function getLevelColor(level) {
  switch (level) {
    case 1: return "bg-orange-400/20 text-orange-800";
    case 2: return "bg-orange-400/40 text-orange-800";
    case 3: return "bg-orange-400/60 text-orange-900";
    case 4: return "bg-orange-400/80 text-orange-900";
    default: return "bg-muted/30 text-muted-foreground";
  }
}

function calculateStreak(checkedDates) {
  if (!checkedDates || checkedDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedDates = checkedDates.map(d => new Date(d)).sort((a, b) => b - a);

  let streak = 0;
  let currentDate = new Date(today);

  for (const date of sortedDates) {
    const diff = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));

    if (diff === 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (diff === 1) {
      streak++;
      currentDate = new Date(date);
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
export default function Library() {
  const navigate = useNavigate();
  const {
    books,
    mainBook,
    loading,
    error,
    removeBook,
    updateStatus,
    getDailyReadingStats,
  } = useShelf();
  const { profile } = useAuth();

  const [viewMode, setViewMode] = useState("list");
  const [activeTab, setActiveTab] = useState("all");
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [monthCalendarData, setMonthCalendarData] = useState({});

  // Filter books by status
  const filteredBooks = useMemo(() => {
    if (activeTab === "all") return books;
    return books.filter(b => b.status === activeTab);
  }, [books, activeTab]);

  // 읽는 중 책 — 최근 업데이트(lastReadDate) 순 정렬
  const readingBooks = useMemo(() => {
    return books
      .filter(b => b.status === "reading")
      .sort((a, b) => (b.lastReadDate || "").localeCompare(a.lastReadDate || ""));
  }, [books]);

  // 연속 독서일 — 가장 최근 읽은 책 기준
  const streak = useMemo(() => {
    if (readingBooks.length === 0) return 0;
    return calculateStreak(readingBooks[0].checkedDates || []);
  }, [readingBooks]);

  // 월별 독서 통계 로드
  useEffect(() => {
    // 임시: READING_CALENDAR에서 해당 월 데이터 추출 (count 기반)
    const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    const stats = {};
    Object.entries(READING_CALENDAR).forEach(([date, count]) => {
      if (date.startsWith(monthStr) && count > 0) {
        stats[date] = { pagesRead: count, count };
      }
    });
    setMonthCalendarData(stats);
  }, [calYear, calMonth]);

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const monthName = new Date(calYear, calMonth, 1).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });


  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(y => y - 1);
    } else {
      setCalMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(y => y + 1);
    } else {
      setCalMonth(m => m + 1);
    }
  };

  if (error) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-destructive">
          오류가 발생했습니다: {error.message}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => window.location.reload()}
        >
          새로고침
        </Button>
      </div>
    );
  }
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-8 pb-4">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Noto Serif KR', serif" }}
        >
          나의 서재
        </h1>
        <button
          onClick={() => navigate("/search")}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} />책 추가
        </button>
      </div>

      <div className="px-4 stagger-children">
        {/* Streak Banner */}
        {readingBooks.length > 0 && (
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 mb-6">
            <span className="text-3xl animate-streak">🔥</span>
            <div>
              <p className="text-sm font-bold text-amber-800">
                {streak}일 연속 독서 중!
              </p>
              <p className="text-xs text-amber-600">
                오늘도 독서하면 streak를 유지할 수 있어요
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-amber-600">{streak}</p>
              <p className="text-xs text-amber-500">days</p>
            </div>
          </div>
        )}

        {/* Two-column layout: Featured Book + Calendar */}
        <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
          {/* Featured Book */}
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              지금 읽고 있어요
            </h2>
            {loading ? (
              <Skeleton className="flex-1 rounded-lg" />
            ) : readingBooks.length > 0 ? (
              <div className="book-card flex flex-col flex-1 overflow-hidden">
                {/* 읽는 중 책 목록 — 스크롤 가능 */}
                <div className="overflow-y-auto flex-1 scrollbar-hide divide-y divide-border/40">
                  {readingBooks.map(book => {
                    const progress =
                      book.totalPage && book.currentPage
                        ? Math.round((book.currentPage / book.totalPage) * 100)
                        : 0;
                    return (
                      <div
                        key={book.id}
                        className="flex gap-4 p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                        onClick={() => navigate(`/book/${book.id}`)}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={book.thumbnail || "/placeholder.png"}
                            alt={book.title}
                            className="w-20 h-28 object-cover rounded-lg shadow-md"
                          />
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/10 rounded-l-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="tag-pill status-reading text-[11px] mb-2 inline-block">
                            읽는 중
                          </span>
                          <h3
                            className="font-bold text-base leading-snug mb-0.5 line-clamp-2"
                            style={{ fontFamily: "'Noto Serif KR', serif" }}
                          >
                            {book.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                            {book.author}
                          </p>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                {book.currentPage}p / {book.totalPage}p
                              </span>
                              <span className="font-bold text-primary">
                                {progress}%
                              </span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          {book.memo && (
                            <p className="text-xs text-muted-foreground mt-2 italic line-clamp-1">
                              "{book.memo}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* 다른 책 추가 — 카드 하단 고정 */}
                <button
                  onClick={() => navigate("/search")}
                  className="flex-shrink-0 border-t border-border/40 w-full py-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                >
                  <Plus size={13} />다른 책 추가하기
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center book-card p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  지금 읽고 있는 책이 없어요
                </p>
                <Button
                  size="sm"
                  onClick={() => navigate("/search")}
                  className="gap-1.5"
                >
                  <Plus size={14} />첫 책 추가하기
                </Button>
              </div>
            )}
          </div>

          {/* Reading Calendar */}
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              독서 캘린더
            </h2>
            <div className="book-card p-4 flex-1">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrevMonth}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold">{monthName}</span>
                <button
                  onClick={handleNextMonth}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {["일", "월", "화", "수", "목", "금", "토"].map(d => (
                  <div
                    key={d}
                    className="text-center text-[11px] text-muted-foreground font-medium py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid - Fixed to 6 weeks (42 cells), square cells */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 42 }).map((_, i) => {
                  // Calculate which day/week/etc this cell represents
                  const cellIndex = i;
                  let day = cellIndex - firstDay + 1;
                  let displayMonth = calMonth;
                  let displayYear = calYear;
                  let isCurrentMonth = day > 0 && day <= daysInMonth;

                  // Handle previous month
                  if (day <= 0) {
                    const prevMonthDays = new Date(
                      calYear,
                      calMonth,
                      0
                    ).getDate();
                    day = prevMonthDays + day;
                    displayMonth = calMonth - 1;
                    if (displayMonth < 0) {
                      displayMonth = 11;
                      displayYear = calYear - 1;
                    }
                    isCurrentMonth = false;
                  }
                  // Handle next month
                  else if (day > daysInMonth) {
                    day = day - daysInMonth;
                    displayMonth = calMonth + 1;
                    if (displayMonth > 11) {
                      displayMonth = 0;
                      displayYear = calYear + 1;
                    }
                    isCurrentMonth = false;
                  }

                  const dateKey = isCurrentMonth
                    ? `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                    : null;

                  const hasReading =
                    isCurrentMonth && !!monthCalendarData[dateKey];
                  const today = new Date();
                  const isTodayCell =
                    isCurrentMonth &&
                    day === today.getDate() &&
                    calMonth === today.getMonth() &&
                    calYear === today.getFullYear();

                  // 히트맵 색상 레벨 계산
                  const dailyStats = monthCalendarData[dateKey];
                  const colorLevel = dailyStats
                    ? getColorLevel(dailyStats.pagesRead)
                    : 0;
                  const levelColor = getLevelColor(colorLevel);

                  return (
                    <div
                      key={`cell-${i}`}
                      className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all ${
                        isCurrentMonth ? levelColor : "text-muted-foreground/40"
                      }`}
                    >
                      <span>{day}</span>
                      {isTodayCell && colorLevel === 0 && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-3 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    독서량
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    이번 달 {Object.keys(monthCalendarData).length}일 독서
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground mr-1">
                    적음
                  </span>
                  {[0, 1, 2, 3, 4].map(level => (
                    <div
                      key={level}
                      className={`w-3 h-3 rounded-sm ${getLevelColor(level)}`}
                    />
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-1">
                    많음
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Book List by Status */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              책 목록
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={v => setActiveTab(v)}>
            <TabsList className="w-full bg-secondary rounded-xl p-1 h-auto mb-4">
              {STATUS_TABS.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 text-xs py-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
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

            {STATUS_TABS.map(tab => (
              <TabsContent key={tab.value} value={tab.value} className="mt-0">
                {loading ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-32 rounded-lg" />
                    ))}
                  </div>
                ) : filteredBooks.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-sm text-muted-foreground">
                      {tab.value === "all"
                        ? "아직 책이 없어요"
                        : `${tab.label} 책이 없어요`}
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
                  <div className="grid grid-cols-1 gap-3 stagger-children">
                    {filteredBooks.map(book => (
                      <ShelfCard
                        key={book.id}
                        book={book}
                        variant="list"
                        onStatusChange={updateStatus}
                        onDelete={removeBook}
                        onClick={() => navigate(`/book/${book.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 stagger-children">
                    {filteredBooks.map(book => (
                      <ShelfCard
                        key={book.id}
                        book={book}
                        variant="grid"
                        onStatusChange={updateStatus}
                        onDelete={removeBook}
                        onClick={() => navigate(`/book/${book.id}`)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </>
  );
}
