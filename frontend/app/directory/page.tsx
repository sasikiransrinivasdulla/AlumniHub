"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getAlumniDirectory, searchAlumniDirectory } from "@/services/alumniService";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";

export default function Directory() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [alumniList, setAlumniList] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [directoryLoading, setDirectoryLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const profile = await getUserProfile();
        if (!profile.profileCompleted) {
          router.push("/profile/setup");
          return;
        }
        setCurrentUser(profile);
        
        // Fetch visible alumni directory list
        try {
          const list = await getAlumniDirectory();
          setAlumniList(list);
        } catch (dirErr) {
          console.error("Failed to load directory:", dirErr);
        } finally {
          setDirectoryLoading(false);
        }
      } catch (err) {
        console.error(err);
        clearAuth();
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setDirectoryLoading(true);
    try {
      if (val.trim() === "") {
        const list = await getAlumniDirectory();
        setAlumniList(list);
      } else {
        const list = await searchAlumniDirectory(val);
        setAlumniList(list);
      }
    } catch (err) {
      console.error("Failed to search:", err);
    } finally {
      setDirectoryLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[17px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse">Loading Directory...</p>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      {/* Fixed Left Sidebar */}
      <Sidebar user={currentUser} />

      {/* Main Directory Container */}
      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="z-10 w-full max-w-4xl mx-auto px-6 md:px-12 py-10 md:py-16 flex flex-col space-y-10">
          
          {/* Header block with search bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-8 gap-6">
            <div>
              <h1 className="text-[32px] font-light tracking-widest uppercase leading-tight">Classmates</h1>
              <p className="text-[15px] tracking-wider text-neutral-400 mt-2 uppercase">
                Academic Community Directory
              </p>
            </div>
            <div className="w-full md:w-96 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search classmates by name or position..."
                className="w-full glass-input focus:outline-none text-[16px] p-4 rounded-xl"
              />
            </div>
          </div>

          {/* Directory Listings Grid */}
          {directoryLoading ? (
            <div className="flex items-center justify-center p-16 glass-panel rounded-[24px]">
              <span className="text-[15px] text-neutral-400 tracking-widest uppercase animate-pulse">Loading Classmates...</span>
            </div>
          ) : alumniList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 glass-panel text-center rounded-[24px]">
              <span className="text-[17px] font-light text-neutral-300">No classmates found matching search.</span>
            </div>
          ) : (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {alumniList.map((alumni) => (
                <motion.div
                  key={alumni.id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  onClick={() => router.push(`/alumni/${alumni.id}`)}
                  className="glass-panel rounded-[24px] p-6 flex flex-col items-center text-center cursor-pointer hover:border-white/20 transition-all duration-300 group relative overflow-hidden"
                >
                  {/* Subtle hover overlay */}
                  <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Avatar */}
                  <div className="relative w-22 h-22 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center mb-5">
                    {alumni.profilePicture ? (
                      <Image
                        src={alumni.profilePicture}
                        alt={alumni.fullName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <span className="text-3xl font-light text-neutral-400">
                        {alumni.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Classmate Info */}
                  <h3 className="text-[20px] font-semibold text-white tracking-wide uppercase truncate max-w-full leading-snug">
                    {alumni.fullName}
                  </h3>
                  
                  <span className="text-[17px] text-neutral-400 mt-2 min-h-[22px] truncate max-w-full font-light">
                    {alumni.currentPosition || "Alumni Member"}
                  </span>

                  <div className="w-full border-t border-white/5 my-4 pt-4 flex flex-col gap-2 text-[15px] text-neutral-400 font-light">
                    <div>
                      <span>Batch:</span> <span className="text-white font-medium">{alumni.batch}</span>
                    </div>
                    <div>
                      <span>Branch:</span> <span className="text-white font-medium">{alumni.department}</span>
                    </div>
                    {alumni.section && (
                      <div>
                        <span>Section:</span> <span className="text-white font-medium">{alumni.section}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

        </div>
      </main>

    </div>
  );
}
