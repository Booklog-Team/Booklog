// Booklog BookCard — 「따뜻한 라이브러리」
// Reusable book card with cover, title, author, status, and progress
import { Link } from 'react-router-dom';
const STATUS_LABEL = {
    reading: "읽는 중",
    want: "읽고 싶음",
    done: "완독",
};
const STATUS_CLASS = {
    reading: "status-reading",
    want: "status-want",
    done: "status-done",
};
export default function BookCard({ book, variant = "compact" }) {
    const progress = book.totalPages && book.currentPage
        ? Math.round((book.currentPage / book.totalPages) * 100)
        : null;
    if (variant === "full") {
        return (<Link to={`/book/${book.id}`}>
        <div className="book-card p-4 flex gap-4 active:scale-[0.99] transition-transform">
          <img src={book.cover} alt={book.title} className="w-16 h-24 object-cover rounded-lg shadow-sm flex-shrink-0"/>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm leading-snug line-clamp-2">{book.title}</h3>
              {book.status && (<span className={`tag-pill ${STATUS_CLASS[book.status]} flex-shrink-0`}>
                  {STATUS_LABEL[book.status]}
                </span>)}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
            {progress !== null && (<div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{book.currentPage}p / {book.totalPages}p</span>
                  <span className="text-primary font-medium">{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }}/>
                </div>
              </div>)}
            {book.memo && (<p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">
                "{book.memo}"
              </p>)}
          </div>
        </div>
      </Link>);
    }
    return (<Link to={`/book/${book.id}`}>
      <div className="flex flex-col gap-2 active:scale-[0.97] transition-transform">
        <div className="relative">
          <img src={book.cover} alt={book.title} className="w-full aspect-[2/3] object-cover rounded-lg shadow-md"/>
          {book.status && (<span className={`tag-pill ${STATUS_CLASS[book.status]} absolute top-2 left-2 shadow-sm`}>
              {STATUS_LABEL[book.status]}
            </span>)}
          {progress !== null && (<div className="absolute bottom-0 left-0 right-0 px-1 pb-1">
              <div className="progress-bar bg-black/20">
                <div className="progress-fill bg-white/80" style={{ width: `${progress}%` }}/>
              </div>
            </div>)}
        </div>
        <div>
          <p className="text-xs font-semibold line-clamp-2 leading-snug">{book.title}</p>
          <p className="text-xs text-muted-foreground">{book.author}</p>
        </div>
      </div>
    </Link>);
}
