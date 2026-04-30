# BOOKLOG — 작업계획서 (PRD.md)

> 마지막 업데이트: 2026.04.30

---

## 1. 프로젝트 개요

| 항목      | 내용                                                 |
| --------- | ---------------------------------------------------- |
| 서비스명  | Booklog (북로그)                                     |
| 한줄 소개 | 독서를 기록하고, 공유하며, 그 가치를 확장하는 플랫폼 |
| 개발 기간 | 2026.04.20 ~ 2026.04.30                              |
| 팀 구성   | 3인                                                  |
| 배포 URL  | https://booklog.kro.kr                               |
| 배포 환경 | AWS EC2 + Docker + Nginx + 내도메인한국              |
| GitHub    | https://github.com/Booklog-Team/Booklog              |

### 서비스 목적

독서 경험을 체계적으로 기록·축적하고, 커뮤니티와 연결하여 독서를 사회적 가치로 확장한다.
포인트 기반 기부 시스템을 통해 독서 활동에 의미를 더한다.

### 핵심 키워드

| 키워드 | 설명 |
|---|---|
| 독서 기록화 | 흩어진 독서 경험을 데이터로 축적하는 개인 서재 |
| 맞춤형 도서 발견 | 사용자 취향과 상황에 맞는 도서 탐색 경험 |
| 독서 가치 확장 | 개인의 독서를 커뮤니티와 기부로 연결하는 플랫폼 |

---

## 2. 기술 스택

| 구분      | 기술                                | 비고                                    |
| --------- | ----------------------------------- | --------------------------------------- |
| Frontend  | React + Vite                        | JavaScript                              |
| 라우팅    | React Router DOM v6                 |                                         |
| 스타일    | Tailwind CSS                        |                                         |
| 상태 관리 | Context API                         | AuthContext, ShelfContext, PointContext |
| 인증/DB   | Firebase Authentication + Firestore |                                         |
| 외부 API  | 알라딘 Open API                     | 서버 프록시로 키 관리                   |
| 외부 API  | Groq API (llama-3.3-70b)            | AI 챗봇, 서버 프록시                   |
| 외부 API  | Google Maps API                     | 도서관 위치                             |
| 외부 API  | 도서관 정보나루 API                 | 전국 도서관 데이터, 서버 프록시         |
| 외부 API  | 날씨 API                            | 날씨 기반 도서 추천                     |
| 서버      | Node.js Express                     | API 프록시 + React SPA 서빙            |
| 인프라    | AWS EC2 + Docker + Nginx            |                                         |
| CI/CD     | GitHub Actions                      | develop push 시 자동 배포               |
| 도메인    | 내도메인한국 + Let's Encrypt        | booklog.kro.kr, HTTPS                  |

---

## 3. 폴더 구조

```
booklog/
├── client/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── firebase/
│   │   │   ├── config.js
│   │   │   └── auth.js
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ShelfContext.jsx
│   │   │   └── PointContext.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Auth.jsx
│   │   │   │   └── Onboarding.jsx
│   │   │   ├── Main.jsx
│   │   │   ├── Search.jsx
│   │   │   ├── BookDetail.jsx
│   │   │   ├── Library.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── community/
│   │   │   │   ├── Meeting.jsx
│   │   │   │   └── Board.jsx
│   │   │   ├── Points.jsx
│   │   │   └── NotFound.jsx
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Layout.jsx
│   │   │   │   ├── TopNav.jsx
│   │   │   │   ├── SideNav.jsx
│   │   │   │   ├── BottomNav.jsx
│   │   │   │   └── PrivateRoute.jsx
│   │   │   ├── book/
│   │   │   │   ├── BookCard.jsx
│   │   │   │   ├── StatusButtons.jsx
│   │   │   │   └── ReadingTracker.jsx
│   │   │   ├── library/
│   │   │   │   ├── LibraryCard.jsx
│   │   │   │   ├── ReadingCalendar.jsx
│   │   │   │   └── ProgressBar.jsx
│   │   │   ├── community/
│   │   │   │   ├── MeetingCard.jsx
│   │   │   │   ├── PostCard.jsx
│   │   │   │   └── Comment.jsx
│   │   │   ├── point/
│   │   │   │   └── PointBadge.jsx
│   │   │   └── ChatBot.jsx
│   │   └── utils/
│   │       └── api.js
│   └── index.html
├── scripts/
│   └── seedFirestore.cjs
├── server.js
├── Dockerfile
├── .github/
│   └── workflows/
│       └── deploy.yml
├── .env
├── PRD.md
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
VITE_GOOGLE_MAPS_KEY=
VITE_LIBRARY_API_KEY=
GROQ_API_KEY=
```

> ⚠️ .env 파일은 절대 GitHub에 올리지 않는다. .gitignore에 반드시 포함할 것.

---

## 5. 라우팅 구조 (App.jsx)

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/auth" element={<Auth />} />
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
    genres[]        array
    isOnboarded     boolean
    totalPoints     number
    createdAt       timestamp
    shelf/
      {itemId}/
        title         string
        author        string
        thumbnail     string
        status        string    # 'want' | 'reading' | 'done'
        currentPage   number
        totalPage     number
        lastReadDate  string
        checkedDates[] array
        memo          string
        rating        number

meetings/
  {meetingId}/
    title           string
    description     string
    hostUid         string
    hostName        string
    currentBook     string
    pageRange       string
    deadline        string
    maxMembers      number
    members[]       array
    genre           string
    createdAt       timestamp
    comments/
      {commentId}/
        content     string
        authorUid   string
        authorName  string
        createdAt   timestamp

board/
  {postId}/
    title         string
    content       string
    authorUid     string
    authorName    string
    category      string    # '독후감' | '자유' | '질문' | '추천'
    likes[]       array
    createdAt     timestamp

points/
  global/
    totalDonated      number
    goalAmount        number
    donations         object
    participantCount  number
    updatedAt         timestamp
```

---

## 8. 포인트 & 기부 시스템

### 적립 규칙

| 행동               | 포인트 | 제한     |
| ------------------ | ------ | -------- |
| 오늘 독서 체크     | +10p   | 하루 1회 |
| 메모 작성          | +5p    | 하루 1회 |
| 모임 게시글 작성   | +5p    | 하루 1회 |
| 자유게시판 글 작성 | +3p    | 하루 1회 |

### 기부처

| 기부처 | 설명 |
|---|---|
| 책 읽어주는 사회 | 소외계층 독서 지원 |
| 어린이재단 | 아동 교육 지원 |
| 장애인도서관 | 장애인 독서 환경 개선 |

### 레벨 시스템

- Lv1: 0 ~ 199p
- Lv2: 200 ~ 499p
- Lv3: 500p 이상

---

## 9. 시스템 아키텍처

```
사용자
  ↓ HTTPS (Port 443)
내도메인한국 DNS (booklog.kro.kr)
  ↓
AWS EC2 — Nginx (리버스 프록시 + SSL)
  ↓ Proxy (Port 3000)
Node.js Express 서버
  ├── /api/aladin  → 알라딘 Open API
  ├── /api/groq    → Groq AI API
  ├── /api/library → 도서관 정보나루
  └── /dist/public → React SPA
  ↓
Firebase Auth + Firestore
```

---

## 10. CI/CD 파이프라인

```
develop 브랜치 push
  ↓
GitHub Actions 실행
  1. npm install
  2. .env 파일 생성 (GitHub Secrets)
  3. npm run build
  4. Docker 이미지 빌드
  5. SCP로 EC2에 이미지 전송
  6. EC2에서 컨테이너 교체
  ↓
https://booklog.kro.kr 자동 반영
```

---

## 11. 팀원 역할 분담

| 팀원 | 역할 | 담당 |
|---|---|---|
| 이예진 | 팀장 / 프론트엔드 | 서재(독서 기록) 핵심 기능, 독서 캘린더 및 streak 시각화, 커뮤니티(모임·게시판) 기능 개발, 전체 UX 흐름 및 UI 디테일 개선 |
| 신민서 | 프론트엔드 / DB | 로그인·회원가입·온보딩 구현, Firebase Auth 및 Firestore 설계, 포인트 & 기부 시스템 개발, 목업 데이터 → DB 전환 및 배포(CI/CD) |
| 홍준화 | 프론트엔드 / API | 메인 페이지·검색·도서 상세 구현, 알라딘 API 연동 및 추천 기능 개발, 메인 배너 및 UI/UX 개선, AI 추천 및 챗봇 품질 개선 |

---

## 12. Git 브랜치 전략

```
main              ← 최종 배포본
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
chore: 설정/배포 관련
```

---

## 13. 시연 계정

| 항목 | 값 |
|---|---|
| 이메일 | booklog1234@booklog.com |
| 비밀번호 | booklog1234 |
| 닉네임 | 김독서 |

---

> 마지막 업데이트: 2026.04.30
