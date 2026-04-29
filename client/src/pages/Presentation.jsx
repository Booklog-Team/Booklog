import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Cloud, 
  Search, 
  Calendar, 
  Users, 
  Gift, 
  Code2, 
  Cpu, 
  Layers, 
  Lightbulb, 
  PlayCircle, 
  MessageCircle,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Database,
  Terminal,
  Trophy,
  CheckCircle2,
  Quote,
  Library as LibraryIcon,
  PenTool,
  ArrowDown
} from "lucide-react";

/**
 * Presentation Component
 * A full-screen slide deck for the Booklog Project
 */
const Presentation = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    // 01. 커버
    {
      type: "cover",
      content: {
        title: "BOOKLOG",
        subtitle: "나만의 따뜻한 서재",
        description: "날씨와 감성, 기록으로 연결되는 AI 독서 플랫폼",
        team: ["신민서", "이예진", "홍준화"],
        date: "2026. 04. 30",
        url: "https://booklog.kro.kr/"
      }
    },
    // 02. 프로젝트 개요
    {
      type: "table",
      title: "프로젝트 개요",
      data: [
        { label: "서비스명", value: "Booklog" },
        { label: "분류", value: "독서 기록 + AI 추천 + 커뮤니티 웹앱" },
        { label: "타겟", value: "독서 습관 형성을 원하는 입문자 및 다독가" },
        { label: "핵심 가치", value: "날씨·감성 맞춤 추천 / 게이미피케이션 / 커뮤니티" },
        { label: "개발 기간", value: "2026. 04. 22 ~ 04. 29" },
        { label: "주요 기능", value: "홈, 검색, 내 서재, 커뮤니티, 독서모임, 포인트, AI 챗봇" },
        { label: "배포 환경", value: "GitHub Actions / Docker / AWS EC2" }
      ]
    },
    // 03. 선정 배경 & 문제 정의
    {
      type: "problems",
      title: "선정 배경 & 문제 정의",
      items: [
        {
          id: 1,
          title: "도서 선택 장애",
          desc: "연간 6~7만 종의 신간 홍수 속에서 '나의 지금 기분'에 맞는 책을 찾기 어려움",
          tag: "Selection Overload"
        },
        {
          id: 2,
          title: "독서 습관 단절",
          desc: "성인 월평균 독서량 0.6권. 성취감과 보상 없이는 꾸준한 유지가 힘듦",
          tag: "Low Retention"
        },
        {
          id: 3,
          title: "독서 고립",
          desc: "오프라인 모임의 시공간적 장벽과 파편화된 SNS 독서 커뮤니티",
          tag: "Social Isolation"
        }
      ],
      solution: "날씨 × AI × 게이미피케이션을 통한 선순환 구조 구축"
    },
    // 04. 핵심 키워드 / 서비스
    {
      type: "keywords",
      title: "핵심 키워드 / 서비스",
      keywords: [
        {
          num: "01",
          title: "독서 기록화",
          items: [
            "서재, 읽는 중/완독 상태, 페이지 진행률",
            "메모, 별점, 독서 캘린더, 연속 독서일"
          ],
          tagline: "흩어진 독서 경험을 데이터로 축적하는 개인 서재"
        },
        {
          num: "02",
          title: "맞춤형 도서 발견",
          items: [
            "알라딘 API 검색, 장르 기반 추천",
            "홈 화면 추천, 날씨/시간대 기반 AI 추천"
          ],
          tagline: "사용자 취향과 상황에 맞는 도서 탐색 경험"
        },
        {
          num: "03",
          title: "독서 가치 확장",
          items: [
            "커뮤니티 독서 모임 / 게시판",
            "포인트 적립, 기부 시스템"
          ],
          tagline: "개인의 독서를 커뮤니티와 기부로 연결하는 플랫폼"
        }
      ]
    },
    // 05. 주요 기능: 날씨 × AI 홈 배너
    {
      type: "feature",
      title: "주요 기능: 날씨 × AI 홈 배너",
      subtitle: "Geolocation + OpenWeatherMap + Aladin + Groq AI",
      points: [
        "현재 위치의 날씨와 시간대를 분석하여 무드 결정",
        "알라딘 베스트셀러 중 무드에 맞는 카테고리 도서 풀 수집",
        "Groq AI가 LLM을 통해 실제 도서 중 테마에 부합하는 책만 선별",
        "AI 환각을 방지하기 위해 실제 API 데이터 인덱스 기반 추천"
      ]
    },
    // 06. 주요 기능: 도서 검색 & 상세
    {
      type: "feature",
      title: "주요 기능: 도서 검색 & 상세",
      subtitle: "Aladin API + Google Maps",
      points: [
        "실시간 키워드 검색 및 14개 장르별 탐색",
        "내 주변 도서관 찾기 (정보나루 API + 지도 마커)",
        "도서 대출 가능 여부 실시간 확인",
        "서재 즉시 추가 및 상태 관리"
      ]
    },
    // 07. 주요 기능: 내 서재 & 독서 캘린더
    {
      type: "feature",
      title: "주요 기능: 내 서재 & 독서 캘린더",
      subtitle: "Firebase Firestore",
      points: [
        "읽고 싶음 / 읽는 중 / 완독 3단계 상태 관리",
        "독서 진행률 슬라이더 및 월별 기록 캘린더 시각화",
        "연속 독서 Streak 시스템을 통한 습관 형성 유도",
        "완독 시 애니메이션 효과와 포인트 보상"
      ]
    },
    // 08. 주요 기능: 포인트 & 기부 시스템
    {
      type: "feature",
      title: "주요 기능: 포인트 & 기부 시스템",
      subtitle: "Gamification & Social Impact",
      points: [
        "독서 체크(+10P), 메모(+5P), 커뮤니티 활동 보상",
        "5단계 독서 레벨 시스템 (새싹 → 도서관 수호자)",
        "기부처 선택을 통한 사회적 가치 실현 (책읽는사회문화재단 등)",
        "독서 활동이 사회 기부로 이어지는 선순환 구조"
      ]
    },
    // 09. 주요 기능: 커뮤니티 & 독서 모임
    {
      type: "feature",
      title: "주요 기능: 커뮤니티 & 독서 모임",
      subtitle: "Social Reading",
      points: [
        "자유 / 독후감 / 질문 카테고리 기반 소통",
        "장르별 실시간 독서 모임 생성 및 참여",
        "모임 전용 실시간 채팅방 제공",
        "방장 전용 공지 및 모임 관리 기능"
      ]
    },
    // 10. 주요 기능: AI 챗봇 사서
    {
      type: "feature",
      title: "주요 기능: AI 챗봇 사서",
      subtitle: "Groq AI + Context Awareness",
      points: [
        "자연어 질문을 통한 개인화된 도서 추천",
        "현재 날씨와 상황(비 오는 날 등)을 반영한 대화",
        "사용자 서재 데이터를 분석하여 중복 없는 미독 도서 제안",
        "대화 문맥에서 도서 의도를 파악하여 즉시 카드 출력"
      ]
    },
    // 11. 주요 기능: 온보딩 & 프로필
    {
      type: "feature",
      title: "주요 기능: 온보딩 & 프로필",
      subtitle: "Personalization",
      points: [
        "Google OAuth 기반 간편 가입 프로세스",
        "초기 선호 장르 선택을 통한 맞춤형 홈 화면 구성",
        "상세 독서 통계 및 장르 분포 시각화 제공",
        "개인 취향과 레벨을 관리하는 프로필 허브"
      ]
    },
    // 12. 페르소나 5개
    {
      type: "persona",
      title: "페르소나 & 유저 시나리오 (1)",
      persona: {
        name: "이민우",
        age: "28세",
        job: "직장인",
        vibe: "감성 독자",
        profile: "퇴근 후 무엇을 읽을지 고민하는 시간이 아까움. 기분에 따른 맞춤 추천 희망.",
        scenario: "비 오는 금요일 퇴근길 → 앱 실행 → 홈 배너의 '감성 소설' 발견 → 서재 추가",
        keywords: ["상황 맞춤 추천", "무입력 발견", "즉시 시작"],
        image: "/persona_a.png"
      }
    },
    {
      type: "persona",
      title: "페르소나 & 유저 시나리오 (2)",
      persona: {
        name: "박지우",
        age: "22세",
        job: "대학생",
        vibe: "습관 형성자",
        profile: "작심삼일 독서 습관. 시각적인 성취와 보상이 있어야 계속할 동력이 생김.",
        scenario: "서재 진행률 100% 기록 → 완독 Confetti → 레벨업 → 포인트 기부",
        keywords: ["독서 습관 추적", "시각적 성취", "사회적 가치"],
        image: "/persona_b.png",
        position: "object-top"
      }
    },
    {
      type: "persona",
      title: "페르소나 & 유저 시나리오 (3)",
      persona: {
        name: "이서연",
        age: "25세",
        job: "직장인",
        vibe: "깊이 토론가",
        profile: "책 이야기를 나눌 진지한 공간 필요. 오프라인 모임은 부담스럽고 온라인은 산만함.",
        scenario: "독후감 게시 → '소설 모임' 발견 → 실시간 채팅 참여 및 토론",
        keywords: ["책 중심 소셜", "낮은 진입 장벽", "온라인 독서 모임"],
        image: "/persona_c.png",
        position: "object-top"
      }
    },
    {
      type: "persona",
      title: "페르소나 & 유저 시나리오 (4)",
      persona: {
        name: "김선유",
        age: "28세",
        job: "다독가",
        vibe: "감성 다독가",
        profile: "이미 읽은 책이 많아 비슷한 책만 고르게 됨. 신선한 새 책 발견이 어려움.",
        scenario: "AI 챗봇에게 '내 서재에 없는 비슷한 분위기 책' 요청 → 미독 도서 추천",
        keywords: ["미독 기반 추천", "취향 정교화", "발견의 신선함"],
        image: "/persona_d.png",
        position: "object-top"
      }
    },
    {
      type: "persona",
      title: "페르소나 & 유저 시나리오 (5)",
      persona: {
        name: "박민서",
        age: "22세",
        job: "대학생",
        vibe: "기록 분석가",
        profile: "독서 이력을 데이터로 관리하고 싶음. 장르 편중을 인식하고 성장을 확인하고 싶음.",
        scenario: "월별 캘린더 확인 → 장르 분포 차트 분석 → 부족한 장르 도서 탐색",
        keywords: ["데이터 분석", "장르 균형", "성장 지표"],
        image: "/persona_e.png",
        position: "object-top"
      }
    },
    // 17. 개발 환경 & 기술 스택
    {
      type: "tech",
      title: "개발 환경 & 기술 스택",
      frontend: ["React 19", "Vite 6", "Tailwind CSS 4", "shadcn/ui", "Framer Motion", "Recharts"],
      backend: ["Firebase Auth", "Firestore", "Express.js Proxy"],
      apis: ["OpenWeatherMap", "Aladin API", "Groq AI", "Google Maps"]
    },
    // 18. API 연동 아키텍처
    {
      type: "architecture",
      title: "API 연동 아키텍처",
      flow: [
        { from: "위치/날씨", to: "Geolocation + OpenWeatherMap", result: "실시간 환경 인식" },
        { from: "도서 데이터", to: "Aladin API", result: "70만 종 도서 메타데이터" },
        { from: "지능형 선별", to: "Groq AI (LLM)", result: "날씨/감성 필터링" },
        { from: "사용자 활동", to: "Firebase Firestore", result: "실시간 동기화" }
      ]
    },
    // 19. 시연 영상
    {
      type: "demo",
      title: "시연 영상",
      steps: ["온보딩/로그인", "홈 날씨 추천", "도서 탐색/검색", "서재 기록/캘린더", "포인트 기부", "커뮤니티/채팅", "AI 챗봇"]
    },
    // 20. 문제 & 해결 과정
    {
      type: "challenges",
      title: "문제 & 해결 과정",
      items: [
        { problem: "AI 환각(Hallucination)", solution: "실제 도서 API 결과를 AI에게 넘겨 번호로 선택하게 하는 구조로 환각 0%" },
        { problem: "API Rate Limit", solution: "700ms 간격의 비동기 큐 처리 및 5분 세션 캐싱 도입" },
        { problem: "분위기 불일치", solution: "카테고리 제한 및 정교한 네거티브 프롬프트 설계" },
        { problem: "데이터 부정합", solution: "API별 상이한 데이터 스키마를 통합 래퍼 함수로 정규화" }
      ]
    },
    // 21. 팀원 소개 & 역할 분담
    {
      type: "team",
      title: "팀원 소개 & 역할 분담",
      members: [
        { name: "이예진", role: "팀장 / 프론트엔드", task: "내 서재, 독서 캘린더, 테마 시스템, UI 아키텍처", photo: "/team/yejin.jpg" },
        { name: "신민서", role: "프론트엔드 / DB", task: "온보딩, 회원가입/로그인, 포인트 시스템, 커뮤니티, 데이터 관리, 배포", photo: "/team/minseo.jpg" },
        { name: "홍준화", role: "프론트엔드 / API", task: "홈, AI 추천, 도서 검색/상세, 챗봇, API 연동, 디자인, 발표 자료 제작", photo: "/team/junhwa.jpg" }
      ]
    },
    // 22. 회고 & 배운 점
    {
      type: "retrospective",
      title: "프로젝트 회고 & 배운 점",
      items: [
        "복합 외부 API 연동 및 데이터 가공 역량 확보",
        "LLM(AI)의 한계를 기술적으로 극복하는 아키텍처 설계 경험",
        "Firebase 기반 실시간 데이터 처리 및 사용자 경험 최적화",
        "협업 브랜치 전략 및 역할 분담을 통한 생산성 향상"
      ],
      future: "PWA 전환 및 백엔드 보완을 통한 완성도 향상"
    },
    // 23. 클로징
    {
      type: "closing",
      content: {
        quote: "오늘의 날씨가 당신의 다음 책을 추천합니다",
        message: "Booklog와 함께 가치 있는 독서 여정을 시작하세요.",
        thankYou: "감사합니다.",
        qa: "Q & A"
      }
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide]);

  return (
    <div className="fixed inset-0 bg-[#0c111d] text-slate-100 overflow-hidden font-sans selection:bg-primary/30 z-[9999]">
      {/* Background Ornaments */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2000')] bg-cover bg-center opacity-[0.35]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c111d]/40 via-[#0c111d]/80 to-[#0c111d]" />
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
        
        {/* Floating Icons */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-[15%] right-[10%] text-primary/20 opacity-30"
        >
          <BookOpen size={120} />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute bottom-[15%] left-[10%] text-slate-500/20 opacity-30"
        >
          <PenTool size={100} />
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 z-50 bg-white/5">
        <motion.div 
          className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="absolute bottom-10 right-10 flex gap-4 z-50">
        <button 
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-20 transition-all active:scale-90"
        >
          <ChevronLeft />
        </button>
        <button 
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] disabled:opacity-20 transition-all active:scale-90"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Slide Index */}
      <div className="absolute bottom-10 left-10 text-xs font-bold tracking-widest text-slate-500 z-50">
        {String(currentSlide + 1).padStart(2, '0')} / {slides.length}
      </div>

      {/* Content Area */}
      <div className="relative h-full w-full flex items-center justify-center px-24 py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-7xl h-full flex flex-col justify-center"
          >
            <SlideContent slide={slides[currentSlide]} currentSlide={currentSlide} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── Feature UI Preview Components ──────────────────────────── */
const HomePreview = () => (
  <div className="w-full h-full bg-[#fafaf8] overflow-hidden flex flex-col text-xs">
    <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-100">
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center"><span className="text-white font-black text-[8px]">B</span></div>
        <span className="font-bold text-orange-500 text-[10px]">Booklog</span>
      </div>
      <div className="w-5 h-5 rounded-full bg-orange-100 border border-orange-200" />
    </div>
    <div className="mx-2 mt-2 rounded-xl overflow-hidden relative flex-shrink-0" style={{height:'118px',background:'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#1a1a4e 100%)'}}>
      <div className="absolute inset-0 overflow-hidden opacity-25">
        {[...Array(10)].map((_,i)=><div key={i} className="absolute top-0 w-px bg-blue-300" style={{left:`${6+i*10}%`,height:'50%'}}/>)}
      </div>
      <div className="absolute inset-0 p-3 flex flex-col justify-between">
        <div>
          <div className="text-[8px] text-blue-300 font-bold mb-0.5">🌧️ 비 오는 저녁 · AI 선별 추천</div>
          <div className="text-white font-black text-sm leading-tight">감성적인 저녁을 위한<br/>오늘의 책</div>
        </div>
        <div className="flex gap-2">
          {[{c:'#8B5CF6',t:'채식주의자'},{c:'#3B82F6',t:'어린왕자'}].map((b,i)=>(
            <div key={i} className="w-12 h-16 rounded-lg flex items-end justify-center pb-1 text-[6px] text-white text-center font-bold" style={{background:`linear-gradient(135deg,${b.c}80,${b.c}30)`,border:`1px solid ${b.c}40`}}>{b.t}</div>
          ))}
        </div>
      </div>
    </div>
    <div className="px-2 mt-2">
      <div className="text-[9px] font-bold text-gray-600 mb-1.5">📚 관심 장르 추천 · 소설</div>
      <div className="flex gap-1.5">
        {['#D97706','#7C3AED','#0891B2','#16A34A'].map((c,i)=>(
          <div key={i} className="w-12 rounded-xl flex-shrink-0" style={{height:'60px',background:`linear-gradient(135deg,${c}40,${c}15)`,border:`1px solid ${c}25`}}/>
        ))}
      </div>
    </div>
    <div className="px-2 mt-2">
      <div className="text-[9px] font-bold text-gray-600 mb-1.5">🏆 베스트셀러</div>
      <div className="flex gap-1.5">
        {['#EF4444','#F59E0B','#10B981'].map((c,i)=>(
          <div key={i} className="w-12 rounded-xl flex-shrink-0" style={{height:'60px',background:`linear-gradient(135deg,${c}40,${c}15)`,border:`1px solid ${c}25`}}/>
        ))}
      </div>
    </div>
    <div className="flex justify-around items-center py-2 bg-white border-t border-gray-100 mt-auto">
      {['🏠','🔍','📚','👥','👤'].map((e,i)=>(
        <div key={i} className={`flex flex-col items-center gap-0.5 ${i===0?'text-orange-500':'text-gray-400'}`}>
          <span className="text-sm">{e}</span>
          {i===0&&<div className="w-1 h-1 rounded-full bg-orange-400"/>}
        </div>
      ))}
    </div>
  </div>
);

const SearchPreview = () => (
  <div className="w-full h-full bg-white overflow-hidden flex flex-col text-xs">
    <div className="px-3 py-2.5 border-b border-gray-100 bg-white">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100">
        <span className="text-gray-400 text-sm">🔍</span>
        <span className="text-gray-400 text-[10px]">책 제목, 저자 검색...</span>
      </div>
    </div>
    <div className="px-3 py-2 flex gap-1.5 overflow-hidden border-b border-gray-50">
      {['소설','에세이','인문','자기계발','과학'].map((g,i)=>(
        <div key={i} className={`px-2.5 py-1 rounded-full text-[8px] font-bold flex-shrink-0 ${i===0?'bg-orange-500 text-white':'bg-gray-100 text-gray-500'}`}>{g}</div>
      ))}
    </div>
    <div className="flex-1 overflow-hidden divide-y divide-gray-50">
      {[{title:'채식주의자',author:'한강',pub:'창비',c:'#7C3AED'},{title:'아몬드',author:'손원평',pub:'창비',c:'#0891B2'},{title:'소년이 온다',author:'한강',pub:'창비',c:'#16A34A'},{title:'82년생 김지영',author:'조남주',pub:'민음사',c:'#F59E0B'}].map((b,i)=>(
        <div key={i} className="flex gap-3 px-3 py-2 items-center">
          <div className="w-9 h-12 rounded-md flex-shrink-0" style={{background:`linear-gradient(135deg,${b.c}60,${b.c}20)`}}/>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[10px] text-gray-800 leading-snug">{b.title}</div>
            <div className="text-[8px] text-gray-500">{b.author} · {b.pub}</div>
            <div className="mt-1 inline-block px-1.5 py-0.5 bg-gray-100 rounded text-[7px] text-gray-500">소설</div>
          </div>
          <div className="text-[8px] text-orange-400 font-bold flex-shrink-0">서재+</div>
        </div>
      ))}
    </div>
    <div className="flex justify-around items-center py-2 bg-white border-t border-gray-100">
      {['🏠','🔍','📚','👥','👤'].map((e,i)=>(
        <div key={i} className={`flex flex-col items-center gap-0.5 ${i===1?'text-orange-500':'text-gray-400'}`}>
          <span className="text-sm">{e}</span>
          {i===1&&<div className="w-1 h-1 rounded-full bg-orange-400"/>}
        </div>
      ))}
    </div>
  </div>
);

const LibraryPreview = () => (
  <div className="w-full h-full bg-[#fafaf8] overflow-hidden flex flex-col text-xs">
    <div className="px-3 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between">
      <span className="font-black text-[13px] text-gray-800">내 서재</span>
      <div className="flex items-center gap-1 text-orange-500">
        <span>🔥</span><span className="font-bold text-[9px]">14일 연속</span>
      </div>
    </div>
    <div className="flex bg-white border-b border-gray-100">
      {[{l:'전체',n:7},{l:'읽는 중',n:2},{l:'완독',n:4}].map((t,i)=>(
        <div key={i} className={`flex-1 py-1.5 text-center text-[9px] font-bold ${i===1?'text-orange-500 border-b-2 border-orange-500':'text-gray-400'}`}>
          {t.l} <span className="opacity-60">{t.n}</span>
        </div>
      ))}
    </div>
    <div className="px-2 py-2 space-y-2 flex-shrink-0">
      {[{title:'채식주의자',progress:68,c:'#7C3AED',author:'한강'},{title:'아몬드',progress:35,c:'#0891B2',author:'손원평'}].map((b,i)=>(
        <div key={i} className="bg-white rounded-xl p-2 shadow-sm border border-gray-50 flex gap-2.5 items-start">
          <div className="w-9 h-12 rounded-lg flex-shrink-0" style={{background:`linear-gradient(135deg,${b.c}60,${b.c}20)`}}/>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[10px] text-gray-800">{b.title}</div>
            <div className="text-[8px] text-gray-500">{b.author}</div>
            <div className="mt-1.5">
              <div className="flex justify-between text-[7px] text-gray-400 mb-0.5">
                <span>진행률</span><span className="font-bold text-orange-500">{b.progress}%</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full" style={{width:`${b.progress}%`}}/>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="mx-2 mb-1 p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="text-[8px] font-bold text-gray-600 mb-1">📅 2026년 4월 독서 기록</div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({length:28},(_,i)=>(
          <div key={i} className={`h-3.5 rounded text-[6px] flex items-center justify-center font-bold ${[2,5,9,13,17,21,24,27].includes(i)?'bg-orange-400 text-white':'bg-gray-50 text-gray-300'}`}>{i+1}</div>
        ))}
      </div>
    </div>
    <div className="flex justify-around items-center py-2 bg-white border-t border-gray-100 mt-auto">
      {['🏠','🔍','📚','👥','👤'].map((e,i)=>(
        <div key={i} className={`flex flex-col items-center gap-0.5 ${i===2?'text-orange-500':'text-gray-400'}`}>
          <span className="text-sm">{e}</span>
          {i===2&&<div className="w-1 h-1 rounded-full bg-orange-400"/>}
        </div>
      ))}
    </div>
  </div>
);

const PointsPreview = () => (
  <div className="w-full h-full bg-[#fafaf8] overflow-hidden flex flex-col text-xs">
    <div className="px-3 py-2.5 bg-white border-b border-gray-100">
      <span className="font-black text-[13px] text-gray-800">포인트 & 기부</span>
    </div>
    <div className="mx-2 mt-2 p-3 rounded-xl text-white relative overflow-hidden flex-shrink-0" style={{background:'linear-gradient(135deg,#f97316,#ea580c)'}}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-[8px] opacity-80">현재 레벨</div>
          <div className="font-black text-[13px]">📚 꾸준한 독자</div>
        </div>
        <div className="text-right">
          <div className="text-[8px] opacity-80">포인트</div>
          <div className="font-black text-lg">240P</div>
        </div>
      </div>
      <div className="mt-2">
        <div className="flex justify-between text-[7px] opacity-75 mb-0.5"><span>다음: 책벌레 🐛</span><span>150P까지 110P</span></div>
        <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{width:'62%'}}/>
        </div>
      </div>
    </div>
    <div className="px-2 mt-2 flex-1 overflow-hidden">
      <div className="text-[9px] font-bold text-gray-600 mb-1">오늘 적립 내역</div>
      <div className="space-y-1.5">
        {[{icon:'📖',label:'독서 기록',pts:'+10P',done:true},{icon:'✍️',label:'메모 작성',pts:'+5P',done:true},{icon:'💬',label:'커뮤니티 글',pts:'+3P',done:false}].map((r,i)=>(
          <div key={i} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5 shadow-sm border border-gray-50">
            <div className="flex items-center gap-1.5"><span>{r.icon}</span><span className="text-[9px] font-bold text-gray-700">{r.label}</span></div>
            <span className={`text-[9px] font-black ${r.done?'text-orange-500':'text-gray-300'}`}>{r.pts}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[9px] font-bold text-gray-600 mb-1">기부처 선택</div>
      <div className="flex gap-1.5">
        {[{icon:'📚',name:'책읽는사회문화재단',sel:true},{icon:'🧒',name:'어린이재단',sel:false},{icon:'🏛️',name:'국립장애인도서관',sel:false}].map((c,i)=>(
          <div key={i} className={`flex-1 p-1.5 rounded-lg border text-center ${c.sel?'border-orange-400 bg-orange-50':'border-gray-100 bg-white'}`}>
            <div className="text-sm">{c.icon}</div>
            <div className="text-[6px] font-bold text-gray-600 leading-tight mt-0.5">{c.name}</div>
          </div>
        ))}
      </div>
    </div>
    <div className="flex justify-around items-center py-2 bg-white border-t border-gray-100 mt-auto">
      {['🏠','🔍','📚','👥','👤'].map((e,i)=>(
        <div key={i} className="flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-sm">{e}</span>
        </div>
      ))}
    </div>
  </div>
);

const CommunityPreview = () => (
  <div className="w-full h-full bg-[#fafaf8] overflow-hidden flex flex-col text-xs">
    <div className="px-3 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between">
      <span className="font-black text-[13px] text-gray-800">커뮤니티</span>
      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-black">+</div>
    </div>
    <div className="flex bg-white border-b border-gray-100">
      {['자유게시판','독서 모임'].map((t,i)=>(
        <div key={i} className={`flex-1 py-1.5 text-center text-[9px] font-bold ${i===0?'text-orange-500 border-b-2 border-orange-500':'text-gray-400'}`}>{t}</div>
      ))}
    </div>
    <div className="flex-1 overflow-hidden divide-y divide-gray-50 bg-white">
      {[{tag:'독후감',title:'채식주의자를 읽고 나서...',likes:12,comments:4,time:'방금',user:'책벌레민수'},{tag:'질문',title:'비 오는 날 읽기 좋은 소설 추천해주세요',likes:8,comments:11,time:'1시간 전',user:'소설덕후'},{tag:'자유',title:'📚 100권 완독 달성했어요!',likes:34,comments:7,time:'2시간 전',user:'독서왕'}].map((p,i)=>(
        <div key={i} className="px-3 py-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className={`px-1.5 py-0.5 rounded text-[6px] font-bold ${p.tag==='독후감'?'bg-purple-100 text-purple-600':p.tag==='질문'?'bg-blue-100 text-blue-600':'bg-gray-100 text-gray-600'}`}>{p.tag}</div>
            <span className="text-[7px] text-gray-400">{p.user}</span>
          </div>
          <div className="text-[9px] font-bold text-gray-800 leading-snug">{p.title}</div>
          <div className="flex gap-3 mt-0.5 text-[7px] text-gray-400">
            <span>❤️ {p.likes}</span><span>💬 {p.comments}</span><span>{p.time}</span>
          </div>
        </div>
      ))}
      <div className="mx-2 my-1.5 p-2 rounded-xl bg-orange-50 border border-orange-100 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-orange-200 flex items-center justify-center text-sm flex-shrink-0">📖</div>
        <div>
          <div className="text-[8px] font-black text-orange-700">소설 독서 모임</div>
          <div className="text-[7px] text-orange-500">참가 중 · 4명 · 채팅방 활성</div>
        </div>
      </div>
    </div>
    <div className="flex justify-around items-center py-2 bg-white border-t border-gray-100">
      {['🏠','🔍','📚','👥','👤'].map((e,i)=>(
        <div key={i} className={`flex flex-col items-center gap-0.5 ${i===3?'text-orange-500':'text-gray-400'}`}>
          <span className="text-sm">{e}</span>
          {i===3&&<div className="w-1 h-1 rounded-full bg-orange-400"/>}
        </div>
      ))}
    </div>
  </div>
);

const ChatbotPreview = () => (
  <div className="w-full h-full bg-[#fafaf8] overflow-hidden flex flex-col text-xs">
    <div className="px-3 py-2 bg-white border-b border-gray-100 flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-base flex-shrink-0">📚</div>
      <div>
        <div className="font-bold text-[10px] text-gray-800">AI 사서</div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400"/><span className="text-[7px] text-gray-400">온라인</span>
        </div>
      </div>
    </div>
    <div className="flex-1 px-3 py-2 space-y-2 overflow-hidden">
      <div className="flex gap-2 items-start">
        <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-[10px] flex-shrink-0">📚</div>
        <div className="bg-white rounded-2xl rounded-tl-sm p-2 shadow-sm border border-gray-100 max-w-[80%]">
          <p className="text-[8px] text-gray-700 leading-relaxed">안녕하세요! 오늘 날씨나 기분에 맞는 책을 추천해드릴게요 ☀️</p>
        </div>
      </div>
      <div className="flex justify-end">
        <div className="bg-orange-500 rounded-2xl rounded-tr-sm p-2 max-w-[75%]">
          <p className="text-[8px] text-white">비 오는 날 읽기 좋은 감성 소설 추천해줘</p>
        </div>
      </div>
      <div className="flex gap-2 items-start">
        <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-[10px] flex-shrink-0">📚</div>
        <div className="bg-white rounded-2xl rounded-tl-sm p-2 shadow-sm border border-gray-100 max-w-[88%]">
          <p className="text-[8px] text-gray-700 mb-1.5 leading-relaxed">빗소리와 어울리는 감성 소설 2권을 골라봤어요! 🌧️</p>
          <div className="flex gap-1.5">
            {[{title:'채식주의자',author:'한강',c:'#7C3AED'},{title:'소년이 온다',author:'한강',c:'#0891B2'}].map((b,i)=>(
              <div key={i} className="flex-1 rounded-lg overflow-hidden border border-gray-100">
                <div className="h-10" style={{background:`linear-gradient(135deg,${b.c}50,${b.c}20)`}}/>
                <div className="px-1 py-0.5">
                  <div className="text-[7px] font-bold text-gray-800 leading-tight">{b.title}</div>
                  <div className="text-[6px] text-gray-500">{b.author}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    <div className="px-3 pb-2 pt-1.5 bg-white border-t border-gray-100">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
        <span className="flex-1 text-[8px] text-gray-400">메시지 입력...</span>
        <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
          <span className="text-white text-[7px]">↑</span>
        </div>
      </div>
    </div>
  </div>
);

const OnboardingPreview = () => (
  <div className="w-full h-full bg-white overflow-hidden flex flex-col text-xs">
    <div className="px-4 pt-4 pb-2 text-center flex-shrink-0">
      <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-xl mx-auto mb-2">B</div>
      <div className="font-black text-base text-gray-800">Booklog</div>
      <div className="text-[10px] text-gray-500 mt-1">관심 장르를 선택해주세요</div>
    </div>
    <div className="px-3 grid grid-cols-4 gap-1.5 flex-1 content-start">
      {[{id:'소설',e:'📖',s:true},{id:'인문',e:'🏛️',s:false},{id:'과학',e:'🔬',s:true},{id:'경제',e:'📈',s:false},{id:'자기계발',e:'🚀',s:true},{id:'예술',e:'🎨',s:false},{id:'역사',e:'🏺',s:false},{id:'아동',e:'🎠',s:false}].map((g,i)=>(
        <div key={i} className={`rounded-xl p-1.5 text-center border-2 ${g.s?'bg-orange-50 border-orange-400':'bg-gray-50 border-transparent'}`}>
          <div className="text-lg mb-0.5">{g.e}</div>
          <div className={`text-[7px] font-bold ${g.s?'text-orange-500':'text-gray-500'}`}>{g.id}</div>
        </div>
      ))}
    </div>
    <div className="px-3 pb-3 mt-2">
      <div className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-[10px] font-black text-center">시작하기 →</div>
    </div>
  </div>
);

const getFeatureInfo = (title) => {
  if (title.includes("홈"))       return { icon: <Cloud size={28} />,         Preview: HomePreview };
  if (title.includes("검색"))     return { icon: <Search size={28} />,        Preview: SearchPreview };
  if (title.includes("서재"))     return { icon: <Calendar size={28} />,      Preview: LibraryPreview };
  if (title.includes("포인트"))   return { icon: <Trophy size={28} />,        Preview: PointsPreview };
  if (title.includes("커뮤니티")) return { icon: <Users size={28} />,         Preview: CommunityPreview };
  if (title.includes("챗봇"))     return { icon: <MessageCircle size={28} />, Preview: ChatbotPreview };
  if (title.includes("온보딩"))   return { icon: <Smartphone size={28} />,        Preview: OnboardingPreview };
  return { icon: <BookOpen size={28} />, Preview: null };
};

const TeamMemberPhoto = ({ src, name }) => {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="w-full h-full bg-slate-700 flex items-center justify-center text-5xl font-black text-white">
        {name[0]}
      </div>
    );
  }
  return <img src={src} alt={name} className="w-full h-full object-cover object-top" onError={() => setErr(true)} />;
};

const SlideContent = ({ slide, currentSlide }) => {
  const { type, title, subtitle, content, data, items, persona, keywords, members, frontend, backend, apis, flow, points, steps } = slide;

  switch (type) {
    case "cover":
      return (
        <div className="text-center space-y-8">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xl mb-4"
          >
            <BookOpen size={26} /> {content.subtitle}
          </motion.div>
          <motion.h1 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="text-[180px] font-black leading-tight tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 pb-8"
          >
            {content.title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-4xl text-slate-400 font-medium max-w-3xl mx-auto"
          >
            {content.description}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="pt-20 grid grid-cols-3 gap-10 max-w-3xl mx-auto"
          >
            <div className="space-y-2 text-center">
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Team</p>
              <p className="text-slate-200 font-bold text-xl">{content.team.join(", ")}</p>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Date</p>
              <p className="text-slate-200 font-bold text-xl">{content.date}</p>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">URL</p>
              <div className="flex flex-col items-center gap-3">
                <a 
                  href="https://booklog.kro.kr/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary font-bold flex items-center justify-center gap-1 hover:underline underline-offset-4 transition-all"
                >
                  booklog.kro.kr <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      );

    case "table":
      return (
        <div className="space-y-12">
          <SlideHeader title={title} />
          <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
            {data.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-6 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors"
              >
                <div className="w-32 text-slate-500 font-bold text-sm uppercase tracking-wider">{item.label}</div>
                <div className="flex-1 text-slate-200 font-semibold text-lg text-left">{item.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      );

    case "problems":
      return (
        <div className="space-y-16">
          <SlideHeader title={title} />
          <div className="grid grid-cols-3 gap-10">
            {items.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.2 }}
                className="p-10 rounded-[3rem] bg-white/5 border border-white/10 flex flex-col justify-between min-h-[400px] group hover:border-primary/50 transition-all hover:bg-primary/5 shadow-2xl text-left relative overflow-hidden"
              >
                <div>
                  <div className="w-16 h-16 rounded-[1.5rem] bg-primary/20 text-primary flex items-center justify-center mb-8 font-black text-2xl shadow-inner">
                    0{item.id}
                  </div>
                  <h3 className="text-3xl font-black mb-6 group-hover:text-primary transition-colors leading-tight">{item.title}</h3>
                  <p className="text-slate-400 text-lg leading-relaxed font-medium">{item.desc}</p>
                </div>
                <div className="text-xs font-black uppercase tracking-[0.3em] text-primary/60 mt-10 flex items-center gap-2">
                  <div className="w-8 h-px bg-primary/40" /> {item.tag}
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="p-10 rounded-[2.5rem] bg-gradient-to-r from-primary to-orange-500 text-white font-black text-center text-3xl shadow-[0_25px_60px_rgba(var(--primary),0.4)] border border-white/20"
          >
            <div className="flex items-center justify-center gap-4">
              <Lightbulb size={36} />
              Solution: {slide.solution}
            </div>
          </motion.div>
        </div>
      );

    case "keywords":
      return (
        <div className="space-y-12">
          <SlideHeader title={title} />
          <div className="grid grid-cols-3 gap-8">
            {keywords.map((kw, i) => (
              <motion.div 
                key={i}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.2 }}
                className="p-10 rounded-[3rem] bg-white/5 border border-white/10 flex flex-col justify-between min-h-[450px] group hover:border-primary/50 transition-all hover:bg-primary/5 shadow-2xl text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 text-primary/5 font-black text-8xl group-hover:text-primary/10 transition-colors">
                  {kw.num}
                </div>
                <div>
                  <h3 className="text-4xl font-black mb-8 group-hover:text-primary transition-colors leading-tight">{kw.title}</h3>
                  <ul className="space-y-4">
                    {kw.items.map((item, idx) => (
                      <li key={idx} className="text-slate-300 text-lg font-medium flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/10 group-hover:border-primary/20 transition-all">
                  <p className="text-primary font-bold text-lg leading-relaxed italic">"{kw.tagline}"</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );

    case "feature": {
      const { icon: featureIcon, Preview } = getFeatureInfo(title);
      return (
        <div className="space-y-6 h-full flex flex-col justify-center">
          <SlideHeader title={title} />
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex-shrink-0">
              {featureIcon}
            </div>
            <p className="text-primary font-black tracking-[0.2em] text-sm uppercase">{subtitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-16 items-center flex-1">
            <div className="space-y-6 text-left">
              {points.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-start gap-6 group"
                >
                  <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-sm font-black text-primary border border-primary/20 shadow-lg group-hover:bg-primary group-hover:text-white transition-all">
                    0{i + 1}
                  </div>
                  <p className="text-xl text-slate-200 leading-relaxed font-bold text-left group-hover:translate-x-2 transition-transform">{p}</p>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="h-full max-h-[480px] flex flex-col rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900"
            >
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-white/10 flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <div className="flex-1 mx-3 py-1 px-3 rounded-lg bg-slate-700 text-slate-400 text-xs font-mono">booklog.kro.kr</div>
              </div>
              <div className="flex-1 overflow-hidden relative">
                {Preview ? <Preview /> : <div className="w-full h-full flex items-center justify-center text-primary/30">{featureIcon && React.cloneElement(featureIcon, { size: 120 })}</div>}
              </div>
            </motion.div>
          </div>
        </div>
      );
    }

    case "persona":
      return (
        <div className="space-y-12 h-full flex flex-col justify-center">
          <SlideHeader title={title} />
          <div className="grid grid-cols-12 gap-12 items-stretch flex-1">
            <motion.div 
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="col-span-4 rounded-[4rem] overflow-hidden relative group shadow-2xl border border-white/10 bg-slate-800"
            >
              <img 
                src={persona.image} 
                alt={persona.name} 
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover ${persona.position || 'object-top'} transition-transform duration-700 group-hover:scale-110`} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c111d] via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-10 left-10 right-10">
                <div className="inline-block px-4 py-1 rounded-full bg-primary text-white font-black text-xs mb-3 shadow-xl uppercase tracking-widest">{persona.vibe}</div>
                <h3 className="text-5xl font-black text-white drop-shadow-lg">{persona.name}</h3>
                <p className="text-slate-300 font-bold mt-1 text-lg">{persona.age} · {persona.job}</p>
              </div>
            </motion.div>

            <div className="col-span-8 flex flex-col gap-8">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-10 rounded-[3rem] bg-white/5 border border-white/10 text-left space-y-6 flex-1 flex flex-col justify-center shadow-xl backdrop-blur-sm"
              >
                <Quote className="text-primary opacity-40" size={48} />
                <p className="text-3xl font-bold italic leading-relaxed text-slate-100">
                  {persona.profile}
                </p>
                <div className="flex flex-wrap gap-3 pt-4">
                  {persona.keywords.map(kw => (
                    <span key={kw} className="px-6 py-2 rounded-2xl bg-white/5 text-slate-300 font-black text-sm border border-white/10 hover:bg-white/10 transition-colors cursor-default">#{kw}</span>
                  ))}
                </div>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="p-10 rounded-[3rem] bg-primary/10 border border-primary/20 text-left relative overflow-hidden group shadow-xl"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                  <PlayCircle size={100} className="text-primary" />
                </div>
                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs mb-6">Real User Scenario</p>
                <div className="space-y-6">
                  <p className="text-2xl font-black leading-relaxed text-white">
                    {persona.scenario}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      );

    case "tech":
      return (
        <div className="space-y-16 h-full flex flex-col justify-center py-10">
          <SlideHeader title={title} />
          <div className="grid grid-cols-3 gap-16 max-w-7xl mx-auto w-full">
            <TechCategory icon={<Code2 className="text-blue-400" size={48} />} title="Frontend" items={frontend} color="blue" />
            <TechCategory icon={<Database className="text-orange-400" size={48} />} title="Backend" items={backend} color="orange" />
            <TechCategory icon={<Globe className="text-emerald-400" size={48} />} title="APIs" items={apis} color="emerald" />
          </div>
        </div>
      );

    case "architecture":
      return (
        <div className="space-y-16 h-full flex flex-col justify-center py-10">
          <SlideHeader title={title} />
          <div className="grid grid-cols-1 gap-8 max-w-6xl mx-auto items-center w-full">
            {flow.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex items-center gap-12 group"
              >
                <div className="w-56 text-right font-black text-slate-500 text-base uppercase tracking-[0.25em] group-hover:text-primary transition-colors">{step.from}</div>
                <div className="flex-1 p-12 rounded-[3rem] bg-white/5 border border-white/10 flex items-center justify-between group-hover:bg-white/[0.08] transition-all group-hover:border-primary/30 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="font-black text-3xl text-slate-100 flex items-center gap-6 relative z-10">
                    <ArrowDown className="text-primary -rotate-90" size={32} />
                    {step.to}
                  </div>
                  <div className="px-8 py-3 rounded-2xl bg-primary/20 text-primary font-black text-base uppercase tracking-[0.15em] relative z-10 shadow-xl border border-primary/20 backdrop-blur-sm">
                    {step.result}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );

    case "challenges":
      return (
        <div className="space-y-12">
          <SlideHeader title={title} />
          <div className="grid grid-cols-2 gap-10 max-w-6xl mx-auto">
            {items.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-5 shadow-2xl text-left hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3 text-rose-400 font-black text-xs uppercase tracking-widest">
                  <ShieldCheck size={20} /> Problem
                </div>
                <p className="text-3xl font-black text-slate-100 leading-tight">{item.problem}</p>
                <div className="h-px bg-white/10 my-6" />
                <div className="flex items-center gap-3 text-emerald-400 font-black text-xs uppercase tracking-widest">
                  <Zap size={20} /> Solution
                </div>
                <p className="text-slate-300 leading-relaxed text-lg font-medium">{item.solution}</p>
              </motion.div>
            ))}
          </div>
        </div>
      );

    case "demo":
      return (
        <div className="space-y-12 h-full flex flex-col justify-center">
          <SlideHeader title={title} />
          <div className="relative aspect-video max-w-4xl mx-auto w-full rounded-[3rem] bg-slate-900 border border-white/20 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000')] bg-cover" />
            <PlayCircle size={100} className="text-white mb-8 z-10 animate-bounce" />
            <div className="z-10 grid grid-cols-4 gap-6 px-10 w-full">
              {steps.map((step, i) => (
                <div key={i} className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md text-xs font-black text-center text-white border border-white/10 shadow-lg">{step}</div>
              ))}
            </div>
          </div>
        </div>
      );

    case "team":
      return (
        <div className="space-y-12">
          <SlideHeader title={title} />
          <div className="grid grid-cols-3 gap-8">
            {members.map((m, i) => (
              <motion.div 
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.2 }}
                className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 group hover:bg-white/[0.08] transition-all text-center space-y-6 shadow-2xl"
              >
                <div className="w-40 h-40 rounded-full bg-slate-800 mx-auto overflow-hidden group-hover:scale-110 transition-transform shadow-xl">
                  <TeamMemberPhoto src={m.photo} name={m.name} />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-1 text-white">{m.name}</h3>
                  <p className="text-primary font-bold text-sm uppercase tracking-widest">{m.role}</p>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{m.task}</p>
              </motion.div>
            ))}
          </div>
        </div>
      );

    case "retrospective":
      return (
        <div className="space-y-12">
          <SlideHeader title={title} />
          <div className="grid grid-cols-2 gap-16 text-left max-w-6xl mx-auto w-full">
            <div className="space-y-10">
              <h3 className="text-2xl font-black text-primary mb-8 flex items-center gap-4 uppercase tracking-widest"><Terminal size={32} /> Technical Growth</h3>
              <div className="space-y-6">
                {items.map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-6 p-8 rounded-[2rem] bg-white/5 border border-white/10 shadow-xl group hover:bg-white/[0.08] transition-all"
                  >
                    <CheckCircle2 className="text-primary group-hover:scale-110 transition-transform" size={28} />
                    <p className="text-slate-200 font-bold text-xl text-left">{item}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="space-y-10">
              <h3 className="text-2xl font-black text-blue-400 mb-8 flex items-center gap-4 uppercase tracking-widest"><Lightbulb size={32} /> Future Roadmap</h3>
              <div className="p-12 rounded-[3.5rem] bg-blue-500/10 border border-blue-500/20 h-full flex flex-col justify-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                <p className="text-3xl font-black text-blue-100 leading-tight relative z-10">{slide.future}</p>
                <div className="mt-12 space-y-6 relative z-10">
                  <div className="flex items-center gap-4 text-slate-300 font-black text-lg group-hover:translate-x-2 transition-transform">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">✨</div>
                    PWA 전환 (Offline 지원)
                  </div>
                  <div className="flex items-center gap-4 text-slate-300 font-black text-lg group-hover:translate-x-2 transition-transform">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">✨</div>
                    추천 알고리즘 고도화
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case "closing":
      return (
        <div className="text-center space-y-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary mx-auto mb-10 shadow-2xl"
          >
            <BookOpen size={48} />
          </motion.div>
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-6xl font-black text-white italic drop-shadow-2xl"
          >
            "{content.quote}"
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl text-slate-400 max-w-2xl mx-auto font-medium"
          >
            {content.message}
          </motion.p>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="pt-20 flex flex-col items-center gap-4"
          >
            <h1 className="text-4xl font-black text-white">{content.thankYou}</h1>
            <div className="px-8 py-3 rounded-2xl bg-white text-black font-black text-xl hover:bg-primary hover:text-white transition-all cursor-pointer shadow-2xl active:scale-95">
              {content.qa}
            </div>
          </motion.div>
        </div>
      );

    default:
      return <div className="text-white text-left">Slide {currentSlide + 1}</div>;
  }
};

const SlideHeader = ({ title }) => (
  <div className="space-y-4 mb-16 text-left relative">
    <div className="flex items-center gap-4">
      <div className="h-1.5 w-24 bg-primary rounded-full" />
      <div className="h-1.5 w-4 bg-primary/30 rounded-full" />
    </div>
    <h2 className="text-7xl font-black tracking-tighter text-white drop-shadow-xl flex items-center gap-4 pb-2">
      {title}
    </h2>
  </div>
);

const TechCategory = ({ icon, title, items, color }) => {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/30",
    orange: "from-orange-500/20 to-orange-600/5 border-orange-500/30",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-12 rounded-[4rem] bg-gradient-to-br ${colors[color]} border backdrop-blur-xl space-y-10 shadow-2xl flex flex-col text-left group hover:scale-[1.02] transition-transform`}
    >
      <div className="flex items-center gap-5 text-3xl font-black text-white">
        <div className="p-4 rounded-3xl bg-white/5 shadow-inner">
          {icon}
        </div>
        {title}
      </div>
      <div className="flex flex-wrap gap-4 flex-1 items-start">
        {items.map(item => (
          <span key={item} className="px-6 py-3 rounded-2xl bg-white/5 text-slate-200 font-black text-lg border border-white/10 group-hover:bg-white/10 transition-colors shadow-sm">{item}</span>
        ))}
      </div>
    </motion.div>
  );
};

export default Presentation;
