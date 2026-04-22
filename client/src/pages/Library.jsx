// Booklog Library — 「따뜻한 라이브러리」
// 서재: featured book, status tabs, reading calendar, streak visualization
// FR-24~40: 대표 도서, 상태별 목록, 캘린더, streak
import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, Flame, LayoutGrid, List, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import PageLayout from "@/components/PageLayout";
import BookCard from "@/components/BookCard";
import { MOCK_BOOKS, MOCK_USER, READING_CALENDAR } from "@/lib/mockData";
const STATUS_TABS = [
    { value: "all", label: "전체" },
    { value: "reading", label: "읽는 중" },
    { value: "want", label: "읽고 싶음" },
    { value: "done", label: "완독" },
];
// Featured book: reading > most recent
const featuredBook = MOCK_BOOKS.find(b => b.status === "reading") ?? MOCK_BOOKS[0];
// Calendar helpers
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}
export default function Library() {
    const [, navigate] = useLocation();
    const [viewMode, setViewMode] = useState("list");
    const [activeTab, setActiveTab] = useState("all");
    const [calYear, setCalYear] = useState(2024);
    const [calMonth, setCalMonth] = useState(3); // April (0-indexed)
    const filteredBooks = activeTab === "all"
        ? MOCK_BOOKS
        : MOCK_BOOKS.filter(b => b.status === activeTab);
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDayOfMonth(calYear, calMonth);
    const monthName = new Date(calYear, calMonth, 1).toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
    const featuredProgress = featuredBook.totalPages && featuredBook.currentPage
        ? Math.round((featuredBook.currentPage / featuredBook.totalPages) * 100)
        : 0;
    return (<PageLayout>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif" }}>나의 서재</h1>
        <button onClick={() => navigate("/search")} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus size={15}/>
          책 추가
        </button>
      </div>

      <div className="px-4 stagger-children">
        {/* Streak Banner */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 mb-6">
          <span className="text-3xl animate-streak">🔥</span>
          <div>
            <p className="text-sm font-bold text-amber-800">
              {MOCK_USER.streak}일 연속 독서 중!
            </p>
            <p className="text-xs text-amber-600">오늘도 독서하면 streak를 유지할 수 있어요</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold text-amber-600">{MOCK_USER.streak}</p>
            <p className="text-xs text-amber-500">days</p>
          </div>
        </div>

        {/* Two-column layout: Featured Book + Calendar */}
        <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
          {/* Featured Book */}
          <div>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">지금 읽고 있어요</h2>
            <div className="book-card p-4 cursor-pointer h-full" onClick={() => navigate(`/book/${featuredBook.id}`)}>
              <div className="flex gap-4">
                <div className="relative">
                  <img src={featuredBook.cover} alt={featuredBook.title} className="w-20 h-28 object-cover rounded-lg shadow-md"/>
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/10 rounded-l-lg"/>
                </div>
                <div className="flex-1">
                  <span className="tag-pill status-reading text-[11px] mb-2 inline-block">읽는 중</span>
                  <h3 className="font-bold text-base leading-snug mb-0.5" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                    {featuredBook.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">{featuredBook.author}</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{featuredBook.currentPage}p / {featuredBook.totalPages}p</span>
                      <span className="font-bold text-primary">{featuredProgress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${featuredProgress}%` }}/>
                    </div>
                  </div>
                  {featuredBook.memo && (<p className="text-xs text-muted-foreground mt-2 italic line-clamp-1">"{featuredBook.memo}"</p>)}
                </div>
              </div>
            </div>
          </div>

          {/* Reading Calendar */}
          <div>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">독서 캘린더</h2>
            <div className="book-card p-4">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => {
            if (calMonth === 0) {
                setCalMonth(11);
                setCalYear(y => y - 1);
            }
            else
                setCalMonth(m => m - 1);
        }} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
                  <ChevronLeft size={16}/>
                </button>
                <span className="text-sm font-semibold">{monthName}</span>
                <button onClick={() => {
            if (calMonth === 11) {
                setCalMonth(0);
                setCalYear(y => y + 1);
            }
            else
                setCalMonth(m => m + 1);
        }} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
                  <ChevronRight size={16}/>
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {["일", "월", "화", "수", "목", "금", "토"].map(d => (<div key={d} className="text-center text-[11px] text-muted-foreground font-medium py-1">{d}</div>))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-y-1">
                {Array.from({ length: firstDay }).map((_, i) => (<div key={`empty-${i}`}/>))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const hasReading = !!READING_CALENDAR[dateKey];
            const pages = READING_CALENDAR[dateKey];
            const isToday = day === 20 && calMonth === 3 && calYear === 2024;
            return (<div key={day} className={`relative flex flex-col items-center justify-center aspect-square rounded-lg text-xs transition-all ${hasReading
                    ? "bg-primary/15 text-primary font-semibold"
                    : isToday
                        ? "bg-secondary text-foreground font-semibold ring-1 ring-primary/30"
                        : "text-muted-foreground"}`}>
                    <span>{day}</span>
                    {hasReading && (<span className="text-[8px] text-primary/70 leading-none">{pages}p</span>)}
                    {isToday && !hasReading && (<span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"/>)}
                  </div>);
        })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/40">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-primary/15"/>
                  <span className="text-[11px] text-muted-foreground">독서한 날</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame size={12} className="text-amber-500"/>
                  <span className="text-[11px] text-muted-foreground">이번 달 {Object.keys(READING_CALENDAR).length}일 독서</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Book List by Status */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">책 목록</h2>
            <div className="flex gap-1">
              <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <List size={16}/>
              </button>
              <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <LayoutGrid size={16}/>
              </button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
            <TabsList className="w-full bg-secondary rounded-xl p-1 h-auto mb-4">
              {STATUS_TABS.map(tab => (<TabsTrigger key={tab.value} value={tab.value} className="flex-1 text-xs py-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  {tab.label}
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    ({tab.value === "all" ? MOCK_BOOKS.length : MOCK_BOOKS.filter(b => b.status === tab.value).length})
                  </span>
                </TabsTrigger>))}
            </TabsList>

            {STATUS_TABS.map(tab => (<TabsContent key={tab.value} value={tab.value} className="mt-0">
                {filteredBooks.length === 0 ? (<div className="text-center py-16">
                    <p className="text-sm text-muted-foreground">아직 책이 없어요</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/search")}>
                      <Plus size={14} className="mr-1"/>
                      책 추가하기
                    </Button>
                  </div>) : viewMode === "list" ? (<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 stagger-children">
                    {filteredBooks.map(book => (<div key={book.id} className="relative group">
                        <BookCard book={book} variant="full"/>
                        <button onClick={() => toast.success(`"${book.title}"이 서재에서 삭제되었습니다.`)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20">
                          <Trash2 size={14}/>
                        </button>
                      </div>))}
                  </div>) : (<div className="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-6 stagger-children">
                    {filteredBooks.map(book => (<BookCard key={book.id} book={book} variant="compact"/>))}
                  </div>)}
              </TabsContent>))}
          </Tabs>
        </div>
      </div>
    </PageLayout>);
}
