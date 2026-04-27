// Booklog BottomNav
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, Search, Users, User } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { path: "/",          label: "홈",      icon: Home    },
  { path: "/search",    label: "검색",    icon: Search  },
  { path: "/library",   label: "서재",    icon: BookOpen },
  { path: "/community", label: "커뮤니티", icon: Users   },
  { path: "/profile",   label: "프로필",  icon: User    },
];

export default function BottomNav() {
  const location = useLocation();
  const { user, profile } = useAuth();

  const photoSrc = profile?.photoURL || user?.photoURL || null;
  const initials = (profile?.nickname || user?.displayName || user?.email || '?')[0].toUpperCase();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/60 shadow-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="max-w-[480px] mx-auto flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
          const isProfile = path === "/profile";

          return (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 group"
            >
              <span className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                isActive ? "bg-primary/10 text-primary scale-110" : "text-muted-foreground group-hover:text-foreground"
              }`}>
                {isProfile && photoSrc ? (
                  <img
                    src={photoSrc}
                    alt="프로필"
                    className={`w-7 h-7 rounded-full object-cover flex-shrink-0 ${isActive ? "ring-2 ring-primary ring-offset-1" : "ring-1 ring-border"}`}
                  />
                ) : isProfile ? (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {initials}
                  </div>
                ) : (
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                )}
              </span>
              <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
