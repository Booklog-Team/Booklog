// scripts/seedFirestore.cjs
// 실행: node scripts/seedFirestore.cjs
// shelf 초기화: node scripts/seedFirestore.cjs --reset-shelf
const admin = require("firebase-admin");
const axios = require("axios");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

const isResetShelf = process.argv.includes("--reset-shelf");

// ── 알라딘 표지 조회 ──────────────────────────────────────────────────────────

const ALADIN_KEY = process.env.ALADIN_KEY || "ttbsyt091591558001";
const coverCache = new Map();

async function fetchAladinCover(itemId) {
  if (coverCache.has(itemId)) return coverCache.get(itemId);

  try {
    const { data } = await axios.get(
      "https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx",
      {
        params: {
          ttbkey: ALADIN_KEY,
          itemIdType: "ItemId",
          ItemId: itemId,
          output: "js",
          Version: "20131101",
        },
      }
    );
    const cover = data?.item?.[0]?.cover ?? "";
    coverCache.set(itemId, cover);
    console.log(`[COVER]  ${itemId} → ${cover || "(없음)"}`);
    return cover;
  } catch (err) {
    console.warn(`[WARN]   커버 조회 실패 (${itemId}): ${err.message}`);
    coverCache.set(itemId, "");
    return "";
  }
}

// ── 1단계: Auth 유저 생성 ────────────────────────────────────────────────────

const USERS = [
  {
    email: "booklog1234@booklog.com",
    password: "booklog1234",
    nickname: "김독서",
  },
  { email: "reader2@booklog.com", password: "booklog123", nickname: "박문학" },
  { email: "reader3@booklog.com", password: "booklog123", nickname: "이철학" },
];

async function getOrCreateUser({ email, password, nickname }) {
  try {
    const existing = await auth.getUserByEmail(email);
    console.log(`[SKIP]   ${email} — 이미 존재 (uid: ${existing.uid})`);
    return existing.uid;
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
  }

  const created = await auth.createUser({
    email,
    password,
    displayName: nickname,
  });
  console.log(`[CREATE] ${email} — 생성 완료 (uid: ${created.uid})`);
  return created.uid;
}

// ── 2단계: Firestore users/{uid} 문서 생성 ──────────────────────────────────

const USER_PROFILES = [
  {
    uid: "IcifW06lDnUeXepe3fJoOLbxZRm1",
    nickname: "김독서",
    email: "booklog1234@booklog.com",
    genres: ["소설", "인문", "에세이"],
    isOnboarded: true,
    totalPoints: 1250,
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-01-15")),
  },
  {
    uid: "LmOvpryRYLP3Th314zl69tQQm1j2",
    nickname: "박문학",
    email: "reader2@booklog.com",
    genres: ["소설", "자기계발", "역사"],
    isOnboarded: true,
    totalPoints: 870,
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-02-01")),
  },
  {
    uid: "5kf1UAvpWUbUdSluRJzhupBEWXf2",
    nickname: "이철학",
    email: "reader3@booklog.com",
    genres: ["인문", "철학", "에세이"],
    isOnboarded: true,
    totalPoints: 540,
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-03-01")),
  },
];

async function seedUserProfile({ uid, ...data }) {
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    console.log(`[SKIP]   users/${uid} (${data.nickname}) — 이미 존재`);
    return;
  }
  await ref.set(data);
  console.log(`[CREATE] users/${uid} (${data.nickname}) — 생성 완료`);
}

// ── 3단계: 김독서 shelf 도서 추가 ─────────────────────────────────────────────

const KIM_UID = "IcifW06lDnUeXepe3fJoOLbxZRm1";

const KIM_BOOKS = [
  // ── done 도서 ─────────────────────────────────────────────────────────────
  {
    id: "1000152",
    title: "채식주의자",
    author: "한강",
    genre: "소설",
    totalPage: 247,
    status: "done",
    currentPage: 247,
    rating: 5,
    lastReadDate: "2026-01-20",
    _startDate: "2026-01-05",
    _endDate: "2026-01-20",
  },
  {
    id: "318933239",
    title: "아몬드",
    author: "손원평",
    genre: "소설",
    totalPage: 264,
    status: "done",
    currentPage: 264,
    rating: 4,
    lastReadDate: "2026-01-28",
    _startDate: "2026-01-14",
    _endDate: "2026-01-28",
  },
  {
    id: "314240466",
    title: "사피엔스",
    author: "유발하라리",
    genre: "인문",
    totalPage: 636,
    status: "done",
    currentPage: 636,
    rating: 5,
    lastReadDate: "2026-02-10",
    _startDate: "2026-01-20",
    _endDate: "2026-02-10",
  },
  {
    id: "172483101",
    title: "죽고싶지만떡볶이는먹고싶어",
    author: "백세희",
    genre: "에세이",
    totalPage: 208,
    status: "done",
    currentPage: 208,
    rating: 4,
    lastReadDate: "2026-02-20",
    _startDate: "2026-02-08",
    _endDate: "2026-02-20",
  },
  {
    id: "94764887",
    title: "82년생 김지영",
    author: "조남주",
    genre: "소설",
    totalPage: 190,
    status: "done",
    currentPage: 190,
    rating: 5,
    lastReadDate: "2026-03-05",
    _startDate: "2026-02-23",
    _endDate: "2026-03-05",
  },
  {
    id: "170482558",
    title: "이기적 유전자",
    author: "리처드 도킨스",
    genre: "인문",
    totalPage: 544,
    status: "done",
    currentPage: 544,
    rating: 4,
    lastReadDate: "2026-03-15",
    _startDate: "2026-02-25",
    _endDate: "2026-03-15",
  },
  {
    id: "269428498",
    title: "불편한 편의점",
    author: "김호연",
    genre: "소설",
    totalPage: 284,
    status: "done",
    currentPage: 284,
    rating: 4,
    lastReadDate: "2026-03-25",
    _startDate: "2026-03-13",
    _endDate: "2026-03-25",
  },
  {
    id: "278770576",
    title: "작별하지 않는다",
    author: "한강",
    genre: "소설",
    totalPage: 320,
    status: "done",
    currentPage: 320,
    rating: 5,
    lastReadDate: "2026-04-05",
    _startDate: "2026-03-24",
    _endDate: "2026-04-05",
  },
  {
    id: "168829946",
    title: "아주 작은 습관의 힘",
    author: "제임스 클리어",
    genre: "자기계발",
    totalPage: 344,
    status: "done",
    currentPage: 344,
    rating: 5,
    lastReadDate: "2026-04-20",
    _startDate: "2026-04-09",
    _endDate: "2026-04-20",
  },
  // ── want 도서 ────────────────────────────────────────────────────────────
  {
    id: "143220344",
    title: "흰",
    author: "한강",
    genre: "소설",
    totalPage: 128,
    status: "want",
    currentPage: 0,
    rating: 0,
    lastReadDate: null,
    _checkedDates: [],
  },
  {
    id: "146587998",
    title: "경애의 마음",
    author: "김금희",
    genre: "소설",
    totalPage: 288,
    status: "want",
    currentPage: 0,
    rating: 0,
    lastReadDate: null,
    _checkedDates: [],
  },
  {
    id: "260084",
    title: "데미안",
    author: "헤르만 헤세",
    genre: "소설",
    totalPage: 215,
    status: "want",
    currentPage: 0,
    rating: 0,
    lastReadDate: null,
    _checkedDates: [],
  },
  // ── reading 도서 ──────────────────────────────────────────────────────────
  {
    id: "294963999",
    title: "파친코",
    author: "이민진",
    genre: "소설",
    totalPage: 560,
    status: "reading",
    currentPage: 230,
    rating: 0,
    lastReadDate: "2026-04-25",
    // Apr 6~25 중 18일 — Apr 11, Apr 18 skip → 연속 구간: 6·7·7일
    _checkedDates: [
      "2026-04-06",
      "2026-04-07",
      "2026-04-08",
      "2026-04-09",
      "2026-04-10",
      "2026-04-12",
      "2026-04-13",
      "2026-04-14",
      "2026-04-15",
      "2026-04-16",
      "2026-04-17",
      "2026-04-19",
      "2026-04-20",
      "2026-04-21",
      "2026-04-22",
      "2026-04-23",
      "2026-04-24",
      "2026-04-25",
    ],
  },
  {
    id: "316294397",
    title: "총, 균, 쇠",
    author: "재레드 다이아몬드",
    genre: "인문",
    totalPage: 752,
    status: "reading",
    currentPage: 180,
    rating: 0,
    lastReadDate: "2026-04-24",
    // Apr 6~25 중 18일 — Apr 13, Apr 20 skip → 연속 구간: 7·6·5일
    _checkedDates: [
      "2026-04-06",
      "2026-04-07",
      "2026-04-08",
      "2026-04-09",
      "2026-04-10",
      "2026-04-11",
      "2026-04-12",
      "2026-04-14",
      "2026-04-15",
      "2026-04-16",
      "2026-04-17",
      "2026-04-18",
      "2026-04-19",
      "2026-04-21",
      "2026-04-22",
      "2026-04-23",
      "2026-04-24",
      "2026-04-25",
    ],
  },
  {
    id: "29549721",
    title: "원씽",
    author: "게리 켈러",
    genre: "자기계발",
    totalPage: 272,
    status: "reading",
    currentPage: 90,
    rating: 0,
    lastReadDate: "2026-04-23",
    // Apr 6~25 중 18일 — Apr 9, Apr 16 skip → 연속 구간: 3·6·9일
    _checkedDates: [
      "2026-04-06",
      "2026-04-07",
      "2026-04-08",
      "2026-04-10",
      "2026-04-11",
      "2026-04-12",
      "2026-04-13",
      "2026-04-14",
      "2026-04-15",
      "2026-04-17",
      "2026-04-18",
      "2026-04-19",
      "2026-04-20",
      "2026-04-21",
      "2026-04-22",
      "2026-04-23",
      "2026-04-24",
      "2026-04-25",
    ],
  },
];

function pickRandomDates(startStr, endStr, count) {
  const DAY_MS = 86_400_000;
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  const total = Math.round((end - start) / DAY_MS) + 1;

  const all = Array.from({ length: total }, (_, i) =>
    new Date(start + i * DAY_MS).toISOString().slice(0, 10)
  );

  const others = all.filter(d => d !== endStr).sort(() => Math.random() - 0.5);
  const selected = others.slice(0, Math.max(count - 1, 0));
  selected.push(endStr);
  return selected.sort();
}

async function seedKimShelf(force = false) {
  console.log("\n=== 3단계: 김독서 shelf 도서 추가 ===\n");

  for (const book of KIM_BOOKS) {
    const { _startDate, _endDate, _checkedDates, ...fields } = book;

    const ref = db
      .collection("users")
      .doc(KIM_UID)
      .collection("shelf")
      .doc(book.id);
    const snap = await ref.get();

    if (!force && snap.exists) {
      console.log(`[SKIP]   shelf/${book.id} (${book.title}) — 이미 존재`);
      continue;
    }

    const checkedDates =
      _checkedDates ?? pickRandomDates(_startDate, _endDate, 10);
    const thumbnail = await fetchAladinCover(book.id);

    await ref.set({ ...fields, thumbnail, checkedDates, memo: "" });
    console.log(
      `[CREATE] shelf/${book.id} (${book.title}) — checkedDates: ${checkedDates.join(", ")}`
    );
  }
}

// ── 4단계: 박문학 shelf 도서 추가 ────────────────────────────────────────────

const PARK_UID = "LmOvpryRYLP3Th314zl69tQQm1j2";

const PARK_BOOKS = [
  // ── done 도서 ─────────────────────────────────────────────────────────────
  {
    id: "294963999",
    title: "파친코",
    author: "이민진",
    genre: "소설",
    totalPage: 560,
    status: "done",
    currentPage: 560,
    rating: 5,
    lastReadDate: "2026-02-15",
    _startDate: "2026-02-04",
    _endDate: "2026-02-15",
  },
  {
    id: "168829946",
    title: "아주 작은 습관의 힘",
    author: "제임스 클리어",
    genre: "자기계발",
    totalPage: 344,
    status: "done",
    currentPage: 344,
    rating: 4,
    lastReadDate: "2026-03-01",
    _startDate: "2026-02-18",
    _endDate: "2026-03-01",
  },
  {
    id: "269428498",
    title: "불편한 편의점",
    author: "김호연",
    genre: "소설",
    totalPage: 284,
    status: "done",
    currentPage: 284,
    rating: 3,
    lastReadDate: "2026-04-10",
    _startDate: "2026-03-30",
    _endDate: "2026-04-10",
  },
  {
    id: "29549721",
    title: "원씽",
    author: "게리 켈러",
    genre: "자기계발",
    totalPage: 272,
    status: "done",
    currentPage: 272,
    rating: 4,
    lastReadDate: "2026-04-22",
    _startDate: "2026-04-11",
    _endDate: "2026-04-22",
  },
  // ── reading 도서 ──────────────────────────────────────────────────────────
  {
    id: "1000152",
    title: "채식주의자",
    author: "한강",
    genre: "소설",
    totalPage: 247,
    status: "reading",
    currentPage: 120,
    rating: 0,
    lastReadDate: "2026-04-25",
    _startDate: "2026-04-11",
    _endDate: "2026-04-25",
  },
  {
    id: "314240466",
    title: "사피엔스",
    author: "유발하라리",
    genre: "인문",
    totalPage: 636,
    status: "reading",
    currentPage: 200,
    rating: 0,
    lastReadDate: "2026-04-24",
    _startDate: "2026-04-11",
    _endDate: "2026-04-25",
  },
  // ── want 도서 ─────────────────────────────────────────────────────────────
  {
    id: "94764887",
    title: "82년생 김지영",
    author: "조남주",
    genre: "소설",
    totalPage: 190,
    status: "want",
    currentPage: 0,
    rating: 0,
    lastReadDate: null,
    _checkedDates: [],
  },
  {
    id: "260084",
    title: "데미안",
    author: "헤르만 헤세",
    genre: "소설",
    totalPage: 215,
    status: "want",
    currentPage: 0,
    rating: 0,
    lastReadDate: null,
    _checkedDates: [],
  },
  {
    id: "170482558",
    title: "이기적 유전자",
    author: "리처드 도킨스",
    genre: "인문",
    totalPage: 544,
    status: "want",
    currentPage: 0,
    rating: 0,
    lastReadDate: null,
    _checkedDates: [],
  },
];

async function seedParkShelf(force = false) {
  console.log("\n=== 4단계: 박문학 shelf 도서 추가 ===\n");

  for (const book of PARK_BOOKS) {
    const { _startDate, _endDate, _checkedDates, ...fields } = book;

    const ref = db
      .collection("users")
      .doc(PARK_UID)
      .collection("shelf")
      .doc(book.id);
    const snap = await ref.get();

    if (!force && snap.exists) {
      console.log(`[SKIP]   shelf/${book.id} (${book.title}) — 이미 존재`);
      continue;
    }

    const checkedDates =
      _checkedDates ?? pickRandomDates(_startDate, _endDate, 10);
    const thumbnail = await fetchAladinCover(book.id);

    await ref.set({ ...fields, thumbnail, checkedDates, memo: "" });
    console.log(
      `[CREATE] shelf/${book.id} (${book.title}) — checkedDates: ${checkedDates.join(", ")}`
    );
  }
}

// ── 5단계: 이철학 shelf 도서 추가 ────────────────────────────────────────────

const LEE_UID = "5kf1UAvpWUbUdSluRJzhupBEWXf2";

const LEE_BOOKS = [
  // ── done 도서 ─────────────────────────────────────────────────────────────
  {
    id: "260084",
    title: "데미안",
    author: "헤르만 헤세",
    genre: "소설",
    totalPage: 215,
    status: "done",
    currentPage: 215,
    rating: 5,
    lastReadDate: "2026-02-20",
    _startDate: "2026-02-08",
    _endDate: "2026-02-20",
  },
  {
    id: "314240466",
    title: "사피엔스",
    author: "유발하라리",
    genre: "인문",
    totalPage: 636,
    status: "done",
    currentPage: 636,
    rating: 5,
    lastReadDate: "2026-03-10",
    _startDate: "2026-02-26",
    _endDate: "2026-03-10",
  },
  {
    id: "172483101",
    title: "죽고싶지만떡볶이는먹고싶어",
    author: "백세희",
    genre: "에세이",
    totalPage: 208,
    status: "done",
    currentPage: 208,
    rating: 4,
    lastReadDate: "2026-03-25",
    _startDate: "2026-03-13",
    _endDate: "2026-03-25",
  },
  {
    id: "170482558",
    title: "이기적 유전자",
    author: "리처드 도킨스",
    genre: "인문",
    totalPage: 544,
    status: "done",
    currentPage: 544,
    rating: 5,
    lastReadDate: "2026-04-20",
    _startDate: "2026-04-08",
    _endDate: "2026-04-20",
  },
  // ── reading 도서 ──────────────────────────────────────────────────────────
  {
    id: "316294397",
    title: "총, 균, 쇠",
    author: "재레드 다이아몬드",
    genre: "인문",
    totalPage: 752,
    status: "reading",
    currentPage: 300,
    rating: 0,
    lastReadDate: "2026-04-25",
    _startDate: "2026-04-11",
    _endDate: "2026-04-25",
  },
  // ── want 도서 ─────────────────────────────────────────────────────────────
  {
    id: "318933239",
    title: "아몬드",
    author: "손원평",
    genre: "소설",
    totalPage: 264,
    status: "want",
    currentPage: 0,
    rating: 0,
    lastReadDate: null,
    _checkedDates: [],
  },
  {
    id: "278770576",
    title: "작별하지 않는다",
    author: "한강",
    genre: "소설",
    totalPage: 320,
    status: "want",
    currentPage: 0,
    rating: 0,
    lastReadDate: null,
    _checkedDates: [],
  },
  {
    id: "168829946",
    title: "아주 작은 습관의 힘",
    author: "제임스 클리어",
    genre: "자기계발",
    totalPage: 344,
    status: "want",
    currentPage: 0,
    rating: 0,
    lastReadDate: null,
    _checkedDates: [],
  },
];

async function seedLeeShelf(force = false) {
  console.log("\n=== 5단계: 이철학 shelf 도서 추가 ===\n");

  for (const book of LEE_BOOKS) {
    const { _startDate, _endDate, _checkedDates, ...fields } = book;

    const ref = db
      .collection("users")
      .doc(LEE_UID)
      .collection("shelf")
      .doc(book.id);
    const snap = await ref.get();

    if (!force && snap.exists) {
      console.log(`[SKIP]   shelf/${book.id} (${book.title}) — 이미 존재`);
      continue;
    }

    const checkedDates =
      _checkedDates ?? pickRandomDates(_startDate, _endDate, 10);
    const thumbnail = await fetchAladinCover(book.id);

    await ref.set({ ...fields, thumbnail, checkedDates, memo: "" });
    console.log(
      `[CREATE] shelf/${book.id} (${book.title}) — checkedDates: ${checkedDates.join(", ")}`
    );
  }
}

// ── shelf 초기화 헬퍼 ──────────────────────────────────────────────────────

async function deleteShelf(uid, name) {
  const snap = await db.collection("users").doc(uid).collection("shelf").get();
  if (snap.empty) {
    console.log(`[SKIP]   ${name} shelf — 비어있음`);
    return;
  }
  const batch = db.batch();
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  console.log(`[DELETE] ${name} shelf — ${snap.size}개 삭제`);
}

// ── 6단계: board 컬렉션 seed-user 문서 삭제 + 실제 uid 게시글 5개 추가 ──────

const SEED_UIDS = ["seed-user-1", "seed-user-2", "seed-user-3"];

const BOARD_POSTS = [
  {
    id: "board-kim-vegemitarian-review",
    title: "한강의 채식주의자를 읽고",
    content:
      '처음에는 단순한 채식 이야기인 줄 알았는데, 읽으면 읽을수록 인간의 욕망과 폭력성, 그리고 그 사이에서 무너져가는 한 여성의 이야기였어요. 특히 마지막 장 "나무 불꽃"은 몇 번을 다시 읽었습니다. 한강 작가의 문장은 짧지만 여운이 굉장히 길게 남는 것 같아요. 강추드립니다!',
    category: "독후감",
    authorUid: "IcifW06lDnUeXepe3fJoOLbxZRm1",
    authorName: "김독서",
    likes: ["LmOvpryRYLP3Th314zl69tQQm1j2"],
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-01-22")),
  },
  {
    id: "board-kim-reading-streak",
    title: "올해 목표: 독서 스트릭 100일 도전 중!",
    content:
      "1월부터 매일 책을 읽기 시작한 지 벌써 3개월이 넘었어요. 중간에 이틀 빠진 적 있지만 그래도 꽤 잘 지키고 있는 것 같아요. 요즘은 잠들기 전 30분 독서가 습관이 됐습니다. 여러분은 어떤 방식으로 독서 루틴을 만드셨나요?",
    category: "자유",
    authorUid: "IcifW06lDnUeXepe3fJoOLbxZRm1",
    authorName: "김독서",
    likes: ["5kf1UAvpWUbUdSluRJzhupBEWXf2", "LmOvpryRYLP3Th314zl69tQQm1j2"],
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-02-05")),
  },
  {
    id: "board-park-pachinko-review",
    title: "파친코 — 4대에 걸친 가족의 서사",
    content:
      '이민진 작가의 파친코는 일제강점기부터 1980년대까지 재일 한국인 가족 4대의 이야기를 담고 있습니다. "역사가 우리를 망쳐도 그래도 상관없다"는 첫 문장이 계속 머릿속에 맴돌아요. 선자라는 캐릭터가 너무 생생해서 마지막 장을 닫고 나서 한참을 멍하니 있었습니다. 꼭 읽어보세요.',
    category: "독후감",
    authorUid: "LmOvpryRYLP3Th314zl69tQQm1j2",
    authorName: "박문학",
    likes: ["IcifW06lDnUeXepe3fJoOLbxZRm1", "5kf1UAvpWUbUdSluRJzhupBEWXf2"],
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-02-17")),
  },
  {
    id: "board-park-book-recommend-question",
    title: "자기계발서 추천해주세요 — 실천 위주로!",
    content:
      "아주 작은 습관의 힘 읽고 정말 삶이 달라진 것 같아서 비슷한 책을 찾고 있어요. 이론보다는 바로 실천할 수 있는 내용 위주의 자기계발서가 있으면 추천 부탁드립니다. 원씽은 이미 읽었고요, 다음 책 고르는 중입니다!",
    category: "질문",
    authorUid: "LmOvpryRYLP3Th314zl69tQQm1j2",
    authorName: "박문학",
    likes: ["IcifW06lDnUeXepe3fJoOLbxZRm1"],
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-04-23")),
  },
  {
    id: "board-lee-demian-review",
    title: "데미안, 20대에 다시 읽어야 할 책",
    content:
      '고등학교 때 읽었을 때는 그냥 성장소설이구나 싶었는데, 지금 다시 읽으니 완전히 다르게 느껴졌어요. "새는 알에서 나오려고 투쟁한다. 알은 세계다." 이 문장 하나로 책 전체가 정리되는 것 같았습니다. 철학적으로 자아 정체성에 대해 고민하는 분들에게 꼭 권해드리고 싶은 책이에요.',
    category: "독후감",
    authorUid: "5kf1UAvpWUbUdSluRJzhupBEWXf2",
    authorName: "이철학",
    likes: ["IcifW06lDnUeXepe3fJoOLbxZRm1", "LmOvpryRYLP3Th314zl69tQQm1j2"],
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-02-22")),
  },
];

async function deleteSeedBoardPosts() {
  console.log("\n=== 6단계-A: seed-user board 문서 삭제 ===\n");
  const boardRef = db.collection("board");
  let deletedCount = 0;

  for (const seedUid of SEED_UIDS) {
    const snap = await boardRef.where("authorUid", "==", seedUid).get();
    if (snap.empty) {
      console.log(`[SKIP]   authorUid=${seedUid} — board 문서 없음`);
      continue;
    }
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log(`[DELETE] authorUid=${seedUid} — ${snap.size}개 삭제`);
    deletedCount += snap.size;
  }
  console.log(`\n총 ${deletedCount}개 삭제 완료`);
}

async function seedBoardPosts() {
  console.log("\n=== 6단계-B: 실제 uid board 게시글 5개 추가 ===\n");

  for (const post of BOARD_POSTS) {
    const { id, ...fields } = post;
    const ref = db.collection("board").doc(id);
    const snap = await ref.get();

    if (snap.exists) {
      console.log(`[SKIP]   board/${id} (${fields.title}) — 이미 존재`);
      continue;
    }

    await ref.set(fields);
    console.log(
      `[CREATE] board/${id} (${fields.authorName}) — "${fields.title}"`
    );
  }
}

// ── 7단계: points/global 문서 생성(덮어쓰기) ────────────────────────────────

async function seedPoints() {
  console.log("\n=== 7단계: points/global 문서 생성 ===\n");

  const ref = db.collection("points").doc("global");
  await ref.set({
    totalDonated: 3240,
    goalAmount: 10000,
    donations: {
      bookSociety: 1200,
      childrenFoundation: 1140,
      disabledLibrary: 900,
    },
    participantCount: 87,
    updatedAt: admin.firestore.Timestamp.fromDate(new Date("2026-04-28")),
  });
  console.log("[SET]    points/global — 완료");
}

// ── 8단계: meetings 컬렉션 전체 삭제 + 새 모임 3개 추가 ──────────────────────

const MEETINGS = [
  {
    id: "seed-meeting-hanggang",
    title: "한강 소설 완독 챌린지",
    description:
      "한강 작가의 소설을 함께 읽고 이야기 나누는 모임입니다. 매주 한 작품씩 읽고 감상을 공유해요.",
    currentBook: "채식주의자",
    pageRange: "p.1 ~ 247",
    deadline: "2026-05-15",
    maxMembers: 10,
    genre: "소설",
    hostUid: "IcifW06lDnUeXepe3fJoOLbxZRm1",
    hostName: "김독서",
    members: [
      "IcifW06lDnUeXepe3fJoOLbxZRm1",
      "LmOvpryRYLP3Th314zl69tQQm1j2",
      "5kf1UAvpWUbUdSluRJzhupBEWXf2",
    ],
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-04-20")),
  },
  {
    id: "seed-meeting-humanities",
    title: "인문학 탐구 독서 모임",
    description:
      "사피엔스, 총균쇠 등 인문·역사 분야의 묵직한 책을 함께 읽습니다. 깊이 있는 토론을 좋아하시는 분 환영해요!",
    currentBook: "총, 균, 쇠",
    pageRange: "p.1 ~ 200",
    deadline: "2026-05-20",
    maxMembers: 8,
    genre: "인문",
    hostUid: "5kf1UAvpWUbUdSluRJzhupBEWXf2",
    hostName: "이철학",
    members: ["5kf1UAvpWUbUdSluRJzhupBEWXf2", "IcifW06lDnUeXepe3fJoOLbxZRm1"],
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-04-22")),
  },
  {
    id: "seed-meeting-selfdev",
    title: "자기계발 함께 읽기",
    description:
      "아주 작은 습관의 힘, 원씽 등 실천 중심 자기계발서를 같이 읽고 실제 삶에 적용하는 인사이트를 나눠요.",
    currentBook: "아주 작은 습관의 힘",
    pageRange: "p.1 ~ 180",
    deadline: "2026-05-25",
    maxMembers: 12,
    genre: "자기계발",
    hostUid: "LmOvpryRYLP3Th314zl69tQQm1j2",
    hostName: "박문학",
    members: ["LmOvpryRYLP3Th314zl69tQQm1j2", "IcifW06lDnUeXepe3fJoOLbxZRm1"],
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-04-25")),
  },
];

async function cleanMeetings() {
  console.log("\n=== 8단계-A: meetings 컬렉션 전체 삭제 ===\n");
  const snap = await db.collection("meetings").get();
  if (snap.empty) {
    console.log("[SKIP]   meetings 문서 없음");
    return;
  }
  const batch = db.batch();
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  console.log(`[DELETE] ${snap.size}개 삭제 완료`);
}

async function seedMeetings() {
  console.log("\n=== 8단계-B: 새 모임 3개 추가 ===\n");
  for (const meeting of MEETINGS) {
    const { id, ...fields } = meeting;
    await db.collection("meetings").doc(id).set(fields);
    console.log(
      `[CREATE] meetings/${id} — "${fields.title}" (${fields.members.length}명 참여)`
    );
  }
}

// ── 9단계: meetings 댓글 시드 ────────────────────────────────────────────────

const MEETING_COMMENTS = [
  {
    meetingId: "seed-meeting-hanggang",
    comments: [
      {
        id: "comment-hanggang-1",
        content: "채식주의자 정말 강렬하네요. 영혜 캐릭터가 너무 인상적이었어요!",
        authorUid: "IcifW06lDnUeXepe3fJoOLbxZRm1",
        authorName: "김독서",
        createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-04-21")),
      },
      {
        id: "comment-hanggang-2",
        content: "저도 읽고 한동안 멍했어요. 다음 작품도 기대됩니다 📚",
        authorUid: "LmOvpryRYLP3Th314zl69tQQm1j2",
        authorName: "박문학",
        createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-04-22")),
      },
      {
        id: "comment-hanggang-3",
        content: "한강 작가 노벨상 받을 만 하다는 걸 다시 느꼈어요",
        authorUid: "5kf1UAvpWUbUdSluRJzhupBEWXf2",
        authorName: "이철학",
        createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-04-23")),
      },
    ],
  },
  {
    meetingId: "seed-meeting-humanities",
    comments: [
      {
        id: "comment-humanities-1",
        content: "총균쇠 분량이 어마어마하네요.. 같이 읽으니까 버틸 수 있어요 😅",
        authorUid: "5kf1UAvpWUbUdSluRJzhupBEWXf2",
        authorName: "이철학",
        createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-04-23")),
      },
      {
        id: "comment-humanities-2",
        content: "재레드 다이아몬드의 관점이 너무 흥미로워요. 지리가 역사를 결정한다니!",
        authorUid: "IcifW06lDnUeXepe3fJoOLbxZRm1",
        authorName: "김독서",
        createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-04-24")),
      },
    ],
  },
  {
    meetingId: "seed-meeting-selfdev",
    comments: [
      {
        id: "comment-selfdev-1",
        content: "아주 작은 습관의 힘 읽고 나서 진짜로 아침 루틴 만들었어요!",
        authorUid: "LmOvpryRYLP3Th314zl69tQQm1j2",
        authorName: "박문학",
        createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-04-26")),
      },
      {
        id: "comment-selfdev-2",
        content: "저도 원씽 읽고 우선순위 정하는 법이 완전히 바뀌었어요 💪",
        authorUid: "IcifW06lDnUeXepe3fJoOLbxZRm1",
        authorName: "김독서",
        createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-04-26")),
      },
      {
        id: "comment-selfdev-3",
        content: "실천 위주라서 읽고 바로 적용할 수 있는 게 좋아요",
        authorUid: "5kf1UAvpWUbUdSluRJzhupBEWXf2",
        authorName: "이철학",
        createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-04-27")),
      },
    ],
  },
];

async function seedMeetingComments() {
  console.log("\n=== 9단계: meetings 댓글 시드 ===\n");

  for (const { meetingId, comments } of MEETING_COMMENTS) {
    for (const { id, ...fields } of comments) {
      const ref = db.collection("meetings").doc(meetingId).collection("comments").doc(id);
      const snap = await ref.get();
      if (snap.exists) {
        console.log(`[SKIP]   meetings/${meetingId}/comments/${id} — 이미 존재`);
        continue;
      }
      await ref.set(fields);
      console.log(`[CREATE] meetings/${meetingId}/comments/${id} (${fields.authorName})`);
    }
  }
}

// ── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  if (isResetShelf) {
    console.log("=== --reset-shelf: 기존 shelf 삭제 후 재시드 ===\n");
    await deleteShelf(KIM_UID, "김독서");
    await deleteShelf(PARK_UID, "박문학");
    await deleteShelf(LEE_UID, "이철학");
    await seedKimShelf(true);
    await seedParkShelf(true);
    await seedLeeShelf(true);
    console.log("\n완료!");
    process.exit(0);
  }

  // 1단계
  console.log("=== 1단계: Auth 유저 생성 ===\n");
  const uids = [];
  for (const user of USERS) {
    const uid = await getOrCreateUser(user);
    uids.push({ nickname: user.nickname, email: user.email, uid });
  }

  console.log("\n=== 생성된 UID 목록 ===");
  uids.forEach(({ nickname, email, uid }) => {
    console.log(`${nickname} (${email})\n  uid: ${uid}`);
  });

  // 2단계
  console.log("\n=== 2단계: Firestore users 문서 생성 ===\n");
  for (const profile of USER_PROFILES) {
    await seedUserProfile(profile);
  }

  // 3단계
  await seedKimShelf();

  // 4단계
  await seedParkShelf();

  // 5단계
  await seedLeeShelf();

  // 6단계
  await deleteSeedBoardPosts();
  await seedBoardPosts();

  // 7단계
  await seedPoints();

  // 8단계
  await cleanMeetings();
  await seedMeetings();

  // 9단계
  await seedMeetingComments();

  console.log("\n완료!");
  process.exit(0);
}

main().catch(err => {
  console.error("오류 발생:", err);
  process.exit(1);
});
