// Booklog Board.jsx — 자유 게시판
// PRD.md §8 09. Board
// Firestore: board/{id}, board/{id}/comments/{id}
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Plus, Heart, MessageSquare,
  Send, Loader2, ChevronRight, Trash2,
} from 'lucide-react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, orderBy, serverTimestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// ─── 헬퍼 ────────────────────────────────────────────────
function formatTs(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)   return '방금 전';
  if (diffMin < 60)  return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)    return `${diffH}시간 전`;
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

function Avatar({ name, size = 8 }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0`}
    >
      {(name || '?')[0]}
    </div>
  );
}

const CATEGORIES = ['전체', '자유', '독후감', '질문'];
const CAT_STYLE = {
  '자유':   { bg: 'bg-secondary',    text: 'text-secondary-foreground' },
  '독후감': { bg: 'bg-primary/10',   text: 'text-primary' },
  '질문':   { bg: 'bg-accent',       text: 'text-accent-foreground' },
};

// ─── 메인 컴포넌트 ────────────────────────────────────────
export default function Board() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const myName = profile?.nickname || user?.email?.split('@')[0] || '독서인';

  const [view, setView]                 = useState('list');
  const [posts, setPosts]               = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [comments, setComments]         = useState([]);

  // onSnapshot이 posts를 갱신할 때 selectedPost도 자동 최신화
  const selectedPost = posts.find(p => p.id === selectedPostId) ?? null;
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [filterCat, setFilterCat]     = useState('전체');
  const [commentText, setCommentText] = useState('');
  const [newPost, setNewPost]         = useState({ title: '', content: '', category: '자유' });

  // Community.jsx에서 navigation state로 넘어온 경우 처리
  useEffect(() => {
    const state = location.state;
    if (!state) return;
    if (state.view === 'create') {
      setView('create');
    } else if (state.view === 'detail' && state.postId) {
      setSelectedPostId(state.postId);
      setView('detail');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 게시글 실시간 구독
  useEffect(() => {
    const q = query(collection(db, 'board'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q,
      snap => {
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadingPosts(false);
      },
      () => setLoadingPosts(false)
    );
    return unsub;
  }, []);

  // 댓글 실시간 구독
  useEffect(() => {
    if (!selectedPostId) return;
    const q = query(
      collection(db, 'board', selectedPostId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [selectedPostId]);

  const filteredPosts = filterCat === '전체'
    ? posts
    : posts.filter(p => p.category === filterCat);

  // 좋아요 토글
  async function handleLike(post, e) {
    e.stopPropagation();
    if (!user) return;
    const liked = post.likes?.includes(user.uid);
    const ref = doc(db, 'board', post.id);
    try {
      await updateDoc(ref, {
        likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
    } catch {
      toast.error('처리 중 오류가 발생했어요.');
    }
  }

  // 게시글 작성
  async function handleCreatePost() {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'board'), {
        title:      newPost.title.trim(),
        content:    newPost.content.trim(),
        category:   newPost.category,
        authorUid:  user.uid,
        authorName: myName,
        likes:      [],
        createdAt:  serverTimestamp(),
      });
      toast.success('게시글이 등록됐어요!');
      setNewPost({ title: '', content: '', category: '자유' });
      setView('list');
    } catch {
      toast.error('게시글 작성에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  }

  // 게시글 삭제
  async function handleDeletePost() {
    if (!window.confirm('게시글을 삭제할까요?')) return;
    try {
      await deleteDoc(doc(db, 'board', selectedPostId));
      toast.success('게시글이 삭제됐어요.');
      setSelectedPostId(null);
      setView('list');
    } catch {
      toast.error('삭제 중 오류가 발생했어요.');
    }
  }

  // 댓글 삭제
  async function handleDeleteComment(commentId) {
    try {
      await deleteDoc(doc(db, 'board', selectedPostId, 'comments', commentId));
      toast.success('댓글이 삭제됐어요.');
    } catch {
      toast.error('삭제 중 오류가 발생했어요.');
    }
  }

  // 댓글 작성
  async function handleAddComment() {
    if (!commentText.trim() || !selectedPostId) return;
    const text = commentText.trim();
    setCommentText('');
    try {
      await addDoc(collection(db, 'board', selectedPostId, 'comments'), {
        content:    text,
        authorUid:  user.uid,
        authorName: myName,
        createdAt:  serverTimestamp(),
      });
    } catch {
      toast.error('댓글 작성에 실패했어요.');
      setCommentText(text);
    }
  }

  // ── 뷰별 렌더 ────────────────────────────────────────────

  // 게시글 작성
  if (view === 'create') {
    return (
      <>
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button
            onClick={() => setView('list')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold">게시글 작성</h1>
        </div>
        <div className="px-4 pb-10 space-y-4 max-w-2xl">
          {/* 카테고리 선택 */}
          <div className="flex gap-2">
            {['자유', '독후감', '질문'].map(cat => (
              <button
                key={cat}
                onClick={() => setNewPost(p => ({ ...p, category: cat }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  newPost.category === cat
                    ? `${CAT_STYLE[cat].bg} ${CAT_STYLE[cat].text} font-semibold`
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <Input
            placeholder="제목을 입력하세요"
            value={newPost.title}
            onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
            className="h-11 bg-secondary border-none rounded-xl"
          />
          <Textarea
            placeholder="내용을 입력하세요..."
            value={newPost.content}
            onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
            className="min-h-52 bg-secondary border-none rounded-xl resize-none"
          />
          <Button
            onClick={handleCreatePost}
            disabled={!newPost.title.trim() || !newPost.content.trim() || submitting}
            className="w-full h-11 rounded-xl font-semibold"
          >
            {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            게시하기
          </Button>
        </div>
      </>
    );
  }

  // 게시글 상세
  if (view === 'detail' && selectedPost) {
    const isLiked     = selectedPost.likes?.includes(user?.uid);
    const likeCount   = selectedPost.likes?.length ?? 0;
    const catStyle    = CAT_STYLE[selectedPost.category] ?? CAT_STYLE['자유'];
    const isAuthor    = selectedPost.authorUid === user?.uid;

    return (
      <>
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button
            onClick={() => setView('list')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold flex-1 line-clamp-1">게시글</h1>
          {isAuthor && (
            <button
              onClick={handleDeletePost}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="px-4 pb-10 max-w-2xl">
          {/* 본문 */}
          <div className="mb-5">
            <span className={`inline-block text-[10px] font-semibold ${catStyle.bg} ${catStyle.text} rounded-full px-2.5 py-1 mb-3`}>
              {selectedPost.category}
            </span>
            <h2
              className="text-xl font-bold mb-3 leading-snug"
              style={{ fontFamily: "'Noto Serif KR', serif" }}
            >
              {selectedPost.title}
            </h2>
            <div className="flex items-center gap-2.5 mb-4">
              <Avatar name={selectedPost.authorName} />
              <div>
                <p className="text-sm font-medium">{selectedPost.authorName}</p>
                <p className="text-xs text-muted-foreground">{formatTs(selectedPost.createdAt)}</p>
              </div>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {selectedPost.content}
            </p>

            {/* 좋아요 */}
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border/40">
              <button
                onClick={e => handleLike(selectedPost, e)}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'
                }`}
              >
                <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                <span>{likeCount}</span>
              </button>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MessageSquare size={16} />
                <span>{comments.length}</span>
              </span>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="border-t border-border/40 pt-4 mb-4">
            <h3 className="text-sm font-semibold mb-3">댓글 {comments.length}개</h3>
            {comments.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                첫 댓글을 남겨보세요 💬
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2.5">
                    <Avatar name={c.authorName} size={8} />
                    <div className="flex-1 bg-secondary/60 rounded-xl px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">{c.authorName}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground">{formatTs(c.createdAt)}</span>
                          {c.authorUid === user?.uid && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-muted-foreground/40 hover:text-destructive transition-colors"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 댓글 입력 */}
          <div className="flex gap-2 pb-4">
            <Input
              placeholder="댓글을 입력하세요..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
              className="flex-1 h-10 bg-secondary border-none rounded-xl text-sm"
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </>
    );
  }

  // 게시판 목록 (메인)
  return (
    <>
      <div className="flex items-center justify-between px-4 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/community')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Noto Serif KR', serif" }}>
            자유 게시판
          </h1>
        </div>
        <button
          onClick={() => {
            setNewPost(p => ({ ...p, category: filterCat !== '전체' ? filterCat : '자유' }));
            setView('create');
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} /> 글쓰기
        </button>
      </div>

      <div className="px-4 pb-10">
        {/* 카테고리 필터 */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterCat === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loadingPosts ? (
          <div className="flex justify-center pt-16">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-base font-semibold mb-2">
              {filterCat === '전체' ? '아직 게시글이 없어요' : `${filterCat} 글이 없어요`}
            </p>
            <p className="text-sm text-muted-foreground mb-6">첫 글을 작성해보세요!</p>
            <Button
              onClick={() => {
                setNewPost(p => ({ ...p, category: filterCat !== '전체' ? filterCat : '자유' }));
                setView('create');
              }}
              className="rounded-xl px-6"
            >
              글쓰기
            </Button>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {filteredPosts.map(post => {
              const isLiked      = post.likes?.includes(user?.uid);
              const likeCount    = post.likes?.length ?? 0;
              const commentCount = post.commentCount ?? 0;
              const catStyle     = CAT_STYLE[post.category] ?? CAT_STYLE['자유'];
              return (
                <div
                  key={post.id}
                  onClick={() => { setSelectedPostId(post.id); setView('detail'); }}
                  className="book-card p-4 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={post.authorName} size={9} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold truncate">{post.authorName}</span>
                        <span className={`flex-shrink-0 text-[10px] font-semibold ${catStyle.bg} ${catStyle.text} rounded-full px-2 py-0.5`}>
                          {post.category}
                        </span>
                        <span className="text-[11px] text-muted-foreground ml-auto flex-shrink-0">
                          {formatTs(post.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold mb-1.5 line-clamp-1">{post.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2.5">
                        <button
                          onClick={e => handleLike(post, e)}
                          className={`flex items-center gap-1 text-xs transition-colors ${
                            isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'
                          }`}
                        >
                          <Heart size={12} fill={isLiked ? 'currentColor' : 'none'} />
                          <span>{likeCount}</span>
                        </button>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare size={12} />
                          <span>{commentCount}</span>
                        </span>
                        <ChevronRight size={14} className="text-muted-foreground ml-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
