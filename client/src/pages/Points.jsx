// Booklog Points — 「따뜻한 라이브러리」
// Points and donation system
// FR-58~64: 활동 기반 포인트, 하루 1회, 중복 방지, 포인트 누적, 기부 환산, 시각화
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Flame, BookOpen, MessageSquare, Star, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MOCK_USER } from "@/lib/mockData";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
const POINT_ACTIVITIES = [
    { label: "독서 기록", points: 10, icon: BookOpen, earned: true, desc: "오늘 완료" },
    { label: "댓글 작성", points: 5, icon: MessageSquare, earned: true, desc: "오늘 완료" },
    { label: "독후감 작성", points: 20, icon: Star, earned: false, desc: "아직 미완료" },
    { label: "연속 독서 7일", points: 50, icon: Flame, earned: false, desc: "5일 더 필요" },
];
const DONATION_ORGS = [
    { id: "1", name: "어린이 도서관 지원", description: "소외 지역 어린이들에게 책을 선물합니다", pointsNeeded: 500, icon: "📚", donated: 1 },
    { id: "2", name: "독서 장학금", description: "경제적 어려움을 겪는 학생들의 독서 활동을 지원합니다", pointsNeeded: 1000, icon: "🎓", donated: 0 },
    { id: "3", name: "노인 독서 프로그램", description: "어르신들의 독서 모임과 책 구입을 지원합니다", pointsNeeded: 300, icon: "👴", donated: 2 },
];
const PIE_DATA = [
    { name: "독서 기록", value: 600, color: "#B85C38" },
    { name: "댓글/게시글", value: 350, color: "#4A7C59" },
    { name: "연속 독서", value: 200, color: "#D4A853" },
    { name: "기타", value: 100, color: "#E8DDD0" },
];
export default function Points() {
    const navigate = useNavigate();
    const [donating, setDonating] = useState(null);
    const handleDonate = (orgId, points) => {
        if (MOCK_USER.points < points) {
            toast.error("포인트가 부족합니다.");
            return;
        }
        toast.success("기부가 완료되었습니다! 🎉 독서로 세상을 바꿔요.");
        setDonating(null);
    };
    return (<>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-8 pb-4">
        <button onClick={() => navigate("/profile")} className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
          <ArrowLeft size={18}/>
        </button>
        <h1 className="text-xl font-bold">포인트 & 기부</h1>
      </div>

      <div className="px-4 pb-10 stagger-children">
        {/* Points Balance Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 mb-6 text-white">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10"/>
          <div className="absolute -right-2 bottom-0 w-20 h-20 rounded-full bg-white/5"/>
          <p className="text-sm text-white/80 mb-1">나의 포인트</p>
          <p className="text-5xl font-bold mb-1">{MOCK_USER.points.toLocaleString()}<span className="text-2xl ml-1">P</span></p>
          <p className="text-sm text-white/70">총 {MOCK_USER.donationTotal}권 기부에 참여했어요 🎁</p>
          <div className="mt-4 flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
            <Info size={14} className="text-white/70"/>
            <p className="text-xs text-white/80">포인트는 하루 1회, 활동당 1회만 적립됩니다</p>
          </div>
        </div>

        {/* Two-column: Activities + Chart */}
        <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
          {/* Point Earning Activities */}
          <div>
            <h2 className="text-sm font-semibold mb-3">오늘의 포인트 활동</h2>
            <div className="space-y-2">
              {POINT_ACTIVITIES.map(({ label, points, icon: Icon, earned, desc }) => (<div key={label} className={`book-card p-3.5 flex items-center gap-3 ${earned ? "opacity-60" : ""}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${earned ? "bg-secondary" : "bg-primary/10"}`}>
                    <Icon size={18} className={earned ? "text-muted-foreground" : "text-primary"}/>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${earned ? "text-muted-foreground line-through" : "text-amber-600"}`}>
                      +{points}P
                    </p>
                    {earned && <p className="text-[10px] text-muted-foreground">완료</p>}
                  </div>
                </div>))}
            </div>
          </div>

          {/* Points Distribution Chart */}
          <div className="book-card p-4">
            <h2 className="text-sm font-semibold mb-4">포인트 적립 현황</h2>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" strokeWidth={0}>
                    {PIE_DATA.map((entry, i) => (<Cell key={i} fill={entry.color}/>))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}P`, ""]}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {PIE_DATA.map(({ name, value, color }) => (<div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }}/>
                      <span className="text-xs text-muted-foreground">{name}</span>
                    </div>
                    <span className="text-xs font-semibold">{value}P</span>
                  </div>))}
              </div>
            </div>
          </div>
        </div>

        {/* Donation Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Gift size={16} className="text-primary"/>
            <h2 className="text-sm font-semibold">포인트로 기부하기</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            독서 활동으로 모은 포인트를 사회적 가치로 환산할 수 있어요.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {DONATION_ORGS.map(org => (<div key={org.id} className="book-card p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{org.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold mb-0.5">{org.name}</h3>
                    <p className="text-xs text-muted-foreground">{org.description}</p>
                    {org.donated > 0 && (<p className="text-xs text-primary mt-1">이미 {org.donated}회 기부했어요 ✨</p>)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">필요 포인트 </span>
                    <span className="text-sm font-bold text-amber-600">{org.pointsNeeded.toLocaleString()}P</span>
                  </div>
                  <Button size="sm" onClick={() => handleDonate(org.id, org.pointsNeeded)} disabled={MOCK_USER.points < org.pointsNeeded} className="h-8 px-4 text-xs rounded-lg">
                    기부하기
                  </Button>
                </div>
              </div>))}
          </div>
        </div>

        {/* Point History */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3">포인트 내역</h2>
          <div className="book-card overflow-hidden">
            {[
            { label: "독서 기록", date: "2024-04-20", points: "+10", type: "earn" },
            { label: "댓글 작성", date: "2024-04-20", points: "+5", type: "earn" },
            { label: "어린이 도서관 기부", date: "2024-04-15", points: "-500", type: "donate" },
            { label: "연속 독서 7일", date: "2024-04-14", points: "+50", type: "earn" },
            { label: "독후감 작성", date: "2024-04-13", points: "+20", type: "earn" },
        ].map((item, i) => (<div key={i} className="flex items-center justify-between px-4 py-3.5 border-b border-border/40 last:border-0">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <span className={`text-sm font-bold ${item.type === "earn" ? "text-primary" : "text-muted-foreground"}`}>
                  {item.points}P
                </span>
              </div>))}
          </div>
        </div>
      </div>
    </>);
}
