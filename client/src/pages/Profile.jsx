// Booklog Profile — 「따뜻한 라이브러리」
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Edit3, BookOpen, Flame, TrendingUp, Award,
  ArrowLeft, Camera, Loader2, X, Star, ChevronRight,
  Info, Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import { logout } from '@/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePoint } from '@/contexts/PointContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { motion } from 'framer-motion';



function getHeatLevel(count) {
  if (!count) return 0;
  if (count === 1) return 2;
  if (count === 2) return 3;
  return 4;
}

const GENRE_COLORS = [
  'var(--chart-genre-1)',
  'var(--chart-genre-2)',
  'var(--chart-genre-3)',
  'var(--chart-genre-4)',
  'var(--chart-genre-5)',
];

const MONTH_BAR_COLORS = {
  current:  'var(--color-primary)',
  previous: 'var(--chart-bar-prev)',
  empty:    'var(--chart-bar-empty)',
};

const CHART_TOOLTIP_STYLE = {
  background: 'var(--popover)',
  color: 'var(--popover-foreground)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  boxShadow: '0 14px 36px color-mix(in oklch, var(--foreground) 18%, transparent)',
  fontSize: 12,
};

const THEME_CHART_COLORS = {
  spring: { 
    current: '#FF6B6B', previous: '#FFDADA', empty: '#FFF5F5',
    genres: ['#FF6B6B', '#FF8E8E', '#FFB2B2', '#FFD6D6', '#FFF5F5']
  },
  summer: { 
    current: '#0284C7', previous: '#BAE6FD', empty: '#F0F9FF',
    genres: ['#0284C7', '#0EA5E9', '#38BDF8', '#7DD3FC', '#BAE6FD']
  },
  autumn: { 
    current: '#D97706', previous: '#FDE68A', empty: '#FEF3C7',
    genres: ['#D97706', '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A']
  },
  winter: { 
    current: '#E11D48', previous: '#BBF7D0', empty: '#F1F5F9',
    genres: ['#E11D48', '#F43F5E', '#FB7185', '#FDA4AF', '#FECDD3']
  },
  glass:  { 
    current: '#111827', previous: '#E5E7EB', empty: '#F9FAFB',
    genres: ['#111827', '#374151', '#4B5563', '#6B7280', '#9CA3AF']
  },
  default: { 
    current: 'var(--color-primary)', previous: 'var(--chart-bar-prev)', empty: 'var(--chart-bar-empty)',
    genres: ['var(--chart-genre-1)', 'var(--chart-genre-2)', 'var(--chart-genre-3)', 'var(--chart-genre-4)', 'var(--chart-genre-5)']
  }
};

const CHART_TOOLTIP_LABEL_STYLE = {
  color: 'var(--popover-foreground)',
  fontWeight: 700,
};

const CHART_TOOLTIP_ITEM_STYLE = {
  color: 'var(--popover-foreground)',
  fontWeight: 600,
};

const GENRE_LIST = [
  { id: '소설',    emoji: '📖', label: '소설'    },
  { id: '인문',    emoji: '🏛️', label: '인문'    },
  { id: '과학',    emoji: '🔬', label: '과학'    },
  { id: '경제',    emoji: '📈', label: '경제'    },
  { id: '자기계발', emoji: '🚀', label: '자기계발' },
  { id: '예술',    emoji: '🎨', label: '예술'    },
  { id: '역사',    emoji: '🏺', label: '역사'    },
  { id: '아동',    emoji: '🎠', label: '아동'    },
];

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

const monthKeyFromDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getBookMonthKeys = (book) => {
  const keys = new Set();
  (book.checkedDates || []).forEach(date => {
    if (typeof date === 'string' && date.length >= 7) keys.add(date.slice(0, 7));
  });
  [book.endDate, book.lastReadDate].forEach(date => {
    if (typeof date === 'string' && date.length >= 7) keys.add(date.slice(0, 7));
  });
  return keys;
};

// ─── 헬퍼 함수 ────────────────────────────────────────────────────────────
function calculateStreak(shelf) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const all = new Set();
  shelf.forEach(b => (b.checkedDates || []).forEach(d => { if (d <= todayStr) all.add(d); }));
  if (!all.size) return 0;
  const sorted = [...all].sort().reverse();
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (sorted[0] !== todayStr && sorted[0] !== yesterday) return 0;
  let count = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((new Date(sorted[i - 1]) - new Date(sorted[i])) / 86_400_000);
    if (diff === 1) count++;
    else break;
  }
  return count;
}

function calculateLongestStreak(shelf) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const all = new Set();
  shelf.forEach(b => (b.checkedDates || []).forEach(d => { if (d <= todayStr) all.add(d); }));
  if (!all.size) return 0;
  const sorted = [...all].sort();
  let longest = 1, current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((new Date(sorted[i]) - new Date(sorted[i - 1])) / 86_400_000);
    if (diff === 1) { current++; if (current > longest) longest = current; }
    else current = 1;
  }
  return longest;
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

// ─── 서브 컴포넌트 ─────────────────────────────────────────────────────────
function AvatarImg({ src, name, size = 80, className = '' }) {
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
      src={src} alt={name}
      className={`rounded-full object-cover border-4 border-background shadow-lg flex-shrink-0 ${className}`}
      style={style}
      onError={() => setErr(true)}
    />
  );
}

function StarRow({ count }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i} size={11}
          fill={i <= (count || 0) ? 'currentColor' : 'none'}
          className={i <= (count || 0) ? 'text-amber-400' : 'text-muted-foreground/30'}
        />
      ))}
    </div>
  );
}

function BookThumb({ src, title }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="w-10 h-14 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
        <BookOpen size={14} className="text-primary/50" />
      </div>
    );
  }
  return (
    <img
      src={src} alt={title}
      className="w-10 h-14 object-cover rounded-md flex-shrink-0"
      onError={() => setErr(true)}
    />
  );
}

function CenterModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      {/* 반투명 배경 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* 다이얼로그 */}
      <div className="relative bg-card rounded-2xl w-full max-w-sm max-h-[78vh] flex flex-col shadow-2xl scale-in">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 flex-shrink-0">
          <h2
            className="text-base font-bold"
            style={{ fontFamily: "'Noto Serif KR', serif" }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        {/* 스크롤 가능한 콘텐츠 */}
        <div className="overflow-y-auto scrollbar-booklist flex-1 px-5 py-4 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const { myPoints } = usePoint();

  const displayPoints = myPoints ?? (profile?.totalPoints ?? 0);
  const levelInfo     = getLevelInfo(displayPoints);

  const chartColors = THEME_CHART_COLORS[theme] || THEME_CHART_COLORS.default;

  const [view, setView]                 = useState('main');
  const [shelf, setShelf]               = useState([]);
  const [shelfLoading, setShelfLoading] = useState(true);
  const [editNickname, setEditNickname] = useState('');
  const [editMotto, setEditMotto]       = useState('');
  const [saving, setSaving]             = useState(false);
  const [loggingOut, setLoggingOut]     = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef(null);
  const [activeModal, setActiveModal]   = useState(null); // null | 'books' | 'done' | 'streak' | 'pages' | 'points'
  const [activeBar, setActiveBar]       = useState(null); // null | '완독' | '읽는 중' | '읽고 싶음'
  const [genreEditOpen, setGenreEditOpen] = useState(false);
  const [tempGenres, setTempGenres]       = useState([]);
  const [savingGenres, setSavingGenres]   = useState(false);
  const [pwResetSent, setPwResetSent]     = useState(false);
  const [sendingReset, setSendingReset]   = useState(false);
  const [activeGenre, setActiveGenre]     = useState(null);

  // Firestore 서재 로드
  useEffect(() => {
    if (!user) { setShelfLoading(false); return; }
    getDocs(collection(db, 'users', user.uid, 'shelf'))
      .then(snap => setShelf(snap.docs.map(d => d.data())))
      .catch(err => console.error('[Profile] shelf 로드 실패:', err))
      .finally(() => setShelfLoading(false));
  }, [user]);

  // 편집 폼 동기화
  useEffect(() => {
    setEditNickname(profile?.nickname || user?.displayName || '');
    setEditMotto(profile?.motto || '');
  }, [profile, user]);

  const effectiveShelf = shelfLoading ? [] : shelf;

  // 파생 통계
  const doneCount     = effectiveShelf.filter(b => b.status === 'done').length;
  const readingCount  = effectiveShelf.filter(b => b.status === 'reading').length;
  const wantCount     = effectiveShelf.filter(b => b.status === 'want').length;
  const totalBooks    = effectiveShelf.length;
  const totalPages    = effectiveShelf.reduce((s, b) => s + (b.currentPage || 0), 0);

  const streakShelf = effectiveShelf;
  const genreShelf  = effectiveShelf;

  const streak        = calculateStreak(streakShelf);
  const longestStreak = calculateLongestStreak(streakShelf);

  // 날짜 집합 + 날짜별 체크 수 — 단일 패스
  const { allReadDates, readCountByDate } = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const dates = new Set();
    const counts = {};
    streakShelf.forEach(b => {
      (b.checkedDates || []).forEach(d => {
        if (d <= todayStr) {
          dates.add(d);
          counts[d] = (counts[d] || 0) + 1;
        }
      });
    });
    return { allReadDates: dates, readCountByDate: counts };
  }, [streakShelf]);

  // 이번 달 독서한 날
  const thisMonth     = new Date().toISOString().slice(0, 7);
  const thisMonthDays = [...allReadDates].filter(d => d.startsWith(thisMonth)).length;

  const monthlyShelf = useMemo(() => {
    if (shelfLoading) return [];
    return shelf;
  }, [shelf, shelfLoading]);

  const genreData = useMemo(() => {
    const counts = {};
    genreShelf.forEach(b => {
      (Array.isArray(b.genre) ? b.genre : [b.genre]).filter(Boolean).forEach(g => { counts[g] = (counts[g] || 0) + 1; });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [genreShelf]);

  // 최근 28일 (4주) 날짜 배열
  const last28Days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(Date.now() - (27 - i) * 86_400_000);
    return d.toISOString().slice(0, 10);
  });

  // 바 차트 데이터
  const statusChartData = [
    { label: '완독',    count: doneCount    },
    { label: '읽는 중', count: readingCount },
    { label: '읽고 싶음', count: wantCount  },
  ];

  const monthlyReadingData = useMemo(() => {
    const today = new Date();
    const currentMonthKey = monthKeyFromDate(today);
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
      const key = monthKeyFromDate(date);
      return {
        key,
        label: `${date.getMonth() + 1}월`,
        count: 0,
        books: [],
        isCurrent: key === currentMonthKey,
      };
    });
    const monthMap = new Map(months.map(month => [month.key, month]));

    monthlyShelf.forEach(book => {
      getBookMonthKeys(book).forEach(key => {
        const month = monthMap.get(key);
        if (!month) return;
        month.count += 1;
        month.books.push(book);
      });
    });

    return months;
  }, [monthlyShelf]);

  const genres      = profile?.genres || [];
  const displayName = profile?.nickname || user?.displayName || user?.email?.split('@')[0] || '독서인';
  const email       = user?.email || '';
  const joinDate    = profile?.createdAt?.toDate
    ? profile.createdAt.toDate().toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  const displayPointsFallback = profile?.totalPoints ?? 0; // Legacy if point context is not ready

  // 바 차트 클릭 — 선택된 카테고리 책 목록
  const activeMonthData = activeBar ? monthlyReadingData.find(month => month.key === activeBar) : null;
  const activeBarBooks  = activeMonthData?.books || [];
  const activeGenreBooks = activeGenre ? genreShelf.filter(b => (Array.isArray(b.genre) ? b.genre : [b.genre]).filter(Boolean).includes(activeGenre)) : [];

  // ── 이미지 압축 (Canvas → base64 JPEG) ────────────────────────────────
  const compressImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (ev) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const MAX = 320;
          let { width, height } = img;
          if (width > height) {
            if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
          } else {
            if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

  // ── 프로필 사진 변경 (Firestore에 base64 저장) ─────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('이미지 파일만 업로드할 수 있어요.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('파일 크기는 10MB 이하여야 해요.'); return; }

    setPhotoUploading(true);
    try {
      const dataUrl = await compressImage(file);
      await setDoc(doc(db, 'users', user.uid), { photoURL: dataUrl }, { merge: true });
      await refreshProfile();
      toast.success('프로필 사진이 변경되었습니다!');
    } catch (err) {
      console.error('[Profile] 사진 변경 실패:', err);
      toast.error('사진 변경에 실패했어요. 다시 시도해주세요.');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  // ── 프로필 저장 ────────────────────────────────────────────────────────
  const handleSave = async () => {
    const trimmed = editNickname.trim();
    if (!trimmed)            { toast.error('닉네임을 입력해주세요.'); return; }
    if (trimmed.length < 2)  { toast.error('닉네임은 2자 이상이어야 합니다.'); return; }
    if (trimmed.length > 12) { toast.error('닉네임은 12자 이하로 입력해주세요.'); return; }
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed });
      await setDoc(doc(db, 'users', user.uid), { 
        nickname: trimmed,
        motto: editMotto.trim()
      }, { merge: true });
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

  // ── 선호 장르 저장 ─────────────────────────────────────────────────────
  const handleSaveGenres = async () => {
    if (tempGenres.length === 0) { toast.error('최소 1개 이상의 장르를 선택해주세요.'); return; }
    setSavingGenres(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { genres: tempGenres }, { merge: true });
      await refreshProfile();
      toast.success('선호 장르가 수정되었습니다!');
      setGenreEditOpen(false);
    } catch (err) {
      console.error('[Profile] 장르 저장 실패:', err);
      toast.error('저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSavingGenres(false);
    }
  };

  // ── 비밀번호 재설정 ────────────────────────────────────────────────────
  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setPwResetSent(true);
      toast.success('비밀번호 재설정 이메일을 보냈어요!');
    } catch (err) {
      console.error('[Profile] 비밀번호 재설정 실패:', err);
      toast.error('이메일 발송에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setSendingReset(false);
    }
  };

  // ── 로그아웃 ───────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/auth', { replace: true });
    } catch {
      toast.error('로그아웃에 실패했어요.');
      setLoggingOut(false);
    }
  };

  // ── 통계 카드 설정 ─────────────────────────────────────────────────────
  const STAT_CARDS = [
    {
      key: 'books', label: '총 도서',
      value: shelfLoading ? '…' : `${totalBooks}권`,
      icon: BookOpen, color: 'text-primary',
    },
    {
      key: 'done', label: '완독',
      value: shelfLoading ? '…' : `${doneCount}권`,
      icon: Award, color: 'text-amber-500',
    },
    {
      key: 'streak', label: '연속',
      value: shelfLoading ? '…' : `${streak}일`,
      icon: Flame, color: 'text-orange-500',
    },
    {
      key: 'pages', label: '기록 페이지',
      value: shelfLoading ? '…' : (totalPages > 999 ? `${(totalPages / 1000).toFixed(1)}k` : `${totalPages}p`),
      icon: TrendingUp, color: '[color:var(--stat-color-2)]',
    },
  ];

  // ── 편집 화면 ──────────────────────────────────────────────────────────
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
            개인정보 수정
          </h1>
        </div>

        <div className="px-4 pt-6 animate-fade-in-up max-w-lg pb-10 space-y-8">
          {/* ── 프로필 사진 ─────────────────────────────────── */}
          <div className="flex flex-col items-center py-2">
            <div className="relative">
              <AvatarImg src={profile?.photoURL || user?.photoURL} name={displayName} size={88} />
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {photoUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {photoUploading ? '업로드 중...' : '카메라 아이콘을 눌러 사진을 변경해요 (최대 5MB)'}
            </p>
          </div>

          {/* ── 기본 정보 ───────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
              <span className="w-1 h-4 rounded-full bg-primary inline-block" />
              기본 정보
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">닉네임</Label>
                <Input
                  value={editNickname}
                  onChange={e => setEditNickname(e.target.value)}
                  placeholder="2~12자 입력"
                  maxLength={12}
                  className="h-11 bg-secondary border-none rounded-xl"
                />
                <p className="text-xs text-muted-foreground text-right">{editNickname.length} / 12</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">독서 좌우명</Label>
                <Input
                  value={editMotto}
                  onChange={e => setEditMotto(e.target.value)}
                  placeholder="나만의 독서 좌우명을 입력해주세요"
                  maxLength={40}
                  className="h-11 bg-secondary border-none rounded-xl"
                />
                <p className="text-xs text-muted-foreground text-right">{editMotto.length} / 40</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">이메일</Label>
                <Input
                  value={email} disabled
                  className="h-11 bg-secondary border-none rounded-xl opacity-60"
                />
                <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다.</p>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full h-11 rounded-xl font-semibold">
                {saving ? <><Loader2 size={16} className="animate-spin mr-2" />저장 중...</> : '저장하기'}
              </Button>
            </div>
          </section>

          {/* ── 보안 설정 ───────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
              <span className="w-1 h-4 rounded-full bg-primary inline-block" />
              보안 설정
            </h2>
            <div className="book-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">비밀번호 변경</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {pwResetSent
                      ? `${email}로 재설정 링크를 보냈어요. 이메일을 확인해주세요.`
                      : '가입 이메일로 비밀번호 재설정 링크를 보내드려요.'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePasswordReset}
                  disabled={sendingReset || pwResetSent}
                  className="flex-shrink-0 rounded-lg text-xs h-9"
                >
                  {sendingReset
                    ? <Loader2 size={13} className="animate-spin" />
                    : pwResetSent ? '전송됨 ✓' : '이메일 전송'}
                </Button>
              </div>
            </div>
          </section>

          {/* ── 계정 관리 ───────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
              <span className="w-1 h-4 rounded-full bg-destructive inline-block" />
              계정 관리
            </h2>
            <div className="book-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">로그아웃</p>
                  <p className="text-xs text-muted-foreground mt-0.5">현재 기기에서 로그아웃해요.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex-shrink-0 rounded-lg text-xs h-9 text-destructive border-destructive/30 hover:bg-destructive/5"
                >
                  {loggingOut ? <Loader2 size={13} className="animate-spin" /> : '로그아웃'}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  // ── 모달 콘텐츠 정의 ───────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);

  const MODAL_CONFIG = {
    // ── 총 도서 ──────────────────────────────────────────────────────────
    books: {
      title: `내 서재 전체 (${totalBooks}권)`,
      content: totalBooks === 0 ? (
        <div className="flex flex-col items-center py-14 gap-3 text-center">
          <BookOpen size={36} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">아직 서재에 책이 없어요</p>
        </div>
      ) : (
        <div className="space-y-6">
          {[
            { status: 'reading', label: '읽는 중',   color: 'text-primary'          },
            { status: 'done',    label: '완독',       color: 'text-amber-500'        },
            { status: 'want',    label: '읽고 싶음',  color: 'text-muted-foreground' },
          ].map(({ status, label, color }) => {
            const books = effectiveShelf.filter(b => b.status === status);
            if (books.length === 0) return null;
            return (
              <div key={status}>
                <p className={`text-xs font-semibold mb-2 ${color}`}>{label} ({books.length})</p>
                <div>
                  {books.map(b => {
                    const pct = b.totalPage ? Math.round((b.currentPage / b.totalPage) * 100) : 0;
                    return (
                      <div key={b.id} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
                        <BookThumb src={b.thumbnail} title={b.title} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold line-clamp-1">{b.title}</p>
                          <p className="text-xs text-muted-foreground">{b.author}</p>
                          {status === 'reading' && b.totalPage > 0 && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ),
    },

    // ── 완독 ─────────────────────────────────────────────────────────────
    done: {
      title: `완독한 책 (${doneCount}권)`,
      content: effectiveShelf.filter(b => b.status === 'done').length === 0 ? (
        <div className="flex flex-col items-center py-14 gap-3 text-center">
          <Award size={36} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">아직 완독한 책이 없어요</p>
        </div>
      ) : (
        <div>
          {effectiveShelf
            .filter(b => b.status === 'done')
            .sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''))
            .map(b => (
              <div key={b.id} className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
                <BookThumb src={b.thumbnail} title={b.title} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1">{b.title}</p>
                  <p className="text-xs text-muted-foreground mb-1.5">{b.author}</p>
                  <StarRow count={b.rating} />
                  {b.endDate && (
                    <p className="text-[11px] text-muted-foreground mt-1">{fmtDate(b.endDate)} 완독</p>
                  )}
                </div>
                <span className="text-xs font-semibold text-amber-500 flex-shrink-0 pt-1">
                  {b.totalPage}p
                </span>
              </div>
            ))}
        </div>
      ),
    },

    // ── 연속 독서 ─────────────────────────────────────────────────────────
    streak: {
      title: '연속 독서 기록',
      content: (
        <div>
          {/* 요약 3가지 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: '현재 연속', value: `${streak}일`,        color: 'text-primary' },
              { label: '최장 연속', value: `${longestStreak}일`, color: 'text-accent-foreground' },
              { label: '이번달 독서일', value: `${thisMonthDays}일`, color: 'text-amber-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-secondary/60 rounded-xl p-3 text-center">
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* 최근 4주 미니 캘린더 */}
          <p className="text-xs font-semibold text-muted-foreground mb-2">최근 4주</p>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['일', '월', '화', '수', '목', '금', '토'].map(d => (
              <div key={d} className="text-center text-[10px] text-muted-foreground">{d}</div>
            ))}
          </div>
          {(() => {
            const firstDay = new Date(last28Days[0]).getDay();
            const cells = [...Array(firstDay).fill(null), ...last28Days];
            return (
              <div className="grid grid-cols-7 gap-1">
                {cells.map((date, i) => {
                  if (!date) return <div key={`pad-${i}`} />;
                  const count   = readCountByDate[date] || 0;
                  const level   = getHeatLevel(count);
                  const isToday = date === today;
                  const day     = new Date(date).getDate();
                  const isHigh  = level >= 3;
                  return (
                    <div
                      key={date}
                      title={`${date}${count ? ` — ${count}권 체크` : ''}`}
                      className={[
                        'aspect-square rounded-full flex items-center justify-center text-[10px] font-medium transition-all duration-200',
                        isToday ? 'ring-2 ring-primary/50 ring-offset-1 shadow-sm' : '',
                        isHigh  ? 'font-semibold' : '',
                      ].join(' ')}
                      style={{
                        backgroundColor: `var(--heatmap-${level})`,
                        color: isHigh
                          ? 'var(--heatmap-text)'
                          : level >= 1
                            ? 'var(--foreground)'
                            : undefined,
                        border: `1px solid color-mix(in oklch, var(--heatmap-${level}) 60%, var(--foreground) 12%)`,
                      }}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            );
          })()}
          {/* 히트맵 범례 */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-[10px] text-muted-foreground">채워진 날은 독서 기록이 있는 날이에요</p>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-muted-foreground/70">적음</span>
              {[0, 1, 2, 3, 4].map(lv => (
                <span
                  key={lv}
                  className="w-2.5 h-2.5 rounded-sm transition-colors duration-200"
                  style={{
                    backgroundColor: `var(--heatmap-${lv})`,
                    border: '1px solid rgba(0,0,0,0.10)',
                  }}
                />
              ))}
              <span className="text-[9px] text-muted-foreground/70">많음</span>
            </div>
          </div>
        </div>
      ),
    },

    // ── 기록 페이지 ───────────────────────────────────────────────────────
    pages: {
      title: `기록한 페이지 (${totalPages.toLocaleString()}p)`,
      content: (
        <div>
          <div className="flex items-baseline gap-1.5 mb-5">
            <p className="text-3xl font-bold text-primary">{totalPages.toLocaleString()}</p>
            <span className="text-base font-semibold text-primary">p</span>
            <span className="text-xs text-muted-foreground ml-1">지금까지 읽은 총 페이지</span>
          </div>
          <div>
            {effectiveShelf
              .filter(b => (b.currentPage || 0) > 0)
              .sort((a, b) => (b.currentPage || 0) - (a.currentPage || 0))
              .map(b => {
                const pct = b.totalPage
                  ? Math.min(100, Math.round((b.currentPage / b.totalPage) * 100))
                  : 0;
                return (
                  <div key={b.id} className="py-3 border-b border-border/30 last:border-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold line-clamp-1 flex-1 mr-3">{b.title}</p>
                      <span className="text-xs font-semibold text-primary flex-shrink-0">
                        {(b.currentPage || 0).toLocaleString()}p
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${pct}%`,
                            backgroundColor: chartColors.current 
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 w-16 text-right">
                        {b.currentPage}/{b.totalPage}p
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ),
    },

    // ── 포인트 ───────────────────────────────────────────────────────────
    points: {
      title: '포인트',
      content: (
        <div>
          <div className="flex items-baseline gap-1.5 mb-6">
            <p className="text-3xl font-bold text-amber-500">{displayPoints.toLocaleString()}</p>
            <span className="text-base font-semibold text-amber-600">P</span>
            <span className="text-xs text-muted-foreground ml-1">누적 포인트</span>
          </div>
          <p className="text-xs font-semibold text-muted-foreground mb-3">적립 방법</p>
          <div>
            {[
              { label: '오늘 독서 체크', pts: 10 },
              { label: '독서 메모 저장', pts: 5 },
              { label: '독서 모임 감상 작성', pts: 5 },
              { label: '자유 게시판 글 작성', pts: 3 },
            ].map(({ label, pts }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
                <p className="text-sm text-foreground/80">{label}</p>
                <span className="text-sm font-bold text-amber-500">+{pts}P</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-5">
            각 활동당 하루 1회 적립돼요
          </p>
        </div>
      ),
    },
  };

  // ── 메인 화면 ──────────────────────────────────────────────────────────
  return (
    <>
      {/* 아바타 + 정보 + 장르 행 (50:50 분할 카드 그리드) */}
      <div className="relative z-10 px-4 mt-8 mb-8 animate-fade-in-up grid grid-cols-2 gap-3.5">
        
        {/* 왼쪽: 아바타와 정보 + 선호 장르 카드 */}
        <div className="bg-card/60 backdrop-blur-md rounded-[1.5rem] p-5 border border-border/50 shadow-sm flex flex-col justify-between h-full min-h-[340px]">
          <div className="flex items-center gap-5 mb-5">
            <AvatarImg src={profile?.photoURL || user?.photoURL} name={displayName} size={110} className="bg-background shadow-xl" />
            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl font-bold leading-tight truncate text-foreground/90 mb-1.5"
                style={{ fontFamily: "'Noto Serif KR', serif" }}
              >
                {displayName}
              </h1>
              <p className="text-sm text-muted-foreground truncate mb-1">{email}</p>
              {joinDate && (
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest truncate">{joinDate} 가입</p>
              )}
            </div>
          </div>

          {/* 선호 장르 섹션 (Left Column) */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Star size={10} className="text-primary fill-primary" />
                <p className="text-[9px] font-black text-primary uppercase tracking-widest">나의 선호 장르</p>
              </div>
              <button
                onClick={() => { setTempGenres(genres); setGenreEditOpen(true); }}
                className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-full bg-secondary/80 hover:bg-secondary"
              >
                <Edit3 size={10} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 content-start">
              {genres.length > 0 ? (
                genres.map(g => {
                  const genreObj = GENRE_LIST.find(item => item.id === g);
                  return (
                    <div key={g} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5 border border-primary/10 rounded-xl shadow-sm transition-all hover:scale-[1.03]">
                      <span className="text-sm">{genreObj?.emoji || '📚'}</span>
                      <span className="text-[11px] font-bold text-foreground/90">{g}</span>
                    </div>
                  );
                })
              ) : (
                <button
                  onClick={() => { setTempGenres([]); setGenreEditOpen(true); }}
                  className="text-[10px] text-primary/70 hover:text-primary font-bold transition-colors text-left w-full p-2.5 bg-primary/5 rounded-xl border border-primary/20 border-dashed"
                >
                  + 선호 장르 추가
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setView('edit')}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl py-2.5 transition-colors shadow-sm"
            aria-label="개인정보 수정"
          >
            <Edit3 size={12} />
            프로필 편집
          </button>
        </div>

        {/* 오른쪽: 포인트 및 도서 레벨 카드 (이전 디자인 복구) */}
        <div className="bg-card/60 backdrop-blur-md rounded-[1.5rem] p-5 border border-border/50 shadow-sm flex flex-col h-full min-h-[340px]">
          {/* 포인트 섹션 */}
          <div 
            className="mb-5 flex-1 cursor-pointer group"
            onClick={() => navigate('/points')}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30">
              <p className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">나의 포인트</p>
              <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-4xl font-black text-amber-600 tracking-tighter">
                {displayPoints.toLocaleString()}
              </span>
              <span className="text-lg font-bold text-amber-500">P</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/5 rounded-xl border border-amber-500/10">
              <span className="text-lg">🎁</span>
              <p className="text-[10px] text-amber-700/80 font-medium leading-tight">
                포인트로 기부에 참여하여<br/>독서의 가치를 나눠보세요
              </p>
            </div>
          </div>

          {/* 도서 레벨 섹션 */}
          <div className="pt-4 border-t border-border/30">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">현재 도서 레벨</p>
              <div className="px-2 py-0.5 bg-primary/10 rounded-full">
                <p className="text-[9px] font-bold text-primary">Lv.{levelInfo.current.level}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl shadow-inner">
                {levelInfo.current.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-foreground/90 truncate" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                  {levelInfo.current.label}
                </p>
                {levelInfo.next && (
                  <p className="text-[10px] text-muted-foreground font-medium truncate">
                    다음 단계까지 <span className="text-primary font-bold">{levelInfo.ptsToNext}P</span> 남음
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-end text-[9px] font-bold text-muted-foreground px-1">
                <span>{levelInfo.current.label}</span>
                {levelInfo.next && <span>{levelInfo.next.label}</span>}
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden shadow-inner p-[0.5px]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${levelInfo.progressPct}%` }}
                  className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 stagger-children pb-8">
        {/* 통계 카드 4개 — 클릭 가능 */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {STAT_CARDS.map(({ key, label, value, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => !shelfLoading && setActiveModal(key)}
              className="book-card p-4 text-center cursor-pointer hover:shadow-md hover:scale-[1.04] transition-all active:scale-[0.97]"
            >
              <Icon size={20} className={`${color} mx-auto mb-1.5`} />
              <p className="text-base font-bold">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </button>
          ))}
        </div>

        {/* 독서 현황 바 차트 + 장르 분포 */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* ── 독서 현황 ── */}
          <div className="book-card p-4 flex flex-col h-full overflow-hidden">
            <h3 className="text-sm font-semibold mb-3">월별 독서량</h3>
            {shelfLoading ? (
              <div className="flex-1 flex items-center justify-center min-h-[220px]">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : totalBooks === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[220px] gap-2">
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
              <div className="flex flex-col flex-1 min-h-0">
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart
                    data={monthlyReadingData}
                    barSize={28}
                    onClick={data => {
                      if (data?.activePayload?.[0]?.payload?.key) {
                        const monthKey = data.activePayload[0].payload.key;
                        setActiveBar(prev => prev === monthKey ? null : monthKey);
                      }
                    }}
                  >
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={CHART_TOOLTIP_STYLE}
                      labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                      itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                      formatter={v => [`${v}권`, '독서량']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} cursor="pointer" minPointSize={6}>
                      {monthlyReadingData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={
                            entry.count === 0
                              ? chartColors.empty
                              : entry.isCurrent
                                ? chartColors.current
                                : chartColors.previous
                          }
                          opacity={activeBar && activeBar !== entry.key ? 0.35 : entry.count === 0 ? 0.65 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* 책 목록 패널 — border 아래 남은 공간 전체 활용, 마우스 휠 스크롤 */}
                <div className="mt-2 border-t border-border/30 h-[126px] flex flex-col min-h-0 overflow-hidden">
                  {activeBar ? (
                    <div className="h-full flex flex-col min-h-0">
                      <p className="pt-1.5 text-[11px] font-semibold text-muted-foreground mb-1 flex-shrink-0">
                        {activeMonthData?.label} · {activeBarBooks.length}권
                      </p>
                      <div className="overflow-y-auto scrollbar-booklist flex-1 min-h-0 pr-2">
                        {activeBarBooks.length === 0 ? (
                          <div className="h-full min-h-[74px] flex flex-col items-center justify-center rounded-lg bg-secondary/30 text-center">
                            <BookOpen size={16} className="text-muted-foreground/50 mb-1" />
                            <p className="text-[11px] font-medium text-muted-foreground">
                              이 달은 독서 기록이 없어요
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 pb-1">
                            {activeBarBooks.map(b => (
                              <div key={b.id} className="flex items-center gap-2.5 min-h-[50px]">
                                <div className="w-[34px] h-[50px] rounded-md flex-shrink-0 overflow-hidden bg-primary/10">
                                  {b.thumbnail
                                    ? <img src={b.thumbnail} alt={b.title} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center"><BookOpen size={16} className="text-primary/50" /></div>
                                  }
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[13px] font-semibold line-clamp-1">{b.title}</p>
                                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{b.author}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center flex-1">
                      <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                        막대를 클릭하면<br />월별 도서 목록을 볼 수 있어요
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── 장르별 독서 비율 ── */}
          <div className="book-card p-4 flex flex-col h-full overflow-hidden">
            <h3 className="text-sm font-semibold mb-2">장르별 독서 비율</h3>
            {genreData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[220px] gap-2">
                <p className="text-sm text-muted-foreground">독서 기록이 없어요</p>
              </div>
            ) : (
              <div className="flex flex-col flex-1">
                {/* 반원 파이차트 — 세그먼트 클릭으로 장르 필터 */}
                <div style={{ height: 96 }}>
                  <ResponsiveContainer width="100%" height={96}>
                    <PieChart>
                      <Pie
                        data={genreData}
                        cx="50%"
                        cy="100%"
                        startAngle={180}
                        endAngle={0}
                        outerRadius={80}
                        innerRadius={42}
                        dataKey="value"
                        paddingAngle={2}
                        cursor="pointer"
                        onClick={(data) => setActiveGenre(data.name)}
                      >
                        {genreData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={chartColors.genres[i % chartColors.genres.length]}
                            opacity={activeGenre && activeGenre !== entry.name ? 0.35 : 1}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                        itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                        formatter={(v, name) => [`${v}권`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* 범례 or 선택 장르 도서 목록 */}
                <div
                  className="mt-2 h-[154px] overflow-x-hidden pr-1"
                >
                  {activeGenre ? (
                    <div className="h-full flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] font-semibold text-muted-foreground">
                          {activeGenre} · {activeGenreBooks.length}권
                        </p>
                        <button
                          onClick={() => setActiveGenre(null)}
                          className="text-[10px] text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          목록으로 ↩
                        </button>
                      </div>
                      <div className="space-y-1.5 overflow-y-auto scrollbar-booklist flex-1 min-h-0 pr-1">
                        {activeGenreBooks.map(b => (
                          <div key={b.id} className="flex items-center gap-2">
                            <div className="w-8 h-10 rounded flex-shrink-0 overflow-hidden bg-primary/10">
                              {b.thumbnail
                                ? <img src={b.thumbnail} alt={b.title} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><BookOpen size={10} className="text-primary/50" /></div>
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold line-clamp-1">{b.title}</p>
                              <p className="text-[10px] text-muted-foreground">{b.author}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-between">
                      {(() => {
                        const total = genreData.reduce((s, g) => s + g.value, 0);
                        return genreData.map((entry, i) => {
                          const pct = Math.round((entry.value / total) * 100);
                          return (
                            <div
                              key={entry.name}
                              className="flex items-center gap-2 cursor-pointer rounded-lg px-1.5 py-1 -mx-1.5 hover:bg-secondary/70 transition-colors"
                              onClick={() => setActiveGenre(entry.name)}
                            >
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ background: GENRE_COLORS[i % GENRE_COLORS.length] }}
                              />
                              <span className="text-[11px] text-muted-foreground flex-1 truncate">{entry.name}</span>
                              <span className="text-[11px] font-semibold text-foreground">{pct}%</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* 포인트 카드 — 카드 클릭 시 /points 이동, 내역 버튼으로 모달 분리 */}
        <div
          className="book-card p-4 mb-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/points')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">나의 포인트</p>
              <p className="text-2xl font-bold text-amber-600">{displayPoints.toLocaleString()}P</p>
              <p className="text-xs text-muted-foreground mt-0.5">포인트로 기부에 참여할 수 있어요</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-3xl">🎁</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </div>
          <div className="flex justify-end mt-2 pt-2 border-t border-border/30">
            <button
              onClick={e => { e.stopPropagation(); setActiveModal('points'); }}
              className="text-[11px] text-amber-600 font-semibold hover:text-amber-700 transition-colors"
            >
              적립 내역 보기 ›
            </button>
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

      {/* 통계 모달 5종 */}
      {Object.entries(MODAL_CONFIG).map(([key, { title, content }]) => (
        <CenterModal
          key={key}
          open={activeModal === key}
          onClose={() => setActiveModal(null)}
          title={title}
        >
          {content}
        </CenterModal>
      ))}

      <CenterModal
        open={genreEditOpen}
        onClose={() => setGenreEditOpen(false)}
        title="선호 장르 수정"
      >
        <div>
          <p className="text-xs text-muted-foreground mb-4">최대 3개까지 선택할 수 있어요</p>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {GENRE_LIST.map(({ id, emoji, label }) => {
              const selected    = tempGenres.includes(id);
              const maxReached  = tempGenres.length >= 3 && !selected;
              return (
                <button
                  key={id}
                  disabled={maxReached}
                  onClick={() =>
                    setTempGenres(prev =>
                      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
                    )
                  }
                  className={`
                    flex flex-col items-center gap-1.5 rounded-xl p-3 border-2 transition-all
                    ${selected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary/40 text-muted-foreground hover:border-primary/50'}
                    ${maxReached ? 'opacity-40 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-[11px] font-medium">{label}</span>
                </button>
              );
            })}
          </div>
          <Button
            onClick={handleSaveGenres}
            disabled={savingGenres || tempGenres.length === 0}
            className="w-full h-11 rounded-xl"
          >
            {savingGenres
              ? <><Loader2 size={15} className="animate-spin mr-2" />저장 중...</>
              : `저장하기 (${tempGenres.length}/3)`}
          </Button>
        </div>
      </CenterModal>
    </>
  );
}
