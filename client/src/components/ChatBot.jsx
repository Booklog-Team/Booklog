import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { searchBooks } from "@/utils/api";
import { useNavigate } from "react-router-dom";

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

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_KEY}&units=metric&lang=kr`
  );
  if (!res.ok) throw new Error("날씨 API 오류");
  const d = await res.json();
  return {
    city: d.name,
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

const SYSTEM_PROMPT = `너는 'Booklog' 도서 앱의 AI 사서야. 사용자 메시지를 분석해서 반드시 아래 JSON 형식으로만 응답해. JSON 외 다른 텍스트는 절대 출력하지 마.

{"type":"book","keyword":"알라딘 검색 키워드","message":"자연스러운 한국어 응답"}
{"type":"weather","message":"날씨 관련 짧은 한국어 응답"}
{"type":"general","message":"친절하고 자연스러운 한국어 답변"}

분류 기준:
- book: 책/도서 추천, 특정 책이나 작가 검색, 소설·에세이·자기계발 등 장르 언급
- weather: 날씨, 기온, 비, 맑음, 흐림 등 날씨 관련 질문
- general: 인사, 역사 인물, 과학, 일반 상식, 그 외 모든 것

keyword 작성법 (book 타입 전용):
- 핵심 키워드만 짧게 (예: "가벼운 소설 추천해줘" → "가벼운 소설")
- 작가 이름 언급 시 그 이름으로 (예: "한강 책 찾아줘" → "한강")`;

const ChatBot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "안녕하세요! Booklog AI 도우미예요 😊 책 추천, 도서 검색, 날씨, 궁금한 것 뭐든지 물어보세요!",
      isBot: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

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
          max_tokens: 300,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
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
          const keyword = getWeatherBookKeyword(weather.main, weather.temp);
          const { items } = await searchBooks(keyword);
          books = items.slice(0, 3);
          botText = `${weather.city}의 현재 날씨예요! ${weather.desc} 날씨엔 ${keyword} 책이 잘 어울려요 📚`;
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
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot size={22} />
              </div>
              <div>
                <p className="font-bold text-sm">Booklog AI</p>
                <p className="text-[10px] opacity-80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  책 추천 · 검색 · 날씨 · 일반 질문
                </p>
              </div>
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
