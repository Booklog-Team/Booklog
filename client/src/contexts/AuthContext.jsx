// Booklog — AuthContext
// 로그인 상태 전역 관리 (onAuthStateChanged 기반)
// PRD.md §5 라우팅 구조, §12 팀원 역할 분담 참조
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

/**
 * @typedef {Object} AuthContextValue
 * @property {import('firebase/auth').User|null} user      - Firebase Auth 유저 (null = 미인증)
 * @property {Object|null}  profile    - Firestore users/{uid} 문서
 * @property {boolean}      loading    - 초기 인증 상태 확인 중 여부
 * @property {boolean}      isOnboarded - 온보딩 완료 여부
 */

const AuthContext = createContext(undefined);

/**
 * AuthProvider
 * - onAuthStateChanged 로 인증 상태를 구독한다.
 * - 로그인 시 Firestore users/{uid} 프로필도 함께 로드한다.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Firestore에서 유저 프로필 문서 로드
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          setProfile(docSnap.exists() ? docSnap.data() : null);
        } catch (err) {
          console.error('[AuthContext] 프로필 로드 실패:', err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe();
  }, []);

  /** Firestore 프로필 재로드 (온보딩 완료 후 등 수동 갱신 용도) */
  const refreshProfile = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      setProfile(docSnap.exists() ? docSnap.data() : null);
    } catch (err) {
      console.error('[AuthContext] 프로필 재로드 실패:', err);
    }
  };

  const isOnboarded = Boolean(profile?.isOnboarded);

  const value = {
    user,
    profile,
    loading,
    isOnboarded,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth 커스텀 훅
 * AuthProvider 하위에서만 사용 가능
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 하위에서 사용해야 합니다.');
  }
  return context;
}

export default AuthContext;
