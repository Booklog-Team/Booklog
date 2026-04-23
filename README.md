# 📚 Booklog — 나만의 디지털 서재

> 독서를 기록하고, 공유하며, 그 가치를 확장하는 플랫폼

---

## 👥 팀원

| 이름 | 담당 |
|------|------|
| 신민서 | 인증/온보딩/프로필/포인트/커뮤니티 |
| 홍준화 | 메인/검색/도서상세 |
| 이예진 | 서재/캘린더 |

---

## 🛠 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React + Vite |
| 스타일 | Tailwind CSS |
| 인증/DB | Firebase Auth + Firestore |
| 외부 API | Google Books API |
| 인프라 | AWS EC2 + Docker + Nginx |

---

## ✨ 주요 기능

- Google / 이메일 로그인
- 도서 검색 및 독서 상태 관리
- 독서 진행률 트래킹 및 캘린더
- 커뮤니티 (독서 모임 / 자유 게시판)
- 포인트 기반 기부 시스템

---

## 🚀 실행 방법

```bash
git clone https://github.com/Booklog-Team/Booklog.git
cd Booklog
npm install
npm run dev
```

`.env.local` 파일을 `client/` 폴더에 생성하고 Firebase 및 Google Books API 키를 입력해주세요.

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_BOOKS_API_KEY=
```

---

## 📦 배포

- AWS EC2 + Docker + Nginx
- 도메인: 추후 업데이트
