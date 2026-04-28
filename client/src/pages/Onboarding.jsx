// Booklog Onboarding — 「따뜻한 라이브러리」
// PRD.md §8 01. Onboarding (민서 담당)
// - 장르 카드 8개 표시, 최대 3개 선택
// - Firestore users/{uid}.genres 저장 + isOnboarded: true
// - 건너뛰기 → isOnboarded: true만 저장 후 메인 이동

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

// ─── PRD.md 지정 8개 장르 (이모지 + 라벨) ────────────────
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

const MAX_SELECT = 3;
const ONBOARDING_IMAGE =
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663584969128/K9LDMhfUcVKdtMjF2S9GdE/booklog-onboarding-ZGUFMpZG6CmD4DC9LDrwZa.webp';

// ─── Firestore 업데이트 헬퍼 ─────────────────────────────
async function saveOnboarding(uid, genres) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    genres,
    isOnboarded: true,
  });
}

// ─── 메인 컴포넌트 ────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isOnboarded, refreshProfile } = useAuth();

  // 프로필에서 장르 수정 목적으로 진입한 경우
  const editMode = location.state?.editGenres === true;

  const [step, setStep] = useState(editMode ? 'genre' : 'welcome'); // 'welcome' | 'genre'
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  // 이미 온보딩 완료한 유저가 직접 /onboarding 접근 시 메인으로 리다이렉트
  // (editMode로 진입한 경우는 제외)
  useEffect(() => {
    if (isOnboarded && !editMode) {
      navigate('/', { replace: true });
    }
  }, [isOnboarded, editMode, navigate]);

  // 편집 모드 진입 시 기존 장르 선택값으로 초기화
  useEffect(() => {
    if (editMode && profile?.genres?.length > 0) {
      setSelected(profile.genres);
    }
  }, [editMode, profile]);

  // 장르 토글 (최대 3개 제한)
  const toggleGenre = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((g) => g !== id);
      if (prev.length >= MAX_SELECT) {
        toast.error(`최대 ${MAX_SELECT}개까지 선택할 수 있어요.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  // 완료: 장르 + isOnboarded 저장
  const handleSave = async () => {
    if (selected.length === 0) {
      toast.error('최소 1개 이상의 장르를 선택해주세요.');
      return;
    }
    setSaving(true);
    try {
      await saveOnboarding(user.uid, selected);
      await refreshProfile();
      toast.success(editMode ? '관심 장르가 수정되었습니다!' : '관심 장르가 저장되었습니다! 독서 여정을 시작해요 📚');
      navigate(editMode ? '/profile' : '/', { replace: true });
    } catch (err) {
      console.error('[Onboarding] 저장 실패:', err);
      toast.error('저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  // 건너뛰기: isOnboarded만 true로 저장
  const handleSkip = async () => {
    setSaving(true);
    try {
      await saveOnboarding(user.uid, []);
      await refreshProfile();
      navigate(editMode ? '/profile' : '/', { replace: true });
    } catch (err) {
      console.error('[Onboarding] 건너뛰기 저장 실패:', err);
      navigate(editMode ? '/profile' : '/', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  // ── 웰컴 화면 ──────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div
          className="flex-1 relative overflow-hidden"
          style={{ background: imgError ? 'linear-gradient(160deg, #3d2b1f 0%, #5c3a25 50%, #2c1a0e 100%)' : undefined }}
        >
          {/* 배경 이미지 */}
          {!imgError && (
            <img
              src={ONBOARDING_IMAGE}
              alt="Booklog 온보딩"
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/75" />

          {/* 하단 콘텐츠 */}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white max-w-lg mx-auto w-full">
            {/* 로고 */}
            <div className="flex items-center gap-2 mb-5">
              <BookOpen size={22} className="text-amber-300" />
              <span
                className="text-sm font-medium tracking-widest uppercase text-amber-200"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Booklog
              </span>
            </div>

            <h1
              className="text-3xl font-bold leading-tight mb-3"
            >
              독서를 기록하고,
              <br />공유하며,
              <br />가치를 더하다
            </h1>
            <p className="text-white/80 text-sm leading-relaxed mb-8">
              나만의 독서 여정을 시작하세요.
              <br />
              매일의 기록이 쌓여 특별한 이야기가 됩니다.
            </p>

            <Button
              id="onboarding-start-btn"
              onClick={() => setStep('genre')}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg"
            >
              시작하기
              <ChevronRight size={18} className="ml-1" />
            </Button>

            <button
              onClick={handleSkip}
              disabled={saving}
              className="w-full mt-3 py-3 text-sm text-white/70 hover:text-white transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : '건너뛰기'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 장르 선택 화면 ─────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 헤더 */}
      <div className="px-6 pt-14 pb-6 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={20} className="text-primary" />
          <span
            className="text-xs font-medium text-primary tracking-widest uppercase"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Booklog
          </span>
        </div>
        <h1
          className="text-2xl font-bold text-foreground mb-2"
        >
          어떤 책을 좋아하세요?
        </h1>
        <p className="text-sm text-muted-foreground">
          관심 있는 장르를 선택하면 맞춤 도서를 추천해드려요.
          <br />
          <span className="text-primary font-medium">최대 {MAX_SELECT}개</span>까지 선택할 수 있어요.
        </p>
      </div>

      {/* 장르 그리드 (2×4) */}
      <div className="flex-1 px-6 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 pb-4 stagger-children sm:grid-cols-4">
          {GENRE_LIST.map(({ id, emoji, label }) => {
            const isSelected = selected.includes(id);
            const isDisabled = !isSelected && selected.length >= MAX_SELECT;
            return (
              <button
                key={id}
                id={`genre-btn-${id}`}
                onClick={() => toggleGenre(id)}
                disabled={isDisabled}
                className={[
                  'relative flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-2xl',
                  'text-sm font-semibold transition-all duration-200 border-2',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.03]'
                    : isDisabled
                    ? 'bg-muted text-muted-foreground border-border opacity-40 cursor-not-allowed'
                    : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.02]',
                ].join(' ')}
              >
                {/* 선택 체크 뱃지 */}
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Check size={11} className="text-primary-foreground" />
                  </span>
                )}
                <span className="text-2xl leading-none">{emoji}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 하단 푸터 */}
      <div className="px-6 py-6 bg-background border-t border-border/40">
        {/* 선택 수 표시 + 건너뛰기 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            {/* 선택 인디케이터 점 */}
            {Array.from({ length: MAX_SELECT }).map((_, i) => (
              <span
                key={i}
                className={[
                  'w-2 h-2 rounded-full transition-all duration-300',
                  i < selected.length ? 'bg-primary scale-110' : 'bg-border',
                ].join(' ')}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-2">
              {selected.length > 0 ? (
                <span>
                  <span className="text-primary font-semibold">{selected.length}</span>
                  {' / '}
                  {MAX_SELECT}개 선택됨
                </span>
              ) : (
                '장르를 선택해주세요'
              )}
            </span>
          </div>

          <button
            onClick={handleSkip}
            disabled={saving}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            건너뛰기
          </button>
        </div>

        {/* 완료 버튼 */}
        <Button
          id="onboarding-complete-btn"
          onClick={handleSave}
          disabled={selected.length === 0 || saving}
          className="w-full h-12 text-base font-semibold rounded-xl"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              저장 중...
            </>
          ) : (
            '완료'
          )}
        </Button>
      </div>
    </div>
  );
}
