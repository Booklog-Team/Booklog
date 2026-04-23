// Booklog Points — 「따뜻한 라이브러리」
// PRD.md §8 10. Points / §9 포인트 & 기부 시스템
//
// 섹션
//   1. 독서 레벨 카드   — 현재 레벨 + 다음 레벨 진행률
//   2. 내 포인트 카드   — 보유 포인트, 오늘 활동 여부
//   3. 전체 기부 캠페인 — 누적 포인트, 참여자 수, 진행률 바
//   4. 기부처 선택      — 책읽는사회/어린이/국립장애인 (Firestore donations)
//   5. 포인트 적립 방법 — 활동별 카드 (오늘 완료 표시)
//   6. 기부 시스템 안내

import { useState } from 'react';
import {
  Gift, BookOpen, PenLine, Users, MessageSquare,
  Info, TrendingUp, Loader2, Trophy,
  CheckCircle2, Circle, Heart, ChevronRight,
} from 'lucide-react';
import { usePoint, POINT_VALUES } from '@/contexts/PointContext';

// ─── 독서 레벨 시스템 ──────────────────────────────────────
const LEVELS = [
  { level: 1, label: '새싹 독자',     emoji: '🌱', minPts: 0   },
  { level: 2, label: '꾸준한 독자',   emoji: '📚', minPts: 50  },
  { level: 3, label: '책벌레',        emoji: '🐛', minPts: 150 },
  { level: 4, label: '독서왕',        emoji: '👑', minPts: 300 },
  { level: 5, label: '도서관 수호자', emoji: '🏛️', minPts: 500 },
];

function getLevelInfo(pts) {
  let current = LEVELS[0];
  let next    = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (pts >= LEVELS[i].minPts) {
      current = LEVELS[i];
      next    = LEVELS[i + 1] ?? null;
      break;
    }
  }
  const range       = next ? next.minPts - current.minPts : 1;
  const earned      = pts - current.minPts;
  const progressPct = next ? Math.min(100, Math.round((earned / range) * 100)) : 100;
  return { current, next, progressPct, ptsToNext: next ? next.minPts - pts : 0 };
}

// ─── 기부처 ───────────────────────────────────────────────
const CHARITIES = [
  {
    id:   'reading_foundation',
    name: '책읽는사회문화재단',
    desc: '독서 문화 확산 및 도서 보급',
    icon: '📚',
    bg:   'bg-primary/10',
    fg:   'text-primary',
  },
  {
    id:   'childrens_foundation',
    name: '어린이재단',
    desc: '아동 복지 및 교육 지원',
    icon: '🧒',
    bg:   'bg-accent',
    fg:   'text-accent-foreground',
  },
  {
    id:   'disability_library',
    name: '국립장애인도서관',
    desc: '장애인 독서 접근성 지원',
    icon: '🏛️',
    bg:   'bg-amber-500/10',
    fg:   'text-amber-600',
  },
];

// ─── 적립 규칙 메타 (PRD §9) ──────────────────────────────
const EARN_RULES = [
  {
    type:  'reading_check',
    label: '오늘 독서 체크',
    pts:   POINT_VALUES.reading_check,
    icon:  BookOpen,
    desc:  '하루 1회',
    bg:    'bg-primary/10',
    fg:    'text-primary',
  },
  {
    type:  'memo',
    label: '메모 작성',
    pts:   POINT_VALUES.memo,
    icon:  PenLine,
    desc:  '하루 1회',
    bg:    'bg-amber-500/10',
    fg:    'text-amber-600',
  },
  {
    type:  'meeting_post',
    label: '모임 게시글',
    pts:   POINT_VALUES.meeting_post,
    icon:  Users,
    desc:  '하루 1회',
    bg:    'bg-accent',
    fg:    'text-accent-foreground',
  },
  {
    type:  'board_post',
    label: '자유게시판 글',
    pts:   POINT_VALUES.board_post,
    icon:  MessageSquare,
    desc:  '하루 1회',
    bg:    'bg-secondary',
    fg:    'text-secondary-foreground',
  },
];

const POINTS_PER_BOOK = 1_000;

// ─── 메인 컴포넌트 ────────────────────────────────────────
export default function Points() {
  const {
    myPoints,
    lastPointDates,
    preferredCharity,
    globalData,
    globalLoading,
    canEarnToday,
    donateTo,
  } = usePoint();

  const [donating, setDonating] = useState(null);

  const today        = new Date().toISOString().slice(0, 10);
  const earnedToday  = Object.values(lastPointDates).some(d => d === today);

  const totalDonated     = globalData?.totalDonated     ?? 0;
  const goalAmount       = globalData?.goalAmount       ?? 100_000;
  const participantCount = globalData?.participantCount ?? 0;
  const donations        = globalData?.donations        ?? {};
  const progressPct      = Math.min(100, Math.round((totalDonated / goalAmount) * 100));
  const booksEquiv       = Math.floor(totalDonated / POINTS_PER_BOOK);
  const myBookEquiv      = Math.floor(myPoints / POINTS_PER_BOOK);

  const levelInfo = getLevelInfo(myPoints);

  async function handleDonate(charityId) {
    if (donating || preferredCharity === charityId) return;
    setDonating(charityId);
    try {
      await donateTo(charityId);
    } catch (e) {
      console.error('[Points] donateTo 실패:', e);
    } finally {
      setDonating(null);
    }
  }

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-8 pb-4">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Noto Serif KR', serif" }}
        >
          포인트 &amp; 기부
        </h1>
        <Gift size={22} className="text-primary" />
      </div>

      <div className="px-4 pb-10 stagger-children">

        {/* ── 독서 레벨 카드 ───────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 to-green-900 p-6 mb-4 text-white shadow-lg">
          {/* 장식 */}
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-4 bottom-3 text-6xl opacity-15 pointer-events-none select-none leading-none">
            {levelInfo.current.emoji}
          </div>

          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-white/70 mb-1.5">현재 독서 레벨</p>
              <div className="flex items-center gap-2.5">
                <span className="text-3xl leading-none">{levelInfo.current.emoji}</span>
                <div>
                  <p className="text-[11px] text-white/60 leading-none mb-0.5">
                    Lv.{levelInfo.current.level}
                  </p>
                  <p
                    className="text-xl font-bold leading-tight"
                    style={{ fontFamily: "'Noto Serif KR', serif" }}
                  >
                    {levelInfo.current.label}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-white/60 mb-0.5">보유 포인트</p>
              <p className="text-3xl font-bold leading-none">
                {myPoints.toLocaleString()}
                <span className="text-sm ml-0.5 font-semibold">P</span>
              </p>
            </div>
          </div>

          {levelInfo.next ? (
            <>
              <div className="flex items-center justify-between text-[11px] text-white/60 mb-1.5">
                <span>{levelInfo.current.label}</span>
                <span>
                  {levelInfo.next.emoji} {levelInfo.next.label}까지
                  <span className="font-bold text-white ml-1">
                    {levelInfo.ptsToNext}P
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full bg-white transition-all duration-700"
                  style={{ width: `${levelInfo.progressPct}%` }}
                />
              </div>
              <p className="text-[11px] text-white/60">
                {levelInfo.progressPct}% 달성 — 다음 레벨:
                <span className="text-white font-semibold ml-1">
                  {levelInfo.next.emoji} {levelInfo.next.label}
                </span>
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
              <Trophy size={14} className="text-amber-300 flex-shrink-0" />
              <p className="text-xs text-white font-semibold">최고 레벨 달성! 대단해요 🎉</p>
            </div>
          )}
        </div>

        {/* ── 내 포인트 카드 ───────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 mb-6 text-white shadow-lg">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -right-2 bottom-0 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-white/80 mb-0.5">나의 포인트</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{myPoints.toLocaleString()}</span>
                <span className="text-xl font-semibold">P</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/70 mb-0.5">책 기부 환산</p>
              <p className="text-xl font-bold">{myBookEquiv}권</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span
              className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                earnedToday ? 'bg-green-300' : 'bg-white/40'
              }`}
            />
            <p className="text-xs text-white/90">
              {earnedToday
                ? '오늘 독서 활동 완료! 포인트가 적립됐어요 🎉'
                : '오늘 아직 활동 포인트를 받지 않았어요'}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
            <Info size={14} className="text-white/70 flex-shrink-0" />
            <p className="text-xs text-white/80">
              포인트는 하루 1회, 활동당 1회만 적립됩니다
            </p>
          </div>
        </div>

        {/* ── 전체 기부 캠페인 ─────────────────────────── */}
        <div className="book-card p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-primary" />
            <h2 className="text-sm font-semibold">전체 기부 캠페인</h2>
          </div>

          {globalLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold text-primary">
                    {totalDonated.toLocaleString()}
                    <span className="text-base ml-1 font-semibold">P</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    전체 독서인이 모은 누적 포인트
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Trophy size={14} className="text-amber-500" />
                    <span className="text-lg font-bold text-amber-600">
                      {booksEquiv}권
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Users size={12} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {participantCount.toLocaleString()}명 참여
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>0P</span>
                  <span className="font-semibold text-primary">{progressPct}% 달성</span>
                  <span>{goalAmount.toLocaleString()}P</span>
                </div>
                <div className="h-3 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                목표 달성 시 소외 지역 어린이에게 책을 선물해요 🎁
              </p>
            </>
          )}
        </div>

        {/* ── 기부처 선택 ──────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Heart size={16} className="text-primary" />
            <h2 className="text-sm font-semibold">기부처 선택</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            내 포인트를 기부할 곳을 선택해요. 변경할 수 있어요.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {CHARITIES.map(({ id, name, desc, icon, bg, fg }) => {
              const selected    = preferredCharity === id;
              const isLoading   = donating === id;
              const charityPts  = donations[id] ?? 0;

              return (
                <button
                  key={id}
                  onClick={() => handleDonate(id)}
                  disabled={!!donating}
                  className={`relative overflow-hidden w-full text-left book-card p-4 flex items-center gap-4 transition-all duration-200 ${
                    selected
                      ? 'bg-primary/5'
                      : 'hover:bg-secondary/60 active:bg-secondary'
                  } ${donating && !isLoading ? 'opacity-60' : ''}`}
                >
                  {/* 선택 인디케이터 */}
                  {selected && (
                    <div className="absolute left-0 inset-y-0 w-1 bg-primary rounded-l-xl" />
                  )}

                  {/* 아이콘 */}
                  <div
                    className={`w-12 h-12 rounded-xl ${bg} ${fg} flex items-center justify-center text-2xl flex-shrink-0`}
                  >
                    {isLoading
                      ? <Loader2 size={20} className="animate-spin" />
                      : icon}
                  </div>

                  {/* 텍스트 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold truncate">{name}</p>
                      {selected && (
                        <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                          <CheckCircle2 size={10} /> 선택됨
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                    <p className="text-xs font-semibold text-primary mt-1">
                      {charityPts.toLocaleString()}P 모임
                    </p>
                  </div>

                  {!selected && (
                    <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 포인트 적립 방법 ─────────────────────────── */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3">포인트 적립 방법</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {EARN_RULES.map(({ type, label, pts, icon: Icon, desc, bg, fg }) => {
              const earned = !canEarnToday(type);
              return (
                <div
                  key={type}
                  className={`book-card p-4 text-center transition-opacity ${
                    earned ? 'opacity-60' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${bg} ${fg} flex items-center justify-center mx-auto mb-2 relative`}
                  >
                    <Icon size={18} />
                    {earned && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={10} className="text-white" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold mb-1 leading-tight">{label}</p>
                  <p
                    className={`text-lg font-bold ${
                      earned ? 'text-muted-foreground line-through' : 'text-amber-600'
                    }`}
                  >
                    +{pts}P
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {earned ? '오늘 완료 ✓' : desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mt-3 px-3 py-2.5 bg-secondary/60 rounded-xl">
            <Circle size={14} className="text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">완독</span>은 포인트가 적립되지 않아요
              — 독서 자체가 보상입니다 📖
            </p>
          </div>
        </div>

        {/* ── 기부 시스템 안내 ─────────────────────────── */}
        <div className="book-card p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">📖</span>
            <div>
              <h3 className="text-sm font-semibold mb-1.5">기부 시스템 안내</h3>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Booklog의 모든 독서인이 활동으로 적립한 포인트는 합산되어
                  기부 금액으로 환산됩니다.
                </p>
                <div className="flex items-center gap-2 py-2 px-3 bg-background rounded-lg">
                  <span className="text-xs font-semibold text-primary">1,000P</span>
                  <span className="text-xs text-muted-foreground">=</span>
                  <span className="text-xs font-semibold text-foreground">📚 책 1권</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  소외 지역 어린이, 독서 장학금, 노인 독서 프로그램 등
                  다양한 곳에 독서의 가치를 전합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
