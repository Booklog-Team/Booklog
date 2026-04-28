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
      <div className="flex items-center justify-between px-4 pt-8 pb-4 max-w-2xl mx-auto">
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

      <div className="px-4 pb-10 stagger-children max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-3.5 mb-6">
          {/* ── 내 포인트 카드 ───────────────────────────── */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-xl shadow-amber-500/10 flex flex-col justify-between min-h-[160px]">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
            
            <div>
              <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-2">My Points</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black tracking-tighter">{displayPoints.toLocaleString()}</span>
                <span className="text-sm font-bold opacity-80">P</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-[10px] text-white/80 leading-tight line-clamp-2">
                {selectedCharity
                  ? <><span className="font-bold text-white">{selectedCharity.name}</span> 응원 중 ❤️</>
                  : '기부처를 선택해주세요'}
              </p>
            </div>
          </div>

          {/* ── 독서 레벨 카드 ───────────────────────────── */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white shadow-xl shadow-black/10 flex flex-col justify-between min-h-[160px]">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute right-4 bottom-4 text-4xl opacity-10 pointer-events-none select-none">
              {levelInfo.current.emoji}
            </div>

            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Reading Level</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">{levelInfo.current.emoji}</span>
                <p className="text-base font-bold leading-tight">{levelInfo.current.label}</p>
              </div>
            </div>

            <div className="mt-4">
              {levelInfo.next ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] text-white/50 font-bold uppercase tracking-tighter">
                    <span>Lv.{levelInfo.current.level}</span>
                    <span>{levelInfo.ptsToNext}P to Lv.{levelInfo.next.level}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${levelInfo.progressPct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[10px] font-bold text-amber-400">MAX LEVEL 🎉</p>
              )}
            </div>
          </div>
        </div>

        {/* 오늘 적립 요약 (있을 경우만) */}
        {earnedToday.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-3 mb-6 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-sm">✨</span>
              <p className="text-xs font-bold text-amber-700">오늘 이만큼 모았어요!</p>
            </div>
            <p className="text-base font-black text-amber-600">+{totalEarned}P</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 오늘의 활동 */}
          <div>
            <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3 px-1">Today's Activities</h2>
            <div className="space-y-2">
              {EARN_RULES.map(({ type, label, pts, icon: Icon, bg, fg }) => {
                const earned = lastPointDates[type] === today;
                return (
                  <div
                    key={type}
                    className={`book-card p-3 flex items-center gap-3 transition-all ${!earned ? 'opacity-40 grayscale' : 'shadow-md border-primary/20'}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${earned ? bg : 'bg-secondary'}`}>
                      <Icon size={16} className={earned ? fg : 'text-muted-foreground'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{label}</p>
                    </div>
                    <div className="text-right flex items-center gap-1.5">
                      <p className={`text-xs font-black ${earned ? 'text-amber-600' : 'text-muted-foreground'}`}>+{pts}P</p>
                      {earned && <CheckCircle2 size={12} className="text-green-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 기부처 선택 */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Select Charity</h2>
              <Heart size={12} className="text-primary" />
            </div>
            <div className="space-y-2">
              {CHARITIES.map(({ id, name, desc, icon, bg, fg }) => {
                const selected = preferredCharity === id;
                const isLoading = donating === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleDonate(id)}
                    disabled={!!donating}
                    className={`w-full text-left book-card p-3 flex items-center gap-3 transition-all ${
                      selected ? 'border-primary bg-primary/5 shadow-md' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl ${bg} ${fg} flex items-center justify-center text-lg flex-shrink-0`}>
                      {isLoading ? <Loader2 size={14} className="animate-spin" /> : icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{name}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{desc}</p>
                    </div>
                    {selected && <CheckCircle2 size={12} className="text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {/* 전체 기부 캠페인 */}
          <div className="book-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} className="text-primary" />
                <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Global Campaign</h2>
              </div>
              
              {globalLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={20} className="animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-black text-primary">
                      {totalDonated.toLocaleString()}<span className="text-sm ml-0.5 font-bold">P</span>
                    </p>
                    <div className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                      <Trophy size={12} /> {booksEquiv}권
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                      <span>Progress</span>
                      <span className="text-primary">{progressPct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 기부 안내 */}
          <div className="book-card p-5 bg-primary/5 border-primary/10">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-tight mb-2">Notice</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">
                  전체 독서인이 모은 포인트는 합산되어 소외 지역 어린이들에게 책으로 선물됩니다.
                </p>
                <div className="inline-flex items-center gap-2 py-1.5 px-3 bg-background rounded-lg border border-border/40">
                  <span className="text-[10px] font-black text-primary uppercase">1,000P = 📚 1 Book</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
