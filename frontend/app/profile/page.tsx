"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getMemoriesFeed, Post } from "@/services/postService";
import { toggleLike, getComments, addComment, deleteComment, CommentDto } from "@/services/likeCommentService";
import { getInTouchConnections, getTimelineEntries, addTimelineEntry, deleteTimelineEntry, TimelineEntry } from "@/services/alumniService";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);

  // Statistics & Connections
  const [connections, setConnections] = useState<UserProfile[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);

  // Timeline Addition State
  const [showAddTimeline, setShowAddTimeline] = useState(false);
  const [newTimelineYear, setNewTimelineYear] = useState(new Date().getFullYear());
  const [newTimelineTitle, setNewTimelineTitle] = useState("");
  const [newTimelineDesc, setNewTimelineDesc] = useState("");
  const [addingTimeline, setAddingTimeline] = useState(false);

  // Comments / Detail modal state
  const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentSubmitError, setCommentSubmitError] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchProfileTimeline = async (userId: string) => {
    try {
      const list = await getTimelineEntries(userId);
      setTimeline(list);
    } catch (err) {
      console.error("Failed to fetch timeline:", err);
    } finally {
      setTimelineLoading(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const profile = await getUserProfile();
        if (!profile.profileCompleted) {
          router.push("/profile/setup");
          return;
        }
        setUser(profile);

        // Fetch In-Touch & Timeline in background
        getInTouchConnections()
          .then(setConnections)
          .catch(console.error);

        fetchProfileTimeline(profile.id);

        // Fetch feed and filter own posts
        try {
          const memories = await getMemoriesFeed();
          const ownPosts = memories.filter((p) => p.userId === profile.id);
          setMyPosts(ownPosts);
        } catch (feedErr) {
          console.error("Failed to load posts:", feedErr);
        } finally {
          setFeedLoading(false);
        }
      } catch (err) {
        console.error(err);
        clearAuth();
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimelineTitle.trim()) return;

    setAddingTimeline(true);
    try {
      await addTimelineEntry({
        year: Number(newTimelineYear),
        title: newTimelineTitle.trim(),
        description: newTimelineDesc.trim()
      });
      setNewTimelineTitle("");
      setNewTimelineDesc("");
      setShowAddTimeline(false);
      if (user) {
        await fetchProfileTimeline(user.id);
      }
    } catch (err: any) {
      alert("Failed to add milestone: " + err.message);
    } finally {
      setAddingTimeline(false);
    }
  };

  const handleDeleteTimelineItem = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this timeline milestone?")) return;
    try {
      await deleteTimelineEntry(entryId);
      if (user) {
        await fetchProfileTimeline(user.id);
      }
    } catch (err: any) {
      alert("Failed to delete milestone: " + err.message);
    }
  };

  const handleLikeToggle = async (postId: string) => {
    try {
      const result = await toggleLike(postId);
      setMyPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? { ...p, likedByMe: result.liked, likesCount: result.likesCount }
            : p
        )
      );

      if (activePostForComments && activePostForComments.id === postId) {
        setActivePostForComments((prev) =>
          prev
            ? { ...prev, likedByMe: result.liked, likesCount: result.likesCount }
            : null
        );
      }
    } catch (err: any) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleOpenCommentsModal = async (post: Post) => {
    setActivePostForComments(post);
    setCommentsLoading(true);
    setCommentSubmitError(null);
    setNewCommentText("");
    try {
      const list = await getComments(post.id);
      setComments(list);
    } catch (err: any) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePostForComments) return;
    setCommentSubmitError(null);

    const commentVal = newCommentText.trim();
    if (!commentVal) {
      setCommentSubmitError("Comment must not be empty.");
      return;
    }

    setSubmittingComment(true);
    try {
      const created = await addComment(activePostForComments.id, commentVal);
      setComments([created, ...comments]);
      setNewCommentText("");

      setMyPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === activePostForComments.id
            ? { ...p, commentsCount: p.commentsCount + 1 }
            : p
        )
      );
      setActivePostForComments({
        ...activePostForComments,
        commentsCount: activePostForComments.commentsCount + 1,
      });
    } catch (err: any) {
      setCommentSubmitError(err.message || "Failed to submit comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!activePostForComments || !confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteComment(commentId);
      setComments(comments.filter((c) => c.id !== commentId));

      setMyPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === activePostForComments.id
            ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) }
            : p
        )
      );
      setActivePostForComments({
        ...activePostForComments,
        commentsCount: Math.max(0, activePostForComments.commentsCount - 1),
      });
    } catch (err: any) {
      console.error("Failed to delete comment:", err);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[15px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse">Loading Profile...</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      <Sidebar user={user} />

      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_100%)] pointer-events-none" />

        <div className="z-10 w-full max-w-2xl mx-auto px-6 md:px-12 py-10 md:py-16 flex flex-col space-y-8">
          
          {/* Profile Details Card */}
          <div className="glass-panel rounded-[20px] p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start md:space-x-8 gap-6 border border-white/8 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
            
            {/* Avatar */}
            <div className="relative w-24 h-24 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center flex-shrink-0 shadow-lg">
              {user.profilePicture ? (
                <Image
                  src={user.profilePicture}
                  alt={user.fullName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-3xl font-light text-neutral-450">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <h2 className="text-[22px] md:text-[24px] font-light tracking-wide uppercase text-white leading-tight">{user.fullName}</h2>
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/edit"
                    className="px-3.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-semibold tracking-wider transition-all uppercase rounded-full"
                  >
                    Edit Profile
                  </Link>
                  <span className="text-[10px] bg-white/10 text-white font-medium px-2 py-0.5 border border-white/10 rounded-full tracking-wider uppercase">
                    {user.privacyLevel === "IN_TOUCH_ONLY" || user.privacyLevel === "IN_TOUCH" ? "🔒 In-Touch Only" : user.privacyLevel === "ACADEMIC" ? "🎓 Academic" : "🌍 Public"}
                  </span>
                </div>
              </div>

              {/* Statistics Counters */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-1.5 text-[11px] text-neutral-450 font-light uppercase tracking-wider">
                <span><strong className="text-white font-medium">{myPosts.length}</strong> Memories</span>
                <span><strong className="text-white font-medium">{connections.length}</strong> In-Touch</span>
                <span><strong className="text-white font-medium">{timeline.length}</strong> Milestones</span>
                <span>Class of {user.batch} • {user.department} {user.section ? `Sec ${user.section}` : ""}</span>
              </div>

              {/* Position and City */}
              <div className="space-y-1 text-[13px] font-light text-neutral-300">
                <span className="text-white font-medium block">
                  {user.currentPosition || "Alumni Member"} {user.currentCompany && `at ${user.currentCompany}`}
                </span>
                {user.currentCity && (
                  <p className="text-[12px] text-neutral-500 uppercase tracking-widest">📍 {user.currentCity}</p>
                )}
                {user.graduationYear && (
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wider">Graduated in {user.graduationYear}</p>
                )}
              </div>

              {/* Profile Badges */}
              {user.badges && (
                <div className="flex flex-wrap gap-2 pt-1 justify-center md:justify-start">
                  {user.badges.split(",").map((b) => b.trim()).filter(Boolean).map((badge, idx) => {
                    let badgeColor = "border-amber-500/30 bg-amber-500/[0.03] text-amber-400";
                    if (badge.toUpperCase() === "MENTOR") {
                      badgeColor = "border-emerald-500/30 bg-emerald-500/[0.03] text-emerald-400";
                    } else if (badge.toUpperCase() === "ENTREPRENEUR") {
                      badgeColor = "border-indigo-500/30 bg-indigo-500/[0.03] text-indigo-400";
                    } else if (badge.toUpperCase() === "HIRING") {
                      badgeColor = "border-sky-500/30 bg-sky-500/[0.03] text-sky-400";
                    } else if (badge.toUpperCase() === "REUNION ORGANIZER") {
                      badgeColor = "border-rose-500/30 bg-rose-500/[0.03] text-rose-400";
                    }
                    return (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border ${badgeColor}`}
                      >
                        ⚡ {badge}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Open To preferences */}
              {user.openTo && (
                <div className="flex flex-col items-center md:items-start text-[11px] text-neutral-450 space-y-1">
                  <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Open to:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {user.openTo.split(",").map((o) => o.trim()).filter(Boolean).map((pref, idx) => (
                      <span key={idx} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-[10px] text-neutral-300 font-medium">
                        💼 {pref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills Tags */}
              {user.skills && (
                <div className="flex flex-wrap gap-1.5 pt-1 justify-center md:justify-start">
                  {user.skills.split(",").map((s) => s.trim()).filter(Boolean).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-neutral-350 uppercase tracking-wider font-light"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Bio & Socials */}
              {user.bio && (
                <p className="text-neutral-400 text-[13px] font-light leading-relaxed whitespace-pre-wrap max-w-lg">{user.bio}</p>
              )}

              {(user.linkedinUrl || user.githubUrl || user.instagramUrl) && (
                <div className="flex flex-wrap gap-4 pt-1 text-[11px]">
                  {user.linkedinUrl && (
                    <a
                      href={user.linkedinUrl.startsWith("http") ? user.linkedinUrl : `https://${user.linkedinUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-450 hover:text-white uppercase tracking-widest underline"
                    >
                      LinkedIn
                    </a>
                  )}
                  {user.githubUrl && (
                    <a
                      href={user.githubUrl.startsWith("http") ? user.githubUrl : `https://${user.githubUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-450 hover:text-white uppercase tracking-widest underline"
                    >
                      GitHub
                    </a>
                  )}
                  {user.instagramUrl && (
                    <a
                      href={user.instagramUrl.startsWith("http") ? user.instagramUrl : `https://${user.instagramUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-450 hover:text-white uppercase tracking-widest underline"
                    >
                      Instagram
                    </a>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Timeline Manager Section */}
          <div className="glass-panel p-6 rounded-[20px] border border-white/8 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-[13px] tracking-widest uppercase text-neutral-450 font-bold">Memory Timeline</h3>
              <button
                onClick={() => setShowAddTimeline(!showAddTimeline)}
                className="py-1 px-3 bg-white text-black hover:bg-neutral-200 text-[11px] font-semibold tracking-wider uppercase rounded-full cursor-pointer transition-colors"
              >
                {showAddTimeline ? "Close Form" : "Add Milestone"}
              </button>
            </div>

            {/* Inline Add Timeline Entry Form */}
            {showAddTimeline && (
              <form onSubmit={handleAddTimeline} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] tracking-wider uppercase text-neutral-450 block font-bold">Year</label>
                    <input
                      type="number"
                      value={newTimelineYear}
                      onChange={(e) => setNewTimelineYear(Number(e.target.value))}
                      className="w-full glass-input focus:outline-none text-[13px] px-3.5 py-2.5 rounded-full"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] tracking-wider uppercase text-neutral-450 block font-bold">Title</label>
                    <input
                      type="text"
                      value={newTimelineTitle}
                      onChange={(e) => setNewTimelineTitle(e.target.value)}
                      placeholder="e.g. Joined Microsoft"
                      className="w-full glass-input focus:outline-none text-[13px] px-3.5 py-2.5 rounded-full"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] tracking-wider uppercase text-neutral-450 block font-bold">Description (Optional)</label>
                  <textarea
                    value={newTimelineDesc}
                    onChange={(e) => setNewTimelineDesc(e.target.value)}
                    placeholder="Short details about the milestone..."
                    rows={2}
                    className="w-full glass-input focus:outline-none text-[13px] p-3 resize-none rounded-xl"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={addingTimeline}
                    className="py-2 px-5 bg-white text-black hover:bg-neutral-200 text-[12px] font-semibold uppercase tracking-wider rounded-full cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {addingTimeline ? "Saving..." : "Save Milestone"}
                  </button>
                </div>
              </form>
            )}

            {/* Timeline List */}
            {timelineLoading ? (
              <p className="text-[12px] text-neutral-500 animate-pulse uppercase tracking-wider">Loading timeline...</p>
            ) : timeline.length === 0 ? (
              <p className="text-[12px] text-neutral-500 font-light italic">No timeline milestones added yet.</p>
            ) : (
              <div className="relative pl-6 border-l border-white/10 space-y-6 py-2">
                {timeline.map((item, idx) => (
                  <motion.div 
                    key={item.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative group"
                  >
                    {/* Timeline Node dot */}
                    <div className="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-white ring-4 ring-black" />
                    
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="text-[11px] font-bold text-neutral-450 tracking-wider uppercase mb-0.5">
                          {item.year}
                        </div>
                        <h4 className="text-[13px] font-medium text-white uppercase tracking-wide">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-[12px] text-neutral-450 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Delete icon */}
                      {item.id && (
                        <button
                          onClick={() => handleDeleteTimelineItem(item.id!)}
                          className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-500 text-[10px] tracking-wider uppercase transition-opacity cursor-pointer border border-white/5 px-2 py-0.5 rounded-full"
                          title="Delete Milestone"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Posts Grid Header */}
          <div className="flex justify-center border-b border-white/5 pb-4">
            <span className="text-[13px] font-bold tracking-widest uppercase text-white border-t border-white pt-4 flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              My Memories
            </span>
          </div>

          {/* User's own posts grid */}
          {feedLoading ? (
            <div className="flex items-center justify-center p-16 glass-panel rounded-[20px] border border-white/8">
              <span className="text-[13px] text-neutral-400 tracking-widest uppercase animate-pulse">Loading Posts...</span>
            </div>
          ) : myPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 glass-panel text-center rounded-[20px] border border-white/8">
              <span className="text-[14px] font-light text-neutral-450 uppercase tracking-wider">No memories shared by you yet.</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 md:gap-5">
              {myPosts.map((post) => (
                <motion.div
                  key={post.id}
                  whileHover={{ scale: 1.015 }}
                  onClick={() => handleOpenCommentsModal(post)}
                  className="aspect-square glass-panel cursor-pointer relative overflow-hidden group rounded-[20px] border border-white/8"
                >
                  {post.imageUrl ? (
                    <Image
                      src={post.imageUrl}
                      alt="Memory Thumbnail"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 text-center">
                      <p className="text-[13px] font-light text-neutral-300 line-clamp-3 leading-relaxed">
                        {post.caption}
                      </p>
                    </div>
                  )}

                  {/* Hover stats overlay */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-5 text-[12px]">
                    <div className="flex items-center space-x-1.5">
                      <svg className="w-4 h-4 text-white fill-white" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span className="font-medium text-white">{post.likesCount}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <svg className="w-4 h-4 text-white fill-white" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                      </svg>
                      <span className="font-medium text-white">{post.commentsCount}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Post Detail / Comments Modal */}
      <AnimatePresence>
        {activePostForComments && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={() => setActivePostForComments(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[26px] p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-xl glass-panel p-6 md:p-8 space-y-5 shadow-2xl relative flex flex-col max-h-[90vh] rounded-[24px]"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Modal Title & Stats */}
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-[18px] font-light tracking-[0.15em] uppercase leading-tight">Memory Detail</h2>
                  <p className="text-[11px] tracking-wider text-neutral-450 mt-1 uppercase">
                    Shared {formatTime(activePostForComments.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePostForComments(null)}
                  className="text-neutral-400 hover:text-white text-[12px] uppercase tracking-widest border border-white/10 hover:border-white px-4 py-2 cursor-pointer rounded-full transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Post Caption Block */}
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                {activePostForComments.imageUrl && (
                  <div className="relative w-full aspect-[4/3] bg-neutral-900 rounded-lg overflow-hidden border border-white/5">
                    <Image
                      src={activePostForComments.imageUrl}
                      alt="Post image"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[15px] text-neutral-200 font-light leading-relaxed whitespace-pre-wrap">{activePostForComments.caption}</p>
                  <motion.button
                    whileTap={{ scale: 1.2 }}
                    onClick={() => handleLikeToggle(activePostForComments.id)}
                    className="text-[24px] focus:outline-none cursor-pointer pl-3"
                  >
                    {activePostForComments.likedByMe ? "❤️" : "🤍"}
                  </motion.button>
                </div>
                <div className="text-[12px] text-neutral-500 uppercase tracking-wider">
                  {activePostForComments.likesCount} likes • {activePostForComments.commentsCount} comments
                </div>
              </div>

              {/* Comment List */}
              <div className="flex-1 overflow-y-auto min-h-[180px] space-y-5 pr-2">
                {commentsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <span className="text-[13px] text-neutral-400 tracking-widest uppercase animate-pulse">Loading Comments...</span>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex justify-center items-center h-32 text-neutral-500 text-[13px] uppercase tracking-wider">
                    <span>No comments yet.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex items-start justify-between border-b border-white/5 pb-4 gap-4">
                        <div className="flex items-start space-x-3.5">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center flex-shrink-0">
                            {comment.userProfilePicture ? (
                              <Image
                                src={comment.userProfilePicture}
                                alt={comment.userFullName}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <span className="text-[13px] text-neutral-450 font-light">
                                {comment.userFullName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-baseline space-x-2">
                              <span className="text-[13px] font-semibold text-white tracking-wide">{comment.userFullName}</span>
                              {comment.userCurrentPosition && (
                                <span className="text-[11px] text-neutral-500 hidden sm:inline">• {comment.userCurrentPosition}</span>
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-550 block mt-1">{formatTime(comment.createdAt)}</span>
                            <p className="text-[13px] font-light text-neutral-200 mt-1.5 leading-relaxed whitespace-pre-wrap">{comment.comment}</p>
                          </div>
                        </div>

                        {comment.userId === user.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-neutral-500 hover:text-red-400 text-[11px] tracking-wider uppercase border border-white/5 hover:border-red-955 px-2.5 py-1 flex-shrink-0 cursor-pointer rounded-full transition-colors"
                            title="Delete Comment"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comment Form */}
              <form onSubmit={handleAddComment} className="flex space-x-3 pt-4 border-t border-white/5">
                {commentSubmitError && (
                  <div className="p-3 bg-red-950/20 border border-red-900/50 text-red-500 text-[12px] tracking-wider rounded-xl">
                    {commentSubmitError}
                  </div>
                )}
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 glass-input focus:outline-none px-4 py-2.5 text-[13px] rounded-full"
                />
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="py-2 px-4 bg-white text-black hover:bg-neutral-200 text-[12px] font-semibold uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  Post
                </button>
              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
