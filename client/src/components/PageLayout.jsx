// Booklog PageLayout — warm library
// Web layout: left sidebar + scrollable main content
import { Outlet } from 'react-router-dom';
import SideNav from './SideNav';
import WeatherEffects from './WeatherEffects';
import ChatBot from './ChatBot';

export default function PageLayout({ children, showNav = true, className = '' }) {
  if (!showNav) {
    return (
      <div className={`min-h-screen bg-background relative ${className}`}>
        <WeatherEffects />
        {children ?? <Outlet />}
        <ChatBot />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      <WeatherEffects />
      <SideNav />
      <main className={`flex-1 min-w-0 overflow-y-auto ${className}`}>
        <div className="max-w-5xl w-full">
          {children ?? <Outlet />}
        </div>
      </main>
      <ChatBot />
    </div>
  );
}
