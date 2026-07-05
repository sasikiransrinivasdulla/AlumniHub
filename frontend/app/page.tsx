"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { loginWithFirebaseToken, setAuthToken, setAuthUser } from "@/services/authService";
import { motion } from "framer-motion";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken(true);
      const authData = await loginWithFirebaseToken(idToken);
      
      setAuthToken(authData.token);
      setAuthUser(authData.user);
      
      if (authData.authStatus === "PENDING_ONBOARDING" || !authData.user.profileCompleted) {
        router.push("/profile/setup");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Login flow failed:", err);
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      title: "Smart Discovery",
      desc: "Connect with classmates filtering by company, batch, position, city, or skills.",
      icon: "🔍"
    },
    {
      title: "Video Memories",
      desc: "Share high-resolution college memory pictures and video files up to 30MB.",
      icon: "🎥"
    },
    {
      title: "Granular Privacy",
      desc: "Control who sees your milestones, timeline, bio, and contact information.",
      icon: "🔒"
    },
    {
      title: "Instant Alerts",
      desc: "Real-time WebSocket alerts and native browser notifications for inbox updates.",
      icon: "🔔"
    }
  ];

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white px-6 py-12 md:py-24 relative overflow-hidden select-none">
      
      {/* Radial glow background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_0%,transparent_80%)] pointer-events-none" />

      <div className="z-10 max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Side: Hero Text & Features grid */}
        <div className="lg:col-span-7 space-y-8 text-left">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <Image
                  src="/AHlogo.png"
                  alt="Alumni Hub Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-[14px] font-bold tracking-[0.25em] text-neutral-450 uppercase">VASAVI CSE PORTAL</span>
            </div>
            
            <h1 className="text-[32px] md:text-[42px] font-extralight tracking-tight text-white leading-tight uppercase">
              RECONNECT WITH YOUR <br />
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/60">ACADEMIC COMMUNITY</span>
            </h1>
            
            <p className="text-[14px] font-light text-neutral-400 max-w-lg leading-relaxed">
              Alumni Hub is an enterprise-grade open source networking platform designed for Vasavi CSE graduates to share memories, stay In-Touch, and grow together.
            </p>
          </div>

          {/* Features cards list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="glass-panel p-5 border border-white/5 rounded-2xl space-y-2 hover:border-white/10 transition-colors"
              >
                <div className="text-[20px]">{feat.icon}</div>
                <h3 className="text-[13px] font-semibold text-white uppercase tracking-wider">{feat.title}</h3>
                <p className="text-[12px] text-neutral-450 font-light leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>

        </div>

        {/* Right Side: Google Login Panel */}
        <div className="lg:col-span-5 flex justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center p-8 md:p-10 glass-panel rounded-[24px] w-full max-w-md border border-white/8 space-y-6 shadow-2xl relative"
          >
            <div className="relative w-16 h-16">
              <Image
                src="/AHlogo.png"
                alt="Alumni Hub Logo"
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-[18px] font-light tracking-[0.2em] uppercase text-white leading-tight">
                ALUMNI HUB
              </h2>
              <p className="text-neutral-455 text-[10px] tracking-[0.2em] uppercase font-light">
                Secure Authentication Gateway
              </p>
            </div>

            <div className="w-full pt-4 space-y-4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full py-3.5 bg-white text-black hover:bg-neutral-200 text-[12px] font-bold tracking-[0.15em] uppercase transition-colors cursor-pointer disabled:opacity-50 rounded-full"
              >
                {loading ? "Authenticating..." : "Continue with Google"}
              </motion.button>
              
              {error && (
                <p className="text-[12px] text-red-500 tracking-[0.05em] font-medium uppercase leading-relaxed max-w-xs mx-auto">
                  {error}
                </p>
              )}
            </div>

            <div className="border-t border-white/5 pt-4 w-full">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest leading-relaxed">
                Authorized access only. By continuing, you agree to our community standards.
              </p>
            </div>
          </motion.div>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <span className="text-[10px] text-neutral-600 tracking-[0.25em] uppercase font-light">
          Alumni Hub Open-Source &copy; {new Date().getFullYear()}
        </span>
      </div>
    </main>
  );
}
