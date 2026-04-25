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
