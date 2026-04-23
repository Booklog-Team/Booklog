import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Star } from "lucide-react";

const STATUS_LABEL = { reading: "읽는 중", want: "읽고 싶음", done: "완독" };
const STATUS_CLASS = {
  reading: "status-reading",
  want: "status-want",
  done: "status-done",
};

// 커버 이미지 URL 결정
// 알라딘: book._cover (직접 https URL)
// 목업: book.cover
function resolveCover(book) {
  return book._cover || book.cover || null;
}

function CoverImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className={`${className} bg-secondary/70 flex items-center justify-center`}
      >
        <BookOpen size={20} className="text-muted-foreground/30" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function BookCard({ book, variant = "compact" }) {
  const id = book.id;
  const info = book.volumeInfo || {};
  const title = info.title || book.title || "제목 없음";
  const author = info.authors
    ? info.authors.join(", ")
    : book.author || "저자 정보 없음";
  const cover = resolveCover(book);
  const totalPages = info.pageCount || book.totalPages;
  const currentPage = book.currentPage || 0;
  const progress =
    totalPages && currentPage
      ? Math.round((currentPage / totalPages) * 100)
      : null;

  if (variant === "full") {
    const publisher = info.publisher;
    const year = info.publishedDate ? info.publishedDate.split("-")[0] : null;
    const pageCount = info.pageCount;
    const category = info.categories?.[0];
    const rating = book._rating || 0;

    return (
      <Link to={`/book/${id}`}>
        <div className="book-card p-4 flex gap-4 active:scale-[0.99] transition-transform cursor-pointer">
          <CoverImage
            src={cover}
            alt={title}
            className="w-16 h-24 object-cover rounded-lg shadow-sm flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <h3 className="font-semibold text-sm leading-snug line-clamp-2">
                {title}
              </h3>
              {book.status && (
                <span
                  className={`tag-pill ${STATUS_CLASS[book.status]} flex-shrink-0`}
                >
                  {STATUS_LABEL[book.status]}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
              {author}
            </p>
            {(publisher || year || pageCount) && (
              <p className="text-[11px] text-muted-foreground/70 line-clamp-1 mb-1">
                {[publisher, year, pageCount ? `${pageCount}p` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {(category || rating > 0) && (
              <div className="flex items-center gap-2 mb-2">
                {category && (
                  <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-md text-muted-foreground">
                    {category}
                  </span>
                )}
                {rating > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                    <span className="text-[11px] font-medium text-amber-600">
                      {rating.toFixed(1)}
                    </span>
                  </span>
                )}
              </div>
            )}
            {progress !== null && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {currentPage}p / {totalPages}p
                  </span>
                  <span className="text-primary font-medium">{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            {book.memo && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">
                "{book.memo}"
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/book/${id}`}>
      <div className="flex flex-col gap-2 active:scale-[0.97] transition-transform cursor-pointer">
        <div className="relative">
          <CoverImage
            src={cover}
            alt={title}
            className="w-full aspect-[2/3] object-cover rounded-lg shadow-md"
          />
          {book.status && (
            <span
              className={`tag-pill ${STATUS_CLASS[book.status]} absolute top-2 left-2 shadow-sm`}
            >
              {STATUS_LABEL[book.status]}
            </span>
          )}
          {progress !== null && (
            <div className="absolute bottom-0 left-0 right-0 px-1 pb-1">
              <div className="progress-bar bg-black/20">
                <div
                  className="progress-fill bg-white/80"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold line-clamp-2 leading-snug">
            {title}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1">{author}</p>
        </div>
      </div>
    </Link>
  );
}
