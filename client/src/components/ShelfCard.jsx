// Booklog ShelfCard
// 서재 도서 카드: 표지, 진행률, 마지막 읽은 날, 상태 표시
import { useState } from "react";
import { Trash2, MoreVertical, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

/**
 * ShelfCard
 * @param {Object} book - 서재 도서 객체
 * @param {string} book.id - 도서 ID
 * @param {string} book.title - 도서 제목
 * @param {string} book.author - 저자
 * @param {string} book.thumbnail - 표지 이미지 URL
 * @param {string} book.status - 'want' | 'reading' | 'done'
 * @param {number} book.currentPage - 현재 페이지
 * @param {number} book.totalPage - 전체 페이지
 * @param {string} book.lastReadDate - 마지막 읽은 날 (YYYY-MM-DD)
 * @param {string} book.memo - 메모
 * @param {Function} onStatusChange - 상태 변경 콜백
 * @param {Function} onDelete - 삭제 콜백
 * @param {Function} onClick - 클릭 콜백
 * @param {string} variant - 'list' | 'grid' (기본값: 'list')
 */
export default function ShelfCard({
  book,
  onStatusChange,
  onDelete,
  onClick,
  variant = "list",
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const progress =
    book.totalPage && book.currentPage
      ? Math.round((book.currentPage / book.totalPage) * 100)
      : 0;

  const statusColors = {
    reading: { bg: "bg-blue-50", text: "text-blue-700", label: "읽는 중" },
    want: { bg: "bg-amber-50", text: "text-amber-700", label: "읽고 싶음" },
    done: { bg: "bg-green-50", text: "text-green-700", label: "완독" },
  };

  const statusStyle = statusColors[book.status] || statusColors.want;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(book.id);
      toast.success(`"${book.title}"이 서재에서 삭제되었습니다.`);
    } catch (err) {
      toast.error("삭제에 실패했습니다.");
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async newStatus => {
    try {
      await onStatusChange(book.id, newStatus);
      const statusLabel =
        newStatus === "reading"
          ? "읽는 중"
          : newStatus === "done"
            ? "완독"
            : "읽고 싶음";
      toast.success(`"${book.title}"을(를) ${statusLabel}으로 변경했습니다.`);
    } catch (err) {
      toast.error("상태 변경에 실패했습니다.");
      console.error(err);
    }
  };

  // Grid variant (compact)
  if (variant === "grid") {
    return (
      <div className="relative group cursor-pointer" onClick={onClick}>
        <div className="relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow bg-secondary/30">
          <img
            src={book.thumbnail || "/placeholder.png"}
            alt={book.title}
            className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {book.status === "done" ? (
              <Check size={32} className="text-white" />
            ) : (
              <div className="text-center">
                <p className="text-white text-xs font-semibold mb-1">
                  {progress}%
                </p>
                <p className="text-white/80 text-[10px]">
                  {book.currentPage}p / {book.totalPage}p
                </p>
              </div>
            )}
          </div>
          {/* Status badge */}
          <div
            className={`absolute top-2 right-2 ${statusStyle.bg} ${statusStyle.text} text-[10px] font-semibold px-2 py-1 rounded-md`}
          >
            {statusStyle.label}
          </div>
        </div>
      </div>
    );
  }

  // List variant (full)
  return (
    <div
      className="p-4 rounded-lg bg-card border border-border/50 hover:border-border transition-colors group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex gap-4">
        {/* Cover image */}
        <div className="relative flex-shrink-0">
          <img
            src={book.thumbnail || "/placeholder.png"}
            alt={book.title}
            className="w-24 h-32 object-cover rounded-lg shadow-sm"
          />
          <div
            className={`absolute -right-2 -top-2 ${statusStyle.bg} ${statusStyle.text} text-[10px] font-bold px-2 py-1 rounded-full`}
          >
            {book.status === "reading" ? (
              <span>🔄</span>
            ) : book.status === "done" ? (
              <span>✓</span>
            ) : (
              <span>♡</span>
            )}
          </div>
        </div>

        {/* Info section */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <p
              className={`text-xs font-semibold mb-1 ${statusStyle.text} uppercase tracking-wide`}
            >
              {statusStyle.label}
            </p>
            <h3
              className="font-bold text-base leading-snug mb-0.5 line-clamp-2"
              style={{ fontFamily: "'Noto Serif KR', serif" }}
            >
              {book.title}
            </h3>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
              {book.author}
            </p>

            {/* Progress bar */}
            {book.status === "reading" && (
              <div className="space-y-1.5 mb-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {book.currentPage}p / {book.totalPage}p
                  </span>
                  <span className="font-bold text-primary">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Last read date */}
            {book.lastReadDate && (
              <p className="text-xs text-muted-foreground">
                마지막 읽음:{" "}
                {new Date(book.lastReadDate).toLocaleDateString("ko-KR")}
              </p>
            )}

            {/* Memo */}
            {book.memo && (
              <p className="text-xs text-muted-foreground mt-2 italic line-clamp-1">
                "{book.memo}"
              </p>
            )}
          </div>
        </div>

        {/* Action menu */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  handleStatusChange("reading");
                }}
                disabled={book.status === "reading"}
              >
                읽는 중으로 변경
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  handleStatusChange("done");
                }}
                disabled={book.status === "done"}
              >
                완독으로 변경
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  handleStatusChange("want");
                }}
                disabled={book.status === "want"}
              >
                읽고 싶음으로 변경
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 size={14} className="mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
