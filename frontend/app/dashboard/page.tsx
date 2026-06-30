"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser, clearAuth, getAuthToken, UserProfile } from "@/services/authService";
import Image from "next/image";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    const cachedUser = getAuthUser();
    
    if (!token || !cachedUser) {
      clearAuth();
      router.push("/");
    } else {
      setUser(cachedUser);
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-xs tracking-[0.2em] uppercase text-neutral-500">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-6 relative overflow-hidden select-none">
      {/* Radial glow background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)] pointer-events-none" />

      {/* Main Card Container */}
      <div className="z-10 flex flex-col items-center text-center space-y-8 max-w-sm w-full bg-neutral-950 p-10 border border-neutral-900 shadow-2xl">
        
        {/* Profile Picture */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden border border-neutral-800 bg-neutral-900 flex items-center justify-center">
          {user.profilePicture ? (
            <Image
              src={user.profilePicture}
              alt={user.fullName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="text-2xl font-light text-neutral-600">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* User Details */}
        <div className="space-y-2">
          <h2 className="text-xl font-light tracking-[0.1em] text-white">
            {user.fullName}
          </h2>
          <p className="text-xs tracking-[0.1em] text-neutral-500 font-light">
            {user.email}
          </p>
        </div>

        {/* Logout Button */}
        <div className="pt-4 w-full">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 bg-transparent text-white text-xs font-semibold tracking-[0.2em] uppercase rounded-none border border-neutral-800 hover:border-white hover:bg-white hover:text-black transition-all duration-300 ease-out cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
