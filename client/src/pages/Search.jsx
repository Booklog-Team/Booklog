import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, X, BookOpen, Loader2, AlertCircle, Clock, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import BookCard from "@/components/BookCard";
import { searchBooks, getBooksByGenre, GENRE_MAP } from "@/utils/api";

function getInitialQuery() {
  try {
    return new URLSearchParams(window.location.search).get("q") || "";
  } catch {
    return "";
  }
}

function getInitialGenre() {
  try {
    return new URLSearchParams(window.location.search).get("genre") || "";
  } catch {
    return "";
  }
}

export default function Search() {
  const initialQuery = getInitialQuery();
  const initialGenre = getInitialGenre();

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  const [isGenreSearch, setIsGenreSearch] = useState(false);
  const [activeGenre, setActiveGenre] = useState(null);

  const [recentSearches, setRecentSearches] = useState([]);

  const [initialBooks, setInitialBooks] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const startIndexRef = useRef(0);
  const activeQueryRef = useRef(initialQuery);

  // 최근 검색어 로드
  useEffect(() => {
    const saved = localStorage.getItem("booklog_recent_searches");
    if (saved) {
      try { setRecentSearches(JSON.parse(saved)); } catch { setRecentSearches([]); }
    }
  }, []);

  const addRecentSearch = (term) => {
    if (!term.trim()) return;
    const filtered = recentSearches.filter(s => s !== term);
    const updated = [term, ...filtered].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem("booklog_recent_searches", JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("booklog_recent_searches");
  };

  // 랜덤 추천 도서 — 마운트 시 항상 로드 (검색 후 돌아와도 표시)

  useEffect(() => {
    let cancelled = false;
    const categories = Object.keys(GENRE_MAP);
    const randomGenre = categories[Math.floor(Math.random() * categories.length)];

    setInitialLoading(true);
    getBooksByGenre(randomGenre, 6)
      .then(({ items }) => {
        if (!cancelled) setInitialBooks(items);
      })
      .catch(() => {
        if (!cancelled) setInitialBooks([]);
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // URL 쿼리/장르가 있으면 바로 검색 실행
  useEffect(() => {
    if (initialQuery) {
      performTextSearch(initialQuery, true);
    } else if (initialGenre) {
      performGenreSearch(initialGenre);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 검색어 디바운싱
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (isGenreSearch) return;

    const timer = setTimeout(() => {
      const trimmed = query.trim();
      if (trimmed.length >= 2) {
        performTextSearch(trimmed, true);
      } else if (!trimmed && hasSearched) {
        resetSearch();
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetSearch = () => {
    setResults([]);
    setTotalItems(0);
    setHasSearched(false);
    setError(null);
    setIsGenreSearch(false);
    setActiveGenre(null);
    startIndexRef.current = 0;
    activeQueryRef.current = "";
  };

  const performTextSearch = async (searchQuery, isNew = true) => {
    if (!searchQuery.trim()) return;

    if (isNew) {
      setIsLoading(true);
      setHasSearched(true);
      setError(null);
      setResults([]);
      setTotalItems(0);
      startIndexRef.current = 0;
      activeQueryRef.current = searchQuery;
      addRecentSearch(searchQuery);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const { items, totalResults: total } = await searchBooks(searchQuery, {
        start: isNew ? 1 : Math.floor(startIndexRef.current / 20) + 1,
      });

      if (activeQueryRef.current !== searchQuery) return;

      if (isNew) {
        setResults(items);
      } else {
        setResults((prev) => [...prev, ...items]);
      }
      setTotalItems(total);
      startIndexRef.current = (isNew ? 0 : startIndexRef.current) + items.length;
    } catch (err) {
      if (activeQueryRef.current !== searchQuery) return;
      setError(err.message || "도서 검색 중 오류가 발생했습니다.");
      if (isNew) setResults([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const performGenreSearch = async (genre, isNew = true) => {
    setIsGenreSearch(true);
    setActiveGenre(genre);
    setError(null);

    if (isNew) {
      setIsLoading(true);
      setHasSearched(true);
      setResults([]);
      setTotalItems(0);
      startIndexRef.current = 0;
      setQuery("");
    } else {
      setIsLoadingMore(true);
    }

    try {
      const page = isNew ? 1 : Math.floor(startIndexRef.current / 20) + 1;
      const { items, totalResults: total } = await getBooksByGenre(genre, 20, page);

      if (isNew) {
        setResults(items);
      } else {
        setResults((prev) => [...prev, ...items]);
      }
      setTotalItems(total);
      startIndexRef.current = (isNew ? 0 : startIndexRef.current) + items.length;
    } catch (err) {
      setError(err.message || "장르 검색 중 오류가 발생했습니다.");
      if (isNew) setResults([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleRecentSearch = (term) => {
    setIsGenreSearch(false);
    setActiveGenre(null);
    setQuery(term);
    performTextSearch(term, true);
  };

  const handleClear = () => {
    setQuery("");
    resetSearch();
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && startIndexRef.current < totalItems) {
      if (isGenreSearch && activeGenre) {
        performGenreSearch(activeGenre, false);
      } else {
        performTextSearch(activeQueryRef.current, false);
      }
    }
  };

  const hasMore = startIndexRef.current < totalItems;

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            {isLoading ? (
              <Loader2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />
            ) : (
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            )}
            <Input
              type="text"
              placeholder="책 제목, 저자 검색..."
              value={query}
              onChange={(e) => {
                setIsGenreSearch(false);
                setActiveGenre(null);
                setQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim().length >= 2) {
                  performTextSearch(query.trim(), true);
                }
              }}
              className="pl-9 pr-9 h-11 bg-secondary border-none rounded-xl text-sm"
              autoFocus
            />
            {(query || hasSearched) && (
              <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {isGenreSearch && activeGenre && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground font-bold">장르:</span>
            <span className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full uppercase">{activeGenre}</span>
            <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-primary font-medium">초기화</button>
          </div>
        )}
      </div>

      <div className="px-4 py-6">
        {!hasSearched && !isLoading && (
          <div className="stagger-children space-y-10">
            {recentSearches.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Clock size={16} className="text-muted-foreground/60" />
                    최근 검색어
                  </h3>
                  <button onClick={clearRecentSearches} className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1 font-bold uppercase tracking-wider">
                    <Trash2 size={12} /> 전체 삭제
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button key={term} onClick={() => handleRecentSearch(term)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-secondary/60 rounded-full text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20">
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-sm font-bold mb-4">인기 장르</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {Object.keys(GENRE_MAP).map((genre) => (
                  <button key={genre} onClick={() => performGenreSearch(genre)}
                    className="flex flex-col items-center justify-center p-3 bg-card border border-border/50 rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all">
                    <span className="text-[13px] font-bold">{genre}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold mb-4 flex items-center justify-between">
                이 책은 어떠세요?
                <button onClick={() => window.location.reload()} className="text-[10px] text-primary/60 font-bold hover:text-primary">새로고침</button>
              </h3>
              {initialLoading ? (
                <div className="flex flex-col items-center py-12 bg-secondary/20 rounded-2xl border border-dashed border-border/50">
                  <Loader2 size={20} className="text-primary animate-spin mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground font-medium">새로운 책을 찾고 있습니다...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {initialBooks.map((book) => (
                    <BookCard key={book.id} book={book} variant="full" />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={32} className="text-primary animate-spin mb-4" />
            <p className="text-sm text-muted-foreground font-medium">책을 찾고 있습니다...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6 bg-amber-50 rounded-2xl border border-amber-100">
            <AlertCircle size={32} className="text-amber-500 mb-3" />
            <h3 className="text-sm font-bold text-amber-900 mb-1">검색 오류</h3>
            <p className="text-xs text-amber-700 mb-4">{error}</p>
            <button
              onClick={() => isGenreSearch && activeGenre ? performGenreSearch(activeGenre) : performTextSearch(activeQueryRef.current, true)}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-medium"
            >
              다시 시도
            </button>
          </div>
        )}

        {hasSearched && !isLoading && !error && results.length > 0 && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-muted-foreground font-medium">
                {isGenreSearch ? (
                  <><span className="text-primary font-bold">{activeGenre}</span> 장르 도서</>
                ) : (
                  <><span className="text-primary font-bold">"{activeQueryRef.current}"</span> 검색 결과</>
                )}
              </p>
              <span className="text-xs text-muted-foreground font-bold">{totalItems.toLocaleString()}건</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {results.map((book) => (
                <BookCard key={book.id} book={book} variant="full" />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex flex-col items-center gap-2">
                <p className="text-xs text-muted-foreground font-medium">
                  {Math.ceil(results.length / 20)} / {Math.ceil(totalItems / 20)} 페이지
                  <span className="ml-2 opacity-60">({results.length.toLocaleString()}건 표시 중)</span>
                </p>
                <button onClick={handleLoadMore} disabled={isLoadingMore}
                  className="flex items-center gap-2 px-8 py-3 bg-secondary hover:bg-secondary/80 text-sm font-bold rounded-xl transition-all disabled:opacity-50">
                  {isLoadingMore ? <Loader2 size={16} className="animate-spin" /> : "결과 더 보기"}
                </button>
              </div>
            )}
          </div>
        )}

        {hasSearched && !isLoading && !error && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
              <BookOpen size={32} className="text-muted-foreground/30" />
            </div>
            <h3 className="text-base font-bold mb-2">검색 결과가 없어요</h3>
            <p className="text-sm text-muted-foreground mb-8">다른 검색어나 장르를 시도해 보세요.</p>
            <button onClick={handleClear}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all">
              검색 초기화
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
