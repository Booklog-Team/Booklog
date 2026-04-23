import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Flame, BookOpen, TrendingUp,
  ChevronRight, Loader2, AlertCircle,
} from "lucide-react";
import BookCard from "@/components/BookCard";
import { getBooksByGenre } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useShelf } from "@/contexts/ShelfContext";

const HERO_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663584969128/K9LDMhfUcVKdtMjF2S9GdE/booklog-hero-FbzG9jogJPcArmEM9bJ2RD.webp";

const KEYWORDS = ["소설", "자기계발", "한국문학", "SF", "철학", "에세이"];

// profile.genres 값 → GENRE_MAP 키 매핑
const GENRE_MAPPING = {
  "소설": "소설", "에세이": "에세이", "자기계발": "자기계발",
  "인문": "인문학", "인문학": "인문학",
  "경제/경영": "경제 / 경영", "경제·경영": "경제 / 경영",
  "역사": "역사", "과학": "과학",
  "어린이": "어린이", "청소년": "청소년",
  "요리": "요리", "여행": "여행",
  "예술": "예술 / 대중문화", "만화": "만화",
};

// 모든 책의 checkedDates를 모아 연속 독서일 계산
function calculateStreak(books) {
  const allDates = new Set();
  books.forEach(b => (b.checkedDates || []).forEach(d => allDates.add(d)));
  if (!allDates.size) return 0;

  const sorted = [...allDates].sort().reverse();
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let count = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round(
      (new Date(sorted[i - 1]) - new Date(sorted[i])) / 86_400_000
    );
    if (diff === 1) count++;
    else break;
  }
  return count;
}

export default function Home() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { books, loading: shelfLoading } = useShelf();

  const [recBooks, setRecBooks]   = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [recError, setRecError]   = useState(false);

  const nickname = profile?.nickname
    || user?.displayName
    || user?.email?.split("@")[0]
    || "독서인";

  // ── 파생 통계 ───────────────────────────────────────────
  const doneCount  = useMemo(() => books.filter(b => b.status === "done").length, [books]);
  const streak     = useMemo(() => calculateStreak(books), [books]);
  const totalPages = useMemo(
    () => books.reduce((s, b) => s + (b.currentPage || 0), 0),
    [books]
  );

  // 읽는 중 도서: lastReadDate 최신순, BookCard 호환 포맷으로 변환
  const readingBooks = useMemo(() => {
    return books
      .filter(b => b.status === "reading")
      .sort((a, b) => {
        if (!a.lastReadDate) return 1;
        if (!b.lastReadDate) return -1;
        return b.lastReadDate.localeCompare(a.lastReadDate);
      })
      .map(b => ({
        ...b,
        _cover:     b.thumbnail,   // BookCard resolveCover() 호환
        totalPages: b.totalPage,   // BookCard progress 계산 호환
      }));
  }, [books]);

  // 추천 장르: profile.genres → GENRE_MAP 키 우선 매핑, 없으면 소설
  const recGenre = useMemo(() => {
    const userGenres = profile?.genres || [];
    for (const g of userGenres) {
      if (GENRE_MAPPING[g]) return GENRE_MAPPING[g];
    }
    return "소설";
  }, [profile?.genres]); // eslint-disable-line react-hooks/exhaustive-deps

  // 추천 도서 API 호출 (장르가 바뀔 때마다 재호출)
  useEffect(() => {
    let cancelled = false;
    setRecLoading(true);
    setRecError(false);

    getBooksByGenre(recGenre, 6)
      .then(({ items }) => { if (!cancelled) setRecBooks(items); })
      .catch(() => { if (!cancelled) setRecError(true); })
      .finally(() => { if (!cancelled) setRecLoading(false); });

    return () => { cancelled = true; };
  }, [recGenre]);

  return (
    <div className="stagger-children pb-10">
      {/* 히어로 */}
      <div className="relative overflow-hidden rounded-2xl mb-8 mt-8 mx-4">
        <img src={HERO_IMAGE} alt="독서 공간" className="w-full h-80 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/65" />
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <p className="text-white/80 text-sm mb-1">안녕하세요, {nickname}님 👋</p>
          <h1 className="text-white text-2xl font-bold leading-tight">
            오늘도 한 페이지씩,<br />꾸준히 읽어봐요
          </h1>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="animate-streak inline-block">🔥</span>
            <span className="text-amber-200 text-sm font-semibold">
              {shelfLoading ? "…" : `${streak}일`} 연속 독서 중
            </span>
          </div>
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
          {[
            { label: "읽은 책",  value: shelfLoading ? "…" : `${doneCount}권`,                    icon: BookOpen,   color: "text-primary" },
            { label: "연속 독서", value: shelfLoading ? "…" : `${streak}일`,                       icon: Flame,      color: "text-amber-500" },
            { label: "총 페이지", value: shelfLoading ? "…" : `${totalPages.toLocaleString()}p`,   icon: TrendingUp, color: "text-accent-foreground" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="book-card p-4 text-center">
              <Icon size={22} className={`${color} mx-auto mb-1.5`} />
              <p className="text-lg font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
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
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : readingBooks.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {readingBooks.map((book) => (
              <BookCard key={book.id} book={book} variant="full" />
            ))}
          </div>
        ) : (
          <div className="py-8 bg-secondary/30 rounded-xl text-center text-muted-foreground text-sm">
            현재 읽고 있는 책이 없어요.{" "}
            <button
              onClick={() => navigate("/search")}
              className="text-primary font-medium underline"
            >
              책 찾아보기
            </button>
          </div>
        )}
      </section>

      {/* 나를 위한 추천 */}
      <section className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">나를 위한 추천</h2>
          <button
            onClick={() => navigate(`/search?genre=${recGenre}`)}
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
              <p className="text-white/80 text-sm mb-1">지금 모임에 참여해보세요</p>
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
