// Booklog Meeting.jsx — 독서 모임
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Plus, Users, Calendar, BookOpen,
  Send, ChevronRight, Loader2, MessageSquare, Crown, Trash2,
  Megaphone, Pencil, ChevronDown,
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
import { usePoint } from '@/contexts/PointContext';
import {
  MOCK_COMMUNITY_MEETINGS,
  MOCK_MEETING_POSTS,
  MOCK_MEETING_POST_COMMENTS,
} from '@/lib/mockData';

// ─── 상수
const BOOK_COVERS = [
  'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=180&fit=crop',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=180&fit=crop',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=180&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=180&fit=crop',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=180&fit=crop',
];

const GENRES = ['소설', '에세이', '인문', '자기계발', '과학', '시', '역사', '기타'];

// ─── 헬퍼
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

function coverUrl(meeting, idx) {
  return meeting.cover || BOOK_COVERS[idx % BOOK_COVERS.length];
}

const EMPTY_MEETING_FORM = {
  title: '', description: '', currentBook: '',
  pageStart: '', pageEnd: '', deadline: '', maxMembers: '10', genre: '',
};

// ─── 메인 컴포넌트
export default function Meeting() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { addPoint } = usePoint();
  const myName = profile?.nickname || user?.email?.split('@')[0] || '독서인';

  const [view, setView]                         = useState('list');
  const [meetings, setMeetings]                 = useState([]);
  const [selectedMeeting, setSelectedMeeting]   = useState(null);
  const [posts, setPosts]                       = useState([]);
  const [selectedPost, setSelectedPost]         = useState(null);
  const [comments, setComments]                 = useState([]);
  const [loadingMeetings, setLoadingMeetings]   = useState(true);
  const [loadingPosts, setLoadingPosts]         = useState(false);
  const [submitting, setSubmitting]             = useState(false);
  const [meetingForm, setMeetingForm]           = useState(EMPTY_MEETING_FORM);
  const [postContent, setPostContent]           = useState('');
  const [commentText, setCommentText]           = useState('');
  const [imgErrors, setImgErrors]               = useState({});
  const [pendingMeetingId, setPendingMeetingId] = useState(null);
  const [fromCommunity, setFromCommunity]       = useState(false);
  const [editingAnn, setEditingAnn]             = useState(false);
  const [annText, setAnnText]                   = useState('');
  const [mockMemberMap, setMockMemberMap]       = useState(() => {
    const map = {};
    MOCK_COMMUNITY_MEETINGS.forEach(m => { map[m.id] = [...(m.members || [])]; });
    return map;
  });
  const [showPrevAnns, setShowPrevAnns]         = useState(false);

  // Community.jsx에서 navigation state로 넘어온 경우 처리
  useEffect(() => {
    const state = location.state;
    if (!state) return;
    if (state.view === 'create-meeting') {
      setView('create-meeting');
    } else if (state.view === 'detail' && state.meeting) {
      // Community.jsx에서 전체 meeting 객체를 넘겨준 경우 (mock 포함) 바로 사용
      setSelectedMeeting(state.meeting);
      setView('detail');
      setFromCommunity(true);
    } else if (state.view === 'detail' && state.meetingId) {
      // Firebase meetingId만 넘겨준 경우 (기존 방식)
      setPendingMeetingId(state.meetingId);
      setFromCommunity(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // 모임 로드 후 pending meetingId 처리
  useEffect(() => {
    if (!pendingMeetingId || meetings.length === 0) return;
    const meeting = meetings.find(m => m.id === pendingMeetingId);
    if (meeting) {
      setSelectedMeeting(meeting);
      setView('detail');
      setPendingMeetingId(null);
    }
  }, [meetings, pendingMeetingId]);

  const isMockMeeting = selectedMeeting?.id?.startsWith('mock-');

  // 선택된 모임의 게시글 실시간 구독 (Firebase 모임만)
  useEffect(() => {
    if (!selectedMeeting?.id || isMockMeeting) return;
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
  }, [selectedMeeting?.id, isMockMeeting]);

  // 선택된 게시글의 댓글 실시간 구독 (Firebase 모임만)
  useEffect(() => {
    if (!selectedMeeting?.id || !selectedPost?.id || isMockMeeting) return;
    const q = query(
      collection(db, 'meetings', selectedMeeting.id, 'posts', selectedPost.id, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [selectedMeeting?.id, selectedPost?.id, isMockMeeting]);

  // mock 모임: MOCK_MEETING_POSTS / MOCK_MEETING_POST_COMMENTS 사용
  const effectivePosts    = isMockMeeting
    ? (MOCK_MEETING_POSTS[selectedMeeting?.id] ?? [])
    : posts;
  const effectiveComments = isMockMeeting
    ? (MOCK_MEETING_POST_COMMENTS[selectedPost?.id] ?? [])
    : comments;

  // 모임 참여 / 나가기
  async function handleJoinToggle() {
    if (!selectedMeeting) return;
    const uid = user?.uid || 'preview-user';

    if (isMockMeeting) {
      const current = mockMemberMap[selectedMeeting.id] ?? selectedMeeting.members ?? [];
      const wasJoined = current.includes(uid);
      const next = wasJoined ? current.filter(id => id !== uid) : [...current, uid];
      setMockMemberMap(prev => ({ ...prev, [selectedMeeting.id]: next }));
      toast.success(wasJoined ? '모임에서 나왔습니다.' : '모임에 참여했습니다! 🎉');
      return;
    }

    if (!user) return;
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
      await addDoc(collection(db, 'meetings'), {
        title:       meetingForm.title.trim(),
        description: meetingForm.description.trim(),
        currentBook: meetingForm.currentBook.trim(),
        pageRange:   meetingForm.pageStart && meetingForm.pageEnd
          ? `p.${meetingForm.pageStart} ~ ${meetingForm.pageEnd}`
          : '',
        deadline:    meetingForm.deadline,
        maxMembers:  Number(meetingForm.maxMembers) || 10,
        genre:       meetingForm.genre,
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
      addPoint('meeting_post').catch(() => {});
      setPostContent('');
      setView('detail');
    } catch {
      toast.error('게시글 작성에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  }

  // 모임 삭제 (호스트 전용)
  async function handleDeleteMeeting() {
    if (!window.confirm('모임을 삭제할까요? 이 작업은 되돌릴 수 없어요.')) return;
    try {
      await deleteDoc(doc(db, 'meetings', selectedMeeting.id));
      toast.success('모임이 삭제됐어요.');
      setSelectedMeeting(null);
      setView('list');
    } catch {
      toast.error('삭제 중 오류가 발생했어요.');
    }
  }

  // 모임장 공지 저장
  async function handleSaveAnnouncement() {
    if (!selectedMeeting || !annText.trim()) return;
    setSubmitting(true);
    const today = new Date().toISOString().slice(0, 10);
    const newEntry = { text: annText.trim(), createdAt: today };

    if (isMockMeeting) {
      const existing = selectedMeeting.announcements
        ?? (selectedMeeting.announcement
          ? [{ text: selectedMeeting.announcement, createdAt: selectedMeeting.createdAt || today }]
          : []);
      setSelectedMeeting(prev => ({ ...prev, announcements: [newEntry, ...existing] }));
      setEditingAnn(false);
      setAnnText('');
      toast.success('공지가 저장됐어요.');
      setSubmitting(false);
      return;
    }

    try {
      const existing = selectedMeeting.announcements ?? [];
      await updateDoc(doc(db, 'meetings', selectedMeeting.id), {
        announcements: [newEntry, ...existing],
      });
      setSelectedMeeting(prev => ({
        ...prev,
        announcements: [newEntry, ...(prev.announcements ?? [])],
      }));
      setEditingAnn(false);
      setAnnText('');
      toast.success('공지가 저장됐어요.');
    } catch {
      toast.error('공지 저장에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  }

  // 감상 게시글 삭제 (작성자 전용)
  async function handleDeleteMeetingPost() {
    if (!window.confirm('게시글을 삭제할까요?')) return;
    try {
      await deleteDoc(doc(db, 'meetings', selectedMeeting.id, 'posts', selectedPost.id));
      toast.success('게시글이 삭제됐어요.');
      setSelectedPost(null);
      setView('detail');
    } catch {
      toast.error('삭제 중 오류가 발생했어요.');
    }
  }

  // 댓글 삭제
  async function handleDeleteComment(commentId) {
    try {
      await deleteDoc(
        doc(db, 'meetings', selectedMeeting.id, 'posts', selectedPost.id, 'comments', commentId)
      );
      toast.success('댓글이 삭제됐어요.');
    } catch {
      toast.error('삭제 중 오류가 발생했어요.');
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

  // ── 뷰별 렌더

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
            <p className="text-xs font-medium text-muted-foreground mb-1.5">장르</p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setMeetingForm(p => ({ ...p, genre: p.genre === g ? '' : g }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    meetingForm.genre === g
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
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
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">읽을 범위</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground flex-shrink-0">p.</span>
              <Input
                type="number"
                min="1"
                placeholder="시작"
                value={meetingForm.pageStart}
                onChange={e => setMeetingForm(p => ({ ...p, pageStart: e.target.value }))}
                className="h-11 flex-1 bg-secondary border-none rounded-xl text-center"
              />
              <span className="text-sm text-muted-foreground flex-shrink-0">~</span>
              <Input
                type="number"
                min="1"
                placeholder="끝"
                value={meetingForm.pageEnd}
                onChange={e => setMeetingForm(p => ({ ...p, pageEnd: e.target.value }))}
                className="h-11 flex-1 bg-secondary border-none rounded-xl text-center"
              />
              <span className="text-sm text-muted-foreground flex-shrink-0">p.</span>
            </div>
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
    const isPostAuthor = selectedPost.authorUid === user?.uid;

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
          {isPostAuthor && (
            <button
              onClick={handleDeleteMeetingPost}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        <div className="px-4 pb-10 max-w-2xl">
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

          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-3">댓글 {effectiveComments.length}개</h3>
            {effectiveComments.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                첫 댓글을 남겨보세요 💬
              </div>
            ) : (
              <div className="space-y-3">
                {effectiveComments.map(c => (
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
    const uid = user?.uid || 'preview-user';
    const effectiveMembers = isMockMeeting
      ? (mockMemberMap[selectedMeeting.id] ?? selectedMeeting.members ?? [])
      : (selectedMeeting.members ?? []);
    const isJoined    = effectiveMembers.includes(uid);
    const isHost      = selectedMeeting.hostUid === user?.uid;
    const memberCount = effectiveMembers.length;
    const rawAnns     = selectedMeeting.announcements
      ?? (selectedMeeting.announcement
        ? [{ text: selectedMeeting.announcement, createdAt: selectedMeeting.createdAt || '' }]
        : []);
    const latestAnn   = rawAnns[0] ?? null;
    const prevAnns    = rawAnns.slice(1);

    return (
      <>
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button
            onClick={() => fromCommunity ? navigate('/community', { state: { tab: 'meeting' } }) : setView('list')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold flex-1 line-clamp-1">{selectedMeeting.title}</h1>
          {isHost && (
            <button
              onClick={handleDeleteMeeting}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="px-4 pb-10 max-w-2xl">
          <div className="book-card p-5 mb-5">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {selectedMeeting.genre && (
                <span className="text-[10px] font-semibold bg-primary/10 text-primary rounded-full px-2 py-0.5">
                  {selectedMeeting.genre}
                </span>
              )}
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

            {/* 모임장 공지 — 모임장이면 항상, 공지가 있을 때도 표시 */}
            {(isHost || rawAnns.length > 0) && (
              <div className={`mt-4 rounded-xl border p-4 ${
                isHost ? 'bg-amber-500/10 border-amber-500/20' : 'bg-secondary/60 border-border/40'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Megaphone size={13} className="text-amber-600" />
                    <span className="text-xs font-bold text-amber-700">모임장 공지</span>
                  </div>
                  {isHost && !editingAnn && (
                    <button
                      onClick={() => { setAnnText(''); setEditingAnn(true); }}
                      className="flex items-center gap-1 text-[11px] text-amber-600 hover:text-amber-700 font-semibold transition-colors"
                    >
                      <Pencil size={11} />
                      공지 작성
                    </button>
                  )}
                </div>

                {editingAnn ? (
                  <div className="space-y-2">
                    <Textarea
                      value={annText}
                      onChange={e => setAnnText(e.target.value)}
                      placeholder="예) 4월 26일~5월 10일 동안 p.1~100을 읽겠습니다. 다들 화이팅!"
                      className="min-h-[80px] bg-background border-amber-200 rounded-xl resize-none text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveAnnouncement}
                        disabled={submitting || !annText.trim()}
                        className="flex-1 h-8 text-xs rounded-lg"
                      >
                        저장
                      </Button>
                      <button
                        onClick={() => setEditingAnn(false)}
                        className="px-3 h-8 text-xs rounded-lg border border-border hover:bg-secondary transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : latestAnn ? (
                  <>
                    <p className="text-[11px] text-muted-foreground mb-1">{formatTs(latestAnn.createdAt)}</p>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {latestAnn.text}
                    </p>
                    {prevAnns.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => setShowPrevAnns(v => !v)}
                          className="flex items-center gap-1 text-[11px] text-amber-600/80 hover:text-amber-600 font-medium transition-colors"
                        >
                          <ChevronDown
                            size={13}
                            className={`transition-transform duration-200 ${showPrevAnns ? 'rotate-180' : ''}`}
                          />
                          {showPrevAnns ? '이전 공지 접기' : `이전 공지 ${prevAnns.length}개 보기`}
                        </button>
                        {showPrevAnns && (
                          <div className="mt-2 space-y-3">
                            {prevAnns.map((ann, i) => (
                              <div key={i} className="border-t border-amber-500/10 pt-2">
                                <p className="text-[11px] text-muted-foreground mb-0.5">{formatTs(ann.createdAt)}</p>
                                <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">
                                  {ann.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-amber-600/60 italic">
                    아직 작성된 공지가 없어요. 공지 작성 버튼을 눌러주세요.
                  </p>
                )}
              </div>
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

            {loadingPosts && !isMockMeeting ? (
              <div className="flex justify-center py-8">
                <Loader2 size={22} className="animate-spin text-muted-foreground" />
              </div>
            ) : effectivePosts.length === 0 ? (
              <div className="book-card p-8 flex flex-col items-center text-center">
                <p className="text-3xl mb-2">📝</p>
                <p className="text-sm font-semibold mb-1">아직 감상 글이 없어요</p>
                <p className="text-xs text-muted-foreground">
                  {isJoined ? '첫 감상을 공유해보세요!' : '모임에 참여하고 감상을 공유해보세요'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {effectivePosts.map(post => (
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
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
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
          <div className="grid grid-cols-2 gap-3 stagger-children">
            {meetings.map((meeting, idx) => {
              const memberCount = meeting.members?.length ?? 0;
              const isJoined   = meeting.members?.includes(user?.uid);
              const isFull     = memberCount >= (meeting.maxMembers || 10);
              const pct        = Math.min(100, (memberCount / (meeting.maxMembers || 1)) * 100);

              return (
                <div
                  key={meeting.id}
                  onClick={() => { setSelectedMeeting(meeting); setView('detail'); }}
                  className="book-card overflow-hidden cursor-pointer hover:shadow-md transition-all"
                >
                  {/* 커버 이미지 */}
                  <div className="relative h-28 bg-secondary">
                    {!imgErrors[meeting.id] ? (
                      <img
                        src={coverUrl(meeting, idx)}
                        alt={meeting.title}
                        className="w-full h-full object-cover"
                        onError={() => setImgErrors(p => ({ ...p, [meeting.id]: true }))}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                        <BookOpen size={28} className="text-primary/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    {isJoined && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full">
                        참여 중
                      </span>
                    )}
                    {isFull && !isJoined && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-semibold rounded-full">
                        마감
                      </span>
                    )}
                  </div>

                  {/* 카드 본문 */}
                  <div className="p-3">
                    {/* 장르 태그 */}
                    {meeting.genre && (
                      <span className="inline-block text-[10px] font-semibold bg-primary/10 text-primary rounded-full px-2 py-0.5 mb-1.5">
                        {meeting.genre}
                      </span>
                    )}

                    {/* 모임명 */}
                    <h3
                      className="font-bold text-xs leading-snug mb-1 line-clamp-1"
                      style={{ fontFamily: "'Noto Serif KR', serif" }}
                    >
                      {meeting.title}
                    </h3>

                    {/* 설명 */}
                    {meeting.description && (
                      <p className="text-[11px] text-muted-foreground mb-1.5 line-clamp-1">
                        {meeting.description}
                      </p>
                    )}

                    {/* 인원 + 마감일 */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                      <span className="flex items-center gap-0.5">
                        <Users size={10} /> {memberCount}/{meeting.maxMembers}명
                      </span>
                      {meeting.deadline && (
                        <span className="flex items-center gap-0.5">
                          <Calendar size={10} /> ~{meeting.deadline}
                        </span>
                      )}
                    </div>

                    {/* 책 */}
                    <div className="flex items-center gap-1 mb-2 text-[11px] text-muted-foreground">
                      <BookOpen size={10} className="flex-shrink-0" />
                      <span className="truncate">{meeting.currentBook || '—'}</span>
                    </div>

                    {/* 진행률 바 */}
                    <div className="h-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
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
