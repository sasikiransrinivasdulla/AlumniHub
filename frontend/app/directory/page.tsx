"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { getAlumniDirectory, searchAlumniDirectoryWithFilters, AlumniFilters } from "@/services/alumniService";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { requestCache } from "@/services/cacheService";

const BATCH_OPTIONS = [
  "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028"
];
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
    skills: "",
    openTo: "",
    badge: ""
  });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadDirectoryData = async (currentFilters: AlumniFilters) => {
    setDirectoryLoading(true);
    try {
      const activeFilterKeys = Object.values(currentFilters).filter(Boolean);
      const cacheKey = `dir_search_filters_${JSON.stringify(currentFilters)}`;

      if (activeFilterKeys.length === 0) {
        const cached = requestCache.get("dir_search_");
        if (cached) {
          setAlumniList(cached);
          setDirectoryLoading(false);
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

  const handleFilterChange = (key: keyof AlumniFilters, val: string) => {
    const updated = { ...filters, [key]: val };
    setFilters(updated);
    triggerDebouncedSearch(updated);
  };

  const handleClearFilters = () => {
    const cleared: AlumniFilters = {
      q: "",
      company: "",
      position: "",
      batch: "",
      department: "",
      section: "",
      city: "",
      skills: "",
      openTo: "",
      badge: ""
    };
    setFilters(cleared);
    loadDirectoryData(cleared);
  };

  const handleRemoveChip = (key: keyof AlumniFilters) => {
    const updated = { ...filters, [key]: "" };
    setFilters(updated);
    loadDirectoryData(updated);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[15px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse font-light">Loading Classmate directory...</p>
      </main>
    );
  }

  if (!currentUser) return null;

  const activeChips = Object.entries(filters).filter(([key, val]) => val && key !== "q");

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      <Sidebar user={currentUser} />

      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_100%)] pointer-events-none" />

        <div className="z-10 w-full max-w-3xl mx-auto px-6 md:px-12 py-10 md:py-16 flex flex-col space-y-6">
          
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h1 className="text-[20px] md:text-[22px] font-light tracking-[0.15em] uppercase text-white leading-tight">Alumni Directory</h1>
              <p className="text-[12px] tracking-wider text-neutral-450 mt-1.5 uppercase">Discover & Connect with Classmates</p>
            </div>
            <button
              onClick={() => setShowDrawer(true)}
              className="py-2.5 px-5 bg-white text-black hover:bg-neutral-200 text-[11px] font-bold tracking-widest uppercase transition-colors rounded-full cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters {activeChips.length > 0 && `(${activeChips.length})`}
            </button>
          </div>

          {/* Search Inputs Header Row */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search classmates by name..."
                value={filters.q}
                onChange={(e) => handleFilterChange("q", e.target.value)}
                className="w-full glass-input text-[14px] px-5 py-3.5 focus:outline-none rounded-full"
              />
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest mr-1 font-bold">Active:</span>
              {activeChips.map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase font-semibold text-neutral-350"
                >
                  <span>{key === "badge" ? "Badge" : key === "openTo" ? "Open To" : key}: {val}</span>
                  <button
                    onClick={() => handleRemoveChip(key as keyof AlumniFilters)}
                    className="text-neutral-450 hover:text-white font-bold cursor-pointer text-[12px]"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={handleClearFilters}
                className="text-[10px] text-neutral-450 hover:text-white uppercase tracking-wider font-bold underline cursor-pointer ml-1"
              >
                Clear
              </button>
            </div>
          )}

          {/* Directory Listings */}
          {directoryLoading ? (
            <div className="flex items-center justify-center p-16 glass-panel rounded-[20px] border border-white/8">
              <span className="text-[13px] text-neutral-400 tracking-widest uppercase animate-pulse font-light">Searching Directory...</span>
            </div>
          ) : alumniList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 glass-panel text-center space-y-3 rounded-[20px] border border-white/8">
              <span className="text-[14px] font-light text-neutral-455 uppercase tracking-widest">No classmates matched your search criteria.</span>
              <button
                onClick={handleClearFilters}
                className="text-[11px] text-white hover:underline uppercase tracking-wider font-semibold cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {alumniList.map((alumni) => (
                <div
                  key={alumni.id}
                  onClick={() => router.push(`/alumni/${alumni.id}`)}
                  className="glass-panel p-5 rounded-[20px] border border-white/8 hover:border-white/15 transition-all duration-300 cursor-pointer flex items-start gap-4 relative group"
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center flex-shrink-0">
                    {alumni.profilePicture ? (
                      <Image
                        src={alumni.profilePicture}
                        alt={alumni.fullName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-[16px] font-light text-neutral-450 uppercase">{alumni.fullName.charAt(0)}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-12">
                    <h3 className="text-[14px] font-semibold text-white uppercase tracking-wider truncate mb-1">
                      {alumni.fullName}
                    </h3>
                    
                    <p className="text-[12px] text-neutral-450 truncate font-light mb-0.5">
                      {alumni.currentPosition || "Alumni Member"} {alumni.currentCompany && `at ${alumni.currentCompany}`}
                    </p>

                    <p className="text-[11px] text-neutral-500 font-light uppercase tracking-wider mt-1.5">
                      Class of {alumni.batch} • {alumni.department} {alumni.section ? `Sec ${alumni.section}` : ""}
                    </p>

                    {/* Rendering user badges */}
                    {alumni.badges && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {alumni.badges.split(",").map(b => b.trim()).filter(Boolean).map((badge, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 border border-amber-500/20 bg-amber-500/[0.02] text-amber-400 rounded-full text-[9px] uppercase tracking-wider font-bold"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="absolute right-5 top-5 text-[10px] uppercase font-bold tracking-widest text-neutral-500 group-hover:text-white transition-colors">
                    {alumni.inTouchStatus === "ACCEPTED" ? "✓ In-Touch" : alumni.inTouchStatus === "PENDING_SENT" ? "Requested" : "View"}
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* Filter Sidebar Drawer */}
          <AnimatePresence>
            {showDrawer && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDrawer(false)}
                  className="fixed inset-0 z-40 bg-black/80 backdrop-blur-[26px]"
                />

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

                      {/* Open To Filter */}
                      <div className="space-y-1.5">
                        <label className="text-neutral-450 uppercase tracking-wider block">Open To Preference</label>
                        <select
                          value={filters.openTo}
                          onChange={(e) => handleFilterChange("openTo", e.target.value)}
                          className="w-full glass-input focus:outline-none px-3.5 py-2.5 rounded-full cursor-pointer"
                        >
                          <option value="" className="bg-neutral-950">All Preferences</option>
                          {["Mentoring", "Hiring", "Career Guidance"].map((o) => (
                            <option key={o} value={o} className="bg-neutral-950">{o}</option>
                          ))}
                        </select>
                      </div>

                      {/* Badge Filter */}
                      <div className="space-y-1.5">
                        <label className="text-neutral-450 uppercase tracking-wider block">Custom Profile Badge</label>
                        <select
                          value={filters.badge}
                          onChange={(e) => handleFilterChange("badge", e.target.value)}
                          className="w-full glass-input focus:outline-none px-3.5 py-2.5 rounded-full cursor-pointer"
                        >
                          <option value="" className="bg-neutral-950">All Badges</option>
                          {["Mentor", "Entrepreneur", "Hiring", "Reunion Organizer"].map((b) => (
                            <option key={b} value={b} className="bg-neutral-950">{b}</option>
                          ))}
                        </select>
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
      </main>
    </div>
  );
}
