import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bookmark, Star, ChevronDown, Check,
  BookOpen, PenLine, Loader2, AlertCircle, ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import BookCard from "@/components/BookCard";
import { getBookDetail, getBooksByGenre, getHighQualityCover } from "@/utils/api";

const STATUS_OPTIONS = [
  { value: "reading", label: "읽는 중", emoji: "📖" },
  { value: "want",    label: "읽고 싶음", emoji: "🔖" },
  { value: "done",    label: "완독",    emoji: "✅" },
];

const STATUS_CLASS = {
  reading: "bg-primary/10 text-primary border-primary/30",
  want:    "bg-accent text-accent-foreground border-accent-foreground/20",
  done:    "bg-secondary text-secondary-foreground border-border",
};

// 고화질 커버 이미지 시도 및 폴백 로직
function DetailCover({ src, alt }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  // coverBig 로드 실패 시 cover200으로 폴백
  const handleError = () => {
    if (imgSrc && imgSrc.includes("/coverBig/")) {
      setImgSrc(imgSrc.replace("/coverBig/", "/cover200/"));
    } else {
      setFailed(true);
    }
  };

  if (!src || failed) {
    return (
      <div className="w-32 h-48 rounded-xl shadow-xl flex-shrink-0 lg:w-full lg:aspect-[2/3] bg-secondary flex items-center justify-center">
        <BookOpen size={40} className="text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className="w-32 h-48 object-cover rounded-xl shadow-xl flex-shrink-0 lg:w-full lg:h-auto lg:aspect-[2/3] bg-secondary transition-all duration-500"
      onError={handleError}
    />
  );
}

function DescriptionSection({ text }) {
  const [expanded, setExpanded] = useState(false);
  const cleanText = text?.replace(/<[^>]*>/g, "") || "설명이 없습니다.";
  const isLong = cleanText.length > 200;

  return (
    <div className="bg-secondary/40 rounded-2xl p-5 mt-4">
      <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">책 소개</p>
      <p className={`text-sm text-foreground/80 leading-relaxed ${!expanded && isLong ? "line-clamp-6" : ""}`}>
        {cleanText}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary font-bold mt-3 hover:underline flex items-center gap-1"
        >
          {expanded ? "접기 ↑" : "더보기 ↓"}
        </button>
      )}
    </div>
  );
}

function RatingStars({ rating }) {
  const stars = Math.round(rating / 2);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} size={14}
            className={s <= stars ? "fill-amber-400 text-amber-400" : "text-border"} 
          />
        ))}
      </div>
      <span className="text-sm font-bold text-amber-600">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">/ 10</span>
    </div>
  );
}

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [status, setStatus] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [memo, setMemo] = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [rating, setRating] = useState(0);
  const [memoOpen, setMemoOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getBookDetail(id);
        if (cancelled) return;
        setBook(data);

        const cat = data.volumeInfo?.categories?.[0];
        if (cat) {
          getBooksByGenre(cat, 6)
            .then(({ items }) => {
              if (!cancelled) setRelated(items.filter((b) => b.id !== id));
            })
            .catch(() => {});
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "정보를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 size={40} className="text-primary animate-spin mb-4 opacity-50" />
        <p className="text-muted-foreground font-medium animate-pulse">도서 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error && !book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-8">
        <AlertCircle size={48} className="text-amber-500 mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">정보를 불러올 수 없습니다</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{error}</p>
        <Button onClick={() => navigate("/search")} className="rounded-xl px-8 h-12">검색으로 돌아가기</Button>
      </div>
    );
  }

  const info = book.volumeInfo || {};
  const title = info.title || "제목 없음";
  const author = info.authors?.join(", ") || "저자 정보 없음";
  const cover = getHighQualityCover(book._cover);
  const publisher = info.publisher || "";
  const publishYear = info.publishedDate ? info.publishedDate.split("-")[0] : "";
  const totalPages = info.pageCount || 0;
  const genres = info.categories || [];
  const aladinPrice = book._price || 0;
  const aladinLink = book._link;
  const aladinRating = book._rating || 0;

  const progress = totalPages ? Math.round((currentPage / totalPages) * 100) : 0;

  const MetaInfo = () => (
    <div className="space-y-3">
      <div>
        <h2 className="text-2xl font-bold leading-tight mb-2 tracking-tight">{title}</h2>
        <p className="text-base text-muted-foreground font-medium">{author}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground/80">
        <span>{publisher}</span>
        <span className="w-1 h-1 rounded-full bg-border" />
        <span>{publishYear}년</span>
        {totalPages > 0 && (
          <>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>{totalPages}p</span>
          </>
        )}
      </div>
      {aladinRating > 0 && <RatingStars rating={aladinRating} />}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {genres.map((g) => (
          <span key={g} className="px-2.5 py-1 bg-secondary text-secondary-foreground text-[11px] font-bold rounded-lg uppercase tracking-wider">
            {g}
          </span>
        ))}
      </div>
      
      {/* 가격 및 구매 버튼 */}
      <div className="flex items-center gap-4 pt-4">
        {aladinPrice > 0 && (
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-bold">판매가</span>
            <span className="text-xl font-black text-primary">
              {aladinPrice.toLocaleString()}<span className="text-sm font-bold ml-0.5">원</span>
            </span>
          </div>
        )}
        {aladinLink && (
          <a
            href={aladinLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground h-12 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <ShoppingCart size={18} />
            알라딘에서 구매하기
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/20">
        <button 
          onClick={() => window.history.back()} 
          className="p-2 hover:bg-secondary rounded-full transition-colors"
          title="뒤로 가기"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="text-sm font-black tracking-widest uppercase opacity-40">Detail</span>
        <button className="p-2 hover:bg-secondary rounded-full transition-colors">
          <Bookmark size={22} />
        </button>
      </div>

      <div className="px-4 pb-12 animate-fade-in">
        <div className="grid grid-cols-1 gap-8 mt-6 lg:grid-cols-[300px_1fr] items-start">
          {/* 모바일: 커버 + 정보 상단 배치 / 데스크탑: 왼쪽 커버 */}
          <div className="flex gap-6 lg:flex-col lg:gap-8">
            <DetailCover src={cover} alt={title} />
            <div className="flex-1 lg:hidden">
              <MetaInfo />
            </div>
          </div>

          <div className="space-y-8">
            {/* 데스크탑 정보 */}
            <div className="hidden lg:block">
              <MetaInfo />
            </div>

            <DescriptionSection text={info.description} />

            {/* 독서 기록 카드 */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <PenLine size={18} className="text-primary" />
                  나의 독서 기록
                </h3>
              </div>

              {/* 상태 선택 */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase">현재 상태</p>
                <div className="relative">
                  <button
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                      status ? STATUS_CLASS[status] : "bg-secondary/50 border-transparent text-muted-foreground"
                    }`}
                  >
                    <span>
                      {status
                        ? `${STATUS_OPTIONS.find((s) => s.value === status)?.emoji} ${STATUS_OPTIONS.find((s) => s.value === status)?.label}`
                        : "상태를 선택해 주세요"}
                    </span>
                    <ChevronDown size={18} className={`transition-transform duration-300 ${showStatusMenu ? "rotate-180" : ""}`} />
                  </button>
                  {showStatusMenu && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/80 rounded-xl shadow-xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setStatus(opt.value); setShowStatusMenu(false); }}
                          className="w-full flex items-center justify-between px-4 py-4 text-sm font-medium hover:bg-secondary transition-colors border-b border-border/30 last:border-0"
                        >
                          <span className="flex items-center gap-3">
                            <span className="text-lg">{opt.emoji}</span>
                            {opt.label}
                          </span>
                          {status === opt.value && <Check size={18} className="text-primary" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 진행률 & 별점 */}
              {(status === "reading" || status === "done") && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase">
                      <p>읽은 페이지</p>
                      <span className="text-primary text-sm">{progress}%</span>
                    </div>
                    <Slider
                      value={[currentPage]}
                      onValueChange={([v]) => setCurrentPage(v)}
                      max={totalPages || 1000}
                      step={1}
                      className="py-2"
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg flex-1 max-w-[120px]">
                        <BookOpen size={14} className="text-muted-foreground" />
                        <Input
                          type="number"
                          value={currentPage}
                          onChange={(e) => setCurrentPage(Math.min(Number(e.target.value), totalPages || 1000))}
                          className="h-6 p-0 text-center text-sm bg-transparent border-none focus-visible:ring-0 font-bold"
                        />
                      </div>
                      <span className="text-sm font-bold text-muted-foreground">/ {totalPages || "?"} p</span>
                    </div>
                  </div>

                  {status === "done" && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-muted-foreground uppercase">나의 평점</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setRating(star)} className="transition-all hover:scale-110 active:scale-95">
                            <Star size={32} className={star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 메모 */}
              <div className="space-y-3">
                <button onClick={() => setMemoOpen(!memoOpen)} className="w-full flex items-center justify-between group">
                  <p className="text-xs font-bold text-muted-foreground uppercase group-hover:text-primary transition-colors">독서 메모</p>
                  <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-300 ${memoOpen ? "rotate-180" : ""}`} />
                </button>
                {memoOpen && (
                  <div className="animate-in slide-in-from-top-2">
                    <Textarea
                      placeholder="이 책에 대한 생각이나 기억하고 싶은 문장을 자유롭게 적어보세요..."
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      className="min-h-[120px] bg-secondary/30 border-none rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-primary/20 resize-none p-4"
                    />
                  </div>
                )}
                {!memoOpen && memo && (
                  <div className="p-3 bg-secondary/20 rounded-xl border-l-4 border-primary/30">
                    <p className="text-sm text-muted-foreground italic line-clamp-2">"{memo}"</p>
                  </div>
                )}
              </div>

              <Button 
                onClick={() => toast.success("독서 기록이 안전하게 저장되었습니다!")} 
                className="w-full h-14 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                기록 저장하기
              </Button>
            </div>
          </div>
        </div>

        {/* 관련 도서 */}
        {related.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold tracking-tight">이런 책도 어떠세요?</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
              {related.slice(0, 6).map((b) => (
                <BookCard key={b.id} book={b} variant="compact" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
