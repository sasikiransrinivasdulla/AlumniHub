"use client";

import { useEffect, useState, useRef } from "react";
import { useModal } from "@/hooks/useModal";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getUpcomingEvents, getPastEvents, getMyEvents, rsvpEvent, withdrawRsvp, deleteEvent, createEvent, EventDto, EventCreateDto } from "@/services/eventService";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "upcoming" | "popular" | "my" | "past";

export default function EventsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<EventCreateDto>({ title: "", description: "", startDate: "", endDate: "" });
  const modalRef = useRef<HTMLDivElement>(null);
  useModal(showCreate, () => setShowCreate(false), modalRef);

  useEffect(() => {
    async function load() {
      try {
        const profile = await getUserProfile();
        if (!profile.profileCompleted) { router.push("/profile/setup"); return; }
        setUser(profile);
        await loadTab("upcoming");
      } catch { clearAuth(); router.push("/"); }
      finally { setLoading(false); }
    }
    load();
  }, [router]);

  const loadTab = async (t: Tab) => {
    setTab(t);
    try {
      let data: EventDto[] = [];
      if (t === "upcoming") data = await getUpcomingEvents();
      else if (t === "past") data = await getPastEvents();
      else if (t === "my") data = await getMyEvents();
      else data = await getUpcomingEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); setEvents([]); }
  };

  const handleRsvp = async (id: string, participating: boolean) => {
    try {
      if (participating) await withdrawRsvp(id);
      else await rsvpEvent(id);
      await loadTab(tab);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteEvent(id); await loadTab(tab); } catch (e) { console.error(e); }
  };

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.startDate || !form.endDate) return;
    try {
      await createEvent(form);
      setShowCreate(false);
      setForm({ title: "", description: "", startDate: "", endDate: "" });
      await loadTab(tab);
    } catch (e) { console.error(e); }
  };

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-black text-white"><p className="text-[15px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse font-light">Loading Events...</p></main>;
  if (!user) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "my", label: "My Events" },
    { key: "past", label: "Past" },
  ];

  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return d; } };

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_100%)] pointer-events-none" />
        <div className="z-10 w-full max-w-4xl mx-auto px-6 md:px-12 py-10 md:py-16 space-y-8">

          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h1 className="text-[20px] md:text-[22px] font-light tracking-[0.15em] uppercase text-white">Alumni Events</h1>
              <p className="text-[12px] tracking-wider text-neutral-450 mt-1.5 uppercase">Reunions, Meetups, Hackathons & More</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="py-2.5 px-5 bg-white text-black hover:bg-neutral-200 text-[11px] font-bold tracking-widest uppercase transition-colors rounded-full cursor-pointer">+ Create Event</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map(t => (
              <button key={t.key} onClick={() => loadTab(t.key)} className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${tab === t.key ? "bg-white text-black" : "bg-white/5 text-neutral-400 hover:bg-white/10 border border-white/5"}`}>{t.label}</button>
            ))}
          </div>

          {/* Events Grid */}
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 glass-panel text-center space-y-3 rounded-[20px] border border-white/8">
              <span className="text-[14px] font-light text-neutral-455 uppercase tracking-widest">No events found in this category.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {events.map(event => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-[20px] border border-white/8 hover:border-white/15 transition-all space-y-3 relative group">
                  {event.bannerUrl && <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-neutral-900"><img src={event.bannerUrl} alt="" className="w-full h-full object-cover" /></div>}
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${event.online ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>{event.online ? "Online" : "In-Person"}</span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{event.participantsCount} attending</span>
                  </div>
                  <h3 className="text-[15px] font-semibold text-white uppercase tracking-wider">{event.title}</h3>
                  <p className="text-[12px] text-neutral-400 font-light leading-relaxed line-clamp-2">{event.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-neutral-500 uppercase tracking-wider">
                    <span>{formatDate(event.startDate)}</span>
                    {event.location && <span>• {event.location}</span>}
                  </div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Organized by {event.organizerName}</p>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleRsvp(event.id, event.participating)} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-full cursor-pointer transition-colors ${event.participating ? "border border-white/10 text-white hover:bg-white/5" : "bg-white text-black hover:bg-neutral-200"}`}>{event.participating ? "Withdraw RSVP" : "RSVP"}</button>
                    {user && event.organizerId === user.id && (
                      <button onClick={() => handleDelete(event.id)} className="px-3 py-2 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-red-500/10 cursor-pointer transition-colors">Delete</button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Create Event Modal */}
          <AnimatePresence>
            {showCreate && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-[26px]" />
                <motion.div
                  ref={modalRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Create Event"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-6"
                >
                  <div className="glass-panel border border-white/8 rounded-[24px] p-8 max-w-lg w-full space-y-5">
                    <h2 className="text-[16px] font-semibold uppercase tracking-widest text-white">Create Event</h2>
                    <div className="space-y-3 text-[12px]">
                      <input type="text" placeholder="Event Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                      <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full glass-input px-4 py-3 rounded-2xl focus:outline-none resize-none h-24" />
                      <input type="text" placeholder="Location" value={form.location || ""} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />
                      <div className="flex gap-3">
                        <input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="flex-1 glass-input px-4 py-3 rounded-full focus:outline-none" />
                        <input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="flex-1 glass-input px-4 py-3 rounded-full focus:outline-none" />
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-neutral-450 uppercase tracking-wider flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={form.online || false} onChange={e => setForm({ ...form, online: e.target.checked })} className="accent-white" /> Online Event
                        </label>
                        <input type="number" placeholder="Capacity" value={form.capacity || ""} onChange={e => setForm({ ...form, capacity: e.target.value ? parseInt(e.target.value) : undefined })} className="flex-1 glass-input px-4 py-3 rounded-full focus:outline-none" />
                      </div>
                      {form.online && <input type="text" placeholder="Meeting Link" value={form.meetingLink || ""} onChange={e => setForm({ ...form, meetingLink: e.target.value })} className="w-full glass-input px-4 py-3 rounded-full focus:outline-none" />}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-white/10 text-white text-[11px] font-semibold tracking-wider uppercase rounded-full hover:bg-white/5 transition-colors cursor-pointer">Cancel</button>
                      <button onClick={handleCreate} className="flex-1 py-2.5 bg-white text-black text-[11px] font-bold tracking-wider uppercase rounded-full hover:bg-neutral-200 transition-colors cursor-pointer">Create</button>
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
