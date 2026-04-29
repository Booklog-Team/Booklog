# BOOKLOG — 작업계획서 (PRD.md)

> 이 문서는 Claude Code / Antigravity 등 AI 코딩 어시스턴트가 프로젝트 전체 맥락을 파악하기 위한 기준 문서입니다.
> 작업 시작 전 반드시 이 문서를 읽고 구조와 규칙을 따라 작업해주세요.

---

## 1. 프로젝트 개요

| 항목      | 내용                                                 |
| --------- | ---------------------------------------------------- |
| 서비스명  | Booklog (북로그)                                     |
| 한줄 소개 | 독서를 기록하고, 공유하며, 그 가치를 확장하는 플랫폼 |
| 개발 기간 | 2026.04.20 ~ 2026.04.30                              |
| 팀 구성   | 3인                                                  |
| 배포 환경 | AWS EC2 + Docker + Nginx + 내도메인한국              |
| GitHub    | https://github.com/Booklog-Team/Booklog              |

### 서비스 목적

독서 경험을 체계적으로 기록·축적하고, 커뮤니티와 연결하여 독서를 사회적 가치로 확장한다.
포인트 기반 기부 시스템을 통해 독서 활동에 의미를 더한다.

### 사용자 구분

| 구분   | 설명                        |
| ------ | --------------------------- |
| 회원   | 서비스 전체 기능 이용 가능  |
| 모임장 | 독서 모임 생성 및 관리 권한 |

---

## 2. 기술 스택

| 구분      | 기술                                | 비고                                    |
| --------- | ----------------------------------- | --------------------------------------- |
| Frontend  | React + Vite                        | JavaScript                              |
| 라우팅    | React Router DOM v6                 |                                         |
| 스타일    | Tailwind CSS                        | Manus 테마 기반                         |
| 상태 관리 | Context API                         | AuthContext, ShelfContext, PointContext |
| 인증/DB   | Firebase Authentication + Firestore |                                         |
| 외부 API  | Google Books API                    | 환경변수로 키 관리                      |
| 폼 관리   | React Hook Form                     | 로그인/회원가입 유효성 검사             |
| 날짜 처리 | dayjs                               | 캘린더, 마지막 읽은 날                  |
| 에디터    | React Quill                         | 게시판 글쓰기                           |
| 협업      | Slack + GitHub + Jira + Notion      |                                         |
| 인프라    | AWS EC2 + Docker + Nginx            |                                         |
| 도메인    | 내도메인한국 + Let's Encrypt        | HTTPS                                   |

### 디자인 시스템 (Manus 테마)

| 항목           | 값                  |
| -------------- | ------------------- |
| 컨셉           | 따뜻한 라이브러리   |
| 배경           | #FDFAF6 (아이보리)  |
| Primary        | #B85C38 (테라코타)  |
| Secondary      | #E8DDD0 (웜 베이지) |
| Accent         | #4A7C59 (모스 그린) |
| 텍스트         | #2C2416 (딥 브라운) |
| 로고 폰트      | DM Mono             |
| 기본 UI 폰트   | Pretendard Variable |
| 제목/강조 폰트 | Noto Serif KR       |

---

## 3. 폴더 구조 ✏️

```
booklog/
├── client/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css                         # Manus 테마 (수정 금지)
│   │   │
│   │   ├── firebase/
│   │   │   ├── config.js                     # Firebase 초기화
│   │   │   └── auth.js                       # 로그인/로그아웃 함수
│   │   │
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx               # 로그인 상태 전역 관리
│   │   │   ├── ShelfContext.jsx              # 서재 상태 전역 관리
│   │   │   └── PointContext.jsx              # 포인트 전역 관리
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js                    # 로그인 커스텀 훅
│   │   │   ├── useBooks.js                   # Google Books API 훅
│   │   │   └── useMobile.jsx                 # 모바일 감지 (Manus 제공)
│   │   │
│   │   ├── pages/                            # 페이지 규모에 따라 단일 파일 또는 하위 폴더로 구성
│   │   │   ├── auth/
│   │   │   │   ├── Auth.jsx                  # 로그인/회원가입
│   │   │   │   └── Onboarding.jsx            # 온보딩
│   │   │   ├── Main.jsx                      # 메인
│   │   │   ├── Search.jsx                    # 검색
│   │   │   ├── BookDetail.jsx                # 도서 상세
│   │   │   ├── Library.jsx                   # 서재 + 캘린더
│   │   │   ├── Profile.jsx                   # 프로필
│   │   │   ├── community/
│   │   │   │   ├── Meeting.jsx               # 독서 모임
│   │   │   │   └── Board.jsx                 # 자유 게시판
│   │   │   ├── Points.jsx                    # 포인트 & 기부
│   │   │   └── NotFound.jsx                  # 404
│   │   │
│   │   ├── components/                       # 역할별 하위 폴더로 세분화
│   │   │   ├── common/
│   │   │   │   ├── Layout.jsx                # 레이아웃 래퍼 (Manus 제공)
│   │   │   │   ├── TopNav.jsx                # 상단 네비 (Manus 제공)
│   │   │   │   ├── SideNav.jsx               # 사이드 네비 (Manus 제공)
│   │   │   │   ├── BottomNav.jsx             # 하단 탭 모바일 (Manus 제공)
│   │   │   │   └── PrivateRoute.jsx          # 비로그인 접근 차단
│   │   │   ├── book/
│   │   │   │   ├── BookCard.jsx              # 책 카드 (Manus 제공)
│   │   │   │   ├── StatusButtons.jsx         # 읽고싶다/읽는중/완독
│   │   │   │   └── ReadingTracker.jsx        # 진행률, 메모, 체크
│   │   │   ├── library/
│   │   │   │   ├── LibraryCard.jsx           # 서재 도서 카드
│   │   │   │   ├── ReadingCalendar.jsx       # 월별 달력
│   │   │   │   └── ProgressBar.jsx           # 진행률 바
│   │   │   ├── community/
│   │   │   │   ├── MeetingCard.jsx           # 모임 카드
│   │   │   │   ├── PostCard.jsx              # 게시글 카드
│   │   │   │   └── Comment.jsx               # 댓글
│   │   │   ├── point/
│   │   │   │   └── PointBadge.jsx            # 포인트 배지
│   │   │   └── ui/                           # shadcn/ui 컴포넌트 (Manus 제공)
│   │   │
│   │   ├── constants/                        # 공통 상수 (신규 추가)
│   │   │   ├── bookStatus.js                 # 도서 상태값 상수
│   │   │   ├── routes.js                     # 라우팅 경로 상수
│   │   │   └── collections.js                # Firestore 컬렉션명 상수
│   │   │
│   │   ├── utils/
│   │   │   └── api.js                        # Google Books API fetch
│   │   │
│   │   └── lib/
│   │       ├── mockData.js                   # 더미 데이터 (Manus 제공)
│   │       └── utils.js                      # 유틸 함수
│   │
│   └── index.html
│
├── server/                                   # Manus 제공 (건드리지 않음)
├── shared/                                   # 공통 상수
├── .env                                      # API 키 (Git 제외)
├── PRD.md                                    # 이 문서
├── package.json
└── vite.config.js
```

---

## 4. 환경변수 (.env)

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ALADIN_API_KEY=
```

> ⚠️ .env 파일은 절대 GitHub에 올리지 않는다. .gitignore에 반드시 포함할 것.

---

## 5. 라우팅 구조 (App.jsx)

```jsx
<BrowserRouter>
  <Routes>
    {/* 비로그인 접근 가능 */}
    <Route path="/auth" element={<Auth />} />

    {/* 로그인 필수 (PrivateRoute) */}
    <Route element={<PrivateRoute />}>
      <Route element={<PageLayout />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<Main />} />
        <Route path="/search" element={<Search />} />
        <Route path="/book/:id" element={<BookDetail />} />
        <Route path="/library" element={<Library />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/community/meeting" element={<Meeting />} />
        <Route path="/community/board" element={<Board />} />
        <Route path="/points" element={<Points />} />
      </Route>
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

---

## 6. Firebase 설정

```js
// client/src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

## 7. Firestore 데이터 구조

```
users/
  {uid}/
    nickname        string
    email           string
    genres[]        array       # 온보딩 선택 장르
    isOnboarded     boolean
    totalPoints     number      # 누적 포인트
    lastPointDate   string      # 마지막 포인트 적립일 (하루 1회 제한)
    shelf/
      {bookId}/
        title         string
        author        string
        thumbnail     string
        status        string    # 'want' | 'reading' | 'done'
        currentPage   number
        totalPage     number
        lastReadDate  string
        checkedDates[] array
        memo          string

communities/
  meetings/
    {meetingId}/
      title           string
      description     string
      hostUid         string    # 모임장 uid
      pageRange       string    # 읽을 페이지 범위
      deadline        timestamp # 마감일
      members[]       array
      createdAt       timestamp
      posts/
        {postId}/
          content     string
          authorUid   string
          createdAt   timestamp
          comments/
            {commentId}/
              content   string
              authorUid string
              createdAt timestamp
  board/
    {postId}/
      title         string
      content       string
      authorUid     string
      likes[]       array
      createdAt     timestamp
      comments/
        {commentId}/
          content   string
          authorUid string
          createdAt timestamp

points/
  global/
    totalDonated    number      # 전체 누적 기부 포인트
    goalAmount      number      # 기부 목표
    updatedAt       timestamp
```

---

## 8. 페이지별 기능 명세

### 01. Onboarding

- 첫 로그인 시에만 표시 (`isOnboarded` 플래그)
- 장르 카드 8개 (소설/인문/과학/경제/자기계발/예술/역사/아동)
- 최대 3개 선택
- Firestore `users/{uid}.genres` 저장, `isOnboarded: true`
- 건너뛰기 → `isOnboarded: true`만 저장

### 02. Auth

- 이메일/비밀번호 로그인 (`signInWithEmailAndPassword`)
- Google 소셜 로그인 (`signInWithPopup`)
- 회원가입 (`createUserWithEmailAndPassword`)
- React Hook Form 유효성 검사
- 로그인 성공 → `isOnboarded` 확인 → 온보딩 or 메인

### 03. Main

- Hero: 유저 닉네임, 마지막 읽던 책, 독서 통계
- 장르 필터 칩, 카테고리 카드
- 취향 맞춤 추천 (Firestore genres 기반 API)
- 인기 도서 목록
- 현재 읽는 도서 섹션
- 커뮤니티 배너/모임 미리보기

### 04. Search

- Google Books API 검색 (400ms 디바운스)
- 검색 결과 그리드
- 검색 결과 없음 UI
- 검색 결과에서 바로 찜 추가 가능 ??????

### 05. BookDetail

- Google Books API 상세 정보
- 책 표지/제목/저자/줄거리/평점
- StatusButtons: 읽고싶음/읽는중/완독 → Firestore 저장
- ReadingTracker:
  - 현재 페이지 입력 → 진행률 자동 계산
  - 오늘 독서 체크 → checkedDates 추가 + 포인트 적립
  - 한줄 메모 (onBlur 저장)
- 관련 도서 추천

### 06. Library

- 대표 도서: lastReadDate 기준, 읽는중 우선
- 상태별 탭: 읽는중/읽고싶음/완독
- LibraryCard: 진행률 바, 마지막 읽은 날짜
- 도서 추가/삭제/상태 변경
- 캘린더: dayjs 월별 달력, 독서일 표시, 연속 독서일

### 07. Profile

- 유저 정보 (닉네임, 이메일)
- 독서 통계 (완독 수, 연속일, 총 페이지)
- 장르별 독서 비율 차트
- 프로필 수정
- 로그아웃

### 08. Meeting

- 모임 목록/상세
- 모임 생성 (모임장만 가능)
- 모임 참여 (`members[]` 배열에 uid 추가)
- 페이지 범위/마감일 설정
- 게시글/댓글 작성

### 09. Board

- 자유 게시판 목록/상세
- 게시글 작성 (React Quill 에디터)
- 댓글 작성
- 좋아요

### 10. Points

- 사용자 포인트 현황 표시
- 포인트 적립 내역
- 전체 누적 기부 포인트 시각화 (진행률 바)
- 기부 환산 정보

---

## 9. 포인트 & 기부 시스템 상세

### 적립 규칙

| 행동               | 포인트      | 제한     |
| ------------------ | ----------- | -------- |
| 오늘 독서 체크     | +10p        | 하루 1회 |
| 메모 작성          | +5p         | 하루 1회 |
| 모임 게시글 작성   | +5p         | 하루 1회 |
| 자유게시판 글 작성 | +3p         | 하루 1회 |
| 완독               | 포인트 없음 | -        |

### 기부 시스템

- 전체 사용자 포인트 합산 → 기부 금액으로 환산
- Firestore `points/global` 에 누적
- 진행 상황 시각화 (목표 대비 %)

---

## 10. Google Books API

```js
// client/src/utils/api.js
const BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const API_KEY = import.meta.env.VITE_BOOKS_API_KEY;

export const searchBooks = async (query, orderBy = "relevance") => {
  const res = await fetch(
    `${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=20&orderBy=${orderBy}&key=${API_KEY}&langRestrict=ko`
  );
  const data = await res.json();
  return data.items || [];
};

export const getBookDetail = async bookId => {
  const res = await fetch(`${BASE_URL}/${bookId}?key=${API_KEY}`);
  return await res.json();
};

export const getBooksByGenre = async genre => {
  const res = await fetch(
    `${BASE_URL}?q=subject:${encodeURIComponent(genre)}&maxResults=10&key=${API_KEY}&langRestrict=ko`
  );
  const data = await res.json();
  return data.items || [];
};
```

---

## 11. 컴포넌트 공통 규칙

- **스타일**: Tailwind CSS + Manus 테마 변수 사용. 인라인 스타일 금지
- **상태 관리**: 전역 상태는 Context API (AuthContext, ShelfContext, PointContext)
- **Firebase 호출**: 페이지에서 직접 호출 금지. hooks로 분리
- **상수**: 문자열 하드코딩 금지. 반드시 `constants/`에서 import해서 사용
- **이미지**: Google Books API thumbnail 사용. 없으면 placeholder
- **로딩**: 스피너 또는 skeleton UI
- **에러**: try-catch, 사용자에게 토스트 메시지
- **컴포넌트명**: PascalCase
- **함수명**: camelCase
- **상수**: UPPER_SNAKE_CASE
- **Manus 제공 컴포넌트**: 수정 최소화, 기능 추가 시 래핑해서 사용

---

## 12. 팀원 역할 분담 ✏️ [갱신]

| 팀원 | 담당                      | 파일                                                                                                                                                         |
| ---- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 준화 | 메인/검색/도서상세        | pages/Main.jsx, pages/Search.jsx, pages/BookDetail.jsx, components/book/, utils/api.js                                                                       |
| 민서 | 인증/온보딩/프로필/포인트 | pages/auth/, pages/Profile.jsx, pages/Points.jsx, firebase/, **contexts/AuthContext.jsx**, **contexts/PointContext.jsx**, components/common/PrivateRoute.jsx |
| 예진 | 서재/커뮤니티             | pages/Library.jsx, pages/community/, **contexts/ShelfContext.jsx**, components/library/, components/community/                                               |

> 역할별 상세 내용은 `팀_작업_분배_Team_Roles.pdf` 참고

### Context 담당 분리 요약

| Context          | 담당 |
| ---------------- | ---- |
| AuthContext.jsx  | 민서 |
| PointContext.jsx | 민서 |
| ShelfContext.jsx | 예진 |

### 공통 작업 규칙

- `constants/` 파일은 충돌 방지를 위해 작업 시작 전 먼저 생성 후 팀 공유
- 공통 파일 (api.js, contexts/, constants/) 중복 생성 금지 — 하나만 사용
- 도서 상태값은 반드시 `constants/bookStatus.js`의 `BOOK_STATUS` 사용

### 각자 첫 번째 작업

- **준화**: `feature/junhwa-main` 브랜치 → constants/ 파일 먼저 작성 후 utils/api.js → Main 시작
- **민서**: `feature/minseo-auth` 브랜치 → firebase/config.js → AuthContext.jsx → Auth 페이지
- **예진**: `feature/yejin-context` 브랜치 → ShelfContext.jsx, PointContext.jsx 먼저

---

## 13. Git 브랜치 전략

```
main              ← 최종 배포본 (발표 전날 1회 머지)
develop           ← 통합 브랜치 (PR 머지 대상)
feature/이름-기능  ← 개인 작업 브랜치
```

### 커밋 메시지 규칙

```
feat: 기능 추가
fix: 버그 수정
refactor: 리팩토링
docs: 문서 수정
style: CSS/스타일 수정
```

### PR 규칙

- feature → develop PR 시 팀원 1명 이상 리뷰 필수
- Slack #개발 채널에 PR 링크 공유
- 머지 후 feature 브랜치 삭제

---

## 14. 작업 순서 체크리스트 ✏️ [갱신]

```
# 민서 — 인증/온보딩/포인트
[ ] STEP B-01. firebase/config.js 작성
[ ] STEP B-02. AuthContext.jsx 작성
[ ] STEP B-03. PrivateRoute.jsx 작성
[ ] STEP B-04. Auth.jsx (로그인/회원가입) 구현
[ ] STEP B-05. Onboarding.jsx 구현
[ ] STEP B-06. Points.jsx 구현
[ ] STEP B-07. 포인트 적립 로직 (독서 체크 연동)

# 준화 — 메인/검색/도서상세
[ ] STEP A-01. constants/bookStatus.js 작성
[ ] STEP A-02. constants/routes.js 작성
[ ] STEP A-03. constants/collections.js 작성
[ ] STEP A-04. utils/api.js 작성
[ ] STEP A-05. BookCard.jsx 작성
[ ] STEP A-06. Main.jsx 구현
[ ] STEP A-07. Search.jsx 구현
[ ] STEP A-08. BookDetail.jsx + StatusButtons + ReadingTracker

# 예진 — 서재/커뮤니티/프로필
[ ] STEP C-01. ShelfContext.jsx + PointContext.jsx 작성
[ ] STEP C-02. Library.jsx + LibraryCard + ReadingCalendar 구현
[ ] STEP C-03. Profile.jsx 구현
[ ] STEP C-04. Meeting.jsx + MeetingCard 구현
[ ] STEP C-05. Board.jsx + PostCard + Comment 구현

# 공통
[ ] STEP ALL-01. 전체 스타일 Tailwind 다듬기
[ ] STEP ALL-02. Dockerfile + nginx.conf 작성
[ ] STEP ALL-03. EC2 배포 + 도메인 연결
[ ] STEP ALL-04. HTTPS 적용 (Let's Encrypt)
[ ] STEP ALL-05. 최종 테스트 + 버그 수정
[ ] STEP ALL-06. README.md 작성
```

---

## 15. 배포 구조

```
사용자
  ↓
내도메인한국 (DNS A레코드)
  ↓
AWS EC2 (Nginx)
  ↓
Docker 컨테이너 (React 빌드)
  ↓
Firebase (Auth + Firestore) / Google Books API
```

```dockerfile
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

> 이 문서는 프로젝트 진행에 따라 업데이트됩니다.
> Claude Code / Antigravity 사용 시 이 파일을 컨텍스트로 제공하고 작업을 요청하세요.
> 마지막 업데이트: 2026.04.22
