// Booklog Community — 커뮤니티 허브
// /community → 독서 모임 or 자유게시판 선택
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, ChevronRight } from 'lucide-react';

const MENUS = [
  {
    path:  '/community/meeting',
    icon:  Users,
    label: '독서 모임',
    desc:  '같은 책을 읽는 사람들과 감상을 나눠요',
    bg:    'bg-primary/10',
    fg:    'text-primary',
  },
  {
    path:  '/community/board',
    icon:  MessageSquare,
    label: '자유 게시판',
    desc:  '독서에 관한 모든 이야기를 나눠요',
    bg:    'bg-accent',
    fg:    'text-accent-foreground',
  },
];

export default function Community() {
  const navigate = useNavigate();

  return (
    <>
      <div className="px-4 pt-8 pb-4">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Noto Serif KR', serif" }}
        >
          커뮤니티
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          독서 仲間들과 함께해요
        </p>
      </div>

      <div className="px-4 pt-2 space-y-3">
        {MENUS.map(({ path, icon: Icon, label, desc, bg, fg }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="w-full text-left book-card p-5 flex items-center gap-4 hover:shadow-md transition-all"
          >
            <div className={`w-14 h-14 rounded-2xl ${bg} ${fg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={26} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-base font-bold mb-0.5"
                style={{ fontFamily: "'Noto Serif KR', serif" }}
              >
                {label}
              </p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </div>
    </>
  );
}
