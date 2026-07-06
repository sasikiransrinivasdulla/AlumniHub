"use client";

import { useEffect, useState, useRef } from "react";
import { useModal } from "@/hooks/useModal";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getReunions, createReunion, rsvpReunion, withdrawReunion, addReunionComment, ReunionCollectionDto } from "@/services/reunionService";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";

export default function ReunionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reunions, setReunions] = useState<ReunionCollectionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", location: "" });
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  useModal(showCreate, () => setShowCreate(false), modalRef);

  useEffect(() => {
    async function load() {
      try {
        const profile = await getUserProfile();
        if (!profile.profileCompleted) { router.push("/profile/setup"); return; }
        setUser(profile);
        await loadReunions();
      } catch { clearAuth(); router.push("/"); }
      finally { setLoading(false); }
    }
    load();
  }, [router]);

  const loadReunions = async () => {
    try { const data = await getReunions(); setReunions(Array.isArray(data) ? data : []); } catch { setReunions([]); }
  };

  const handleRsvp = async (id: string, attending: boolean) => {
    try { if (attending) await withdrawReunion(id); else await rsvpReunion(id); await loadReunions(); } catch (e) { console.error(e); }
  };

  const handleCreate = async () => {
    if (!form.title || !form.date) return;
    try { await createReunion(form.title, form.description, form.date, form.location); setShowCreate(false); setForm({ title: "", description: "", date: "", location: "" }); await loadReunions(); } catch (e) { console.error(e); }
  };

  const handleComment = async (id: string) => {
    const text = commentTexts[id]?.trim();
    if (!text) return;
    try { await addReunionComment(id, text); setCommentTexts({ ...commentTexts, [id]: "" }); await loadReunions(); } catch (e) { console.error(e); }
  };

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-black text-white"><p className="text-[15px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse font-light">Loading Reunions...</p></main>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="z-10 w-full max-w-4xl mx-auto px-6 md:px-12 py-10 md:py-16 space-y-8">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h1 className="text-[20px] md:text-[22px] font-light tracking-[0.15em] uppercase text-white">Reunions</h1>
              <p className="text-[12px] tracking-wider text-neutral-450 mt-1.5 uppercase">Relive memories with your batchmates</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="py-2.5 px-5 bg-white text-black hover:bg-neutral-200 text-[11px] font-bold tracking-widest uppercase transition-colors rounded-full cursor-pointer">+ Create Reunion</button>
          </div>

          {reunions.length === 0 ? (
            <div className="glass-panel p-16 rounded-[20px] border border-white/8 text-center"><span className="text-[14px] font-light text-neutral-455 uppercase tracking-widest">No reunions yet. Create the first one!</span></div>
          ) : (
            <div className="space-y-6">
              {reunions.map(reunion => (
                <motion.div key={reunion.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-[20px] border border-white/8 hover:border-white/15 transition-all overflow-hidden">
                  {/* Photos Gallery */}
                  {Array.isArray(reunion.photos) && reunion.photos.length > 0 && (
                    <div className="flex overflow-x-auto gap-1 bg-neutral-900/50">
                      {reunion.photos.slice(0, 5).map(p => (
                        <img key={p.id} src={p.url} alt={p.caption || ""} className="h-40 w-auto object-cover flex-shrink-0" />
                      ))}
                    </div>
                  )}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-semibold text-white uppercase tracking-wider">{reunion.title}</h3>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{reunion.attendeesCount} attending</span>
                    </div>
                    {reunion.description && <p className="text-[12px] text-neutral-400 font-light leading-relaxed">{reunion.description}</p>}
                    <div className="flex items-center gap-3 text-[10px] text-neutral-500 uppercase tracking-wider">
                      <span>{new Date(reunion.date).toLocaleDateString()}</span>
                      {reunion.location && <span>• {reunion.location}</span>}
                    </div>
                    <button onClick={() => handleRsvp(reunion.id, reunion.attending)} className={`py-2 px-5 text-[10px] font-bold uppercase tracking-wider rounded-full cursor-pointer transition-colors ${reunion.attending ? "border border-white/10 text-white hover:bg-white/5" : "bg-white text-black hover:bg-neutral-200"}`}>{reunion.attending ? "Withdraw" : "Attend"}</button>

                    {/* Comments */}
                    {Array.isArray(reunion.comments) && reunion.comments.length > 0 && (
                      <div className="border-t border-white/5 pt-3 mt-3 space-y-2">
                        {reunion.comments.slice(-3).map(c => (
                          <div key={c.id} className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0 mt-0.5">
                              {c.userProfilePicture ? <img src={c.userProfilePicture} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px] font-bold text-neutral-500">{(c.userFullName || "?")[0]}</span>}
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-white uppercase tracking-wider">{c.userFullName}</span>
                              <p className="text-[11px] text-neutral-400 font-light">{c.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <input type="text" placeholder="Add a comment..." value={commentTexts[reunion.id] || ""} onChange={e => setCommentTexts({ ...commentTexts, [reunion.id]: e.target.value })} onKeyDown={e => e.key === "Enter" && handleComment(reunion.id)} className="flex-1 glass-input px-3 py-2 rounded-full focus:outline-none text-[11px]" />
                      <button onClick={() => handleComment(reunion.id)} className="px-4 py-2 bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-white/15 cursor-pointer">Send</button>
                    </div>
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
                  aria-label="Create Reunion"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-6"
                >
                  <div className="glass-panel border border-white/8 rounded-[24px] p-8 max-w-lg w-full space-y-5">
                    <h2 className="text-[16px] font-semibold uppercase tracking-widest text-white">Create Reunion</h2>
                    <div className="space-y-3 text-[12px]">
                      <input type="text" placeholder="Reunion Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                      <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full glass-input px-4 py-3 rounded-2xl focus:outline-none resize-none h-24" />
                      <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                      <input type="text" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-white/10 text-white text-[11px] font-semibold tracking-wider uppercase rounded-full hover:bg-white/5 cursor-pointer">Cancel</button>
                      <button onClick={handleCreate} className="flex-1 py-2.5 bg-white text-black text-[11px] font-bold tracking-wider uppercase rounded-full hover:bg-neutral-200 cursor-pointer">Create</button>
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
