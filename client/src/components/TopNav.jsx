// Booklog TopNav — 「따뜻한 라이브러리」
// Web top navigation bar with logo, nav links, and notification bell
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, Search, Users, User, Bell } from "lucide-react";

const NAV_ITEMS = [
    { path: "/", label: "홈", icon: Home },
    { path: "/search", label: "검색", icon: Search },
    { path: "/library", label: "서재", icon: BookOpen },
    { path: "/community", label: "커뮤니티", icon: Users },
    { path: "/profile", label: "프로필", icon: User },
];

export default function TopNav() {
    const location = useLocation();
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/60 shadow-sm">
            <div className="max-w-5xl mx-auto flex items-center justify-between h-16 px-6">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                    <BookOpen size={20} className="text-primary" />
                    <span className="font-bold text-xl" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                        Booklog
                    </span>
                </Link>

                {/* Nav Links */}
                <nav className="flex items-center gap-0.5">
                    {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
                        const isActive =
                            path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
                        return (
                            <Link
                                key={path}
                                to={path}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                }`}
                            >
                                <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Notification */}
                <button className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                    <Bell size={18} />
                </button>
            </div>
        </header>
    );
}
