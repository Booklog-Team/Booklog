import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Flame, BookOpen, TrendingUp, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import BookCard from "@/components/BookCard";
import { getBooksByGenre } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";

// 온보딩 장르 ID → GENRE_MAP 키 매핑
const ONBOARDING_TO_GENRE = {
  소설: "소설",
  인문: "인문학",
  과학: "과학",
  경제: "경제 / 경영",
  자기계발: "자기계발",
  예술: "예술 / 대중문화",
  역사: "역사",
  아동: "어린이",
};

const HERO_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663584969128/K9LDMhfUcVKdtMjF2S9GdE/booklog-hero-FbzG9jogJPcArmEM9bJ2RD.webp";

const KEYWORDS = ["소설", "자기계발", "한국문학", "SF", "철학", "에세이"];

// Profile.jsx와 동일한 연속 독서일 계산
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

export default function Home() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [shelf, setShelf]               = useState([]);
  const [shelfLoading, setShelfLoading] = useState(true);
  const [recBooks, setRecBooks]         = useState([]);
  const [recLoading, setRecLoading]     = useState(true);
  const [recError, setRecError]         = useState(false);
  const [recommendGenre, setRecommendGenre] = useState("소설");

  // ── 서재 로드 ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setShelfLoading(false); return; }
    getDocs(collection(db, "users", user.uid, "shelf"))
      .then((snap) => setShelf(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => setShelf([]))
      .finally(() => setShelfLoading(false));
  }, [user]);

  // ── 추천 도서 로드 ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const userGenres = (profile?.genres || [])
      .map((g) => ONBOARDING_TO_GENRE[g])
      .filter(Boolean);

    const genre = userGenres.length > 0
      ? userGenres[Math.floor(Math.random() * userGenres.length)]
      : "소설";

    setRecommendGenre(genre);
    setRecLoading(true);
    setRecError(false);

    getBooksByGenre(genre, 6)
      .then(({ items }) => { if (!cancelled) setRecBooks(items); })
      .catch(() => { if (!cancelled) setRecError(true); })
      .finally(() => { if (!cancelled) setRecLoading(false); });

    return () => { cancelled = true; };
  }, [profile]);

  // ── 파생값 ────────────────────────────────────────────────
  const readingBooks = shelf.filter((b) => b.status === "reading");
  const doneCount    = shelf.filter((b) => b.status === "done").length;
  const totalPages   = shelf.reduce((s, b) => s + (b.currentPage || 0), 0);
  const streak       = calculateStreak(shelf);
  const displayName  = profile?.nickname || user?.displayName || user?.email?.split("@")[0] || "독자";

  // BookCard가 읽을 수 있는 형태로 서재 도서 정규화
  const toCardBook = (b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    cover: b.thumbnail,
    status: b.status,
    currentPage: b.currentPage || 0,
    totalPages: b.totalPage || 0,
    memo: b.memo || "",
  });

  return (
    <div className="stagger-children pb-10">
      {/* 히어로 */}
      <div className="relative overflow-hidden rounded-2xl mb-8 mt-8 mx-4">
        <img src={HERO_IMAGE} alt="독서 공간" className="w-full h-80 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/65" />
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <p className="text-white/80 text-sm mb-1">안녕하세요, {displayName}님 👋</p>
          <h1 className="text-white text-2xl font-bold leading-tight">
            오늘도 한 페이지씩,<br />꾸준히 읽어봐요
          </h1>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="animate-streak inline-block">🔥</span>
              <span className="text-amber-200 text-sm font-semibold">
                {streak}일 연속 독서 중
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 검색 바 */}
      <div className="px-4 mb-8">
        <button
          onClick={() => navigate("/search")}
          className="w-full flex items-center gap-3 bg-card border border-border/80 rounded-xl px-4 h-12 text-muted-foreground hover:border-primary/40 transition-colors shadow-sm"
        >
          <Search size={16} />
          <span className="text-sm">책 제목, 저자, ISBN 검색...</span>
        </button>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {KEYWORDS.map((kw) => (
            <button
              key={kw}
              onClick={() => navigate(`/search?q=${kw}`)}
              className="flex-shrink-0 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      {/* 활동 요약 */}
      <div className="px-4 mb-8">
        <div className="grid grid-cols-3 gap-4">
          {shelfLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="book-card p-4 text-center">
                <Loader2 size={22} className="animate-spin text-muted-foreground/30 mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground">로딩 중</p>
              </div>
            ))
          ) : (
            [
              { label: "읽은 책",  value: `${doneCount}권`,               icon: BookOpen,   color: "text-primary" },
              { label: "연속 독서", value: `${streak}일`,                  icon: Flame,      color: "text-amber-500" },
              { label: "총 페이지", value: `${totalPages.toLocaleString()}p`, icon: TrendingUp, color: "text-accent-foreground" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="book-card p-4 text-center">
                <Icon size={22} className={`${color} mx-auto mb-1.5`} />
                <p className="text-lg font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 지금 읽고 있어요 */}
      <section className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">지금 읽고 있어요</h2>
          <button
            onClick={() => navigate("/library")}
            className="flex items-center gap-0.5 text-sm text-primary font-medium"
          >
            더보기 <ChevronRight size={15} />
          </button>
        </div>
        {shelfLoading ? (
          <div className="flex items-center justify-center py-10 bg-secondary/10 rounded-2xl border border-dashed border-border">
            <Loader2 className="animate-spin text-primary mr-2" size={18} />
            <span className="text-xs text-muted-foreground">서재를 불러오는 중...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {readingBooks.length > 0 ? (
              readingBooks.map((b) => <BookCard key={b.id} book={toCardBook(b)} variant="full" />)
            ) : (
              <div className="col-span-full py-8 bg-secondary/30 rounded-xl text-center text-muted-foreground text-sm">
                현재 읽고 있는 책이 없습니다.
              </div>
            )}
          </div>
        )}
      </section>

      {/* 나를 위한 추천 */}
      <section className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            나를 위한 추천
            {profile?.genres?.length > 0 && (
              <span className="text-xs font-medium text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">
                {recommendGenre}
              </span>
            )}
          </h2>
          <button
            onClick={() => navigate(`/search?genre=${encodeURIComponent(recommendGenre)}`)}
            className="flex items-center gap-0.5 text-sm text-primary font-medium"
          >
            더보기 <ChevronRight size={15} />
          </button>
        </div>

        {recLoading ? (
          <div className="flex items-center justify-center py-12 bg-secondary/10 rounded-2xl border border-dashed border-border">
            <Loader2 className="animate-spin text-primary mr-2" size={20} />
            <span className="text-xs text-muted-foreground">추천 도서를 불러오는 중...</span>
          </div>
        ) : recError ? (
          <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl text-xs border border-amber-100">
            <AlertCircle size={14} />
            <span>추천 도서를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {recBooks.map((book) => (
              <BookCard key={book.id} book={book} variant="compact" />
            ))}
          </div>
        )}
      </section>

      {/* 독서 모임 */}
      <section className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">독서 모임</h2>
          <button
            onClick={() => navigate("/community")}
            className="flex items-center gap-0.5 text-sm text-primary font-medium"
          >
            더보기 <ChevronRight size={15} />
          </button>
        </div>
        <div
          className="relative rounded-2xl overflow-hidden h-40 cursor-pointer"
          onClick={() => navigate("/community")}
        >
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663584969128/K9LDMhfUcVKdtMjF2S9GdE/booklog-community-aKN2vqWuaiNSzYyJhpd5Mb.webp"
            alt="독서 모임"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-transparent flex items-center p-8">
            <div>
              <p className="text-white/80 text-sm mb-1">현재 3개 모임 진행 중</p>
              <p className="text-white font-bold text-xl leading-snug">
                함께 읽으면<br />더 깊어집니다
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
