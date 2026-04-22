// Booklog Points — 「따뜻한 라이브러리」
// PRD.md §8 10. Points / §9 포인트 & 기부 시스템
//
// 데이터 흐름
//   useAuth()   → profile.totalPoints, profile.lastPointDates
//   usePoint()  → globalData (onSnapshot), canEarnToday(), addPoint()
//
// 포인트 적립 규칙 (PRD §9)
//   오늘 독서 체크  +10p  하루 1회
//   메모 작성       +5p   하루 1회
//   모임 게시글     +5p   하루 1회
//   자유게시판 글   +3p   하루 1회
//   완독            없음

import { Gift, BookOpen, PenLine, Users, MessageSquare, Info, TrendingUp, Loader2, Trophy, CheckCircle2, Circle } from 'lucide-react';
import { usePoint, POINT_VALUES } from '@/contexts/PointContext';

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
    globalData,
    globalLoading,
    canEarnToday,
  } = usePoint();

  // 파생 값
  const today        = new Date().toISOString().slice(0, 10);
  const earnedToday  = Object.values(lastPointDates).some(d => d === today);

  const totalDonated = globalData?.totalDonated ?? 0;
  const goalAmount   = globalData?.goalAmount   ?? 100_000;
  const progressPct  = Math.min(100, Math.round((totalDonated / goalAmount) * 100));
  const booksEquiv   = Math.floor(totalDonated / POINTS_PER_BOOK);
  const myBookEquiv  = Math.floor(myPoints / POINTS_PER_BOOK);

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

        {/* ── 내 포인트 카드 ───────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 mb-6 text-white shadow-lg">
          {/* 장식 원 */}
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -right-2 bottom-0 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

          <p className="text-sm text-white/80 mb-1">나의 포인트</p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-5xl font-bold">{myPoints.toLocaleString()}</span>
            <span className="text-2xl font-semibold">P</span>
          </div>

          <p className="text-sm text-white/80 mb-3">
            책{' '}
            <span className="font-bold text-white">{myBookEquiv}권</span>{' '}
            기부에 참여할 수 있어요 📚
          </p>

          {/* 오늘 활동 여부 */}
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

        {/* ── 전체 기부 현황 ──────────────────────────── */}
        <div className="book-card p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-primary" />
            <h2 className="text-sm font-semibold">전체 기부 현황</h2>
          </div>

          {globalLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* 수치 요약 */}
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
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end mb-0.5">
                    <Trophy size={14} className="text-amber-500" />
                    <span className="text-lg font-bold text-amber-600">
                      {booksEquiv}권
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">책 기부 환산</p>
                </div>
              </div>

              {/* 진행률 바 */}
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

        {/* ── 오늘의 활동 현황 + 적립 방법 ────────────── */}
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
                  {/* 아이콘 */}
                  <div
                    className={`w-10 h-10 rounded-xl ${bg} ${fg} flex items-center justify-center mx-auto mb-2 relative`}
                  >
                    <Icon size={18} />
                    {/* 완료 뱃지 */}
                    {earned && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={10} className="text-white" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold mb-1 leading-tight">{label}</p>
                  <p className={`text-lg font-bold ${earned ? 'text-muted-foreground line-through' : 'text-amber-600'}`}>
                    +{pts}P
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {earned ? '오늘 완료 ✓' : desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* 완독 안내 (포인트 없음) */}
          <div className="flex items-center gap-2 mt-3 px-3 py-2.5 bg-secondary/60 rounded-xl">
            <Circle size={14} className="text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">완독</span>은 포인트가 적립되지 않아요
              — 독서 자체가 보상입니다 📖
            </p>
          </div>
        </div>

        {/* ── 기부 시스템 안내 ────────────────────────── */}
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
