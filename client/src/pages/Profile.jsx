// Booklog Profile — 「따뜻한 라이브러리」
// PRD.md §8 07. Profile (예진 담당 → 민서 구현)
// - Firebase Auth 유저 정보 (닉네임, 이메일)
// - Firestore users/{uid} 기반 데이터
// - 독서 현황 통계 (완독 / 읽는중 / 연속일 / 페이지)
// - 장르별 독서 비율 바 차트 (profile.genres 기반)
// - 프로필 수정 (닉네임 → Firestore + Firebase Auth 동기화)
// - 로그아웃 (signOut → /auth 리다이렉트)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Edit3, BookOpen, Flame, TrendingUp, Award,
  ChevronRight, ArrowLeft, Camera, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import { logout } from '@/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PROFILE_BG =
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663584969128/K9LDMhfUcVKdtMjF2S9GdE/booklog-profile-bg-Sfmo955ETw2dHjqsmMB9Wh.webp';

// ─── 연속 독서일 계산 ─────────────────────────────────────
function calculateStreak(shelf) {
  const all = new Set();
  shelf.forEach(b => (b.checkedDates || []).forEach(d => all.add(d)));
  if (!all.size) return 0;

  const sorted = [...all].sort().reverse(); // newest first
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let count = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round(
      (new Date(sorted[i - 1]) - new Date(sorted[i])) / 86_400_000
    );
    if (diff === 1) count++;
    else break;
  }
  return count;
}

// ─── 아바타 컴포넌트 (이미지 오류 시 이니셜 폴백) ──────────
function Avatar({ src, name, size = 80, className = '' }) {
  const [err, setErr] = useState(false);
  const initials = (name || '?')[0].toUpperCase();
  const style = { width: size, height: size, fontSize: size * 0.38 };

  if (!src || err) {
    return (
      <div
        className={`rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border-4 border-background shadow-lg flex-shrink-0 ${className}`}
        style={style}
      >
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className={`rounded-full object-cover border-4 border-background shadow-lg flex-shrink-0 ${className}`}
      style={style}
      onError={() => setErr(true)}
    />
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [view, setView]               = useState('main'); // 'main' | 'edit'
  const [shelf, setShelf]             = useState([]);
  const [shelfLoading, setShelfLoading] = useState(true);
  const [editNickname, setEditNickname] = useState('');
  const [saving, setSaving]           = useState(false);
  const [loggingOut, setLoggingOut]   = useState(false);
  const [bgErr, setBgErr]             = useState(false);

  // ── Firestore 서재 로드 ───────────────────────────────
  useEffect(() => {
    if (!user) return;
    getDocs(collection(db, 'users', user.uid, 'shelf'))
      .then(snap => setShelf(snap.docs.map(d => d.data())))
      .catch(err => console.error('[Profile] shelf 로드 실패:', err))
      .finally(() => setShelfLoading(false));
  }, [user]);

  // 편집 폼 동기화
  useEffect(() => {
    setEditNickname(profile?.nickname || user?.displayName || '');
  }, [profile, user]);

  // ── 파생 통계 ─────────────────────────────────────────
  const doneCount    = shelf.filter(b => b.status === 'done').length;
  const readingCount = shelf.filter(b => b.status === 'reading').length;
  const wantCount    = shelf.filter(b => b.status === 'want').length;
  const totalBooks   = shelf.length;
  const totalPages   = shelf.reduce((s, b) => s + (b.currentPage || 0), 0);
  const streak       = calculateStreak(shelf);

  // 독서 현황 바 차트 데이터
  const statusChartData = [
    { label: '완독',     count: doneCount    },
    { label: '읽는 중', count: readingCount  },
    { label: '읽고 싶음', count: wantCount   },
  ];
  const CHART_COLORS = [
    'var(--color-primary)',
    'oklch(0.72 0.1 80)',  // amber
    'var(--color-accent-foreground)',
  ];

  // 관심 장르 (온보딩 선택)
  const genres = profile?.genres || [];

  // 표시 값
  const displayName = profile?.nickname || user?.displayName || user?.email?.split('@')[0] || '독서인';
  const email       = user?.email || '';
  const joinDate    = profile?.createdAt?.toDate
    ? profile.createdAt.toDate().toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  // ── 프로필 저장 ──────────────────────────────────────
  const handleSave = async () => {
    const trimmed = editNickname.trim();
    if (!trimmed)         { toast.error('닉네임을 입력해주세요.'); return; }
    if (trimmed.length < 2)  { toast.error('닉네임은 2자 이상이어야 합니다.'); return; }
    if (trimmed.length > 12) { toast.error('닉네임은 12자 이하로 입력해주세요.'); return; }

    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed });
      await updateDoc(doc(db, 'users', user.uid), { nickname: trimmed });
      await refreshProfile();
      toast.success('프로필이 수정되었습니다!');
      setView('main');
    } catch (err) {
      console.error('[Profile] 저장 실패:', err);
      toast.error('저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  // ── 로그아웃 ─────────────────────────────────────────
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/auth', { replace: true });
    } catch (err) {
      toast.error('로그아웃에 실패했어요.');
      setLoggingOut(false);
    }
  };

  // ════════════════════════════════════════════════════
  // 편집 화면
  // ════════════════════════════════════════════════════
  if (view === 'edit') {
    return (
      <>
        <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-border/40">
          <button
            onClick={() => setView('main')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold" style={{ fontFamily: "'Noto Serif KR', serif" }}>
            프로필 수정
          </h1>
        </div>

        <div className="px-4 pt-6 animate-fade-in-up space-y-5 max-w-lg pb-8">
          {/* 아바타 */}
          <div className="flex flex-col items-center py-4">
            <div className="relative">
              <Avatar src={user?.photoURL} name={displayName} size={88} />
              <button
                disabled
                title="사진 변경 기능은 준비 중입니다"
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md opacity-50 cursor-not-allowed"
              >
                <Camera size={14} />
              </button>
            </div>
          </div>

          {/* 닉네임 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">닉네임</Label>
            <Input
              value={editNickname}
              onChange={e => setEditNickname(e.target.value)}
              placeholder="2~12자 입력"
              maxLength={12}
              className="h-11 bg-secondary border-none rounded-xl"
            />
            <p className="text-xs text-muted-foreground text-right">
              {editNickname.length} / 12
            </p>
          </div>

          {/* 이메일 (읽기 전용) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">이메일</Label>
            <Input
              value={email}
              disabled
              className="h-11 bg-secondary border-none rounded-xl opacity-60"
            />
            <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다.</p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full h-11 rounded-xl font-semibold">
            {saving ? (
              <><Loader2 size={16} className="animate-spin mr-2" />저장 중...</>
            ) : '저장하기'}
          </Button>
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════════════
  // 메인 화면
  // ════════════════════════════════════════════════════
  return (
    <>
      {/* 프로필 배경 헤더 */}
      <div
        className="relative mt-6 mx-4 rounded-2xl overflow-hidden"
        style={{
          background: bgErr
            ? 'linear-gradient(135deg, #5c3a25 0%, #3d2b1f 100%)'
            : undefined,
        }}
      >
        {bgErr ? (
          <div className="w-full h-44" />
        ) : (
          <img
            src={PROFILE_BG}
            alt="프로필 배경"
            className="w-full h-44 object-cover"
            onError={() => setBgErr(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />

        {/* 수정 버튼 */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setView('edit')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            aria-label="프로필 수정"
          >
            <Edit3 size={16} />
          </button>
        </div>
      </div>

      {/* 아바타 + 이름 */}
      <div className="px-4 -mt-10 mb-6 animate-fade-in-up">
        <div className="flex items-end gap-4 mb-3">
          <Avatar src={user?.photoURL} name={displayName} size={80} />
          <div className="pb-1 min-w-0">
            <h1
              className="text-2xl font-bold truncate"
              style={{ fontFamily: "'Noto Serif KR', serif" }}
            >
              {displayName}
            </h1>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
            {joinDate && (
              <p className="text-xs text-muted-foreground">{joinDate} 가입</p>
            )}
          </div>
        </div>

        {/* 관심 장르 뱃지 (온보딩 선택) */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {genres.map(g => (
              <span key={g} className="tag-pill bg-primary/10 text-primary text-xs border border-primary/20">
                {g}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 stagger-children pb-8">
        {/* 독서 통계 그리드 */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: '총 도서', value: shelfLoading ? '…' : `${totalBooks}권`,   icon: BookOpen,   color: 'text-primary' },
            { label: '완독',   value: shelfLoading ? '…' : `${doneCount}권`,    icon: Award,      color: 'text-amber-500' },
            { label: '연속',   value: shelfLoading ? '…' : `${streak}일`,       icon: Flame,      color: 'text-orange-500' },
            {
              label: '기록 페이지',
              value: shelfLoading ? '…' : (totalPages > 999 ? `${(totalPages / 1000).toFixed(1)}k` : `${totalPages}p`),
              icon: TrendingUp,
              color: 'text-accent-foreground',
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="book-card p-4 text-center">
              <Icon size={20} className={`${color} mx-auto mb-1.5`} />
              <p className="text-base font-bold">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* 독서 현황 바 차트 + 장르 분포 */}
        <div className="grid grid-cols-1 gap-5 mb-5 lg:grid-cols-2">
          {/* 독서 현황 바 차트 */}
          <div className="book-card p-4">
            <h3 className="text-sm font-semibold mb-4">독서 현황</h3>
            {shelfLoading ? (
              <div className="h-[140px] flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : totalBooks === 0 ? (
              <div className="h-[140px] flex flex-col items-center justify-center gap-2">
                <BookOpen size={28} className="text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">서재가 비어있어요</p>
                <button
                  onClick={() => navigate('/search')}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  책 검색하러 가기
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={statusChartData} barSize={36}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'oklch(0.55 0.025 60)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={v => [`${v}권`, '도서 수']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {statusChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 관심 장르 분포 */}
          <div className="book-card p-4">
            <h3 className="text-sm font-semibold mb-4">장르별 독서 비율</h3>
            {genres.length === 0 ? (
              <div className="h-[140px] flex flex-col items-center justify-center gap-2">
                <p className="text-sm text-muted-foreground">관심 장르가 없어요</p>
                <button
                  onClick={() => navigate('/onboarding', { state: { editGenres: true } })}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  장르 선택하러 가기
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {genres.map((g, i) => {
                  // 관심도 비율: 첫 번째 선택 장르가 가장 높게 표시
                  const pct = Math.max(30, 100 - i * 22);
                  return (
                    <div key={g} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-14 flex-shrink-0 truncate">
                        {g}
                      </span>
                      <div className="flex-1 progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-primary w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
                <p className="text-[10px] text-muted-foreground pt-1">
                  * 온보딩에서 선택한 관심 장르 기준
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 포인트 카드 */}
        <div
          className="book-card p-4 mb-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/points')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">나의 포인트</p>
              <p className="text-2xl font-bold text-amber-600">
                {(profile?.totalPoints ?? 0).toLocaleString()}P
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                포인트로 기부에 참여할 수 있어요
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl">🎁</span>
              <ChevronRight size={16} className="text-muted-foreground ml-auto mt-1" />
            </div>
          </div>
        </div>

        {/* 로그아웃 */}
        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full h-11 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5"
        >
          {loggingOut ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <LogOut size={16} className="mr-2" />
          )}
          {loggingOut ? '로그아웃 중...' : '로그아웃'}
        </Button>
      </div>
    </>
  );
}
