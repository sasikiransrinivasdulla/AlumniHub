"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getMemoriesFeed, createPost, Post } from "@/services/postService";
import { toggleLike, getComments, addComment, deleteComment, CommentDto } from "@/services/likeCommentService";
import { uploadPostImage } from "@/services/uploadService";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);

  // Share Memory Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Comments Modal States
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
        
        // Fetch memories feed
        try {
          const memories = await getMemoriesFeed();
          setPosts(memories);
        } catch (feedErr) {
          console.error("Failed to load feed:", feedErr);
        } finally {
          setFeedLoading(false);
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
      if (selectedImageFile) {
        setUploading(true);
        setUploadProgress(0);
        try {
          uploadedUrl = await uploadPostImage(selectedImageFile, (percent) => {
            setUploadProgress(percent);
          });
        } catch (uploadErr: any) {
          console.error(uploadErr);
          setModalError(uploadErr.message || "Failed to upload memory image.");
          setSubmitting(false);
          setUploading(false);
          setUploadProgress(null);
          return;
        }
        setUploading(false);
        setUploadProgress(null);
      }

      const newPost = await createPost({
        imageUrl: uploadedUrl,
        caption: caption.trim(),
      });
      // Prepend to current feed list
      setPosts([newPost, ...posts]);
      
      // Reset and close modal
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
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
    try {
      const result = await toggleLike(postId);
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === postId
            ? { ...p, likedByMe: result.liked, likesCount: result.likesCount }
            : p
        )
      );
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

      // Increment comments count on feed page dynamically
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === activePostForComments.id
            ? { ...p, commentsCount: p.commentsCount + 1 }
            : p
        )
      );
      // Update local post count reference
      setActivePostForComments({
        ...activePostForComments,
        commentsCount: activePostForComments.commentsCount + 1
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
      setComments(comments.filter(c => c.id !== commentId));

      // Decrement comments count on feed page dynamically
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === activePostForComments.id
            ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) }
            : p
        )
      );
      // Update local post count reference
      setActivePostForComments({
        ...activePostForComments,
        commentsCount: Math.max(0, activePostForComments.commentsCount - 1)
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
        <p className="text-[17px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse">Loading Profile & Feed...</p>
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

      {/* Main Feed Container (Vertical scroll, no horizontal scroll) */}
      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="z-10 w-full max-w-4xl mx-auto px-6 md:px-12 py-10 md:py-16 flex flex-col space-y-10">
          
          {/* Feed Header with Share Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-8 gap-6">
            <div>
              <h1 className="text-[32px] font-light tracking-widest uppercase leading-tight">Memories Feed</h1>
              <p className="text-[15px] tracking-wider text-neutral-400 mt-2 uppercase">
                {user.department} {user.section ? `Sec ${user.section}` : ""} • Class of {user.batch}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="py-3.5 px-8 glass-button-primary text-[17px] font-semibold tracking-widest uppercase hover:bg-neutral-200 transition-all duration-200 flex-shrink-0 cursor-pointer rounded-2xl"
            >
              Share a Memory
            </motion.button>
          </div>

          {/* Feed List */}
          {feedLoading ? (
            <div className="flex items-center justify-center p-16 glass-panel rounded-[24px]">
              <span className="text-[15px] text-neutral-400 tracking-widest uppercase animate-pulse">Loading Feed...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 glass-panel text-center space-y-4 rounded-[24px]">
              <span className="text-[17px] font-light text-neutral-300">No memories shared in your community yet.</span>
              <p className="text-[15px] text-neutral-500">Be the first to share a graduation or college photo!</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-10">
              {posts.map((post) => (
                <motion.article 
                  key={post.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="glass-panel rounded-[24px] overflow-hidden flex flex-col max-w-2xl w-full mx-auto"
                >
                  
                  {/* Post Creator Info */}
                  <div className="flex items-center space-x-4 p-5 border-b border-white/5">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center">
                      {post.userProfilePicture ? (
                        <Image
                          src={post.userProfilePicture}
                          alt={post.userFullName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-[17px] font-light text-neutral-400">
                          {post.userFullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <Link href={`/alumni/${post.userId}`} className="text-[17px] font-semibold text-white tracking-wide hover:underline leading-none">
                          {post.userFullName}
                        </Link>
                        {post.userCurrentPosition && (
                          <span className="text-[15px] text-neutral-400 hidden sm:inline">• {post.userCurrentPosition}</span>
                        )}
                      </div>
                      <span className="text-[15px] text-neutral-500 block mt-1 leading-none">{formatTime(post.createdAt)}</span>
                    </div>
                  </div>

                  {/* Post Image */}
                  {post.imageUrl && (
                    <div className="relative w-full aspect-square md:aspect-[4/3] bg-neutral-900/10 border-b border-white/5">
                      <Image
                        src={post.imageUrl}
                        alt="Memory Photo"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}

                  {/* Post Details & Interaction */}
                  <div className="p-6 space-y-5">
                    {/* Action buttons (Like & Comment) */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-5">
                        {/* Like Button */}
                        <motion.button
                          whileTap={{ scale: 1.2 }}
                          onClick={() => handleLikeToggle(post.id)}
                          className="text-[28px] hover:opacity-85 transition-opacity focus:outline-none cursor-pointer"
                        >
                          {post.likedByMe ? "❤️" : "🤍"}
                        </motion.button>

                        {/* Comment Button */}
                        <button
                          onClick={() => handleOpenCommentsModal(post)}
                          className="text-[28px] hover:opacity-85 transition-opacity focus:outline-none cursor-pointer"
                        >
                          💬
                        </button>
                      </div>

                      <div className="text-[15px] text-neutral-400 font-light">
                        {post.likesCount} likes
                      </div>
                    </div>

                    {/* Caption & Metadata */}
                    <div className="space-y-2">
                      <p className="text-[17px] font-light text-neutral-200 leading-relaxed whitespace-pre-wrap">
                        <span className="font-semibold text-white mr-2">{post.userFullName}</span>
                        {post.caption}
                      </p>
                    </div>

                    {/* Comments trigger */}
                    {post.commentsCount > 0 && (
                      <button
                        onClick={() => handleOpenCommentsModal(post)}
                        className="text-[15px] text-neutral-400 hover:text-neutral-300 font-light block focus:outline-none cursor-pointer"
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

      {/* Share a Memory Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl glass-panel p-8 md:p-10 space-y-8 shadow-2xl relative rounded-[24px]"
            >
              <div>
                <h2 className="text-[24px] font-light tracking-widest uppercase text-white leading-tight">Share a Memory</h2>
                <p className="text-[15px] tracking-wider text-neutral-400 mt-2">Upload a memory image and write a caption.</p>
              </div>

              {modalError && (
                <div className="p-4 bg-red-950/20 border border-red-900/50 text-red-500 text-[15px] tracking-wider rounded-xl">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreatePost} className="space-y-6">
                
                {/* Image Selection */}
                <div className="space-y-3">
                  <label className="text-[15px] tracking-widest uppercase text-neutral-300 block font-bold">Choose Image (Optional)</label>
                  <div className="flex items-center gap-4">
                    <label className="px-5 py-3 glass-button text-[15px] font-semibold tracking-widest uppercase transition-all duration-300 cursor-pointer rounded-xl">
                      Select Image
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          const file = files[0];

                          // Size Check
                          if (file.size > 10 * 1024 * 1024) {
                            setModalError("File size exceeds the maximum limit of 10 MB.");
                            return;
                          }
                          const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
                          if (!allowedTypes.includes(file.type)) {
                            setModalError("Unsupported file format. Only JPG, JPEG, PNG, and WEBP are allowed.");
                            return;
                          }

                          setModalError(null);
                          setSelectedImageFile(file);
                          setImagePreviewUrl(URL.createObjectURL(file));
                        }}
                        className="hidden"
                      />
                    </label>
                    {selectedImageFile && (
                      <span className="text-[15px] text-neutral-400 truncate max-w-[220px]">
                        {selectedImageFile.name}
                      </span>
                    )}
                  </div>

                  {/* Selected Image Preview */}
                  {imagePreviewUrl && (
                    <div className="relative mt-3 border border-white/5 bg-neutral-900/30 flex items-center justify-center p-3 max-h-[180px] overflow-hidden rounded-xl">
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        className="max-h-[156px] w-auto object-contain rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImageFile(null);
                          setImagePreviewUrl(null);
                        }}
                        className="absolute top-3 right-3 bg-black/80 hover:bg-black text-[13px] uppercase tracking-wider px-3 py-1.5 border border-white/10 hover:border-white/30 transition-colors rounded-lg"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Upload Progress Indicator */}
                  {uploadProgress !== null && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[13px] uppercase tracking-widest text-neutral-400">
                        <span>Uploading Image</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 overflow-hidden rounded-full">
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
                  <label className="text-[15px] tracking-widest uppercase text-neutral-300 block font-bold">Caption *</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={4}
                    required
                    className="w-full glass-input focus:outline-none text-[16px] p-4 resize-none rounded-xl"
                    placeholder="What's on your mind? Share college stories, graduation moments..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3.5 glass-button-primary text-[17px] font-semibold tracking-widest uppercase transition-all duration-300 ease-out cursor-pointer disabled:opacity-50 rounded-2xl"
                  >
                    {submitting ? "Sharing..." : "Post Memory"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedImageFile(null);
                      setImagePreviewUrl(null);
                      setCaption("");
                      setModalError(null);
                    }}
                    disabled={submitting}
                    className="flex-1 py-3.5 glass-button text-[17px] font-semibold tracking-widest uppercase transition-all duration-300 ease-out cursor-pointer rounded-2xl"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Comments List Modal */}
      <AnimatePresence>
        {activePostForComments && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl glass-panel p-8 md:p-10 space-y-6 shadow-2xl relative flex flex-col max-h-[90vh] rounded-[24px]"
            >
              
              {/* Modal Title & Stats */}
              <div className="flex justify-between items-start border-b border-white/5 pb-5">
                <div>
                  <h2 className="text-[24px] font-light tracking-widest uppercase leading-tight">Comments</h2>
                  <p className="text-[15px] tracking-wider text-neutral-400 mt-2 uppercase">
                    By {activePostForComments.userFullName} • {activePostForComments.commentsCount} Comments
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePostForComments(null)}
                  className="text-neutral-450 hover:text-white text-[13px] uppercase tracking-widest border border-white/10 hover:border-white px-4 py-2 cursor-pointer rounded-xl transition-colors"
                >
                  Close
                </button>
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
                            className="text-neutral-500 hover:text-red-400 text-[13px] tracking-wider uppercase border border-transparent hover:border-red-950 px-3 py-1.5 flex-shrink-0 cursor-pointer rounded-lg transition-all"
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
              <form onSubmit={handleAddComment} className="space-y-4 pt-5 border-t border-white/5">
                {commentSubmitError && (
                  <div className="p-3 bg-red-950/20 border border-red-900/50 text-red-500 text-[13px] tracking-wider rounded-lg">
                    {commentSubmitError}
                  </div>
                )}
                <div className="flex space-x-4">
                  <input
                    type="text"
                    maxLength={500}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Add a comment... (max 500 chars)"
                    className="flex-1 glass-input focus:outline-none text-[16px] p-3.5 rounded-xl"
                    required
                  />
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="glass-button-primary text-[15px] font-semibold tracking-widest uppercase px-6 hover:bg-neutral-200 disabled:opacity-50 cursor-pointer rounded-xl"
                  >
                    {submittingComment ? "Posting..." : "Post"}
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
