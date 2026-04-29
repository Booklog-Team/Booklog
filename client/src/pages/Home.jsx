import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, ChevronRight, ChevronLeft, Moon, Sunrise, Coffee, MapPin, Thermometer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BookCard from "@/components/BookCard";
import AppleDashboard from "@/components/AppleDashboard";
import { getBooksByGenre, searchBooks } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useWeather } from "@/contexts/WeatherContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { getReadingStatusStyle } from "@/utils/readingStatus";

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

function StatusBadge({ status, className = "" }) {
  const style = getReadingStatusStyle(status);
  return (
    <span
      className={`inline-flex w-fit items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${style.badge} ${className}`}
    >
      {style.label}
    </span>
  );
}

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

// 커버 이미지 있는 책만 필터
function withCovers(items) {
  return (items || []).filter(b => b._cover || b.volumeInfo?.imageLinks?.thumbnail);
}

// 무드별 알라딘 카테고리 — AI 선별을 위한 책 풀 구성
const MOOD_CATEGORIES = {
  Rain:         ["소설", "에세이"],
  Drizzle:      ["소설", "에세이"],
  Thunderstorm: ["소설", "인문학"],
  Snow:         ["소설", "에세이"],           // 여행 제외 — 겨울 감성과 무관
  Clear:        ["에세이", "자기계발", "여행"],
  Clouds:       ["에세이", "인문학", "소설"],
  dawn:         ["에세이", "인문학", "소설"],
  morning:      ["자기계발", "경제 / 경영", "에세이"],
  afternoon:    ["소설", "에세이"],           // 여행은 Clear(맑음) 전용으로 분리
  evening:      ["에세이", "인문학", "소설"],
  night:        ["소설", "인문학", "에세이"],
};


// 무드 상세 선별 기준 — Groq에게 "뭘 고르고 뭘 피해야 하는지" 명확히 전달
const MOOD_DESC = {
  Rain:         "비 오는 날 감성. 서정적이고 잔잔한 소설·문학 에세이만. 자기계발·건강·요리·비즈니스 제외.",
  Drizzle:      "이슬비 내리는 날 감성. 차분하고 섬세한 소설·에세이만. 자기계발·건강 제외.",
  Thunderstorm: "천둥치는 긴장감. 몰입감 있는 스릴러·심리 소설만. 가볍거나 밝은 책 제외.",
  Snow:         "눈 오는 날 겨울 감성. 따뜻하고 포근한 한국·외국 소설·에세이만. 여름·봄 소재, 아동·판타지·여행·자기계발·건강·다이어트·만화 절대 제외.",
  Clear:        "맑고 화창한 날. 밝고 긍정적인 자기계발서·여행 에세이만. 어둡거나 우울한 소재 제외.",
  Clouds:       "흐린 날 사색. 깊이 있는 인문·철학 에세이만. 밝거나 가벼운 책 제외.",
  dawn:         "고요한 새벽 사색. 철학적이고 내면적인 에세이·인문서만. 자기계발·다이어트·건강·요리 절대 제외.",
  morning:      "활기찬 아침. 동기부여·성장·생산성 자기계발서만. 어둡거나 무거운 소재 제외.",
  afternoon:    "여유로운 오후. 가볍게 읽히는 소설·여행 에세이만.",
  evening:      "사색적인 저녁. 역사·인문·성찰적 에세이만. 자기계발·다이어트 제외.",
  night:        "깊어가는 밤. 몰입감 있는 문학 소설·철학 인문서만. 가볍거나 실용적인 책 제외.",
};

// 전역 Groq 직렬화 큐 — 모든 호출을 순서대로, 700ms 간격 유지해 429 방지
let _groqQueue = Promise.resolve();
let _lastGroqCall = 0;
const GROQ_GAP = 700; // ms

function enqueueGroq(fn) {
  const job = _groqQueue.then(async () => {
    const gap = GROQ_GAP - (Date.now() - _lastGroqCall);
    if (gap > 0) await new Promise(r => setTimeout(r, gap));
    _lastGroqCall = Date.now();
    return fn();
  });
  _groqQueue = job.then(() => undefined, () => undefined);
  return job;
}

// 세션 캐시 — 탭 닫으면 초기화, 5분 TTL로 연속 새로고침 시 Groq 절약
const SESSION_CACHE_TTL = 5 * 60 * 1000;

function loadSessionCache(moodKey) {
  try {
    const raw = sessionStorage.getItem(`brec:${moodKey}`);
    if (!raw) return null;
    const { books, ts } = JSON.parse(raw);
    if (Date.now() - ts > SESSION_CACHE_TTL) { sessionStorage.removeItem(`brec:${moodKey}`); return null; }
    return books;
  } catch { return null; }
}

function saveSessionCache(moodKey, books) {
  try {
    sessionStorage.setItem(`brec:${moodKey}`, JSON.stringify({ books, ts: Date.now() }));
  } catch { }
}

// 알라딘 카테고리 풀 수집 → Groq 상세 기준 선별 → 세션 캐시
// 429 발생 시 2초 대기 후 1회 재시도, 이후 랜덤 폴백
async function fetchAIMoodBooks(weatherMain, timeState, count = 2) {
  const moodKey = `${weatherMain ?? "any"}:${timeState ?? "any"}`;

  // 1. 세션 캐시 확인 (5분 이내 동일 무드 → 재사용)
  const cached = loadSessionCache(moodKey);
  if (cached && cached.length >= count) {
    console.log(`[Rec] 💾 세션 hit [${moodKey}]`, cached.map(b => b.volumeInfo?.title));
    return cached;
  }

  // 2. 무드에 맞는 카테고리에서 병렬로 책 풀 수집 (랜덤 페이지)
  const wCats = MOOD_CATEGORIES[weatherMain] || [];
  const tCats = MOOD_CATEGORIES[timeState]   || [];
  const cats  = [...new Set([...wCats, ...tCats])].slice(0, 3);

  const pool = [];
  await Promise.all(
    cats.map(async (cat) => {
      try {
        const page = Math.floor(Math.random() * 8) + 1;
        const { items } = await getBooksByGenre(cat, 15, page);
        pool.push(...withCovers(items));
      } catch { /* 카테고리 스킵 */ }
    })
  );

  const unique = Array.from(new Map(pool.map(b => [b.id, b])).values())
    .sort(() => Math.random() - 0.5);
  console.log(`[Rec] 📚 풀 수집 [${moodKey}] ${unique.length}권 (${cats.join(", ")})`);

  if (unique.length < count) {
    console.warn(`[Rec] ⚠️ 풀 부족 [${moodKey}]`);
    saveSessionCache(moodKey, unique);
    return unique;
  }

  // 3. Groq 선별 — 429 시 2초 대기 후 1회 재시도
  const wDesc    = MOOD_DESC[weatherMain] || "";
  const tDesc    = MOOD_DESC[timeState]   || "";
  const moodDesc = [wDesc, tDesc].filter(Boolean).join(" / ") || "분위기에 맞는 책";
  const listText = unique
    .slice(0, 40)
    .map((b, i) => `${i + 1}.${b.volumeInfo?.title}-${b.volumeInfo?.authors?.[0] || ""}`)
    .join(" ");

  try {
    const res = await enqueueGroq(() => fetch("/api/groq/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 20,
        messages: [
          { role: "system", content: "너는 엄격한 책 큐레이터야. 선별 기준을 반드시 따르고, 기준과 맞지 않는 책은 절대 고르지 마. 번호만 쉼표로 답해." },
          { role: "user",   content: `선별 기준: ${moodDesc}\n기준에 정확히 맞는 책 ${count}권 번호만 답해.\n${listText}` },
        ],
      }),
    }));

    if (res.ok) {
      const data = await res.json();
      const rawText = data.choices?.[0]?.message?.content || "";
      const indices = [...new Set((rawText.match(/\d+/g) || []).map(Number))]
        .filter(n => n >= 1 && n <= unique.length);
      const selected = indices.slice(0, count).map(n => unique[n - 1]).filter(Boolean);
      if (selected.length >= count) {
        console.log(`[Rec] ✅ Groq 성공 [${moodKey}] "${rawText}" →`, selected.map(b => b.volumeInfo?.title));
        saveSessionCache(moodKey, selected);
        return selected;
      }
      console.warn(`[Rec] ⚠️ 파싱 실패 [${moodKey}] "${rawText}"`);
    } else {
      console.warn(`[Rec] ❌ Groq ${res.status} [${moodKey}]`);
    }
  } catch (e) {
    console.warn(`[Rec] ❌ Groq 오류 [${moodKey}]`, e?.message);
  }

  // 4. 폴백: 셔플된 풀에서 선택
  const fallback = unique.slice(0, count);
  console.log(`[Rec] 🎲 폴백 [${moodKey}]`, fallback.map(b => b.volumeInfo?.title));
  saveSessionCache(moodKey, fallback);
  return fallback;
}

const QUOTES = [
  {
    lines: ["책은 한 권의 도끼여야 한다.", "우리 안의 얼어붙은 바다를", "깨트리는 도끼여야 한다."],
    author: "프란츠 카프카",
    bookTitle: "밀레나에게 보내는 편지",
    searchKeyword: "프란츠 카프카 밀레나에게 보내는 편지",
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
    bookTitle: "학문의 진보",
    searchKeyword: "프랜시스 베이컨 학문의 진보",
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
    bookTitle: "도리안 그레이의 초상",
    searchKeyword: "도리안 그레이의 초상 민음사",
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
    bookTitle: "베이컨 에세이",
    searchKeyword: "베이컨 에세이",
    bg: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80",
    imgFilter: "brightness(0.38) saturate(0.5)",
    tint: "bg-violet-950/52",
    blob: "from-violet-500/25 via-fuchsia-500/20 to-purple-400/15",
    accent: "text-violet-300/65",
    particles: "stars",
  },
  {
    lines: ["우리는 우리가", "혼자가 아니라는 것을 알기 위해", "책을 읽는다."],
    author: "C.S. 루이스",
    bookTitle: "헤아려 본 슬픔",
    searchKeyword: "헤아려 본 슬픔 홍성사",
    bg: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80",
    imgFilter: "brightness(0.4) saturate(0.5) hue-rotate(330deg)",
    tint: "bg-rose-950/50",
    blob: "from-rose-500/20 via-pink-500/15 to-red-400/10",
    accent: "text-rose-300/65",
    particles: "rays",
  },
  {
    lines: ["고전이란 누구나", "읽은 척하지만,", "아무도 읽지 않는 책이다."],
    author: "마크 트웨인",
    bookTitle: "허클베리 핀의 모험",
    searchKeyword: "허클베리 핀의 모험 민음사",
    bg: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80",
    imgFilter: "brightness(0.4) saturate(0.8)",
    tint: "bg-emerald-950/40",
    blob: "from-emerald-500/20 via-teal-500/15 to-green-400/10",
    accent: "text-emerald-300/65",
    particles: "rain",
  },
  {
    lines: ["방에 책이 없는 것은", "마치 몸에 영혼이", "없는 것과 같다."],
    author: "키케로",
    bookTitle: "의무론",
    searchKeyword: "키케로 의무론",
    bg: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=1200&q=80",
    imgFilter: "brightness(0.35) saturate(0.6) hue-rotate(180deg)",
    tint: "bg-sky-950/50",
    blob: "from-sky-500/20 via-blue-500/15 to-cyan-400/10",
    accent: "text-sky-300/65",
    particles: "stars",
  },
  {
    lines: ["단 한 권의 책밖에", "읽지 않은 사람을", "경계하라."],
    author: "토마스 아퀴나스",
    bookTitle: "신학대전",
    searchKeyword: "토마스 아퀴나스 신학대전",
    bg: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=1200&q=80",
    imgFilter: "brightness(0.3) saturate(0.4)",
    tint: "bg-stone-950/60",
    blob: "from-stone-500/20 via-neutral-500/15 to-zinc-400/10",
    accent: "text-stone-300/65",
    particles: "rays",
  },
  {
    lines: ["언제고 다시 읽을", "가치가 없는 책이라면,", "처음부터 읽을 가치가 없다."],
    author: "카를 융",
    bookTitle: "인간과 상징",
    searchKeyword: "카를 융 인간과 상징",
    bg: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&q=80",
    imgFilter: "brightness(0.35) saturate(0.7) hue-rotate(45deg)",
    tint: "bg-yellow-950/50",
    blob: "from-yellow-500/20 via-amber-500/15 to-orange-400/10",
    accent: "text-yellow-300/65",
    particles: "rain",
  },
  {
    lines: ["내가 세계를 알게 된 것은", "오직 책에 의해서였다.", "책은 내게 세상을 열어주었다."],
    author: "장 폴 사르트르",
    bookTitle: "말",
    searchKeyword: "사르트르 말",
    bg: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1200&q=80",
    imgFilter: "brightness(0.4) saturate(0.6) hue-rotate(280deg)",
    tint: "bg-fuchsia-950/50",
    blob: "from-fuchsia-500/20 via-purple-500/15 to-pink-400/10",
    accent: "text-fuchsia-300/65",
    particles: "stars",
  },
  {
    lines: ["만일 우리가 읽는 책이", "우리를 깨우지 않는다면,", "무엇 때문에 책을 읽는단 말인가?"],
    author: "프란츠 카프카",
    bookTitle: "변신",
    searchKeyword: "카프카 변신 민음사",
    bg: "https://images.unsplash.com/photo-1511108690759-009324a90311?w=1200&q=80",
    imgFilter: "brightness(0.4) saturate(0.5) hue-rotate(10deg)",
    tint: "bg-[#060614]/60",
    blob: "from-indigo-400/25 via-slate-500/20 to-zinc-500/15",
    accent: "text-indigo-300/70",
    particles: "rain",
  }
];

export default function Home() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { recommendation, weather, timeState } = useWeather();
  const { theme } = useTheme();

  const [shelf, setShelf]               = useState([]);
  const [shelfLoading, setShelfLoading] = useState(true);
  const [recBooks, setRecBooks]         = useState([]);
  const [recLoading, setRecLoading]     = useState(true);
  const [, setRecError]                  = useState(false);
  const [weatherRecBooks, setWeatherRecBooks] = useState([]);
  const [recommendGenre, setRecommendGenre] = useState("소설");
  const [bestBooks, setBestBooks] = useState([]);
  const [bestLoading, setBestLoading] = useState(true);
  // 데모 슬라이드별 독립 도서 (무드에 맞는 장르 고정)
  const [demoSlideBooks, setDemoSlideBooks] = useState({ rain: [], dawn: [], morning: [], snow: [] });
  // 캐러셀 상태
  const [activeSlide, setActiveSlide] = useState(0);
  const totalSlides = 7;
  // 글귀 슬라이드 랜덤 초기화
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * 11));

  // 배너가 한 바퀴 돌아 처음(0번)으로 올 때마다 명언을 새롭게 랜덤 지정
  useEffect(() => {
    if (activeSlide === 0) {
      setQuoteIndex(Math.floor(Math.random() * 11));
    }
  }, [activeSlide]);

  // 캐러셀 자동 전환
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlide, totalSlides]);

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

  // ── 날씨/시간 기반 추천 도서 로드 (Aladin 풀 → AI 선별 → 캐시) ──────
  useEffect(() => {
    let cancelled = false;
    fetchAIMoodBooks(weather?.main, timeState)
      .then(items => { if (!cancelled) setWeatherRecBooks(items); })
      .catch(() => { if (!cancelled) setWeatherRecBooks([]); });
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

  // ── 데모 슬라이드별 AI 무드 선별 — 순차 로딩으로 Groq 429 방지 ────
  useEffect(() => {
    let cancelled = false;
    const usedIds = new Set();

    const pick = (books) =>
      books.filter(b => {
        if (usedIds.has(b.id)) return false;
        usedIds.add(b.id);
        return true;
      }).slice(0, 2);

    const load = async () => {
      // 순차 실행 — 각 Groq 호출이 완료된 뒤 다음 호출 시작
      const rainBooks = await fetchAIMoodBooks("Rain",  "evening");
      if (!cancelled) setDemoSlideBooks(prev => ({ ...prev, rain: pick(rainBooks) }));

      const dawnBooks = await fetchAIMoodBooks(null,    "dawn");
      if (!cancelled) setDemoSlideBooks(prev => ({ ...prev, dawn: pick(dawnBooks) }));

      const morningBooks = await fetchAIMoodBooks("Clear", "morning");
      if (!cancelled) setDemoSlideBooks(prev => ({ ...prev, morning: pick(morningBooks) }));

      const snowBooks = await fetchAIMoodBooks("Snow",  "afternoon");
      if (!cancelled) setDemoSlideBooks(prev => ({ ...prev, snow: pick(snowBooks) }));

      if (!cancelled) console.log("[Rec] 🎨 모든 배너 로드 완료");
    };

    load().catch(() => {});
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

  // ─── 렌더링 ────────────────────────────────────────────────────────────

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
                  {weatherRecBooks && weatherRecBooks.length > 0 && (
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

          {/* ── 슬라이드 6: 명언 (랜덤) ── */}
          {activeSlide === 6 && (
            <motion.div
              key={`quote-slide-${quoteIndex}`}
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center overflow-hidden cursor-pointer group/quote"
              onClick={async () => {
                const quote = QUOTES[quoteIndex];
                if (quote.searchKeyword) {
                  try {
                    const res = await searchBooks(quote.searchKeyword, { maxResults: 1 });
                    if (res.items && res.items.length > 0) {
                      navigate(`/book/${res.items[0].id}`);
                    } else {
                      navigate(`/search?q=${encodeURIComponent(quote.searchKeyword)}`);
                    }
                  } catch (e) {
                    navigate(`/search?q=${encodeURIComponent(quote.searchKeyword)}`);
                  }
                }
              }}
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
              <div className="relative z-10 text-center px-10 max-w-lg transition-transform duration-500 group-hover/quote:scale-105">
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
                    className="text-xl md:text-2xl font-medium text-white/90 leading-[1.8] tracking-tight drop-shadow-md"
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
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.85 }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <p className="text-white/75 text-sm font-bold tracking-[0.3em] uppercase">
                      {QUOTES[quoteIndex].author}
                    </p>
                    <p className="text-white/50 text-[11px] font-medium tracking-widest drop-shadow-sm">
                      — {QUOTES[quoteIndex].bookTitle} —
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-8 text-[10px] text-white/50 tracking-[0.2em] uppercase flex items-center justify-center gap-2 opacity-0 group-hover/quote:opacity-100 transition-opacity duration-300"
                  >
                    <span className="w-6 h-px bg-white/20" />
                    책 상세 보기
                    <span className="w-6 h-px bg-white/20" />
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 좌우 화살표 (Hover 시 표시) */}
        <button 
          onClick={(e) => { e.stopPropagation(); setActiveSlide((prev) => (prev - 1 + totalSlides) % totalSlides); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 text-white opacity-0 group-hover:opacity-100 backdrop-blur-md transition-all hover:bg-black/40 z-20 shadow-lg"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setActiveSlide((prev) => (prev + 1) % totalSlides); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 text-white opacity-0 group-hover:opacity-100 backdrop-blur-md transition-all hover:bg-black/40 z-20 shadow-lg"
        >
          <ChevronRight size={24} />
        </button>


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
      <div className="space-y-12 px-6 pb-4">
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
                        <StatusBadge status={book.status} className="mb-0.5" />
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

        {/* 푸터 */}
        <footer className="mt-16 pt-10 pb-4 border-t border-border/40 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-5 opacity-40 hover:opacity-80 transition-opacity cursor-default">
            <BookOpen size={18} strokeWidth={2.5} />
            <span className="text-lg font-black tracking-tighter uppercase">Booklog</span>
          </div>
          <div className="flex gap-5 text-[11px] font-semibold text-muted-foreground/50 tracking-wider mb-6 uppercase">
            <span className="cursor-pointer hover:text-foreground transition-colors">About Us</span>
            <span className="cursor-pointer hover:text-foreground transition-colors">Terms</span>
            <span className="cursor-pointer hover:text-foreground transition-colors">Privacy</span>
            <span className="cursor-pointer hover:text-foreground transition-colors">Contact</span>
          </div>
          <p className="text-[10px] text-muted-foreground/40 tracking-[0.1em] uppercase">
            &copy; {new Date().getFullYear()} Booklog. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
