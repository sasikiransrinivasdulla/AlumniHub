"use client";

import { useEffect, useState, useRef } from "react";
import { useModal } from "@/hooks/useModal";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getJobs, createJob, saveJob, unsaveJob, deleteJob, getSavedJobs, JobOpeningDto, JobOpeningCreateDto } from "@/services/jobService";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "all" | "saved";

export default function JobsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [jobs, setJobs] = useState<JobOpeningDto[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<JobOpeningCreateDto>({ company: "", role: "", category: "", description: "" });
  const modalRef = useRef<HTMLDivElement>(null);
  useModal(showCreate, () => setShowCreate(false), modalRef);

  useEffect(() => {
    async function load() {
      try {
        const profile = await getUserProfile();
        if (!profile.profileCompleted) { router.push("/profile/setup"); return; }
        setUser(profile);
        await loadJobs("all");
      } catch { clearAuth(); router.push("/"); }
      finally { setLoading(false); }
    }
    load();
  }, [router]);

  const loadJobs = async (t: Tab) => {
    setTab(t);
    try {
      const data = t === "saved" ? await getSavedJobs() : await getJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch { setJobs([]); }
  };

  const handleSave = async (id: string, saved: boolean) => {
    try { if (saved) await unsaveJob(id); else await saveJob(id); await loadJobs(tab); } catch (e) { console.error(e); }
  };

  const handleCreate = async () => {
    if (!form.company || !form.role || !form.category || !form.description) return;
    try { await createJob(form); setShowCreate(false); setForm({ company: "", role: "", category: "", description: "" }); await loadJobs(tab); } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteJob(id); await loadJobs(tab); } catch (e) { console.error(e); }
  };

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-black text-white"><p className="text-[15px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse font-light">Loading Jobs...</p></main>;
  if (!user) return null;

  const categories = ["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT", "FREELANCE"];

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="z-10 w-full max-w-4xl mx-auto px-6 md:px-12 py-10 md:py-16 space-y-8">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h1 className="text-[20px] md:text-[22px] font-light tracking-[0.15em] uppercase text-white">Job Board</h1>
              <p className="text-[12px] tracking-wider text-neutral-450 mt-1.5 uppercase">Opportunities posted by alumni</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="py-2.5 px-5 bg-white text-black hover:bg-neutral-200 text-[11px] font-bold tracking-widest uppercase transition-colors rounded-full cursor-pointer">+ Post Job</button>
          </div>

          <div className="flex gap-2">
            <button onClick={() => loadJobs("all")} className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${tab === "all" ? "bg-white text-black" : "bg-white/5 text-neutral-400 hover:bg-white/10 border border-white/5"}`}>All Jobs</button>
            <button onClick={() => loadJobs("saved")} className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${tab === "saved" ? "bg-white text-black" : "bg-white/5 text-neutral-400 hover:bg-white/10 border border-white/5"}`}>Saved</button>
          </div>

          {jobs.length === 0 ? (
            <div className="glass-panel p-16 rounded-[20px] border border-white/8 text-center"><span className="text-[14px] font-light text-neutral-455 uppercase tracking-widest">No jobs found.</span></div>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => (
                <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-[20px] border border-white/8 hover:border-white/15 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{job.category.replace("_", " ")}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{job.company}</span>
                    </div>
                    {job.location && <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{job.location}</span>}
                  </div>
                  <h3 className="text-[15px] font-semibold text-white uppercase tracking-wider">{job.role}</h3>
                  <p className="text-[12px] text-neutral-400 font-light leading-relaxed line-clamp-3">{job.description}</p>
                  {job.requirements && <p className="text-[11px] text-neutral-500 line-clamp-2">Requirements: {job.requirements}</p>}
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Posted by {job.creatorName}</p>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleSave(job.id, job.saved)} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-full cursor-pointer transition-colors ${job.saved ? "border border-amber-500/20 text-amber-400 hover:bg-amber-500/10" : "border border-white/10 text-white hover:bg-white/5"}`}>{job.saved ? "★ Saved" : "☆ Save"}</button>
                    {job.externalLink && <a href={job.externalLink} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-neutral-200 transition-colors">Apply ↗</a>}
                    {user && job.creatorId === user.id && <button onClick={() => handleDelete(job.id)} className="px-3 py-2 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-red-500/10 cursor-pointer">Delete</button>}
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
                  ref={modalRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Post a Job"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-6"
                >
                  <div className="glass-panel border border-white/8 rounded-[24px] p-8 max-w-lg w-full space-y-5 max-h-[90vh] overflow-y-auto">
                    <h2 className="text-[16px] font-semibold uppercase tracking-widest text-white">Post a Job</h2>
                    <div className="space-y-3 text-[12px]">
                      <input type="text" placeholder="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                      <input type="text" placeholder="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                      <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none appearance-none bg-transparent text-white">
                        <option value="" className="bg-neutral-900">Select Category</option>
                        {categories.map(c => <option key={c} value={c} className="bg-neutral-900">{c.replace("_", " ")}</option>)}
                      </select>
                      <input type="text" placeholder="Location" value={form.location || ""} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                      <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full glass-input px-4 py-3 rounded-2xl focus:outline-none resize-none h-24" />
                      <textarea placeholder="Requirements" value={form.requirements || ""} onChange={e => setForm({ ...form, requirements: e.target.value })} className="w-full glass-input px-4 py-3 rounded-2xl focus:outline-none resize-none h-20" />
                      <input type="text" placeholder="External Link (optional)" value={form.externalLink || ""} onChange={e => setForm({ ...form, externalLink: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
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
        </div>
      </main>
    </div>
  );
}
