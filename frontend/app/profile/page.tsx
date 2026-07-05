"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getMemoriesFeed, Post } from "@/services/postService";
import { toggleLike, getComments, addComment, deleteComment, CommentDto } from "@/services/likeCommentService";
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

  // Comments / Detail modal state
  const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentSubmitError, setCommentSubmitError] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const profile = await getUserProfile();
        if (!profile.profileCompleted) {
          router.push("/profile/setup");
          return;
        }
        setUser(profile);

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

  const handleLikeToggle = async (postId: string) => {
    try {
      const result = await toggleLike(postId);
      // Update myPosts
      setMyPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? { ...p, likedByMe: result.liked, likesCount: result.likesCount }
            : p
        )
      );

      // Update activePostForComments if open
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
    if (commentVal.length > 500) {
      setCommentSubmitError("Comment must not exceed 500 characters.");
      return;
    }

    setSubmittingComment(true);
    try {
      const created = await addComment(activePostForComments.id, commentVal);
      setComments([created, ...comments]);
      setNewCommentText("");

      // Increment comments count dynamically
      setMyPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === activePostForComments.id
            ? { ...p, commentsCount: p.commentsCount + 1 }
            : p
        )
      );
      // Update local post count reference
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
    if (!activePostForComments) return;
    try {
      await deleteComment(commentId);
      setComments(comments.filter((c) => c.id !== commentId));

      // Decrement comments count dynamically
      setMyPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === activePostForComments.id
            ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) }
            : p
        )
      );
      // Update local post count reference
      setActivePostForComments({
        ...activePostForComments,
        commentsCount: Math.max(0, activePostForComments.commentsCount - 1),
      });
    } catch (err: any) {
      console.error("Failed to delete comment:", err);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return isoString;
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[17px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse">Loading Profile...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      {/* Fixed Left Sidebar */}
      <Sidebar user={user} />

      {/* Main Container */}
      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="z-10 w-full max-w-3xl mx-auto px-6 md:px-12 py-10 md:py-16 flex flex-col space-y-8">
          
          {/* Profile Header Block */}
          <div className="glass-panel rounded-[20px] p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start md:space-x-8 gap-6 border border-white/8 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
            
            {/* Left Column: Avatar */}
            <div className="relative w-28 h-28 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center flex-shrink-0 shadow-lg">
              {user.profilePicture ? (
                <Image
                  src={user.profilePicture}
                  alt={user.fullName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-4xl font-light text-neutral-450">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Right Column: User Details */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-5">
              
              {/* Header: Name and Action buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <h2 className="text-[24px] md:text-[26px] font-light tracking-wide uppercase text-white leading-tight">{user.fullName}</h2>
                <Link
                  href="/dashboard/edit"
                  className="px-4 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-[11px] font-medium tracking-[0.15em] transition-all duration-200 uppercase rounded-full"
                >
                  Edit Profile
                </Link>
              </div>

              {/* Counts: Posts, Batch, Department */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 text-[13px] text-neutral-450 font-light uppercase tracking-wider">
                <span><strong className="text-white font-medium">{myPosts.length}</strong> posts</span>
                <span>Class of {user.batch}</span>
                <span>{user.department} {user.section ? `Sec ${user.section}` : ""}</span>
              </div>

              {/* Bio & Professional Info */}
              <div className="space-y-1.5 text-[14px] font-light text-neutral-355 leading-relaxed max-w-lg">
                <span className="text-white font-medium block text-[17px]">
                  {user.currentPosition || "Alumni Member"}
                </span>
                {user.bio && (
                  <p className="text-neutral-400 whitespace-pre-wrap">{user.bio}</p>
                )}
              </div>

              {/* Social Links */}
              {(user.linkedinUrl || user.githubUrl || user.instagramUrl) && (
                <div className="flex flex-wrap gap-4 pt-2 text-[13px]">
                  {user.linkedinUrl && (
                    <a
                      href={user.linkedinUrl.startsWith("http") ? user.linkedinUrl : `https://${user.linkedinUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-450 hover:text-white uppercase tracking-widest text-[12px] underline"
                    >
                      LinkedIn
                    </a>
                  )}
                  {user.githubUrl && (
                    <a
                      href={user.githubUrl.startsWith("http") ? user.githubUrl : `https://${user.githubUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-450 hover:text-white uppercase tracking-widest text-[12px] underline"
                    >
                      GitHub
                    </a>
                  )}
                  {user.instagramUrl && (
                    <a
                      href={user.instagramUrl.startsWith("http") ? user.instagramUrl : `https://${user.instagramUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-450 hover:text-white uppercase tracking-widest text-[12px] underline"
                    >
                      Instagram
                    </a>
                  )}
                </div>
              )}

            </div>

          </div>

          {/* Posts Grid Header */}
          <div className="flex justify-center border-b border-white/5 pb-4">
            <span className="text-[15px] font-bold tracking-widest uppercase text-white border-t border-white pt-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              My Memories
            </span>
          </div>

          {/* User's own posts grid */}
          {feedLoading ? (
            <div className="flex items-center justify-center p-16 glass-panel rounded-[24px]">
              <span className="text-[15px] text-neutral-400 tracking-widest uppercase animate-pulse">Loading Posts...</span>
            </div>
          ) : myPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 glass-panel text-center rounded-[24px]">
              <span className="text-[17px] font-light text-neutral-300">No memories shared by you yet.</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 md:gap-5">
              {myPosts.map((post) => (
                <motion.div
                  key={post.id}
                  whileHover={{ scale: 1.015 }}
                  onClick={() => handleOpenCommentsModal(post)}
                  className="aspect-square glass-panel cursor-pointer relative overflow-hidden group rounded-[20px]"
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
                      <p className="text-[15px] font-light text-neutral-305 line-clamp-3 leading-relaxed">
                        {post.caption}
                      </p>
                    </div>
                  )}

                  {/* Hover stats overlay */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-5 text-[14px]">
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
                  <h2 className="text-[20px] font-light tracking-[0.15em] uppercase leading-tight">Memory Detail</h2>
                  <p className="text-[12px] tracking-wider text-neutral-400 mt-1.5 uppercase">
                    Shared {formatTime(activePostForComments.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePostForComments(null)}
                  className="text-neutral-400 hover:text-white text-[13px] uppercase tracking-widest border border-white/10 hover:border-white px-4 py-2 cursor-pointer rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Post Caption Block */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
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
                  <p className="text-[17px] text-neutral-200 font-light leading-relaxed whitespace-pre-wrap">{activePostForComments.caption}</p>
                  <motion.button
                    whileTap={{ scale: 1.2 }}
                    onClick={() => handleLikeToggle(activePostForComments.id)}
                    className="text-[28px] focus:outline-none cursor-pointer pl-3"
                  >
                    {activePostForComments.likedByMe ? "❤️" : "🤍"}
                  </motion.button>
                </div>
                <div className="text-[15px] text-neutral-500 uppercase tracking-wider">
                  {activePostForComments.likesCount} likes • {activePostForComments.commentsCount} comments
                </div>
              </div>

              {/* Comment List */}
              <div className="flex-1 overflow-y-auto min-h-[220px] space-y-5 pr-2">
                {commentsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <span className="text-[15px] text-neutral-400 tracking-widest uppercase animate-pulse">Loading Comments...</span>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex justify-center items-center h-32 text-neutral-500 text-[15px]">
                    <span>No comments yet.</span>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex items-start justify-between border-b border-white/5 pb-4 gap-4">
                        <div className="flex items-start space-x-4">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center flex-shrink-0">
                            {comment.userProfilePicture ? (
                              <Image
                                src={comment.userProfilePicture}
                                alt={comment.userFullName}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <span className="text-[15px] text-neutral-400 font-light">
                                {comment.userFullName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-baseline space-x-2">
                              <span className="text-[15px] font-semibold text-white tracking-wide">{comment.userFullName}</span>
                              {comment.userCurrentPosition && (
                                <span className="text-[13px] text-neutral-400 hidden sm:inline">• {comment.userCurrentPosition}</span>
                              )}
                            </div>
                            <span className="text-[13px] text-neutral-500 block mt-1">{formatTime(comment.createdAt)}</span>
                            <p className="text-[15px] font-light text-neutral-200 mt-2 leading-relaxed whitespace-pre-wrap">{comment.comment}</p>
                          </div>
                        </div>

                        {/* Delete comment option (owner only) */}
                        {comment.userId === user.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-neutral-500 hover:text-red-400 text-[13px] tracking-wider uppercase border border-transparent hover:border-red-955 px-3 py-1.5 flex-shrink-0 cursor-pointer rounded-lg transition-colors"
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
              <form onSubmit={handleAddComment} className="flex space-x-4 pt-5 border-t border-white/5">
                {commentSubmitError && (
                  <div className="p-3 bg-red-950/20 border border-red-900/50 text-red-500 text-[13px] tracking-wider rounded-lg">
                    {commentSubmitError}
                  </div>
                )}
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 glass-input focus:outline-none p-3 text-[14px] rounded-full"
                />
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="py-2.5 px-5 bg-white text-black hover:bg-neutral-200 text-[13px] font-semibold uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer disabled:opacity-50 flex-shrink-0"
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
