"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getAlumniDirectory, searchAlumniDirectory } from "@/services/alumniService";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";

import { useRef } from "react";
import { requestCache } from "@/services/cacheService";

export default function Directory() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [alumniList, setAlumniList] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const profile = await getUserProfile();
        if (!profile.profileCompleted) {
          router.push("/profile/setup");
          return;
        }
        setCurrentUser(profile);
        
        // Fetch visible alumni directory list from cache first
        const cacheKey = "dir_search_";
        const cached = requestCache.get(cacheKey);
        if (cached) {
          setAlumniList(cached);
          setDirectoryLoading(false);
          
          // silent refresh
          getAlumniDirectory()
            .then((list) => {
              setAlumniList(list);
              requestCache.set(cacheKey, list, 30000);
            })
            .catch(console.error);
        } else {
          try {
            const list = await getAlumniDirectory();
            setAlumniList(list);
            requestCache.set(cacheKey, list, 30000);
          } catch (dirErr) {
            console.error("Failed to load directory:", dirErr);
          } finally {
            setDirectoryLoading(false);
          }
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

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [router]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setDirectoryLoading(true);
      try {
        const trimmed = val.trim();
        const cacheKey = `dir_search_${trimmed}`;
        const cached = requestCache.get(cacheKey);
        if (cached) {
          setAlumniList(cached);
          setDirectoryLoading(false);
          return;
        }

        let list: UserProfile[] = [];
        if (trimmed === "") {
          list = await getAlumniDirectory();
        } else {
          list = await searchAlumniDirectory(trimmed);
        }
        setAlumniList(list);
        requestCache.set(cacheKey, list, 30000);
      } catch (err) {
        console.error("Failed to search:", err);
      } finally {
        setDirectoryLoading(false);
      }
    }, 250);
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
        <div className="z-10 w-full max-w-3xl mx-auto px-6 md:px-12 py-10 md:py-16 flex flex-col space-y-8">
          
          {/* Header block with search bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-6 gap-6">
            <div>
              <h1 className="text-[26px] md:text-[28px] font-light tracking-[0.18em] uppercase leading-tight">Classmates</h1>
              <p className="text-[13px] tracking-wider text-neutral-400 mt-1.5 uppercase">
                Academic Community Directory
              </p>
            </div>
            <div className="w-full md:w-80 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search classmates by name..."
                className="w-full glass-input focus:outline-none text-[14px] px-4 py-2.5 rounded-full"
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
                  className="glass-panel rounded-[20px] p-5 flex flex-col items-center text-center cursor-pointer border border-white/8 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,255,255,0.02)] hover:border-white/15 group relative overflow-hidden"
                >
                  {/* Subtle hover overlay */}
                  <div className="absolute inset-0 bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Avatar */}
                  <div className="relative w-18 h-18 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center mb-4">
                    {alumni.profilePicture ? (
                      <Image
                        src={alumni.profilePicture}
                        alt={alumni.fullName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-2xl font-light text-neutral-400">
                        {alumni.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Classmate Info */}
                  <h3 className="text-[16px] font-semibold text-white tracking-wide uppercase truncate max-w-full leading-snug">
                    {alumni.fullName}
                  </h3>
                  
                  <span className="text-[13px] text-neutral-450 mt-1.5 min-h-[20px] truncate max-w-full font-light">
                    {alumni.currentPosition || "Alumni Member"}
                  </span>

                  <div className="w-full border-t border-white/5 my-3.5 pt-3.5 flex flex-col gap-1.5 text-[13px] text-neutral-455 font-light">
                    <div className="flex justify-between px-2">
                      <span>Batch</span> <span className="text-white font-medium">{alumni.batch}</span>
                    </div>
                    <div className="flex justify-between px-2">
                      <span>Branch</span> <span className="text-white font-medium">{alumni.department}</span>
                    </div>
                    {alumni.section && (
                      <div className="flex justify-between px-2">
                        <span>Section</span> <span className="text-white font-medium">{alumni.section}</span>
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
