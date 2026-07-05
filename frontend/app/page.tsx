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
      // 1. Firebase Authentication popup
      const result = await signInWithPopup(auth, googleProvider);
      
      // 2. Retrieve Firebase ID Token
      const idToken = await result.user.getIdToken(true);
      
      // 3. Send token to Spring Boot backend
      const authData = await loginWithFirebaseToken(idToken);
      
      // 4. Store session details
      setAuthToken(authData.token);
      setAuthUser(authData.user);
      
      // 5. Redirect to setup or dashboard based on onboarding status
      if (authData.authStatus === "PENDING_ONBOARDING" || !authData.user.profileCompleted) {
        router.push("/profile/setup");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Login flow failed:", err);
      // Capture authentication errors and display in a user friendly format
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-6 relative overflow-hidden select-none">
      
      {/* Radial glow background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)] pointer-events-none" />

      {/* Main Content glass container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 flex flex-col items-center text-center p-10 md:p-14 glass-panel rounded-[24px] max-w-lg w-full space-y-8"
      >
        
        {/* Branding Logo */}
        <div className="relative w-20 h-20">
          <Image
            src="/AHlogo.png"
            alt="Alumni Hub Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Branding Title */}
        <div className="space-y-2 text-center">
          <h1 className="text-[30px] font-extralight tracking-[0.3em] uppercase bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 leading-tight">
            ALUMNI HUB
          </h1>
          <p className="text-neutral-455 text-[12px] tracking-[0.25em] uppercase font-light">
            Reconnect • Remember • Relive
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex flex-col items-center space-y-4 w-full">
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full py-3.5 bg-white text-black hover:bg-neutral-200 text-[13px] font-semibold tracking-[0.18em] uppercase transition-all duration-300 cursor-pointer disabled:opacity-50 rounded-full shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
          >
            {loading ? "Authenticating..." : "Continue with Google"}
          </motion.button>
          
          {error && (
            <p className="text-[15px] text-red-500 tracking-[0.05em] font-light uppercase max-w-xs leading-relaxed pt-2">
              {error}
            </p>
          )}
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-0 right-0 text-center z-10">
        <span className="text-[15px] text-neutral-600 tracking-[0.3em] uppercase font-light">
          Alumni Hub &copy; {new Date().getFullYear()}
        </span>
      </div>
    </main>
  );
}
