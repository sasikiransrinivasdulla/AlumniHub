"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getAlumniDirectory, searchAlumniDirectoryWithFilters, AlumniFilters } from "@/services/alumniService";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { requestCache } from "@/services/cacheService";

const BATCH_OPTIONS = Array.from({ length: 24 }, (_, i) => `${2000 + i}-${2004 + i}`);
const DEPARTMENT_OPTIONS = ["CST", "CSE", "ECE", "ECT", "AIML", "CAI", "EEE", "MECH", "CIVIL"];
const SECTION_OPTIONS = ["A", "B", "C", "D"];

export default function Directory() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [alumniList, setAlumniList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);

  const [filters, setFilters] = useState<AlumniFilters>({
    q: "",
    company: "",
    position: "",
    batch: "",
    department: "",
    section: "",
    city: "",
    skills: ""
  });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadDirectoryData = async (currentFilters: AlumniFilters) => {
    setDirectoryLoading(true);
    try {
      const activeFilterKeys = Object.values(currentFilters).filter(Boolean);
      const cacheKey = `dir_search_filters_${JSON.stringify(currentFilters)}`;

      if (activeFilterKeys.length === 0) {
        // Simple un-filtered directory listing
        const cached = requestCache.get("dir_search_");
        if (cached) {
          setAlumniList(cached);
          setDirectoryLoading(false);
          // background sync
          const list = await getAlumniDirectory();
          setAlumniList(list);
          requestCache.set("dir_search_", list, 20000);
          return;
        }
      }

      const cachedResult = requestCache.get(cacheKey);
      if (cachedResult) {
        setAlumniList(cachedResult);
        setDirectoryLoading(false);
        return;
      }

      const list = await searchAlumniDirectoryWithFilters(currentFilters);
      setAlumniList(list);
      requestCache.set(cacheKey, list, 20000);
    } catch (err) {
      console.error("Failed to query directory:", err);
    } finally {
      setDirectoryLoading(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const profile = await getUserProfile();
        if (!profile.profileCompleted) {
          router.push("/profile/setup");
          return;
        }
        setCurrentUser(profile);
        await loadDirectoryData(filters);
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
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [router]);

  const triggerDebouncedSearch = (updatedFilters: AlumniFilters) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadDirectoryData(updatedFilters);
    }, 300);
  };

  const handleFilterChange = (key: keyof AlumniFilters, value: string) => {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    triggerDebouncedSearch(nextFilters);
  };

  const handleClearFilters = () => {
    const reset: AlumniFilters = {
      q: "",
      company: "",
      position: "",
      batch: "",
      department: "",
      section: "",
      city: "",
      skills: ""
    };
    setFilters(reset);
    loadDirectoryData(reset);
  };

  const removeFilterKey = (key: keyof AlumniFilters) => {
    handleFilterChange(key, "");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[15px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse">Loading Directory...</p>
      </main>
    );
  }

  if (!currentUser) return null;

  const activeChips = Object.entries(filters).filter(([key, val]) => val && key !== "q");

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden select-none">
      <Sidebar user={currentUser} />

      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_100%)] pointer-events-none" />

        <div className="z-10 w-full max-w-3xl mx-auto px-6 md:px-12 py-10 md:py-16 flex flex-col space-y-6">
          
          {/* Header block with search bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-6 gap-4">
            <div>
              <h1 className="text-[22px] md:text-[24px] font-light tracking-[0.18em] uppercase leading-tight">Classmates</h1>
              <p className="text-[12px] tracking-wider text-neutral-450 mt-1 uppercase">
                Academic Community Discovery
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={filters.q}
                  onChange={(e) => handleFilterChange("q", e.target.value)}
                  placeholder="Search by name..."
                  className="w-full glass-input focus:outline-none text-[13px] px-4 py-2 rounded-full"
                />
              </div>
              <button
                onClick={() => setShowDrawer(true)}
                className="py-2 px-4 border border-white/10 text-neutral-300 text-[12px] uppercase font-semibold tracking-wider hover:bg-white/5 hover:text-white transition-all duration-300 rounded-full cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters {activeChips.length > 0 && `(${activeChips.length})`}
              </button>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold mr-1">Active:</span>
              {activeChips.map(([key, val]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] text-neutral-300 uppercase tracking-wider font-light"
                >
                  <span className="text-neutral-500 font-semibold">{key}:</span> {val}
                  <button
                    onClick={() => removeFilterKey(key as keyof AlumniFilters)}
                    className="hover:text-white transition-colors cursor-pointer ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={handleClearFilters}
                className="text-[11px] text-white hover:underline uppercase tracking-wider cursor-pointer font-semibold ml-2"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Directory Listings Grid */}
          {directoryLoading ? (
            <div className="flex items-center justify-center p-16 glass-panel rounded-[20px] border border-white/8">
              <span className="text-[13px] text-neutral-400 tracking-widest uppercase animate-pulse">Loading Classmates...</span>
            </div>
          ) : alumniList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 glass-panel text-center rounded-[20px] border border-white/8">
              <span className="text-[14px] font-light text-neutral-450 uppercase tracking-widest">No classmates found matching search.</span>
            </div>
          ) : (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.04 }
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
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
                  <div className="absolute inset-0 bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Relationship Badges */}
                  {alumni.inTouchStatus === "ACCEPTED" && (
                    <span className="absolute top-3 right-3 text-[10px] bg-white/10 text-white font-medium px-2 py-0.5 border border-white/10 rounded-full tracking-wider select-none uppercase">
                      ✓ In-Touch
                    </span>
                  )}
                  {alumni.inTouchStatus === "PENDING_SENT" && (
                    <span className="absolute top-3 right-3 text-[10px] bg-white/5 text-neutral-400 font-light px-2 py-0.5 border border-white/5 rounded-full tracking-wider select-none uppercase">
                      Requested
                    </span>
                  )}
                  {alumni.inTouchStatus === "PENDING_RECEIVED" && (
                    <span className="absolute top-3 right-3 text-[10px] bg-white text-black font-semibold px-2 py-0.5 rounded-full tracking-wider select-none uppercase animate-pulse">
                      Pending
                    </span>
                  )}

                  {/* Avatar */}
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center mb-4">
                    {alumni.profilePicture ? (
                      <Image
                        src={alumni.profilePicture}
                        alt={alumni.fullName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-[18px] font-light text-neutral-400">
                        {alumni.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Classmate Info */}
                  <h3 className="text-[14px] font-semibold text-white tracking-wide uppercase truncate max-w-full leading-snug">
                    {alumni.fullName}
                  </h3>
                  
                  <span className="text-[12px] text-neutral-450 mt-1 truncate max-w-full font-light">
                    {alumni.currentPosition || "Alumni Member"}
                  </span>

                  {alumni.currentCompany && (
                    <span className="text-[11px] text-neutral-500 font-light truncate max-w-full">
                      at {alumni.currentCompany}
                    </span>
                  )}

                  <div className="w-full border-t border-white/5 mt-4 pt-3 flex flex-col gap-1.5 text-[11px] text-neutral-455 font-light">
                    <div className="flex justify-between px-1">
                      <span>Batch</span> <span className="text-white font-medium">{alumni.batch}</span>
                    </div>
                    <div className="flex justify-between px-1">
                      <span>Branch</span> <span className="text-white font-medium">{alumni.department}</span>
                    </div>
                    {alumni.currentCity && (
                      <div className="flex justify-between px-1">
                        <span>Location</span> <span className="text-white font-medium truncate max-w-[80px]">{alumni.currentCity}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

        </div>
      </main>

      {/* Slide-out Filters Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-[26px]"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-xs bg-neutral-950 border-l border-white/8 p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h2 className="text-[15px] font-semibold uppercase tracking-widest text-white">Search Filters</h2>
                  <button
                    onClick={() => setShowDrawer(false)}
                    className="text-neutral-400 hover:text-white text-[18px] cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                {/* Filter Controls Form */}
                <div className="space-y-4 text-[12px]">
                  
                  {/* Company */}
                  <div className="space-y-1.5">
                    <label className="text-neutral-450 uppercase tracking-wider block">Current Company</label>
                    <input
                      type="text"
                      value={filters.company}
                      onChange={(e) => handleFilterChange("company", e.target.value)}
                      placeholder="e.g. Google"
                      className="w-full glass-input focus:outline-none px-3.5 py-2.5 rounded-full"
                    />
                  </div>

                  {/* Position */}
                  <div className="space-y-1.5">
                    <label className="text-neutral-450 uppercase tracking-wider block">Position</label>
                    <input
                      type="text"
                      value={filters.position}
                      onChange={(e) => handleFilterChange("position", e.target.value)}
                      placeholder="e.g. Software Engineer"
                      className="w-full glass-input focus:outline-none px-3.5 py-2.5 rounded-full"
                    />
                  </div>

                  {/* Batch dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-neutral-450 uppercase tracking-wider block">Batch</label>
                    <select
                      value={filters.batch}
                      onChange={(e) => handleFilterChange("batch", e.target.value)}
                      className="w-full glass-input focus:outline-none px-3.5 py-2.5 rounded-full cursor-pointer"
                    >
                      <option value="" className="bg-neutral-950">All Batches</option>
                      {BATCH_OPTIONS.map((range) => (
                        <option key={range} value={range} className="bg-neutral-950">{range}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-neutral-450 uppercase tracking-wider block">Department</label>
                    <select
                      value={filters.department}
                      onChange={(e) => handleFilterChange("department", e.target.value)}
                      className="w-full glass-input focus:outline-none px-3.5 py-2.5 rounded-full cursor-pointer"
                    >
                      <option value="" className="bg-neutral-950">All Branches</option>
                      {DEPARTMENT_OPTIONS.map((dept) => (
                        <option key={dept} value={dept} className="bg-neutral-950">{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Section dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-neutral-450 uppercase tracking-wider block">Section</label>
                    <select
                      value={filters.section}
                      onChange={(e) => handleFilterChange("section", e.target.value)}
                      className="w-full glass-input focus:outline-none px-3.5 py-2.5 rounded-full cursor-pointer"
                    >
                      <option value="" className="bg-neutral-950">All Sections</option>
                      {SECTION_OPTIONS.map((sec) => (
                        <option key={sec} value={sec} className="bg-neutral-950">Section {sec}</option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <label className="text-neutral-450 uppercase tracking-wider block">Current City</label>
                    <input
                      type="text"
                      value={filters.city}
                      onChange={(e) => handleFilterChange("city", e.target.value)}
                      placeholder="e.g. Bangalore"
                      className="w-full glass-input focus:outline-none px-3.5 py-2.5 rounded-full"
                    />
                  </div>

                  {/* Skills */}
                  <div className="space-y-1.5">
                    <label className="text-neutral-450 uppercase tracking-wider block">Skills (comma-separated)</label>
                    <input
                      type="text"
                      value={filters.skills}
                      onChange={(e) => handleFilterChange("skills", e.target.value)}
                      placeholder="e.g. React, Spring"
                      className="w-full glass-input focus:outline-none px-3.5 py-2.5 rounded-full"
                    />
                  </div>

                </div>
              </div>

              {/* Bottom Drawer Actions */}
              <div className="border-t border-white/5 pt-4 flex gap-3 mt-6">
                <button
                  onClick={handleClearFilters}
                  className="flex-1 py-2.5 border border-white/10 text-white text-[11px] font-semibold tracking-wider uppercase rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="flex-1 py-2.5 bg-white text-black text-[11px] font-bold tracking-wider uppercase rounded-full hover:bg-neutral-200 transition-colors cursor-pointer text-center"
                >
                  Show Results
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
