// Booklog PageLayout — 「따뜻한 라이브러리」
// Web layout: left sidebar + scrollable main content
// react-router-dom v6 중첩 라우트 지원 (<Outlet />)
import { Outlet } from 'react-router-dom';
import SideNav from './SideNav';

export default function PageLayout({ children, showNav = true, className = '' }) {
  if (!showNav) {
    return (
      <div className={`min-h-screen bg-background ${className}`}>
        {children ?? <Outlet />}
      </div>
    );
  }
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SideNav />
      <main className={`flex-1 min-w-0 overflow-y-auto ${className}`}>
        <div className="max-w-5xl w-full">
          {/* 중첩 라우트 페이지 렌더 */}
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
}

