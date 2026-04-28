// Booklog Meeting.jsx — 독서 모임
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Users,
  Calendar,
  BookOpen,
  Send,
  ChevronRight,
  Loader2,
  MessageSquare,
  Crown,
  Trash2,
  Megaphone,
  Pencil,
  ChevronDown,
  Search as SearchIcon,
  CalendarDays,
} from "lucide-react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { usePoint } from "@/contexts/PointContext";
import { searchBooks } from "@/utils/api";
import { getMeetingStatus, sortMeetings } from "@/utils/community";
import { Slider } from "@/components/ui/slider";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ko } from "date-fns/locale";

// ─── 상수
const BOOK_COVERS = [
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=180&fit=crop",
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=180&fit=crop",
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=180&fit=crop",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=180&fit=crop",
  "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=180&fit=crop",
];

const GENRES = [
  "소설",
  "에세이",
  "인문",
  "자기계발",
  "과학",
  "시",
  "역사",
  "기타",
];

const MEETING_SORT_OPTIONS = [
  { value: "latest", label: "최신개설순" },
  { value: "deadline", label: "마감임박순" },
  { value: "popular", label: "참여많은순" },
];

const MEETING_STATUS_LABEL = {
  joined: "참가 중",
  recruiting: "모집중",
  closed: "마감",
};

const MEETING_STATUS_BADGE = {
  joined: "bg-primary text-primary-foreground",
  recruiting: "bg-accent text-accent-foreground",
  closed: "bg-destructive text-destructive-foreground",
};

const MEETING_STATUS_CHIP = {
  joined: "bg-primary/10 text-primary",
  recruiting: "bg-accent text-accent-foreground",
  closed: "bg-destructive/10 text-destructive",
};

// ─── 헬퍼
function formatTs(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

function Avatar({ name, size = 8 }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0`}
    >
      {(name || "?")[0]}
    </div>
  );
}

function coverUrl(meeting, idx) {
  return meeting.cover || BOOK_COVERS[idx % BOOK_COVERS.length];
}

const EMPTY_MEETING_FORM = {
  title: "",
  description: "",
  currentBook: "",
  pageStart: "",
  pageEnd: "",
  deadline: "",
  maxMembers: "10",
  genre: "",
};

// ─── 메인 컴포넌트
export default function Meeting() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { addPoint } = usePoint();
  const myName = profile?.nickname || user?.email?.split("@")[0] || "독서인";

  const [view, setView] = useState("list");
  const [meetings, setMeetings] = useState([]);
  const [meetingSort, setMeetingSort] = useState("latest");
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [meetingForm, setMeetingForm] = useState(EMPTY_MEETING_FORM);
  const [postContent, setPostContent] = useState("");
  const [commentText, setCommentText] = useState("");
  const [imgErrors, setImgErrors] = useState({});
  const [pendingMeetingId, setPendingMeetingId] = useState(null);
  const [fromCommunity, setFromCommunity] = useState(false);
  const [editingAnn, setEditingAnn] = useState(false);
  const [annText, setAnnText] = useState("");
  const [showPrevAnns, setShowPrevAnns] = useState(false);

  const [bookQuery, setBookQuery] = useState("");
  const [bookSuggestions, setBookSuggestions] = useState([]);
  const [showBookSuggestions, setShowBookSuggestions] = useState(false);
  const [bookSuggestionLoading, setBookSuggestionLoading] = useState(false);
  const [activeBookSuggestionIdx, setActiveBookSuggestionIdx] = useState(-1);
  const [bookSuggestionsClosedFor, setBookSuggestionsClosedFor] = useState("");
  const [selectedBookTotalPages, setSelectedBookTotalPages] = useState(null);
  const bookSuggestionSeqRef = useRef(0);
  const [deadlinePickerOpen, setDeadlinePickerOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    body: "",
    action: null,
  });

  function openConfirm(title, body, action) {
    setConfirmState({ open: true, title, body, action });
  }
  function closeConfirm() {
    setConfirmState({ open: false, title: "", body: "", action: null });
  }

  useEffect(() => {
    const state = location.state;
    if (!state) return;
    if (state.view === "create-meeting") {
      setView("create-meeting");
      setFromCommunity(true);
    } else if (state.view === "detail" && state.meeting) {
      setSelectedMeeting(state.meeting);
      setView("detail");
      setFromCommunity(true);
    } else if (state.view === "detail" && state.meetingId) {
      setPendingMeetingId(state.meetingId);
      setFromCommunity(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const q = query(collection(db, "meetings"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      snap => {
        setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadingMeetings(false);
      },
      () => setLoadingMeetings(false)
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (!pendingMeetingId || meetings.length === 0) return;
    const meeting = meetings.find(m => m.id === pendingMeetingId);
    if (meeting) {
      setSelectedMeeting(meeting);
      setView("detail");
      setPendingMeetingId(null);
    }
  }, [meetings, pendingMeetingId]);

  useEffect(() => {
    if (!selectedMeeting?.id) return;
    setLoadingPosts(true);
    const q = query(
      collection(db, "meetings", selectedMeeting.id, "posts"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingPosts(false);
    });
    return unsub;
  }, [selectedMeeting?.id]);

  useEffect(() => {
    if (!selectedMeeting?.id || !selectedPost?.id) return;
    const q = query(
      collection(
        db,
        "meetings",
        selectedMeeting.id,
        "posts",
        selectedPost.id,
        "comments"
      ),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [selectedMeeting?.id, selectedPost?.id]);

  async function handleJoinToggle() {
    if (!selectedMeeting || !user) return;
    const { isJoined, isRecruiting } = getMeetingStatus(
      selectedMeeting,
      user.uid
    );
    if (!isJoined && !isRecruiting) {
      toast.error("모집이 마감된 모임입니다.");
      return;
    }
    const ref = doc(db, "meetings", selectedMeeting.id);
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
      toast.success(
        isJoined ? "모임에서 나왔습니다." : "모임에 참여했습니다! 🎉"
      );
    } catch {
      toast.error("처리 중 오류가 발생했어요.");
    }
  }

  async function handleCreateMeeting() {
    if (!meetingForm.title.trim() || !meetingForm.currentBook.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "meetings"), {
        title: meetingForm.title.trim(),
        description: meetingForm.description.trim(),
        currentBook: meetingForm.currentBook.trim(),
        pageRange:
          meetingForm.pageStart && meetingForm.pageEnd
            ? `p.${meetingForm.pageStart} ~ ${meetingForm.pageEnd}`
            : "",
        deadline: meetingForm.deadline,
        maxMembers: Number(meetingForm.maxMembers) || 10,
        genre: meetingForm.genre,
        hostUid: user.uid,
        hostName: myName,
        members: [user.uid],
        createdAt: serverTimestamp(),
      });
      toast.success("모임이 개설됐어요! 🎉");
      setMeetingForm(EMPTY_MEETING_FORM);
      setBookQuery("");
      setSelectedBookTotalPages(null);
      setView("list");
    } catch {
      toast.error("모임 생성에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreatePost() {
    if (!postContent.trim() || !selectedMeeting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "meetings", selectedMeeting.id, "posts"), {
        content: postContent.trim(),
        authorUid: user.uid,
        authorName: myName,
        createdAt: serverTimestamp(),
      });
      toast.success("게시글이 등록됐어요!");
      addPoint("meeting_post").catch(() => {});
      setPostContent("");
      setView("detail");
    } catch {
      toast.error("게시글 작성에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteMeeting() {
    openConfirm(
      "모임을 삭제할까요?",
      "이 작업은 되돌릴 수 없어요.",
      async () => {
        try {
          await deleteDoc(doc(db, "meetings", selectedMeeting.id));
          toast.success("모임이 삭제됐어요.");
          navigate("/community", { state: { tab: "meeting" } });
        } catch {
          toast.error("삭제 중 오류가 발생했어요.");
        }
      }
    );
  }

  async function handleSaveAnnouncement() {
    if (!selectedMeeting || !annText.trim()) return;
    setSubmitting(true);
    const today = new Date().toISOString().slice(0, 10);
    const newEntry = { text: annText.trim(), createdAt: today };
    try {
      const existing = selectedMeeting.announcements ?? [];
      await updateDoc(doc(db, "meetings", selectedMeeting.id), {
        announcements: [newEntry, ...existing],
      });
      setSelectedMeeting(prev => ({
        ...prev,
        announcements: [newEntry, ...(prev.announcements ?? [])],
      }));
      setEditingAnn(false);
      setAnnText("");
      toast.success("공지가 저장됐어요.");
    } catch {
      toast.error("공지 저장에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const trimmed = bookQuery.trim();
    if (trimmed === bookSuggestionsClosedFor) {
      setShowBookSuggestions(false);
      setBookSuggestionLoading(false);
      return;
    }
    if (trimmed.length < 2) {
      setBookSuggestions([]);
      setShowBookSuggestions(false);
      setBookSuggestionLoading(false);
      setActiveBookSuggestionIdx(-1);
      return;
    }
    const seq = bookSuggestionSeqRef.current + 1;
    bookSuggestionSeqRef.current = seq;
    setBookSuggestionLoading(true);
    const timer = setTimeout(() => {
      searchBooks(trimmed, { start: 1, maxResults: 6 })
        .then(({ items }) => {
          if (bookSuggestionSeqRef.current !== seq) return;
          setBookSuggestions(items || []);
          setShowBookSuggestions(true);
          setActiveBookSuggestionIdx(-1);
        })
        .catch(() => {
          if (bookSuggestionSeqRef.current !== seq) return;
          setBookSuggestions([]);
          setShowBookSuggestions(false);
        })
        .finally(() => {
          if (bookSuggestionSeqRef.current === seq)
            setBookSuggestionLoading(false);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [bookQuery, bookSuggestionsClosedFor]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleBookSelect(book) {
    const info = book.volumeInfo || {};
    const title = info.title || "";
    const author = info.authors?.[0] || "";
    const displayName = author ? `${title} — ${author}` : title;
    const totalPages = info.pageCount || null;
    setBookQuery(displayName);
    setMeetingForm(p => ({
      ...p,
      currentBook: displayName,
      pageStart: "",
      pageEnd: "",
    }));
    setSelectedBookTotalPages(totalPages);
    setShowBookSuggestions(false);
    setBookSuggestions([]);
    setActiveBookSuggestionIdx(-1);
    setBookSuggestionsClosedFor("");
  }

  async function handleDeleteMeetingPost() {
    openConfirm(
      "게시글을 삭제할까요?",
      "이 작업은 되돌릴 수 없어요.",
      async () => {
        try {
          await deleteDoc(
            doc(db, "meetings", selectedMeeting.id, "posts", selectedPost.id)
          );
          toast.success("게시글이 삭제됐어요.");
          setSelectedPost(null);
          setView("detail");
        } catch {
          toast.error("삭제 중 오류가 발생했어요.");
        }
      }
    );
  }

  async function handleDeleteAnnouncement(rawAnns, index) {
    const next = rawAnns.filter((_, i) => i !== index);
    try {
      await updateDoc(doc(db, "meetings", selectedMeeting.id), {
        announcements: next,
      });
      setSelectedMeeting(prev => ({ ...prev, announcements: next }));
      toast.success("공지가 삭제됐어요.");
    } catch {
      toast.error("삭제 중 오류가 발생했어요.");
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await deleteDoc(
        doc(
          db,
          "meetings",
          selectedMeeting.id,
          "posts",
          selectedPost.id,
          "comments",
          commentId
        )
      );
      toast.success("댓글이 삭제됐어요.");
    } catch {
      toast.error("삭제 중 오류가 발생했어요.");
    }
  }

  async function handleAddComment() {
    if (!commentText.trim() || !selectedMeeting || !selectedPost) return;
    const text = commentText.trim();
    setCommentText("");
    try {
      await addDoc(
        collection(
          db,
          "meetings",
          selectedMeeting.id,
          "posts",
          selectedPost.id,
          "comments"
        ),
        {
          content: text,
          authorUid: user.uid,
          authorName: myName,
          createdAt: serverTimestamp(),
        }
      );
    } catch {
      toast.error("댓글 작성에 실패했어요.");
      setCommentText(text);
    }
  }

  // 모임 생성 폼
  if (view === "create-meeting") {
    return (
      <>
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button
            onClick={() =>
              fromCommunity ? navigate("/community") : setView("list")
            }
            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold">모임 만들기</h1>
        </div>
        <div className="px-4 pb-10 space-y-4 max-w-2xl">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              모임 이름 *
            </p>
            <Input
              placeholder="예) 한강 소설 읽기 모임"
              value={meetingForm.title}
              onChange={e =>
                setMeetingForm(p => ({ ...p, title: e.target.value }))
              }
              className="h-11 bg-secondary border-none rounded-xl"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              모임 소개
            </p>
            <Textarea
              placeholder="어떤 모임인지 소개해주세요"
              value={meetingForm.description}
              onChange={e =>
                setMeetingForm(p => ({ ...p, description: e.target.value }))
              }
              className="min-h-24 bg-secondary border-none rounded-xl resize-none"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              장르
            </p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() =>
                    setMeetingForm(p => ({
                      ...p,
                      genre: p.genre === g ? "" : g,
                    }))
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    meetingForm.genre === g
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              모임에서 읽을 책 *
            </p>
            <div className="relative">
              {bookSuggestionLoading ? (
                <Loader2
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-primary animate-spin z-10"
                />
              ) : (
                <SearchIcon
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10"
                />
              )}
              <Input
                placeholder="책 제목 또는 저자 검색..."
                value={bookQuery}
                onChange={e => {
                  const v = e.target.value;
                  setBookQuery(v);
                  setMeetingForm(p => ({ ...p, currentBook: v }));
                  setBookSuggestionsClosedFor("");
                  setShowBookSuggestions(true);
                }}
                onFocus={() => {
                  if (
                    bookQuery.trim().length >= 2 &&
                    bookSuggestions.length > 0
                  )
                    setShowBookSuggestions(true);
                }}
                onBlur={() =>
                  setTimeout(() => setShowBookSuggestions(false), 120)
                }
                onKeyDown={e => {
                  const canNav =
                    showBookSuggestions && bookSuggestions.length > 0;
                  if (canNav && e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveBookSuggestionIdx(
                      prev => (prev + 1) % bookSuggestions.length
                    );
                  } else if (canNav && e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveBookSuggestionIdx(prev =>
                      prev <= 0 ? bookSuggestions.length - 1 : prev - 1
                    );
                  } else if (e.key === "Escape") {
                    setShowBookSuggestions(false);
                    setActiveBookSuggestionIdx(-1);
                  } else if (
                    e.key === "Enter" &&
                    canNav &&
                    activeBookSuggestionIdx >= 0
                  ) {
                    e.preventDefault();
                    handleBookSelect(bookSuggestions[activeBookSuggestionIdx]);
                  }
                }}
                className="h-11 pl-9 bg-secondary border-none rounded-xl"
              />
              {showBookSuggestions && bookQuery.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-border/70 bg-card shadow-xl shadow-primary/10">
                  <div className="max-h-[280px] overflow-y-auto py-1">
                    {bookSuggestionLoading && bookSuggestions.length === 0 ? (
                      <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
                        <Loader2
                          size={13}
                          className="animate-spin text-primary"
                        />
                        도서를 검색 중이에요
                      </div>
                    ) : bookSuggestions.length > 0 ? (
                      bookSuggestions.map((book, index) => {
                        const info = book.volumeInfo || {};
                        const title = info.title || "";
                        const author = info.authors?.join(", ") || "";
                        const cover = book._cover || "";
                        return (
                          <button
                            key={book.id}
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onMouseEnter={() =>
                              setActiveBookSuggestionIdx(index)
                            }
                            onClick={() => handleBookSelect(book)}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                              activeBookSuggestionIdx === index
                                ? "bg-primary/10"
                                : "hover:bg-secondary/50"
                            }`}
                          >
                            {cover ? (
                              <img
                                src={cover}
                                alt={title}
                                className="w-8 h-11 rounded object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-11 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                                <BookOpen
                                  size={13}
                                  className="text-muted-foreground/40"
                                />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold line-clamp-1">
                                {title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {author}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-xs text-muted-foreground">
                        검색 결과가 없어요
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border/40 px-3 py-1.5">
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        setShowBookSuggestions(false);
                        setActiveBookSuggestionIdx(-1);
                        setBookSuggestionsClosedFor(bookQuery.trim());
                      }}
                      className="w-full rounded-lg py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-center"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              읽을 범위
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>
                시작{" "}
                <span className="font-semibold text-foreground">
                  {meetingForm.pageStart || 0}p
                </span>
              </span>
              <span>
                끝{" "}
                <span className="font-semibold text-primary">
                  {meetingForm.pageEnd || 0}p
                </span>
                {selectedBookTotalPages ? ` / ${selectedBookTotalPages}p` : ""}
              </span>
            </div>
            <Slider
              value={[
                Number(meetingForm.pageStart) || 0,
                Number(meetingForm.pageEnd) || 0,
              ]}
              min={0}
              max={selectedBookTotalPages || 500}
              step={1}
              onValueChange={([start, end]) => {
                setMeetingForm(p => ({
                  ...p,
                  pageStart: start > 0 ? String(start) : "",
                  pageEnd: end > 0 ? String(end) : "",
                }));
              }}
              className="py-1 mb-3"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
                p.
              </span>
              <Input
                type="number"
                min="1"
                placeholder="시작"
                value={meetingForm.pageStart}
                onChange={e =>
                  setMeetingForm(p => ({ ...p, pageStart: e.target.value }))
                }
                className="h-11 flex-1 bg-secondary border-none rounded-xl text-center"
              />
              <span className="text-sm text-muted-foreground flex-shrink-0">
                ~
              </span>
              <Input
                type="number"
                min="1"
                placeholder="끝"
                value={meetingForm.pageEnd}
                onChange={e =>
                  setMeetingForm(p => ({ ...p, pageEnd: e.target.value }))
                }
                className="h-11 flex-1 bg-secondary border-none rounded-xl text-center"
              />
              <span className="text-sm text-muted-foreground flex-shrink-0">
                p.
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              마감일
            </p>
            <Popover
              open={deadlinePickerOpen}
              onOpenChange={setDeadlinePickerOpen}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-11 w-full items-center gap-2 rounded-xl bg-secondary px-3 text-left text-sm transition-colors hover:bg-secondary/80"
                >
                  <CalendarDays
                    size={15}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span
                    className={
                      meetingForm.deadline
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {meetingForm.deadline
                      ? new Date(
                          meetingForm.deadline + "T00:00:00"
                        ).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "마감일 선택"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarUI
                  mode="single"
                  locale={ko}
                  selected={
                    meetingForm.deadline
                      ? new Date(meetingForm.deadline + "T00:00:00")
                      : undefined
                  }
                  onSelect={date => {
                    if (date) {
                      const local = new Date(
                        date.getTime() - date.getTimezoneOffset() * 60000
                      );
                      setMeetingForm(p => ({
                        ...p,
                        deadline: local.toISOString().slice(0, 10),
                      }));
                      setDeadlinePickerOpen(false);
                    }
                  }}
                  disabled={date =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              최대 인원
            </p>
            <Input
              type="number"
              min="2"
              max="50"
              value={meetingForm.maxMembers}
              onChange={e =>
                setMeetingForm(p => ({ ...p, maxMembers: e.target.value }))
              }
              className="h-11 bg-secondary border-none rounded-xl"
            />
          </div>
          <Button
            onClick={handleCreateMeeting}
            disabled={
              !meetingForm.title.trim() ||
              !meetingForm.currentBook.trim() ||
              submitting
            }
            className="w-full h-11 rounded-xl font-semibold"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : null}
            모임 개설하기
          </Button>
        </div>
      </>
    );
  }

  // 게시글 작성 폼
  if (view === "create-post") {
    return (
      <>
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button
            onClick={() => setView("detail")}
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
              <p className="text-sm font-semibold">
                {selectedMeeting?.currentBook}
              </p>
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
            {submitting ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : null}
            게시하기
          </Button>
        </div>
      </>
    );
  }

  // 게시글 상세
  if (view === "post-detail" && selectedPost) {
    const isPostAuthor = selectedPost.authorUid === user?.uid;

    return (
      <>
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button
            onClick={() => setView("detail")}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold flex-1 line-clamp-1">감상 글</h1>
        </div>
        <div className="px-4 pb-10 max-w-2xl">
          <div className="book-card p-5 mb-4 relative">
            {isPostAuthor && (
              <button
                onClick={handleDeleteMeetingPost}
                className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
            <div className="flex items-center gap-2.5 mb-4 pr-8">
              <Avatar name={selectedPost.authorName} />
              <div>
                <p className="text-sm font-semibold">
                  {selectedPost.authorName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTs(selectedPost.createdAt)}
                </p>
              </div>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {selectedPost.content}
            </p>
          </div>

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
                        <span className="text-xs font-semibold">
                          {c.authorName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground">
                            {formatTs(c.createdAt)}
                          </span>
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
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        {c.content}
                      </p>
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
              onKeyUp={e => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  handleAddComment();
                }
              }}
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

        <Dialog
          open={confirmState.open}
          onOpenChange={open => !open && closeConfirm()}
        >
          <DialogContent showCloseButton={false} className="max-w-[320px]">
            <DialogHeader>
              <DialogTitle>{confirmState.title}</DialogTitle>
              <DialogDescription>{confirmState.body}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 mt-2">
              <button
                onClick={closeConfirm}
                className="flex-1 h-9 rounded-xl border border-border text-sm hover:bg-secondary transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  confirmState.action?.();
                  closeConfirm();
                }}
                className="flex-1 h-9 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 transition-colors"
              >
                삭제
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // 모임 상세
  if (view === "detail" && selectedMeeting) {
    const uid = user?.uid || "preview-user";
    const { memberCount, maxMembers, isJoined, isRecruiting } =
      getMeetingStatus(selectedMeeting, uid);
    const isHost = selectedMeeting.hostUid === user?.uid;
    const availabilityKey = isRecruiting ? "recruiting" : "closed";
    const progress = Math.min(100, (memberCount / maxMembers) * 100);
    const rawAnns =
      selectedMeeting.announcements ??
      (selectedMeeting.announcement
        ? [
            {
              text: selectedMeeting.announcement,
              createdAt: selectedMeeting.createdAt || "",
            },
          ]
        : []);
    const latestAnn = rawAnns[0] ?? null;
    const prevAnns = rawAnns.slice(1);

    return (
      <>
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button
            onClick={() =>
              fromCommunity
                ? navigate("/community", { state: { tab: "meeting" } })
                : setView("list")
            }
            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold flex-1 line-clamp-1">
            {selectedMeeting.title}
          </h1>
        </div>

        <div className="px-4 pb-10 max-w-2xl">
          <div className="book-card p-5 mb-5 relative">
            {isHost && (
              <button
                onClick={handleDeleteMeeting}
                className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
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
              <span
                className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${MEETING_STATUS_CHIP[availabilityKey]}`}
              >
                {MEETING_STATUS_LABEL[availabilityKey]}
              </span>
              {isJoined && !isHost && (
                <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  참가 중
                </span>
              )}
            </div>
            <h2
              className="text-xl font-bold mb-2 pr-8"
            >
              {selectedMeeting.title}
            </h2>
            {selectedMeeting.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {selectedMeeting.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2.5 mb-4 sm:grid-cols-4">
              {[
                {
                  icon: BookOpen,
                  label: "현재 도서",
                  value: selectedMeeting.currentBook || "—",
                },
                {
                  icon: BookOpen,
                  label: "읽을 범위",
                  value: selectedMeeting.pageRange || "—",
                },
                {
                  icon: Calendar,
                  label: "마감일",
                  value: selectedMeeting.deadline || "—",
                },
                {
                  icon: Users,
                  label: "멤버",
                  value: `${memberCount}/${maxMembers}명`,
                },
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
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              모임장:{" "}
              <span className="font-semibold text-foreground">
                {selectedMeeting.hostName}
              </span>
            </p>

            {!isHost && (
              <Button
                onClick={handleJoinToggle}
                variant={isJoined ? "outline" : "default"}
                disabled={!isJoined && !isRecruiting}
                className="w-full h-11 rounded-xl font-semibold"
              >
                {isJoined
                  ? "모임 나가기"
                  : isRecruiting
                    ? "모임 참여하기"
                    : "모집 마감"}
              </Button>
            )}

            {(isHost || rawAnns.length > 0) && (
              <div
                className={`mt-4 rounded-xl border p-4 ${isHost ? "bg-amber-500/10 border-amber-500/20" : "bg-secondary/60 border-border/40"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Megaphone size={13} className="text-amber-600" />
                    <span className="text-xs font-bold text-amber-700">
                      모임장 공지
                    </span>
                  </div>
                  {isHost && !editingAnn && (
                    <button
                      onClick={() => {
                        setAnnText("");
                        setEditingAnn(true);
                      }}
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
                      placeholder="예) 4월 26일~5월 10일 동안 p.1~100을 읽겠습니다."
                      className="min-h-[80px] bg-amber-500/5 border border-amber-300/50 rounded-xl resize-none text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveAnnouncement}
                        disabled={submitting || !annText.trim()}
                        className="flex-1 h-8 text-xs rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold disabled:opacity-50 transition-colors"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingAnn(false)}
                        className="px-3 h-8 text-xs rounded-lg border border-amber-300/60 text-amber-700 hover:bg-amber-500/10 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : latestAnn ? (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-muted-foreground mb-1">
                          {formatTs(latestAnn.createdAt)}
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                          {latestAnn.text}
                        </p>
                      </div>
                      {isHost && (
                        <button
                          onClick={() =>
                            openConfirm(
                              "공지를 삭제할까요?",
                              "이 작업은 되돌릴 수 없어요.",
                              () => handleDeleteAnnouncement(rawAnns, 0)
                            )
                          }
                          className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 transition-colors"
                        >
                          <span className="text-[10px] font-bold leading-none">
                            ✕
                          </span>
                        </button>
                      )}
                    </div>
                    {prevAnns.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => setShowPrevAnns(v => !v)}
                          className="flex items-center gap-1 text-[11px] text-amber-600/80 hover:text-amber-600 font-medium transition-colors"
                        >
                          <ChevronDown
                            size={13}
                            className={`transition-transform duration-200 ${showPrevAnns ? "rotate-180" : ""}`}
                          />
                          {showPrevAnns
                            ? "이전 공지 접기"
                            : `이전 공지 ${prevAnns.length}개 보기`}
                        </button>
                        {showPrevAnns && (
                          <div className="mt-2 space-y-3">
                            {prevAnns.map((ann, i) => (
                              <div
                                key={i}
                                className="border-t border-amber-500/10 pt-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-muted-foreground mb-0.5">
                                      {formatTs(ann.createdAt)}
                                    </p>
                                    <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">
                                      {ann.text}
                                    </p>
                                  </div>
                                  {isHost && (
                                    <button
                                      onClick={() =>
                                        openConfirm(
                                          "공지를 삭제할까요?",
                                          "이 작업은 되돌릴 수 없어요.",
                                          () =>
                                            handleDeleteAnnouncement(
                                              rawAnns,
                                              i + 1
                                            )
                                        )
                                      }
                                      className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 transition-colors"
                                    >
                                      <span className="text-[10px] font-bold leading-none">
                                        ✕
                                      </span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-amber-600/60 italic">
                    아직 작성된 공지가 없어요.
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">감상 공유</h3>
              {isJoined && (
                <button
                  onClick={() => setView("create-post")}
                  className="flex items-center gap-1 text-xs text-primary font-medium"
                >
                  <Plus size={13} /> 작성
                </button>
              )}
            </div>

            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <Loader2
                  size={22}
                  className="animate-spin text-muted-foreground"
                />
              </div>
            ) : posts.length === 0 ? (
              <div className="book-card p-8 flex flex-col items-center text-center">
                <p className="text-3xl mb-2">📝</p>
                <p className="text-sm font-semibold mb-1">
                  아직 감상 글이 없어요
                </p>
                <p className="text-xs text-muted-foreground">
                  {isJoined
                    ? "첫 감상을 공유해보세요!"
                    : "모임에 참여하고 감상을 공유해보세요"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <button
                    key={post.id}
                    onClick={() => {
                      setSelectedPost(post);
                      setView("post-detail");
                    }}
                    className="w-full text-left book-card p-4 hover:bg-secondary/60 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={post.authorName} size={7} />
                      <span className="text-xs font-semibold">
                        {post.authorName}
                      </span>
                      <span className="text-[11px] text-muted-foreground ml-auto">
                        {formatTs(post.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <MessageSquare size={12} />
                      <span>댓글 {post.commentCount ?? 0}개</span>
                      <ChevronRight size={12} className="ml-auto" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Dialog
          open={confirmState.open}
          onOpenChange={open => !open && closeConfirm()}
        >
          <DialogContent showCloseButton={false} className="max-w-[320px]">
            <DialogHeader>
              <DialogTitle>{confirmState.title}</DialogTitle>
              <DialogDescription>{confirmState.body}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 mt-2">
              <button
                onClick={closeConfirm}
                className="flex-1 h-9 rounded-xl border border-border text-sm hover:bg-secondary transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  confirmState.action?.();
                  closeConfirm();
                }}
                className="flex-1 h-9 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 transition-colors"
              >
                삭제
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // 모임 목록
  const sortedMeetings = sortMeetings(meetings, meetingSort);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/community")}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1
            className="text-xl font-bold"
          >
            독서 모임
          </h1>
        </div>
        <button
          onClick={() => setView("create-meeting")}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} /> 모임 만들기
        </button>
      </div>

      <div className="px-4 pb-10">
        {meetings.length > 0 && (
          <div className="flex gap-1 rounded-xl bg-secondary p-1 mb-5">
            {MEETING_SORT_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => setMeetingSort(option.value)}
                className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                  meetingSort === option.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        {loadingMeetings ? (
          <div className="flex justify-center pt-16">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <p className="text-5xl mb-4">📚</p>
            <p className="text-base font-semibold mb-2">
              아직 개설된 모임이 없어요
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              첫 번째 독서 모임을 만들어보세요!
            </p>
            <Button
              onClick={() => setView("create-meeting")}
              className="rounded-xl px-6"
            >
              모임 만들기
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 stagger-children">
            {sortedMeetings.map((meeting, idx) => {
              const {
                memberCount,
                maxMembers,
                statusKey,
              } = getMeetingStatus(meeting, user?.uid);
              const statusLabel = MEETING_STATUS_LABEL[statusKey];
              const statusClass = MEETING_STATUS_BADGE[statusKey];
              const pct = Math.min(
                100,
                (memberCount / maxMembers) * 100
              );

              return (
                <div
                  key={meeting.id}
                  onClick={() => {
                    setSelectedMeeting(meeting);
                    setView("detail");
                  }}
                  className="book-card overflow-hidden cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="relative h-28 bg-secondary">
                    {!imgErrors[meeting.id] ? (
                      <img
                        src={coverUrl(meeting, idx)}
                        alt={meeting.title}
                        className="w-full h-full object-cover"
                        onError={() =>
                          setImgErrors(p => ({ ...p, [meeting.id]: true }))
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                        <BookOpen size={28} className="text-primary/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    <span
                      className={`absolute top-2 right-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold shadow-sm ring-1 ring-white/35 ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="p-3">
                    {meeting.genre && (
                      <span className="inline-block text-[10px] font-semibold bg-primary/10 text-primary rounded-full px-2 py-0.5 mb-1.5">
                        {meeting.genre}
                      </span>
                    )}
                    <h3
                      className="font-bold text-xs leading-snug mb-1 line-clamp-1"
                    >
                      {meeting.title}
                    </h3>
                    {meeting.description && (
                      <p className="text-[11px] text-muted-foreground mb-1.5 line-clamp-1">
                        {meeting.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                      <span className="flex items-center gap-0.5">
                        <Users size={10} /> {memberCount}/{maxMembers}명
                      </span>
                      {meeting.deadline && (
                        <span className="flex items-center gap-0.5">
                          <Calendar size={10} /> ~{meeting.deadline}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2 text-[11px] text-muted-foreground">
                      <BookOpen size={10} className="flex-shrink-0" />
                      <span className="truncate">
                        {meeting.currentBook || "—"}
                      </span>
                    </div>
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
