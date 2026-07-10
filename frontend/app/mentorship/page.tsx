"use client";

import { useEffect, useState, useRef } from "react";
import { useModal } from "@/hooks/useModal";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getMentors, getRequestsAsMentor, getRequestsAsMentee, requestMentorship, acceptMentorship, rejectMentorship, registerAsMentor, MentorshipRequestDto, MentorshipRequestCreateDto } from "@/services/mentorshipService";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "find" | "requests-sent" | "requests-received" | "register";

export default function MentorshipPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<Tab>("find");
  const [mentors, setMentors] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<MentorshipRequestDto[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<MentorshipRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  useModal(showRequest !== null, () => setShowRequest(null), modalRef);
  const [regForm, setRegForm] = useState({ skills: "", experience: "", company: "", availability: "", meetingMode: "online", helpAreas: "" });

  useEffect(() => {
    async function load() {
      try {
        const profile = await getUserProfile();
        if (!profile.profileCompleted) { router.push("/profile/setup"); return; }
        setUser(profile);
        await loadMentors();
      } catch { clearAuth(); router.push("/"); }
      finally { setLoading(false); }
    }
    load();
  }, [router]);

  const loadMentors = async () => {
    try { const data = await getMentors(); setMentors(Array.isArray(data) ? data : []); } catch { setMentors([]); }
  };
  const loadSent = async () => {
    try { const data = await getRequestsAsMentee(); setSentRequests(Array.isArray(data) ? data : []); } catch { setSentRequests([]); }
  };
  const loadReceived = async () => {
    try { const data = await getRequestsAsMentor(); setReceivedRequests(Array.isArray(data) ? data : []); } catch { setReceivedRequests([]); }
  };

  const switchTab = async (t: Tab) => {
    setTab(t);
    if (t === "find") await loadMentors();
    else if (t === "requests-sent") await loadSent();
    else if (t === "requests-received") await loadReceived();
  };

  const handleRequest = async (mentorId: string) => {
    try {
      await requestMentorship({ mentorId, message: requestMessage });
      setShowRequest(null);
      setRequestMessage("");
      await loadMentors();
    } catch (e) { console.error(e); }
  };

  const handleAccept = async (id: string) => {
    try { await acceptMentorship(id); await loadReceived(); } catch (e) { console.error(e); }
  };
  const handleReject = async (id: string) => {
    try { await rejectMentorship(id); await loadReceived(); } catch (e) { console.error(e); }
  };

  const handleRegister = async () => {
    if (!regForm.skills || !regForm.experience || !regForm.company) return;
    try { await registerAsMentor(regForm); setTab("find"); await loadMentors(); } catch (e) { console.error(e); }
  };

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-black text-white"><p className="text-[15px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse font-light">Loading Mentorship...</p></main>;
  if (!user) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "find", label: "Find Mentors" },
    { key: "requests-sent", label: "Sent" },
    { key: "requests-received", label: "Received" },
    { key: "register", label: "Become Mentor" },
  ];

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="z-10 w-full max-w-4xl mx-auto px-6 md:px-12 py-10 md:py-16 space-y-8">
          <div className="border-b border-white/5 pb-4">
            <h1 className="text-[20px] md:text-[22px] font-light tracking-[0.15em] uppercase text-white">Mentorship</h1>
            <p className="text-[12px] tracking-wider text-neutral-450 mt-1.5 uppercase">Connect with experienced alumni mentors</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {tabs.map(t => (
              <button key={t.key} onClick={() => switchTab(t.key)} className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${tab === t.key ? "bg-white text-black" : "bg-white/5 text-neutral-400 hover:bg-white/10 border border-white/5"}`}>{t.label}</button>
            ))}
          </div>

          {tab === "find" && (
            mentors.length === 0 ? (
              <div className="glass-panel p-16 rounded-[20px] border border-white/8 text-center"><span className="text-[14px] font-light text-neutral-455 uppercase tracking-widest">No mentors available yet.</span></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {mentors.map((m: any) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-[20px] border border-white/8 hover:border-white/15 transition-all space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
                        {m.profilePicture ? <img src={m.profilePicture} alt="" className="w-full h-full object-cover" /> : <span className="text-[14px] font-bold text-neutral-500">{(m.fullName || "?")[0]}</span>}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-white tracking-wider uppercase">{m.fullName}</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{m.mentorCompany || m.currentCompany || "Alumni"}</p>
                      </div>
                    </div>
                    {m.mentorSkills && <p className="text-[11px] text-neutral-400 font-light">Skills: {m.mentorSkills}</p>}
                    {m.mentorExperience && <p className="text-[10px] text-neutral-500">Experience: {m.mentorExperience}</p>}
                    {m.mentorHelpAreas && <p className="text-[10px] text-neutral-500">Helps with: {m.mentorHelpAreas}</p>}
                    <button onClick={() => setShowRequest(m.id)} className="w-full py-2 bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-neutral-200 transition-colors cursor-pointer">Request Mentorship</button>
                  </motion.div>
                ))}
              </div>
            )
          )}

          {tab === "requests-sent" && (
            sentRequests.length === 0 ? (
              <div className="glass-panel p-16 rounded-[20px] border border-white/8 text-center"><span className="text-[14px] font-light text-neutral-455 uppercase tracking-widest">No sent requests.</span></div>
            ) : (
              <div className="space-y-4">
                {sentRequests.map(r => (
                  <div key={r.id} className="glass-panel p-5 rounded-[16px] border border-white/8 flex items-center justify-between">
                    <div><p className="text-[13px] font-semibold text-white tracking-wider uppercase">{r.mentorName}</p><p className="text-[10px] text-neutral-500 uppercase tracking-wider">{r.status}</p></div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${r.status === "ACCEPTED" ? "border-emerald-500/20 text-emerald-400" : r.status === "REJECTED" ? "border-red-500/20 text-red-400" : "border-amber-500/20 text-amber-400"}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "requests-received" && (
            receivedRequests.length === 0 ? (
              <div className="glass-panel p-16 rounded-[20px] border border-white/8 text-center"><span className="text-[14px] font-light text-neutral-455 uppercase tracking-widest">No received requests.</span></div>
            ) : (
              <div className="space-y-4">
                {receivedRequests.map(r => (
                  <div key={r.id} className="glass-panel p-5 rounded-[16px] border border-white/8 flex items-center justify-between">
                    <div><p className="text-[13px] font-semibold text-white tracking-wider uppercase">{r.menteeName}</p>{r.message && <p className="text-[11px] text-neutral-400">{r.message}</p>}<p className="text-[10px] text-neutral-500 uppercase tracking-wider">{r.status}</p></div>
                    {r.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button onClick={() => handleAccept(r.id)} className="px-4 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-neutral-200 cursor-pointer">Accept</button>
                        <button onClick={() => handleReject(r.id)} className="px-4 py-2 border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-white/5 cursor-pointer">Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "register" && (
            <div className="glass-panel p-8 rounded-[20px] border border-white/8 space-y-5 max-w-lg">
              <h2 className="text-[16px] font-semibold uppercase tracking-widest text-white">Register as Mentor</h2>
              <div className="space-y-3 text-[12px]">
                <input type="text" placeholder="Your Skills" value={regForm.skills} onChange={e => setRegForm({ ...regForm, skills: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                <input type="text" placeholder="Years of Experience" value={regForm.experience} onChange={e => setRegForm({ ...regForm, experience: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                <input type="text" placeholder="Current Company" value={regForm.company} onChange={e => setRegForm({ ...regForm, company: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                <input type="text" placeholder="Availability (e.g., Weekends)" value={regForm.availability} onChange={e => setRegForm({ ...regForm, availability: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                <select value={regForm.meetingMode} onChange={e => setRegForm({ ...regForm, meetingMode: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none appearance-none bg-transparent text-white">
                  <option value="online" className="bg-neutral-900">Online</option>
                  <option value="offline" className="bg-neutral-900">Offline</option>
                  <option value="both" className="bg-neutral-900">Both</option>
                </select>
                <input type="text" placeholder="Areas you can help with" value={regForm.helpAreas} onChange={e => setRegForm({ ...regForm, helpAreas: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
              </div>
              <button onClick={handleRegister} className="w-full py-3 bg-white text-black text-[11px] font-bold uppercase tracking-wider rounded-full hover:bg-neutral-200 transition-colors cursor-pointer">Register as Mentor</button>
            </div>
          )}

          {/* Request Modal */}
          <AnimatePresence>
            {showRequest && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRequest(null)} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-[26px]" />
                <motion.div
                  ref={modalRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Send Request"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-6"
                >
                  <div className="glass-panel border border-white/8 rounded-[24px] p-8 max-w-md w-full space-y-5">
                    <h2 className="text-[16px] font-semibold uppercase tracking-widest text-white">Send Request</h2>
                    <textarea placeholder="Why do you want mentorship?" value={requestMessage} onChange={e => setRequestMessage(e.target.value)} className="w-full glass-input px-4 py-3 rounded-2xl focus:outline-none resize-none h-24 text-[12px]" />
                    <div className="flex gap-3">
                      <button onClick={() => setShowRequest(null)} className="flex-1 py-2.5 border border-white/10 text-white text-[11px] font-semibold tracking-wider uppercase rounded-full hover:bg-white/5 cursor-pointer">Cancel</button>
                      <button onClick={() => showRequest && handleRequest(showRequest)} className="flex-1 py-2.5 bg-white text-black text-[11px] font-bold tracking-wider uppercase rounded-full hover:bg-neutral-200 cursor-pointer">Send</button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
