// Booklog Meeting.jsx — 독서 모임
// PRD.md §8 08. Meeting
// Firestore: meetings/{id}, meetings/{id}/posts/{id}/comments/{id}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Users, Calendar, BookOpen,
  Send, ChevronRight, Loader2, MessageSquare, Crown,
} from 'lucide-react';
import {
  collection, doc, addDoc, updateDoc, onSnapshot,
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

const EMPTY_MEETING_FORM = {
  title: '', description: '', currentBook: '',
  pageRange: '', deadline: '', maxMembers: '10',
};

// ─── 메인 컴포넌트 ────────────────────────────────────────
export default function Meeting() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const myName = profile?.nickname || user?.email?.split('@')[0] || '독서인';

  const [view, setView]                   = useState('list');
  const [meetings, setMeetings]           = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [posts, setPosts]                 = useState([]);
  const [selectedPost, setSelectedPost]   = useState(null);
  const [comments, setComments]           = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [loadingPosts, setLoadingPosts]   = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [meetingForm, setMeetingForm]     = useState(EMPTY_MEETING_FORM);
  const [postContent, setPostContent]     = useState('');
  const [commentText, setCommentText]     = useState('');

  // 모임 목록 실시간 구독
  useEffect(() => {
    const q = query(collection(db, 'meetings'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q,
      snap => {
        setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadingMeetings(false);
      },
      () => setLoadingMeetings(false)
    );
    return unsub;
  }, []);

  // 선택된 모임의 게시글 실시간 구독
  useEffect(() => {
    if (!selectedMeeting?.id) return;
    setLoadingPosts(true);
    const q = query(
      collection(db, 'meetings', selectedMeeting.id, 'posts'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingPosts(false);
    });
    return unsub;
  }, [selectedMeeting?.id]);

  // 선택된 게시글의 댓글 실시간 구독
  useEffect(() => {
    if (!selectedMeeting?.id || !selectedPost?.id) return;
    const q = query(
      collection(db, 'meetings', selectedMeeting.id, 'posts', selectedPost.id, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [selectedMeeting?.id, selectedPost?.id]);

  // 모임 참여 / 나가기
  async function handleJoinToggle() {
    if (!user || !selectedMeeting) return;
    const isJoined = selectedMeeting.members?.includes(user.uid);
    const ref = doc(db, 'meetings', selectedMeeting.id);
    try {
      await updateDoc(ref, {
        members: isJoined ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
      setSelectedMeeting(prev => ({
        ...prev,
        members: isJoined
          ? prev.members.filter(id => id !== user.uid)
          : [...(prev.members || []), user.uid],
      }));
      toast.success(isJoined ? '모임에서 나왔습니다.' : '모임에 참여했습니다! 🎉');
    } catch {
      toast.error('처리 중 오류가 발생했어요.');
    }
  }

  // 모임 생성
  async function handleCreateMeeting() {
    if (!meetingForm.title.trim() || !meetingForm.currentBook.trim()) return;
    setSubmitting(true);
    try {
      const ref = await addDoc(collection(db, 'meetings'), {
        title:       meetingForm.title.trim(),
        description: meetingForm.description.trim(),
        currentBook: meetingForm.currentBook.trim(),
        pageRange:   meetingForm.pageRange.trim(),
        deadline:    meetingForm.deadline,
        maxMembers:  Number(meetingForm.maxMembers) || 10,
        hostUid:     user.uid,
        hostName:    myName,
        members:     [user.uid],
        createdAt:   serverTimestamp(),
      });
      toast.success('모임이 개설됐어요! 🎉');
      setMeetingForm(EMPTY_MEETING_FORM);
      setView('list');
    } catch {
      toast.error('모임 생성에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  // 게시글 작성
  async function handleCreatePost() {
    if (!postContent.trim() || !selectedMeeting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'meetings', selectedMeeting.id, 'posts'), {
        content:    postContent.trim(),
        authorUid:  user.uid,
        authorName: myName,
        createdAt:  serverTimestamp(),
      });
      toast.success('게시글이 등록됐어요!');
      setPostContent('');
      setView('detail');
    } catch {
      toast.error('게시글 작성에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  }

  // 댓글 작성
  async function handleAddComment() {
    if (!commentText.trim() || !selectedMeeting || !selectedPost) return;
    const text = commentText.trim();
    setCommentText('');
    try {
      await addDoc(
        collection(db, 'meetings', selectedMeeting.id, 'posts', selectedPost.id, 'comments'),
        {
          content:    text,
          authorUid:  user.uid,
          authorName: myName,
          createdAt:  serverTimestamp(),
        }
      );
    } catch {
      toast.error('댓글 작성에 실패했어요.');
      setCommentText(text);
    }
  }

  // ── 뷰별 렌더 ────────────────────────────────────────────

  // 모임 생성 폼
  if (view === 'create-meeting') {
    return (
      <>
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button
            onClick={() => setView('list')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold">모임 만들기</h1>
        </div>
        <div className="px-4 pb-10 space-y-4 max-w-2xl">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">모임 이름 *</p>
            <Input
              placeholder="예) 한강 소설 읽기 모임"
              value={meetingForm.title}
              onChange={e => setMeetingForm(p => ({ ...p, title: e.target.value }))}
              className="h-11 bg-secondary border-none rounded-xl"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">모임 소개</p>
            <Textarea
              placeholder="어떤 모임인지 소개해주세요"
              value={meetingForm.description}
              onChange={e => setMeetingForm(p => ({ ...p, description: e.target.value }))}
              className="min-h-24 bg-secondary border-none rounded-xl resize-none"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">현재 읽는 책 *</p>
            <Input
              placeholder="예) 채식주의자 — 한강"
              value={meetingForm.currentBook}
              onChange={e => setMeetingForm(p => ({ ...p, currentBook: e.target.value }))}
              className="h-11 bg-secondary border-none rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">읽을 범위</p>
              <Input
                placeholder="예) p.1 ~ 120"
                value={meetingForm.pageRange}
                onChange={e => setMeetingForm(p => ({ ...p, pageRange: e.target.value }))}
                className="h-11 bg-secondary border-none rounded-xl"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">마감일</p>
              <Input
                type="date"
                value={meetingForm.deadline}
                onChange={e => setMeetingForm(p => ({ ...p, deadline: e.target.value }))}
                className="h-11 bg-secondary border-none rounded-xl"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">최대 인원</p>
            <Input
              type="number"
              min="2"
              max="50"
              value={meetingForm.maxMembers}
              onChange={e => setMeetingForm(p => ({ ...p, maxMembers: e.target.value }))}
              className="h-11 bg-secondary border-none rounded-xl"
            />
          </div>
          <Button
            onClick={handleCreateMeeting}
            disabled={!meetingForm.title.trim() || !meetingForm.currentBook.trim() || submitting}
            className="w-full h-11 rounded-xl font-semibold"
          >
            {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            모임 개설하기
          </Button>
        </div>
      </>
    );
  }

  // 게시글 작성 폼
  if (view === 'create-post') {
    return (
      <>
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button
            onClick={() => setView('detail')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold">감상 공유하기</h1>
        </div>
        <div className="px-4 pb-10 space-y-4 max-w-2xl">
          <div className="book-card p-4 flex items-center gap-3">
            <BookOpen size={16} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">현재 모임 도서</p>
              <p className="text-sm font-semibold">{selectedMeeting?.currentBook}</p>
            </div>
          </div>
          <Textarea
            placeholder="이 책을 읽으며 느낀 점을 자유롭게 나눠요..."
            value={postContent}
            onChange={e => setPostContent(e.target.value)}
            className="min-h-48 bg-secondary border-none rounded-xl resize-none"
          />
          <Button
            onClick={handleCreatePost}
            disabled={!postContent.trim() || submitting}
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
  if (view === 'post-detail' && selectedPost) {
    return (
      <>
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button
            onClick={() => setView('detail')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold flex-1 line-clamp-1">감상 글</h1>
        </div>
        <div className="px-4 pb-10 max-w-2xl">
          {/* 게시글 본문 */}
          <div className="book-card p-5 mb-4">
            <div className="flex items-center gap-2.5 mb-4">
              <Avatar name={selectedPost.authorName} />
              <div>
                <p className="text-sm font-semibold">{selectedPost.authorName}</p>
                <p className="text-xs text-muted-foreground">{formatTs(selectedPost.createdAt)}</p>
              </div>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {selectedPost.content}
            </p>
          </div>

          {/* 댓글 목록 */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-3">
              댓글 {comments.length}개
            </h3>
            {comments.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                첫 댓글을 남겨보세요 💬
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2.5">
                    <Avatar name={c.authorName} size={8} />
                    <div className="flex-1 bg-secondary/60 rounded-xl px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">{c.authorName}</span>
                        <span className="text-[11px] text-muted-foreground">{formatTs(c.createdAt)}</span>
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

  // 모임 상세
  if (view === 'detail' && selectedMeeting) {
    const isJoined  = selectedMeeting.members?.includes(user?.uid);
    const isHost    = selectedMeeting.hostUid === user?.uid;
    const memberCount = selectedMeeting.members?.length ?? 0;

    return (
      <>
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button
            onClick={() => setView('list')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold flex-1 line-clamp-1">{selectedMeeting.title}</h1>
        </div>

        <div className="px-4 pb-10 max-w-2xl">
          {/* 모임 헤더 카드 */}
          <div className="book-card p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              {isHost && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-500/10 rounded-full px-2 py-0.5">
                  <Crown size={10} /> 모임장
                </span>
              )}
              {isJoined && !isHost && (
                <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  참여 중
                </span>
              )}
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ fontFamily: "'Noto Serif KR', serif" }}
            >
              {selectedMeeting.title}
            </h2>
            {selectedMeeting.description && (
              <p className="text-sm text-muted-foreground mb-4">{selectedMeeting.description}</p>
            )}

            <div className="grid grid-cols-2 gap-2.5 mb-4 sm:grid-cols-4">
              {[
                { icon: BookOpen,  label: '현재 도서', value: selectedMeeting.currentBook || '—' },
                { icon: BookOpen,  label: '읽을 범위', value: selectedMeeting.pageRange   || '—' },
                { icon: Calendar,  label: '마감일',    value: selectedMeeting.deadline     || '—' },
                { icon: Users,     label: '멤버',      value: `${memberCount}/${selectedMeeting.maxMembers}명` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-secondary/60 rounded-xl p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Icon size={11} className="text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                  <p className="text-xs font-semibold truncate">{value}</p>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                <span>모임 인원</span>
                <span>{Math.round((memberCount / selectedMeeting.maxMembers) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, (memberCount / selectedMeeting.maxMembers) * 100)}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              모임장: <span className="font-semibold text-foreground">{selectedMeeting.hostName}</span>
            </p>

            {!isHost && (
              <Button
                onClick={handleJoinToggle}
                variant={isJoined ? 'outline' : 'default'}
                className="w-full h-11 rounded-xl font-semibold"
              >
                {isJoined ? '모임 나가기' : '모임 참여하기'}
              </Button>
            )}
          </div>

          {/* 감상 게시글 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">감상 공유</h3>
              {isJoined && (
                <button
                  onClick={() => setView('create-post')}
                  className="flex items-center gap-1 text-xs text-primary font-medium"
                >
                  <Plus size={13} /> 작성
                </button>
              )}
            </div>

            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <Loader2 size={22} className="animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <div className="book-card p-8 flex flex-col items-center text-center">
                <p className="text-3xl mb-2">📝</p>
                <p className="text-sm font-semibold mb-1">아직 감상 글이 없어요</p>
                <p className="text-xs text-muted-foreground">
                  {isJoined ? '첫 감상을 공유해보세요!' : '모임에 참여하고 감상을 공유해보세요'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <button
                    key={post.id}
                    onClick={() => { setSelectedPost(post); setView('post-detail'); }}
                    className="w-full text-left book-card p-4 hover:bg-secondary/60 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={post.authorName} size={7} />
                      <span className="text-xs font-semibold">{post.authorName}</span>
                      <span className="text-[11px] text-muted-foreground ml-auto">
                        {formatTs(post.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <MessageSquare size={12} />
                      <span>댓글 보기</span>
                      <ChevronRight size={12} className="ml-auto" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // 모임 목록 (메인)
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
            독서 모임
          </h1>
        </div>
        <button
          onClick={() => setView('create-meeting')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} /> 모임 만들기
        </button>
      </div>

      <div className="px-4 pb-10">
        {loadingMeetings ? (
          <div className="flex justify-center pt-16">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <p className="text-5xl mb-4">📚</p>
            <p className="text-base font-semibold mb-2">아직 개설된 모임이 없어요</p>
            <p className="text-sm text-muted-foreground mb-6">
              첫 번째 독서 모임을 만들어보세요!
            </p>
            <Button onClick={() => setView('create-meeting')} className="rounded-xl px-6">
              모임 만들기
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 stagger-children">
            {meetings.map(meeting => {
              const isJoined    = meeting.members?.includes(user?.uid);
              const memberCount = meeting.members?.length ?? 0;
              const isFull      = memberCount >= meeting.maxMembers;
              return (
                <div
                  key={meeting.id}
                  onClick={() => { setSelectedMeeting(meeting); setView('detail'); }}
                  className="book-card p-5 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {isJoined && (
                          <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                            참여 중
                          </span>
                        )}
                        {isFull && (
                          <span className="text-[10px] font-semibold text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                            마감
                          </span>
                        )}
                      </div>
                      <h3
                        className="font-bold text-sm leading-snug mb-1"
                        style={{ fontFamily: "'Noto Serif KR', serif" }}
                      >
                        {meeting.title}
                      </h3>
                      {meeting.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {meeting.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
                  </div>

                  <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                    <BookOpen size={12} />
                    <span className="truncate">{meeting.currentBook}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span>{memberCount}/{meeting.maxMembers}명</span>
                    </div>
                    {meeting.deadline && (
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>~{meeting.deadline}</span>
                      </div>
                    )}
                  </div>

                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (memberCount / meeting.maxMembers) * 100)}%` }}
                    />
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
