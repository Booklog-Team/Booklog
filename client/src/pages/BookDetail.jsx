// Booklog BookDetail — 「따뜻한 라이브러리」
// Book detail: info, status, progress, memo, related books
// FR-17~23: 도서 정보, 상태 설정, 진행률, 페이지 기록, 메모, 저장, 관련 추천
import { useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, Share2, Star, ChevronDown, Check, BookOpen, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import PageLayout from "@/components/PageLayout";
import BookCard from "@/components/BookCard";
import { MOCK_BOOKS } from "@/lib/mockData";
const STATUS_OPTIONS = [
    { value: "reading", label: "읽는 중", emoji: "📖" },
    { value: "want", label: "읽고 싶음", emoji: "🔖" },
    { value: "done", label: "완독", emoji: "✅" },
];
const STATUS_CLASS = {
    reading: "bg-primary/10 text-primary border-primary/30",
    want: "bg-accent text-accent-foreground border-accent-foreground/20",
    done: "bg-secondary text-secondary-foreground border-border",
};
export default function BookDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const book = MOCK_BOOKS.find(b => b.id === id) ?? MOCK_BOOKS[0];
    const related = MOCK_BOOKS.filter(b => b.id !== book.id && b.genre.some(g => book.genre.includes(g))).slice(0, 6);
    const [status, setStatus] = useState(book.status);
    const [currentPage, setCurrentPage] = useState(book.currentPage ?? 0);
    const [memo, setMemo] = useState(book.memo ?? "");
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [rating, setRating] = useState(book.rating ?? 0);
    const [memoOpen, setMemoOpen] = useState(false);
    const progress = book.totalPages ? Math.round((currentPage / book.totalPages) * 100) : 0;
    const handleSave = () => {
        toast.success("독서 기록이 저장되었습니다!");
    };
    return (<PageLayout>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/30">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
          <ArrowLeft size={18}/>
        </button>
        <h1 className="text-sm font-semibold">도서 상세</h1>
        <div className="flex gap-2">
          <button className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
            <Share2 size={16}/>
          </button>
          <button className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
            <Bookmark size={16}/>
          </button>
        </div>
      </div>

      <div className="px-4 pb-10 animate-fade-in-up">
        {/* Two-column layout: book info + actions */}
        <div className="grid grid-cols-1 gap-8 mt-6 lg:grid-cols-[auto_1fr]">
          {/* Left: Book Cover + Info */}
          <div className="lg:w-72">
            <div className="flex gap-5 mb-6 lg:flex-col lg:gap-4">
              <img src={book.cover} alt={book.title} className="w-28 h-40 object-cover rounded-xl shadow-lg flex-shrink-0 lg:w-full lg:h-auto lg:aspect-[2/3]"/>
              <div className="flex-1 pt-1 lg:pt-0">
                <h2 className="text-xl font-bold leading-snug mb-1" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  {book.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-1">{book.author}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {book.publisher} · {book.publishYear} · {book.totalPages}p
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {book.genre.map(g => (<span key={g} className="tag-pill bg-secondary text-secondary-foreground text-[11px]">{g}</span>))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4">{book.description}</p>
              <button className="text-xs text-primary mt-1 font-medium">더 보기</button>
            </div>
          </div>

          {/* Right: Reading Actions */}
          <div className="space-y-6">
            {/* Status Selection */}
            <div>
              <h3 className="text-sm font-semibold mb-3">독서 상태</h3>
              <div className="relative">
                <button onClick={() => setShowStatusMenu(!showStatusMenu)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${status ? STATUS_CLASS[status] : "bg-card border-border text-muted-foreground"}`}>
                  <span>
                    {status
                ? `${STATUS_OPTIONS.find(s => s.value === status)?.emoji} ${STATUS_OPTIONS.find(s => s.value === status)?.label}`
                : "상태를 선택하세요"}
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${showStatusMenu ? "rotate-180" : ""}`}/>
                </button>
                {showStatusMenu && (<div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                    {STATUS_OPTIONS.map(opt => (<button key={opt.value} onClick={() => { setStatus(opt.value); setShowStatusMenu(false); }} className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-secondary transition-colors">
                        <span>{opt.emoji} {opt.label}</span>
                        {status === opt.value && <Check size={15} className="text-primary"/>}
                      </button>))}
                  </div>)}
              </div>
            </div>

            {/* Progress */}
            {(status === "reading" || status === "done") && (<div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">독서 진행률</h3>
                  <span className="text-sm font-bold text-primary">{progress}%</span>
                </div>
                <Slider value={[currentPage]} onValueChange={([v]) => setCurrentPage(v)} max={book.totalPages} step={1} className="mb-3"/>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <BookOpen size={14} className="text-muted-foreground"/>
                    <Input type="number" value={currentPage} onChange={e => setCurrentPage(Math.min(Number(e.target.value), book.totalPages))} className="h-9 text-center text-sm bg-secondary border-none rounded-lg w-24" min={0} max={book.totalPages}/>
                    <span className="text-sm text-muted-foreground">/ {book.totalPages}p</span>
                  </div>
                  <div className="progress-bar flex-1">
                    <div className="progress-fill" style={{ width: `${progress}%` }}/>
                  </div>
                </div>
              </div>)}

            {/* Rating (for done books) */}
            {status === "done" && (<div>
                <h3 className="text-sm font-semibold mb-3">별점</h3>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (<button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110">
                      <Star size={28} className={star <= rating ? "fill-amber-400 text-amber-400" : "text-border"}/>
                    </button>))}
                </div>
              </div>)}

            {/* Memo */}
            <div>
              <button onClick={() => setMemoOpen(!memoOpen)} className="w-full flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <PenLine size={15} className="text-primary"/>
                  독서 메모
                </h3>
                <ChevronDown size={16} className={`text-muted-foreground transition-transform ${memoOpen ? "rotate-180" : ""}`}/>
              </button>
              {memoOpen && (<div className="animate-fade-in-up">
                  <Textarea placeholder="이 책에 대한 생각, 인상 깊은 구절, 느낀 점을 자유롭게 적어보세요..." value={memo} onChange={e => setMemo(e.target.value)} className="min-h-32 bg-secondary border-none rounded-xl text-sm resize-none"/>
                  <p className="text-xs text-muted-foreground mt-1.5 text-right">{memo.length}자</p>
                </div>)}
              {!memoOpen && memo && (<p className="text-sm text-muted-foreground italic line-clamp-2 px-1">"{memo}"</p>)}
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} className="w-full h-12 text-base font-semibold rounded-xl">
              기록 저장
            </Button>
          </div>
        </div>

        {/* Related Books */}
        {related.length > 0 && (<section className="mt-10">
            <h3 className="text-base font-semibold mb-4" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              이런 책도 어떠세요?
            </h3>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {related.map(book => (<BookCard key={book.id} book={book} variant="compact"/>))}
            </div>
          </section>)}
      </div>
    </PageLayout>);
}
