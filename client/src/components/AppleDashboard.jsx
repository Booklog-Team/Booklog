import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  ChevronRight, BookOpen, Star, TrendingUp, 
  Clock, MapPin, Cloud, Sun, CloudRain, Snowflake, Sparkles, BrainCircuit,
  MessageSquareQuote
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * AppleDashboard — macOS 스타일의 초투명 퓨어 화이트 글래스모피즘 홈 대시보드
 */
export default function AppleDashboard({ 
  user, 
  displayName, 
  readingBooks, 
  bestBooks, 
  weatherRecBooks, 
  weather, 
  timeState,
  demoSlideBooks 
}) {
  const navigate = useNavigate();

  // 날씨 아이콘 매핑
  const getWeatherIcon = () => {
    const main = weather?.main;
    if (main === 'Clear') return <Sun className="text-amber-500" size={48} />;
    if (main === 'Rain' || main === 'Drizzle') return <CloudRain className="text-blue-500" size={48} />;
    if (main === 'Snow') return <Snowflake className="text-slate-400" size={48} />;
    return <Cloud className="text-slate-500" size={48} />;
  };

  // AI 독서 통찰 메시지 (날씨/시간 기반)
  const aiInsight = useMemo(() => {
    const hours = new Date().getHours();
    if (weather?.main === 'Rain') return "빗소리가 창가를 두드리는 이런 날에는, 문장이 깊은 고전 소설이 어울립니다. 커피 한 잔과 함께 깊이 침잠해보세요.";
    if (hours < 9) return "상쾌한 아침 공기와 함께 자기계발서를 펼쳐보는 건 어떨까요? 오늘의 긍정적인 에너지를 충전해보세요.";
    if (hours > 21) return "고요한 밤입니다. 철학적인 에세이나 짧은 시집으로 하루를 차분하게 마무리하는 시간을 가져보세요.";
    return "당신의 취향을 분석한 결과, 지금 이 시간엔 역사와 인문학 도서가 지적인 만족감을 더해줄 것입니다.";
  }, [weather, timeState]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 80, damping: 15 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-8 space-y-10 max-w-[1440px] mx-auto min-h-screen font-sans selection:bg-foreground/10"
    >
      {/* ── 상단 정보 바 (Location & Time) ── */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 backdrop-blur-3xl bg-card border border-border px-6 py-3 rounded-full shadow-sm">
          <MapPin size={18} className="text-foreground/70" />
          <span className="text-sm font-bold tracking-tight text-foreground/90">{weather?.cityName || '서울, 대한민국'}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
            <Clock size={16} />
            <span>{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
            <span className="ml-2 bg-foreground/5 px-2 py-0.5 rounded text-[11px] uppercase tracking-tighter">{timeState}</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* ── 좌측 메인 (8/12) ── */}
        <div className="xl:col-span-8 space-y-10">
          
          {/* AI 인사이트 배너 */}
          <motion.section variants={itemVariants} className="relative group">
            <div className="absolute inset-0 bg-white/40 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-80 transition-opacity" />
            <div className="relative backdrop-blur-3xl bg-card border border-border p-10 rounded-[2.5rem] shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="bg-white/60 p-5 rounded-3xl shadow-inner border border-white/40">
                  <BrainCircuit size={48} className="text-foreground/80 animate-pulse" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-sm font-black text-foreground/50 uppercase tracking-widest mb-3 flex items-center justify-center md:justify-start gap-2">
                    <Sparkles size={14} /> AI Reading Insight
                  </h2>
                  <p className="text-xl md:text-2xl font-bold leading-relaxed text-foreground/90">
                    "{aiInsight}"
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 계속 읽기 */}
          <section>
            <div className="flex items-center justify-between mb-6 px-4">
              <h2 className="text-2xl font-black tracking-tight">계속 읽기</h2>
              <button onClick={() => navigate("/library")} className="group flex items-center gap-1 text-sm font-bold text-foreground/60 hover:text-foreground">
                라이브러리 이동 <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {readingBooks.length > 0 ? (
                readingBooks.slice(0, 2).map((book) => (
                  <motion.div 
                    key={book.id}
                    whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }}
                    className="backdrop-blur-3xl bg-card border border-border p-7 rounded-[2.5rem] shadow-sm flex gap-8 cursor-pointer transition-all"
                    onClick={() => navigate(`/book/${book.id}`)}
                  >
                    <div className="w-28 h-40 flex-shrink-0 shadow-lg rounded-2xl overflow-hidden">
                      <img src={book.cover} className="w-full h-full object-cover" alt={book.title} />
                    </div>
                    <div className="flex flex-col justify-center flex-1 min-w-0">
                      <h3 className="font-black text-xl truncate mb-2">{book.title}</h3>
                      <p className="text-sm font-medium text-muted-foreground truncate mb-6">{book.author}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-black text-foreground/60 uppercase">
                          <span>Progress</span>
                          <span>{book.currentPage > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-foreground/5 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${book.currentPage > 0 ? (book.currentPage / book.totalPages) * 100 : 0}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="bg-foreground/80 h-full rounded-full" 
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-2 backdrop-blur-3xl bg-card border border-dashed border-border p-16 rounded-[2.5rem] text-center shadow-sm">
                  <p className="text-muted-foreground font-bold">읽고 있는 책이 아직 없네요. 서재를 채워볼까요?</p>
                </div>
              )}
            </div>
          </section>

          {/* 오늘의 발견 그리드 */}
          <section>
            <h2 className="text-2xl font-black tracking-tight mb-8 px-4">오늘의 발견</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {weatherRecBooks.slice(0, 4).map((book) => (
                <motion.div 
                  key={book.id}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="backdrop-blur-3xl bg-card border border-border rounded-[2rem] p-4 shadow-sm group cursor-pointer"
                  onClick={() => navigate(`/book/${book.id}`)}
                >
                  <div className="aspect-[2/3] rounded-2xl overflow-hidden mb-4 shadow-sm bg-white/5 border border-white/40">
                    <img src={book.cover} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={book.title} />
                  </div>
                  <h4 className="font-black text-sm truncate px-2 text-foreground/90">{book.title}</h4>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* ── 우측 사이드바 (4/12) ── */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* 지능형 날씨 위젯 */}
          <motion.div 
            variants={itemVariants}
            className="backdrop-blur-3xl bg-card border border-border p-10 rounded-[3rem] shadow-sm relative overflow-hidden group"
          >
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-6 transform group-hover:scale-110 transition-transform duration-500">
                {getWeatherIcon()}
              </div>
              <h3 className="text-5xl font-black tracking-tighter mb-2 text-foreground/90">
                {weather?.temp ? Math.round(weather.temp) : '22'}°
              </h3>
              <p className="text-lg font-bold text-foreground/60 mb-8">
                {weather?.main === 'Clear' ? '창밖은 맑음' : '구름 조금'}
              </p>
              
              <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-border">
                <div className="text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">습도</p>
                  <p className="font-bold text-foreground/80">{weather?.humidity || '45'}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">풍속</p>
                  <p className="font-bold text-foreground/80">{weather?.windSpeed || '1.2'}m/s</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 blur-3xl rounded-full -mr-10 -mt-10" />
          </motion.div>

          {/* 명언 위젯 (AI Quote) */}
          <motion.section variants={itemVariants} className="backdrop-blur-3xl bg-card border border-border p-10 rounded-[3rem] shadow-sm text-center">
            <MessageSquareQuote size={32} className="mx-auto mb-6 text-foreground/20" />
            <p className="text-lg font-medium leading-relaxed italic text-foreground/80">
              "책은 한 권의 도끼여야 한다. 우리 안의 얼어붙은 바다를 깨트리는 도끼여야 한다."
            </p>
            <p className="mt-4 text-xs font-black text-foreground/40 uppercase tracking-widest">— Franz Kafka</p>
          </motion.section>

          {/* 트렌딩 베스트셀러 */}
          <motion.section variants={itemVariants} className="backdrop-blur-3xl bg-card border border-border p-8 rounded-[3rem] shadow-sm">
            <div className="flex items-center gap-2 mb-8 px-2">
              <TrendingUp size={20} className="text-foreground/70" />
              <h2 className="text-xl font-black tracking-tight text-foreground/90">트렌딩</h2>
            </div>
            <div className="space-y-6">
              {bestBooks.slice(0, 5).map((book, idx) => (
                <div 
                  key={book.id} 
                  className="flex items-center gap-5 group cursor-pointer hover:bg-white/40 p-3 rounded-2xl transition-colors"
                  onClick={() => navigate(`/book/${book.id}`)}
                >
                  <span className="text-3xl font-black text-foreground/10 group-hover:text-foreground/30 transition-colors">{idx + 1}</span>
                  <div className="w-14 h-20 flex-shrink-0 rounded-xl shadow-sm overflow-hidden transition-transform group-hover:scale-105 border border-white/50">
                    <img src={book.cover} className="w-full h-full object-cover" alt={book.title} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm truncate mb-1 text-foreground/90">{book.title}</h4>
                    <p className="text-[11px] font-medium text-muted-foreground truncate">{book.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

        </div>
      </div>
    </motion.div>
  );
}
