// Booklog — PrivateRoute
// 비로그인 사용자의 보호 라우트 접근 차단
// PRD.md §5 라우팅 구조 참조: <Route element={<PrivateRoute />}> 패턴
//
// ⚠️  현재 App.jsx 는 wouter 기반이지만,
//     PRD.md는 React Router DOM v6 기반으로 명시하고 있습니다.
//     이 파일은 React Router DOM v6의 <Outlet> 패턴으로 작성됩니다.
//     App.jsx를 React Router DOM으로 전환할 때 바로 연결하세요.
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * PrivateRoute
 *
 * 사용 방법 (App.jsx):
 * ```jsx
 * <Route element={<PrivateRoute />}>
 *   <Route element={<PageLayout />}>
 *     <Route path="/" element={<Main />} />
 *     ...
 *   </Route>
 * </Route>
 * ```
 *
 * 동작 흐름:
 * 1. 인증 상태 확인 중(loading) → 로딩 스피너 표시
 * 2. 미로그인 → /auth 로 리다이렉트 (현재 경로를 state로 전달)
 * 3. 로그인 완료 → <Outlet /> 렌더 (중첩 라우트 진입 허용)
 */
function PrivateRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 초기 인증 상태 확인 중: 스피너 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        {/* 테라코타 링 스피너 */}
        <span className="block w-10 h-10 rounded-full border-4 border-secondary border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">
          로그인 상태 확인 중…
        </p>
      </div>
    );
  }

  // 미로그인: /auth 로 리다이렉트
  // state.from 에 원래 경로를 저장해 두면 로그인 후 되돌아올 수 있다.
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 로그인 완료: 중첩 라우트 허용
  return <Outlet />;
}

export default PrivateRoute;
