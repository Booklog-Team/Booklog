// Booklog SideNav — warm library
// Left sidebar navigation: logo, nav items, user info
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, Search, User, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ThemeSelector from './ThemeSelector';

const NAV_ITEMS = [
  { path: '/', label: '홈', icon: Home },
  { path: '/search', label: '검색', icon: Search },
  { path: '/library', label: '내 서재', icon: BookOpen },
  { path: '/community', label: '커뮤니티', icon: Users },
  { path: '/profile', label: '프로필', icon: User },
];

function NavAvatar({ src, name }) {
  const [err, setErr] = useState(false);

  if (!src || err) {
    return (
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
        {(name || '?')[0].toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      onError={() => setErr(true)}
    />
  );
}

export default function SideNav() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const displayName = profile?.nickname || user?.displayName || user?.email?.split('@')[0] || '독서인';
  const points = profile?.totalPoints ?? 0;

  return (
    <aside
      className="w-60 bg-card border-r border-border/60 h-screen sticky top-0 flex flex-col flex-shrink-0 z-50"
      style={{ paddingTop: '28px', paddingBottom: '28px' }}
    >
      <div className="px-6 pb-7 border-b border-border/60 mb-5">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
            <BookOpen size={18} strokeWidth={2.5} />
          </div>
          <div>
            <span className="block font-black text-lg tracking-tighter uppercase leading-none">
              Booklog
            </span>
            <span className="text-[10px] text-muted-foreground font-bold tracking-tight mt-1 block">
              나만의 따뜻한 서재
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive =
            path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

          return (
            <Link
              key={path}
              to={path}
              onClick={() => {
                if (path === '/search' && location.pathname.startsWith('/search')) {
                  window.dispatchEvent(new Event('booklog:reset-search'));
                }
              }}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} className="flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 border-t border-border/60 pt-3 mt-3 flex flex-col gap-0.5">
        <ThemeSelector />
        <Link
          to="/profile"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg hover:bg-secondary transition-colors"
        >
          <NavAvatar src={profile?.photoURL || user?.photoURL} name={displayName} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground">{points.toLocaleString()}P</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
