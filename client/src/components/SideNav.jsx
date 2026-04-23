// Booklog SideNav — 「따뜻한 라이브러리」
// Left sidebar navigation: logo → nav items → user info
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, BookOpen, Users, User } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
    { path: "/", label: "홈", icon: Home },
    { path: "/search", label: "검색", icon: Search },
    { path: "/library", label: "내 서재", icon: BookOpen },
    { path: "/community", label: "커뮤니티", icon: Users },
    { path: "/profile", label: "프로필", icon: User },
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
        <aside className="w-60 bg-card border-r border-border/60 h-screen sticky top-0 flex flex-col flex-shrink-0 z-50" style={{ paddingTop: "28px", paddingBottom: "28px" }}>
            {/* Logo */}
            <div className="px-6 pb-7 border-b border-border/60 mb-5">
                <Link href="/" className="block">
                    <span className="block font-bold text-lg text-primary leading-tight" style={{ fontFamily: "'DM Mono', monospace" }}>
                        Booklog
                    </span>
                    <span className="text-[11px] text-muted-foreground tracking-wide mt-0.5 block">
                        나만의 디지털 서재
                    </span>
                </Link>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-3 flex flex-col gap-0.5">
                {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
                    const isActive =
                        path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
                    return (
                        <Link
                            key={path}
                            to={path}
                            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                                isActive
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                        >
                            <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} className="flex-shrink-0" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* User info */}
            <div className="px-3 pt-5 border-t border-border/60 mt-5">
                <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg hover:bg-secondary transition-colors"
                >
                    <NavAvatar src={user?.photoURL} name={displayName} />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                        <p className="text-[10px] text-muted-foreground">{points.toLocaleString()}P</p>
                    </div>
                </Link>
            </div>
        </aside>
    );
}
