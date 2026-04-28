// Booklog Points — 「따뜻한 라이브러리」
// PRD.md §9 포인트 & 기부 시스템 — 모든 데이터 Firestore 연동
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Gift, BookOpen, PenLine, Users, MessageSquare,
  Info, TrendingUp, Loader2, Trophy, CheckCircle2, Heart,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
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
  const progressPct = next ? Math.min(100, Math.round(((pts - current.minPts) / range) * 100)) : 100;
  return { current, next, progressPct, ptsToNext: next ? next.minPts - pts : 0 };
}

// ─── 기부처 (PRD §9) ──────────────────────────────────────
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

// ─── 오늘 활동 적립 규칙 (PRD §9) ────────────────────────
// type 값은 PointContext.addPoint / lastPointDates 키와 일치해야 함
const EARN_RULES = [
  { type: 'reading_check', label: '독서 기록',     pts: POINT_VALUES.reading_check, icon: BookOpen,      bg: 'bg-primary/10',    fg: 'text-primary'              },
  { type: 'memo',          label: '메모 작성',     pts: POINT_VALUES.memo,          icon: PenLine,       bg: 'bg-amber-500/10',  fg: 'text-amber-600'            },
  { type: 'meeting_post',  label: '모임 게시글',   pts: POINT_VALUES.meeting_post,  icon: Users,         bg: 'bg-accent',        fg: 'text-accent-foreground'    },
  { type: 'board_post',    label: '자유게시판 글', pts: POINT_VALUES.board_post,    icon: MessageSquare, bg: 'bg-secondary',     fg: 'text-secondary-foreground' },
];

const POINTS_PER_BOOK = 1_000;

// ─── 메인 컴포넌트 ────────────────────────────────────────
export default function Points() {
  const navigate = useNavigate();
  const {
    myPoints,
    lastPointDates,
    preferredCharity,
    globalData,
    globalLoading,
    donateTo,
  } = usePoint();

  const [donating, setDonating] = useState(null);

  // profile.totalPoints 기반 실제 포인트
  const displayPoints = myPoints;
  const levelInfo     = getLevelInfo(displayPoints);

  // 파생 값
  const totalDonated     = globalData?.totalDonated     ?? 0;
  const goalAmount       = globalData?.goalAmount       ?? 100_000;
  const participantCount = globalData?.participantCount ?? 0;
  const donations        = globalData?.donations        ?? {};
  const progressPct      = Math.min(100, Math.round((totalDonated / goalAmount) * 100));
  const booksEquiv       = Math.floor(totalDonated / POINTS_PER_BOOK);

  const selectedCharity = CHARITIES.find(c => c.id === preferredCharity);

  // 오늘 완료한 활동 (lastPointDates 기반)
  const today       = new Date().toISOString().slice(0, 10);
  const earnedToday = EARN_RULES.filter(r => lastPointDates[r.type] === today);
  const totalEarned = earnedToday.reduce((sum, r) => sum + r.pts, 0);

  async function handleDonate(charityId) {
    if (donating || preferredCharity === charityId) return;
    setDonating(charityId);
    try {
      await donateTo(charityId);
      const name = CHARITIES.find(c => c.id === charityId)?.name ?? '';
      toast.success(`${name}을 선택했어요 ❤️`);
    } catch (e) {
      console.error('[Points] donateTo 실패:', e);
      toast.error('기부처 선택에 실패했어요. 다시 시도해주세요.');
    } finally {
      setDonating(null);
    }
  }

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold">포인트 &amp; 기부</h1>
        </div>
      </div>

      <div className="px-4 pb-10 stagger-children">

        {/* ── 내 포인트 카드 ───────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 mb-4 text-white shadow-lg">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -right-2 bottom-0 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

          <p className="text-sm text-white/80 mb-1">나의 포인트</p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-5xl font-bold">{displayPoints.toLocaleString()}</span>
            <span className="text-2xl font-semibold">P</span>
          </div>

          <p className="text-sm text-white/80 mb-3">
            {selectedCharity
              ? <><span className="font-bold text-white">{selectedCharity.name}</span>을 응원하고 있어요 ❤️</>
              : '기부처를 선택해 포인트를 나눠요'}
          </p>

          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
            <Info size={14} className="text-white/70 flex-shrink-0" />
            <p className="text-xs text-white/80">
              포인트는 하루 1회, 활동당 1회만 적립됩니다
            </p>
          </div>
        </div>

        {/* ── 독서 레벨 카드 ───────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 to-green-900 p-5 mb-6 text-white shadow-lg">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-4 bottom-3 text-5xl opacity-15 pointer-events-none select-none leading-none">
            {levelInfo.current.emoji}
          </div>

          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[11px] text-white/60 mb-1">현재 독서 레벨</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">{levelInfo.current.emoji}</span>
                <div>
                  <p className="text-[10px] text-white/50 leading-none mb-0.5">Lv.{levelInfo.current.level}</p>
                  <p className="text-lg font-bold leading-tight">
                    {levelInfo.current.label}
                  </p>
                </div>
              </div>
            </div>
            {earnedToday.length > 0 && (
              <div className="text-right">
                <p className="text-[10px] text-white/60 mb-0.5">오늘 적립</p>
                <p className="text-xl font-bold">+{totalEarned}<span className="text-sm ml-0.5">P</span></p>
              </div>
            )}
          </div>

          {levelInfo.next ? (
            <>
              <div className="flex items-center justify-between text-[11px] text-white/60 mb-1.5">
                <span>{levelInfo.current.label}</span>
                <span>
                  {levelInfo.next.emoji} {levelInfo.next.label}까지
                  <span className="font-bold text-white ml-1">{levelInfo.ptsToNext}P</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white transition-all duration-700"
                  style={{ width: `${levelInfo.progressPct}%` }}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
              <Trophy size={14} className="text-amber-300 flex-shrink-0" />
              <p className="text-xs text-white font-semibold">최고 레벨 달성! 대단해요 🎉</p>
            </div>
          )}
        </div>

        {/* ── 오늘의 포인트 활동 ───────────────────────── */}
        {/* lastPointDates[type] === today → 컬러(활성), 미적립 → 회색(비활성) */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3">오늘의 포인트 활동</h2>
          <div className="space-y-2">
            {EARN_RULES.map(({ type, label, pts, icon: Icon, bg, fg }) => {
              const earned = lastPointDates[type] === today;
              return (
                <div
                  key={type}
                  className={`book-card p-3.5 flex items-center gap-3 ${!earned ? 'opacity-50' : ''}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      earned ? bg : 'bg-secondary'
                    }`}
                  >
                    <Icon size={18} className={earned ? fg : 'text-muted-foreground'} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {earned ? '오늘 완료' : '하루 1회 적립 가능'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${earned ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      +{pts}P
                    </p>
                    {earned && <CheckCircle2 size={14} className="text-green-500 ml-auto mt-0.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 기부처 선택 ──────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Heart size={16} className="text-primary" />
            <h2 className="text-sm font-semibold">기부처 선택</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            내 포인트를 기부할 곳을 선택해요. 언제든 변경할 수 있어요.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {CHARITIES.map(({ id, name, desc, icon, bg, fg }) => {
              const selected   = preferredCharity === id;
              const isLoading  = donating === id;
              const charityPts = donations[id] ?? 0;

              return (
                <button
                  key={id}
                  onClick={() => handleDonate(id)}
                  disabled={!!donating}
                  className={`relative overflow-hidden w-full text-left book-card p-4 flex items-center gap-4 transition-all duration-200 ${
                    selected ? 'bg-primary/5' : 'hover:bg-secondary/60 active:bg-secondary'
                  } ${donating && !isLoading ? 'opacity-60' : ''}`}
                >
                  {selected && (
                    <div className="absolute left-0 inset-y-0 w-1 bg-primary rounded-l-xl" />
                  )}
                  <div className={`w-12 h-12 rounded-xl ${bg} ${fg} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : icon}
                  </div>
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
                  {!selected && <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />}
                </button>
              );
            })}
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
                  <p className="text-xs text-muted-foreground mt-0.5">전체 독서인이 모은 누적 포인트</p>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Trophy size={14} className="text-amber-500" />
                    <span className="text-lg font-bold text-amber-600">{booksEquiv}권</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Users size={12} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{participantCount.toLocaleString()}명 참여</span>
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
