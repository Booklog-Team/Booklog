import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Search, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { searchBooks } from "@/utils/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useShelf } from "@/contexts/ShelfContext";
import { usePoint } from "@/contexts/PointContext";
import { getDocs, collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase/config";
import { MOCK_COMMUNITY_POSTS } from "@/lib/mockData";

const WEATHER_KEY = import.meta.env.VITE_WEATHER_API_KEY;

async function fetchWeather() {
  let lat = 37.5665, lon = 126.9780; // 서울 기본값
  try {
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
    );
    lat = pos.coords.latitude;
    lon = pos.coords.longitude;
  } catch { /* 위치 허용 안 하면 서울 기본값 사용 */ }

  // 역지오코딩 + 날씨 동시 요청
  const [geoRes, weatherRes] = await Promise.all([
    fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${WEATHER_KEY}`),
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_KEY}&units=metric&lang=kr`),
  ]);
  if (!weatherRes.ok) throw new Error("날씨 API 오류");
  const [geoData, d] = await Promise.all([geoRes.json(), weatherRes.json()]);
  const cityName = geoData[0]?.local_names?.ko || geoData[0]?.name || "서울";

  return {
    city: cityName,
    main: d.weather[0].main,
    temp: Math.round(d.main.temp),
    feelsLike: Math.round(d.main.feels_like),
    desc: d.weather[0].description,
    humidity: d.main.humidity,
    icon: d.weather[0].icon,
  };
}

const WEATHER_BOOK_MAP = {
  Rain:         "감성 소설",
  Thunderstorm: "스릴러 소설",
  Snow:         "겨울 판타지",
  Clouds:       "인문학 에세이",
  Clear:        "여행 에세이",
  Mist:         "미스터리 소설",
  Drizzle:      "따뜻한 에세이",
};

function getWeatherBookKeyword(main, temp) {
  if (temp <= 3)  return "따뜻한 감성 소설";
  if (temp >= 30) return "시원한 SF 소설";
  return WEATHER_BOOK_MAP[main] || "베스트셀러";
}

const BASE_SYSTEM_PROMPT = `너는 'Booklog' 도서 앱의 AI 사서야. 사용자 메시지를 분석해서 반드시 아래 JSON 형식으로만 응답해. JSON 외 다른 텍스트는 절대 출력하지 마.

{"type":"book","keyword":"알라딘 검색 키워드","message":"자연스러운 한국어 응답"}
{"type":"weather","message":"날씨 관련 짧은 한국어 응답 (날씨 정보만, 책 언급 금지)"}
{"type":"weather_books","message":"날씨와 어울리는 책 추천 응답"}
{"type":"user_data","message":"사용자 데이터를 바탕으로 한 자연스러운 한국어 답변"}
{"type":"community_data","message":"커뮤니티·모임·게시판 정보를 바탕으로 한 자연스러운 한국어 답변"}
{"type":"general","message":"친절하고 자연스러운 한국어 답변"}

분류 기준:
- book: 책/도서 추천, 특정 책이나 작가 검색, 소설·에세이·자기계발 등 장르 언급
- weather: 날씨·기온·비·맑음·흐림 등 순수 날씨 질문
- weather_books: 날씨와 함께 책 추천을 명시적으로 요청
- user_data: 사용자 본인의 서재·독서 현황·포인트·레벨·완독 수·읽는 책·프로필 관련 질문
- community_data: 커뮤니티 모임, 게시판 글, 다른 독자들의 활동 관련 질문 ("어떤 모임이 있어", "최근 게시글", "커뮤니티 현황" 등)
- general: 인사, 역사 인물, 과학, 일반 상식, 그 외 모든 것

keyword 작성법 (book 타입 전용):
- 핵심 키워드만 짧게 (예: "가벼운 소설 추천해줘" → "가벼운 소설")
- 작가 이름 언급 시 그 이름으로 (예: "한강 책 찾아줘" → "한강")`;

const INITIAL_MESSAGE = {
  id: 1,
  text: "안녕하세요! Booklog AI 도우미예요 😊 책 추천, 도서 검색, 날씨, 궁금한 것 뭐든지 물어보세요!",
  isBot: true,
};

const LEVELS = [
  { level: 1, label: "새싹 독자",     emoji: "🌱", minPts: 0   },
  { level: 2, label: "꾸준한 독자",   emoji: "📚", minPts: 50  },
  { level: 3, label: "책벌레",        emoji: "🐛", minPts: 150 },
  { level: 4, label: "독서왕",        emoji: "👑", minPts: 300 },
  { level: 5, label: "도서관 수호자", emoji: "🏛️", minPts: 500 },
];
function getLevelInfo(pts) {
  let cur = LEVELS[0], nxt = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (pts >= LEVELS[i].minPts) { cur = LEVELS[i]; nxt = LEVELS[i + 1] ?? null; break; }
  }
  return { label: cur.label, emoji: cur.emoji, ptsToNext: nxt ? nxt.minPts - pts : 0 };
}

const ChatBot = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { books: shelfBooks } = useShelf();
  const { myPoints } = usePoint();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const [meetings, setMeetings] = useState([]);
  const meetingsLoadedRef = useRef(false);

  // 채팅 열릴 때 모임 데이터 로드 (1회)
  useEffect(() => {
    if (!isOpen || meetingsLoadedRef.current) return;
    meetingsLoadedRef.current = true;
    getDocs(query(collection(db, "meetings"), orderBy("createdAt", "desc"), limit(10)))
      .then(snap => setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {});
  }, [isOpen]);

  const buildUserContext = () => {
    if (!user) return "\n[사용자 정보: 로그인하지 않은 상태]";

    const reading = shelfBooks.filter(b => b.status === "reading");
    const done    = shelfBooks.filter(b => b.status === "done");
    const want    = shelfBooks.filter(b => b.status === "want");

    const fmt = (arr) =>
      arr.length === 0
        ? "없음"
        : arr.map(b => `"${b.title}"(${b.author || "저자 미상"})`).join(", ");

    const readingDetail = reading.map(b => {
      const pct = b.totalPage && b.currentPage
        ? Math.round((b.currentPage / b.totalPage) * 100)
        : null;
      return `"${b.title}"(${b.author || "저자 미상"}${pct !== null ? `, ${pct}% 진행` : ""})`;
    }).join(", ") || "없음";

    const lvl = getLevelInfo(myPoints);
    const meetingsSummary = meetings.length === 0
      ? "현재 모임 없음"
      : meetings.slice(0, 5).map(m => `"${m.title || "제목없음"}"(${m.currentMembers ?? m.members?.length ?? 0}명)`).join(", ");
    const boardSummary = MOCK_COMMUNITY_POSTS.slice(0, 5)
      .map(p => `"${p.title}"(${p.category}, 좋아요 ${p.likes?.length ?? 0})`).join(", ");

    return `
[사용자 개인 데이터 — user_data 질문에 이 정보를 바탕으로 답변]
- 닉네임: ${profile?.nickname || "설정 안 됨"}
- 관심 장르: ${profile?.genres?.join(", ") || "없음"}
- 포인트: ${myPoints}pt / 레벨: ${lvl.emoji} ${lvl.label}${lvl.ptsToNext > 0 ? ` (다음 레벨까지 ${lvl.ptsToNext}pt)` : " (최고 레벨)"}
- 서재 총 도서: ${shelfBooks.length}권
- 읽는 중 (${reading.length}권): ${readingDetail}
- 완독 (${done.length}권): ${fmt(done)}
- 읽고 싶음 (${want.length}권): ${fmt(want)}

[커뮤니티 현황 — community_data 질문에 이 정보를 바탕으로 답변]
- 독서 모임 (총 ${meetings.length}개): ${meetingsSummary}
- 게시판 최근 글: ${boardSummary}`;
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    setMessages(prev => [...prev, { id: Date.now(), text: userInput, isBot: false }]);
    setInput("");
    setIsLoading(true);

    try {
      // Groq에게 의도 분석 + 응답 생성 동시 요청 (JSON mode)
      const groqRes = await fetch("/api/groq/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: 400,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: BASE_SYSTEM_PROMPT + buildUserContext() },
            { role: "user", content: userInput },
          ],
        }),
      });

      const groqData = await groqRes.json();

      let parsed = { type: "general", message: "무엇을 도와드릴까요?" };
      try {
        const raw = groqData.choices?.[0]?.message?.content || "{}";
        parsed = JSON.parse(raw);
      } catch {
        parsed.message = groqData.choices?.[0]?.message?.content || parsed.message;
      }

      let botText = parsed.message || "무엇을 도와드릴까요?";
      let books = [];
      let weather = null;

      if (parsed.type === "book") {
        try {
          const keyword = parsed.keyword || userInput;
          const { items } = await searchBooks(keyword);
          books = items.slice(0, 3);
          if (books.length === 0) {
            botText = `"${keyword}" 관련 책을 찾지 못했어요. 다른 키워드로 시도해볼까요?`;
          }
        } catch {
          botText = "책 검색 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.";
        }
      } else if (parsed.type === "weather") {
        try {
          weather = await fetchWeather();
          botText = parsed.message || `${weather.city}의 현재 날씨예요! ${weather.desc}, ${weather.temp}°C입니다.`;
        } catch {
          botText = "날씨 정보를 가져오지 못했어요. 잠시 후 다시 시도해주세요.";
        }
      } else if (parsed.type === "user_data") {
        botText = parsed.message || "서재 정보를 확인해보세요.";
      } else if (parsed.type === "community_data") {
        botText = parsed.message || "커뮤니티 정보를 확인해보세요.";
      } else if (parsed.type === "weather_books") {
        try {
          weather = await fetchWeather();
          const keyword = getWeatherBookKeyword(weather.main, weather.temp);
          const { items } = await searchBooks(keyword);
          books = items.slice(0, 3);
          botText = parsed.message || `${weather.city}의 현재 날씨예요! ${weather.desc} 날씨엔 ${keyword} 책이 잘 어울려요 📚`;
        } catch {
          botText = "날씨 정보를 가져오지 못했어요. 잠시 후 다시 시도해주세요.";
        }
      }

      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: botText, isBot: true, books, weather },
      ]);
    } catch (err) {
      console.error("ChatBot error:", err);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: "잠시 문제가 생겼어요. 다시 말씀해 주시겠어요?", isBot: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-[60] cursor-pointer"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[350px] h-[550px] bg-card border border-border rounded-3xl shadow-2xl flex flex-col z-[60] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-4 text-primary-foreground flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">Booklog AI</p>
                <p className="text-[10px] opacity-80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  책 추천 · 검색 · 날씨 · 일반 질문
                </p>
              </div>
              <button
                onClick={() => setMessages([INITIAL_MESSAGE])}
                className="w-8 h-8 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                title="대화 초기화"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-secondary/5"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isBot ? "items-start" : "items-end"}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.isBot ? "flex-row" : "flex-row-reverse"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.isBot ? "bg-primary/10 text-primary border border-primary/20" : "bg-primary text-primary-foreground"}`}>
                      {msg.isBot ? <Bot size={16} /> : <User size={16} />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm shadow-sm whitespace-pre-line ${msg.isBot ? "bg-white text-foreground rounded-tl-none border border-border/50" : "bg-primary text-primary-foreground rounded-tr-none"}`}>
                      {msg.text}
                    </div>
                  </div>

                  {/* Book Results */}
                  {msg.isBot && msg.books?.length > 0 && (
                    <div className="mt-3 ml-10 space-y-2 w-full pr-4">
                      {msg.books.map(book => (
                        <div
                          key={book.id}
                          onClick={() => navigate(`/book/${book.id}`)}
                          className="flex gap-3 bg-white p-2 rounded-xl border border-border/60 hover:border-primary/40 cursor-pointer transition-all hover:shadow-md"
                        >
                          <img
                            src={book._cover || book.volumeInfo?.imageLinks?.thumbnail || "/placeholder-book.png"}
                            alt={book.volumeInfo.title}
                            className="w-12 h-16 object-cover rounded-md shadow-sm flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{book.volumeInfo.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{book.volumeInfo.authors?.join(", ")}</p>
                            {book.volumeInfo.categories?.[0] && (
                              <p className="text-[9px] text-primary/70 mt-0.5">{book.volumeInfo.categories[0]}</p>
                            )}
                            <div className="mt-1 flex items-center gap-1 text-primary text-[10px] font-medium">
                              자세히 보기 <Search size={10} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Weather Card */}
                  {msg.isBot && msg.weather && (
                    <div className="mt-3 ml-10 w-full pr-4">
                      <div className="bg-gradient-to-br from-sky-50 to-blue-100 border border-sky-200 rounded-2xl p-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={`https://openweathermap.org/img/wn/${msg.weather.icon}@2x.png`}
                            alt={msg.weather.desc}
                            className="w-12 h-12"
                          />
                          <div>
                            <p className="text-sm font-bold text-sky-900">{msg.weather.city}</p>
                            <p className="text-[11px] text-sky-600 capitalize">{msg.weather.desc}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="bg-white/70 rounded-xl p-2">
                            <p className="text-sm font-bold text-sky-800">{msg.weather.temp}°C</p>
                            <p className="text-[9px] text-sky-500">기온</p>
                          </div>
                          <div className="bg-white/70 rounded-xl p-2">
                            <p className="text-sm font-bold text-sky-800">{msg.weather.feelsLike}°C</p>
                            <p className="text-[9px] text-sky-500">체감</p>
                          </div>
                          <div className="bg-white/70 rounded-xl p-2">
                            <p className="text-sm font-bold text-sky-800">{msg.weather.humidity}%</p>
                            <p className="text-[9px] text-sky-500">습도</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot size={16} className="text-primary" />
                  </div>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-white flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="책 추천, 검색, 날씨, 궁금한 것 모두!"
                className="flex-1 bg-secondary/30 border-none rounded-2xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
