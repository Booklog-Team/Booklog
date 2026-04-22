// Booklog Search — 「따뜻한 라이브러리」
// Book search with results list and empty state
// FR-14~16: 도서 검색, 결과 리스트, 결과 없음 UI
import { useState } from "react";
import { Search as SearchIcon, X, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import PageLayout from "@/components/PageLayout";
import BookCard from "@/components/BookCard";
import { MOCK_BOOKS } from "@/lib/mockData";
const RECENT_SEARCHES = ["한강", "채식주의자", "SF 소설", "자기계발"];
const POPULAR_KEYWORDS = ["소설", "에세이", "인문학", "철학", "심리학", "역사"];
export default function Search() {
    const [query, setQuery] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    const results = hasSearched
        ? MOCK_BOOKS.filter(b => b.title.includes(query) ||
            b.author.includes(query) ||
            b.genre.some(g => g.includes(query)))
        : [];
    const handleSearch = (q) => {
        if (!q.trim())
            return;
        setQuery(q);
        setHasSearched(true);
    };
    const handleClear = () => {
        setQuery("");
        setHasSearched(false);
    };
    return (<PageLayout>
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <Input type="search" placeholder="책 제목, 저자, 장르 검색..." value={query} onChange={e => {
            setQuery(e.target.value);
            if (!e.target.value)
                setHasSearched(false);
        }} onKeyDown={e => e.key === "Enter" && handleSearch(query)} className="pl-9 pr-9 h-11 bg-secondary border-none rounded-xl text-sm" autoFocus/>
            {query && (<button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={15}/>
              </button>)}
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Initial state — no search */}
        {!hasSearched && (<div className="stagger-children">
            {/* Recent searches */}
            {RECENT_SEARCHES.length > 0 && (<section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">최근 검색어</h3>
                  <button className="text-xs text-muted-foreground hover:text-primary">전체 삭제</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {RECENT_SEARCHES.map(term => (<button key={term} onClick={() => handleSearch(term)} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                      <SearchIcon size={12} className="text-muted-foreground"/>
                      {term}
                    </button>))}
                </div>
              </section>)}

            {/* Popular keywords */}
            <section className="mb-8">
              <h3 className="text-sm font-semibold mb-3">인기 장르</h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {POPULAR_KEYWORDS.map((kw, i) => (<button key={kw} onClick={() => handleSearch(kw)} className="flex items-center gap-2 p-3 bg-card border border-border/60 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all">
                    <span className="text-lg font-bold text-primary/30">{i + 1}</span>
                    <span className="text-sm font-medium">{kw}</span>
                  </button>))}
              </div>
            </section>

            {/* Recommended books */}
            <section>
              <h3 className="text-sm font-semibold mb-3">이 책은 어떠세요?</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {MOCK_BOOKS.slice(0, 4).map(book => (<BookCard key={book.id} book={book} variant="full"/>))}
              </div>
            </section>
          </div>)}

        {/* Search results */}
        {hasSearched && results.length > 0 && (<div>
            <p className="text-sm text-muted-foreground mb-5">
              <span className="text-primary font-semibold">"{query}"</span> 검색 결과 {results.length}건
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 stagger-children">
              {results.map(book => (<BookCard key={book.id} book={book} variant="full"/>))}
            </div>
          </div>)}

        {/* Empty state */}
        {hasSearched && results.length === 0 && (<div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
              <BookOpen size={32} className="text-muted-foreground"/>
            </div>
            <h3 className="text-base font-semibold mb-2" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              검색 결과가 없어요
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              <span className="font-medium">"{query}"</span>에 대한 결과를 찾지 못했습니다.<br />
              다른 검색어를 시도해보세요.
            </p>
            <button onClick={handleClear} className="px-5 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors">
              다시 검색하기
            </button>
          </div>)}
      </div>
    </PageLayout>);
}
