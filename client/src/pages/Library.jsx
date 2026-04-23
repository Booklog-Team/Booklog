import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Flame, LayoutGrid, List, ChevronLeft, ChevronRight, Trash2, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import BookCard from "@/components/BookCard";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_TABS = [
  { value: "all",     label: "전체" },
  { value: "reading", label: "읽는 중" },
  { value: "want",    label: "읽고 싶음" },
  { value: "done",    label: "완독" },
];

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }

function calculateStreak(shelf) {
  const all = new Set();
  shelf.forEach((b) => (b.checkedDates || []).forEach((d) => all.add(d)));
  if (!all.size) return 0;
  const sorted = [...all].sort().reverse();
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  let count = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((new Date(sorted[i - 1]) - new Date(sorted[i])) / 86_400_000);
    if (diff === 1) count++;
    else break;
  }
  return count;
}

// Firestore 서재 도서 → BookCard 호환 형태
function toCardBook(b) {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    cover: b.thumbnail,
    status: b.status,
    currentPage: b.currentPage || 0,
    totalPages: b.totalPage || 0,
    memo: b.memo || "",
  };
}

export default function Library() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [shelf, setShelf]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [activeTab, setActiveTab] = useState("all");

  const now = new Date();
  const [calYear, setCalYear]   = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  // ── 서재 로드 ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getDocs(collection(db, "users", user.uid, "shelf"))
      .then((snap) => setShelf(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => setShelf([]))
      .finally(() => setLoading(false));
  }, [user]);

  // ── 삭제 ──────────────────────────────────────────────────
  const handleDelete = async (bookId, bookTitle) => {
    try {
      await deleteDoc(doc(db, "users", user.uid, "shelf", bookId));
      setShelf((prev) => prev.filter((b) => b.id !== bookId));
      toast.success(`"${bookTitle}"이 서재에서 삭제되었습니다.`);
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  // ── 파생값 ────────────────────────────────────────────────
  const streak      = calculateStreak(shelf);
  const featured    = shelf.find((b) => b.status === "reading") ?? shelf[0];
  const featuredProgress = featured?.totalPage && featured?.currentPage
    ? Math.round((featured.currentPage / featured.totalPage) * 100)
    : 0;

  const filtered = activeTab === "all" ? shelf : shelf.filter((b) => b.status === activeTab);

  // 독서한 날짜 Set (checkedDates 전체 합산)
  const readingDates = new Set(shelf.flatMap((b) => b.checkedDates || []));
  // 이번 달 독서일 수
  const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
  const monthReadCount = [...readingDates].filter((d) => d.startsWith(monthPrefix)).length;

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay    = getFirstDayOfMonth(calYear, calMonth);
  const monthName   = new Date(calYear, calMonth, 1).toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
  const todayStr    = new Date().toISOString().slice(0, 10);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 size={36} className="animate-spin text-primary mb-3 opacity-50" />
        <p className="text-sm text-muted-foreground">서재를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold">나의 서재</h1>
        <button
          onClick={() => navigate("/search")}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} />
          책 추가
        </button>
      </div>

      <div className="px-4 stagger-children">

        {/* 연속 독서 배너 */}
        {streak > 0 ? (
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 mb-6">
            <span className="text-3xl animate-streak">🔥</span>
            <div>
              <p className="text-sm font-bold text-amber-800">{streak}일 연속 독서 중!</p>
              <p className="text-xs text-amber-600">오늘도 독서하면 streak를 유지할 수 있어요</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-amber-600">{streak}</p>
              <p className="text-xs text-amber-500">days</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-secondary/40 rounded-2xl p-4 mb-6">
            <span className="text-3xl opacity-40">🔥</span>
            <div>
              <p className="text-sm font-bold text-muted-foreground">오늘 독서를 시작해보세요!</p>
              <p className="text-xs text-muted-foreground/70">연속 독서 streak를 만들어가요</p>
            </div>
          </div>
        )}

        {/* 지금 읽고 있어요 + 독서 캘린더 */}
        <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">

          {/* 대표 도서 */}
          <div>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">지금 읽고 있어요</h2>
            {featured ? (
              <div
                className="book-card p-4 cursor-pointer"
                onClick={() => navigate(`/book/${featured.id}`)}
              >
                <div className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    {featured.thumbnail ? (
                      <img
                        src={featured.thumbnail}
                        alt={featured.title}
                        className="w-20 h-28 object-cover rounded-lg shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-28 rounded-lg shadow-md bg-secondary flex items-center justify-center">
                        <BookOpen size={20} className="text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/10 rounded-l-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="tag-pill status-reading text-[11px] mb-2 inline-block">
                      {featured.status === "reading" ? "읽는 중" : featured.status === "done" ? "완독" : "읽고 싶음"}
                    </span>
                    <h3 className="font-bold text-base leading-snug mb-0.5 line-clamp-2">{featured.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{featured.author}</p>
                    {featured.totalPage > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{featured.currentPage || 0}p / {featured.totalPage}p</span>
                          <span className="font-bold text-primary">{featuredProgress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${featuredProgress}%` }} />
                        </div>
                      </div>
                    )}
                    {featured.memo && (
                      <p className="text-xs text-muted-foreground mt-2 italic line-clamp-1">"{featured.memo}"</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="book-card p-8 flex flex-col items-center justify-center text-center gap-3">
                <BookOpen size={32} className="text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">읽고 있는 책이 없어요</p>
                <Button variant="outline" size="sm" onClick={() => navigate("/search")}>
                  <Plus size={14} className="mr-1" />책 추가하기
                </Button>
              </div>
            )}
          </div>

          {/* 독서 캘린더 */}
          <div>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">독서 캘린더</h2>
            <div className="book-card p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold">{monthName}</span>
                <button
                  onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                  <div key={d} className="text-center text-[11px] text-muted-foreground font-medium py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const hasReading = readingDates.has(dateKey);
                  const isToday = dateKey === todayStr;
                  return (
                    <div
                      key={day}
                      className={`relative flex flex-col items-center justify-center aspect-square rounded-lg text-xs transition-all ${
                        hasReading
                          ? "bg-primary/15 text-primary font-semibold"
                          : isToday
                          ? "bg-secondary text-foreground font-semibold ring-1 ring-primary/30"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span>{day}</span>
                      {hasReading && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary/60" />}
                      {isToday && !hasReading && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/40">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-primary/15" />
                  <span className="text-[11px] text-muted-foreground">독서한 날</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame size={12} className="text-amber-500" />
                  <span className="text-[11px] text-muted-foreground">이번 달 {monthReadCount}일 독서</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 책 목록 */}
        <div className="mb-8">
          <div className="flex justify-end mb-3">
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-secondary rounded-xl p-1 h-auto mb-4">
              {STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}
                  className="flex-1 text-xs py-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
                >
                  {tab.label}
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    ({tab.value === "all" ? shelf.length : shelf.filter((b) => b.status === tab.value).length})
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {STATUS_TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-0">
                {filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-sm text-muted-foreground">아직 책이 없어요</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/search")}>
                      <Plus size={14} className="mr-1" />책 추가하기
                    </Button>
                  </div>
                ) : viewMode === "list" ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 stagger-children">
                    {filtered.map((book) => (
                      <div key={book.id} className="relative group">
                        <BookCard book={toCardBook(book)} variant="full" />
                        <button
                          onClick={() => handleDelete(book.id, book.title)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-6 stagger-children">
                    {filtered.map((book) => (
                      <BookCard key={book.id} book={toCardBook(book)} variant="compact" />
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
