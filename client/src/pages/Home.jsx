import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Flame, BookOpen, TrendingUp, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import BookCard from "@/components/BookCard";
import { getBooksByGenre } from "@/utils/api";
import { MOCK_BOOKS, MOCK_USER } from "@/lib/mockData";

const HERO_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663584969128/K9LDMhfUcVKdtMjF2S9GdE/booklog-hero-FbzG9jogJPcArmEM9bJ2RD.webp";

const KEYWORDS = ["소설", "자기계발", "한국문학", "SF", "철학", "에세이"];

export default function Home() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const readingBooks = MOCK_BOOKS.filter((b) => b.status === "reading");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    getBooksByGenre("소설", 6)
      .then(({ items }) => {
        if (!cancelled) setBooks(items);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="stagger-children pb-10">
        {/* 히어로 */}
        <div className="relative overflow-hidden rounded-2xl mb-8 mt-8 mx-4">
          <img src={HERO_IMAGE} alt="독서 공간" className="w-full h-80 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/65" />
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <p className="text-white/80 text-sm mb-1">안녕하세요, {MOCK_USER.name}님 👋</p>
            <h1 className="text-white text-2xl font-bold leading-tight">
              오늘도 한 페이지씩,<br />꾸준히 읽어봐요
            </h1>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="animate-streak inline-block">🔥</span>
              <span className="text-amber-200 text-sm font-semibold">
                {MOCK_USER.streak}일 연속 독서 중
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
              { label: "읽은 책", value: `${MOCK_USER.totalBooks}권`, icon: BookOpen, color: "text-primary" },
              { label: "연속 독서", value: `${MOCK_USER.streak}일`, icon: Flame, color: "text-amber-500" },
              { label: "총 페이지", value: `${MOCK_USER.totalPages.toLocaleString()}p`, icon: TrendingUp, color: "text-accent-foreground" },
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
            <h2 className="text-lg font-bold">
              지금 읽고 있어요
            </h2>
            <button
              onClick={() => navigate("/library")}
              className="flex items-center gap-0.5 text-sm text-primary font-medium"
            >
              더보기 <ChevronRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {readingBooks.length > 0 ? (
              readingBooks.map((book) => <BookCard key={book.id} book={book} variant="full" />)
            ) : (
              <div className="col-span-full py-8 bg-secondary/30 rounded-xl text-center text-muted-foreground text-sm">
                현재 읽고 있는 책이 없습니다.
              </div>
            )}
          </div>
        </section>

        {/* 나를 위한 추천 (API) */}
        <section className="px-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              나를 위한 추천
            </h2>
            <button
              onClick={() => navigate("/search?genre=소설")}
              className="flex items-center gap-0.5 text-sm text-primary font-medium"
            >
              더보기 <ChevronRight size={15} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 bg-secondary/10 rounded-2xl border border-dashed border-border">
              <Loader2 className="animate-spin text-primary mr-2" size={20} />
              <span className="text-xs text-muted-foreground">추천 도서를 불러오는 중...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl text-xs border border-amber-100">
              <AlertCircle size={14} />
              <span>추천 도서를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {books.map((book) => (
                <BookCard key={book.id} book={book} variant="compact" />
              ))}
            </div>
          )}
        </section>

        {/* 독서 모임 */}
        <section className="px-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              독서 모임
            </h2>
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
