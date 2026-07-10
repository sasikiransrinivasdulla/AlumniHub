"use client";

import { useEffect, useState, useRef } from "react";
import { useModal } from "@/hooks/useModal";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getAchievements, createAchievement, deleteAchievement, AchievementDto, AchievementCreateDto } from "@/services/achievementService";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";

export default function AchievementsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<AchievementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<AchievementCreateDto>({ type: "AWARD", title: "", description: "", date: "" });
  const modalRef = useRef<HTMLDivElement>(null);
  useModal(showCreate, () => setShowCreate(false), modalRef);

  useEffect(() => {
    async function load() {
      try {
        const profile = await getUserProfile();
        if (!profile.profileCompleted) { router.push("/profile/setup"); return; }
        setUser(profile);
        await loadAchievements();
      } catch { clearAuth(); router.push("/"); }
      finally { setLoading(false); }
    }
    load();
  }, [router]);

  const loadAchievements = async () => {
    try { const data = await getAchievements(); setAchievements(Array.isArray(data) ? data : []); } catch { setAchievements([]); }
  };

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.date) return;
    try { await createAchievement(form); setShowCreate(false); setForm({ type: "AWARD", title: "", description: "", date: "" }); await loadAchievements(); } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteAchievement(id); await loadAchievements(); } catch (e) { console.error(e); }
  };

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-black text-white"><p className="text-[15px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse font-light">Loading Achievements...</p></main>;
  if (!user) return null;

  const types = ["AWARD", "PUBLICATION", "PATENT", "CERTIFICATION", "STARTUP", "COMMUNITY_SERVICE", "OTHER"];

  const typeColors: Record<string, string> = {
    AWARD: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    PUBLICATION: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    PATENT: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    CERTIFICATION: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    STARTUP: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    COMMUNITY_SERVICE: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    OTHER: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
  };

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="z-10 w-full max-w-4xl mx-auto px-6 md:px-12 py-10 md:py-16 space-y-8">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h1 className="text-[20px] md:text-[22px] font-light tracking-[0.15em] uppercase text-white">Achievements</h1>
              <p className="text-[12px] tracking-wider text-neutral-450 mt-1.5 uppercase">Celebrate alumni accomplishments</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="py-2.5 px-5 bg-white text-black hover:bg-neutral-200 text-[11px] font-bold tracking-widest uppercase transition-colors rounded-full cursor-pointer">+ Share Achievement</button>
          </div>

          {achievements.length === 0 ? (
            <div className="glass-panel p-16 rounded-[20px] border border-white/8 text-center"><span className="text-[14px] font-light text-neutral-455 uppercase tracking-widest">No achievements shared yet.</span></div>
          ) : (
            <div className="space-y-4">
              {achievements.map(a => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-[20px] border border-white/8 hover:border-white/15 transition-all flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
                    {a.userProfilePicture ? <img src={a.userProfilePicture} alt="" className="w-full h-full object-cover" /> : <span className="text-[16px] font-bold text-neutral-500">{(a.userFullName || "?")[0]}</span>}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-semibold text-white uppercase tracking-wider">{a.userFullName}</span>
                      <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${typeColors[a.type] || typeColors.OTHER}`}>{a.type.replace("_", " ")}</span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-white">{a.title}</h3>
                    <p className="text-[12px] text-neutral-400 font-light leading-relaxed">{a.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-neutral-500 uppercase tracking-wider">
                      {a.companyOrInstitution && <span>{a.companyOrInstitution}</span>}
                      <span>{new Date(a.date).toLocaleDateString()}</span>
                    </div>
                    {a.link && <a href={a.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline uppercase tracking-wider">View More ↗</a>}
                    {user && a.userId === user.id && <button onClick={() => handleDelete(a.id)} className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-wider cursor-pointer mt-1">Delete</button>}
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
                  aria-label="Share Achievement"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-6"
                >
                  <div className="glass-panel border border-white/8 rounded-[24px] p-8 max-w-lg w-full space-y-5">
                    <h2 className="text-[16px] font-semibold uppercase tracking-widest text-white">Share Achievement</h2>
                    <div className="space-y-3 text-[12px]">
                      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none appearance-none bg-transparent text-white">
                        {types.map(t => <option key={t} value={t} className="bg-neutral-900">{t.replace("_", " ")}</option>)}
                      </select>
                      <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                      <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full glass-input px-4 py-3 rounded-2xl focus:outline-none resize-none h-24" />
                      <input type="text" placeholder="Company / Institution" value={form.companyOrInstitution || ""} onChange={e => setForm({ ...form, companyOrInstitution: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                      <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                      <input type="text" placeholder="Link (optional)" value={form.link || ""} onChange={e => setForm({ ...form, link: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-white/10 text-white text-[11px] font-semibold tracking-wider uppercase rounded-full hover:bg-white/5 cursor-pointer">Cancel</button>
                      <button onClick={handleCreate} className="flex-1 py-2.5 bg-white text-black text-[11px] font-bold tracking-wider uppercase rounded-full hover:bg-neutral-200 cursor-pointer">Share</button>
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
