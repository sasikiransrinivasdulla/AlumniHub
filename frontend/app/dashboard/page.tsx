"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getMemoriesFeed, createPost, Post } from "@/services/postService";
import Image from "next/image";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);

  // Modal and post submission states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

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

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!caption.trim()) {
      setModalError("Caption must not be blank.");
      return;
    }

    setSubmitting(true);
    try {
      const newPost = await createPost({
        imageUrl: imageUrl.trim() || null,
        caption: caption.trim(),
      });
      // Prepend to current feed list
      setPosts([newPost, ...posts]);
      
      // Reset and close modal
      setImageUrl("");
      setCaption("");
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setModalError(err.message || "Failed to create post.");
    } finally {
      setSubmitting(false);
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
        <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 animate-pulse">Loading Profile & Feed...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="flex min-h-screen bg-black text-white relative overflow-hidden select-none">
      {/* Radial glow background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_100%)] pointer-events-none" />

      <div className="z-10 flex flex-col lg:flex-row w-full max-w-6xl mx-auto px-6 py-12 gap-8">
        
        {/* Left Column: Welcome / Profile Info Card */}
        <aside className="w-full lg:w-1/3 flex flex-col bg-neutral-950 p-6 border border-neutral-900 shadow-2xl h-fit space-y-6">
          
          {/* Header block */}
          <div className="flex items-center space-x-4 pb-4 border-b border-neutral-900">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-neutral-800 bg-neutral-900 flex items-center justify-center flex-shrink-0">
              {user.profilePicture ? (
                <Image
                  src={user.profilePicture}
                  alt={user.fullName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-xl font-light text-neutral-600">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-white tracking-wide truncate uppercase">{user.fullName}</h2>
              <span className="text-[10px] tracking-wider text-neutral-500 block truncate">{user.email}</span>
            </div>
          </div>

          {/* Academic Info */}
          <div className="space-y-3">
            <h3 className="text-[10px] tracking-widest uppercase text-neutral-500 font-bold">Academic Community</h3>
            <div className="space-y-2 text-xs text-neutral-300 font-light">
              <div className="flex justify-between">
                <span className="text-neutral-500">Batch:</span>
                <span>{user.batch ? `Class of ${user.batch}` : "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Department:</span>
                <span>{user.department || "N/A"}</span>
              </div>
              {user.section && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Section:</span>
                  <span>{user.section}</span>
                </div>
              )}
            </div>
          </div>

          {/* Professional / Contact Info */}
          <div className="space-y-3 pt-2">
            <h3 className="text-[10px] tracking-widest uppercase text-neutral-500 font-bold">Details</h3>
            <div className="space-y-2 text-xs font-light text-neutral-300">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase mb-0.5">Position</span>
                <span className="text-neutral-200">{user.currentPosition || "Not Specified"}</span>
              </div>
              {user.bio && (
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase mb-0.5">Bio</span>
                  <p className="text-neutral-400 line-clamp-3 leading-relaxed">{user.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="flex space-x-3 pt-2 border-t border-neutral-900">
            {user.linkedinUrl && (
              <a
                href={user.linkedinUrl.startsWith("http") ? user.linkedinUrl : `https://${user.linkedinUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-white underline"
              >
                LinkedIn
              </a>
            )}
            {user.githubUrl && (
              <a
                href={user.githubUrl.startsWith("http") ? user.githubUrl : `https://${user.githubUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-white underline"
              >
                GitHub
              </a>
            )}
            {user.instagramUrl && (
              <a
                href={user.instagramUrl.startsWith("http") ? user.instagramUrl : `https://${user.instagramUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-white underline"
              >
                Instagram
              </a>
            )}
          </div>

          {/* User Controls */}
          <div className="flex flex-col gap-2 pt-4 border-t border-neutral-900">
            <Link
              href="/dashboard/edit"
              className="py-2.5 text-center bg-white text-black text-xs font-semibold tracking-widest uppercase hover:bg-neutral-200 transition-all duration-300 ease-out"
            >
              Edit Profile
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="py-2.5 bg-transparent text-white text-xs font-semibold tracking-widest uppercase border border-neutral-800 hover:border-white transition-all duration-300 ease-out cursor-pointer"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Right Column: Memories Feed */}
        <section className="flex-1 flex flex-col space-y-6">
          
          {/* Header block with Share button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-neutral-950 p-6 border border-neutral-900 gap-4">
            <div>
              <h1 className="text-xl font-light tracking-widest uppercase">Recent Memories</h1>
              <p className="text-[10px] tracking-wider text-neutral-500 mt-1">
                Showing posts from classmates in {user.department} {user.section ? `Sec ${user.section}` : ""} ({user.batch})
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="py-2.5 px-6 bg-white text-black text-xs font-semibold tracking-widest uppercase hover:bg-neutral-200 transition-all duration-300 ease-out flex-shrink-0"
            >
              Share a Memory
            </button>
          </div>

          {/* Feed List */}
          {feedLoading ? (
            <div className="flex items-center justify-center p-12 bg-neutral-950 border border-neutral-900">
              <span className="text-xs text-neutral-500 tracking-widest uppercase animate-pulse">Loading Feed...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-neutral-950 border border-neutral-900 text-center space-y-3">
              <span className="text-sm font-light text-neutral-400">No memories shared in your community yet.</span>
              <p className="text-xs text-neutral-600">Be the first to share a graduation or college photo!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <article key={post.id} className="bg-neutral-950 border border-neutral-900 overflow-hidden flex flex-col">
                  
                  {/* Post Creator Info */}
                  <div className="flex items-center space-x-3 p-4 border-b border-neutral-900/60">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-neutral-800 bg-neutral-900 flex items-center justify-center">
                      {post.userProfilePicture ? (
                        <Image
                          src={post.userProfilePicture}
                          alt={post.userFullName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-sm font-light text-neutral-500">
                          {post.userFullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-xs font-semibold text-white tracking-wide">{post.userFullName}</span>
                        {post.userCurrentPosition && (
                          <span className="text-[9px] text-neutral-500 hidden sm:inline">• {post.userCurrentPosition}</span>
                        )}
                      </div>
                      <span className="text-[9px] text-neutral-500 block mt-0.5">{formatTime(post.createdAt)}</span>
                    </div>
                  </div>

                  {/* Post Image */}
                  {post.imageUrl && (
                    <div className="relative w-full h-[320px] bg-neutral-900 border-b border-neutral-900">
                      <Image
                        src={post.imageUrl}
                        alt="Memory Photo"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  )}

                  {/* Post Caption */}
                  <div className="p-4 space-y-4">
                    <p className="text-sm font-light text-neutral-200 leading-relaxed whitespace-pre-wrap">
                      {post.caption}
                    </p>

                    {/* Likes & Comments Counters */}
                    <div className="flex space-x-6 text-[10px] tracking-wider text-neutral-500 pt-2 border-t border-neutral-900/50">
                      <span>{post.likesCount} Likes</span>
                      <span>{post.commentsCount} Comments</span>
                    </div>
                  </div>

                </article>
              ))}
            </div>
          )}

        </section>

      </div>

      {/* Share a Memory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 p-6 md:p-8 space-y-6 shadow-2xl relative">
            
            {/* Modal Title */}
            <div>
              <h2 className="text-md font-light tracking-widest uppercase">Share a Memory</h2>
              <p className="text-[10px] tracking-wider text-neutral-500 mt-1">Post a text update or link a graduation photo URL.</p>
            </div>

            {modalError && (
              <div className="p-3 bg-red-950/20 border border-red-900/50 text-red-500 text-xs tracking-wider">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-4">
              
              {/* Image URL Input */}
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-400 block">Image URL (Optional)</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-white focus:outline-none text-white text-xs p-3"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              {/* Caption Textarea */}
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-400 block">Caption *</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  required
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-white focus:outline-none text-white text-xs p-3 resize-none"
                  placeholder="What's on your mind? Share college stories, graduation moments..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-white text-black text-xs font-semibold tracking-widest uppercase hover:bg-neutral-200 transition-all duration-300 ease-out cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Sharing..." : "Post Memory"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setImageUrl("");
                    setCaption("");
                    setModalError(null);
                  }}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-transparent text-white text-xs font-semibold tracking-widest uppercase border border-neutral-800 hover:border-white transition-all duration-300 ease-out cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </main>
  );
}
