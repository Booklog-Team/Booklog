// Booklog — Firebase 인증 함수
// PRD.md §8 Auth 페이지 기능 명세 참조
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

const googleProvider = new GoogleAuthProvider();

/**
 * Firestore에 users/{uid} 문서가 없으면 초기 생성
 * @param {import('firebase/auth').User} user
 * @param {string} [nickname]
 */
async function createUserDocIfNotExists(user, nickname) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      nickname: nickname || user.displayName || user.email.split('@')[0],
      email: user.email,
      genres: [],
      isOnboarded: false,
      totalPoints: 0,
      lastPointDate: null,
      createdAt: serverTimestamp(),
    });
  }
}

/**
 * 이메일/비밀번호 회원가입
 * @param {string} email
 * @param {string} password
 * @param {string} nickname
 */
export async function registerWithEmail(email, password, nickname) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  // Firebase Auth displayName 업데이트
  await updateProfile(credential.user, { displayName: nickname });
  // Firestore 유저 문서 생성
  await createUserDocIfNotExists(credential.user, nickname);
  return credential.user;
}

/**
 * 이메일/비밀번호 로그인
 * @param {string} email
 * @param {string} password
 */
export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Google 소셜 로그인 (Popup)
 */
export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  // 첫 소셜 로그인 시 Firestore 문서 생성
  await createUserDocIfNotExists(credential.user);
  return credential.user;
}

/**
 * 로그아웃
 */
export async function logout() {
  await signOut(auth);
}
