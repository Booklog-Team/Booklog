// Booklog ReadingTracker
// 독서 진행률, 오늘 독서 체크, 메모 기능
import { useState, useEffect } from "react";
import { Check, BookOpen, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useShelf } from "@/contexts/ShelfContext";
import { usePoint } from "@/contexts/PointContext";

/**
 * ReadingTracker
 * @param {Object} book - 도서 객체
 * @param {string} book.id - 도서 ID
 * @param {number} book.currentPage - 현재 페이지
 * @param {number} book.totalPage - 전체 페이지
 * @param {string} book.memo - 메모
 * @param {Function} onUpdate - 업데이트 콜백
 */
export default function ReadingTracker({ book, onUpdate }) {
  const { updateProgress, updateMemo, checkTodayRead, recordDailyReading } =
    useShelf();
  const { addPoints } = usePoint();

  const [currentPage, setCurrentPage] = useState(book.currentPage || 0);
  const [memo, setMemo] = useState(book.memo || "");
  const [isCheckingToday, setIsCheckingToday] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const progress =
    book.totalPages && currentPage
      ? Math.round((currentPage / book.totalPages) * 100)
      : 0;

  // 오늘 독서 체크 여부 확인
  const today = new Date().toISOString().split("T")[0];
  const isCheckedToday = book.checkedDates?.includes(today);

  const handleCheckToday = async () => {
    if (isCheckedToday) {
      toast.info("오늘은 이미 독서를 체크하셨습니다.");
      return;
    }

    try {
      setIsCheckingToday(true);

      // 오늘 독서 체크
      const isNewCheck = await checkTodayRead(book.id);
      if (isNewCheck) {
        // 일일 통계 기록 (읽은 페이지 수 기반)
        const pagesRead = Math.max(1, currentPage - (book.currentPage || 0));
        await recordDailyReading(today, pagesRead, 1);

        // 포인트 적립
        await addPoints("read");

        toast.success("오늘 독서가 체크되었습니다! 🎉");
        onUpdate?.();
      }
    } catch (err) {
      console.error("독서 체크 실패:", err);
      toast.error("독서 체크에 실패했습니다.");
    } finally {
      setIsCheckingToday(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (currentPage === book.currentPage) return;

    try {
      setIsUpdating(true);
      await updateProgress(book.id, currentPage);
      toast.success("진행률이 업데이트되었습니다.");
      onUpdate?.();
    } catch (err) {
      console.error("진행률 업데이트 실패:", err);
      toast.error("진행률 업데이트에 실패했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateMemo = async () => {
    if (memo === book.memo) return;

    try {
      await updateMemo(book.id, memo);
      toast.success("메모가 저장되었습니다.");
      onUpdate?.();
    } catch (err) {
      console.error("메모 저장 실패:", err);
      toast.error("메모 저장에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BookOpen size={15} className="text-primary" />
            독서 진행률
          </h3>
          <span className="text-sm font-bold text-primary">{progress}%</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1">
            <Input
              type="number"
              value={currentPage}
              onChange={e =>
                setCurrentPage(
                  Math.min(Number(e.target.value), book.totalPages)
                )
              }
              className="h-9 text-center text-sm bg-secondary border-none rounded-lg w-24"
              min={0}
              max={book.totalPages}
            />
            <span className="text-sm text-muted-foreground">
              / {book.totalPage}p
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleUpdateProgress}
            disabled={isUpdating || currentPage === book.currentPage}
            className="px-3"
          >
            {isUpdating ? "저장 중..." : "저장"}
          </Button>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Today Check Section */}
      <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
        <div>
          <p className="text-sm font-semibold mb-1">오늘 독서 체크</p>
          <p className="text-xs text-muted-foreground">
            {isCheckedToday
              ? "오늘 독서를 완료하셨습니다!"
              : "독서를 마치셨나요?"}
          </p>
        </div>
        <Button
          onClick={handleCheckToday}
          disabled={isCheckingToday || isCheckedToday}
          size="sm"
          className={`gap-2 ${isCheckedToday ? "bg-green-500 hover:bg-green-600" : ""}`}
        >
          {isCheckedToday ? (
            <>
              <Check size={14} />
              완료
            </>
          ) : (
            <>
              <Check size={14} />
              {isCheckingToday ? "체크 중..." : "체크"}
            </>
          )}
        </Button>
      </div>

      {/* Memo Section */}
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <PenLine size={15} className="text-primary" />
          독서 메모
        </h3>
        <Textarea
          placeholder="이 책에 대한 생각, 인상 깊은 구절, 느낀 점을 자유롭게 적어보세요..."
          value={memo}
          onChange={e => setMemo(e.target.value)}
          onBlur={handleUpdateMemo}
          className="min-h-24 bg-secondary border-none rounded-xl text-sm resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1.5 text-right">
          {memo.length}자
        </p>
      </div>
    </div>
  );
}
