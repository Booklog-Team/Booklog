// Booklog Auth — 「따뜻한 라이브러리」
// PRD.md §8 02. Auth (민서 담당)
// - 이메일/비밀번호 로그인 · 회원가입
// - Google 소셜 로그인
// - React Hook Form + zod 유효성 검사
// - 로그인 성공 → isOnboarded 확인 → 온보딩 or 메인

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, ArrowLeft, Mail, Lock, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginWithEmail, registerWithEmail, loginWithGoogle } from '@/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { auth as fbAuth, db } from '@/firebase/config';

// ─── Zod 스키마 ───────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
});

const registerSchema = z
  .object({
    nickname: z
      .string()
      .min(2, '닉네임은 2자 이상이어야 합니다.')
      .max(12, '닉네임은 12자 이하로 입력해주세요.'),
    email: z.string().email('올바른 이메일 형식을 입력해주세요.'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

// ─── Google 로고 SVG ──────────────────────────────────────
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

// ─── 인라인 에러 메시지 ────────────────────────────────────
function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

// ─── 메인 컴포넌트 ────────────────────────────────────────
export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // React Hook Form (스키마는 mode에 따라 교체)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema),
    mode: 'onBlur',
  });

  /** 로그인 성공 후 리다이렉트 처리 */
  const redirectAfterAuth = async () => {
    await refreshProfile();
    const snap = await getDoc(doc(db, 'users', fbAuth.currentUser.uid));
    const isOnboarded = snap.exists() ? snap.data().isOnboarded : false;

    // 온보딩 미완료면 항상 온보딩 먼저 (from 경로 무시)
    if (!isOnboarded) {
      navigate('/onboarding', { replace: true });
      return;
    }

    // 로그인 전 접근하려 했던 페이지가 있으면 그곳으로
    const from = location.state?.from?.pathname;
    if (from && from !== '/auth') {
      navigate(from, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  /** 이메일 로그인/회원가입 제출 */
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(data.email, data.password);
        toast.success('환영합니다! 다시 만나서 반가워요 📚');
      } else {
        await registerWithEmail(data.email, data.password, data.nickname);
        toast.success('회원가입 완료! 독서 여정을 시작해봐요 🎉');
      }
      await redirectAfterAuth();
    } catch (err) {
      const msg = firebaseErrorMessage(err.code);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /** Google 소셜 로그인 */
  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Google 로그인 성공! 📚');
      await redirectAfterAuth();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(firebaseErrorMessage(err.code));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  /** 모드 전환 시 폼 리셋 */
  const switchMode = (next) => {
    setMode(next);
    reset();
    setShowPw(false);
    setShowConfirm(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── 상단 헤더 ── */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4 max-w-md mx-auto w-full">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          aria-label="뒤로가기"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-1.5">
          <BookOpen size={18} className="text-primary" />
          <span
            className="text-sm font-semibold text-primary tracking-wide"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Booklog
          </span>
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 px-6 pt-2 max-w-md mx-auto w-full">
        {/* ── 타이틀 ── */}
        <div className="mb-8 animate-fade-in-up">
          <h1
            className="text-2xl font-bold mb-1.5"
          >
            {mode === 'login' ? '다시 만나서 반가워요' : '독서 여정을 시작하세요'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'login'
              ? '로그인하고 나의 독서 기록을 확인하세요.'
              : 'Booklog와 함께 독서 습관을 만들어보세요.'}
          </p>
        </div>

        {/* ── 탭 스위치 ── */}
        <div className="flex bg-secondary rounded-xl p-1 mb-8">
          {(['login', 'register']).map((m) => (
            <button
              key={m}
              id={`tab-${m}`}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === m
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* ── 폼 ── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 animate-fade-in-up"
          noValidate
        >
          {/* 닉네임 (회원가입만) */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <Label htmlFor="nickname" className="text-sm font-medium">
                닉네임
              </Label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="nickname"
                  type="text"
                  placeholder="홍길동"
                  {...register('nickname')}
                  className="pl-9 h-11 bg-card border-border/80 rounded-xl"
                />
              </div>
              <FieldError message={errors.nickname?.message} />
            </div>
          )}

          {/* 이메일 */}
          <div className="space-y-1.5">
            <Label htmlFor="auth-email" className="text-sm font-medium">
              이메일
            </Label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="auth-email"
                type="email"
                placeholder="booklog@example.com"
                {...register('email')}
                className="pl-9 h-11 bg-card border-border/80 rounded-xl"
              />
            </div>
            <FieldError message={errors.email?.message} />
          </div>

          {/* 비밀번호 */}
          <div className="space-y-1.5">
            <Label htmlFor="auth-password" className="text-sm font-medium">
              비밀번호
            </Label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="auth-password"
                type={showPw ? 'text' : 'password'}
                placeholder="8자 이상 입력"
                {...register('password')}
                className="pl-9 pr-10 h-11 bg-card border-border/80 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <FieldError message={errors.password?.message} />
          </div>

          {/* 비밀번호 확인 (회원가입만) */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <Label htmlFor="auth-confirm" className="text-sm font-medium">
                비밀번호 확인
              </Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="비밀번호를 다시 입력"
                  {...register('confirmPassword')}
                  className="pl-9 pr-10 h-11 bg-card border-border/80 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError message={errors.confirmPassword?.message} />
            </div>
          )}

          {/* 제출 버튼 */}
          <Button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base font-semibold rounded-xl mt-2"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : null}
            {mode === 'login' ? '로그인' : '회원가입'}
          </Button>
        </form>

        {/* ── 구분선 ── */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ── Google 로그인 ── */}
        <button
          id="auth-google-btn"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full h-11 flex items-center justify-center gap-3 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors disabled:opacity-60"
        >
          {googleLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <GoogleLogo />
          )}
          Google로 계속하기
        </button>

        {/* ── 모드 전환 링크 ── */}
        <p className="text-center text-sm text-muted-foreground mt-6 pb-8">
          {mode === 'login' ? '아직 계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
          <button
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="text-primary font-semibold hover:underline"
          >
            {mode === 'login' ? '회원가입' : '로그인'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Firebase 에러 코드 → 한국어 메시지 ───────────────────
function firebaseErrorMessage(code) {
  const map = {
    'auth/user-not-found': '등록되지 않은 이메일입니다.',
    'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
    'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
    'auth/weak-password': '비밀번호가 너무 단순합니다. 더 강력한 비밀번호를 사용해주세요.',
    'auth/too-many-requests': '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
    'auth/network-request-failed': '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
    'auth/popup-blocked': '팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.',
  };
  return map[code] ?? `오류가 발생했습니다. (${code ?? 'unknown'})`;
}
