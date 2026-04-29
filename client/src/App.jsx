// Booklog App — 「따뜻한 라이브러리」
// PRD.md §5 라우팅 구조 기반 (react-router-dom v6)
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import PageLayout from './components/PageLayout';
// Pages
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';
import Search from './pages/Search';
import BookDetail from './pages/BookDetail';
import Library from './pages/Library';
import Community from './pages/Community';
import Meeting from './pages/Meeting';
import Board from './pages/Board';
import Profile from './pages/Profile';
import Points from './pages/Points';
import Presentation from './pages/Presentation';
import NotFound from './pages/NotFound';

import { WeatherProvider } from './contexts/WeatherContext';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <WeatherProvider>
          <TooltipProvider>
            <Toaster position="top-center" richColors />
            <Routes>
              {/* 비로그인 접근 가능 */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/presentation" element={<Presentation />} />

              {/* 로그인 필수 (PrivateRoute) */}
              <Route element={<PrivateRoute />}>
                {/* 온보딩: 풀스크린, 네비 없음 */}
                <Route path="/onboarding" element={<Onboarding />} />
                <Route element={<PageLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/book/:id" element={<BookDetail />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/community/meeting" element={<Meeting />} />
                  <Route path="/community/board" element={<Board />} />
                  <Route path="/points" element={<Points />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </WeatherProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

