"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { loginWithFirebaseToken, setAuthToken, setAuthUser } from "@/services/authService";

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
      
      // 5. Redirect to Dashboard
      router.push("/dashboard");
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)] pointer-events-none" />

      {/* Main Content Container */}
      <div className="z-10 flex flex-col items-center text-center space-y-8 max-w-lg">
        {/* Subtle top border divider */}
        <div className="w-12 h-[1px] bg-neutral-800" />

        {/* Branding */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-light tracking-[0.25em] uppercase text-white">
            Alumni Hub
          </h1>
          <p className="text-neutral-500 text-xs md:text-sm font-medium tracking-[0.3em] uppercase">
            Reconnect. Remember. Relive.
          </p>
        </div>

        {/* Subtle middle divider */}
        <div className="w-12 h-[1px] bg-neutral-800" />

        {/* Actions */}
        <div className="pt-4 flex flex-col items-center space-y-4">
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="px-8 py-3 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase rounded-none border border-white hover:bg-black hover:text-white transition-all duration-500 ease-out cursor-pointer disabled:bg-neutral-800 disabled:text-neutral-500 disabled:border-neutral-800 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-none"
          >
            {loading ? "Authenticating..." : "Continue with Google"}
          </button>
          
          {error && (
            <p className="text-xs text-red-500 tracking-[0.1em] font-light uppercase max-w-xs leading-5">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-0 right-0 text-center z-10">
        <span className="text-[10px] text-neutral-600 tracking-[0.4em] uppercase font-light">
          Alumni Hub &copy; {new Date().getFullYear()}
        </span>
      </div>
    </main>
  );
}
