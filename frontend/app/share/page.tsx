"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, UserProfile } from "@/services/authService";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";

export default function SharePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}` : "https://alumni-hub-sigma.vercel.app";

  const inviteText = `Let's reconnect with our Vasavi classmates on Alumni Hub.

Share memories.
Stay In-Touch.
Grow together.

Join us:
${shareUrl}`;

  useEffect(() => {
    async function loadData() {
      try {
        const profile = await getUserProfile();
        setCurrentUser(profile);
      } catch (err) {
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(inviteText)}`;
    window.open(url, "_blank");
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(inviteText.replace(shareUrl, ""))}`;
    window.open(url, "_blank");
  };

  const handleLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank");
  };

  const handleEmail = () => {
    const url = `mailto:?subject=${encodeURIComponent("Join Alumni Hub")}&body=${encodeURIComponent(inviteText)}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[15px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse font-light">Loading Invite share...</p>
      </main>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      <Sidebar user={currentUser} />

      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_100%)] pointer-events-none" />

        <div className="z-10 w-full max-w-xl mx-auto px-6 md:px-8 py-10 md:py-16 flex flex-col space-y-6">
          
          <div className="pb-4 border-b border-white/5">
            <h1 className="text-[20px] md:text-[22px] font-light tracking-[0.15em] uppercase text-white leading-tight">Share Alumni Hub</h1>
            <p className="text-[12px] tracking-wider text-neutral-450 mt-1.5 uppercase">Invite your classmates to reconnect</p>
          </div>

          {/* Invitation Text Area Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-5 rounded-[20px] border border-white/8 space-y-4 text-[13px]"
          >
            <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest block">Invitation Template</span>
            <pre className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-neutral-300 font-light whitespace-pre-wrap font-mono leading-relaxed select-text">
              {inviteText}
            </pre>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2.5 bg-white text-black hover:bg-neutral-200 text-[11px] font-semibold tracking-wider uppercase rounded-full cursor-pointer transition-colors text-center"
              >
                {copied ? "Copied invite!" : "Copy Invite Text"}
              </button>
            </div>
          </motion.div>

          {/* Social Share Buttons Grid */}
          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <button
              onClick={handleWhatsApp}
              className="py-3 bg-neutral-900 border border-white/5 hover:border-white/15 rounded-xl cursor-pointer text-center font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              💬 WhatsApp
            </button>
            <button
              onClick={handleTelegram}
              className="py-3 bg-neutral-900 border border-white/5 hover:border-white/15 rounded-xl cursor-pointer text-center font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              ✈️ Telegram
            </button>
            <button
              onClick={handleLinkedIn}
              className="py-3 bg-neutral-900 border border-white/5 hover:border-white/15 rounded-xl cursor-pointer text-center font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              💼 LinkedIn
            </button>
            <button
              onClick={handleEmail}
              className="py-3 bg-neutral-900 border border-white/5 hover:border-white/15 rounded-xl cursor-pointer text-center font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              ✉️ Email
            </button>
          </div>

          {/* Open Graph Card Link Preview */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest block">Open Graph Link Preview</span>
            <div className="glass-panel rounded-2xl border border-white/8 overflow-hidden">
              {/* Fake preview cover */}
              <div className="h-32 bg-gradient-to-r from-neutral-900 to-neutral-950 flex items-center justify-center border-b border-white/5 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_0%,transparent_100%)]" />
                <span className="text-[14px] tracking-[0.3em] font-light text-white uppercase z-10">Alumni Hub</span>
              </div>
              <div className="p-4 space-y-1 bg-neutral-950 text-left">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">alumnihub.vasavi.edu</span>
                <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider">Vasavi Classmates Portal</h4>
                <p className="text-[12px] text-neutral-450 font-light line-clamp-2 mt-1">
                  Reconnect with your academic community, share photo & video memories, build networking connections, and discover mentoring opportunities.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
