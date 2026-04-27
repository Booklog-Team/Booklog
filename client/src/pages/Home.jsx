import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, ChevronRight, Moon, Sunrise, Coffee, MapPin, Thermometer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BookCard from "@/components/BookCard";
import { getBooksByGenre } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useWeather } from "@/contexts/WeatherContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";

// 온보딩 장르 ID → GENRE_MAP 키 매핑
const ONBOARDING_TO_GENRE = {
  소설: "소설",
  인문: "인문학",
  과학: "과학",
  경제: "경제 / 경영",
  자기계발: "자기계발",
  예술: "예술 / 대중문화",
  역사: "역사",
  아동: "어린이",
};

const KEYWORDS = ["소설", "자기계발", "인문학", "역사", "과학", "에세이"];


export default function Home() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { recommendation, weather, timeState } = useWeather();

  const [shelf, setShelf]               = useState([]);
  const [shelfLoading, setShelfLoading] = useState(true);
  const [recBooks, setRecBooks]         = useState([]);
  const [recLoading, setRecLoading]     = useState(true);
  const [, setRecError]                  = useState(false);
  const [weatherRecBooks, setWeatherRecBooks] = useState([]);
  const [weatherRecLoading, setWeatherRecLoading] = useState(true);
  const [recommendGenre, setRecommendGenre] = useState("소설");
  // 캐러셀 상태
  const [activeSlide, setActiveSlide] = useState(0);
  const totalSlides = 7;

  // 캐러셀 자동 전환
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // ── 서재 로드 ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setShelfLoading(false); return; }
    getDocs(collection(db, "users", user.uid, "shelf"))
      .then((snap) => setShelf(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => setShelf([]))
      .finally(() => setShelfLoading(false));
  }, [user]);

  // ── 일반 추천 도서 로드 (사용자 관심사 기반) ─────────────────
  useEffect(() => {
    let cancelled = false;
    const userGenres = (profile?.genres || [])
      .map((g) => ONBOARDING_TO_GENRE[g])
      .filter(Boolean);

    const genre = userGenres.length > 0
      ? userGenres[Math.floor(Math.random() * userGenres.length)]
      : "소설";

    setRecommendGenre(genre);
    setRecLoading(true);
    setRecError(false);

    getBooksByGenre(genre, 6)
      .then(({ items }) => { if (!cancelled) setRecBooks(items); })
      .catch(() => { if (!cancelled) setRecError(true); })
      .finally(() => { if (!cancelled) setRecLoading(false); });

    return () => { cancelled = true; };
  }, [profile]);

  // ── 날씨/시간 기반 추천 도서 로드 ───────────────────────────
  useEffect(() => {
    if (!recommendation?.genres?.length) return;

    let cancelled = false;
    // 날씨+시간 추천 장르 중 랜덤 선택, 랜덤 페이지로 매번 다른 책
    const genres = recommendation.genres;
    const genre = genres[Math.floor(Math.random() * genres.length)];
    const randomPage = Math.floor(Math.random() * 6) + 1;
    setWeatherRecLoading(true);

    getBooksByGenre(genre, 8, randomPage)
      .then(({ items }) => {
        if (!cancelled) {
          if (!items || items.length === 0) {
            // 해당 페이지 결과 없으면 1페이지로 재시도
            return getBooksByGenre(genre, 6, 1).then(({ items: fb }) => {
              if (!cancelled) setWeatherRecBooks([...fb].sort(() => Math.random() - 0.5));
            });
          }
          setWeatherRecBooks([...items].sort(() => Math.random() - 0.5));
        }
      })
      .catch(() => { if (!cancelled) setWeatherRecBooks([]); })
      .finally(() => { if (!cancelled) setWeatherRecLoading(false); });

    return () => { cancelled = true; };
  }, [recommendation]);

  const readingBooks  = shelf.filter((b) => b.status === "reading");
  const displayName  = profile?.nickname || user?.displayName || user?.email?.split("@")[0] || "독자";

  const toCardBook = (b) => ({
    ...b,
    id: b.id,
    title: b.title || b.volumeInfo?.title,
    author: b.author || b.volumeInfo?.authors?.join(", "),
    cover: b._cover || b.thumbnail || b.volumeInfo?.imageLinks?.thumbnail,
    status: b.status,
    currentPage: b.currentPage || 0,
    totalPages: b.totalPage || b.volumeInfo?.pageCount || 0,
    memo: b.memo || "",
  });

  const getTimeIcon = () => {
    switch (timeState) {
      case 'morning': return <Sunrise size={16} />;
      case 'afternoon': return <Coffee size={16} />;
      case 'evening': return <Moon size={16} />;
      case 'night': return <Moon size={16} />;
      default: return <Sunrise size={16} />;
    }
  };

  const getBackgroundImg = () => {
    if (timeState === 'night' || timeState === 'evening') return '/assets/weather/night.png';
    if (weather?.main === 'Rain') return '/assets/weather/rainy.png';
    return '/assets/weather/sunny.png';
  };

  return (
    <div className="pb-16">
      {/* 히어로 캐러셀 */}
      <div className="relative overflow-hidden rounded-[2.5rem] mb-6 mt-4 mx-4 h-100 shadow-xl group border border-border/40">
        <AnimatePresence>
          {activeSlide === 0 && (
            <motion.div
              key="default-slide"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663584969128/K9LDMhfUcVKdtMjF2S9GdE/booklog-hero-FbzG9jogJPcArmEM9bJ2RD.webp"
                className="w-full h-full object-cover"
                alt="디폴트 배경"
              />
              <div className="absolute inset-0 bg-black/40 backdrop-grayscale-[0.2]" />
              <div className="absolute inset-0 flex flex-col justify-end p-10">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/60 text-[10px] font-bold mb-2 tracking-[0.2em] uppercase"
                >
                  Welcome to Booklog
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tighter"
                >
                  나만의 따뜻한 라이브러리,<br />책과 함께하는 일상
                </motion.h1>
              </div>
            </motion.div>
          )}
          {activeSlide === 1 && (
            <motion.div
              key="weather-slide"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <img 
                src={getBackgroundImg()} 
                className="w-full h-full object-cover scale-110"
                alt="날씨 배경"
              />
              <div className={`absolute inset-0 transition-all duration-1000 ${
                timeState === 'night' || timeState === 'evening' 
                  ? 'bg-indigo-950/50' 
                  : 'bg-black/30'
              }`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              
              <div className="absolute inset-0 flex flex-col justify-end p-10">
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20 flex items-center gap-2 shadow-2xl">
                    <MapPin size={12} className="text-primary-foreground" />
                    {weather?.city || "위치 정보 없음"}
                  </div>
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20 flex items-center gap-2 shadow-2xl">
                    <Thermometer size={12} className="text-orange-400" />
                    {weather?.temp ?? "--"}°C
                  </div>
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20 flex items-center gap-2 shadow-2xl">
                    {getTimeIcon()} {recommendation?.timeLabel}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-end gap-6">
                  {!weatherRecLoading && weatherRecBooks && weatherRecBooks.length > 0 && (
                    <div className="flex gap-3 items-center flex-shrink-0">
                      {weatherRecBooks.slice(0, 2).map((book, idx) => (
                        <motion.div
                          key={book.id}
                          initial={{ opacity: 0, y: 30, rotate: -5 }}
                          animate={{ opacity: 1, y: 0, rotate: 0 }}
                          transition={{ delay: 0.2 + idx * 0.1, type: "spring", damping: 12 }}
                          onClick={() => navigate(`/book/${book.id}`)}
                          className="w-24 md:w-28 aspect-[2/3] relative cursor-pointer group/item"
                        >
                          <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg group-hover/item:bg-primary/30 transition-all" />
                          <img 
                            src={book._cover || book.volumeInfo?.imageLinks?.thumbnail} 
                            className="w-full h-full object-cover rounded-xl border border-white/40 shadow-2xl relative z-10 transition-all duration-500 group-hover/item:-translate-y-4 group-hover/item:scale-105"
                            alt={book.volumeInfo?.title}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 mb-2">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 tracking-tighter drop-shadow-2xl">
                        {recommendation?.vibe},<br />
                        {displayName}님께 드리는 추천
                      </h2>
                      <p className="text-[12px] text-white/70 font-medium tracking-tight bg-white/5 inline-block px-2 py-1 rounded-md backdrop-blur-sm">
                        지금 같은 {recommendation?.weatherLabel}에는 이런 이야기들이 어울려요.
                      </p>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── 데모 슬라이드 2: 비 오는 저녁 ── */}
          {activeSlide === 2 && (
            <motion.div
              key="slide-rain"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950" />
              <motion.div
                animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.15, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-tl from-blue-600/20 via-transparent to-indigo-500/10 blur-2xl"
              />
              <div className="absolute top-8 right-8 text-[6rem] leading-none opacity-15 select-none">🌧️</div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-10">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-2 mb-5">
                  <span className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20">🌧️ 비</span>
                  <span className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20">🌙 저녁</span>
                  <span className="px-3 py-1.5 bg-blue-400/20 backdrop-blur-xl rounded-full text-[10px] font-bold text-blue-200 border border-blue-400/30">소설 · 에세이</span>
                </motion.div>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tighter mb-2">
                  감성적이고 몽환적인,<br />빗소리와 함께하는 독서
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[12px] text-white/60 font-medium">
                  비 오는 날엔 소설 한 편이 딱이에요.
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* ── 데모 슬라이드 3: 고요한 새벽 ── */}
          {activeSlide === 3 && (
            <motion.div
              key="slide-dawn"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d2b] via-indigo-950 to-[#080820]" />
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3], x: [0, 20, 0], y: [0, -10, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-br from-violet-800/20 via-purple-900/15 to-transparent blur-3xl"
              />
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-px h-px bg-white rounded-full"
                  style={{ top: `${10 + Math.random() * 70}%`, left: `${5 + Math.random() * 90}%`, width: `${1 + Math.random() * 2}px`, height: `${1 + Math.random() * 2}px` }}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
                />
              ))}
              <div className="absolute top-6 right-8 text-[5rem] leading-none opacity-20 select-none">🌙</div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-10">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-2 mb-5">
                  <span className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20">🌙 새벽</span>
                  <span className="px-3 py-1.5 bg-violet-400/20 backdrop-blur-xl rounded-full text-[10px] font-bold text-violet-200 border border-violet-400/30">인문학 · 에세이</span>
                </motion.div>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tighter mb-2">
                  고요하고 사색적인,<br />새벽 2시의 독서
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[12px] text-white/60 font-medium">
                  세상이 잠든 새벽, 나만의 깊은 생각 속으로.
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* ── 데모 슬라이드 4: 맑은 아침 ── */}
          {activeSlide === 4 && (
            <motion.div
              key="slide-morning"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600" />
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-20 -right-20 w-80 h-80 bg-yellow-300/30 rounded-full blur-3xl"
              />
              <div className="absolute top-4 right-6 text-[7rem] leading-none opacity-20 select-none">☀️</div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-10">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-2 mb-5">
                  <span className="px-3 py-1.5 bg-white/20 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/30">☀️ 맑음</span>
                  <span className="px-3 py-1.5 bg-white/20 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/30">🌅 아침</span>
                  <span className="px-3 py-1.5 bg-amber-200/30 backdrop-blur-xl rounded-full text-[10px] font-bold text-amber-100 border border-amber-300/30">자기계발 · 경제</span>
                </motion.div>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tighter mb-2">
                  상쾌하고 활기찬,<br />오늘을 시작하는 아침 독서
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[12px] text-white/70 font-medium">
                  맑은 아침엔 성장을 위한 한 페이지로 시작해보세요.
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* ── 데모 슬라이드 5: 눈 오는 날 ── */}
          {activeSlide === 5 && (
            <motion.div
              key="slide-snow"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-sky-100 to-blue-200" />
              <motion.div
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-t from-blue-300/30 via-transparent to-sky-100/50 blur-xl"
              />
              {[...Array(16)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-white/60 text-xs select-none"
                  style={{ top: `-5%`, left: `${Math.random() * 100}%` }}
                  animate={{ y: ["0%", "110%"], opacity: [0, 1, 0] }}
                  transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 4, ease: "linear" }}
                >
                  ❄
                </motion.div>
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-10">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-2 mb-5">
                  <span className="px-3 py-1.5 bg-white/30 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/40">❄️ 눈</span>
                  <span className="px-3 py-1.5 bg-sky-200/30 backdrop-blur-xl rounded-full text-[10px] font-bold text-sky-100 border border-sky-300/30">소설 · 어린이</span>
                </motion.div>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tighter mb-2">
                  포근하고 따뜻한,<br />눈 쌓인 창가의 독서
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[12px] text-white/70 font-medium">
                  눈이 내리는 날엔 따뜻한 이야기가 어울려요.
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* ── 슬라이드 6: 명언 ── */}
          {activeSlide === 6 && (
            <motion.div
              key="quote-slide"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-[#1a1a1a]" />
              <motion.div
                animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl"
              />
              <div className="relative z-10 text-center px-10 max-w-lg">
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="text-primary/40 text-6xl font-serif mb-4 h-8 select-none">"</motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl md:text-2xl font-medium text-white/90 leading-[1.8] tracking-tight"
                  style={{ fontFamily: 'Georgia, "Nanum Myeongjo", serif' }}
                >
                  책은 한 권의 도끼여야 한다. <br />
                  우리 안의 얼어붙은 바다를 <br className="md:hidden" />
                  깨트리는 도끼여야 한다.
                </motion.h3>
                <motion.div initial={{ width: 0 }} animate={{ width: 40 }} transition={{ delay: 0.7, duration: 0.8 }} className="h-px bg-primary/30 mx-auto my-6" />
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-white/40 text-[10px] font-bold tracking-[0.4em] uppercase">Franz Kafka</motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 인디케이터 — 7개, 활성 슬라이드만 넓게 */}
        <div className="absolute bottom-6 left-10 flex gap-2 z-20">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`relative h-1 overflow-hidden rounded-full transition-all duration-300 ${
                activeSlide === i ? "w-8 bg-white/20" : "w-2 bg-white/25 hover:bg-white/40"
              }`}
            >
              {activeSlide === i && (
                <motion.div
                  key={activeSlide}
                  className="absolute inset-0 bg-primary"
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  transition={{ duration: 5, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 검색 바 - 글래스모피즘 스타일 */}
      <div className="px-6 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative group"
        >
          <button
            onClick={() => navigate("/search")}
            className="w-full flex items-center gap-4 bg-white/40 backdrop-blur-2xl border border-white/40 rounded-2xl px-6 h-14 text-muted-foreground hover:border-primary/40 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:shadow-[0_8px_30px_rgba(var(--primary),0.1)]"
          >
            <Search size={20} className="text-primary/70 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium tracking-tight">오늘은 어떤 이야기 속으로 떠나볼까요?</span>
          </button>
          
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {KEYWORDS.map((kw, idx) => (
              <motion.button
                key={kw}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + idx * 0.05 }}
                onClick={() => navigate(`/search?genre=${encodeURIComponent(kw)}`)}
                className="flex-shrink-0 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full text-[11px] font-bold shadow-sm border border-white/50 hover:bg-primary hover:text-white transition-all active:scale-95"
              >
                #{kw}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 도서 목록 섹션 */}
      <div className="space-y-12 px-6 pb-12">
        {/* 지금 읽고 있어요 */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tighter">지금 읽고 있어요</h2>
              <p className="text-xs text-muted-foreground font-medium mt-1">서재에서 당신을 기다리고 있는 이야기들</p>
            </div>
            <button onClick={() => navigate("/library")} className="p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
          {shelfLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="book-card flex gap-2.5 p-3">
                  <div className="w-11 h-[4.2rem] bg-secondary/40 rounded-lg animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-0.5">
                    <div className="h-2.5 bg-secondary/40 rounded animate-pulse w-full" />
                    <div className="h-2.5 bg-secondary/40 rounded animate-pulse w-3/4" />
                    <div className="h-2 bg-secondary/40 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {readingBooks.length > 0 ? (
                readingBooks.slice(0, 4).map((b, idx) => {
                  const book = toCardBook(b);
                  const pct = book.totalPages && book.currentPage
                    ? Math.round((book.currentPage / book.totalPages) * 100)
                    : null;
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.08 }}
                      className="book-card flex gap-2.5 p-3 cursor-pointer hover:bg-secondary/20 active:scale-[0.99] transition-all"
                      onClick={() => navigate(`/book/${b.id}`)}
                    >
                      <img
                        src={book.cover || "/placeholder.png"}
                        alt={book.title}
                        className="w-11 h-[4.2rem] object-cover rounded-lg shadow-sm flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-primary mb-0.5">읽는 중</p>
                        <p className="text-xs font-semibold line-clamp-2 leading-snug">{book.title}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{book.author}</p>
                        {pct !== null && (
                          <div className="mt-1.5 space-y-0.5">
                            <div className="flex justify-between text-[9px] text-muted-foreground">
                              <span>{book.currentPage}p</span>
                              <span className="text-primary font-bold">{pct}%</span>
                            </div>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-2 py-12 bg-secondary/20 rounded-[2.5rem] border-2 border-dashed border-border/40 text-center">
                  <BookOpen size={32} className="mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground font-bold">서재에 책을 담아 기록을 시작해보세요.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 나를 위한 추천 */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-black tracking-tighter">나를 위한 추천</h2>
                <span className="text-[9px] font-black text-white bg-primary px-2.5 py-0.5 rounded-full uppercase tracking-widest">{recommendGenre}</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">당신의 취향을 분석한 결과입니다.</p>
            </div>
            <button onClick={() => navigate(`/search?genre=${encodeURIComponent(recommendGenre)}`)} className="p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          {recLoading ? (
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {[...Array(6)].map((_, i) => <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {recBooks.slice(0, 6).map((book, idx) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, type: "spring", damping: 15 }}
                >
                  <BookCard book={book} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* 하단 커뮤니티 배너 */}
        <section className="mt-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-[2.5rem] overflow-hidden h-52 cursor-pointer group shadow-2xl border border-white/10" 
            onClick={() => navigate("/community")}
          >
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663584969128/K9LDMhfUcVKdtMjF2S9GdE/booklog-community-aKN2vqWuaiNSzYyJhpd5Mb.webp" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="커뮤니티" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent flex items-center p-10">
              <div className="max-w-xs">
                <p className="text-primary font-black text-[10px] mb-2 uppercase tracking-widest">Connect with Readers</p>
                <h3 className="text-white font-black text-2xl leading-tight mb-5">혼자보다는 함께,<br />더 깊은 독서 경험</h3>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-2xl text-[11px] font-black hover:bg-primary hover:text-white transition-all shadow-2xl active:scale-95">
                  입장하기 <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
