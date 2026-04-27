import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Flame, BookOpen, TrendingUp, ChevronRight, Loader2, AlertCircle, Award, Cloud, Sun, CloudRain, Snowflake, Moon, Sunrise, Coffee, CloudLightning, MapPin, Thermometer } from "lucide-react";
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

const KEYWORDS = ["소설", "자기계발", "한국문학", "SF", "철학", "에세이"];

function calculateStreak(shelf) {
  const all = new Set();
  shelf.forEach((b) => (b.checkedDates || []).forEach((d) => all.add(d)));
  if (!all.size) return 0;

  const sorted = [...all].sort().reverse();
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let count = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((new Date(sorted[i - 1]) - new Date(sorted[i])) / 86_400_000);
    if (diff === 1) count++;
    else break;
  }
  return count;
}

export default function Home() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { recommendation, weather, timeState } = useWeather();

  const [shelf, setShelf]               = useState([]);
  const [shelfLoading, setShelfLoading] = useState(true);
  const [recBooks, setRecBooks]         = useState([]);
  const [recLoading, setRecLoading]     = useState(true);
  const [recError, setRecError]         = useState(false);
  const [weatherRecBooks, setWeatherRecBooks] = useState([]);
  const [weatherRecLoading, setWeatherRecLoading] = useState(true);
  const [recommendGenre, setRecommendGenre] = useState("소설");
  const [meetingCount, setMeetingCount] = useState(null);
  
  // 캐러셀 상태
  const [activeSlide, setActiveSlide] = useState(0);
  const totalSlides = 3;

  // 캐러셀 자동 전환
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % totalSlides);
    }, 8000); 
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

  // ── 모임 수 로드 ───────────────────────────────────────────
  useEffect(() => {
    getDocs(collection(db, "meetings"))
      .then((snap) => setMeetingCount(snap.size))
      .catch(() => setMeetingCount(0));
  }, []);

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
    if (!recommendation?.genres) return;
    
    let cancelled = false;
    const weatherGenre = recommendation.genres[0];
    setWeatherRecLoading(true);

    getBooksByGenre(weatherGenre, 6)
      .then(({ items }) => { 
        if (!cancelled) {
          console.log(`Weather recommendation (${weatherGenre}):`, items);
          // 데이터가 없으면 '소설' 장르라도 가져와서 비어있지 않게 함
          if (!items || items.length === 0) {
            getBooksByGenre("소설", 4).then(({ items: fallbackItems }) => {
              if (!cancelled) setWeatherRecBooks(fallbackItems);
            });
          } else {
            setWeatherRecBooks(items);
          }
        }
      })
      .catch((err) => {
        console.error("Weather Rec Error:", err);
        if (!cancelled) setWeatherRecBooks([]);
      })
      .finally(() => { 
        if (!cancelled) setWeatherRecLoading(false); 
      });

    return () => { cancelled = true; };
  }, [recommendation]);

  const readingBooks  = shelf.filter((b) => b.status === "reading");
  const doneCount     = shelf.filter((b) => b.status === "done").length;
  const totalPages    = shelf.reduce((s, b) => s + (b.currentPage || 0), 0);
  const streak        = calculateStreak(shelf);
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

  const getWeatherIcon = () => {
    switch (weather?.main) {
      case 'Rain': return <CloudRain size={20} />;
      case 'Snow': return <Snowflake size={20} />;
      case 'Thunderstorm': return <CloudLightning size={20} />;
      case 'Clouds': return <Cloud size={20} />;
      default: return <Sun size={20} />;
    }
  };

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
      <div className="relative overflow-hidden rounded-[2.5rem] mb-6 mt-4 mx-4 h-80 shadow-xl group border border-border/40">
        <AnimatePresence>
          {activeSlide === 0 ? (
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
          ) : activeSlide === 1 ? (
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
          ) : (
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
                animate={{ 
                  opacity: [0.3, 0.5, 0.3],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" 
              />
              <div className="relative z-10 text-center px-10 max-w-lg">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-primary/40 text-6xl font-serif mb-4 h-8 select-none"
                >
                  “
                </motion.div>
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
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 40 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="h-px bg-primary/30 mx-auto my-6"
                />
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="text-white/40 text-[10px] font-bold tracking-[0.4em] uppercase"
                >
                  Franz Kafka
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 프리미엄 바 스타일 인디케이터 */}
        <div className="absolute bottom-6 left-10 flex gap-3 z-20">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className="group relative h-1 w-12 overflow-hidden rounded-full bg-white/20 transition-all hover:bg-white/40"
            >
              {activeSlide === i && (
                <motion.div 
                  layoutId="activeBar"
                  className="absolute inset-0 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)]"
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  transition={{ duration: 8, ease: "linear" }}
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
                onClick={() => navigate(`/search?q=${kw}`)}
                className="flex-shrink-0 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full text-[11px] font-bold shadow-sm border border-white/50 hover:bg-primary hover:text-white transition-all active:scale-95"
              >
                #{kw}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 활동 요약 - 프리미엄 그리드 */}
      <div className="px-6 mb-12">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "서재", value: `${shelf.length}`, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "완독", value: `${doneCount}`, icon: Award, color: "text-amber-500", bg: "bg-amber-50" },
            { label: "스트릭", value: `${streak}`, icon: Flame, color: "text-orange-500", bg: "bg-orange-50" },
            { label: "페이지", value: totalPages > 999 ? `${(totalPages / 1000).toFixed(1)}k` : `${totalPages}`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
          ].map(({ label, value, icon: Icon, color, bg }, idx) => (
            <motion.div 
              key={label} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * idx }}
              className="bg-white p-4 rounded-[1.8rem] border border-border/30 flex flex-col items-center shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <div className={`${bg} p-2 rounded-xl mb-2`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-lg font-black tracking-tighter">{value}</p>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{label}</p>
            </motion.div>
          ))}
        </div>
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
            <div className="h-32 bg-secondary/10 rounded-2xl animate-pulse" />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {readingBooks.length > 0 ? (
                readingBooks.slice(0, 2).map((b, idx) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <BookCard book={toCardBook(b)} variant="full" />
                  </motion.div>
                ))
              ) : (
                <div className="py-12 bg-secondary/20 rounded-[2.5rem] border-2 border-dashed border-border/40 text-center">
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
