"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getAlumniDetails } from "@/services/alumniService";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AlumniProfile({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [alumni, setAlumni] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);

  const handleMessageClick = async () => {
    if (!alumni) return;
    setMessaging(true);
    try {
      const { getOrCreateConversation } = await import("@/services/chatService");
      const conversation = await getOrCreateConversation(alumni.id);
      router.push(`/messages?conversationId=${conversation.id}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to start conversation.");
    } finally {
      setMessaging(false);
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
        setCurrentUser(profile);

        // Fetch target classmate details
        try {
          const data = await getAlumniDetails(id);
          setAlumni(data);
        } catch (err: any) {
          if (err.message.includes("403 Forbidden")) {
            setError("403 Forbidden: You do not belong to the academic community authorized to view this profile.");
          } else {
            setError(err.message || "Failed to load profile details.");
          }
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
  }, [id, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[17px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse">Loading Profile...</p>
      </main>
    );
  }

  // Handle Error/403 Forbidden States
  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white px-6 select-none">
        <div className="max-w-xl w-full glass-panel p-8 md:p-10 text-center space-y-6 shadow-2xl rounded-[24px]">
          <h1 className="text-[24px] font-bold tracking-widest uppercase text-red-500 leading-tight">Access Denied</h1>
          <p className="text-[17px] text-neutral-400 font-light leading-relaxed">{error}</p>
          <div className="pt-4">
            <Link
              href="/directory"
              className="py-3.5 px-8 glass-button-primary text-[17px] font-semibold tracking-widest uppercase hover:bg-neutral-200 transition-all duration-305 ease-out rounded-xl"
            >
              Back to Directory
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!alumni) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      {/* Fixed Left Sidebar */}
      <Sidebar user={currentUser} />

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="z-10 w-full max-w-2xl mx-auto px-6 md:px-12 py-10 md:py-16 flex flex-col space-y-8">
          
          {/* Navigation Breadcrumb */}
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <Link
              href="/directory"
              className="text-[15px] text-neutral-400 hover:text-white uppercase tracking-widest flex items-center gap-1.5 transition-colors duration-200"
            >
              ← Back to Directory
            </Link>
            <span className="text-[15px] text-neutral-500 tracking-wider uppercase font-bold">Classmate Profile</span>
          </div>

          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-panel p-6 md:p-10 space-y-6 shadow-2xl rounded-[20px] border border-white/8"
          >
            
            {/* Main Avatar + Name Block */}
            <div className="flex flex-col items-center text-center space-y-5 pb-6 border-b border-white/5">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center">
                {alumni.profilePicture ? (
                  <Image
                    src={alumni.profilePicture}
                    alt={alumni.fullName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-5xl font-light text-neutral-450">
                    {alumni.fullName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-[24px] md:text-[26px] font-light tracking-wide uppercase text-white leading-tight">{alumni.fullName}</h1>
                <p className="text-[13px] text-neutral-450 mt-1.5 uppercase tracking-wider font-light">
                  {alumni.currentPosition || "Alumni Member"}
                </p>
                {currentUser?.id !== alumni.id && (
                  <button
                    onClick={handleMessageClick}
                    disabled={messaging}
                    className="mt-4 py-2 px-5 bg-white text-black hover:bg-neutral-200 text-[13px] font-medium tracking-[0.15em] uppercase transition-all duration-300 rounded-full cursor-pointer disabled:opacity-50"
                  >
                    {messaging ? "Connecting..." : "Message"}
                  </button>
                )}
              </div>
            </div>

            {/* Core Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[14px] font-light text-neutral-300">
              
              <div className="space-y-4">
                <div>
                  <span className="text-neutral-500 block text-[12px] uppercase tracking-wider mb-1 font-bold">Email</span>
                  <span className="text-white select-text">{alumni.email}</span>
                </div>
                {alumni.phoneNumber && (
                  <div>
                    <span className="text-neutral-500 block text-[12px] uppercase tracking-wider mb-1 font-bold">Phone Number</span>
                    <span className="text-white select-text">{alumni.phoneNumber}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-neutral-500 block text-[12px] uppercase tracking-wider mb-1 font-bold">Academic Community</span>
                  <span className="text-white">
                    Class of {alumni.batch} • {alumni.department} {alumni.section ? `Sec ${alumni.section}` : ""}
                  </span>
                </div>
              </div>

            </div>

            {/* Bio block */}
            {alumni.bio && (
              <div className="space-y-2 pt-5 border-t border-white/5">
                <span className="text-neutral-500 block text-[12px] uppercase tracking-wider font-bold">Bio</span>
                <p className="text-neutral-300 text-[14px] font-light leading-relaxed select-text whitespace-pre-wrap">
                  {alumni.bio}
                </p>
              </div>
            )}

            {/* Social Links Block */}
            {(alumni.linkedinUrl || alumni.githubUrl || alumni.instagramUrl) && (
              <div className="space-y-3 pt-5 border-t border-white/5">
                <span className="text-neutral-500 block text-[12px] uppercase tracking-wider font-bold">Social Links</span>
                <div className="flex flex-wrap gap-5 text-[14px]">
                  {alumni.linkedinUrl && (
                    <a
                      href={alumni.linkedinUrl.startsWith("http") ? alumni.linkedinUrl : `https://${alumni.linkedinUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-450 hover:text-white uppercase tracking-widest text-[12px] underline"
                    >
                      LinkedIn
                    </a>
                  )}
                  {alumni.githubUrl && (
                    <a
                      href={alumni.githubUrl.startsWith("http") ? alumni.githubUrl : `https://${alumni.githubUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-455 hover:text-white uppercase tracking-widest text-[12px] underline"
                    >
                      GitHub
                    </a>
                  )}
                  {alumni.instagramUrl && (
                    <a
                      href={alumni.instagramUrl.startsWith("http") ? alumni.instagramUrl : `https://${alumni.instagramUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-455 hover:text-white uppercase tracking-widest text-[12px] underline"
                    >
                      Instagram
                    </a>
                  )}
                </div>
              </div>
            )}

          </motion.div>

        </div>
      </main>

    </div>
  );
}
