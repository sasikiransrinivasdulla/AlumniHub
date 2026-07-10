"use client";

import { useEffect, useState, useRef } from "react";
import { useModal } from "@/hooks/useModal";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getReferrals, createReferral, applyForReferral, deleteReferral, ReferralDto, ReferralCreateDto } from "@/services/referralService";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";

export default function ReferralsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [referrals, setReferrals] = useState<ReferralDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showApply, setShowApply] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [form, setForm] = useState<ReferralCreateDto>({ company: "", role: "" });

  const createModalRef = useRef<HTMLDivElement>(null);
  const applyModalRef = useRef<HTMLDivElement>(null);
  useModal(showCreate, () => setShowCreate(false), createModalRef);
  useModal(showApply !== null, () => setShowApply(null), applyModalRef);

  useEffect(() => {
    async function load() {
      try {
        const profile = await getUserProfile();
        if (!profile.profileCompleted) { router.push("/profile/setup"); return; }
        setUser(profile);
        await loadReferrals();
      } catch { clearAuth(); router.push("/"); }
      finally { setLoading(false); }
    }
    load();
  }, [router]);

  const loadReferrals = async () => {
    try { const data = await getReferrals(); setReferrals(Array.isArray(data) ? data : []); } catch { setReferrals([]); }
  };

  const handleCreate = async () => {
    if (!form.company || !form.role) return;
    try { await createReferral(form); setShowCreate(false); setForm({ company: "", role: "" }); await loadReferrals(); } catch (e) { console.error(e); }
  };

  const handleApply = async (id: string) => {
    if (!resumeUrl.trim()) return;
    try { await applyForReferral(id, resumeUrl); setShowApply(null); setResumeUrl(""); } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteReferral(id); await loadReferrals(); } catch (e) { console.error(e); }
  };

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-black text-white"><p className="text-[15px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse font-light">Loading Referrals...</p></main>;
  if (!user) return null;

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="z-10 w-full max-w-4xl mx-auto px-6 md:px-12 py-10 md:py-16 space-y-8">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h1 className="text-[20px] md:text-[22px] font-light tracking-[0.15em] uppercase text-white">Referrals</h1>
              <p className="text-[12px] tracking-wider text-neutral-450 mt-1.5 uppercase">Get referrals from alumni at top companies</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="py-2.5 px-5 bg-white text-black hover:bg-neutral-200 text-[11px] font-bold tracking-widest uppercase transition-colors rounded-full cursor-pointer">+ Offer Referral</button>
          </div>

          {referrals.length === 0 ? (
            <div className="glass-panel p-16 rounded-[20px] border border-white/8 text-center"><span className="text-[14px] font-light text-neutral-455 uppercase tracking-widest">No referrals available yet.</span></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {referrals.map(ref => (
                <motion.div key={ref.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-[20px] border border-white/8 hover:border-white/15 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{ref.company}</span>
                    {ref.location && <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{ref.location}</span>}
                  </div>
                  <h3 className="text-[15px] font-semibold text-white uppercase tracking-wider">{ref.role}</h3>
                  {ref.experienceRequired && <p className="text-[11px] text-neutral-400">Experience: {ref.experienceRequired}</p>}
                  {ref.salaryRange && <p className="text-[11px] text-neutral-400">Range: {ref.salaryRange}</p>}
                  {ref.requirements && <p className="text-[12px] text-neutral-400 font-light leading-relaxed line-clamp-2">{ref.requirements}</p>}
                  {ref.deadline && <p className="text-[10px] text-neutral-500">Deadline: {new Date(ref.deadline).toLocaleDateString()}</p>}
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Posted by {ref.creatorName}</p>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setShowApply(ref.id)} className="flex-1 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-neutral-200 cursor-pointer">Apply</button>
                    {user && ref.creatorId === user.id && <button onClick={() => handleDelete(ref.id)} className="px-3 py-2 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-red-500/10 cursor-pointer">Delete</button>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Create Modal */}
          <AnimatePresence>
            {showCreate && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-[26px]" />
                <motion.div
                  ref={createModalRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Offer a Referral"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-6"
                >
                  <div className="glass-panel border border-white/8 rounded-[24px] p-8 max-w-lg w-full space-y-5">
                    <h2 className="text-[16px] font-semibold uppercase tracking-widest text-white">Offer a Referral</h2>
                    <div className="space-y-3 text-[12px]">
                      <input type="text" placeholder="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                      <input type="text" placeholder="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                      <input type="text" placeholder="Location" value={form.location || ""} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                      <input type="text" placeholder="Experience Required" value={form.experienceRequired || ""} onChange={e => setForm({ ...form, experienceRequired: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                      <input type="text" placeholder="Salary Range" value={form.salaryRange || ""} onChange={e => setForm({ ...form, salaryRange: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                      <input type="date" placeholder="Deadline" value={form.deadline || ""} onChange={e => setForm({ ...form, deadline: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                      <textarea placeholder="Requirements" value={form.requirements || ""} onChange={e => setForm({ ...form, requirements: e.target.value })} className="w-full glass-input px-4 py-3 rounded-2xl focus:outline-none resize-none h-24" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-white/10 text-white text-[11px] font-semibold tracking-wider uppercase rounded-full hover:bg-white/5 cursor-pointer">Cancel</button>
                      <button onClick={handleCreate} className="flex-1 py-2.5 bg-white text-black text-[11px] font-bold tracking-wider uppercase rounded-full hover:bg-neutral-200 cursor-pointer">Post</button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Apply Modal */}
          <AnimatePresence>
            {showApply && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowApply(null)} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-[26px]" />
                <motion.div
                  ref={applyModalRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Apply for Referral"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-6"
                >
                  <div className="glass-panel border border-white/8 rounded-[24px] p-8 max-w-md w-full space-y-5">
                    <h2 className="text-[16px] font-semibold uppercase tracking-widest text-white">Apply for Referral</h2>
                    <input type="text" placeholder="Resume URL / Google Drive Link" value={resumeUrl} onChange={e => setResumeUrl(e.target.value)} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none text-[12px]" />
                    <div className="flex gap-3">
                      <button onClick={() => setShowApply(null)} className="flex-1 py-2.5 border border-white/10 text-white text-[11px] font-semibold tracking-wider uppercase rounded-full hover:bg-white/5 cursor-pointer">Cancel</button>
                      <button onClick={() => showApply && handleApply(showApply)} className="flex-1 py-2.5 bg-white text-black text-[11px] font-bold tracking-wider uppercase rounded-full hover:bg-neutral-200 cursor-pointer">Apply</button>
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
