// scripts/seedFirestore.cjs
// 실행: node scripts/seedFirestore.cjs
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth  = admin.auth();
const db    = admin.firestore();

// ── 1단계: Auth 유저 생성 ────────────────────────────────────────────────────

const USERS = [
  { email: 'booklog1234@booklog.com', password: 'booklog1234', nickname: '김독서' },
  { email: 'reader2@booklog.com',     password: 'booklog123',  nickname: '박문학' },
  { email: 'reader3@booklog.com',     password: 'booklog123',  nickname: '이철학' },
];

async function getOrCreateUser({ email, password, nickname }) {
  try {
    const existing = await auth.getUserByEmail(email);
    console.log(`[SKIP]   ${email} — 이미 존재 (uid: ${existing.uid})`);
    return existing.uid;
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
  }

  const created = await auth.createUser({ email, password, displayName: nickname });
  console.log(`[CREATE] ${email} — 생성 완료 (uid: ${created.uid})`);
  return created.uid;
}

// ── 2단계: Firestore users/{uid} 문서 생성 ──────────────────────────────────

const USER_PROFILES = [
  {
    uid:      'IcifW06lDnUeXepe3fJoOLbxZRm1',
    nickname: '김독서',
    email:    'booklog1234@booklog.com',
    genres:   ['소설', '인문', '에세이'],
    isOnboarded: true,
    totalPoints: 1250,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2026-01-15')),
  },
  {
    uid:      'LmOvpryRYLP3Th314zl69tQQm1j2',
    nickname: '박문학',
    email:    'reader2@booklog.com',
    genres:   ['소설', '자기계발', '역사'],
    isOnboarded: true,
    totalPoints: 870,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2026-02-01')),
  },
  {
    uid:      '5kf1UAvpWUbUdSluRJzhupBEWXf2',
    nickname: '이철학',
    email:    'reader3@booklog.com',
    genres:   ['인문', '철학', '에세이'],
    isOnboarded: true,
    totalPoints: 540,
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2026-03-01')),
  },
];

async function seedUserProfile({ uid, ...data }) {
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    console.log(`[SKIP]   users/${uid} (${data.nickname}) — 이미 존재`);
    return;
  }
  await ref.set(data);
  console.log(`[CREATE] users/${uid} (${data.nickname}) — 생성 완료`);
}

// ── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  // 1단계
  console.log('=== 1단계: Auth 유저 생성 ===\n');
  const uids = [];
  for (const user of USERS) {
    const uid = await getOrCreateUser(user);
    uids.push({ nickname: user.nickname, email: user.email, uid });
  }

  console.log('\n=== 생성된 UID 목록 ===');
  uids.forEach(({ nickname, email, uid }) => {
    console.log(`${nickname} (${email})\n  uid: ${uid}`);
  });

  // 2단계
  console.log('\n=== 2단계: Firestore users 문서 생성 ===\n');
  for (const profile of USER_PROFILES) {
    await seedUserProfile(profile);
  }

  console.log('\n완료!');
  process.exit(0);
}

main().catch(err => {
  console.error('오류 발생:', err);
  process.exit(1);
});
