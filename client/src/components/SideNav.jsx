// Booklog SideNav — 「따뜻한 라이브러리」
// Left sidebar navigation: logo → nav items → user info
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, BookOpen, Users, User } from "lucide-react";
import { MOCK_USER } from "@/lib/mockData";

const NAV_ITEMS = [
    { path: "/", label: "홈", icon: Home },
    { path: "/search", label: "검색", icon: Search },
    { path: "/library", label: "내 서재", icon: BookOpen },
    { path: "/community", label: "커뮤니티", icon: Users },
    { path: "/profile", label: "프로필", icon: User },
];

export default function SideNav() {
    const location = useLocation();
    return (
        <aside className="w-60 bg-card border-r border-border/60 h-screen sticky top-0 flex flex-col flex-shrink-0 z-50" style={{ paddingTop: "28px", paddingBottom: "28px" }}>
            {/* Logo */}
            <div className="px-6 pb-7 border-b border-border/60 mb-5">
                <Link to="/" className="block">
                    <span className="block font-bold text-lg text-primary leading-tight" style={{ fontFamily: "'Noto Serif KR', serif" }}>
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
                    <img
                        src={MOCK_USER.avatar}
                        alt={MOCK_USER.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{MOCK_USER.name}</p>
                        <p className="text-[10px] text-muted-foreground">bookworm</p>
                    </div>
                </Link>
            </div>
        </aside>
    );
}
