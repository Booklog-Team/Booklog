// Booklog Auth — 「따뜻한 라이브러리」
// Login and Register pages
// FR-05~08: 회원가입, 로그인, 로그인 유지, 비회원 접근 제한
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Eye, EyeOff, ArrowLeft, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
export default function Auth() {
    const [, navigate] = useLocation();
    const [mode, setMode] = useState("login");
    const [showPassword, setShowPassword] = useState(false);
    const [keepLogin, setKeepLogin] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === "register" && form.password !== form.confirmPassword) {
            toast.error("비밀번호가 일치하지 않습니다.");
            return;
        }
        toast.success(mode === "login" ? "로그인되었습니다!" : "회원가입이 완료되었습니다!");
        navigate("/onboarding");
    };
    return (<div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4 max-w-md mx-auto w-full">
        <button onClick={() => navigate("/")} className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
          <ArrowLeft size={18}/>
        </button>
        <div className="flex items-center gap-1.5">
          <BookOpen size={18} className="text-primary"/>
          <span className="text-sm font-semibold text-primary tracking-wide" style={{ fontFamily: "'Noto Serif KR', serif" }}>Booklog</span>
        </div>
        <div className="w-9"/>
      </div>

      <div className="flex-1 px-6 pt-4 max-w-md mx-auto w-full">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1.5" style={{ fontFamily: "'Noto Serif KR', serif" }}>
            {mode === "login" ? "다시 만나서 반가워요" : "독서 여정을 시작하세요"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
            ? "로그인하고 나의 독서 기록을 확인하세요."
            : "Booklog와 함께 독서 습관을 만들어보세요."}
          </p>
        </div>

        {/* Tab Switch */}
        <div className="flex bg-secondary rounded-xl p-1 mb-8">
          {["login", "register"].map((m) => (<button key={m} onClick={() => setMode(m)} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${mode === m
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"}`}>
              {m === "login" ? "로그인" : "회원가입"}
            </button>))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up">
          {mode === "register" && (<div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">이름</Label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                <Input id="name" type="text" placeholder="홍길동" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="pl-9 h-11 bg-card border-border/80 rounded-xl" required/>
              </div>
            </div>)}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">이메일</Label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
              <Input id="email" type="email" placeholder="booklog@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="pl-9 h-11 bg-card border-border/80 rounded-xl" required/>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">비밀번호</Label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="8자 이상 입력" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="pl-9 pr-10 h-11 bg-card border-border/80 rounded-xl" required minLength={8}/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          {mode === "register" && (<div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">비밀번호 확인</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="비밀번호를 다시 입력" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} className="pl-9 h-11 bg-card border-border/80 rounded-xl" required/>
              </div>
            </div>)}

          {mode === "login" && (<div className="flex items-center gap-2">
              <Checkbox id="keepLogin" checked={keepLogin} onCheckedChange={(v) => setKeepLogin(!!v)}/>
              <Label htmlFor="keepLogin" className="text-sm text-muted-foreground cursor-pointer">
                로그인 유지
              </Label>
            </div>)}

          <Button type="submit" className="w-full h-12 text-base font-semibold rounded-xl mt-2">
            {mode === "login" ? "로그인" : "회원가입"}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border"/>
          <span className="text-xs text-muted-foreground">또는</span>
          <div className="flex-1 h-px bg-border"/>
        </div>

        {/* Social Login */}
        <button onClick={() => toast.info("소셜 로그인은 준비 중입니다.")} className="w-full h-11 flex items-center justify-center gap-3 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Google로 계속하기
        </button>

        {/* Switch mode */}
        <p className="text-center text-sm text-muted-foreground mt-6 pb-8">
          {mode === "login" ? "아직 계정이 없으신가요? " : "이미 계정이 있으신가요? "}
          <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-primary font-semibold hover:underline">
            {mode === "login" ? "회원가입" : "로그인"}
          </button>
        </p>
      </div>
    </div>);
}
