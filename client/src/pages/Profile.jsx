// Booklog Profile — 「따뜻한 라이브러리」
// Profile: user info, reading stats, edit, logout
// FR-54~57: 사용자 정보, 독서 통계, 프로필 수정, 로그아웃
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Edit3, BookOpen, Flame, TrendingUp, Award, ChevronRight, ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PageLayout from "@/components/PageLayout";
import { MOCK_USER, MOCK_BOOKS } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
const PROFILE_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663584969128/K9LDMhfUcVKdtMjF2S9GdE/booklog-profile-bg-Sfmo955ETw2dHjqsmMB9Wh.webp";
const MONTHLY_DATA = [
    { month: "11월", books: 2 },
    { month: "12월", books: 3 },
    { month: "1월", books: 4 },
    { month: "2월", books: 2 },
    { month: "3월", books: 5 },
    { month: "4월", books: 3 },
];
const GENRE_DATA = [
    { genre: "소설", count: 12 },
    { genre: "인문", count: 5 },
    { genre: "철학", count: 4 },
    { genre: "역사", count: 2 },
    { genre: "기타", count: 1 },
];
export default function Profile() {
    const navigate = useNavigate();
    const [view, setView] = useState("main");
    const [editForm, setEditForm] = useState({ name: MOCK_USER.name, bio: MOCK_USER.bio });
    const doneBooks = MOCK_BOOKS.filter(b => b.status === "done").length;
    if (view === "edit") {
        return (<PageLayout>
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button onClick={() => setView("main")} className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft size={18}/>
          </button>
          <h1 className="text-lg font-bold">프로필 수정</h1>
        </div>
        <div className="px-4 animate-fade-in-up space-y-5 max-w-lg pb-8">
          {/* Avatar */}
          <div className="flex flex-col items-center py-4">
            <div className="relative">
              <img src={MOCK_USER.avatar} alt={MOCK_USER.name} className="w-24 h-24 rounded-full object-cover border-4 border-card shadow-md"/>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md">
                <Camera size={14}/>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">이름</Label>
            <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="h-11 bg-secondary border-none rounded-xl"/>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">한 줄 소개</Label>
            <Textarea value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} className="bg-secondary border-none rounded-xl resize-none" rows={3}/>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">이메일</Label>
            <Input value="booklog@example.com" disabled className="h-11 bg-secondary border-none rounded-xl opacity-60"/>
          </div>

          <Button onClick={() => { toast.success("프로필이 수정되었습니다!"); setView("main"); }} className="w-full h-11 rounded-xl font-semibold">
            저장하기
          </Button>
        </div>
      </PageLayout>);
    }
    return (<PageLayout>
      {/* Profile Header with background */}
      <div className="relative mt-6 mx-4 rounded-2xl overflow-hidden">
        <img src={PROFILE_BG} alt="프로필 배경" className="w-full h-44 object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90"/>
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => setView("edit")} className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
            <Edit3 size={16}/>
          </button>
          <button onClick={() => toast.info("설정 기능은 준비 중입니다.")} className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
            <Settings size={16}/>
          </button>
        </div>
      </div>

      {/* Avatar & Name */}
      <div className="px-4 -mt-10 mb-6 animate-fade-in-up">
        <div className="flex items-end gap-4 mb-3">
          <img src={MOCK_USER.avatar} alt={MOCK_USER.name} className="w-20 h-20 rounded-full object-cover border-4 border-background shadow-lg"/>
          <div className="pb-1">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              {MOCK_USER.name}
            </h1>
            <p className="text-xs text-muted-foreground">{MOCK_USER.joinDate} 가입</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{MOCK_USER.bio}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {MOCK_USER.favoriteGenres.map(g => (<span key={g} className="tag-pill bg-secondary text-secondary-foreground text-xs">{g}</span>))}
        </div>
      </div>

      <div className="px-4 stagger-children pb-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "읽은 책", value: `${MOCK_USER.totalBooks}권`, icon: BookOpen, color: "text-primary" },
            { label: "완독", value: `${doneBooks}권`, icon: Award, color: "text-amber-500" },
            { label: "연속", value: `${MOCK_USER.streak}일`, icon: Flame, color: "text-orange-500" },
            { label: "페이지", value: `${(MOCK_USER.totalPages / 1000).toFixed(1)}k`, icon: TrendingUp, color: "text-accent-foreground" },
        ].map(({ label, value, icon: Icon, color }) => (<div key={label} className="book-card p-4 text-center">
              <Icon size={20} className={`${color} mx-auto mb-1.5`}/>
              <p className="text-base font-bold">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>))}
        </div>

        {/* Two-column layout: Chart + Genre */}
        <div className="grid grid-cols-1 gap-5 mb-5 lg:grid-cols-2">
          {/* Monthly Reading Chart */}
          <div className="book-card p-4">
            <h3 className="text-sm font-semibold mb-4">월별 독서량</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={MONTHLY_DATA} barSize={28}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9C8B7A" }} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}권`, "독서"]}/>
                <Bar dataKey="books" radius={[6, 6, 0, 0]}>
                  {MONTHLY_DATA.map((_, i) => (<Cell key={i} fill={i === MONTHLY_DATA.length - 1 ? "var(--color-primary)" : "var(--color-secondary)"}/>))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Genre Distribution */}
          <div className="book-card p-4">
            <h3 className="text-sm font-semibold mb-4">장르 분포</h3>
            <div className="space-y-3">
              {GENRE_DATA.map(({ genre, count }) => {
            const pct = Math.round((count / MOCK_USER.totalBooks) * 100);
            return (<div key={genre} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-12 flex-shrink-0">{genre}</span>
                    <div className="flex-1 progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }}/>
                    </div>
                    <span className="text-xs font-medium text-primary w-8 text-right">{pct}%</span>
                  </div>);
        })}
            </div>
          </div>
        </div>

        {/* Points & Donation */}
        <div className="book-card p-4 mb-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/points")}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">나의 포인트</p>
              <p className="text-2xl font-bold text-amber-600">{MOCK_USER.points.toLocaleString()}P</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                총 <span className="text-primary font-semibold">{MOCK_USER.donationTotal}권</span> 기부 완료
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl">🎁</span>
              <ChevronRight size={16} className="text-muted-foreground ml-auto mt-1"/>
            </div>
          </div>
        </div>

        {/* Settings Menu */}
        <div className="book-card mb-5 overflow-hidden">
          {[
            { label: "알림 설정", icon: "🔔" },
            { label: "개인정보 처리방침", icon: "🔒" },
            { label: "이용약관", icon: "📋" },
            { label: "앱 버전", icon: "ℹ️", value: "1.0.0" },
        ].map(({ label, icon, value }) => (<button key={label} onClick={() => toast.info(`${label} 기능은 준비 중입니다.`)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/50 transition-colors border-b border-border/40 last:border-0">
              <span className="flex items-center gap-3 text-sm">
                <span>{icon}</span>
                {label}
              </span>
              <span className="text-xs text-muted-foreground">{value ?? <ChevronRight size={14}/>}</span>
            </button>))}
        </div>

        {/* Logout */}
        <Button variant="outline" onClick={() => { toast.success("로그아웃되었습니다."); navigate("/auth"); }} className="w-full h-11 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5">
          <LogOut size={16} className="mr-2"/>
          로그아웃
        </Button>
      </div>
    </PageLayout>);
}
