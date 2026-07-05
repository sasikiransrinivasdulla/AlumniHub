"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getAnalytics, AnalyticsDto } from "@/services/analyticsService";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const profile = await getUserProfile();
        if (!profile.profileCompleted) { router.push("/profile/setup"); return; }
        setUser(profile);
        try { const data = await getAnalytics(); setAnalytics(data); } catch { /* analytics may not be available */ }
      } catch { clearAuth(); router.push("/"); }
      finally { setLoading(false); }
    }
    load();
  }, [router]);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-black text-white"><p className="text-[15px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse font-light">Loading Analytics...</p></main>;
  if (!user) return null;

  const statCards = analytics ? [
    { label: "Connections", value: analytics.connectionsCount || 0, color: "text-blue-400" },
    { label: "Memories", value: analytics.memoriesCount || 0, color: "text-violet-400" },
    { label: "Profile Views", value: analytics.profileViewsCount || 0, color: "text-emerald-400" },
    { label: "Search Appearances", value: analytics.searchAppearancesCount || 0, color: "text-amber-400" },
    { label: "Likes Received", value: analytics.likesReceivedCount || 0, color: "text-rose-400" },
    { label: "Comments Received", value: analytics.commentsReceivedCount || 0, color: "text-cyan-400" },
  ] : [];

  const connectionGrowth = analytics?.connectionGrowth ? Object.entries(analytics.connectionGrowth) : [];
  const profileViewsTrend = analytics?.profileViewsTrend ? Object.entries(analytics.profileViewsTrend) : [];

  const maxGrowth = connectionGrowth.length > 0 ? Math.max(...connectionGrowth.map(([, v]) => v), 1) : 1;
  const maxViews = profileViewsTrend.length > 0 ? Math.max(...profileViewsTrend.map(([, v]) => v), 1) : 1;

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="z-10 w-full max-w-4xl mx-auto px-6 md:px-12 py-10 md:py-16 space-y-8">
          <div className="border-b border-white/5 pb-4">
            <h1 className="text-[20px] md:text-[22px] font-light tracking-[0.15em] uppercase text-white">Analytics</h1>
            <p className="text-[12px] tracking-wider text-neutral-450 mt-1.5 uppercase">Your profile & engagement insights</p>
          </div>

          {!analytics ? (
            <div className="glass-panel p-16 rounded-[20px] border border-white/8 text-center"><span className="text-[14px] font-light text-neutral-455 uppercase tracking-widest">Analytics data will appear as you use the platform.</span></div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {statCards.map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-panel p-5 rounded-[20px] border border-white/8 text-center space-y-2">
                    <p className={`text-[28px] font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {analytics.mostActiveMonth && (
                <div className="glass-panel p-5 rounded-[16px] border border-white/8 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Most Active Month</span>
                  <span className="text-[14px] font-bold text-white">{analytics.mostActiveMonth}</span>
                </div>
              )}

              {/* Connection Growth Chart */}
              {connectionGrowth.length > 0 && (
                <div className="glass-panel p-6 rounded-[20px] border border-white/8 space-y-4">
                  <h3 className="text-[12px] font-semibold uppercase tracking-widest text-neutral-400">Connection Growth</h3>
                  <div className="flex items-end gap-2 h-32">
                    {connectionGrowth.map(([month, val]) => (
                      <div key={month} className="flex flex-col items-center flex-1 gap-1">
                        <div className="w-full rounded-t-md bg-blue-500/30 transition-all" style={{ height: `${(val / maxGrowth) * 100}%`, minHeight: 4 }} />
                        <span className="text-[8px] text-neutral-500 uppercase tracking-wider">{month.slice(0, 3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile Views Trend */}
              {profileViewsTrend.length > 0 && (
                <div className="glass-panel p-6 rounded-[20px] border border-white/8 space-y-4">
                  <h3 className="text-[12px] font-semibold uppercase tracking-widest text-neutral-400">Profile Views Trend</h3>
                  <div className="flex items-end gap-2 h-32">
                    {profileViewsTrend.map(([month, val]) => (
                      <div key={month} className="flex flex-col items-center flex-1 gap-1">
                        <div className="w-full rounded-t-md bg-emerald-500/30 transition-all" style={{ height: `${(val / maxViews) * 100}%`, minHeight: 4 }} />
                        <span className="text-[8px] text-neutral-500 uppercase tracking-wider">{month.slice(0, 3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
