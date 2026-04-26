// Booklog Mock Data — 「따뜻한 라이브러리」 Design System
// Used across all pages for UI demonstration
const COVER_COLORS = [
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=280&fit=crop",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=280&fit=crop",
  "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&h=280&fit=crop",
  "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=200&h=280&fit=crop",
  "https://images.unsplash.com/photo-1589998059171-988d887df646?w=200&h=280&fit=crop",
  "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=200&h=280&fit=crop",
];

// 날짜 범위 헬퍼
const range = (start, end) => {
  const dates = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
};

export const MOCK_BOOKS = [
  {
    id: "1",
    title: "채식주의자",
    author: "한강",
    thumbnail: COVER_COLORS[0],
    publisher: "창비",
    publishYear: 2007,
    genre: ["소설", "문학"],
    description:
      "평범한 가정주부 영혜가 어느 날 갑자기 채식주의자가 되기로 결심하면서 벌어지는 이야기.",
    totalPage: 247,
    currentPage: 240,
    status: "reading",
    lastReadDate: "2026-04-29",
    startDate: "2026-04-10",
    // 4월 10~29일 연속 + 일부 날짜는 파친코·산책자와 함께 읽어 2권 이상 겹침
    checkedDates: [
      "2026-04-10", "2026-04-11", "2026-04-13", "2026-04-14", "2026-04-15",
      "2026-04-17", "2026-04-18", "2026-04-19", "2026-04-20", "2026-04-21",
      "2026-04-22", "2026-04-23", "2026-04-24", "2026-04-25",
      "2026-04-26", "2026-04-27", "2026-04-28", "2026-04-29",
    ],
    memo: "영혜의 선택이 단순한 식습관의 변화가 아니라 존재 방식의 변화라는 것을 느꼈다.",
  },
  {
    id: "2",
    title: "82년생 김지영",
    author: "조남주",
    thumbnail: COVER_COLORS[1],
    publisher: "민음사",
    publishYear: 2016,
    genre: ["소설", "사회"],
    description:
      "1982년에 태어난 평범한 여성 김지영의 삶을 통해 한국 사회의 성차별 구조를 조명한 소설.",
    totalPage: 190,
    currentPage: 190,
    status: "done",
    rating: 5,
    lastReadDate: "2026-03-15",
    startDate: "2026-03-01",
    endDate: "2026-03-15",
    checkedDates: [
      "2026-03-01", "2026-03-02", "2026-03-03", "2026-03-05", "2026-03-06",
      "2026-03-08", "2026-03-09", "2026-03-10", "2026-03-12", "2026-03-13",
      "2026-03-14", "2026-03-15",
    ],
    memo: "읽는 내내 공감과 분노가 교차했다. 모든 사람이 읽어야 할 책.",
  },
  {
    id: "3",
    title: "아몬드",
    author: "손원평",
    thumbnail: COVER_COLORS[2],
    publisher: "창비",
    publishYear: 2017,
    genre: ["소설", "성장"],
    description:
      "감정을 느끼지 못하는 소년 윤재가 세상과 관계 맺는 법을 배워가는 성장 소설.",
    totalPage: 264,
    currentPage: 0,
    status: "want",
    memo: "읽어보고 싶은 책",
  },
  {
    id: "4",
    title: "파친코",
    author: "이민진",
    thumbnail: COVER_COLORS[3],
    publisher: "인플루엔셜",
    publishYear: 2017,
    genre: ["소설", "역사"],
    description:
      "재일 한국인 4대에 걸친 가족 서사. 정체성, 차별, 생존에 관한 방대한 이야기.",
    totalPage: 560,
    currentPage: 420,
    status: "reading",
    lastReadDate: "2026-04-29",
    startDate: "2026-04-05",
    // 4월 5·7·8일 + 10~29일 중 짝수일 + 22~29일 매일
    checkedDates: [
      "2026-04-05", "2026-04-07", "2026-04-08",
      "2026-04-10", "2026-04-12", "2026-04-14", "2026-04-16", "2026-04-18",
      "2026-04-20", "2026-04-22", "2026-04-23", "2026-04-24", "2026-04-25",
      "2026-04-26", "2026-04-27", "2026-04-28", "2026-04-29",
    ],
  },
  {
    id: "5",
    title: "데미안",
    author: "헤르만 헤세",
    thumbnail: COVER_COLORS[4],
    publisher: "민음사",
    publishYear: 1919,
    genre: ["소설", "철학"],
    description: "에밀 싱클레어의 성장과 자아 발견을 그린 헤세의 대표작.",
    totalPage: 220,
    currentPage: 220,
    status: "done",
    rating: 4,
    lastReadDate: "2026-02-28",
    endDate: "2026-02-28",
    checkedDates: [
      "2026-02-15", "2026-02-16", "2026-02-17", "2026-02-19", "2026-02-20",
      "2026-02-22", "2026-02-24", "2026-02-25", "2026-02-26", "2026-02-27",
      "2026-02-28",
    ],
  },
  {
    id: "6",
    title: "어린 왕자",
    author: "앙투안 드 생텍쥐페리",
    thumbnail: COVER_COLORS[5],
    publisher: "열린책들",
    publishYear: 1943,
    genre: ["소설", "동화"],
    description:
      "사막에 불시착한 비행사가 만난 어린 왕자와의 이야기. 삶의 본질에 대한 성찰.",
    totalPage: 156,
    currentPage: 0,
    status: "want",
  },
  {
    id: "7",
    title: "그들이 말하지 않은 것",
    author: "김경미",
    thumbnail: COVER_COLORS[0],
    publisher: "문학동네",
    publishYear: 2023,
    genre: ["소설", "현대문학"],
    description: "가족 간의 숨은 비밀과 감정을 섬세하게 그려낸 작품.",
    totalPage: 320,
    currentPage: 0,
    status: "want",
  },
  {
    id: "8",
    title: "기억의 밤",
    author: "박지현",
    thumbnail: COVER_COLORS[1],
    publisher: "창비",
    publishYear: 2022,
    genre: ["소설", "심리"],
    description: "과거의 기억에 갇힌 인물들의 심리 여정.",
    totalPage: 280,
    currentPage: 0,
    status: "want",
  },
  {
    id: "9",
    title: "불의 여신",
    author: "이혜숙",
    thumbnail: COVER_COLORS[2],
    publisher: "민음사",
    publishYear: 2023,
    genre: ["소설", "추리"],
    description: "연쇄 살인 사건과 숨겨진 진실을 파헤치는 추리 소설.",
    totalPage: 380,
    currentPage: 0,
    status: "want",
  },
  {
    id: "10",
    title: "산책자의 시간",
    author: "최진호",
    thumbnail: COVER_COLORS[3],
    publisher: "문학과지성사",
    publishYear: 2021,
    genre: ["소설", "성찰"],
    description: "도시 속 혼자인 사람의 일상과 성찰.",
    totalPage: 245,
    currentPage: 180,
    status: "reading",
    lastReadDate: "2026-04-29",
    startDate: "2026-04-15",
    // 4월 15·17·19·21일 + 22~29일 매일
    checkedDates: [
      "2026-04-15", "2026-04-17", "2026-04-19", "2026-04-21",
      "2026-04-22", "2026-04-23", "2026-04-24", "2026-04-25",
      "2026-04-26", "2026-04-27", "2026-04-28", "2026-04-29",
    ],
    memo: "천천히 걷는 것의 의미를 다시 생각하게 된다.",
  },
  {
    id: "11",
    title: "해의 계절",
    author: "강미정",
    thumbnail: COVER_COLORS[4],
    publisher: "창비",
    publishYear: 2020,
    genre: ["소설", "로맨스"],
    description: "봄 해를 맞으며 시작되는 두 사람의 이야기.",
    totalPage: 310,
    currentPage: 310,
    status: "done",
    rating: 3,
    lastReadDate: "2026-01-28",
    endDate: "2026-01-28",
    checkedDates: [
      "2026-01-15", "2026-01-16", "2026-01-17", "2026-01-18", "2026-01-19",
      "2026-01-21", "2026-01-22", "2026-01-24", "2026-01-26", "2026-01-27",
      "2026-01-28",
    ],
  },
  {
    id: "12",
    title: "밤의 도서관",
    author: "오현석",
    thumbnail: COVER_COLORS[5],
    publisher: "문학동네",
    publishYear: 2022,
    genre: ["소설", "판타지"],
    description: "밤마다 나타나는 신비로운 도서관과 그곳의 책들.",
    totalPage: 298,
    currentPage: 0,
    status: "want",
  },
];

export const MOCK_USER = {
  id: "user1",
  name: "김독서",
  avatar:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
  bio: "매일 조금씩, 꾸준히 읽는 것이 목표입니다 📚",
  joinDate: "2026-01-15",
  totalBooks: 24,
  totalPages: 5840,
  streak: 20,
  points: 1250,
  donationTotal: 3,
  favoriteGenres: ["소설", "인문", "철학"],
};

export const MOCK_CLUBS = [
  {
    id: "c1",
    name: "한강 읽기 모임",
    description: "한강 작가의 작품을 함께 읽고 이야기 나누는 모임입니다.",
    cover:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop",
    currentBook: "채식주의자",
    memberCount: 8,
    maxMembers: 10,
    host: "이책장",
    tags: ["한국문학", "소설"],
    pageRange: "1-120",
    deadline: "2026-04-30",
    isJoined: true,
  },
  {
    id: "c2",
    name: "세계문학 탐험대",
    description: "매달 다른 나라의 문학 작품을 읽으며 세계를 여행합니다.",
    cover:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=200&fit=crop",
    currentBook: "파친코",
    memberCount: 15,
    maxMembers: 20,
    host: "박세계",
    tags: ["세계문학", "역사소설"],
    pageRange: "1-200",
    deadline: "2026-05-15",
    isJoined: false,
  },
  {
    id: "c3",
    name: "철학 독서 클럽",
    description: "철학 고전부터 현대 철학까지 함께 읽고 토론합니다.",
    cover:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=200&fit=crop",
    currentBook: "데미안",
    memberCount: 6,
    maxMembers: 12,
    host: "최철학",
    tags: ["철학", "고전"],
    pageRange: "전체",
    deadline: "2026-05-01",
    isJoined: false,
  },
];

export const MOCK_POSTS = [
  {
    id: "p1",
    author: "이책장",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
    title: "채식주의자 읽고 나서 든 생각들",
    content:
      "한강 작가의 문장이 정말 아름답다고 느꼈습니다. 영혜의 선택이 단순히 식습관의 문제가 아니라...",
    createdAt: "2026-04-20",
    likes: 24,
    comments: 8,
    category: "review",
    book: "채식주의자",
  },
  {
    id: "p2",
    author: "박세계",
    authorAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face",
    title: "요즘 읽을 만한 SF 소설 추천해주세요",
    content: "최근 SF에 관심이 생겼는데 어떤 책부터 시작하면 좋을까요?",
    createdAt: "2026-04-19",
    likes: 12,
    comments: 15,
    category: "question",
  },
  {
    id: "p3",
    author: "최철학",
    authorAvatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
    title: "올해 목표 독서량 달성했습니다!",
    content: "연초에 세웠던 목표 30권을 드디어 달성했어요. 여러분도 화이팅!",
    createdAt: "2026-04-18",
    likes: 45,
    comments: 12,
    category: "free",
  },
];

export const GENRES = [
  "소설", "인문", "철학", "역사", "과학", "경제/경영",
  "자기계발", "예술", "여행", "요리", "건강", "어린이",
  "SF", "판타지", "추리", "로맨스",
];

// ── 커뮤니티 UI 확인용 mock 데이터 (Firestore meetings/board 구조와 동일) ──────
// members: UID 배열, likes: UID 배열, createdAt: Date 문자열 (formatTs 호환)

export const MOCK_COMMUNITY_MEETINGS = [
  {
    id: "mock-m1",
    title: "한강 문학 깊이 읽기",
    description: "한강 작가의 작품을 천천히 읽으며 문장 하나하나의 의미를 탐구합니다.",
    currentBook: "소년이 온다 — 한강",
    pageRange: "p.1 ~ 100",
    deadline: "2026-05-10",
    maxMembers: 10,
    genre: "소설",
    hostUid: "mock-uid-1",
    hostName: "김서진",
    members: Array.from({ length: 7 }, (_, i) => `mock-uid-${i + 1}`),
    createdAt: "2026-04-10",
    cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=180&fit=crop",
    announcements: [
      { text: "4월 26일~5월 10일 동안 p.1~100을 읽겠습니다. 첫 모임이니 가벼운 마음으로 참여해주세요!", createdAt: "2026-04-20" },
      { text: "모임 개설 안내: 첫 모임은 4월 말에 온라인으로 진행할 예정입니다. 많은 참여 부탁드려요.", createdAt: "2026-04-10" },
    ],
  },
  {
    id: "mock-m2",
    title: "세계문학 탐험단",
    description: "매달 다른 나라의 대표 문학 작품을 읽으며 세계 문화를 탐험합니다.",
    currentBook: "파친코 — 이민진",
    pageRange: "p.1 ~ 200",
    deadline: "2026-05-15",
    maxMembers: 20,
    genre: "소설",
    hostUid: "mock-uid-2",
    hostName: "박도윤",
    members: Array.from({ length: 15 }, (_, i) => `mock-uid-${i + 11}`),
    createdAt: "2026-04-08",
    cover: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=180&fit=crop",
    announcements: [
      { text: "5월 16일 온라인 토론이 확정됐어요. 줌 링크는 당일 카카오톡으로 공유할게요.", createdAt: "2026-04-18" },
      { text: "4월 26일~5월 15일까지 p.1~200 읽어오세요. 5월 16일 온라인 토론 예정입니다.", createdAt: "2026-04-08" },
    ],
  },
  {
    id: "mock-m3",
    title: "철학의 산책자들",
    description: "철학 고전부터 현대 철학까지 함께 읽고 깊이 있게 토론합니다.",
    currentBook: "데미안 — 헤르만 헤세",
    pageRange: "전체",
    deadline: "2026-05-01",
    maxMembers: 12,
    genre: "인문",
    hostUid: "mock-uid-3",
    hostName: "이하은",
    members: Array.from({ length: 6 }, (_, i) => `mock-uid-${i + 31}`),
    createdAt: "2026-04-05",
    cover: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=180&fit=crop",
    announcements: [],
  },
  {
    id: "mock-m4",
    title: "SF 비전 클럽",
    description: "미래를 상상하는 SF 소설들을 함께 읽고 세계관과 아이디어를 공유합니다.",
    currentBook: "파운데이션 — 아이작 아시모프",
    pageRange: "p.1 ~ 150",
    deadline: "2026-05-20",
    maxMembers: 8,
    genre: "SF",
    hostUid: "mock-uid-4",
    hostName: "정민준",
    members: Array.from({ length: 3 }, (_, i) => `mock-uid-${i + 41}`),
    createdAt: "2026-04-15",
    cover: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=180&fit=crop",
    announcements: [
      { text: "5월 첫째 주까지 p.1~150 완료! 읽다가 궁금한 점은 감상 글에 남겨주세요.", createdAt: "2026-04-15" },
    ],
  },
  {
    id: "mock-m5",
    title: "에세이 한 잔",
    description: "일상의 소소한 이야기를 담은 에세이를 읽으며 공감과 위로를 나눕니다.",
    currentBook: "오늘도 무사히 — 하태완",
    pageRange: "p.1 ~ 80",
    deadline: "2026-05-05",
    maxMembers: 10,
    genre: "에세이",
    hostUid: "mock-uid-5",
    hostName: "최수아",
    members: Array.from({ length: 9 }, (_, i) => `mock-uid-${i + 51}`),
    createdAt: "2026-04-12",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=180&fit=crop",
    announcements: [],
  },
  {
    id: "mock-m6",
    title: "역사 속으로",
    description: "인류 역사의 주요 사건들을 다룬 책들을 읽으며 역사적 통찰을 함께 나눕니다.",
    currentBook: "총, 균, 쇠 — 재레드 다이아몬드",
    pageRange: "p.100 ~ 250",
    deadline: "2026-05-25",
    maxMembers: 15,
    genre: "역사",
    hostUid: "mock-uid-6",
    hostName: "강지호",
    members: Array.from({ length: 11 }, (_, i) => `mock-uid-${i + 61}`),
    createdAt: "2026-04-03",
    cover: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=180&fit=crop",
    announcements: [
      { text: "4월 26일~5월 25일 동안 p.100~250을 읽겠습니다. 분량이 많으니 미리 조금씩 읽어두시면 좋아요!", createdAt: "2026-04-20" },
    ],
  },
  {
    id: "mock-m7",
    title: "시詩를 읽는 시간",
    description: "현대 시와 고전 시를 함께 읽으며 시어의 아름다움과 여운을 나눕니다.",
    currentBook: "하늘과 바람과 별과 시 — 윤동주",
    pageRange: "전체",
    deadline: "2026-04-30",
    maxMembers: 8,
    genre: "시",
    hostUid: "mock-uid-7",
    hostName: "윤아람",
    members: Array.from({ length: 4 }, (_, i) => `mock-uid-${i + 71}`),
    createdAt: "2026-04-18",
    cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=180&fit=crop",
    announcements: [],
  },
];

export const MOCK_COMMUNITY_POSTS = [
  {
    id: "mock-p1",
    title: "채식주의자를 읽고 — 우리는 무엇을 선택하고 있나",
    content: "한강 작가의 문장이 정말 아름답다고 느꼈습니다. 영혜의 선택이 단순히 식습관의 문제가 아니라 삶의 방식 전체를 거부하는 행위로 읽혔어요. 읽는 내내 불편하면서도 시선을 뗄 수가 없었습니다.",
    category: "독후감",
    authorUid: "mock-uid-1",
    authorName: "김서진",
    likes: Array.from({ length: 24 }, (_, i) => `mock-uid-${i + 100}`),
    commentCount: 8,
    createdAt: "2026-04-20",
  },
  {
    id: "mock-p2",
    title: "요즘 읽기 좋은 SF 소설 추천해주세요",
    content: "최근 SF에 관심이 생겼는데 어떤 책부터 시작하면 좋을까요? 세계관이 탄탄하고 과학적 개연성이 있는 작품이었으면 해요. 클래식 SF도, 최근작도 환영합니다!",
    category: "질문",
    authorUid: "mock-uid-4",
    authorName: "정민준",
    likes: Array.from({ length: 12 }, (_, i) => `mock-uid-${i + 130}`),
    commentCount: 15,
    createdAt: "2026-04-19",
  },
  {
    id: "mock-p3",
    title: "올해 목표 50권 달성했어요!",
    content: "연초에 세웠던 목표 50권을 드디어 달성했어요. 완독한 책들 중에서 가장 좋았던 건 단연 '파친코'였습니다. 장대한 서사와 역사적 사실의 조화가 정말 감동적이었어요. 여러분도 화이팅!",
    category: "자유",
    authorUid: "mock-uid-5",
    authorName: "최수아",
    likes: Array.from({ length: 45 }, (_, i) => `mock-uid-${i + 150}`),
    commentCount: 12,
    createdAt: "2026-04-18",
  },
  {
    id: "mock-p4",
    title: "파친코 읽으신 분들과 이야기 나누고 싶어요",
    content: "이민진 작가의 파친코를 며칠 만에 완독했습니다. 선자의 삶이 정말 대단하다는 생각이 들었어요. 역사적 배경도 탄탄하고 인물들의 심리 묘사도 훌륭한데, 여러분은 어떻게 읽으셨나요?",
    category: "자유",
    authorUid: "mock-uid-2",
    authorName: "박도윤",
    likes: Array.from({ length: 18 }, (_, i) => `mock-uid-${i + 200}`),
    commentCount: 6,
    createdAt: "2026-04-17",
  },
  {
    id: "mock-p5",
    title: "데미안 — 자기 자신을 찾는 여정에 대하여",
    content: "헤세의 데미안을 두 번째로 읽었습니다. 처음 읽을 때는 몰랐던 의미들이 이번에는 훨씬 깊게 와닿았어요. '새는 알에서 나오려고 투쟁한다'는 구절이 지금의 저에게 특히 크게 다가왔습니다.",
    category: "독후감",
    authorUid: "mock-uid-3",
    authorName: "이하은",
    likes: Array.from({ length: 31 }, (_, i) => `mock-uid-${i + 220}`),
    commentCount: 9,
    createdAt: "2026-04-16",
  },
  {
    id: "mock-p6",
    title: "매일 꾸준히 독서하는 습관 만들기 팁 공유",
    content: "1년째 매일 최소 30분 독서를 유지하고 있어요. 핵심은 완벽하게 읽으려 하지 말고, 조금씩이라도 꾸준히 하는 것 같아요. 자기 전에 침대에서 10분만 읽는 것도 정말 효과적입니다!",
    category: "자유",
    authorUid: "mock-uid-6",
    authorName: "강지호",
    likes: Array.from({ length: 67 }, (_, i) => `mock-uid-${i + 250}`),
    commentCount: 23,
    createdAt: "2026-04-15",
  },
  {
    id: "mock-p7",
    title: "소설보다 에세이에 빠진 이유",
    content: "오랫동안 소설만 읽다가 올해부터 에세이를 본격적으로 읽기 시작했어요. 저자의 생각과 삶이 직접 전달되어서 소설과는 다른 방식으로 위로를 줍니다. 요즘 추천 에세이 있으면 댓글 달아주세요!",
    category: "자유",
    authorUid: "mock-uid-7",
    authorName: "윤아람",
    likes: Array.from({ length: 29 }, (_, i) => `mock-uid-${i + 320}`),
    commentCount: 7,
    createdAt: "2026-04-14",
  },
  {
    id: "mock-p8",
    title: "한국 현대 소설 처음 읽는 분들께 입문 목록",
    content: "주변에서 한국 소설 어떤 것부터 읽어야 하냐고 자주 물어봐서 제가 생각하는 입문 목록을 정리해봤어요. 채식주의자 → 82년생 김지영 → 아몬드 → 소년이 온다 순서로 읽으시면 좋을 것 같아요.",
    category: "질문",
    authorUid: "mock-uid-8",
    authorName: "이채원",
    likes: Array.from({ length: 15 }, (_, i) => `mock-uid-${i + 350}`),
    commentCount: 19,
    createdAt: "2026-04-13",
  },
];

// ── 자유게시판 게시글별 댓글 ─────────────────────────────────────────────────
export const MOCK_BOARD_COMMENTS = {
  "mock-p1": [
    { id: "bc1-1", authorUid: "mock-uid-2", authorName: "박도윤", content: "저도 같은 생각이에요! 영혜의 선택이 개인적 저항을 넘어 사회 전체에 대한 발언처럼 느껴졌어요.", createdAt: "2026-04-21" },
    { id: "bc1-2", authorUid: "mock-uid-3", authorName: "이하은", content: "한강 작가의 문장은 정말 독보적이죠. 소년이 온다도 꼭 읽어보세요!", createdAt: "2026-04-21" },
    { id: "bc1-3", authorUid: "mock-uid-4", authorName: "정민준", content: "영혜 캐릭터가 처음엔 이해가 안 됐는데 읽다 보면 왜 그런 선택을 했는지 납득이 가더라고요.", createdAt: "2026-04-22" },
  ],
  "mock-p2": [
    { id: "bc2-1", authorUid: "mock-uid-1", authorName: "김서진", content: "파운데이션 추천해요! 아시모프의 역사관을 SF로 풀어낸 게 정말 흥미로워요.", createdAt: "2026-04-19" },
    { id: "bc2-2", authorUid: "mock-uid-3", authorName: "이하은", content: "테드 창의 단편소설 모음집도 입문하기 좋아요. 이야기가 짧아서 부담 없이 읽을 수 있어요.", createdAt: "2026-04-20" },
    { id: "bc2-3", authorUid: "mock-uid-6", authorName: "강지호", content: "류츠신의 삼체 꼭 읽어보세요. 읽고 나서 며칠은 그 세계관에서 못 빠져나왔어요.", createdAt: "2026-04-20" },
    { id: "bc2-4", authorUid: "mock-uid-7", authorName: "윤아람", content: "어슐러 르 귄의 어둠의 왼손도 추천! SF이면서 인류학적 시각이 담긴 수작이에요.", createdAt: "2026-04-21" },
  ],
  "mock-p3": [
    { id: "bc3-1", authorUid: "mock-uid-1", authorName: "김서진", content: "50권 달성 축하해요! 저는 아직 30권인데 자극받았어요 ㅎㅎ", createdAt: "2026-04-18" },
    { id: "bc3-2", authorUid: "mock-uid-6", authorName: "강지호", content: "파친코 저도 정말 좋았어요. 50권 중에 다른 기억에 남는 책도 있으면 알려주세요!", createdAt: "2026-04-19" },
    { id: "bc3-3", authorUid: "mock-uid-4", authorName: "정민준", content: "대단해요! 저는 20권 목표인데 벌써 힘들어서요...", createdAt: "2026-04-19" },
  ],
  "mock-p4": [
    { id: "bc4-1", authorUid: "mock-uid-5", authorName: "최수아", content: "저도 파친코에 완전히 빠져버렸어요. 선자의 삶이 얼마나 힘겨웠는지...", createdAt: "2026-04-17" },
    { id: "bc4-2", authorUid: "mock-uid-7", authorName: "윤아람", content: "1세대부터 4세대까지의 이야기를 하나의 흐름으로 담아낸 게 정말 대단하더라고요.", createdAt: "2026-04-18" },
  ],
  "mock-p5": [
    { id: "bc5-1", authorUid: "mock-uid-1", authorName: "김서진", content: "'새는 알에서 나오려고 투쟁한다' — 이 문장은 정말 인생 문장이에요. 저도 두 번 읽었는데 매번 새롭게 느껴져요.", createdAt: "2026-04-16" },
    { id: "bc5-2", authorUid: "mock-uid-4", authorName: "정민준", content: "청소년 때 읽은 것과 지금 읽은 감상이 너무 달라서 놀랐습니다. 시기마다 다르게 읽히는 책이에요.", createdAt: "2026-04-17" },
  ],
  "mock-p6": [
    { id: "bc6-1", authorUid: "mock-uid-2", authorName: "박도윤", content: "자기 전 10분 독서 정말 효과적이에요! 저도 하고 있는데 잠들기도 더 잘 돼요.", createdAt: "2026-04-15" },
    { id: "bc6-2", authorUid: "mock-uid-5", authorName: "최수아", content: "저는 출퇴근 시간을 독서 시간으로 활용하고 있어요. 하루 30분은 꼭 채우려고 노력해요.", createdAt: "2026-04-16" },
    { id: "bc6-3", authorUid: "mock-uid-7", authorName: "윤아람", content: "오디오북도 좋더라고요. 설거지하거나 운동할 때 들으면 독서량이 늘어요!", createdAt: "2026-04-16" },
  ],
  "mock-p7": [
    { id: "bc7-1", authorUid: "mock-uid-3", authorName: "이하은", content: "에세이로 넘어오신 것 환영해요! 김훈 작가의 밥벌이의 지겨움 추천드려요.", createdAt: "2026-04-14" },
    { id: "bc7-2", authorUid: "mock-uid-6", authorName: "강지호", content: "김영하 작가의 에세이도 추천해요. 문학에 대한 이야기인데 술술 읽혀요.", createdAt: "2026-04-15" },
  ],
  "mock-p8": [
    { id: "bc8-1", authorUid: "mock-uid-2", authorName: "박도윤", content: "좋은 목록이에요! 저는 82년생 김지영부터 시작했는데 정말 좋은 입문서였어요.", createdAt: "2026-04-13" },
    { id: "bc8-2", authorUid: "mock-uid-4", authorName: "정민준", content: "아몬드도 꼭 넣어주세요! 감정을 잘 모르는 주인공의 이야기가 독특하고 감동적이에요.", createdAt: "2026-04-14" },
    { id: "bc8-3", authorUid: "mock-uid-7", authorName: "윤아람", content: "이 목록으로 시작해서 독서 모임도 같이 해요! 커뮤니티에서 기다릴게요 ㅎㅎ", createdAt: "2026-04-14" },
  ],
};

// ── 독서모임별 감상 게시글 ──────────────────────────────────────────────────
export const MOCK_MEETING_POSTS = {
  "mock-m1": [
    { id: "mpost-m1-1", authorUid: "mock-uid-2", authorName: "이지민", content: "소년이 온다를 읽으면서 1980년 5월의 이야기가 이렇게 가슴 아프게 느껴질 줄 몰랐어요. 동호의 이야기에서 계속 눈물이 났어요. 한강 작가의 문장이 정말 날카롭고 아름답습니다.", createdAt: "2026-04-12" },
    { id: "mpost-m1-2", authorUid: "mock-uid-3", authorName: "박준영", content: "역사적 사실을 이렇게 문학적으로 승화시킬 수 있다는 게 놀라웠습니다. p.1~100을 읽었는데 이미 여러 번 책을 덮고 생각에 잠겼어요. 다음 모임 때 이야기 나눌 게 정말 많을 것 같아요.", createdAt: "2026-04-14" },
  ],
  "mock-m2": [
    { id: "mpost-m2-1", authorUid: "mock-uid-12", authorName: "강민서", content: "파친코를 읽으며 이민자의 삶이 얼마나 고달프면서도 강인한지를 느꼈어요. 선자 할머니의 이야기는 읽을수록 더 깊어지는 것 같아요.", createdAt: "2026-04-10" },
    { id: "mpost-m2-2", authorUid: "mock-uid-13", authorName: "정수연", content: "역사 소설이라 처음에는 어렵지 않을까 걱정했는데 전혀 그렇지 않았어요. 200페이지까지 단숨에 읽었습니다!", createdAt: "2026-04-13" },
    { id: "mpost-m2-3", authorUid: "mock-uid-14", authorName: "윤태양", content: "'선자는 살아남았다'는 첫 문장이 모든 것을 담고 있는 것 같아요. 생존이라는 테마가 책 전체를 관통하고 있다는 생각이 들었습니다.", createdAt: "2026-04-15" },
  ],
  "mock-m6": [
    { id: "mpost-m6-1", authorUid: "mock-uid-62", authorName: "최다은", content: "총,균,쇠는 읽을수록 시각이 넓어지는 책이에요. 왜 어떤 문명은 발전하고 어떤 문명은 정복당했는지에 대한 새로운 관점이 인상적이었습니다.", createdAt: "2026-04-05" },
    { id: "mpost-m6-2", authorUid: "mock-uid-63", authorName: "김도현", content: "100~150페이지 부분에서 지리적 요인에 대한 설명이 특히 흥미로웠어요. 단순히 인종이나 능력의 차이가 아니라 환경이 문명의 발전을 결정한다는 주장이 설득력 있습니다.", createdAt: "2026-04-08" },
  ],
};

// ── 독서모임 감상글 댓글 ──────────────────────────────────────────────────────
export const MOCK_MEETING_POST_COMMENTS = {
  "mpost-m1-1": [
    { id: "mpc1-1", authorUid: "mock-uid-1", authorName: "김서진", content: "저도 동호의 이야기에서 정말 많이 울었어요. 한강 작가의 글은 독자를 그 현장에 있게 만드는 것 같아요.", createdAt: "2026-04-12" },
    { id: "mpc1-2", authorUid: "mock-uid-3", authorName: "박준영", content: "다음 모임 때 이 부분 꼭 같이 이야기 나눠요!", createdAt: "2026-04-13" },
  ],
  "mpost-m2-1": [
    { id: "mpc2-1", authorUid: "mock-uid-11", authorName: "박도윤", content: "선자 할머니의 강인함이 정말 인상적이죠. 저도 비슷한 감정을 느꼈어요.", createdAt: "2026-04-11" },
  ],
  "mpost-m6-1": [
    { id: "mpc3-1", authorUid: "mock-uid-61", authorName: "강지호", content: "맞아요, 지리 결정론적 시각이 신선하게 느껴졌어요. 다음 챕터도 기대됩니다!", createdAt: "2026-04-06" },
  ],
};

// ── 4월 1~30일 독서 캘린더 (날짜별 읽은 책 수) ──────────────────────────
// 특이사항:
//  - Apr 10, 14    : 채식주의자 + 파친코        (2권)
//  - Apr 15, 17, 19: 채식주의자 + 파친코 + 산책자의 시간 (3권)
//  - Apr 22~29     : 3권 매일
export const READING_CALENDAR = {
  // ── 4월 ────────────────────────────────────────────────────
  "2026-04-01": 1,
  "2026-04-02": 2,
  "2026-04-03": 1,
  "2026-04-04": 0,
  "2026-04-05": 1, // 파친코
  "2026-04-06": 0,
  "2026-04-07": 1, // 파친코
  "2026-04-08": 1, // 파친코
  "2026-04-09": 0,
  "2026-04-10": 2, // 채식주의자 + 파친코
  "2026-04-11": 1, // 채식주의자
  "2026-04-12": 1, // 파친코
  "2026-04-13": 1, // 채식주의자
  "2026-04-14": 2, // 채식주의자 + 파친코
  "2026-04-15": 3, // 채식주의자 + 파친코 + 산책자의 시간
  "2026-04-16": 1, // 파친코
  "2026-04-17": 2, // 채식주의자 + 산책자의 시간
  "2026-04-18": 2, // 채식주의자 + 파친코
  "2026-04-19": 2, // 채식주의자 + 산책자의 시간
  "2026-04-20": 2, // 채식주의자 + 파친코
  "2026-04-21": 2, // 채식주의자 + 산책자의 시간
  "2026-04-22": 3, // 3권
  "2026-04-23": 3,
  "2026-04-24": 3,
  "2026-04-25": 3,
  "2026-04-26": 2, // 채식주의자 + 파친코
  "2026-04-27": 3, // 3권
  "2026-04-28": 2,
  "2026-04-29": 3,
  "2026-04-30": 0,
  // ── 3월 ────────────────────────────────────────────────────
  "2026-03-01": 2,
  "2026-03-02": 3,
  "2026-03-03": 2,
  "2026-03-04": 0,
  "2026-03-05": 3,
  "2026-03-06": 2,
  "2026-03-07": 0,
  "2026-03-08": 2,
  "2026-03-09": 3,
  "2026-03-10": 3,
  "2026-03-11": 0,
  "2026-03-12": 3,
  "2026-03-13": 2,
  "2026-03-14": 3,
  "2026-03-15": 4,
  // ── 2월 ────────────────────────────────────────────────────
  "2026-02-15": 2,
  "2026-02-16": 2,
  "2026-02-17": 3,
  "2026-02-19": 2,
  "2026-02-20": 3,
  "2026-02-22": 2,
  "2026-02-24": 3,
  "2026-02-25": 3,
  "2026-02-26": 2,
  "2026-02-27": 3,
  "2026-02-28": 2,
};
