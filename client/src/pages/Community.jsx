// Booklog Community — 「따뜻한 라이브러리」
// Community: book clubs, free board
// FR-41~53: 모임 목록/상세/생성/참여, 게시글/댓글 작성
import { useState } from "react";
import { Plus, Users, MessageSquare, Heart, ChevronRight, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MOCK_CLUBS, MOCK_POSTS } from "@/lib/mockData";
const CATEGORY_LABELS = {
    free: "자유",
    review: "독후감",
    question: "질문",
};
const CATEGORY_CLASS = {
    free: "bg-secondary text-secondary-foreground",
    review: "bg-primary/10 text-primary",
    question: "bg-accent text-accent-foreground",
};
export default function Community() {
    const [view, setView] = useState("list");
    const [selectedClubId, setSelectedClubId] = useState(null);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [comment, setComment] = useState("");
    const [newPost, setNewPost] = useState({ title: "", content: "", category: "free" });
    const selectedClub = MOCK_CLUBS.find(c => c.id === selectedClubId);
    const selectedPost = MOCK_POSTS.find(p => p.id === selectedPostId);
    // Club Detail View
    if (view === "club-detail" && selectedClub) {
        return (<>
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button onClick={() => setView("list")} className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft size={18}/>
          </button>
          <h1 className="text-lg font-bold flex-1 line-clamp-1">{selectedClub.name}</h1>
        </div>
        <div className="animate-fade-in-up">
          <img src={selectedClub.cover} alt={selectedClub.name} className="w-full h-52 object-cover"/>
          <div className="px-4 py-5">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedClub.tags.map(t => (<span key={t} className="tag-pill bg-secondary text-secondary-foreground text-xs">{t}</span>))}
            </div>
            <h2 className="text-2xl font-bold mb-2">{selectedClub.name}</h2>
            <p className="text-sm text-muted-foreground mb-5">{selectedClub.description}</p>

            <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
              {[
                { label: "현재 도서", value: selectedClub.currentBook },
                { label: "읽을 범위", value: selectedClub.pageRange },
                { label: "마감일", value: selectedClub.deadline },
                { label: "멤버", value: `${selectedClub.memberCount}/${selectedClub.maxMembers}명` },
            ].map(({ label, value }) => (<div key={label} className="bg-secondary/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                  <p className="text-sm font-semibold">{value}</p>
                </div>))}
            </div>

            <Button onClick={() => toast.success(selectedClub.isJoined ? "모임에서 나왔습니다." : "모임에 참여했습니다!")} className={`w-full h-11 rounded-xl font-semibold ${selectedClub.isJoined ? "bg-secondary text-foreground hover:bg-secondary/80" : ""}`} variant={selectedClub.isJoined ? "outline" : "default"}>
              {selectedClub.isJoined ? "모임 나가기" : "모임 참여하기"}
            </Button>

            {/* Posts in club */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">감상 공유</h3>
                <button onClick={() => setView("create-post")} className="flex items-center gap-1 text-xs text-primary font-medium">
                  <Plus size={13}/> 작성
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {MOCK_POSTS.slice(0, 2).map(post => (<div key={post.id} className="book-card p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={post.authorAvatar} alt={post.author} className="w-7 h-7 rounded-full object-cover"/>
                      <span className="text-xs font-medium">{post.author}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{post.createdAt}</span>
                    </div>
                    <p className="text-sm font-semibold mb-1">{post.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                  </div>))}
              </div>
            </div>
          </div>
        </div>
      </>);
    }
    // Post Detail View
    if (view === "post-detail" && selectedPost) {
        return (<>
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button onClick={() => setView("list")} className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft size={18}/>
          </button>
          <h1 className="text-lg font-bold flex-1 line-clamp-1">게시글</h1>
        </div>
        <div className="px-4 animate-fade-in-up max-w-2xl">
          <div className="mb-4">
            <span className={`tag-pill ${CATEGORY_CLASS[selectedPost.category]} text-xs mb-2 inline-block`}>
              {CATEGORY_LABELS[selectedPost.category]}
            </span>
            <h2 className="text-xl font-bold mb-3">
              {selectedPost.title}
            </h2>
            <div className="flex items-center gap-2 mb-4">
              <img src={selectedPost.authorAvatar} alt={selectedPost.author} className="w-8 h-8 rounded-full object-cover"/>
              <div>
                <p className="text-sm font-medium">{selectedPost.author}</p>
                <p className="text-xs text-muted-foreground">{selectedPost.createdAt}</p>
              </div>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{selectedPost.content}</p>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/40">
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Heart size={16}/> {selectedPost.likes}
              </button>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MessageSquare size={16}/> {selectedPost.comments}
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="border-t border-border/40 pt-4 mb-4">
            <h3 className="text-sm font-semibold mb-3">댓글 {selectedPost.comments}개</h3>
            <div className="space-y-3 mb-4">
              {[
                { name: "이책장", text: "정말 공감되는 리뷰예요! 저도 같은 부분에서 많이 생각했어요.", time: "1시간 전" },
                { name: "박세계", text: "좋은 글 감사합니다. 저도 읽어봐야겠네요.", time: "30분 전" },
            ].map((c, i) => (<div key={i} className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 bg-secondary/50 rounded-xl px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{c.name}</span>
                      <span className="text-[11px] text-muted-foreground">{c.time}</span>
                    </div>
                    <p className="text-xs text-foreground/80">{c.text}</p>
                  </div>
                </div>))}
            </div>
          </div>

          {/* Comment Input */}
          <div className="flex gap-2 pb-8">
            <Input placeholder="댓글을 입력하세요..." value={comment} onChange={e => setComment(e.target.value)} className="flex-1 h-10 bg-secondary border-none rounded-xl text-sm"/>
            <button onClick={() => { toast.success("댓글이 등록되었습니다."); setComment(""); }} className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Send size={16}/>
            </button>
          </div>
        </div>
      </>);
    }
    // Create Post View
    if (view === "create-post") {
        return (<>
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button onClick={() => setView("list")} className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft size={18}/>
          </button>
          <h1 className="text-lg font-bold">게시글 작성</h1>
        </div>
        <div className="px-4 animate-fade-in-up space-y-4 max-w-2xl pb-8">
          <div className="flex gap-2">
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (<button key={val} onClick={() => setNewPost(p => ({ ...p, category: val }))} className={`tag-pill text-xs ${newPost.category === val ? CATEGORY_CLASS[val] : "bg-secondary text-muted-foreground"}`}>
                {label}
              </button>))}
          </div>
          <Input placeholder="제목을 입력하세요" value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} className="h-11 bg-secondary border-none rounded-xl"/>
          <Textarea placeholder="내용을 입력하세요..." value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))} className="min-h-48 bg-secondary border-none rounded-xl resize-none"/>
          <Button onClick={() => { toast.success("게시글이 등록되었습니다!"); setView("list"); }} className="w-full h-11 rounded-xl font-semibold" disabled={!newPost.title || !newPost.content}>
            게시하기
          </Button>
        </div>
      </>);
    }
    // Main Community List
    return (<>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold">커뮤니티</h1>
        <button onClick={() => setView("create-post")} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus size={15}/>
          글쓰기
        </button>
      </div>

      <div className="px-4 pb-8">
        <Tabs defaultValue="clubs">
          <TabsList className="w-full bg-secondary rounded-xl p-1 h-auto mb-6">
            <TabsTrigger value="clubs" className="flex-1 text-sm py-2.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              독서 모임
            </TabsTrigger>
            <TabsTrigger value="board" className="flex-1 text-sm py-2.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              자유 게시판
            </TabsTrigger>
          </TabsList>

          {/* Book Clubs Tab */}
          <TabsContent value="clubs" className="mt-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">현재 {MOCK_CLUBS.length}개 모임 운영 중</p>
              <button onClick={() => toast.info("모임 생성 기능은 준비 중입니다.")} className="flex items-center gap-1 text-sm text-primary font-medium">
                <Plus size={14}/> 모임 만들기
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 stagger-children">
              {MOCK_CLUBS.map(club => (<div key={club.id} className="book-card overflow-hidden cursor-pointer" onClick={() => { setSelectedClubId(club.id); setView("club-detail"); }}>
                  <div className="relative h-36">
                    <img src={club.cover} alt={club.name} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"/>
                    {club.isJoined && (<span className="absolute top-3 right-3 px-2 py-1 bg-primary text-primary-foreground text-[11px] font-semibold rounded-full">
                        참여 중
                      </span>)}
                    <div className="absolute bottom-3 left-3 flex gap-1.5">
                      {club.tags.map(t => (<span key={t} className="px-2 py-0.5 bg-black/40 backdrop-blur-sm text-white text-[11px] rounded-full">{t}</span>))}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-sm leading-snug">
                        {club.name}
                      </h3>
                      <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-0.5"/>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{club.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users size={12}/>
                        <span>{club.memberCount}/{club.maxMembers}명</span>
                      </div>
                      <span>📖 {club.currentBook}</span>
                      <span>~{club.deadline}</span>
                    </div>
                    {/* Member capacity bar */}
                    <div className="mt-2 progress-bar">
                      <div className="progress-fill" style={{ width: `${(club.memberCount / club.maxMembers) * 100}%` }}/>
                    </div>
                  </div>
                </div>))}
            </div>
          </TabsContent>

          {/* Free Board Tab */}
          <TabsContent value="board" className="mt-0">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
              {["전체", "자유", "독후감", "질문"].map(cat => (<button key={cat} className="flex-shrink-0 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors">
                  {cat}
                </button>))}
            </div>
            <div className="space-y-3 stagger-children">
              {MOCK_POSTS.map(post => (<div key={post.id} className="book-card p-4 cursor-pointer" onClick={() => { setSelectedPostId(post.id); setView("post-detail"); }}>
                  <div className="flex items-start gap-3">
                    <img src={post.authorAvatar} alt={post.author} className="w-9 h-9 rounded-full object-cover flex-shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">{post.author}</span>
                        <span className={`tag-pill ${CATEGORY_CLASS[post.category]} text-[10px]`}>
                          {CATEGORY_LABELS[post.category]}
                        </span>
                        <span className="text-[11px] text-muted-foreground ml-auto">{post.createdAt}</span>
                      </div>
                      <h3 className="text-sm font-semibold mb-1 line-clamp-1">{post.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Heart size={12}/> {post.likes}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare size={12}/> {post.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>);
}
