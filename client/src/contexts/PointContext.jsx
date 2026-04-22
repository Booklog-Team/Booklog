// Booklog — PointContext
// PRD.md §9 포인트 & 기부 시스템
//
// 역할
//   - points/global 실시간 구독 (onSnapshot) → 여러 유저 동시 적립 반영
//   - addPoint(type) : Firestore 트랜잭션으로 유저 포인트 + 글로벌 집계 원자 업데이트
//   - canEarnToday(type) : 하루 1회 제한 체크 (lastPointDates.{type} 기반)
//
// 하루 1회 제한 구조
//   users/{uid}.lastPointDates: { reading_check: "2026-04-22", memo: "2026-04-22", ... }
//   — 활동 유형별로 독립적으로 추적하여 각자 하루 1회 제한 적용

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  doc, onSnapshot, runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

// ─── 활동 유형별 포인트 (PRD §9) ──────────────────────────
export const POINT_VALUES = {
  reading_check:  10,   // 오늘 독서 체크
  memo:            5,   // 메모 작성
  meeting_post:    5,   // 모임 게시글
  board_post:      3,   // 자유게시판 글
};

const DEFAULT_GLOBAL = { totalDonated: 0, goalAmount: 100_000, updatedAt: null };

const PointContext = createContext(undefined);

// ─── PointProvider ────────────────────────────────────────
export function PointProvider({ children }) {
  const { user, profile, refreshProfile } = useAuth();

  const [globalData, setGlobalData]       = useState(DEFAULT_GLOBAL);
  const [globalLoading, setGlobalLoading] = useState(true);

  // points/global 실시간 구독
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'points', 'global'),
      snap => {
        setGlobalData(snap.exists() ? snap.data() : DEFAULT_GLOBAL);
        setGlobalLoading(false);
      },
      err => {
        console.error('[PointContext] points/global 구독 실패:', err);
        setGlobalLoading(false);
      }
    );
    return () => unsub();
  }, []);

  /**
   * 오늘 해당 활동 포인트를 받을 수 있는지 확인
   * @param {'reading_check'|'memo'|'meeting_post'|'board_post'} type
   */
  const canEarnToday = useCallback((type) => {
    if (!profile) return false;
    const today = new Date().toISOString().slice(0, 10);
    const lastDates = profile.lastPointDates || {};
    return lastDates[type] !== today;
  }, [profile]);

  /**
   * 포인트 적립
   * - Firestore 트랜잭션으로 users/{uid} + points/global 원자 업데이트
   * - 하루 1회 제한: lastPointDates.{type} 비교
   * @param {'reading_check'|'memo'|'meeting_post'|'board_post'} type
   * @returns {{ awarded: number, type: string } | { alreadyEarned: true, type: string }}
   */
  const addPoint = useCallback(async (type) => {
    if (!user) throw new Error('로그인이 필요합니다.');

    const pts = POINT_VALUES[type];
    if (!pts) throw new Error(`알 수 없는 포인트 타입: ${type}`);

    const today      = new Date().toISOString().slice(0, 10);
    const lastDates  = profile?.lastPointDates || {};

    // 하루 1회 제한 확인
    if (lastDates[type] === today) {
      return { alreadyEarned: true, type };
    }

    const userRef   = doc(db, 'users', user.uid);
    const globalRef = doc(db, 'points', 'global');

    await runTransaction(db, async (tx) => {
      const [userSnap, gSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(globalRef),
      ]);

      const currentPts = userSnap.exists() ? (userSnap.data().totalPoints || 0) : 0;

      // 유저 포인트 업데이트
      tx.update(userRef, {
        totalPoints:                      currentPts + pts,
        lastPointDate:                    today,            // 마지막 적립일 (단순 참조용)
        [`lastPointDates.${type}`]:       today,            // 활동별 마지막 적립일
      });

      // 글로벌 기부 집계 업서트
      if (gSnap.exists()) {
        tx.update(globalRef, {
          totalDonated: (gSnap.data().totalDonated || 0) + pts,
          updatedAt:    serverTimestamp(),
        });
      } else {
        tx.set(globalRef, {
          totalDonated: pts,
          goalAmount:   100_000,
          updatedAt:    serverTimestamp(),
        });
      }
    });

    // AuthContext 프로필 갱신 (totalPoints, lastPointDates 반영)
    await refreshProfile();

    return { awarded: pts, type };
  }, [user, profile, refreshProfile]);

  const value = {
    /** 내 보유 포인트 */
    myPoints:       profile?.totalPoints    ?? 0,
    /** 활동별 마지막 적립일 맵 */
    lastPointDates: profile?.lastPointDates ?? {},
    /** points/global 문서 데이터 */
    globalData,
    globalLoading,
    /** 오늘 해당 활동 포인트 적립 가능 여부 */
    canEarnToday,
    /** 포인트 적립 함수 */
    addPoint,
  };

  return <PointContext.Provider value={value}>{children}</PointContext.Provider>;
}

/**
 * usePoint 커스텀 훅
 * PointProvider 하위에서만 사용 가능
 */
export function usePoint() {
  const ctx = useContext(PointContext);
  if (ctx === undefined) {
    throw new Error('usePoint는 PointProvider 하위에서 사용해야 합니다.');
  }
  return ctx;
}

export default PointContext;
