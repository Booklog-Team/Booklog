// Booklog NotFound — 「따뜻한 라이브러리」
// 404 page with warm library aesthetic
// FR-65: 404 페이지
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Home, BookOpen } from "lucide-react";
export default function NotFound() {
    const navigate = useNavigate();
    return (<div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      {/* Decorative book illustration */}
      <div className="relative mb-8">
        <div className="w-32 h-40 bg-secondary rounded-xl shadow-lg flex items-center justify-center mx-auto relative">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary/20 rounded-l-xl"/>
          <div className="text-center px-4">
            <p className="text-5xl font-bold text-primary/20">404</p>
          </div>
        </div>
        <div className="absolute -left-4 top-4 w-10 h-14 bg-accent rounded-md shadow-md rotate-[-15deg]"/>
        <div className="absolute -right-4 bottom-4 w-10 h-14 bg-primary/20 rounded-md shadow-md rotate-[10deg]"/>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-3">
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          찾으시는 페이지가 존재하지 않거나<br />
          이동되었을 수 있습니다.<br />
          책처럼, 다시 처음으로 돌아가볼까요?
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button onClick={() => navigate("/")} className="h-12 text-base font-semibold rounded-xl">
          <Home size={18} className="mr-2"/>
          홈으로 돌아가기
        </Button>
        <Button variant="outline" onClick={() => navigate("/library")} className="h-12 text-base font-semibold rounded-xl">
          <BookOpen size={18} className="mr-2"/>
          서재 보기
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-8">
        Booklog — 독서를 기록하고, 공유하며, 가치를 더하다
      </p>
    </div>);
}
