// Booklog Onboarding — 「따뜻한 라이브러리」
// Genre selection with warm library aesthetic
// FR-01~04: 관심 장르 선택, 저장, 건너뛰기, 추천 반영
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, BookOpen } from "lucide-react";
import { GENRES } from "@/lib/mockData";
import { toast } from "sonner";
const ONBOARDING_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663584969128/K9LDMhfUcVKdtMjF2S9GdE/booklog-onboarding-ZGUFMpZG6CmD4DC9LDrwZa.webp";
export default function Onboarding() {
    const [, navigate] = useLocation();
    const [selected, setSelected] = useState([]);
    const [step, setStep] = useState("welcome");
    const toggleGenre = (genre) => {
        setSelected(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
    };
    const handleSave = () => {
        if (selected.length === 0) {
            toast.error("최소 1개 이상의 장르를 선택해주세요.");
            return;
        }
        toast.success("관심 장르가 저장되었습니다!");
        navigate("/");
    };
    const handleSkip = () => {
        navigate("/");
    };
    if (step === "welcome") {
        return (<div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 relative overflow-hidden">
          <img src={ONBOARDING_IMAGE} alt="Booklog 온보딩" className="absolute inset-0 w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70"/>
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={24} className="text-amber-300"/>
              <span className="text-sm font-medium tracking-widest uppercase text-amber-200">Booklog</span>
            </div>
            <h1 className="text-3xl font-bold leading-tight mb-3" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              독서를 기록하고,<br />공유하며,<br />가치를 더하다
            </h1>
            <p className="text-white/80 text-sm leading-relaxed mb-8">
              나만의 독서 여정을 시작하세요.<br />
              매일의 기록이 쌓여 특별한 이야기가 됩니다.
            </p>
            <Button onClick={() => setStep("genre")} className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg">
              시작하기
              <ChevronRight size={18} className="ml-1"/>
            </Button>
            <button onClick={handleSkip} className="w-full mt-3 py-3 text-sm text-white/70 hover:text-white transition-colors">
              건너뛰기
            </button>
          </div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={20} className="text-primary"/>
          <span className="text-xs font-medium text-primary tracking-widest uppercase">Booklog</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "'Noto Serif KR', serif" }}>
          어떤 책을 좋아하세요?
        </h1>
        <p className="text-sm text-muted-foreground">
          관심 있는 장르를 선택하면 맞춤 도서를 추천해드려요.
        </p>
      </div>

      {/* Genre Grid */}
      <div className="flex-1 px-6 overflow-y-auto">
        <div className="grid grid-cols-3 gap-2.5 pb-4 stagger-children">
          {GENRES.map((genre) => {
            const isSelected = selected.includes(genre);
            return (<button key={genre} onClick={() => toggleGenre(genre)} className={`relative flex items-center justify-center py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200 border ${isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                    : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-primary/5"}`}>
                {isSelected && (<Check size={12} className="absolute top-1.5 right-1.5 text-primary-foreground/80"/>)}
                {genre}
              </button>);
        })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 bg-background border-t border-border/40">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            {selected.length > 0 ? (<span className="text-primary font-medium">{selected.length}개</span>) : "0개"} 선택됨
          </span>
          <button onClick={handleSkip} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            건너뛰기
          </button>
        </div>
        <Button onClick={handleSave} disabled={selected.length === 0} className="w-full h-12 text-base font-semibold rounded-xl">
          완료
        </Button>
      </div>
    </div>);
}
