// Booklog Search — 「따뜻한 라이브러리」
// Book search with results list and empty state
// FR-14~16: 도서 검색, 결과 리스트, 결과 없음 UI
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, X, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useShelf } from "@/contexts/ShelfContext";
import { MOCK_BOOKS } from "@/lib/mockData";

const STATUS_LABELS = { reading: "읽는 중", want: "읽고 싶음", done: "완독" };
const STATUS_CLASSES = { reading: "status-reading", want: "status-want", done: "status-done" };

function SearchBookCard({ book, inShelf, onAdd }) {
  const progress =
    book.currentPage && book.totalPages
      ? Math.round((book.currentPage / book.totalPages) * 100)
      : null;

  return (
    <div className="book-card overflow-hidden">
      <Link to={`/book/${book.id}`} className="flex gap-4 p-4 hover:bg-secondary/20 transition-colors">
        <img
          src={book.cover}
          alt={book.title}
          className="w-16 h-24 object-cover rounded-lg shadow-sm flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2">
              {book.title}
            </h3>
            {book.status && (
              <span className={`tag-pill ${STATUS_CLASSES[book.status]} flex-shrink-0 text-[10px]`}>
                {STATUS_LABELS[book.status]}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
          {progress !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{book.currentPage}p / {book.totalPages}p</span>
                <span className="text-primary font-medium">{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </Link>
      {inShelf ? (
        <div className="border-t border-border/40 bg-secondary/40 px-4 py-2.5 text-xs text-center text-muted-foreground">
          이미 서재에 있어요
        </div>
      ) : (
        <button
          onClick={onAdd}
          className="w-full border-t border-border/40 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors"
        >
          서재에 추가하고 읽기 시작하기
        </button>
      )}
    </div>
  );
}
const RECENT_SEARCHES = ["한강", "채식주의자", "SF 소설", "자기계발"];
const POPULAR_KEYWORDS = ["소설", "에세이", "인문학", "철학", "심리학", "역사"];
export default function Search() {
  const { addBook, books } = useShelf();
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const results = hasSearched
    ? MOCK_BOOKS.filter(
        b =>
          b.title.includes(query) ||
          b.author.includes(query) ||
          b.genre.some(g => g.includes(query))
      )
    : [];

  const [confirmBook, setConfirmBook] = useState(null);

  const isInShelf = bookId => books.some(b => b.id === bookId);

  const handleSearch = q => {
    if (!q.trim()) return;
    setQuery(q);
    setHasSearched(true);
  };

  const handleClear = () => {
    setQuery("");
    setHasSearched(false);
  };

  const handleAddToShelf = async book => {
    try {
      await addBook({
        id: book.id,
        title: book.title,
        author: book.author,
        thumbnail: book.cover || book.thumbnail || "",
        status: "reading",
        currentPage: 0,
        totalPage: book.totalPages || book.totalPage || 0,
        lastReadDate: null,
        checkedDates: [],
        memo: "",
      });
      toast.success("서재에 추가됐어요! 지금 읽고 있어요에서 확인해보세요.");
    } catch (error) {
      console.error(error);
      toast.error("서재에 추가하지 못했습니다.");
    }
  };

  const handleConfirm = async () => {
    if (!confirmBook) return;
    const book = confirmBook;
    setConfirmBook(null);
    await handleAddToShelf(book);
  };

  return (
    <>
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="책 제목, 저자, 장르 검색..."
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                if (!e.target.value) setHasSearched(false);
              }}
              onKeyDown={e => e.key === "Enter" && handleSearch(query)}
              className="pl-9 pr-9 h-11 bg-secondary border-none rounded-xl text-sm"
              autoFocus
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Initial state — no search */}
        {!hasSearched && (
          <div className="stagger-children">
            {/* Recent searches */}
            {RECENT_SEARCHES.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    최근 검색어
                  </h3>
                  <button className="text-xs text-muted-foreground hover:text-primary">
                    전체 삭제
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {RECENT_SEARCHES.map(term => (
                    <button
                      key={term}
                      onClick={() => handleSearch(term)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <SearchIcon size={12} className="text-muted-foreground" />
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Popular keywords */}
            <section className="mb-8">
              <h3 className="text-sm font-semibold mb-3">인기 장르</h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {POPULAR_KEYWORDS.map((kw, i) => (
                  <button
                    key={kw}
                    onClick={() => handleSearch(kw)}
                    className="flex items-center gap-2 p-3 bg-card border border-border/60 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <span className="text-lg font-bold text-primary/30">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{kw}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Recommended books */}
            <section>
              <h3 className="text-sm font-semibold mb-3">이 책은 어떠세요?</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {MOCK_BOOKS.slice(0, 4).map(book => (
                  <SearchBookCard
                    key={book.id}
                    book={book}
                    inShelf={isInShelf(book.id)}
                    onAdd={() => setConfirmBook(book)}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Search results */}
        {hasSearched && results.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-5">
              <span className="text-primary font-semibold">"{query}"</span> 검색
              결과 {results.length}건
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 stagger-children">
              {results.map(book => (
                <SearchBookCard
                  key={book.id}
                  book={book}
                  inShelf={isInShelf(book.id)}
                  onAdd={() => setConfirmBook(book)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
              <BookOpen size={32} className="text-muted-foreground" />
            </div>
            <h3
              className="text-base font-semibold mb-2"
              style={{ fontFamily: "'Noto Serif KR', serif" }}
            >
              검색 결과가 없어요
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              <span className="font-medium">"{query}"</span>에 대한 결과를 찾지
              못했습니다.
              <br />
              다른 검색어를 시도해보세요.
            </p>
            <button
              onClick={handleClear}
              className="px-5 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              다시 검색하기
            </button>
          </div>
        )}
      </div>

      {/* 서재 추가 확인 Dialog */}
      <Dialog open={!!confirmBook} onOpenChange={open => !open && setConfirmBook(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>서재에 추가할까요?</DialogTitle>
          </DialogHeader>
          {confirmBook && (
            <div className="flex gap-4 py-2">
              <img
                src={confirmBook.cover || confirmBook.thumbnail}
                alt={confirmBook.title}
                className="w-16 h-22 object-cover rounded-lg shadow-sm flex-shrink-0"
              />
              <div className="flex flex-col justify-center">
                <p className="font-semibold text-sm leading-snug line-clamp-2" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  {confirmBook.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{confirmBook.author}</p>
                <span className="tag-pill status-reading text-[11px] mt-2 self-start">읽는 중</span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmBook(null)}>
              취소
            </Button>
            <Button onClick={handleConfirm}>
              추가하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
