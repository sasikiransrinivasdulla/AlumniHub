"use client";

import { useEffect, useState, useRef } from "react";
import { useModal } from "@/hooks/useModal";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getMemoriesFeed, createPost, getMemoryOfTheDay, Post } from "@/services/postService";
import { toggleLike, getComments, addComment, deleteComment, CommentDto } from "@/services/likeCommentService";
import { uploadPostImage, uploadPostVideo } from "@/services/uploadService";
import { getRecommendations } from "@/services/alumniService";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { requestCache } from "@/services/cacheService";

const processPostsResponse = (res: any): Post[] => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.content)) return res.content;
  return [];
};

const processCommentsResponse = (res: any): CommentDto[] => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.content)) return res.content;
  return [];
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);

  // Recommendations & Memory of the Day
  const [recommendations, setRecommendations] = useState<UserProfile[]>([]);
  const [recLoading, setRecLoading] = useState(true);
  const [motd, setMotd] = useState<Post | null>(null);
  const [motdLoading, setMotdLoading] = useState(true);

  // Share Memory Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Comments Modal States
  const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const shareModalRef = useRef<HTMLDivElement>(null);
  const commentModalRef = useRef<HTMLDivElement>(null);
  useModal(isModalOpen, () => setIsModalOpen(false), shareModalRef);
  useModal(activePostForComments !== null, () => setActivePostForComments(null), commentModalRef);
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
        
        // Fetch recommendations in background
        getRecommendations()
          .then(setRecommendations)
          .catch(console.error)
          .finally(() => setRecLoading(false));

        // Fetch Memory of the Day
        getMemoryOfTheDay()
          .then(setMotd)
          .catch(console.error)
          .finally(() => setMotdLoading(false));

        // Fetch memories feed from cache first
        const cachedFeed = requestCache.get("feed_posts");
        if (cachedFeed) {
          setPosts(cachedFeed);
          setFeedLoading(false);
          // fetch fresh background
          getMemoriesFeed()
            .then((res) => {
              const memories = processPostsResponse(res);
              setPosts(memories);
              requestCache.set("feed_posts", memories, 20000);
            })
            .catch(console.error);
        } else {
          try {
            const res = await getMemoriesFeed();
            const memories = processPostsResponse(res);
            setPosts(memories);
            requestCache.set("feed_posts", memories, 20000);
          } catch (feedErr) {
            console.error("Failed to load feed:", feedErr);
          } finally {
            setFeedLoading(false);
          }
        }
      } catch (err: any) {
        console.error(err);
        clearAuth();
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!caption.trim()) {
      setModalError("Caption must not be blank.");
      return;
    }

    setSubmitting(true);
    let uploadedUrl: string | null = null;

    try {
      if (selectedFile) {
        setUploading(true);
        setUploadProgress(0);
        try {
          if (mediaType === "IMAGE") {
            uploadedUrl = await uploadPostImage(selectedFile, (percent) => {
              setUploadProgress(percent);
            });
          } else {
            uploadedUrl = await uploadPostVideo(selectedFile, (percent) => {
              setUploadProgress(percent);
            });
          }
        } catch (uploadErr: any) {
          console.error(uploadErr);
          setModalError(uploadErr.message || `Failed to upload memory ${mediaType.toLowerCase()}.`);
          setSubmitting(false);
          setUploading(false);
          setUploadProgress(null);
          return;
        }
        setUploading(false);
        setUploadProgress(null);
      }

      const newPost = await createPost({
        imageUrl: mediaType === "IMAGE" ? uploadedUrl : null,
        videoUrl: mediaType === "VIDEO" ? uploadedUrl : null,
        mediaType,
        caption: caption.trim(),
      });
      
      const updated = [newPost, ...posts];
      setPosts(updated);
      requestCache.set("feed_posts", updated, 20000);
      
      // Reset and close modal
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption("");
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setModalError(err.message || "Failed to create post.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeToggle = async (postId: string) => {
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const originalLiked = targetPost.likedByMe;
    const originalCount = targetPost.likesCount;
    const optimisticLiked = !originalLiked;
    const optimisticCount = originalLiked ? Math.max(0, originalCount - 1) : originalCount + 1;

    // Optimistically update
    setPosts(prevPosts => {
      if (!Array.isArray(prevPosts)) return [];
      const updated = prevPosts.map(p =>
        p.id === postId
          ? { ...p, likedByMe: optimisticLiked, likesCount: optimisticCount }
          : p
      );
      requestCache.set("feed_posts", updated, 20000);
      return updated;
    });

    try {
      const result = await toggleLike(postId);
      setPosts(prevPosts => {
        if (!Array.isArray(prevPosts)) return [];
        const updated = prevPosts.map(p =>
          p.id === postId
            ? { ...p, likedByMe: result.liked, likesCount: result.likesCount }
            : p
        );
        requestCache.set("feed_posts", updated, 20000);
        return updated;
      });
    } catch (err: any) {
      console.error("Failed to toggle like:", err);
      // Rollback
      setPosts(prevPosts => {
        if (!Array.isArray(prevPosts)) return [];
        const updated = prevPosts.map(p =>
          p.id === postId
            ? { ...p, likedByMe: originalLiked, likesCount: originalCount }
            : p
        );
        requestCache.set("feed_posts", updated, 20000);
        return updated;
      });
    }
  };

  const handleOpenCommentsModal = async (post: Post) => {
    setActivePostForComments(post);
    setCommentsLoading(true);
    setCommentSubmitError(null);
    setNewCommentText("");
    
    // Check comments cache
    const cacheKey = `comments_${post.id}`;
    const cachedComments = requestCache.get(cacheKey);
    if (cachedComments) {
      setComments(processCommentsResponse(cachedComments));
      setCommentsLoading(false);
      
      // refresh in background
      getComments(post.id)
        .then((res) => {
          const list = processCommentsResponse(res);
          setComments(list);
          requestCache.set(cacheKey, list, 10000);
        })
        .catch(console.error);
      return;
    }

    try {
      const res = await getComments(post.id);
      const list = processCommentsResponse(res);
      setComments(list);
      requestCache.set(cacheKey, list, 10000);
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

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticComment: CommentDto = {
      id: optimisticId,
      userId: user!.id,
      userFullName: user!.fullName,
      userProfilePicture: user!.profilePicture,
      userCurrentPosition: user!.currentPosition,
      comment: commentVal,
      createdAt: new Date().toISOString()
    };

    // Optimistically update states
    setComments(prev => {
      const currentComments = Array.isArray(prev) ? prev : [];
      const updated = [optimisticComment, ...currentComments];
      requestCache.set(`comments_${activePostForComments.id}`, updated, 10000);
      return updated;
    });

    setPosts(prevPosts => {
      if (!Array.isArray(prevPosts)) return [];
      const updated = prevPosts.map(p =>
        p.id === activePostForComments.id
          ? { ...p, commentsCount: p.commentsCount + 1 }
          : p
      );
      requestCache.set("feed_posts", updated, 20000);
      return updated;
    });

    setActivePostForComments(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);

    setSubmittingComment(true);
    try {
      const created = await addComment(activePostForComments.id, commentVal);
      setComments(prev => {
        if (!Array.isArray(prev)) return [created];
        const filtered = prev.filter(c => c.id !== optimisticId);
        const updated = [created, ...filtered];
        requestCache.set(`comments_${activePostForComments.id}`, updated, 10000);
        return updated;
      });
    } catch (err: any) {
      setCommentSubmitError(err.message || "Failed to submit comment.");
      // Rollback
      setComments(prev => {
        if (!Array.isArray(prev)) return [];
        const updated = prev.filter(c => c.id !== optimisticId);
        requestCache.set(`comments_${activePostForComments.id}`, updated, 10000);
        return updated;
      });
      setPosts(prevPosts => {
        if (!Array.isArray(prevPosts)) return [];
        const updated = prevPosts.map(p =>
          p.id === activePostForComments.id
            ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) }
            : p
        );
        requestCache.set("feed_posts", updated, 20000);
        return updated;
      });
      setActivePostForComments(prev => prev ? { ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) } : null);
    } finally {
      setSubmittingComment(false);
      setNewCommentText("");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!activePostForComments) return;
    const targetComment = comments.find(c => c.id === commentId);
    if (!targetComment) return;

    // Optimistically delete
    setComments(prev => {
      if (!Array.isArray(prev)) return [];
      const updated = prev.filter(c => c.id !== commentId);
      requestCache.set(`comments_${activePostForComments.id}`, updated, 10000);
      return updated;
    });

    setPosts(prevPosts => {
      if (!Array.isArray(prevPosts)) return [];
      const updated = prevPosts.map(p =>
        p.id === activePostForComments.id
          ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) }
          : p
      );
      requestCache.set("feed_posts", updated, 20000);
      return updated;
    });

    setActivePostForComments(prev => prev ? { ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) } : null);

    try {
      await deleteComment(commentId);
    } catch (err: any) {
      console.error("Failed to delete comment:", err);
      // Rollback
      setComments(prev => {
        const currentComments = Array.isArray(prev) ? prev : [];
        const updated = [...currentComments, targetComment].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        requestCache.set(`comments_${activePostForComments.id}`, updated, 10000);
        return updated;
      });
      setPosts(prevPosts => {
        if (!Array.isArray(prevPosts)) return [];
        const updated = prevPosts.map(p =>
          p.id === activePostForComments.id
            ? { ...p, commentsCount: p.commentsCount + 1 }
            : p
        );
        requestCache.set("feed_posts", updated, 20000);
        return updated;
      });
      setActivePostForComments(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
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
      <div className="h-screen bg-black text-white flex overflow-hidden">
        {/* Skeleton sidebar strip */}
        <div className="fixed left-0 top-0 bottom-0 w-20 md:w-72 glass-panel border-y-0 border-l-0" />
        <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col">
          <div className="w-full max-w-3xl mx-auto px-6 md:px-12 py-10 md:py-16 flex flex-col space-y-8">
            {/* Header skeleton */}
            <div className="flex justify-between items-center border-b border-white/5 pb-6">
              <div className="space-y-2">
                <div className="h-6 w-44 bg-white/[0.06] rounded-lg animate-pulse" />
                <div className="h-3 w-32 bg-white/[0.04] rounded animate-pulse" />
              </div>
              <div className="h-10 w-36 bg-white/[0.06] rounded-full animate-pulse" />
            </div>
            {/* Composer skeleton */}
            <div className="glass-panel rounded-2xl p-5 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/[0.06]" />
                <div className="flex-1 h-10 bg-white/[0.04] rounded-full" />
              </div>
            </div>
            {/* Post card skeletons */}
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-panel rounded-2xl overflow-hidden animate-pulse">
                <div className="p-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/[0.06]" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3.5 w-40 bg-white/[0.06] rounded" />
                    <div className="h-2.5 w-24 bg-white/[0.04] rounded" />
                  </div>
                </div>
                <div className="h-48 bg-white/[0.04] mx-5 rounded-xl" />
                <div className="p-5 space-y-2">
                  <div className="h-3 w-3/4 bg-white/[0.04] rounded" />
                  <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
                </div>
                <div className="px-5 pb-4 flex gap-4">
                  <div className="h-8 w-16 bg-white/[0.04] rounded-full" />
                  <div className="h-8 w-16 bg-white/[0.04] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      <Sidebar user={user} />

      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_100%)] pointer-events-none" />

        <div className="z-10 w-full max-w-3xl mx-auto px-6 md:px-12 py-10 md:py-16 flex flex-col space-y-8">
          
          {/* Feed Header with Share Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-6 gap-6">
            <div>
              <h1 className="text-[22px] md:text-[24px] font-light tracking-[0.18em] uppercase leading-tight">Memories Feed</h1>
              <p className="text-[12px] tracking-wider text-neutral-450 mt-1.5 uppercase">
                {user.department} {user.section ? `Sec ${user.section}` : ""} • Class of {user.batch}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setModalError(null);
                setIsModalOpen(true);
              }}
              className="py-2.5 px-5 bg-white text-black hover:bg-neutral-200 text-[12px] font-semibold tracking-wider uppercase transition-colors flex-shrink-0 cursor-pointer rounded-full"
            >
              Share a Memory
            </motion.button>
          </div>

          {/* People You May Know Row */}
          {!recLoading && recommendations.length > 0 && (
            <div className="space-y-3 pb-3 border-b border-white/5">
              <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">People You May Know</h3>
              <div className="flex overflow-x-auto gap-4 pb-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {recommendations.map((rec) => (
                  <motion.div
                    whileHover={{ scale: 1.015 }}
                    key={rec.id}
                    onClick={() => router.push(`/alumni/${rec.id}`)}
                    className="w-40 flex-shrink-0 glass-panel p-4 flex flex-col items-center text-center cursor-pointer border border-white/8 rounded-2xl hover:border-white/15 transition-colors relative"
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center mb-2">
                      {rec.profilePicture ? (
                        <Image
                          src={rec.profilePicture}
                          alt={rec.fullName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-[14px] font-light text-neutral-400">
                          {rec.fullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-[12px] font-semibold text-white uppercase tracking-wider truncate w-full mb-0.5">
                      {rec.fullName}
                    </h4>
                    
                    {/* Dynamic suggestion matched reason */}
                    <span className="text-[9px] text-amber-400 font-semibold uppercase tracking-wider truncate w-full">
                      {rec.recommendationReason || "Matched Connection"}
                    </span>

                    <p className="text-[10px] text-neutral-455 truncate w-full font-light mt-1">
                      {rec.currentPosition || "Alumni Member"}
                    </p>
                    
                    <p className="text-[9px] text-neutral-500 font-light mt-0.5 uppercase tracking-wider">
                      Class of {rec.batch}
                    </p>

                    <button
                      className="mt-3.5 px-3 py-1.5 bg-white text-black hover:bg-neutral-200 text-[10px] font-bold uppercase tracking-wider rounded-full w-full text-center"
                    >
                      Connect
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Memory of the Day Section */}
          {!motdLoading && motd && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-5 rounded-[20px] border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.04)] relative overflow-hidden group space-y-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.02] via-transparent to-transparent pointer-events-none" />
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-amber-400 tracking-widest uppercase flex items-center gap-1">
                  ✨ Memory of the Day
                </span>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                  Featured today
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                {/* Media preview */}
                {motd.mediaType === "VIDEO" && motd.videoUrl ? (
                  <div className="relative w-full sm:w-36 aspect-video sm:aspect-square bg-neutral-950 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/5">
                    <video
                      src={motd.videoUrl}
                      controls
                      preload="none"
                      loop
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  motd.imageUrl && (
                    <div className="relative w-full sm:w-36 aspect-video sm:aspect-square bg-neutral-900 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                      <Image
                        src={motd.imageUrl}
                        alt="Memory Photo"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )
                )}

                {/* Info block */}
                <div className="flex-1 flex flex-col justify-between py-1 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/alumni/${motd.userId}`} className="text-[13px] font-semibold text-white uppercase tracking-wider hover:underline">
                        {motd.userFullName}
                      </Link>
                      {motd.userCurrentPosition && (
                        <span className="text-[11px] text-neutral-450 truncate">
                          • {motd.userCurrentPosition}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-neutral-300 font-light leading-relaxed line-clamp-3 select-text">
                      {motd.caption}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-neutral-500 tracking-wider">
                    <span>Posted {new Date(motd.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
                    <button
                      onClick={() => handleOpenCommentsModal(motd)}
                      className="underline hover:text-white transition-colors cursor-pointer uppercase font-semibold"
                    >
                      View comments ({motd.commentsCount})
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Feed List */}
          {feedLoading ? (
            <div className="flex items-center justify-center p-16 glass-panel rounded-[20px] border border-white/8">
              <span className="text-[13px] text-neutral-400 tracking-widest uppercase animate-pulse font-light">Loading Feed...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 glass-panel text-center space-y-3 rounded-[20px] border border-white/8">
              <span className="text-[14px] font-light text-neutral-450 uppercase tracking-widest">No memories shared in your community yet.</span>
              <p className="text-[12px] text-neutral-500 uppercase tracking-wider">Be the first to share a graduation or college photo!</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-8">
              {Array.isArray(posts) && posts.map((post) => (
                <motion.article 
                  key={post.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="glass-panel rounded-[20px] overflow-hidden flex flex-col max-w-xl w-full mx-auto border border-white/8 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,255,255,0.02)]"
                >
                  
                  {/* Post Creator Info */}
                  <div className="flex items-center space-x-3.5 p-4 border-b border-white/5">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center">
                      {post.userProfilePicture ? (
                        <Image
                          src={post.userProfilePicture}
                          alt={post.userFullName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-[13px] font-light text-neutral-450">
                          {post.userFullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <Link href={`/alumni/${post.userId}`} className="text-[13px] font-semibold text-white tracking-wider hover:underline leading-none uppercase">
                          {post.userFullName}
                        </Link>
                        {post.userCurrentPosition && (
                          <span className="text-[12px] text-neutral-450 hidden sm:inline">• {post.userCurrentPosition}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500 block mt-1 leading-none uppercase font-light tracking-wider">{formatTime(post.createdAt)}</span>
                    </div>
                  </div>

                  {/* Post Media: Video or Image */}
                  {post.mediaType === "VIDEO" && post.videoUrl ? (
                    <div className="relative w-full aspect-square md:aspect-[4/3] bg-neutral-950 border-b border-white/5 flex items-center justify-center">
                      <video
                        src={post.videoUrl}
                        controls
                        preload="none"
                        loop
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    post.imageUrl && (
                      <div className="relative w-full aspect-square md:aspect-[4/3] bg-neutral-900/10 border-b border-white/5">
                        <Image
                          src={post.imageUrl}
                          alt="Memory Photo"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )
                  )}

                  {/* Post Details & Interaction */}
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-5">
                        {/* Like Button */}
                        <motion.button
                          whileTap={{ scale: 1.15 }}
                          onClick={() => handleLikeToggle(post.id)}
                          className="hover:opacity-80 transition-opacity focus:outline-none cursor-pointer flex items-center justify-center p-1"
                        >
                          {post.likedByMe ? (
                            <svg className="w-5 h-5 text-red-500 fill-red-500" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-neutral-450 hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                          )}
                        </motion.button>

                        {/* Comment Button */}
                        <button
                          onClick={() => handleOpenCommentsModal(post)}
                          className="hover:opacity-80 transition-opacity focus:outline-none cursor-pointer flex items-center justify-center p-1"
                        >
                          <svg className="w-5 h-5 text-neutral-450 hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-1.879 2.249c-.198.118-.231.378-.06.513.17.135.424.088.583-.05a7.71 7.71 0 002.222-2.152c.26-.33.64-.489 1.05-.489h.567A10.82 10.82 0 0012 20.25z" />
                          </svg>
                        </button>
                      </div>

                      <div className="text-[12px] text-neutral-450 font-light uppercase tracking-wider">
                        {post.likesCount} likes
                      </div>
                    </div>

                    <p className="text-[13.5px] font-light text-neutral-200 leading-relaxed select-text">
                      <span className="font-semibold text-white uppercase tracking-wider mr-2">{post.userFullName}</span>
                      {post.caption}
                    </p>
                    
                    {post.commentsCount > 0 && (
                      <button
                        onClick={() => handleOpenCommentsModal(post)}
                        className="text-[12px] text-neutral-500 hover:text-white font-medium transition-colors uppercase tracking-wider cursor-pointer block"
                      >
                        View all {post.commentsCount} comments
                      </button>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Share Memory Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              if (!submitting) setIsModalOpen(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-[26px] p-4"
          >
            <motion.div
              ref={shareModalRef}
              role="dialog"
              aria-modal="true"
              aria-label="Share a Memory"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-xl glass-panel p-6 md:p-8 space-y-6 shadow-2xl relative rounded-[20px] border border-white/8"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h2 className="text-[18px] font-light tracking-[0.15em] uppercase text-white leading-tight">Share a Memory</h2>
                <p className="text-[12px] tracking-wider text-neutral-400 mt-1.5">Upload a memory image or video and write a caption.</p>
              </div>

              {modalError && (
                <div className="p-4 bg-red-950/20 border border-red-900/50 text-red-500 text-[12px] tracking-wider rounded-xl text-center">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreatePost} className="space-y-5 text-[12px]">
                
                {/* Media Selection */}
                <div className="space-y-2.5">
                  <label className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">Memory Media Type</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setMediaType("IMAGE");
                      }}
                      className={`flex-1 py-2 text-center text-[11px] font-bold uppercase tracking-wider rounded-full border ${
                        mediaType === "IMAGE" 
                          ? "bg-white text-black border-white" 
                          : "bg-transparent text-white border-white/10 hover:border-white"
                      }`}
                    >
                      Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setMediaType("VIDEO");
                      }}
                      className={`flex-1 py-2 text-center text-[11px] font-bold uppercase tracking-wider rounded-full border ${
                        mediaType === "VIDEO" 
                          ? "bg-white text-black border-white" 
                          : "bg-transparent text-white border-white/10 hover:border-white"
                      }`}
                    >
                      Video (Max 30MB)
                    </button>
                  </div>
                </div>

                {/* File picker */}
                <div className="space-y-3">
                  <label className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">
                    Select {mediaType === "IMAGE" ? "Photo" : "Video"}
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="px-4 py-2 bg-white text-black text-[11px] font-bold tracking-widest uppercase hover:bg-neutral-200 transition-all cursor-pointer rounded-full">
                      Choose file
                      <input
                        type="file"
                        accept={mediaType === "IMAGE" ? "image/jpeg,image/jpg,image/png,image/webp" : "video/mp4,video/quicktime,video/webm"}
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          const file = files[0];

                          if (mediaType === "IMAGE") {
                            if (file.size > 10 * 1024 * 1024) {
                              setModalError("File size exceeds the limit of 10 MB for images.");
                              return;
                            }
                          } else {
                            if (file.size > 30 * 1024 * 1024) {
                              setModalError("File size exceeds the limit of 30 MB for videos.");
                              return;
                            }
                          }

                          setModalError(null);
                          setSelectedFile(file);
                          setPreviewUrl(URL.createObjectURL(file));
                        }}
                        className="hidden"
                      />
                    </label>
                    {selectedFile && (
                      <span className="text-[12px] text-neutral-450 truncate max-w-[220px]">
                        {selectedFile.name}
                      </span>
                    )}
                  </div>

                  {/* Selected Preview */}
                  {previewUrl && (
                    <div className="relative mt-3 border border-white/5 bg-neutral-900/30 flex items-center justify-center p-3 max-h-[180px] overflow-hidden rounded-2xl">
                      {mediaType === "IMAGE" ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-[156px] w-auto object-contain rounded-lg"
                        />
                      ) : (
                        <video
                          src={previewUrl}
                          muted
                          controls
                          className="max-h-[156px] w-auto rounded-lg"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="absolute top-3 right-3 bg-black/80 hover:bg-black text-[10px] uppercase tracking-wider px-3 py-1.5 border border-white/10 rounded-lg cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {uploadProgress !== null && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] uppercase tracking-widest text-neutral-400">
                        <span>Uploading {mediaType.toLowerCase()}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-1 overflow-hidden rounded-full">
                        <div
                          className="bg-white h-full transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Caption Textarea */}
                <div className="space-y-2">
                  <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">Write a caption *</label>
                  <textarea
                    autoFocus
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                    placeholder="Describe this classmate memory..."
                    className="w-full glass-input text-[13.5px] p-3 resize-none focus:outline-none rounded-xl"
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-3 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 text-center bg-white text-black text-[12px] font-bold tracking-widest uppercase hover:bg-neutral-200 transition-colors rounded-full cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Sharing..." : "Post Memory"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setCaption("");
                      setIsModalOpen(false);
                    }}
                    disabled={submitting}
                    className="flex-1 py-3 bg-transparent text-white text-[12px] font-semibold tracking-widest uppercase border border-white/10 hover:border-white transition-colors rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments List Modal */}
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
              ref={commentModalRef}
              role="dialog"
              aria-modal="true"
              aria-label="Comments"
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
                  <h2 className="text-[18px] font-light tracking-[0.15em] uppercase leading-tight">Comments</h2>
                  <p className="text-[11px] tracking-wider text-neutral-400 mt-1.5 uppercase">
                    By {activePostForComments.userFullName} • {activePostForComments.commentsCount} Comments
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

              {/* Comment List */}
              <div className="flex-1 overflow-y-auto min-h-[220px] space-y-5 pr-2">
                {commentsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <span className="text-[13px] text-neutral-400 tracking-widest uppercase animate-pulse font-semibold">Loading Comments...</span>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex justify-center items-center h-32 text-neutral-500 text-[13px] uppercase tracking-wider font-light">
                    <span>No comments yet.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(comments) && comments.map((comment) => (
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
                              <span className="text-[12px] text-neutral-400 font-light">
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
                            <span className="text-[10px] text-neutral-550 block mt-1 uppercase font-light tracking-wider">{formatTime(comment.createdAt)}</span>
                            <p className="text-[13px] font-light text-neutral-200 mt-2 leading-relaxed whitespace-pre-wrap">{comment.comment}</p>
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
                  className="py-2.5 px-4 bg-white text-black hover:bg-neutral-200 text-[12px] font-bold uppercase tracking-widest rounded-full transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
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
