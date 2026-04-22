// Booklog Home — 「따뜻한 라이브러리」
// Main page: personalized recommendations, recent books, activity summary
// FR-09~13: 개인화 추천, 최근 읽은 책, 활동 요약, 검색 이동, 키워드 추천
import { useLocation } from "wouter";
import { Search, Flame, BookOpen, TrendingUp, ChevronRight } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import BookCard from "@/components/BookCard";
import { MOCK_BOOKS, MOCK_USER } from "@/lib/mockData";
const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663584969128/K9LDMhfUcVKdtMjF2S9GdE/booklog-hero-FbzG9jogJPcArmEM9bJ2RD.webp";
const KEYWORDS = ["소설", "자기계발", "한국문학", "SF", "철학", "에세이"];
const readingBooks = MOCK_BOOKS.filter(b => b.status === "reading");
const recommendedBooks = MOCK_BOOKS.slice(0, 6);
export default function Home() {
    const [, navigate] = useLocation();
    return (<PageLayout>
      <div className="stagger-children">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl mb-8 mt-8 mx-4">
          <img src={HERO_IMAGE} alt="독서 공간" className="w-full h-64 object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/65"/>
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            {/* Greeting */}
            <div>
              <p className="text-white/80 text-sm mb-1">안녕하세요, {MOCK_USER.name}님 👋</p>
              <h1 className="text-white text-2xl font-bold leading-tight" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                오늘도 한 페이지씩,<br />꾸준히 읽어봐요
              </h1>
              {/* Streak badge */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="animate-streak inline-block">🔥</span>
                <span className="text-amber-200 text-sm font-semibold">{MOCK_USER.streak}일 연속 독서 중</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 mb-8">
          <button onClick={() => navigate("/search")} className="w-full flex items-center gap-3 bg-card border border-border/80 rounded-xl px-4 h-12 text-muted-foreground hover:border-primary/40 transition-colors shadow-sm">
            <Search size={16}/>
            <span className="text-sm">책 제목, 저자, ISBN 검색...</span>
          </button>
          {/* Keyword chips */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {KEYWORDS.map(kw => (<button key={kw} onClick={() => navigate(`/search?q=${kw}`)} className="flex-shrink-0 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium text-secondary-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                {kw}
              </button>))}
          </div>
        </div>

        {/* Activity Summary */}
        <div className="px-4 mb-8">
          <div className="grid grid-cols-3 gap-4">
            {[
            { label: "읽은 책", value: `${MOCK_USER.totalBooks}권`, icon: BookOpen, color: "text-primary" },
            { label: "연속 독서", value: `${MOCK_USER.streak}일`, icon: Flame, color: "text-amber-500" },
            { label: "총 페이지", value: `${MOCK_USER.totalPages.toLocaleString()}p`, icon: TrendingUp, color: "text-accent-foreground" },
        ].map(({ label, value, icon: Icon, color }) => (<div key={label} className="book-card p-4 text-center">
                <Icon size={22} className={`${color} mx-auto mb-1.5`}/>
                <p className="text-lg font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>))}
          </div>
        </div>

        {/* Currently Reading */}
        {readingBooks.length > 0 && (<section className="px-4 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                지금 읽고 있어요
              </h2>
              <button onClick={() => navigate("/library")} className="flex items-center gap-0.5 text-sm text-primary font-medium">
                더보기 <ChevronRight size={15}/>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {readingBooks.map(book => (<BookCard key={book.id} book={book} variant="full"/>))}
            </div>
          </section>)}

        {/* Personalized Recommendations */}
        <section className="px-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              나를 위한 추천
            </h2>
            <button onClick={() => navigate("/search")} className="flex items-center gap-0.5 text-sm text-primary font-medium">
              더보기 <ChevronRight size={15}/>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {recommendedBooks.map(book => (<BookCard key={book.id} book={book} variant="compact"/>))}
          </div>
        </section>

        {/* Community Highlight */}
        <section className="px-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              독서 모임
            </h2>
            <button onClick={() => navigate("/community")} className="flex items-center gap-0.5 text-sm text-primary font-medium">
              더보기 <ChevronRight size={15}/>
            </button>
          </div>
          <div className="relative rounded-2xl overflow-hidden h-40 cursor-pointer" onClick={() => navigate("/community")}>
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663584969128/K9LDMhfUcVKdtMjF2S9GdE/booklog-community-aKN2vqWuaiNSzYyJhpd5Mb.webp" alt="독서 모임" className="w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-transparent flex items-center p-8">
              <div>
                <p className="text-white/80 text-sm mb-1">현재 3개 모임 진행 중</p>
                <p className="text-white font-bold text-xl leading-snug" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  함께 읽으면<br />더 깊어집니다
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>);
}
