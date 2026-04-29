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
  CheckCircle2
} from "lucide-react";

/**
 * Presentation Component
 * A full-screen slide deck for the Booklog Project
 */
const Presentation = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    // Slide 1: Cover
    {
      type: "cover",
      content: {
        title: "Booklog",
        subtitle: "나만의 따뜻한 서재",
        description: "날씨와 감성, 기록으로 연결되는 AI 독서 플랫폼",
        team: ["신민서", "이예진", "홍준화"],
        date: "2026. 04. 30",
        url: "https://booklog.kro.kr/"
      }
    },
    // Slide 2: Overview
    {
      type: "table",
      title: "프로젝트 개요",
      data: [
        { label: "서비스명", value: "Booklog" },
        { label: "분류", value: "독서 기록 + AI 추천 + 커뮤니티 웹앱" },
        { label: "타겟", value: "독서 습관 형성을 원하는 입문자 및 다독가" },
        { label: "핵심 가치", value: "날씨·감성 맞춤 추천 / 게이미피케이션 / 커뮤니티" },
        { label: "개발 기간", value: "2026. 04. 22 ~ 04. 29" },
        { label: "주요 기능", value: "홈, 검색, 서재, 커뮤니티, 독서모임, 포인트, AI 챗봇" },
        { label: "배포 환경", value: "GitHub Actions / Docker / AWS EC2" }
      ]
    },
    // Slide 3: Problems
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
    // Slide 4: Persona A
    {
      type: "persona",
      title: "페르소나 & 유저 시나리오 (1)",
      persona: {
        name: "김민준",
        age: "28세",
        job: "직장인",
        vibe: "감성 독자",
        profile: "퇴근 후 무엇을 읽을지 고민하는 시간이 아까움. 기분에 따른 맞춤 추천 희망.",
        scenario: "비 오는 금요일 퇴근길 → 앱 실행 → 홈 배너의 '감성 소설' 발견 → 서재 추가",
        keywords: ["상황 맞춤 추천", "무입력 발견", "즉시 시작"]
      }
    },
    // Slide 4-2: Persona B
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
        keywords: ["독서 습관 추적", "시각적 성취", "사회적 가치"]
      }
    },
    // Slide 4-3: Persona C
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
        keywords: ["책 중심 소셜", "낮은 진입 장벽", "온라인 독서 모임"]
      }
    },
    // Slide 4-4: Persona D
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
        keywords: ["미독 기반 추천", "취향 정교화", "발견의 신선함"]
      }
    },
    // Slide 4-5: Persona E
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
        keywords: ["데이터 분석", "장르 균형", "성장 지표"]
      }
    },
    // Slide 5: Team
    {
      type: "team",
      title: "팀원 소개 & 역할 분담",
      members: [
        { name: "이예진", role: "팀장 / FE", task: "내 서재, 캘린더, 테마 시스템, UI 아키텍처" },
        { name: "신민서", role: "프론트엔드", task: "온보딩, 포인트 시스템, 커뮤니티, 모임, API 배포" },
        { name: "홍준화", role: "프론트엔드", task: "홈, AI 추천, 검색/상세, 챗봇, API 연동, 디자인" }
      ]
    },
    // Slide 6: Tech Stack
    {
      type: "tech",
      title: "개발 환경 & 기술 스택",
      frontend: ["React 19", "Vite 6", "Tailwind CSS 4", "shadcn/ui", "Framer Motion", "Recharts"],
      backend: ["Firebase Auth", "Firestore", "Express.js Proxy"],
      apis: ["OpenWeatherMap", "Aladin API", "Groq AI", "Google Maps"]
    },
    // Slide 7: Architecture
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
    // Slide 8: Key Feature 1 - Home
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
    // Slide 9: Key Feature 2 - Search & Detail
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
    // Slide 10: Key Feature 3 - Library
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
    // Slide 11: Key Feature 4 - Points
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
    // Slide 12: Key Feature 5 - Community
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
    // Slide 13: Key Feature 6 - AI Chatbot
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
    // Slide 14: Key Feature 7 - Onboarding
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
    // Slide 15: Challenges
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
    // Slide 16: Demo
    {
      type: "demo",
      title: "시연 영상",
      steps: ["온보딩/로그인", "홈 날씨 추천", "도서 탐색/검색", "서재 기록/캘린더", "포인트 기부", "커뮤니티/채팅", "AI 챗봇"]
    },
    // Slide 17: Retrospective
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
    // Slide 18: Closing
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
    <div className="fixed inset-0 bg-[#0f172a] text-slate-100 overflow-hidden font-sans selection:bg-primary/30 z-[9999]">
      {/* Background Ornaments */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
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
      <div className="relative h-full w-full flex items-center justify-center p-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.98 }}
            transition={{ duration: 0.5, ease: "circOut" }}
            className="w-full max-w-6xl h-full flex flex-col justify-center"
          >
            <SlideContent slide={slides[currentSlide]} currentSlide={currentSlide} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * Renders individual slide content based on type
 */
const SlideContent = ({ slide, currentSlide }) => {
  const { type, title, subtitle, content, data, items, persona, members, frontend, backend, apis, flow, points, steps, retrospective } = slide;

  switch (type) {
    case "cover":
      return (
        <div className="text-center space-y-8">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm mb-4"
          >
            <BookOpen size={18} /> {content.subtitle}
          </motion.div>
          <motion.h1 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="text-[120px] font-black leading-[1.1] tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 pb-2"
          >
            {content.title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl text-slate-400 font-medium max-w-2xl mx-auto"
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
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Team</p>
              <p className="text-slate-200 font-bold">{content.team.join(", ")}</p>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Date</p>
              <p className="text-slate-200 font-bold">{content.date}</p>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">URL</p>
              <div className="flex flex-col items-center gap-3">
                <a 
                  href="https://booklog.kro.kr/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary font-bold flex items-center justify-center gap-1 hover:underline underline-offset-4 transition-all"
                >
                  booklog.kro.kr <ExternalLink size={14} />
                </a>
                <div className="p-2 bg-white rounded-xl shadow-2xl border border-white/20">
                  <img 
                    src="/qr_code.png" 
                    alt="QR Code" 
                    className="w-20 h-20"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
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
          <div className="grid grid-cols-3 gap-8">
            {items.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.2 }}
                className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col justify-between h-80 group hover:border-primary/50 transition-all hover:bg-primary/5 shadow-2xl text-left"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mb-6 font-black text-xl">
                    {item.id}
                  </div>
                  <h3 className="text-2xl font-black mb-4 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 mt-6">{item.tag}</div>
              </motion.div>
            ))}
          </div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="p-8 rounded-3xl bg-primary text-white font-black text-center text-2xl shadow-[0_20px_50px_rgba(var(--primary),0.3)]"
          >
            Solution: {slide.solution}
          </motion.div>
        </div>
      );

    case "persona":
      return (
        <div className="space-y-12 h-full">
          <SlideHeader title={title} />
          <div className="grid grid-cols-2 gap-12 items-center flex-1">
            <motion.div 
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="space-y-8 text-left"
            >
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-4xl shadow-2xl">
                  👤
                </div>
                <div>
                  <div className="inline-block px-3 py-1 rounded-lg bg-primary/20 text-primary font-bold text-xs mb-2">{persona.vibe}</div>
                  <h3 className="text-4xl font-black">{persona.name} <span className="text-xl text-slate-500 font-medium">({persona.age}, {persona.job})</span></h3>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-slate-300 italic">"{persona.profile}"</p>
                </div>
                <div className="flex gap-3">
                  {persona.keywords.map(kw => (
                    <span key={kw} className="px-4 py-1.5 rounded-full bg-white/10 text-white font-bold text-xs border border-white/10">#{kw}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-10 rounded-[3rem] bg-white/5 border border-white/10 relative overflow-hidden h-full flex flex-col justify-center"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
              <div className="space-y-6 text-left">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">User Scenario</p>
                <p className="text-2xl font-bold leading-relaxed text-slate-200">{persona.scenario}</p>
                <div className="pt-6">
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-4">Needs</p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-slate-300 font-medium text-left"><CheckCircle2 className="text-primary" size={18} /> {persona.keywords[0]}</li>
                    <li className="flex items-center gap-3 text-slate-300 font-medium text-left"><CheckCircle2 className="text-primary" size={18} /> {persona.keywords[1]}</li>
                  </ul>
                </div>
              </div>
            </motion.div>
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
                <div className="w-20 h-20 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-xl text-white">
                  {m.name[0]}
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-1 text-white">{m.name}</h3>
                  <p className="text-primary font-bold text-sm uppercase tracking-widest">{m.role}</p>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{m.task}</p>
              </motion.div>
            ))}
          </div>
          <div className="p-6 rounded-3xl bg-white/5 border border-dashed border-white/20 text-center">
            <p className="text-slate-500 font-bold text-sm">Common Tasks: UI 레이아웃 최적화, 프로필 기능 구현, 데이터 정규화</p>
          </div>
        </div>
      );

    case "tech":
      return (
        <div className="space-y-12">
          <SlideHeader title={title} />
          <div className="grid grid-cols-3 gap-10">
            <TechCategory icon={<Code2 className="text-blue-400" />} title="Frontend" items={frontend} />
            <TechCategory icon={<Database className="text-orange-400" />} title="Backend & Infrastructure" items={backend} />
            <TechCategory icon={<Globe className="text-emerald-400" />} title="External APIs" items={apis} />
          </div>
        </div>
      );

    case "architecture":
      return (
        <div className="space-y-12">
          <SlideHeader title={title} />
          <div className="space-y-4 max-w-5xl mx-auto">
            {flow.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15 }}
                className="flex items-center gap-6"
              >
                <div className="w-40 text-right font-black text-slate-500 text-sm uppercase tracking-widest">{step.from}</div>
                <div className="flex-1 p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="font-bold text-slate-200">→ {step.to}</div>
                  <div className="px-4 py-1 rounded-lg bg-primary/10 text-primary font-black text-xs uppercase">{step.result}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );

    case "feature":
      return (
        <div className="space-y-12 h-full flex flex-col justify-center">
          <div className="space-y-4 text-left">
            <SlideHeader title={title} />
            <p className="text-primary font-bold tracking-wider">{subtitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-16 items-center flex-1">
            <div className="space-y-6 text-left">
              {points.map((p, i) => (
                <motion.div 
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-black text-white">{i + 1}</div>
                  <p className="text-xl text-slate-300 leading-relaxed font-medium text-left">{p}</p>
                </motion.div>
              ))}
            </div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative aspect-square max-w-md mx-auto flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse" />
              <div className="relative z-10 w-full h-full rounded-[3rem] bg-white/5 border border-white/20 backdrop-blur-2xl shadow-2xl flex items-center justify-center overflow-hidden p-8 text-white">
                {title.includes("홈") && <Cloud size={160} className="text-primary opacity-60" />}
                {title.includes("검색") && <Search size={160} className="text-primary opacity-60" />}
                {title.includes("서재") && <Calendar size={160} className="text-primary opacity-60" />}
                {title.includes("포인트") && <Trophy size={160} className="text-primary opacity-60" />}
                {title.includes("커뮤니티") && <Users size={160} className="text-primary opacity-60" />}
                {title.includes("챗봇") && <MessageCircle size={160} className="text-primary opacity-60" />}
                {title.includes("온보딩") && <Smartphone size={160} className="text-primary opacity-60" />}
              </div>
            </motion.div>
          </div>
        </div>
      );

    case "challenges":
      return (
        <div className="space-y-12">
          <SlideHeader title={title} />
          <div className="grid grid-cols-2 gap-6">
            {items.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4 shadow-xl text-left"
              >
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <ShieldCheck size={16} /> Problem
                </div>
                <p className="text-xl font-bold text-slate-200">{item.problem}</p>
                <div className="h-px bg-white/10 my-4" />
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Zap size={16} /> Solution
                </div>
                <p className="text-slate-400 leading-relaxed">{item.solution}</p>
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
            <div className="z-10 grid grid-cols-4 gap-4 px-10 w-full">
              {steps.map((step, i) => (
                <div key={i} className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md text-[10px] font-black text-center text-white border border-white/10">{step}</div>
              ))}
            </div>
          </div>
        </div>
      );

    case "retrospective":
      return (
        <div className="space-y-12">
          <SlideHeader title={title} />
          <div className="grid grid-cols-2 gap-12 text-left">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-3"><Terminal size={24} /> Technical Growth</h3>
              {items.map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10"
                >
                  <CheckCircle2 className="text-primary" size={20} />
                  <p className="text-slate-200 font-medium text-left">{item}</p>
                </motion.div>
              ))}
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-3"><Lightbulb size={24} /> Future Roadmap</h3>
              <div className="p-8 rounded-[2.5rem] bg-blue-500/10 border border-blue-500/20 h-full flex flex-col justify-center">
                <p className="text-2xl font-black text-blue-100 leading-tight">{slide.future}</p>
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3 text-slate-400 font-medium">✨ PWA 전환 (Offline 지원)</div>
                  <div className="flex items-center gap-3 text-slate-400 font-medium">✨ 추천 알고리즘 고도화</div>
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
  <div className="space-y-2 mb-10 text-left">
    <div className="h-1.5 w-20 bg-primary rounded-full mb-4" />
    <h2 className="text-5xl font-black tracking-tighter text-white">{title}</h2>
  </div>
);

const TechCategory = ({ icon, title, items }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-8 rounded-[3rem] bg-white/5 border border-white/10 space-y-6 shadow-2xl h-full flex flex-col text-left"
  >
    <div className="flex items-center gap-3 text-lg font-bold text-white">
      {icon} {title}
    </div>
    <div className="flex flex-wrap gap-2 flex-1">
      {items.map(item => (
        <span key={item} className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 font-bold text-[10px] border border-white/10">{item}</span>
      ))}
    </div>
  </motion.div>
);

export default Presentation;
