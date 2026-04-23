// Booklog — PointContext
// 포인트 시스템 전역 관리 (적립, 기부, 조회)
// PRD.md §9 포인트 & 기부 시스템 상세, §12 팀원 역할 분담 참조
//
// 역할
//   - points/global 실시간 구독 (onSnapshot) → 여러 유저 동시 적립 반영
//   - addPoint(type)     : 트랜잭션으로 유저 포인트 + 글로벌 집계 원자 업데이트
//   - donateTo(id)       : 기부처 선택 → points/global.donations 맵 업데이트
//   - canEarnToday(type) : 하루 1회 제한 체크 (lastPointDates.{type} 기반)

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config"; // 경로 확인 필요 (프로젝트 환경에 맞게 조정: '../firebase/config' 등)
import { useAuth } from "@/contexts/AuthContext";

// ─── 활동 유형별 포인트 (PRD §9) ──────────────────────────
export const POINT_VALUES = {
  reading_check: 10, // 오늘 독서 체크
  memo: 5, // 메모 작성
  meeting_post: 5, // 모임 게시글
  board_post: 3, // 자유게시판 글
};

const DEFAULT_GLOBAL = {
  totalDonated: 0,
  goalAmount: 100_000,
  participantCount: 0,
  donations: {},
  updatedAt: null,
};

const PointContext = createContext(undefined);

// ─── PointProvider ────────────────────────────────────────
export function PointProvider({ children }) {
  const { user, profile, refreshProfile } = useAuth();

  const [globalData, setGlobalData] = useState(DEFAULT_GLOBAL);
  const [globalLoading, setGlobalLoading] = useState(true);

  // points/global 실시간 구독
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "points", "global"),
      snap => {
        setGlobalData(
          snap.exists() ? { ...DEFAULT_GLOBAL, ...snap.data() } : DEFAULT_GLOBAL
        );
        setGlobalLoading(false);
      },
      err => {
        console.error("[PointContext] points/global 구독 실패:", err);
        setGlobalLoading(false);
      }
    );
    return () => unsub();
  }, []);

  /**
   * 오늘 해당 활동 포인트를 받을 수 있는지 확인
   * @param {'reading_check'|'memo'|'meeting_post'|'board_post'} type
   * @returns {boolean}
   */
  const canEarnToday = useCallback(
    type => {
      if (!profile) return false;
      const today = new Date().toISOString().slice(0, 10);
      const lastDates = profile.lastPointDates || {};
      return lastDates[type] !== today;
    },
    [profile]
  );

  /**
   * 포인트 적립
   * - Firestore 트랜잭션으로 users/{uid} + points/global 원자 업데이트
   * - 하루 1회 제한: lastPointDates.{type} 비교
   * - 첫 적립 시 participantCount 증가
   * @param {'reading_check'|'memo'|'meeting_post'|'board_post'} type
   */
  const addPoint = useCallback(
    async type => {
      if (!user) throw new Error("로그인이 필요합니다.");

      const pts = POINT_VALUES[type];
      if (!pts) throw new Error(`알 수 없는 포인트 타입: ${type}`);

      const today = new Date().toISOString().slice(0, 10);
      const lastDates = profile?.lastPointDates || {};

      // 이미 오늘 해당 타입의 포인트를 획득한 경우
      if (lastDates[type] === today) {
        return { alreadyEarned: true, type };
      }

      const userRef = doc(db, "users", user.uid);
      const globalRef = doc(db, "points", "global");

      await runTransaction(db, async tx => {
        const [userSnap, gSnap] = await Promise.all([
          tx.get(userRef),
          tx.get(globalRef),
        ]);

        const currentPts = userSnap.exists()
          ? userSnap.data().totalPoints || 0
          : 0;
        const isFirstEarn = currentPts === 0;

        // 1. 유저 데이터 업데이트
        tx.update(userRef, {
          totalPoints: currentPts + pts,
          lastPointDate: today, // 전체 기준 최신 포인트 획득일
          [`lastPointDates.${type}`]: today, // 타입별 최신 획득일
        });

        // 2. 글로벌 데이터 업데이트
        if (gSnap.exists()) {
          const gData = gSnap.data();
          const update = {
            totalDonated: (gData.totalDonated || 0) + pts,
            updatedAt: serverTimestamp(),
          };
          if (isFirstEarn) {
            update.participantCount = (gData.participantCount || 0) + 1;
          }
          tx.update(globalRef, update);
        } else {
          tx.set(globalRef, {
            totalDonated: pts,
            goalAmount: 100_000,
            participantCount: 1,
            donations: {},
            updatedAt: serverTimestamp(),
          });
        }
      });

      // 트랜잭션 성공 후 AuthContext의 프로필 정보 최신화
      if (typeof refreshProfile === "function") {
        await refreshProfile();
      }

      return { awarded: pts, type };
    },
    [user, profile, refreshProfile]
  );

  /**
   * 기부처 선택
   * - users/{uid}.preferredCharity 업데이트
   * - points/global.donations 맵에서 이전 기부처 포인트 제거, 새 기부처에 추가
   * @param {'reading_foundation'|'childrens_foundation'|'disability_library'} charityId
   */
  const donateTo = useCallback(
    async charityId => {
      if (!user) throw new Error("로그인이 필요합니다.");

      const oldCharity = profile?.preferredCharity;
      if (oldCharity === charityId) return { unchanged: true };

      const myPts = profile?.totalPoints || 0;
      const userRef = doc(db, "users", user.uid);
      const globalRef = doc(db, "points", "global");

      await runTransaction(db, async tx => {
        const gSnap = await tx.get(globalRef);
        const gData = gSnap.exists() ? gSnap.data() : {};
        const donations = { ...(gData.donations || {}) };

        // 이전 기부처에서 내 포인트만큼 차감하고 새 기부처에 가산
        if (oldCharity) {
          donations[oldCharity] = Math.max(
            0,
            (donations[oldCharity] || 0) - myPts
          );
        }
        donations[charityId] = (donations[charityId] || 0) + myPts;

        tx.update(userRef, { preferredCharity: charityId });

        if (gSnap.exists()) {
          tx.update(globalRef, { donations, updatedAt: serverTimestamp() });
        } else {
          tx.set(globalRef, {
            totalDonated: 0,
            goalAmount: 100_000,
            participantCount: 0,
            donations,
            updatedAt: serverTimestamp(),
          });
        }
      });

      if (typeof refreshProfile === "function") {
        await refreshProfile();
      }

      return { success: true, charityId };
    },
    [user, profile, refreshProfile]
  );

  const value = {
    myPoints: profile?.totalPoints ?? 0,
    lastPointDates: profile?.lastPointDates ?? {},
    preferredCharity: profile?.preferredCharity ?? null,
    globalData,
    globalLoading,
    canEarnToday,
    addPoint,
    donateTo,
  };

  return (
    <PointContext.Provider value={value}>{children}</PointContext.Provider>
  );
}

/**
 * usePoint 커스텀 훅
 * PointProvider 하위에서만 사용 가능
 */
export function usePoint() {
  const ctx = useContext(PointContext);
  if (ctx === undefined) {
    throw new Error("usePoint는 PointProvider 하위에서 사용해야 합니다.");
  }
  return ctx;
}

export default PointContext;
