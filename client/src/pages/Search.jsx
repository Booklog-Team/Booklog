import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  X,
  BookOpen,
  Loader2,
  AlertCircle,
  Clock,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchBooks, getBooksByGenre, GENRE_MAP } from "@/utils/api";


function SearchBookCard({ book }) {
  const info      = book.volumeInfo || {};
  const title     = info.title || "";
  const author    = info.authors?.join(", ") || "";
  const publisher = info.publisher || "";
  const genre     = info.categories?.[0] || "";
  const cover     = book._cover || "";

  return (
    <Link
      to={`/book/${book.id}`}
      className="book-card flex gap-4 p-4 hover:bg-secondary/20 transition-colors"
    >
      {cover ? (
        <img
          src={cover}
          alt={title}
          className="w-16 h-24 object-cover rounded-lg shadow-sm flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-24 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          <BookOpen size={20} className="text-muted-foreground/30" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{author}</p>
        {publisher && (
          <p className="text-xs text-muted-foreground/60 line-clamp-1 mt-0.5">{publisher}</p>
        )}
        {genre && (
          <span className="inline-block mt-2 px-2 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-md">
            {genre}
          </span>
        )}
      </div>
    </Link>
  );
}

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
  const navigate = useNavigate();
  const location = useLocation();
  const initialQuery = getInitialQuery();
  const initialGenre = getInitialGenre();
  const isHomeTagSearch = new URLSearchParams(location.search).get("source") === "homeTag";

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
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [suggestionsClosedFor, setSuggestionsClosedFor] = useState("");

  const startIndexRef = useRef(0);
  const activeQueryRef = useRef(initialQuery);
  const suggestionSeqRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem("booklog_recent_searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  const addRecentSearch = term => {
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

  const removeRecentSearch = term => {
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    if (updated.length === 0) {
      localStorage.removeItem("booklog_recent_searches");
    } else {
      localStorage.setItem("booklog_recent_searches", JSON.stringify(updated));
    }
  };

  useEffect(() => {
    let cancelled = false;
    const categories = Object.keys(GENRE_MAP);
    const randomGenre =
      categories[Math.floor(Math.random() * categories.length)];

    setInitialLoading(true);

    getBooksByGenre(randomGenre, 6)
      .then(({ items }) => {
        if (!cancelled) setInitialBooks(items || []);
      })
      .catch(() => {
        if (!cancelled) setInitialBooks([]);
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (initialQuery) {
      performTextSearch(initialQuery, true);
    } else if (initialGenre) {
      performGenreSearch(initialGenre, true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const resetFromNav = () => {
      setQuery("");
      setResults([]);
      setTotalItems(0);
      setHasSearched(false);
      setError(null);
      setIsGenreSearch(false);
      setActiveGenre(null);
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionLoading(false);
      setActiveSuggestionIndex(-1);
      setSuggestionsClosedFor("");
      startIndexRef.current = 0;
      activeQueryRef.current = "";
      if (location.search) navigate("/search", { replace: true });
    };

    window.addEventListener("booklog:reset-search", resetFromNav);
    return () => window.removeEventListener("booklog:reset-search", resetFromNav);
  }, [location.search, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const genre = params.get("genre") || "";
    const urlQuery = params.get("q") || "";

    if (!genre && !urlQuery) {
      if (hasSearched || isGenreSearch || activeQueryRef.current || query) {
        setQuery("");
        setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      setSuggestionsClosedFor("");
      resetSearch();
      }
      return;
    }

    if (genre && genre !== activeGenre) {
      setQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      setSuggestionsClosedFor("");
      performGenreSearch(genre, true);
      return;
    }

    if (urlQuery && urlQuery !== activeQueryRef.current) {
      setIsGenreSearch(false);
      setActiveGenre(null);
      setQuery(urlQuery);
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      setSuggestionsClosedFor("");
      performTextSearch(urlQuery, true);
    }
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isGenreSearch || isHomeTagSearch) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionLoading(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    const trimmed = query.trim();
    if (trimmed === suggestionsClosedFor) {
      setShowSuggestions(false);
      setSuggestionLoading(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionLoading(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    const seq = suggestionSeqRef.current + 1;
    suggestionSeqRef.current = seq;
    setSuggestionLoading(true);

    const timer = setTimeout(() => {
      searchBooks(trimmed, { start: 1, maxResults: 6 })
        .then(({ items }) => {
          if (suggestionSeqRef.current !== seq) return;
          setSuggestions(items || []);
          setShowSuggestions(true);
          setActiveSuggestionIndex(-1);
        })
        .catch(() => {
          if (suggestionSeqRef.current !== seq) return;
          setSuggestions([]);
          setShowSuggestions(false);
          setActiveSuggestionIndex(-1);
        })
        .finally(() => {
          if (suggestionSeqRef.current === seq) setSuggestionLoading(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isGenreSearch, isHomeTagSearch, suggestionsClosedFor]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
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
    setActiveSuggestionIndex(-1);
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
        setResults(items || []);
      } else {
        setResults(prev => [...prev, ...(items || [])]);
      }

      setTotalItems(total || 0);
      startIndexRef.current =
        (isNew ? 0 : startIndexRef.current) + (items?.length || 0);
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
    setSuggestions([]);
    setShowSuggestions(false);
    setSuggestionLoading(false);

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
      const { items, totalResults: total } = await getBooksByGenre(
        genre,
        20,
        page
      );

      if (isNew) {
        setResults(items || []);
      } else {
        setResults(prev => [...prev, ...(items || [])]);
      }

      setTotalItems(total || 0);
      startIndexRef.current =
        (isNew ? 0 : startIndexRef.current) + (items?.length || 0);
    } catch (err) {
      setError(err.message || "장르 검색 중 오류가 발생했습니다.");
      if (isNew) setResults([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleRecentSearch = term => {
    setIsGenreSearch(false);
    setActiveGenre(null);
    setQuery(term);
    performTextSearch(term, true);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setSuggestionsClosedFor("");
    resetSearch();
    if (location.search) navigate("/search", { replace: true });
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

  const handleSuggestionSelect = book => {
    setShowSuggestions(false);
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    setSuggestionsClosedFor("");
    navigate(`/book/${book.id}`);
  };

  const handleCloseSuggestions = () => {
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setSuggestionsClosedFor(query.trim());
  };

  const handleSearchKeyDown = e => {
    const canNavigateSuggestions =
      !isGenreSearch && showSuggestions && suggestions.length > 0 && query.trim().length >= 2;

    if (canNavigateSuggestions && e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
      return;
    }

    if (canNavigateSuggestions && e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      return;
    }

    if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    if (e.key === "Enter" && query.trim().length >= 2) {
      e.preventDefault();
      if (canNavigateSuggestions && activeSuggestionIndex >= 0) {
        handleSuggestionSelect(suggestions[activeSuggestionIndex]);
        return;
      }
      setShowSuggestions(false);
      performTextSearch(query.trim(), true);
    }
  };

  const hasMore = startIndexRef.current < totalItems;

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            {isLoading ? (
              <Loader2
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-primary animate-spin"
              />
            ) : (
              <SearchIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            )}

            <Input
              type="text"
              placeholder="책 제목, 저자 검색..."
              value={query}
              onChange={e => {
                setIsGenreSearch(false);
                setActiveGenre(null);
                if (isHomeTagSearch) navigate("/search", { replace: true });
                if (e.target.value.trim() !== suggestionsClosedFor) {
                  setSuggestionsClosedFor("");
                }
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (!isGenreSearch && !isHomeTagSearch && query.trim().length >= 2 && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 120);
              }}
              onKeyDown={handleSearchKeyDown}
              className="pl-9 pr-9 h-11 bg-secondary border-none rounded-xl text-sm"
              autoFocus
            />

            {(query || hasSearched) && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={15} />
              </button>
            )}

            {!isGenreSearch && !isHomeTagSearch && showSuggestions && query.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-xl border border-border/70 bg-card shadow-xl shadow-primary/10">
                <div className="max-h-[360px] overflow-y-auto scrollbar-booklist py-1">
                  {suggestionLoading && suggestions.length === 0 ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
                      <Loader2 size={14} className="animate-spin text-primary" />
                      도서 후보를 찾고 있어요
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((book, index) => {
                      const info = book.volumeInfo || {};
                      const title = info.title || "";
                      const author = info.authors?.join(", ") || "";
                      const cover = book._cover || "";
                      return (
                        <button
                          key={book.id}
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onMouseEnter={() => setActiveSuggestionIndex(index)}
                          onClick={() => handleSuggestionSelect(book)}
                          className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                            activeSuggestionIndex === index ? "bg-primary/10" : "hover:bg-secondary/50"
                          }`}
                        >
                          {cover ? (
                            <img
                              src={cover}
                              alt={title}
                              className="w-9 h-12 rounded-md object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-12 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                              <BookOpen size={14} className="text-muted-foreground/40" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold line-clamp-1">{title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{author}</p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3 text-xs text-muted-foreground">
                      추천할 도서 후보가 없어요
                    </div>
                  )}
                </div>
                <div className="border-t border-border/40 px-3 py-1.5">
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={handleCloseSuggestions}
                    className="w-full rounded-lg py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-center"
                    aria-label="자동완성 닫기"
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

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
                  <button
                    onClick={clearRecentSearches}
                    className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1 font-bold uppercase tracking-wider"
                  >
                    <Trash2 size={12} /> 전체 삭제
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(term => (
                    <div
                      key={term}
                      className="flex items-center bg-secondary/60 rounded-full text-sm font-medium border border-transparent hover:border-primary/20 transition-all"
                    >
                      <button
                        onClick={() => handleRecentSearch(term)}
                        className="pl-4 pr-2 py-2 hover:text-primary transition-colors"
                      >
                        {term}
                      </button>
                      <button
                        onClick={() => removeRecentSearch(term)}
                        className="pr-3 py-2 text-muted-foreground/30 hover:text-destructive transition-colors"
                        title="검색어 삭제"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-sm font-bold mb-4">인기 장르</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {Object.keys(GENRE_MAP).map(genre => (
                  <button
                    key={genre}
                    onClick={() => performGenreSearch(genre, true)}
                    className="flex flex-col items-center justify-center p-3 bg-card border border-border/50 rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <span className="text-[13px] font-bold">{genre}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold mb-4 flex items-center justify-between">
                이 책은 어떠세요?
                <button
                  onClick={() => window.location.reload()}
                  className="text-[10px] text-primary/60 font-bold hover:text-primary"
                >
                  새로고침
                </button>
              </h3>

              {initialLoading ? (
                <div className="flex flex-col items-center py-12 bg-secondary/20 rounded-2xl border border-dashed border-border/50">
                  <Loader2
                    size={20}
                    className="text-primary animate-spin mb-2 opacity-50"
                  />
                  <p className="text-xs text-muted-foreground font-medium">
                    새로운 책을 찾고 있습니다...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {initialBooks.map(book => (
                    <SearchBookCard key={book.id} book={book} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={32} className="text-primary animate-spin mb-4" />
            <p className="text-sm text-muted-foreground font-medium">
              책을 찾고 있습니다...
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6 bg-amber-50 rounded-2xl border border-amber-100">
            <AlertCircle size={32} className="text-amber-500 mb-3" />
            <h3 className="text-sm font-bold text-amber-900 mb-1">검색 오류</h3>
            <p className="text-xs text-amber-700 mb-4">{error}</p>
            <button
              onClick={() =>
                isGenreSearch && activeGenre
                  ? performGenreSearch(activeGenre, true)
                  : performTextSearch(activeQueryRef.current, true)
              }
              className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-medium"
            >
              다시 시도
            </button>
          </div>
        )}

        {hasSearched && !isLoading && !error && results.length > 0 && (
          <div className="animate-fade-in">
            <div className="flex items-start justify-between gap-3 mb-5">
              <p className="text-sm text-muted-foreground font-medium">
                {isGenreSearch ? (
                  <>
                    <span className="text-primary font-bold">
                      {activeGenre}
                    </span>{" "}
                    장르 도서
                  </>
                ) : (
                  <>
                    <span className="text-primary font-bold">
                      "{activeQueryRef.current}"
                    </span>{" "}
                    검색 결과
                  </>
                )}
              </p>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-muted-foreground font-bold">
                  {totalItems.toLocaleString()}건
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleClear}
                    className="rounded-full bg-secondary/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    검색 초기화
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/15 transition-colors"
                  >
                    <ArrowLeft size={11} />
                    메인으로
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {results.map(book => (
                <SearchBookCard key={book.id} book={book} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex flex-col items-center gap-2">
                <p className="text-xs text-muted-foreground font-medium">
                  {Math.ceil(results.length / 20)} /{" "}
                  {Math.ceil(totalItems / 20)} 페이지
                  <span className="ml-2 opacity-60">
                    ({results.length.toLocaleString()}건 표시 중)
                  </span>
                </p>
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-8 py-3 bg-secondary hover:bg-secondary/80 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "결과 더 보기"
                  )}
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
            <p className="text-sm text-muted-foreground mb-8">
              다른 검색어나 장르를 시도해 보세요.
            </p>
            <button
              onClick={handleClear}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all"
            >
              검색 초기화
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
