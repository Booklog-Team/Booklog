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
  Tag,
  Library as LibraryIcon,
  PenTool,
  ArrowDown,
  User,
  Rocket,
  Shield,
  Monitor
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
        { label: "핵심 가치", value: "독서 기록화 / 맞춤형 도서 발견 / 독서 가치 확장" },
        { label: "개발 기간", value: "2026. 04. 22 ~ 04. 29" },
        { label: "주요 기능", value: "홈, 검색, 내 서재, 커뮤니티, 독서모임, 포인트, AI 챗봇" },
        { label: "배포 환경", value: "GitHub Actions / Docker / AWS EC2" }
      ]
    },
    // 03. 선정 배경 & 문제 정의
    {
      type: "problems",
      title: "선정 배경 & 문제 정의",
      sections: [
        {
          title: "기존 서비스의 한계",
          subtitle: "Existing Service Limits",
          items: [
            "도서 정보 / 리뷰 중심",
            "독서 “과정” 기록 불가",
            "지속적인 독서 유도 부족"
          ]
        },
        {
          title: "문제 정의 → 출발",
          subtitle: "Problem Definition",
          items: [
            "독서 경험이 축적되지 않음",
            "기록 구조 부재",
            "지속성 부족"
          ]
        }
      ],
      question: "독서를 기록하고 관리할 수 있는 서비스는 없을까?",
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
            "3단계 상태 관리 (읽는 중/완독/읽고 싶음)",
            "진행률 자동 계산 & 완독 축하 애니메이션",
            "캘린더 스트릭 시각화 및 독서 메모/별점"
          ],
          tagline: "사용자의 모든 독서 '과정'을 데이터로 축적하여 습관 형성을 지원합니다."
        },
        {
          num: "02",
          title: "맞춤형 도서 발견",
          items: [
            "날씨·시간대 기반 실시간 AI 추천 (LLM)",
            "장르 기반 추천 및 알라딘 API 도서 검색",
            "주변 도서관 찾기 & 실시간 대출 가능 여부 확인"
          ],
          tagline: "상황에 맞는 최적의 도서를 제안하고 실제 대출까지 연결합니다."
        },
        {
          num: "03",
          title: "독서 가치 확장",
          items: [
            "포인트 기부 시스템 (어린이재단·장애인도서관 등)",
            "독서 모임 개설·참여 및 실시간 채팅 소통",
            "커뮤니티 (독후감, 추천, 질문)를 통한 지식 공유"
          ],
          tagline: "개인의 독서 활동이 사회적 가치와 커뮤니티로 연결됩니다."
        }
      ]
    },
    // 10. 타겟 설정
    {
      type: "target",
      title: "타겟 설정",
      heavy: {
        title: "주요 타겟: 헤비 유저 (다독가 / 애독가)",
        desc: "이미 독서를 꾸준히 하는 사용자, 기록 / 관리 니즈 존재",
        needs: [
          "언제 읽었는지",
          "무엇을 읽었는지",
          "얼마나 읽었는지",
          "어떤 생각을 했는지"
        ],
        summary: "기록과 관리"
      },
      light: {
        title: "라이트 유저 (확장)",
        desc: "독서를 꾸준히 하지 못하는 사용자, 습관 형성 필요",
        summary: "동기부여 제공"
      }
    },
    // 11-12. 페르소나 2개 (헤비/라이트)
    {
      type: "persona",
      title: "페르소나 : 헤비 유저 - 기록 분석가 & 토론가",
      persona: {
        name: "김선유",
        age: "28세",
        job: "다독가",
        vibe: "기록 분석가 & 토론가",
        profile: "이미 읽은 책이 많아 개인 독서 데이터를 정교하게 관리하고 싶음. 단순 독서를 넘어 깊이 있는 토론과 지식 공유를 위한 커뮤니티 공간과 새로운 미독 도서 발견이 필요함.",
        scenario: "독서 통계 분석 → AI 챗봇에게 미독 도서 추천 요청 → 커뮤니티 독후감 공유 및 모임 참여",
        keywords: ["데이터 시각화", "지식 공유 커뮤니티", "미독 기반 추천"],
        image: "/persona_d.png",
        position: "object-top"
      }
    },
    {
      type: "persona",
      title: "페르소나 : 라이트 유저 - 습관 형성자",
      persona: {
        name: "박지우",
        age: "22세",
        job: "대학생",
        vibe: "습관 형성자",
        profile: "독서 습관이 부족해 매번 작심삼일에 그침. 무엇을 읽을지 고민하는 시간이 길어 상황에 맞는 추천과 함께, 독서를 지속할 시각적인 보상이 필요함.",
        scenario: "기분에 맞는 AI 추천 도서 발견 → 매일 읽은 페이지 기록 → 완독 Confetti와 포인트 기부",
        keywords: ["맞춤 도서 발견", "시각적 성취", "독서 습관 형성"],
        image: "/persona_b.png",
        position: "object-top"
      }
    },
    // 15. 기술 스택
    {
      type: "tech",
      title: "Tech Stack",
      items: [
        { name: "React + Vite", desc: "고성능 UI 컴포넌트 개발 및 모던 빌드 시스템", icon: <Code2 />, color: "text-[#61DAFB]" },
        { name: "Tailwind CSS", desc: "유틸리티 우선 방식의 고속 스타일링 및 디자인 시스템", icon: <Layers />, color: "text-[#38B2AC]" },
        { name: "Firebase Auth", desc: "Google OAuth를 통한 안전하고 간편한 사용자 인증", icon: <ShieldCheck />, color: "text-[#FFA000]" },
        { name: "Firestore (NoSQL)", desc: "실시간 데이터 동기화 및 유연한 문서 지향 데이터베이스", icon: <Database />, color: "text-[#FFCA28]" },
        { name: "Jira & Notion", desc: "체계적인 Task 관리 및 프로젝트 문서화/기록", icon: <CheckCircle2 />, color: "text-[#0052CC]" },
        { name: "GitHub & Slack", desc: "효율적인 코드 버전 관리 및 실시간 팀 커뮤니케이션", icon: <Globe />, color: "text-[#FFFFFF]" }
      ]
    },
    // 16. API 연동 및 데이터 아키텍처
    {
      type: "architecture",
      title: "API 연동 및 데이터 아키텍처",
      flow: [
        { from: "환경 인식", to: "OpenWeatherMap", result: "실시간 위치/날씨 데이터" },
        { from: "도서 검색", to: "알라딘 Open API", result: "70만 종 도서 메타데이터" },
        { from: "지능형 추천", to: "Groq AI (LLaMA 3)", result: "사용자 맞춤형 도서 큐레이션 및 챗봇" },
        { from: "정보 조회", to: "도서관정보나루 API", result: "전국 도서관 대출 현황/보유 정보" },
        { from: "위치 시각화", to: "Google Maps API", result: "인근 도서관 위치 및 정보 렌더링" },
        { from: "상태 동기화", to: "Firebase Firestore", result: "사용자 활동 데이터 실시간 저장" }
      ]
    },
    // 16.5 시스템 아키텍처
    {
      type: "system",
      title: "System Architecture",
      image: "/features/CICD Pipeline for GitHub-2026-04-29-062613.png"
    },
    // 17-23. 주요 기능 7개
    // 17-29. 주요 기능 상세
    {
      type: "feature",
      title: "주요 기능: Auth",
      points: [
        "Firebase Auth 기반 이메일 로그인과 Google 소셜 로그인 구현",
        "AuthContext로 로그인 상태 전역 관리",
        "PrivateRoute로 비인증 접근 차단"
      ],
      images: ["/features/auth.png"]
    },
    {
      type: "feature",
      title: "주요 기능: Onboarding",
      points: [
        "최초 로그인 시 관심 장르 선택 플로우",
        "선택 데이터 Firestore에 저장",
        "홈 화면 도서 추천의 기반 데이터로 활용"
      ],
      images: ["/features/onboarding.png"]
    },
    {
      type: "feature",
      title: "주요 기능: AI 홈 배너 x 날씨 API",
      points: [
        "Groq AI가 LLM을 통해 실제 도서 중 테마에 부합하는 책만 선별",
        "AI 환각을 방지하기 위해 실제 API 데이터 인덱스 기반 추천",
        "현재 위치의 날씨와 시간대를 분석하여 무드 결정",
        "알라딘 베스트셀러 중 무드에 맞는 카테고리 도서 풀 수집"
      ],
      images: ["/features/home.png", "/features/home2.png", "/features/home3.png"]
    },
    {
      type: "feature",
      title: "주요 기능: 도서 검색 & 상세",
      points: [
        "실시간 키워드 검색 및 14개 장르별 탐색",
        "서재 즉시 추가 및 상태 관리",
        "도서 대출 가능 여부 실시간 확인"
      ],
      images: ["/features/search.png", "/features/search2.png"]
    },
    {
      type: "feature",
      title: "주요 기능: 내 주변 도서관",
      points: [
        "Geolocation API로 현재 위치 감지",
        "도서관 정보나루 API로 주변 도서관 검색 및 대출가능 여부 확인",
        "Google Maps API로 지도에 마커 시각화"
      ],
      images: ["/features/map.png"]
    },
    {
      type: "feature",
      title: "주요 기능: 내 서재 Library",
      points: [
        "사용자의 도서를 읽고싶음 / 읽는 중 / 완독 상태로 분류하여 관리",
        "도서별 진행률, 현재 페이지, 메모, 마지막 기록일 표시",
        "도서 삭제 및 상태 변경 시 Firestore 데이터와 화면 상태 동기화"
      ],
      images: ["/features/library.png", "/features/log_record.png"]
    },
    {
      type: "feature",
      title: "주요 기능: 독서 기록 & 캘린더",
      points: [
        "날짜별 독서 기록을 캘린더 형태로 시각화",
        "독서 상태 변경, 페이지 기록, 메모 작성 내역을 로그로 관리",
        "연속 독서일(streak)을 계산하여 사용자의 독서 흐름을 직관적으로 표시"
      ],
      images: ["/features/calendar.png"]
    },
    {
      type: "feature",
      title: "주요 기능: 프로필 & 독서 통계",
      points: [
        "사용자 정보와 독서 활동 통계를 한 화면에서 확인",
        "완독 권수, 총 읽은 페이지, 연속 독서일 등 핵심 지표 제공",
        "월별 독서량과 장르별 독서 비율을 시각화하여 패턴 분석"
      ],
      images: ["/features/profile.png", "/features/profile2.png", "/features/profile_popup1.png", "/features/profile_popup2.png", "/features/profile_popup3.png", "/features/profile_popup4.png"]
    },
    {
      type: "feature",
      title: "주요 기능: 독서 모임",
      points: [
        "독서 모임 목록, 상세 정보 조회 및 생성 기능",
        "모임별 책 정보, 모집 인원, 마감일, 읽을 범위 상세 관리",
        "모임장 공지와 감상 공유를 통한 책 중심 커뮤니티"
      ],
      images: ["/features/meeting.png"]
    },
    {
      type: "feature",
      title: "주요 기능: 자유게시판",
      points: [
        "게시글 목록 조회, 상세 보기 및 작성 기능 구현",
        "카테고리 분류, 댓글, 좋아요를 통한 사용자 간 소통 지원",
        "커뮤니티 탭 내에서 모임과 게시판을 통합적으로 탐색"
      ],
      images: ["/features/board.png"]
    },
    {
      type: "feature",
      title: "주요 기능: AI 챗봇 사서",
      points: [
        "자연어 질문을 통한 개인화된 도서 추천",
        "현재 날씨와 상황(비 오는 날 등)을 반영한 대화",
        "사용자 서재 데이터를 분석하여 중복 없는 미독 도서 제안",
        "대화 문맥에서 도서 의도를 파악하여 즉시 카드 출력"
      ],
      images: ["/features/chatbot.png", "/features/chatbot1.png"]
    },
    {
      type: "feature",
      title: "주요 기능: Points & 기부",
      points: [
        "독서 활동으로 포인트 적립 및 레벨 시스템",
        "포인트로 도서 관련 단체에 기부",
        "전체 기부 현황 실시간 Firestore 구독"
      ],
      images: ["/features/points.png"]
    },
    {
      type: "feature",
      title: "주요 기능: UI 테마 시스템",
      points: [
        "다양한 테마 제공으로 사용자 취향에 맞는 UI 환경 구성",
        "테마 변경 시 전체 페이지에 즉시 반영되는 설계",
        "카드 기반 레이아웃과 컬러 조합으로 테마별 분위기 차별화",
        "독서 흐름(상태)이 테마 내에서도 일관되게 표현됨"
      ],
      images: ["/features/theme.png", "/features/theme2.png"]
    },
    // 24. 시연 영상
    {
      type: "demo",
      title: "시연 영상",
      steps: ["온보딩/로그인", "홈 날씨 추천", "도서 탐색/검색", "서재 기록/캘린더", "포인트 기부", "커뮤니티/채팅", "AI 챗봇"]
    },
    // 20. Troubleshooting
    {
      type: "challenges",
      title: "Troubleshooting",
      items: [
        { 
          problem: "Firebase 서비스 계정 키 GitHub 노출", 
          cause: ".gitignore 누락으로 인한 보안 키(serviceAccountKey.json) 공용 저장소 커밋",
          solution: "노출 키 폐기 및 재발급 → .gitignore 차단 → 환경변수를 통한 주입 방식으로 보안 프로세스 개선" 
        },
        { 
          problem: "상태(State)와 기록(Event) 간 데이터 정합성 불일치", 
          cause: "책의 현재 상태와 독서 기록 로그를 중복 관리하여 단일 기준(SSOT) 부재",
          solution: "별도 상태 필드 제거 및 독서 기록 로그를 기준으로 현재 상태를 실시간 계산하는 SSOT 구조로 개편" 
        },
        { 
          problem: "API 호출 한도 제한(429) 및 중복 요청으로 인한 자원 낭비", 
          cause: "Groq AI 무료 티어의 엄격한 RPM/TPM 제한 및 여러 컴포넌트에서의 동시 API 호출",
          solution: "전역 직렬화 큐(Serialization Queue) 도입으로 호출 간격 제어 및 In-flight 요청 중복 제거와 로컬 캐싱(1시간) 적용" 
        }
      ]
    },
    // 21. 팀원 소개 & 역할 분담
    {
      type: "team",
      title: "👥 역할 분담 (커밋 이력 기준)",
      members: [
        { 
          name: "이예진", 
          role: "팀장 / 프론트엔드", 
          tasks: [
            "서재(독서 기록) 핵심 기능 구현",
            "독서 캘린더 및 streak 시각화",
            "커뮤니티(모임, 게시판) 기능 개발",
            "전체 UX 흐름 및 UI 디테일 개선"
          ], 
          narrative: "👉 서비스의 핵심 가치(독서 기록 경험) 담당",
          photo: "/team/yejin.jpg" 
        },
        { 
          name: "신민서", 
          role: "프론트엔드 / DB", 
          tasks: [
            "로그인 / 회원가입 / 온보딩 구현",
            "Firebase Auth 및 Firestore 설계",
            "포인트 & 기부 시스템 개발",
            "목업 데이터 → DB 전환 및 배포(CI/CD)"
          ], 
          narrative: "👉 서비스의 데이터 흐름과 사용자 상태 담당",
          photo: "/team/minseo.jpg" 
        },
        { 
          name: "홍준화", 
          role: "프론트엔드 / API", 
          tasks: [
            "메인 페이지, 검색, 도서 상세 구현",
            "도서 API 연동 및 추천 기능 개발",
            "메인 배너 및 UI/UX 개선",
            "AI 추천 및 챗봇 품질 개선"
          ], 
          narrative: "👉 사용자가 서비스를 처음 접하고 탐색하는 흐름 담당",
          photo: "/team/junhwa.jpg" 
        }
      ]
    },
    // 22. 프로젝트 회고 & 배운 점
    {
      type: "retrospective",
      title: "🌱 프로젝트 회고 & 배운 점",
      members: [
        {
          name: "신민서",
          feedback: "UI 구현을 넘어 Firestore 데이터 설계, Docker 환경 구성, GitHub Actions를 통한 CI/CD 구축 과정에서 시스템 전체를 조망하는 재미를 느꼈습니다. 단순히 '동작하는 코드'가 아닌 '운영 가능한 서비스'를 만드는 것의 가치를 배웠습니다."
        },
        {
          name: "이예진",
          feedback: "사용자 입장에서 이해하기 쉬운 구조를 고민하며 점진적으로 완성도를 높여가는 방식의 중요성을 깨달았습니다. AI(바이브코딩)를 활용할 때도 요구사항을 얼마나 명확하게 전달하느냐에 따라 품질이 결정된다는 점을 실전에서 체득했습니다."
        },
        {
          name: "홍준화",
          feedback: "API 연동 시 근본 원인(Rate Limit 등)을 파악하고 직렬화 큐와 캐시 전략으로 해결하며 문제를 깊이 있게 이해하는 법을 배웠습니다. 배포 과정에서 겪은 환경변수 및 서버 아키텍처 이슈들은 실무 역량을 키우는 값진 경험이 되었습니다."
        }
      ],
      future: "단순 독서 기록을 넘어 AI와 데이터가 결합된 '독서 가치 확장 플랫폼'으로의 성장"
    },
    // 23. 클로징
    {
      type: "closing",
      content: {
        quote: "기록은 데이터로, 독서는 습관으로",
        message: "당신만의 개인화된 독서 여정, Booklog가 함께합니다.",
        thankYou: "감사합니다."
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
      <div className="relative h-full w-full flex items-center justify-center px-24 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[1400px] h-full flex flex-col justify-center"
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
  const [activeImg, setActiveImg] = useState(0);

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
        <div className="space-y-12">
          <SlideHeader title={title} />
          <div className="grid grid-cols-2 gap-12">
            {slide.sections.map((section, i) => (
              <motion.div 
                key={i}
                initial={{ x: i === 0 ? -30 : 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.2 }}
                className="p-12 rounded-[3.5rem] bg-white/5 border border-white/10 flex flex-col min-h-[380px] group hover:border-primary/50 transition-all hover:bg-primary/5 shadow-2xl text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 text-primary/5 font-black text-6xl group-hover:text-primary/10 transition-colors uppercase tracking-widest">
                  {i === 0 ? "LIMIT" : "START"}
                </div>
                <div className="mb-8">
                  <div className="text-primary font-black text-xs uppercase tracking-[0.3em] mb-3">{section.subtitle}</div>
                  <h3 className="text-4xl font-black text-white group-hover:text-primary transition-colors leading-tight">
                    {section.title}
                  </h3>
                </div>
                <div className="space-y-5 flex-1">
                  {section.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 text-xl font-bold text-slate-300 break-keep">
                      <div className="w-2 h-2 rounded-full bg-primary/60 group-hover:scale-125 transition-transform" />
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-6"
            >
            </motion.div>

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="p-10 rounded-[3.5rem] bg-gradient-to-br from-primary via-[#ff4d00] to-orange-400 text-white font-black text-center text-4xl shadow-[0_25px_80px_rgba(255,77,0,0.5)] border-2 border-white/30 relative overflow-hidden group cursor-default"
            >
              <motion.div 
                animate={{ 
                  opacity: [0.1, 0.3, 0.1],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" 
              />
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="flex items-center justify-center gap-8 relative z-10">
                <Quote size={54} className="text-white/20 -scale-x-100" />
                <span className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] tracking-tight break-keep">
                  {slide.question}
                </span>
                <Quote size={54} className="text-white/20" />
              </div>
            </motion.div>
          </div>
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
                <div className="mt-10 p-8 rounded-[2rem] bg-gradient-to-r from-primary to-orange-500 relative group-hover:shadow-[0_15px_40px_rgba(255,77,0,0.3)] transition-all shadow-xl overflow-hidden border border-white/20">
                  <Quote size={32} className="text-white/20 absolute -top-1 -left-1 rotate-12" />
                  <p className="text-white font-black text-xl leading-relaxed italic relative z-10 break-keep">
                    "{kw.tagline}"
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );

    case "target":
      return (
        <div className="space-y-12">
          <SlideHeader title={slide.title} />
          <div className="grid grid-cols-2 gap-12 max-w-6xl mx-auto items-stretch">
            {/* 헤비 유저 */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-12 rounded-[4rem] bg-white/5 border border-white/10 flex flex-col justify-between hover:border-primary/50 transition-all group relative overflow-hidden shadow-2xl"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
              <div className="relative z-10 space-y-8">
                <div className="space-y-4">
                  <div className="px-5 py-2 rounded-full bg-primary/20 text-primary font-black text-sm w-fit uppercase tracking-widest">Main Target</div>
                  <h3 className="text-3xl font-black text-white break-keep leading-tight">{slide.heavy.title}</h3>
                  <p className="text-xl text-slate-400 font-bold break-keep">{slide.heavy.desc}</p>
                </div>
                
                <div className="space-y-4">
                  <p className="text-primary font-black text-sm uppercase tracking-widest">헤비 유저가 원하는 것</p>
                  <div className="grid grid-cols-1 gap-3">
                    {slide.heavy.needs.map((need, i) => (
                      <div key={i} className="flex items-center gap-4 text-xl font-bold text-slate-200">
                        <CheckCircle2 size={24} className="text-primary" /> {need}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-12 p-8 rounded-[2.5rem] bg-gradient-to-r from-primary to-orange-500 text-white font-black text-3xl text-center shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 animate-pulse" />
                <span className="relative z-10">“{slide.heavy.summary}”</span>
              </div>
            </motion.div>

            {/* 라이트 유저 */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="p-12 rounded-[4rem] bg-white/5 border border-white/10 flex flex-col justify-between hover:border-slate-500/50 transition-all group relative overflow-hidden shadow-2xl"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-slate-500/10 rounded-full blur-3xl group-hover:bg-slate-500/20 transition-colors" />
              <div className="relative z-10 space-y-8">
                <div className="space-y-4">
                  <div className="px-5 py-2 rounded-full bg-slate-500/20 text-slate-400 font-black text-sm w-fit uppercase tracking-widest">Expansion</div>
                  <h3 className="text-3xl font-black text-white break-keep leading-tight">{slide.light.title}</h3>
                  <p className="text-xl text-slate-400 font-bold break-keep">{slide.light.desc}</p>
                </div>

                <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 text-slate-300 font-bold text-xl leading-relaxed italic break-keep flex items-center justify-center min-h-[160px]">
                  "독서를 습관으로 만들 수 있는 강력한 동기부여와 재미 요소가 필요함"
                </div>
              </div>

              <div className="mt-12 p-8 rounded-[2.5rem] bg-slate-700 text-white font-black text-3xl text-center shadow-lg">
                <span>“{slide.light.summary}”</span>
              </div>
            </motion.div>
          </div>
        </div>
      );

    case "feature": {
      const { icon: featureIcon, Preview } = getFeatureInfo(title);
      const images = slide.images || (slide.image ? [slide.image] : []);
      
      const nextImg = (e) => {
        e.stopPropagation();
        setActiveImg((prev) => (prev + 1) % images.length);
      };
      
      const prevImg = (e) => {
        e.stopPropagation();
        setActiveImg((prev) => (prev - 1 + images.length) % images.length);
      };

      return (
        <div className="h-full flex flex-col justify-center py-4">
          <div className="grid grid-cols-3 gap-16 items-center flex-1">
            <div className="col-span-1 flex flex-col">
              <SlideHeader title={title} />
              <div className="space-y-6 text-left mt-6">
                {points.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.15 }}
                    className="flex items-start gap-5 group"
                  >
                    <div className="mt-1 flex-shrink-0 w-9 h-9 rounded-2xl bg-primary/20 flex items-center justify-center text-xs font-black text-primary border border-primary/20 shadow-lg group-hover:bg-primary group-hover:text-white transition-all">
                      0{i + 1}
                    </div>
                    <p className="text-lg text-slate-200 leading-relaxed font-bold text-left group-hover:translate-x-2 transition-transform">{p}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="col-span-2 h-[800px] flex flex-col rounded-3xl overflow-hidden border border-[#B85C38]/20 shadow-2xl bg-[#FDFAF6] relative group/slider"
            >
              <div className="flex items-center gap-2 px-6 py-4 bg-[#E8DDD0] border-b border-[#B85C38]/10 flex-shrink-0 z-20">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#B85C38]/40" />
                  <div className="w-3 h-3 rounded-full bg-[#B85C38]/20" />
                  <div className="w-3 h-3 rounded-full bg-[#B85C38]/10" />
                </div>
                <div className="flex-1 mx-4 py-1.5 px-4 rounded-xl bg-white/60 text-[#B85C38]/60 text-xs font-bold tracking-tight text-center border border-white/40 shadow-inner">booklog.kro.kr</div>
              </div>
              
              <div className="flex-1 overflow-hidden relative bg-[#FDFAF6]/50">
                <AnimatePresence mode="wait">
                  {images.length > 0 ? (
                    <motion.img 
                      key={activeImg}
                      src={images[activeImg]} 
                      alt={`${title} ${activeImg + 1}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full object-contain" 
                    />
                  ) : Preview ? (
                    <Preview />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary/30">
                      {featureIcon && React.cloneElement(featureIcon, { size: 120 })}
                    </div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={prevImg}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white opacity-60 hover:opacity-100 transition-opacity hover:bg-black/60 z-30"
                    >
                      <ChevronLeft size={28} />
                    </button>
                    <button 
                      onClick={nextImg}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white opacity-60 hover:opacity-100 transition-opacity hover:bg-black/60 z-30"
                    >
                      <ChevronRight size={28} />
                    </button>
                    
                    {/* Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                      {images.map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-2 h-2 rounded-full transition-all ${i === activeImg ? 'bg-primary w-6' : 'bg-white/30'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
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
                className="p-12 rounded-[3.5rem] bg-white/5 border border-white/10 text-left space-y-6 flex-1 flex flex-col justify-center shadow-xl backdrop-blur-md relative overflow-hidden"
              >
                <div className="absolute top-10 right-10 opacity-5">
                  <Users size={120} className="text-primary" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-primary font-black text-lg uppercase tracking-widest">유저 니즈</p>
                </div>
                <Quote className="text-primary opacity-40" size={54} />
                <p className="text-3xl font-black italic leading-relaxed text-slate-100 break-keep">
                  {persona.profile}
                </p>
                <div className="flex flex-wrap gap-3 pt-6">
                  {persona.keywords.map(kw => (
                    <span key={kw} className="px-6 py-2 rounded-2xl bg-white/5 text-slate-400 font-bold text-base border border-white/10 hover:bg-white/10 transition-colors cursor-default">#{kw}</span>
                  ))}
                </div>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="p-12 rounded-[3.5rem] bg-primary/10 border border-primary/20 text-left relative overflow-hidden group shadow-2xl"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                  <PlayCircle size={120} className="text-primary" />
                </div>
                <div className="flex items-center gap-3 mb-8">
                  <PlayCircle size={28} className="text-primary" />
                  <p className="text-primary font-black uppercase tracking-[0.3em] text-lg">유저 시나리오</p>
                </div>
                <div className="space-y-6">
                  <p className="text-2xl font-black leading-snug text-white break-keep drop-shadow-lg">
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
        <div className="space-y-12">
          <SlideHeader title={title} />
          <div className="grid grid-cols-2 gap-6 max-w-6xl mx-auto">
            {slide.items.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-8 p-8 rounded-[3rem] bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all group shadow-xl"
              >
                <div className={`w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center ${item.color} border border-white/5 group-hover:scale-110 transition-transform shadow-inner`}>
                  {React.cloneElement(item.icon, { size: 40 })}
                </div>
                <div className="text-left">
                  <h3 className="text-3xl font-black text-white mb-2 group-hover:text-primary transition-colors tracking-tight">{item.name}</h3>
                  <p className="text-slate-400 font-bold text-lg leading-snug">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );

    case "apis":
      return (
        <div className="space-y-12">
          <SlideHeader title={title} />
          <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
            {slide.apis.map((api, i) => (
              <motion.div 
                key={i}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-10 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                  <Globe size={32} />
                </div>
                <div className="text-left">
                  <h3 className="text-3xl font-black text-white mb-2 group-hover:text-primary transition-colors">{api.name}</h3>
                  <p className="text-slate-400 font-bold text-xl">{api.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );

    case "system":
      return (
        <div className="space-y-10 h-full flex flex-col">
          <SlideHeader title={title} />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-1 w-full max-w-6xl mx-auto rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-white/5 p-4 flex items-center justify-center"
          >
            <img 
              src={slide.image} 
              alt="System Architecture" 
              className="max-w-full max-h-full object-contain rounded-2xl"
            />
          </motion.div>
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
                <p className="text-3xl font-black text-slate-100 leading-tight mb-4">{item.problem}</p>
                {item.cause && (
                  <div className="flex items-start gap-2 text-rose-300/70 text-sm font-bold bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                    <span className="flex-shrink-0 mt-0.5">⚠️</span>
                    <p>원인: {item.cause}</p>
                  </div>
                )}
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
          <div className="grid grid-cols-3 gap-10 max-w-7xl mx-auto">
            {members.map((m, i) => (
              <motion.div 
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.2 }}
                className="p-10 rounded-[3.5rem] bg-white/5 border border-white/10 group hover:bg-white/[0.08] transition-all text-center flex flex-col space-y-8 shadow-2xl min-h-[700px]"
              >
                <div className="w-48 h-48 rounded-full bg-slate-800 mx-auto overflow-hidden group-hover:scale-110 transition-transform shadow-2xl border-4 border-white/10">
                  <TeamMemberPhoto src={m.photo} name={m.name} />
                </div>
                <div>
                  <h3 className="text-4xl font-black mb-2 text-white tracking-tighter">{m.name}</h3>
                  <p className="text-primary font-bold text-lg uppercase tracking-widest">{m.role}</p>
                </div>
                <div className="flex-1">
                  <ul className="text-slate-300 text-base leading-relaxed space-y-3 text-left list-disc list-inside px-2">
                    {m.tasks.map((t, idx) => (
                      <li key={idx} className="leading-snug">{t}</li>
                    ))}
                  </ul>
                </div>
                {m.narrative && (
                  <div className="pt-6 border-t border-white/10">
                    <p className="text-primary/90 font-black text-lg leading-tight italic">{m.narrative}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      );

    case "retrospective":
      return (
        <div className="space-y-10">
          <SlideHeader title={title} />
          <div className="grid grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
            {slide.members.map((m, i) => (
              <motion.div 
                key={i}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col p-8 rounded-[2.5rem] bg-white/5 border border-white/10 shadow-2xl group hover:border-primary/50 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <User size={28} />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 text-left">{m.name}</h3>
                <div className="h-px bg-white/10 mb-6" />
                <p className="text-slate-300 text-base leading-relaxed text-left font-medium break-keep">
                  {m.feedback}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="p-10 rounded-[3rem] bg-blue-500/10 border border-blue-500/20 max-w-5xl mx-auto mt-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Lightbulb size={120} />
            </div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Rocket size={32} />
              </div>
              <div className="text-left">
                <h4 className="text-blue-400 font-black text-sm uppercase tracking-widest mb-1">Future Roadmap</h4>
                <p className="text-2xl font-black text-blue-100">{slide.future}</p>
              </div>
            </div>
          </motion.div>
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
          </motion.div>
        </div>
      );

    default:
      return <div className="text-white text-left">Slide {currentSlide + 1}</div>;
  }
};

const SlideHeader = ({ title }) => (
  <div className="space-y-4 mb-4 text-left relative">
    <div className="flex items-center gap-4">
      <div className="h-1.5 w-24 bg-primary rounded-full" />
      <div className="h-1.5 w-4 bg-primary/30 rounded-full" />
    </div>
    <h2 className="text-4xl font-black tracking-tighter text-white drop-shadow-xl flex flex-col leading-tight pb-1">
      {title.includes(':') ? (
        <>
          <span>{title.split(':')[0]}:</span>
          <span>{title.split(':')[1].trim()}</span>
        </>
      ) : (
        title
      )}
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
