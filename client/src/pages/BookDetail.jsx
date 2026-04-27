import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import {
  ArrowLeft, Star, ChevronDown, Check,
  BookOpen, PenLine, Loader2, AlertCircle, ShoppingCart, Share2, Clock, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import BookCard from "@/components/BookCard";
import { getBookDetail, searchBooks, getHighQualityCover } from "@/utils/api";
import { doc, getDoc, setDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { usePoint } from "@/contexts/PointContext";

const STATUS_OPTIONS = [
  { value: "reading", label: "읽는 중",   emoji: "📖" },
  { value: "want",    label: "읽고 싶음", emoji: "🔖" },
  { value: "done",    label: "완독",      emoji: "✅" },
];

const STATUS_CLASS = {
  want:    "bg-amber-100 text-amber-700 border-amber-300",
  reading: "bg-primary/10 text-primary border-primary/30",
  done:    "bg-emerald-100 text-emerald-700 border-emerald-300",
};

// ── 최근 본 도서 localStorage 헬퍼 ───────────────────────────
const RECENT_KEY = "booklog_recent_books";
const MAX_RECENT = 10;

function saveRecentBook(book) {
  try {
    const info = book.volumeInfo || {};
    const entry = {
      id: book.id,
      title: info.title || "제목 없음",
      cover: book._cover || null,
      author: info.authors?.[0] || "",
    };
    const prev = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    const filtered = prev.filter((b) => b.id !== entry.id);
    localStorage.setItem(RECENT_KEY, JSON.stringify([entry, ...filtered].slice(0, MAX_RECENT)));
  } catch { /* 무시 */ }
}

function getRecentBooks(excludeId) {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").filter((b) => b.id !== excludeId);
  } catch { return []; }
}

const REGION_MAP = {
  // 축약형
  서울: 11, 부산: 21, 대구: 22, 인천: 23, 광주: 24,
  대전: 25, 울산: 26, 세종: 29, 경기: 31, 강원: 32,
  충북: 33, 충남: 34, 전북: 35, 전남: 36, 경북: 37,
  경남: 38, 제주: 39,
  // 정식 행정구역명 (Google Geocoding API 응답값)
  서울특별시: 11, 부산광역시: 21, 대구광역시: 22, 인천광역시: 23,
  광주광역시: 24, 대전광역시: 25, 울산광역시: 26, 세종특별자치시: 29,
  경기도: 31, 강원도: 32, 강원특별자치도: 32,
  충청북도: 33, 충청남도: 34, 전라북도: 35, 전북특별자치도: 35,
  전라남도: 36, 경상북도: 37, 경상남도: 38, 제주특별자치도: 39,
};

async function geocodeToRegion(lat, lng) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}&language=ko`
  );
  const data = await res.json();
  console.log("[geocodeToRegion] API 전체 응답:", data);

  const results = data.results || [];
  console.log("[geocodeToRegion] results 개수:", results.length);

  for (const result of results) {
    const components = result.address_components || [];
    const province = components.find(c => c.types.includes("administrative_area_level_1"));
    if (!province) continue;

    const fullName = province.long_name;
    const shortName = fullName.replace(/특별시|광역시|특별자치시|특별자치도|도$/, "").trim();
    console.log("[geocodeToRegion] 추출된 지역명:", { fullName, shortName }, "/ result 인덱스:", results.indexOf(result));
    const code = REGION_MAP[fullName] ?? REGION_MAP[shortName];
    console.log("[geocodeToRegion] REGION_MAP 매핑 결과:", code ?? "매핑 없음");
    if (code) return code;
  }

  console.error("[geocodeToRegion] 모든 results에서 administrative_area_level_1 미발견");
  return null;
}

// ── DetailCover ───────────────────────────────────────────────
function DetailCover({ src, alt }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setFailed(false);
  }, [src]);

  const handleError = () => {
    if (imgSrc?.includes("/coverBig/")) {
      setImgSrc(imgSrc.replace("/coverBig/", "/cover200/"));
    } else {
      setFailed(true);
    }
  };

  if (!src || failed) {
    return (
      <div className="w-[148px] h-[215px] rounded-xl shadow-md flex-shrink-0 bg-secondary flex items-center justify-center">
        <BookOpen size={36} className="text-muted-foreground/30" />
      </div>
    );
  }
  return (
    <img
      src={imgSrc}
      alt={alt}
      className="w-[148px] h-[215px] object-cover rounded-xl shadow-md flex-shrink-0"
      onError={handleError}
    />
  );
}

// ── RatingStars ───────────────────────────────────────────────
function RatingStars({ rating }) {
  const stars = Math.round(rating / 2);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} size={13}
            className={s <= stars ? "fill-amber-400 text-amber-400" : "text-border"}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-amber-600">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">/ 10</span>
    </div>
  );
}

// ── RecentBookCard ────────────────────────────────────────────
function RecentBookCard({ book, onClick }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <button onClick={onClick} className="flex flex-col gap-1.5 text-left active:scale-95 transition-transform">
      {book.cover && !imgFailed ? (
        <img
          src={book.cover}
          alt={book.title}
          className="w-full aspect-[2/3] object-cover rounded-lg shadow-sm"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="w-full aspect-[2/3] bg-secondary rounded-lg flex items-center justify-center">
          <BookOpen size={16} className="text-muted-foreground/30" />
        </div>
      )}
      <p className="text-xs font-medium line-clamp-2 leading-snug">{book.title}</p>
      <p className="text-[10px] text-muted-foreground line-clamp-1">{book.author}</p>
    </button>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addPoint } = usePoint();

  const [book, setBook]         = useState(null);
  const [related, setRelated]   = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState(null);
  const [saving, setSaving]     = useState(false);

  const [status, setStatus]           = useState(null);
  const [savedStatus, setSavedStatus] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [memo, setMemo]               = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [rating, setRating]           = useState(0);
  const [memoOpen, setMemoOpen]       = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [previewIdx, setPreviewIdx]   = useState(0);
  const previewRef = useRef(null);

  const [libState, setLibState]               = useState("idle");
  const [libraries, setLibraries]             = useState([]);
  const [selectedLibCode, setSelectedLibCode] = useState(null);
  const [libAvail, setLibAvail]               = useState({});

  // ── 도서 로드 ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      setStatus(null);
      setSavedStatus(null);
      setCurrentPage(0);
      setMemo("");
      setRating(0);
      setLibState("idle");
      setLibraries([]);
      setSelectedLibCode(null);
      setLibAvail({});

      try {
        const data = await getBookDetail(id);
        if (cancelled) return;
        setBook(data);
        saveRecentBook(data);
        setRecentBooks(getRecentBooks(id));

        // Firestore 서재에서 기존 기록 로드
        if (user) {
          getDoc(doc(db, "users", user.uid, "shelf", id))
            .then((snap) => {
              if (!cancelled && snap.exists()) {
                const d = snap.data();
                if (d.status)      { setStatus(d.status); setSavedStatus(d.status); }
                if (d.currentPage) setCurrentPage(d.currentPage);
                if (d.memo)        setMemo(d.memo);
                if (d.rating)      setRating(d.rating);
              }
            })
            .catch(() => {});
        }

        // 관련 도서 (저자 + 제목 키워드 병렬 검색)
        const firstAuthor  = data.volumeInfo?.authors?.[0];
        const titleKeyword = data.volumeInfo?.title?.split(/\s+/).slice(0, 2).join(" ");
        const queries = [...new Set([firstAuthor, titleKeyword].filter(Boolean))];
        if (queries.length > 0) {
          Promise.allSettled(queries.map((q) => searchBooks(q, { start: 1 })))
            .then((results) => {
              if (cancelled) return;
              const seen = new Set([id]);
              const merged = [];
              for (const r of results) {
                if (r.status === "fulfilled") {
                  for (const b of r.value.items) {
                    if (!seen.has(b.id)) { seen.add(b.id); merged.push(b); }
                  }
                }
              }
              setRelated(merged.slice(0, 6));
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
  }, [id, user]);

  // ── 완독 축하 confetti ────────────────────────────────────
  const fireCompletionConfetti = () => {
    const colors = ["#ff6b9d", "#c084fc", "#60a5fa", "#34d399", "#fbbf24", "#f97316"];
    const burst = (origin, angle) =>
      confetti({ particleCount: 60, angle, spread: 70, origin, colors, scalar: 1.1 });

    burst({ x: 0.5, y: 0.6 }, 90);
    setTimeout(() => { burst({ x: 0.2, y: 0.7 }, 60); burst({ x: 0.8, y: 0.7 }, 120); }, 250);
    setTimeout(() => { burst({ x: 0.35, y: 0.55 }, 75); burst({ x: 0.65, y: 0.55 }, 105); }, 550);
    setTimeout(() => { burst({ x: 0.5, y: 0.5 }, 90); }, 850);
  };

  // ── 기록 저장 ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) { toast.error("로그인이 필요합니다."); return; }
    if (!status) { toast.error("상태를 먼저 선택해주세요."); return; }

    setSaving(true);
    const isFirstCompletion = status === "done" && savedStatus !== "done";
    const today = new Date().toISOString().slice(0, 10);
    try {
      const info = book.volumeInfo || {};
      const payload = {
        title:       info.title || "제목 없음",
        author:      info.authors?.[0] || "",
        thumbnail:   book._cover || "",
        status,
        currentPage,
        totalPage:   info.pageCount || 0,
        memo,
        rating,
        lastReadDate: today,
      };
      if (status === "reading" || status === "done") {
        payload.checkedDates = arrayUnion(today);
      }
      await setDoc(doc(db, "users", user.uid, "shelf", id), payload, { merge: true });
      setSavedStatus(status);
      if (isFirstCompletion) {
        fireCompletionConfetti();
        toast.success("🎉 완독을 축하드려요!");
      } else {
        toast.success("독서 기록이 저장되었습니다!");
      }
      // 포인트 적립 — addPoint 내부에서 하루 1회 중복 체크
      if (status === "reading" || status === "done") addPoint("reading_check").catch(() => {});
      if (memo.trim()) addPoint("memo").catch(() => {});
    } catch (err) {
      console.error(err);
      toast.error("저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  // ── 공유 ──────────────────────────────────────────────────
  const handleShare = async () => {
    const info = book?.volumeInfo || {};
    const shareData = {
      title: info.title || "도서 공유",
      text:  `📚 ${info.title} - ${info.authors?.[0] || ""}`,
      url:   book?._link || window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast.success("링크가 클립보드에 복사되었습니다!");
      }
    } catch { /* 취소 시 무시 */ }
  };

  const handleFindLibraries = async () => {
    if (!navigator.geolocation) {
      toast.error("위치 서비스를 지원하지 않는 브라우저입니다.");
      return;
    }
    setLibState("loading");
    setLibraries([]);
    setSelectedLibCode(null);
    setLibAvail({});
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      console.log("[handleFindLibraries] 위치 획득:", pos.coords.latitude, pos.coords.longitude);

      const regionCode = await geocodeToRegion(pos.coords.latitude, pos.coords.longitude);
      console.log("[handleFindLibraries] geocodeToRegion 반환값:", regionCode, "/ 타입:", typeof regionCode);

      if (!regionCode) {
        console.error("[handleFindLibraries] regionCode가 falsy → 지역 인식 실패");
        throw new Error("지역 정보를 인식하지 못했습니다.");
      }

      const LKEY = import.meta.env.VITE_LIBRARY_API_KEY;
      const isbn = book._isbn13;
      const url = `/api/library/api/libSrchByBook?authKey=${LKEY}&isbn=${isbn}&region=${regionCode}&format=json`;
      console.log("[handleFindLibraries] 도서관 API URL:", url);
      console.log("[handleFindLibraries] ISBN13:", isbn, "/ LKEY 존재:", !!LKEY);

      const r = await fetch(url);
      console.log("[handleFindLibraries] 응답 status:", r.status, "/ ok:", r.ok);

      const d = await r.json();
      console.log("[handleFindLibraries] response 전체:", JSON.stringify(d.response, null, 2));

      // 정보나루 API 응답 구조: response.libs = [{ lib: {...} }, ...]
      const libs = d.response?.libs;
      const raw = Array.isArray(libs) ? libs.map(item => item.lib).filter(Boolean) : [];
      console.log("[handleFindLibraries] 추출된 lib 목록:", raw);
      setLibraries(raw);
      setLibState("done");

      // 전체 도서관 소장/대출 일괄 조회
      if (isbn && raw.length > 0) {
        raw.forEach(lib => {
          fetch(`/api/library/api/bookExist?authKey=${LKEY}&libCode=${lib.libCode}&isbn13=${isbn}&format=json`)
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(data => {
              const result = data.response?.result;
              setLibAvail(prev => ({
                ...prev,
                [lib.libCode]: { hasBook: result?.hasBook === "Y", loanAvail: result?.loanAvailable === "Y" },
              }));
            })
            .catch(() => setLibAvail(prev => ({ ...prev, [lib.libCode]: null })));
        });
      }
    } catch (err) {
      console.error("[handleFindLibraries] catch 발생 — message:", err.message, "/ code:", err.code, "/ err:", err);
      const isGeoBlocked = err instanceof GeolocationPositionError && err.code === 1;
      toast.error(isGeoBlocked ? "위치 접근이 거부되었습니다." : err.message || "도서관 정보를 가져오지 못했습니다.");
      setLibState("error");
    }
  };

  const handleLibraryClick = (lib) => {
    setSelectedLibCode(prev => prev === lib.libCode ? null : lib.libCode);
  };

  // ── 로딩 / 에러 ──────────────────────────────────────────
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

  const info         = book.volumeInfo || {};
  const title        = info.title || "제목 없음";
  const authors      = info.authors || [];
  const author       = authors.join(", ") || "저자 정보 없음";
  const cover        = getHighQualityCover(book._cover);
  const publisher    = info.publisher || "";
  const publishYear  = info.publishedDate ? info.publishedDate.split("-")[0] : "";
  const totalPages   = info.pageCount || 0;
  const genres       = info.categories || [];
  const aladinPrice  = book._price || 0;
  const aladinLink   = book._link;
  const aladinRating = book._rating || 0;
  const description  = info.description?.replace(/<[^>]*>/g, "") || "";
  const isLongDesc   = description.length > 200;
  const previewImages = book._previewImages || [];

  const isbn13      = book._isbn13 || null;
  const selectedLib = libraries.find((l) => l.libCode === selectedLibCode) ?? null;
  const progress    = totalPages ? Math.round((currentPage / totalPages) * 100) : 0;

  return (
    <div>
      {/* ── 헤더 ── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/20">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-full transition-colors">
          <ArrowLeft size={22} />
        </button>
        <span className="text-sm font-black tracking-widest uppercase opacity-40">Detail</span>
        <button onClick={handleShare} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-primary transition-colors">
          <Share2 size={20} />
        </button>
      </div>

      <div className="px-4 py-5 space-y-4 animate-fade-in pb-12">

        {/* ── 도서 정보 카드 ── */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex gap-4 mb-4">
            <DetailCover src={cover} alt={title} />
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="space-y-2">
                <h2 className="text-lg font-bold leading-snug">{title}</h2>
                {/* 저자 클릭 → 저자 검색 */}
                <div className="flex flex-wrap gap-1">
                  {authors.length > 0 ? authors.map((a, i) => (
                    <button
                      key={a}
                      onClick={() => navigate(`/search?q=${encodeURIComponent(a)}`)}
                      className="text-sm text-primary/80 hover:text-primary hover:underline font-medium"
                    >
                      {a}{i < authors.length - 1 ? "," : ""}
                    </button>
                  )) : (
                    <span className="text-sm text-muted-foreground">{author}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground/80">
                  {publisher && <span>{publisher}</span>}
                  {publisher && publishYear && <span>•</span>}
                  {publishYear && <span>{publishYear}년</span>}
                  {totalPages > 0 && <><span>•</span><span>{totalPages}p</span></>}
                </div>
                {aladinRating > 0 && <RatingStars rating={aladinRating} />}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {genres.map((g) => (
                    <span key={g} className="px-2.5 py-0.5 bg-secondary text-muted-foreground text-[11px] rounded-full border border-border/60">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              {aladinPrice > 0 && (
                <div className="mt-auto pt-2">
                  <p className="text-sm text-muted-foreground font-medium">판매가</p>
                  <p className="text-2xl font-black text-primary leading-tight">
                    {aladinPrice.toLocaleString()}<span className="text-base font-bold ml-0.5">원</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {aladinLink && (
            <a
              href={aladinLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground w-full h-12 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
            >
              <ShoppingCart size={16} />
              알라딘에서 구매하기
            </a>
          )}
        </div>

        {/* ── 미리보기 이미지 갤러리 ── */}
        {previewImages.length > 0 && (
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-muted-foreground mb-3">미리보기</p>
            <div
              ref={previewRef}
              className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory"
            >
              {previewImages.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`미리보기 ${i + 1}`}
                  onClick={() => setPreviewIdx(i)}
                  className={`flex-shrink-0 h-48 w-auto rounded-lg object-contain cursor-pointer snap-start border-2 transition-all ${
                    previewIdx === i ? "border-primary shadow-md" : "border-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── 책 소개 카드 ── */}
        {description && (
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-muted-foreground mb-3">책 소개</p>
            <p className={`text-sm text-foreground/80 leading-relaxed ${!descExpanded && isLongDesc ? "line-clamp-6" : ""}`}>
              {description}
            </p>
            {isLongDesc && (
              <button onClick={() => setDescExpanded(!descExpanded)} className="text-xs text-primary font-bold mt-3 hover:underline">
                {descExpanded ? "접기 ↑" : "더보기 ↓"}
              </button>
            )}
          </div>
        )}

        {/* ── 나의 독서 기록 카드 ── */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-5">
          <h3 className="text-base font-bold flex items-center gap-2">
            <PenLine size={17} className="text-primary" />
            나의 독서 기록
          </h3>

          {/* 현재 상태 */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">현재 상태</p>
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  status ? STATUS_CLASS[status] : "bg-secondary/50 border-border text-muted-foreground"
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
                  <button
                    onClick={() => { setStatus(null); setShowStatusMenu(false); }}
                    className="w-full flex items-center justify-between px-4 py-4 text-sm font-medium hover:bg-secondary transition-colors border-b border-border/30 text-muted-foreground"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg">—</span>
                      상태를 선택해 주세요
                    </span>
                    {status === null && <Check size={18} className="text-primary" />}
                  </button>
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

          {/* 읽은 페이지 & 별점 */}
          {(status === "reading" || status === "done") && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <p className="text-muted-foreground">읽은 페이지</p>
                  <span className="text-primary font-bold">{progress}%</span>
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
                  <span className="text-sm text-muted-foreground">/ {totalPages || "?"} p</span>
                </div>
              </div>

              {/* 진행률 공유 버튼 (읽는 중일 때) */}
              {status === "reading" && (
                <button
                  onClick={async () => {
                    const text = `📖 "${title}" ${progress}% 읽었어요! (${currentPage}/${totalPages || "?"}p)`;
                    try {
                      if (navigator.share) {
                        await navigator.share({ title, text, url: aladinLink || window.location.href });
                      } else {
                        await navigator.clipboard.writeText(text);
                        toast.success("진행률이 클립보드에 복사되었습니다!");
                      }
                    } catch { /* 취소 */ }
                  }}
                  className="flex items-center gap-2 text-xs text-primary font-medium hover:underline"
                >
                  <Share2 size={13} />
                  독서 진행률 공유하기
                </button>
              )}

              {status === "done" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">나의 평점</p>
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

          {/* 독서 메모 */}
          <div className="space-y-3">
            <button onClick={() => setMemoOpen(!memoOpen)} className="w-full flex items-center justify-between">
              <p className="text-sm text-muted-foreground">독서 메모</p>
              <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-300 ${memoOpen ? "rotate-180" : ""}`} />
            </button>
            {memoOpen && (
              <div className="animate-in slide-in-from-top-2">
                <Textarea
                  placeholder="이 책에 대한 생각이나 기억하고 싶은 문장을 자유롭게 적어보세요..."
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="min-h-[120px] bg-secondary/30 border-none rounded-xl text-sm resize-none p-4"
                />
              </div>
            )}
            {!memoOpen && memo && (
              <p className="text-sm text-muted-foreground italic line-clamp-2 px-1">"{memo}"</p>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 text-base font-bold rounded-xl"
          >
            {saving ? <><Loader2 size={16} className="animate-spin mr-2" />저장 중...</> : "기록 저장하기"}
          </Button>
        </div>

        {/* ── 내 주변 도서관 ── */}
        <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold flex items-center gap-2">
            <MapPin size={17} className="text-primary" />
            내 주변 도서관
          </h3>
          {!isbn13 ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              도서관 정보를 조회할 수 없습니다.
            </p>
          ) : libState === "loading" ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <Loader2 size={24} className="text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">주변 도서관 검색 중...</p>
            </div>
          ) : libState === "done" ? (
            <div className="space-y-3">
              {libraries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">
                  주변에 이 책을 소장한 도서관이 없습니다.
                </p>
              ) : (
                <>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {libraries.map((lib) => {
                      const avail = libAvail[lib.libCode];
                      const isSelected = selectedLibCode === lib.libCode;
                      return (
                        <button
                          key={lib.libCode}
                          onClick={() => handleLibraryClick(lib)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                            isSelected
                              ? "border-primary/60 bg-primary/5"
                              : "border-border/50 bg-background hover:border-primary/30 hover:bg-secondary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{lib.libName}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{lib.address}</p>
                            </div>
                            <div className="flex flex-col items-end gap-0.5 flex-shrink-0 text-xs font-medium">
                              {avail === undefined && (
                                <Loader2 size={13} className="animate-spin text-muted-foreground" />
                              )}
                              {avail === null && (
                                <span className="text-muted-foreground">조회 실패</span>
                              )}
                              {avail && (
                                <>
                                  <span className={avail.hasBook ? "text-emerald-600" : "text-red-500"}>
                                    {avail.hasBook ? "소장 ✅" : "미소장 ❌"}
                                  </span>
                                  {avail.hasBook && (
                                    <span className={avail.loanAvail ? "text-emerald-600" : "text-amber-500"}>
                                      {avail.loanAvail ? "대출가능 ✅" : "대출중 ❌"}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedLib && (
                    <div className="rounded-xl overflow-hidden border border-border/50">
                      <iframe
                        title="도서관 위치"
                        width="100%"
                        height="220"
                        className="border-0"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(
                          selectedLib.address || selectedLib.libName
                        )}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`}
                      />
                    </div>
                  )}
                </>
              )}
              <button
                onClick={handleFindLibraries}
                className="text-xs text-primary font-medium hover:underline"
              >
                다시 검색
              </button>
            </div>
          ) : (
            <button
              onClick={handleFindLibraries}
              className="w-full h-12 rounded-xl border border-primary/40 text-primary text-sm font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
            >
              <MapPin size={16} />
              내 주변 도서관에서 찾기
            </button>
          )}
        </section>

        {/* ── 관련 도서 ── */}
        {related.length > 0 && (
          <section className="pt-2">
            <h3 className="text-base font-bold mb-4">관련 도서</h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {related.map((b) => (
                <BookCard key={b.id} book={b} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {/* ── 최근 본 도서 ── */}
        {recentBooks.length > 0 && (
          <section className="pt-2">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Clock size={15} className="text-muted-foreground" />
              최근 본 도서
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {recentBooks.slice(0, 6).map((b) => (
                <RecentBookCard key={b.id} book={b} onClick={() => navigate(`/book/${b.id}`)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
