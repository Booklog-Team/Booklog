// Booklog Community — 탭 기반 커뮤니티 허브
import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getMeetingStatus, sortMeetings, sortPosts } from "@/utils/community";
import {
  Plus,
  Users,
  Calendar,
  BookOpen,
  Heart,
  MessageSquare,
  Loader2,
} from "lucide-react";

const BOOK_COVERS = [
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=180&fit=crop",
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=180&fit=crop",
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=180&fit=crop",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=180&fit=crop",
  "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=180&fit=crop",
];

const CATEGORIES = ["전체", "자유", "독후감", "질문", "내 게시글"];
const MEETING_GENRES = [
  "소설",
  "에세이",
  "인문",
  "자기계발",
  "과학",
  "시",
  "역사",
  "기타",
];
const MEETING_FILTERS = ["전체", "참가 중", "모집중", "마감", ...MEETING_GENRES];
const PAGE_SIZE = 8;

const MEETING_SORT_OPTIONS = [
  { value: "latest", label: "최신개설순" },
  { value: "deadline", label: "마감임박순" },
  { value: "popular", label: "참여많은순" },
];

const BOARD_SORT_OPTIONS = [
  { value: "latest", label: "최신등록순" },
  { value: "likes", label: "좋아요순" },
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

const CAT_STYLE = {
  자유: { bg: "bg-secondary", text: "text-secondary-foreground" },
  독후감: { bg: "bg-primary/10", text: "text-primary" },
  질문: { bg: "bg-accent", text: "text-accent-foreground" },
};

function formatTs(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diffMin = Math.floor((Date.now() - d) / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}시간 전`;
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

function coverUrl(meeting, idx) {
  return meeting.cover || BOOK_COVERS[idx % BOOK_COVERS.length];
}

export default function Community() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const defaultTab = location.state?.tab ?? "meeting";

  const [meetingFilter, setMeetingFilter] = useState("전체");
  const [meetingSort, setMeetingSort] = useState("latest");
  const [filterCat, setFilterCat] = useState("전체");
  const [boardSort, setBoardSort] = useState("latest");
  const [imgErrors, setImgErrors] = useState({});
  const [meetingPage, setMeetingPage] = useState(1);
  const [boardPage, setBoardPage] = useState(1);
  const [meetings, setMeetings] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "meetings"), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      snap => {
        setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadingMeetings(false);
      },
      () => setLoadingMeetings(false)
    );
  }, []);

  useEffect(() => {
    const q = query(collection(db, "board"), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      snap => {
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadingPosts(false);
      },
      () => setLoadingPosts(false)
    );
  }, []);

  const baseFilteredMeetings =
    meetingFilter === "전체"
      ? meetings
      : meetingFilter === "참가 중"
        ? meetings.filter(m => m.members?.includes(user?.uid))
        : meetingFilter === "모집중"
          ? meetings.filter(m => getMeetingStatus(m, user?.uid).isRecruiting)
          : meetingFilter === "마감"
            ? meetings.filter(m => getMeetingStatus(m, user?.uid).isClosed)
            : meetings.filter(m => m.genre === meetingFilter);

  const filteredMeetings = sortMeetings(baseFilteredMeetings, meetingSort);

  const baseFilteredPosts =
    filterCat === "전체"
      ? posts
      : filterCat === "내 게시글"
        ? posts.filter(p => p.authorUid === user?.uid)
        : posts.filter(p => p.category === filterCat);

  const filteredPosts = sortPosts(baseFilteredPosts, boardSort);

  const totalMeetingPages = Math.ceil(filteredMeetings.length / PAGE_SIZE);
  const pagedMeetings = filteredMeetings.slice(
    (meetingPage - 1) * PAGE_SIZE,
    meetingPage * PAGE_SIZE
  );
  const totalBoardPages = Math.ceil(filteredPosts.length / PAGE_SIZE);
  const pagedPosts = filteredPosts.slice(
    (boardPage - 1) * PAGE_SIZE,
    boardPage * PAGE_SIZE
  );

  return (
    <>
      <div className="px-4 pt-8 pb-2">
        <h1
          className="text-2xl font-bold"
        >
          커뮤니티
        </h1>
      </div>

      <div className="px-4 pb-10">
        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full bg-secondary rounded-xl p-1 h-auto mt-3 mb-5">
            <TabsTrigger
              value="meeting"
              className="flex-1 text-sm py-2.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              독서 모임
            </TabsTrigger>
            <TabsTrigger
              value="board"
              className="flex-1 text-sm py-2.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              자유 게시판
            </TabsTrigger>
          </TabsList>

          {/* ── 독서 모임 탭 */}
          <TabsContent value="meeting" className="mt-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                {loadingMeetings
                  ? "불러오는 중..."
                  : `${filteredMeetings.length}개 모임 운영 중`}
              </p>
              <button
                onClick={() =>
                  navigate("/community/meeting", {
                    state: { view: "create-meeting" },
                  })
                }
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus size={13} /> 모임 만들기
              </button>
            </div>

            {/* 모임 필터 칩 */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
              {MEETING_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => {
                    setMeetingFilter(f);
                    setMeetingPage(1);
                  }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    meetingFilter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex gap-1 rounded-xl bg-secondary p-1 mb-4">
              {MEETING_SORT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setMeetingSort(option.value);
                    setMeetingPage(1);
                  }}
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

            {loadingMeetings ? (
              <div className="flex justify-center pt-16">
                <Loader2
                  size={28}
                  className="animate-spin text-muted-foreground"
                />
              </div>
            ) : filteredMeetings.length === 0 ? (
              <div className="flex flex-col items-center pt-20 text-center">
                <p className="text-5xl mb-4">📚</p>
                <p className="text-base font-semibold mb-1">
                  {meetingFilter === "전체"
                    ? "아직 개설된 모임이 없어요"
                    : meetingFilter === "참가 중"
                      ? "참가 중인 모임이 없어요"
                      : meetingFilter === "모집중"
                        ? "모집 중인 모임이 없어요"
                        : meetingFilter === "마감"
                          ? "마감된 모임이 없어요"
                          : `${meetingFilter} 장르 모임이 없어요`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {meetingFilter === "전체" &&
                    "첫 번째 독서 모임을 만들어보세요!"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 stagger-children">
                  {pagedMeetings.map((meeting, idx) => {
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
                        onClick={() =>
                          navigate("/community/meeting", {
                            state: { view: "detail", meeting },
                          })
                        }
                        className="book-card overflow-hidden cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="relative h-28 bg-secondary">
                          {!imgErrors[meeting.id] ? (
                            <img
                              src={coverUrl(meeting, idx)}
                              alt={meeting.title}
                              className="w-full h-full object-cover"
                              onError={() =>
                                setImgErrors(p => ({
                                  ...p,
                                  [meeting.id]: true,
                                }))
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
                              <Users size={10} /> {memberCount}/
                              {maxMembers}명
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
                {totalMeetingPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-1">
                    {Array.from(
                      { length: totalMeetingPages },
                      (_, i) => i + 1
                    ).map(page => (
                      <button
                        key={page}
                        onClick={() => setMeetingPage(page)}
                        className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${
                          meetingPage === page
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ── 자유 게시판 탭 */}
          <TabsContent value="board" className="mt-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                {loadingPosts
                  ? "불러오는 중..."
                  : `${filteredPosts.length}개 게시글`}
              </p>
              <button
                onClick={() =>
                  navigate("/community/board", { state: { view: "create" } })
                }
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus size={13} /> 글쓰기
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setFilterCat(cat);
                    setBoardPage(1);
                  }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filterCat === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex gap-1 rounded-xl bg-secondary p-1 mb-4">
              {BOARD_SORT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setBoardSort(option.value);
                    setBoardPage(1);
                  }}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                    boardSort === option.value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {loadingPosts ? (
              <div className="flex justify-center pt-16">
                <Loader2
                  size={28}
                  className="animate-spin text-muted-foreground"
                />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center pt-20 text-center">
                <p className="text-5xl mb-4">📋</p>
                <p className="text-base font-semibold mb-1">
                  {filterCat === "전체"
                    ? "아직 게시글이 없어요"
                    : `${filterCat} 글이 없어요`}
                </p>
                <p className="text-sm text-muted-foreground">
                  첫 글을 작성해보세요!
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 stagger-children">
                  {pagedPosts.map(post => {
                    const isLiked = post.likes?.includes(user?.uid);
                    const likeCount = post.likes?.length ?? 0;
                    const commentCount = post.commentCount ?? 0;
                    const catStyle =
                      CAT_STYLE[post.category] ?? CAT_STYLE["자유"];
                    return (
                      <div
                        key={post.id}
                        onClick={() =>
                          navigate("/community/board", {
                            state: { view: "detail", postId: post.id, post },
                          })
                        }
                        className="book-card p-4 cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                            {(post.authorName || "?")[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-xs font-semibold">
                                {post.authorName}
                              </span>
                              <span
                                className={`text-[10px] font-semibold ${catStyle.bg} ${catStyle.text} rounded-full px-2 py-0.5`}
                              >
                                {post.category}
                              </span>
                              <span className="text-[11px] text-muted-foreground ml-auto">
                                {formatTs(post.createdAt)}
                              </span>
                            </div>
                            <h3 className="text-sm font-semibold mb-1 line-clamp-1">
                              {post.title}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span
                                className={`flex items-center gap-1 text-xs ${isLiked ? "text-red-500" : "text-muted-foreground"}`}
                              >
                                <Heart
                                  size={12}
                                  fill={isLiked ? "currentColor" : "none"}
                                />
                                <span>{likeCount}</span>
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MessageSquare size={12} />
                                <span>{commentCount}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalBoardPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-1">
                    {Array.from(
                      { length: totalBoardPages },
                      (_, i) => i + 1
                    ).map(page => (
                      <button
                        key={page}
                        onClick={() => setBoardPage(page)}
                        className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${
                          boardPage === page
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
