"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getAlumniDetails, getTimelineEntries, TimelineEntry } from "@/services/alumniService";
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

  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [inTouchLoading, setInTouchLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  const fetchTimeline = async () => {
    try {
      const entries = await getTimelineEntries(id);
      setTimeline(entries);
    } catch (err) {
      console.error("Failed to load timeline:", err);
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
        setCurrentUser(profile);

        try {
          const data = await getAlumniDetails(id);
          setAlumni(data);
        } catch (err: any) {
          if (err.message.includes("403")) {
            setError("403 Forbidden: Access restricted by academic community security settings.");
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

  useEffect(() => {
    if (alumni && alumni.hasFullAccess) {
      fetchTimeline();
    } else {
      setTimelineLoading(false);
    }
  }, [alumni]);

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

  const handleSendInTouch = async () => {
    if (!alumni) return;
    setInTouchLoading(true);
    try {
      const { sendInTouchRequest } = await import("@/services/alumniService");
      await sendInTouchRequest(alumni.id);
      const updated = await getAlumniDetails(alumni.id);
      setAlumni(updated);
    } catch (err: any) {
      alert(err.message || "Failed to send connection request.");
    } finally {
      setInTouchLoading(false);
    }
  };

  const handleCancelInTouch = async () => {
    if (!alumni) return;
    setInTouchLoading(true);
    try {
      const { cancelInTouchRequest } = await import("@/services/alumniService");
      await cancelInTouchRequest(alumni.id);
      const updated = await getAlumniDetails(alumni.id);
      setAlumni(updated);
    } catch (err: any) {
      alert(err.message || "Failed to cancel connection request.");
    } finally {
      setInTouchLoading(false);
    }
  };

  const handleAcceptInTouch = async () => {
    if (!alumni) return;
    setInTouchLoading(true);
    try {
      const { acceptInTouchRequest } = await import("@/services/alumniService");
      await acceptInTouchRequest(alumni.id);
      const updated = await getAlumniDetails(alumni.id);
      setAlumni(updated);
    } catch (err: any) {
      alert(err.message || "Failed to accept connection.");
    } finally {
      setInTouchLoading(false);
    }
  };

  const handleRejectInTouch = async () => {
    if (!alumni) return;
    setInTouchLoading(true);
    try {
      const { rejectInTouchRequest } = await import("@/services/alumniService");
      await rejectInTouchRequest(alumni.id);
      const updated = await getAlumniDetails(alumni.id);
      setAlumni(updated);
    } catch (err: any) {
      alert(err.message || "Failed to reject connection.");
    } finally {
      setInTouchLoading(false);
    }
  };

  const handleRemoveInTouch = async () => {
    if (!alumni || !confirm("Are you sure you want to remove this In-Touch connection?")) return;
    setInTouchLoading(true);
    try {
      const { removeInTouchConnection } = await import("@/services/alumniService");
      await removeInTouchConnection(alumni.id);
      const updated = await getAlumniDetails(alumni.id);
      setAlumni(updated);
    } catch (err: any) {
      alert(err.message || "Failed to disconnect.");
    } finally {
      setInTouchLoading(false);
    }
  };

  const handleRequestContact = async () => {
    if (!alumni) return;
    setContactLoading(true);
    try {
      const { requestContactDetails } = await import("@/services/alumniService");
      await requestContactDetails(alumni.id);
      const updated = await getAlumniDetails(alumni.id);
      setAlumni(updated);
    } catch (err: any) {
      alert(err.message || "Failed to request contact details.");
    } finally {
      setContactLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[15px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse">Loading Profile...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white px-6 select-none">
        <div className="max-w-md w-full glass-panel p-8 text-center space-y-6 shadow-2xl rounded-[20px] border border-white/8">
          <h1 className="text-[20px] font-semibold tracking-widest uppercase text-red-500 leading-tight">Access Denied</h1>
          <p className="text-[14px] text-neutral-450 font-light leading-relaxed">{error}</p>
          <div className="pt-2">
            <Link
              href="/directory"
              className="py-2.5 px-6 bg-white text-black text-[13px] font-semibold tracking-widest uppercase hover:bg-neutral-200 transition-colors rounded-full"
            >
              Back to Directory
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!alumni) return null;

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      <Sidebar user={currentUser} />

      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="z-10 w-full max-w-2xl mx-auto px-6 md:px-12 py-10 md:py-16 flex flex-col space-y-6">
          
          {/* Navigation Breadcrumb */}
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <Link
              href="/directory"
              className="text-[13px] text-neutral-400 hover:text-white uppercase tracking-widest flex items-center gap-1.5 transition-colors duration-200"
            >
              ← Back to Directory
            </Link>
            <span className="text-[13px] text-neutral-500 tracking-wider uppercase font-bold">Classmate Profile</span>
          </div>

          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-panel p-6 md:p-10 space-y-6 shadow-2xl rounded-[20px] border border-white/8"
          >
            
            {/* Main Avatar + Name Block */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 pb-6 border-b border-white/5">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center flex-shrink-0">
                {alumni.profilePicture ? (
                  <Image
                    src={alumni.profilePicture}
                    alt={alumni.fullName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-3xl font-light text-neutral-400">
                    {alumni.fullName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-[24px] md:text-[26px] font-light tracking-wide uppercase text-white leading-tight">{alumni.fullName}</h1>
                <p className="text-[13px] text-neutral-450 mt-1.5 uppercase tracking-wider font-light">
                  {alumni.currentPosition || "Alumni Member"} {alumni.currentCompany && `at ${alumni.currentCompany}`}
                </p>
                {alumni.currentCity && (
                  <p className="text-[12px] text-neutral-500 uppercase tracking-widest font-light mt-1">
                    📍 {alumni.currentCity}
                  </p>
                )}

                {/* Connection Status & Buttons Row */}
                <div className="flex flex-wrap items-center gap-3 mt-4 justify-center sm:justify-start">
                  
                  {/* Message CTA */}
                  {alumni.hasFullAccess && (
                    <button
                      onClick={handleMessageClick}
                      disabled={messaging}
                      className="py-2 px-5 bg-white text-black hover:bg-neutral-200 text-[12px] font-semibold tracking-wider uppercase transition-colors rounded-full cursor-pointer disabled:opacity-50"
                    >
                      {messaging ? "Connecting..." : "Send Message"}
                    </button>
                  )}

                  {/* In-Touch Button Logic */}
                  {alumni.inTouchStatus === "ACCEPTED" && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-400 font-light italic">
                        ✓ In-Touch {alumni.inTouchConnectedSince && `since ${new Date(alumni.inTouchConnectedSince).toLocaleDateString([], { month: "short", year: "numeric" })}`}
                      </span>
                      <button
                        onClick={handleRemoveInTouch}
                        disabled={inTouchLoading}
                        className="py-1 px-3 border border-white/10 hover:border-red-900 hover:text-red-500 text-[11px] uppercase tracking-wider rounded-full cursor-pointer transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}

                  {alumni.inTouchStatus === "PENDING_SENT" && (
                    <button
                      onClick={handleCancelInTouch}
                      disabled={inTouchLoading}
                      className="py-2 px-4 border border-white/10 text-neutral-400 hover:text-white text-[12px] font-medium tracking-wider uppercase rounded-full cursor-pointer transition-colors"
                    >
                      Cancel In-Touch Request
                    </button>
                  )}

                  {alumni.inTouchStatus === "PENDING_RECEIVED" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAcceptInTouch}
                        disabled={inTouchLoading}
                        className="py-2 px-4 bg-white text-black hover:bg-neutral-200 text-[12px] font-bold tracking-wider uppercase rounded-full cursor-pointer transition-colors"
                      >
                        Accept Request
                      </button>
                      <button
                        onClick={handleRejectInTouch}
                        disabled={inTouchLoading}
                        className="py-2 px-4 border border-white/10 text-neutral-400 hover:text-white text-[12px] font-medium tracking-wider uppercase rounded-full cursor-pointer transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {alumni.inTouchStatus === "NONE" && (
                    <button
                      onClick={handleSendInTouch}
                      disabled={inTouchLoading}
                      className="py-2 px-4 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/5 text-[12px] font-semibold tracking-wider uppercase rounded-full cursor-pointer transition-all"
                    >
                      Add to In-Touch
                    </button>
                  )}

                </div>
              </div>
            </div>

            {/* Core Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[14px] font-light text-neutral-300">
              
              <div className="space-y-4">
                <div>
                  <span className="text-neutral-500 block text-[12px] uppercase tracking-wider mb-1 font-bold">Email</span>
                  <span className="text-white select-text">
                    {alumni.hasFullAccess ? alumni.email : "••••••@••••••.•••"}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[12px] uppercase tracking-wider mb-1 font-bold">Phone Number</span>
                  {alumni.phoneNumber ? (
                    <span className="text-white select-text">{alumni.phoneNumber}</span>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-neutral-450">••••••••••</span>
                      {alumni.hasFullAccess && alumni.contactRequestStatus === "NONE" && (
                        <button
                          onClick={handleRequestContact}
                          disabled={contactLoading}
                          className="text-[11px] underline text-neutral-400 hover:text-white uppercase tracking-wider cursor-pointer"
                        >
                          Request Contact
                        </button>
                      )}
                      {alumni.contactRequestStatus === "PENDING_SENT" && (
                        <span className="text-[11px] text-neutral-500 italic uppercase tracking-wider">Pending Approval</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-neutral-500 block text-[12px] uppercase tracking-wider mb-1 font-bold">Academic Community</span>
                  <span className="text-white">
                    Class of {alumni.batch} • {alumni.department} {alumni.section ? `Sec ${alumni.section}` : ""}
                  </span>
                </div>
                {alumni.graduationYear && (
                  <div>
                    <span className="text-neutral-500 block text-[12px] uppercase tracking-wider mb-1 font-bold">Graduation Year</span>
                    <span className="text-white">{alumni.graduationYear}</span>
                  </div>
                )}
              </div>

            </div>

            {/* Skills Tag Row */}
            {alumni.skills && (
              <div className="space-y-2 pt-5 border-t border-white/5">
                <span className="text-neutral-500 block text-[12px] uppercase tracking-wider font-bold">Skills</span>
                <div className="flex flex-wrap gap-2">
                  {alumni.skills.split(",").map((s) => s.trim()).filter(Boolean).map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] text-neutral-300 uppercase tracking-wider font-light"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio block */}
            {alumni.hasFullAccess && alumni.bio && (
              <div className="space-y-2 pt-5 border-t border-white/5">
                <span className="text-neutral-500 block text-[12px] uppercase tracking-wider font-bold">Bio</span>
                <p className="text-neutral-300 text-[14px] font-light leading-relaxed select-text whitespace-pre-wrap">
                  {alumni.bio}
                </p>
              </div>
            )}

            {/* Social Links Block */}
            {alumni.hasFullAccess && (alumni.linkedinUrl || alumni.githubUrl || alumni.instagramUrl) && (
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

            {/* Locked Warning Screen */}
            {!alumni.hasFullAccess && (
              <div className="p-6 text-center bg-white/[0.02] border border-white/5 rounded-[16px] space-y-3 mt-6">
                <svg className="w-8 h-8 text-neutral-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h4 className="text-[13px] font-semibold uppercase tracking-wider text-white">Private Profile Details</h4>
                <p className="text-[12px] text-neutral-450 max-w-sm mx-auto leading-relaxed">
                  This profile has been configured as private. Send an In-Touch request to view their timeline, bio, and complete social links.
                </p>
              </div>
            )}

            {/* Timeline Section */}
            {alumni.hasFullAccess && (
              <div className="space-y-6 pt-6 border-t border-white/5">
                <h3 className="text-[13px] tracking-widest uppercase text-neutral-450 font-bold">Memory Timeline</h3>
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
                        transition={{ delay: idx * 0.05 }}
                        className="relative"
                      >
                        {/* Timeline Node dot */}
                        <div className="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-white ring-4 ring-black" />
                        
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
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </div>
      </main>
    </div>
  );
}
