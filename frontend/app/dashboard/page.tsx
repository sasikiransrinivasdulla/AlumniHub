"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import Image from "next/image";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getUserProfile();
        if (!profile.profileCompleted) {
          router.push("/profile/setup");
        } else {
          setUser(profile);
        }
      } catch (err: any) {
        console.error(err);
        clearAuth();
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 animate-pulse">Loading Profile...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-6 py-12 relative overflow-hidden select-none">
      {/* Radial glow background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_100%)] pointer-events-none" />

      {/* Main Profile Card Container */}
      <div className="z-10 flex flex-col w-full max-w-2xl bg-neutral-950 p-8 md:p-12 border border-neutral-900 shadow-2xl space-y-8">
        
        {/* Header Block: Avatar & General info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-neutral-900">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border border-neutral-800 bg-neutral-900 flex items-center justify-center flex-shrink-0">
            {user.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt={user.fullName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="text-3xl font-light text-neutral-600">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-light tracking-wide text-white uppercase">{user.fullName}</h1>
            <p className="text-xs tracking-wider text-neutral-500">{user.email}</p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 text-[10px] tracking-widest uppercase font-semibold bg-neutral-900 border border-neutral-800 text-neutral-400">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Academic Details Block */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1 p-4 bg-neutral-900/40 border border-neutral-900/80">
            <span className="text-[10px] tracking-widest uppercase text-neutral-500 block">Batch</span>
            <span className="text-sm font-light text-white tracking-wide">
              {user.batch ? `Class of ${user.batch}` : "Not Specified"}
            </span>
          </div>
          <div className="space-y-1 p-4 bg-neutral-900/40 border border-neutral-900/80">
            <span className="text-[10px] tracking-widest uppercase text-neutral-500 block">Department</span>
            <span className="text-sm font-light text-white tracking-wide">
              {user.department || "Not Specified"}
            </span>
          </div>
          <div className="space-y-1 p-4 bg-neutral-900/40 border border-neutral-900/80">
            <span className="text-[10px] tracking-widest uppercase text-neutral-500 block">Section</span>
            <span className="text-sm font-light text-white tracking-wide">
              {user.section ? `Section ${user.section}` : "Not Specified"}
            </span>
          </div>
        </div>

        {/* Professional & Contact Details Block */}
        <div className="space-y-6 pt-4">
          <div className="space-y-1">
            <span className="text-[10px] tracking-widest uppercase text-neutral-500 block">Current Position</span>
            <p className="text-sm font-light text-neutral-200 tracking-wide">
              {user.currentPosition || "Not Specified"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] tracking-widest uppercase text-neutral-500 block">Bio</span>
            <p className="text-sm font-light text-neutral-300 leading-relaxed tracking-wide whitespace-pre-wrap">
              {user.bio || "No bio added yet."}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] tracking-widest uppercase text-neutral-500 block">Phone Number</span>
            <p className="text-sm font-light text-neutral-200 tracking-wide">
              {user.phoneNumber || "Not Specified"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1">
              <span className="text-[10px] tracking-widest uppercase text-neutral-500 block">LinkedIn</span>
              {user.linkedinUrl ? (
                <a
                  href={user.linkedinUrl.startsWith("http") ? user.linkedinUrl : `https://${user.linkedinUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-light text-neutral-300 hover:text-white underline tracking-wide block truncate transition-colors duration-200"
                >
                  {user.linkedinUrl}
                </a>
              ) : (
                <span className="text-sm font-light text-neutral-600 tracking-wide block">Not Connected</span>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-[10px] tracking-widest uppercase text-neutral-500 block">GitHub</span>
              {user.githubUrl ? (
                <a
                  href={user.githubUrl.startsWith("http") ? user.githubUrl : `https://${user.githubUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-light text-neutral-300 hover:text-white underline tracking-wide block truncate transition-colors duration-200"
                >
                  {user.githubUrl}
                </a>
              ) : (
                <span className="text-sm font-light text-neutral-600 tracking-wide block">Not Connected</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-neutral-900 w-full">
          <Link
            href="/dashboard/edit"
            className="flex-1 py-3 text-center bg-white text-black text-xs font-semibold tracking-widest uppercase hover:bg-neutral-200 transition-all duration-300 ease-out"
          >
            Edit Profile
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex-1 py-3 bg-transparent text-white text-xs font-semibold tracking-widest uppercase border border-neutral-800 hover:border-white transition-all duration-300 ease-out cursor-pointer"
          >
            Logout
          </button>
        </div>

      </div>
    </main>
  );
}
