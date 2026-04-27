import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, ChevronRight, Moon, Sunrise, Coffee, MapPin, Thermometer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BookCard from "@/components/BookCard";
import { getBooksByGenre, searchBooks } from "@/utils/api";
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

// 데모 슬라이드 애니메이션 데이터 — Math.random 대신 인덱스 기반으로 고정해 리렌더 시 튀지 않음
const RAIN_DROPS = Array.from({ length: 44 }, (_, i) => ({
  id: i,
  left: (i * 2.29) % 100,
  height: 12 + (i * 9) % 24,
  duration: 0.45 + (i * 0.025) % 0.45,
  delay: (i * 0.22) % 1.9,
}));
const STARS = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  top: 5 + (i * 13) % 65,
  left: 3 + (i * 19) % 90,
  size: 0.9 + (i % 4) * 0.8,
  duration: 1.4 + (i * 0.38) % 2.8,
  delay: (i * 0.55) % 3.5,
}));
const SHOOTING_STARS = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  top: 10 + (i * 15) % 50,
  width: 70 + (i * 30) % 120,
  duration: 0.8 + (i * 0.2) % 1.2,
  delay: i * 2, 
  repeatDelay: 3 + (i * 1.5) % 5, 
}));
const SNOW_FLAKES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: (i * 3.58) % 100,
  size: 4 + (i % 5) * 2.2,
  duration: 5 + (i % 6) * 1.8,
  delay: (i * 0.65) % 5.5,
  drift: ((i % 7) - 3) * 15,
  opacity: 0.5 + (i % 4) * 0.12,
}));

// 날씨·시간 무드별 알라딘 검색 키워드 — 장르 ID 대신 실제 감성 키워드로 검색
const MOOD_KEYWORDS = {
  // 날씨별
  Rain:         ["비 오는 날 소설", "감성 소설", "빗소리 에세이"],
  Drizzle:      ["서정 에세이", "잔잔한 소설", "감성 소설"],
  Thunderstorm: ["스릴러 소설", "긴장감 심리", "서스펜스 소설"],
  Snow:         ["겨울 소설", "따뜻한 이야기", "포근한 에세이"],
  Clear:        ["여행 에세이", "긍정 에너지 자기계발", "활기찬 소설"],
  Clouds:       ["사색 에세이", "철학 인문", "깊이 있는 소설"],
  // 시간대별
  dawn:         ["새벽 감성 소설", "고독 에세이", "불면 소설"],
  morning:      ["아침 동기부여", "성공 습관 자기계발", "하루 루틴"],
  afternoon:    ["여유로운 소설", "힐링 에세이", "여행기"],
  evening:      ["저녁 인문 에세이", "사색 소설", "역사 이야기"],
  night:        ["밤 소설", "미스터리 소설", "철학적 에세이"],
};

// 날씨+시간 조합에서 검색 키워드 픽 (weather 우선, 시간 보조)
function pickMoodKeyword(weatherMain, timeState) {
  const wList = MOOD_KEYWORDS[weatherMain] || [];
  const tList = MOOD_KEYWORDS[timeState]   || [];
  const merged = [...wList, ...tList];
  if (!merged.length) return "감성 소설";
  return merged[Math.floor(Math.random() * merged.length)];
}

// 데모 슬라이드 고정 무드 키워드
const DEMO_MOOD = {
  rain:    ["비 오는 날 소설", "감성 소설", "빗소리 에세이"],
  dawn:    ["새벽 감성 소설", "고독 에세이", "깊은 밤 소설"],
  morning: ["아침 동기부여", "성공 습관 자기계발", "하루 루틴"],
  snow:    ["겨울 소설", "따뜻한 이야기", "포근한 에세이"],
};

const QUOTES = [
  {
    lines: ["책은 한 권의 도끼여야 한다.", "우리 안의 얼어붙은 바다를", "깨트리는 도끼여야 한다."],
    author: "프란츠 카프카",
    bg: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80",
    imgFilter: "brightness(0.42) saturate(0.65)",
    tint: "bg-[#060614]/55",
    blob: "from-indigo-500/25 via-purple-500/20 to-pink-500/15",
    accent: "text-purple-400/60",
    particles: "stars",
  },
  {
    lines: ["독서는 완성된 사람을 만들고,", "대화는 재치 있는 사람을 만들며,", "글쓰기는 정확한 사람을 만든다."],
    author: "프랜시스 베이컨",
    bg: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80",
    imgFilter: "brightness(0.35) saturate(0.6)",
    tint: "bg-amber-950/45",
    blob: "from-amber-500/25 via-orange-500/20 to-yellow-400/15",
    accent: "text-amber-300/70",
    particles: "rays",
  },
  {
    lines: ["책을 읽는다는 것은", "자신의 삶을 사는 것 외에", "또 다른 삶을 사는 것이다."],
    author: "오스카 와일드",
    bg: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=1200&q=80",
    imgFilter: "brightness(0.3) saturate(0.45) hue-rotate(200deg)",
    tint: "bg-slate-950/50",
    blob: "from-cyan-500/15 via-blue-500/20 to-teal-400/10",
    accent: "text-cyan-300/65",
    particles: "rain",
  },
  {
    lines: ["어떤 책은 맛보고,", "어떤 책은 삼켜야 하고,", "소수만이 씹어서 소화해야 한다."],
    author: "프랜시스 베이컨",
    bg: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80",
    imgFilter: "brightness(0.38) saturate(0.5)",
    tint: "bg-violet-950/52",
    blob: "from-violet-500/25 via-fuchsia-500/20 to-purple-400/15",
    accent: "text-violet-300/65",
    particles: "stars",
  },
];

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
  const [bestBooks, setBestBooks] = useState([]);
  const [bestLoading, setBestLoading] = useState(true);
  // 데모 슬라이드별 독립 도서 (무드에 맞는 장르 고정)
  const [demoSlideBooks, setDemoSlideBooks] = useState({ rain: [], dawn: [], morning: [], snow: [] });
  // 캐러셀 상태
  const [activeSlide, setActiveSlide] = useState(0);
  const totalSlides = 7;
  // 글귀 슬라이드 순환
  const [quoteIndex, setQuoteIndex] = useState(0);
  const quoteVisitRef = useRef(0);

  // 슬라이드 6이 보일 때마다 다른 글귀로 순환
  useEffect(() => {
    if (activeSlide === 6) {
      setQuoteIndex(quoteVisitRef.current);
      quoteVisitRef.current = (quoteVisitRef.current + 1) % QUOTES.length;
    }
  }, [activeSlide]);

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

    const recPage = Math.floor(Math.random() * 8) + 1;
    getBooksByGenre(genre, 6, recPage)
      .then(({ items }) => {
        if (!cancelled) {
          if (!items || items.length === 0) {
            return getBooksByGenre(genre, 6, 1).then(({ items: fb }) => {
              if (!cancelled) setRecBooks(fb);
            });
          }
          setRecBooks(items);
        }
      })
      .catch(() => { if (!cancelled) setRecError(true); })
      .finally(() => { if (!cancelled) setRecLoading(false); });

    return () => { cancelled = true; };
  }, [profile]);

  // ── 날씨/시간 기반 추천 도서 로드 (무드 키워드 검색) ──────────
  useEffect(() => {
    if (!weather && !timeState) return;

    let cancelled = false;
    setWeatherRecLoading(true);

    const keyword = pickMoodKeyword(weather?.main, timeState);
    searchBooks(keyword, { start: 1, maxResults: 8 })
      .then(({ items }) => {
        if (!cancelled) {
          if (!items || items.length === 0) {
            // 키워드 결과 없으면 "감성 소설" 폴백
            return searchBooks("감성 소설", { start: 1, maxResults: 6 }).then(({ items: fb }) => {
              if (!cancelled) setWeatherRecBooks([...fb].sort(() => Math.random() - 0.5));
            });
          }
          setWeatherRecBooks([...items].sort(() => Math.random() - 0.5));
        }
      })
      .catch(() => { if (!cancelled) setWeatherRecBooks([]); })
      .finally(() => { if (!cancelled) setWeatherRecLoading(false); });

    return () => { cancelled = true; };
  }, [weather?.main, timeState]);

  // ── 베스트셀러 도서 로드 ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    getBooksByGenre("베스트셀러", 10, 1)
      .then(({ items }) => { if (!cancelled) setBestBooks(items); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBestLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── 데모 슬라이드별 무드 맞춤 도서 로드 ──────────────────────
  // 각 슬라이드 분위기에 맞는 장르를 고정 — 만화/어린이 등 부적합 장르 배제
  useEffect(() => {
    let cancelled = false;
    const rp = () => Math.floor(Math.random() * 6) + 1;
    Promise.all([
      getBooksByGenre("소설",      3, rp()),  // 비 오는 저녁 — 감성 소설
      getBooksByGenre("에세이",    3, rp()),  // 고요한 새벽 — 사색 에세이
      getBooksByGenre("자기계발",  3, rp()),  // 맑은 아침 — 자기계발
      getBooksByGenre("인문학",    3, rp()),  // 눈 오는 날 — 따뜻한 인문
    ]).then(([rain, dawn, morning, snow]) => {
      if (!cancelled) {
        setDemoSlideBooks({
          rain:    rain.items.slice(0, 2),
          dawn:    dawn.items.slice(0, 2),
          morning: morning.items.slice(0, 2),
          snow:    snow.items.slice(0, 2),
        });
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

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
    if (weather?.main === 'Snow') return '/assets/weather/snowy_window.png';
    if (timeState === 'night' || timeState === 'evening') return '/assets/weather/night.png';
    if (weather?.main === 'Rain' || weather?.main === 'Drizzle' || weather?.main === 'Thunderstorm') return '/assets/weather/rainy.png';
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
              className="absolute inset-0 overflow-hidden"
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
              {/* 비/이슬비/천둥 → 빗방울 */}
              {(weather?.main === 'Rain' || weather?.main === 'Drizzle' || weather?.main === 'Thunderstorm') && RAIN_DROPS.map((drop) => (
                <motion.div
                  key={drop.id}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: "1.5px", height: `${drop.height}px`, left: `${drop.left}%`, top: "-4%",
                    background: "linear-gradient(to bottom, transparent, rgba(147,197,253,0.8), transparent)",
                    transform: "rotate(14deg)",
                  }}
                  animate={{ y: ["0vh", "115vh"] }}
                  transition={{ duration: drop.duration, repeat: Infinity, delay: drop.delay, ease: "linear" }}
                />
              ))}
              {/* 천둥 → 번개 플래시 */}
              {weather?.main === 'Thunderstorm' && (
                <motion.div
                  className="absolute inset-0 bg-white/5 pointer-events-none"
                  animate={{ opacity: [0, 0, 0, 0.3, 0, 0.15, 0, 0] }}
                  transition={{ duration: 9, repeat: Infinity, delay: 3, ease: "easeOut" }}
                />
              )}
              {/* 눈 → 눈송이 */}
              {weather?.main === 'Snow' && SNOW_FLAKES.map((flake) => (
                <motion.div
                  key={flake.id}
                  className="absolute rounded-full bg-white pointer-events-none"
                  style={{ width: `${flake.size}px`, height: `${flake.size}px`, left: `${flake.left}%`, top: "-5%", opacity: 0.75 }}
                  animate={{ y: ["0vh", "110vh"], x: [0, flake.drift, 0], opacity: [0, 0.85, 0.7, 0] }}
                  transition={{ duration: flake.duration, repeat: Infinity, delay: flake.delay, ease: "linear" }}
                />
              ))}
              {/* 밤/새벽 → 별 + 별똥별 */}
              {(timeState === 'night' || timeState === 'dawn') && STARS.map((star) => (
                <motion.div
                  key={star.id}
                  className="absolute bg-white rounded-full pointer-events-none"
                  style={{ top: `${star.top}%`, left: `${star.left}%`, width: `${star.size}px`, height: `${star.size}px` }}
                  animate={{ opacity: [0.12, 1, 0.12], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: star.duration, repeat: Infinity, delay: star.delay, ease: "easeInOut" }}
                />
              ))}
              {(timeState === 'night' || timeState === 'dawn') && SHOOTING_STARS.map((star) => (
                <motion.div
                  key={star.id}
                  className="absolute pointer-events-none"
                  style={{ top: `${star.top}%`, left: "0%", height: "1.5px", width: `${star.width}px` }}
                  animate={{ x: ["-8vw", "115vw"], opacity: [0, 1, 0.9, 0] }}
                  transition={{ duration: star.duration, repeat: Infinity, delay: star.delay, repeatDelay: star.repeatDelay, ease: "easeOut" }}
                >
                  <div className="w-full h-full" style={{ background: "linear-gradient(to right, transparent, white 35%, rgba(196,181,253,0.9), transparent)" }} />
                </motion.div>
              ))}
              {/* 아침 → 햇살 */}
              {timeState === 'morning' && (
                <>
                  <motion.div
                    className="absolute -top-24 -right-24 rounded-full pointer-events-none"
                    style={{ width: "320px", height: "320px", background: "radial-gradient(circle, rgba(253,224,71,0.45) 0%, rgba(251,146,60,0.2) 45%, transparent 70%)" }}
                    animate={{ scale: [1, 1.12, 1], opacity: [0.55, 0.85, 0.55] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {Array.from({ length: 8 }, (_, i) => (
                    <motion.div
                      key={i}
                      className="absolute pointer-events-none"
                      style={{
                        top: "0%", right: "0%", width: "2px", height: "200%",
                        background: "linear-gradient(to bottom, rgba(253,224,71,0.4), transparent 55%)",
                        transform: `rotate(${-55 + i * 22}deg)`, transformOrigin: "top right",
                      }}
                      animate={{ opacity: [0.12, 0.45, 0.12], scaleX: [1, 2, 1] }}
                      transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
                    />
                  ))}
                </>
              )}
              
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
              <img src="/assets/weather/rainy.png" className="w-full h-full object-cover scale-110" alt="rainy" />
              <div className="absolute inset-0 bg-slate-950/35" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              {RAIN_DROPS.map((drop) => (
                <motion.div
                  key={drop.id}
                  className="absolute rounded-full"
                  style={{
                    width: "1.5px",
                    height: `${drop.height}px`,
                    left: `${drop.left}%`,
                    top: "-4%",
                    background: "linear-gradient(to bottom, transparent, rgba(147,197,253,0.8), transparent)",
                    transform: "rotate(14deg)",
                  }}
                  animate={{ y: ["0vh", "115vh"] }}
                  transition={{ duration: drop.duration, repeat: Infinity, delay: drop.delay, ease: "linear" }}
                />
              ))}
              <motion.div
                className="absolute inset-0 bg-white/5"
                animate={{ opacity: [0, 0, 0, 0.2, 0, 0.1, 0, 0] }}
                transition={{ duration: 9, repeat: Infinity, delay: 4, ease: "easeOut" }}
              />
              <div className="absolute inset-0 flex flex-col justify-end p-10">
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20 flex items-center gap-2 shadow-2xl">
                    <MapPin size={12} /> 서울
                  </div>
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20 flex items-center gap-2 shadow-2xl">
                    <Thermometer size={12} className="text-blue-300" /> 12°C
                  </div>
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20 flex items-center gap-2 shadow-2xl">
                    🌧️ 저녁
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-end gap-6">
                  {demoSlideBooks.rain.length > 0 && (
                    <div className="flex gap-3 items-center flex-shrink-0">
                      {demoSlideBooks.rain.map((book, idx) => (
                        <motion.div
                          key={book.id}
                          initial={{ opacity: 0, y: 30, rotate: -5 }}
                          animate={{ opacity: 1, y: 0, rotate: 0 }}
                          transition={{ delay: 0.2 + idx * 0.1, type: "spring", damping: 12 }}
                          onClick={() => navigate(`/book/${book.id}`)}
                          className="w-24 md:w-28 aspect-[2/3] relative cursor-pointer group/item"
                        >
                          <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg group-hover/item:bg-primary/30 transition-all" />
                          <img src={book._cover || book.volumeInfo?.imageLinks?.thumbnail} className="w-full h-full object-cover rounded-xl border border-white/40 shadow-2xl relative z-10 transition-all duration-500 group-hover/item:-translate-y-4 group-hover/item:scale-105" alt={book.volumeInfo?.title} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 mb-2">
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                      <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 tracking-tighter drop-shadow-2xl">
                        감성적이고 몽환적인,<br />{displayName}님께 드리는 추천
                      </h2>
                      <p className="text-[12px] text-white/70 font-medium tracking-tight bg-white/5 inline-block px-2 py-1 rounded-md backdrop-blur-sm">
                        비 오는 저녁엔 소설 한 편이 딱이에요.
                      </p>
                    </motion.div>
                  </div>
                </div>
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
              <img src="/assets/weather/night.png" className="w-full h-full object-cover scale-110" alt="dawn" />
              <div className="absolute inset-0 bg-indigo-950/45" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
              {STARS.map((star) => (
                <motion.div
                  key={star.id}
                  className="absolute bg-white rounded-full"
                  style={{ top: `${star.top}%`, left: `${star.left}%`, width: `${star.size}px`, height: `${star.size}px` }}
                  animate={{ opacity: [0.12, 1, 0.12], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: star.duration, repeat: Infinity, delay: star.delay, ease: "easeInOut" }}
                />
              ))}
              {SHOOTING_STARS.map((star) => (
                <motion.div
                  key={star.id}
                  className="absolute"
                  style={{ top: `${star.top}%`, left: "0%", height: "1.5px", width: `${star.width}px` }}
                  animate={{ x: ["-8vw", "115vw"], opacity: [0, 1, 0.9, 0] }}
                  transition={{ duration: star.duration, repeat: Infinity, delay: star.delay, repeatDelay: star.repeatDelay, ease: "easeOut" }}
                >
                  <div className="w-full h-full" style={{ background: "linear-gradient(to right, transparent, white 35%, rgba(196,181,253,0.9), transparent)" }} />
                </motion.div>
              ))}
              <div className="absolute inset-0 flex flex-col justify-end p-10">
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20 flex items-center gap-2 shadow-2xl">
                    <MapPin size={12} /> 서울
                  </div>
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20 flex items-center gap-2 shadow-2xl">
                    <Thermometer size={12} className="text-blue-300" /> 5°C
                  </div>
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20 flex items-center gap-2 shadow-2xl">
                    🌙 새벽
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-end gap-6">
                  {demoSlideBooks.dawn.length > 0 && (
                    <div className="flex gap-3 items-center flex-shrink-0">
                      {demoSlideBooks.dawn.map((book, idx) => (
                        <motion.div
                          key={book.id}
                          initial={{ opacity: 0, y: 30, rotate: -5 }}
                          animate={{ opacity: 1, y: 0, rotate: 0 }}
                          transition={{ delay: 0.2 + idx * 0.1, type: "spring", damping: 12 }}
                          onClick={() => navigate(`/book/${book.id}`)}
                          className="w-24 md:w-28 aspect-[2/3] relative cursor-pointer group/item"
                        >
                          <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg group-hover/item:bg-primary/30 transition-all" />
                          <img src={book._cover || book.volumeInfo?.imageLinks?.thumbnail} className="w-full h-full object-cover rounded-xl border border-white/40 shadow-2xl relative z-10 transition-all duration-500 group-hover/item:-translate-y-4 group-hover/item:scale-105" alt={book.volumeInfo?.title} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 mb-2">
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                      <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 tracking-tighter drop-shadow-2xl">
                        고요하고 사색적인,<br />{displayName}님께 드리는 추천
                      </h2>
                      <p className="text-[12px] text-white/70 font-medium tracking-tight bg-white/5 inline-block px-2 py-1 rounded-md backdrop-blur-sm">
                        새벽 같은 맑음에는 인문학이 어울려요.
                      </p>
                    </motion.div>
                  </div>
                </div>
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
              <img src="https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1200&q=80" className="w-full h-full object-cover scale-105" alt="morning" />
              <div className="absolute inset-0 bg-amber-900/25" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <motion.div
                className="absolute -top-24 -right-24 rounded-full pointer-events-none"
                style={{ width: "340px", height: "340px", background: "radial-gradient(circle, rgba(253,224,71,0.5) 0%, rgba(251,146,60,0.25) 45%, transparent 70%)" }}
                animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              {Array.from({ length: 10 }, (_, i) => (
                <motion.div
                  key={i}
                  className="absolute pointer-events-none"
                  style={{
                    top: "0%", right: "0%",
                    width: "2px", height: "200%",
                    background: "linear-gradient(to bottom, rgba(253,224,71,0.45), transparent 55%)",
                    transform: `rotate(${-55 + i * 19}deg)`,
                    transformOrigin: "top right",
                  }}
                  animate={{ opacity: [0.15, 0.5, 0.15], scaleX: [1, 2, 1] }}
                  transition={{ duration: 2.5 + i * 0.28, repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
                />
              ))}
              <div className="absolute inset-0 flex flex-col justify-end p-10">
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20 flex items-center gap-2 shadow-2xl">
                    <MapPin size={12} /> 서울
                  </div>
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20 flex items-center gap-2 shadow-2xl">
                    <Thermometer size={12} className="text-orange-300" /> 18°C
                  </div>
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20 flex items-center gap-2 shadow-2xl">
                    🌅 아침
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-end gap-6">
                  {demoSlideBooks.morning.length > 0 && (
                    <div className="flex gap-3 items-center flex-shrink-0">
                      {demoSlideBooks.morning.map((book, idx) => (
                        <motion.div
                          key={book.id}
                          initial={{ opacity: 0, y: 30, rotate: -5 }}
                          animate={{ opacity: 1, y: 0, rotate: 0 }}
                          transition={{ delay: 0.2 + idx * 0.1, type: "spring", damping: 12 }}
                          onClick={() => navigate(`/book/${book.id}`)}
                          className="w-24 md:w-28 aspect-[2/3] relative cursor-pointer group/item"
                        >
                          <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg group-hover/item:bg-primary/30 transition-all" />
                          <img src={book._cover || book.volumeInfo?.imageLinks?.thumbnail} className="w-full h-full object-cover rounded-xl border border-white/40 shadow-2xl relative z-10 transition-all duration-500 group-hover/item:-translate-y-4 group-hover/item:scale-105" alt={book.volumeInfo?.title} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 mb-2">
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                      <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 tracking-tighter drop-shadow-2xl">
                        상쾌하고 활기찬,<br />{displayName}님께 드리는 추천
                      </h2>
                      <p className="text-[12px] text-white/70 font-medium tracking-tight bg-white/5 inline-block px-2 py-1 rounded-md backdrop-blur-sm">
                        맑은 아침엔 자기계발 한 페이지로 시작해보세요.
                      </p>
                    </motion.div>
                  </div>
                </div>
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
              <img src="/assets/weather/snowy_window.png" className="w-full h-full object-cover scale-105" alt="snowy window" />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              {SNOW_FLAKES.map((flake) => (
                <motion.div
                  key={flake.id}
                  className="absolute rounded-full bg-white shadow-sm"
                  style={{ width: `${flake.size}px`, height: `${flake.size}px`, left: `${flake.left}%`, top: "-4%", opacity: flake.opacity }}
                  animate={{ y: ["0vh", "118vh"], x: [0, flake.drift, 0, -flake.drift, 0] }}
                  transition={{
                    y: { duration: flake.duration, repeat: Infinity, delay: flake.delay, ease: "linear" },
                    x: { duration: flake.duration * 0.75, repeat: Infinity, delay: flake.delay, ease: "easeInOut" },
                  }}
                />
              ))}
              <div className="absolute inset-0 flex flex-col justify-end p-10">
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20 flex items-center gap-2 shadow-2xl">
                    <MapPin size={12} /> 서울
                  </div>
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20 flex items-center gap-2 shadow-2xl">
                    <Thermometer size={12} className="text-sky-300" /> -2°C
                  </div>
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-bold text-white border border-white/20 flex items-center gap-2 shadow-2xl">
                    ❄️ 오후
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-end gap-6">
                  {demoSlideBooks.snow.length > 0 && (
                    <div className="flex gap-3 items-center flex-shrink-0">
                      {demoSlideBooks.snow.map((book, idx) => (
                        <motion.div
                          key={book.id}
                          initial={{ opacity: 0, y: 30, rotate: -5 }}
                          animate={{ opacity: 1, y: 0, rotate: 0 }}
                          transition={{ delay: 0.2 + idx * 0.1, type: "spring", damping: 12 }}
                          onClick={() => navigate(`/book/${book.id}`)}
                          className="w-24 md:w-28 aspect-[2/3] relative cursor-pointer group/item"
                        >
                          <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg group-hover/item:bg-primary/30 transition-all" />
                          <img src={book._cover || book.volumeInfo?.imageLinks?.thumbnail} className="w-full h-full object-cover rounded-xl border border-white/40 shadow-2xl relative z-10 transition-all duration-500 group-hover/item:-translate-y-4 group-hover/item:scale-105" alt={book.volumeInfo?.title} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 mb-2">
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                      <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 tracking-tighter drop-shadow-2xl">
                        포근하고 따뜻한,<br />{displayName}님께 드리는 추천
                      </h2>
                      <p className="text-[12px] text-white/70 font-medium tracking-tight bg-white/5 inline-block px-2 py-1 rounded-md backdrop-blur-sm">
                        눈 오는 날엔 따뜻한 이야기가 어울려요.
                      </p>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── 슬라이드 6: 명언 (순환) ── */}
          {activeSlide === 6 && (
            <motion.div
              key="quote-slide"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
            >
              {/* 배경 사진 */}
              <img
                src={QUOTES[quoteIndex].bg}
                className="absolute inset-0 w-full h-full object-cover"
                style={QUOTES[quoteIndex].imgFilter ? { filter: QUOTES[quoteIndex].imgFilter } : {}}
                alt="quote bg"
              />
              <div className={`absolute inset-0 ${QUOTES[quoteIndex].tint}`} />
              {/* 분위기 블롭 */}
              <motion.div
                key={quoteIndex}
                animate={{ opacity: [0.3, 0.55, 0.3], scale: [1, 1.12, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute inset-0 bg-gradient-to-tr ${QUOTES[quoteIndex].blob} blur-3xl`}
              />
              {/* 별 파티클 — night 테마 */}
              {QUOTES[quoteIndex].particles === "stars" && STARS.slice(0, 12).map((star) => (
                <motion.div
                  key={star.id}
                  className="absolute bg-white rounded-full"
                  style={{ top: `${star.top}%`, left: `${star.left}%`, width: `${star.size}px`, height: `${star.size}px` }}
                  animate={{ opacity: [0.1, 0.85, 0.1] }}
                  transition={{ duration: star.duration, repeat: Infinity, delay: star.delay }}
                />
              ))}
              {/* 빗줄기 파티클 — rainy 테마 */}
              {QUOTES[quoteIndex].particles === "rain" && RAIN_DROPS.slice(0, 22).map((drop) => (
                <motion.div
                  key={drop.id}
                  className="absolute rounded-full"
                  style={{
                    width: "1px", height: `${drop.height * 0.55}px`,
                    left: `${drop.left}%`, top: "-4%",
                    background: "linear-gradient(to bottom, transparent, rgba(147,197,253,0.45), transparent)",
                    transform: "rotate(14deg)", opacity: 0.5,
                  }}
                  animate={{ y: ["0vh", "115vh"] }}
                  transition={{ duration: drop.duration * 1.3, repeat: Infinity, delay: drop.delay, ease: "linear" }}
                />
              ))}
              {/* 광선 파티클 — sunny/amber 테마 */}
              {QUOTES[quoteIndex].particles === "rays" && Array.from({ length: 7 }, (_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    top: "0%", right: "0%", width: "2px", height: "180%",
                    background: "linear-gradient(to bottom, rgba(253,200,71,0.35), transparent 55%)",
                    transform: `rotate(${-40 + i * 20}deg)`,
                    transformOrigin: "top right",
                  }}
                  animate={{ opacity: [0.1, 0.45, 0.1], scaleX: [1, 1.8, 1] }}
                  transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                />
              ))}
              {/* 글귀 콘텐츠 — quoteIndex 변경 시 fade-in */}
              <div className="relative z-10 text-center px-10 max-w-lg">
                <motion.div
                  key={quoteIndex}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65 }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    className={`${QUOTES[quoteIndex].accent} text-6xl font-serif mb-4 h-8 select-none`}
                  >"</motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl md:text-2xl font-medium text-white/90 leading-[1.8] tracking-tight"
                    style={{ fontFamily: 'Georgia, "Nanum Myeongjo", serif' }}
                  >
                    {QUOTES[quoteIndex].lines.map((line, i) => (
                      <span key={i}>{line}{i < QUOTES[quoteIndex].lines.length - 1 && <br />}</span>
                    ))}
                  </motion.h3>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: 40 }}
                    transition={{ delay: 0.65, duration: 0.8 }}
                    className="h-px bg-white/25 mx-auto my-6"
                  />
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.85 }}
                    className="text-white/75 text-sm font-bold tracking-[0.3em] uppercase"
                  >
                    {QUOTES[quoteIndex].author}
                  </motion.p>
                </motion.div>
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

        {/* 베스트 도서 */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tighter">베스트 도서</h2>
              <p className="text-xs text-muted-foreground font-medium mt-1">지금 가장 많이 읽히는 책들</p>
            </div>
            <button onClick={() => navigate("/search?genre=베스트셀러")} className="p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
          {bestLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[...Array(5)].map((_, i) => <div key={i} className="flex-shrink-0 w-24 aspect-[2/3] bg-muted animate-pulse rounded-2xl" />)}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {bestBooks.slice(0, 10).map((book, idx) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.04, type: "spring", damping: 15 }}
                  className="flex-shrink-0 w-24 relative pt-3 pl-1"
                >
                  <span className="absolute top-0 left-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-[9px] font-black flex items-center justify-center z-10 shadow-md">
                    {idx + 1}
                  </span>
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
