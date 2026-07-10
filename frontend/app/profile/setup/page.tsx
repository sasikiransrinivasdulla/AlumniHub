"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, updateUserProfile, clearAuth, UserProfile } from "@/services/authService";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  BATCH_OPTIONS,
  DEPARTMENT_OPTIONS,
  SECTION_MAPPING,
  ADMISSION_BATCH_TOOLTIP,
} from "@/constants/profileConstants";


export default function ProfileSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read-only user data to display
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Editable fields
  const [batch, setBatch] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [skills, setSkills] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState("PUBLIC");
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  // Custom fields
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [selectedOpenTo, setSelectedOpenTo] = useState<string[]>([]);

  useEffect(() => {
    async function checkSetup() {
      try {
        const profile = await getUserProfile();
        if (profile.profileCompleted) {
          router.push("/dashboard");
          return;
        }
        setEmail(profile.email || "");
        setFullName(profile.fullName || "");
        setProfilePicture(profile.profilePicture || null);
        setBatch(profile.batch || "");
        setDepartment(profile.department || "");
        setSection(profile.section || "");
        setCurrentPosition(profile.currentPosition || "");
        setCurrentCompany(profile.currentCompany || "");
        setCurrentCity(profile.currentCity || "");
        setSkills(profile.skills || "");
        setGraduationYear(profile.graduationYear || "");
        setPrivacyLevel(profile.privacyLevel || "PUBLIC");
        setBio(profile.bio || "");
        setPhoneNumber(profile.phoneNumber || "");
        setLinkedinUrl(profile.linkedinUrl || "");
        setGithubUrl(profile.githubUrl || "");
        setInstagramUrl(profile.instagramUrl || "");

        setSelectedBadges(profile.badges ? profile.badges.split(",").map(s => s.trim()).filter(Boolean) : []);
        setSelectedOpenTo(profile.openTo ? profile.openTo.split(",").map(s => s.trim()).filter(Boolean) : []);
      } catch (err: any) {
        console.error(err);
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    checkSetup();
  }, [router]);

  const handleDepartmentChange = (dept: string) => {
    setDepartment(dept);
    const sections = SECTION_MAPPING[dept] || [];
    if (sections.length === 0) {
      setSection("");
    } else {
      setSection(sections[0] || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!batch) {
      setError("Please select your Batch.");
      return;
    }
    if (!department) {
      setError("Please select your Department.");
      return;
    }
    const sections = SECTION_MAPPING[department] || [];
    if (sections.length > 0 && !section) {
      setError("Please select your Section.");
      return;
    }
    if (bio.length > 250) {
      setError("Bio must not exceed 250 characters.");
      return;
    }
    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    const isSoftwareBranch = ["CSE", "CST", "AIML", "CAI"].includes(department);
    if (isSoftwareBranch && !githubUrl.trim()) {
      setError(`GitHub profile URL is required for software branch (${department}).`);
      return;
    }

    if (githubUrl && !/^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/.test(githubUrl.trim())) {
      setError("Please enter a valid GitHub profile URL.");
      return;
    }
    if (linkedinUrl && !/^(https?:\/\/)?([a-zA-Z0-9-]+\.)?linkedin\.com\/.*$/.test(linkedinUrl.trim())) {
      setError("Please enter a valid LinkedIn profile URL.");
      return;
    }
    if (instagramUrl && !/^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/.test(instagramUrl.trim())) {
      setError("Please enter a valid Instagram profile URL.");
      return;
    }

    setSubmitting(true);
    try {
      await updateUserProfile({
        batch,
        department,
        section: section || null,
        currentPosition: currentPosition.trim() || null,
        currentCompany: currentCompany.trim() || null,
        currentCity: currentCity.trim() || null,
        skills: skills.trim() || null,
        graduationYear: graduationYear.trim() || null,
        privacyLevel,
        bio: bio.trim() || null,
        phoneNumber: phoneNumber.trim(),
        linkedinUrl: linkedinUrl.trim() || null,
        githubUrl: githubUrl.trim() || null,
        instagramUrl: instagramUrl.trim() || null,
        badges: selectedBadges.join(","),
        openTo: selectedOpenTo.join(","),
      });
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to complete setup.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[15px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse font-light">Loading setup portal...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_100%)] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10 space-y-6">
        
        {/* Title */}
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Image
              src="/AHlogo.png"
              alt="Alumni Hub Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-[22px] md:text-[24px] font-light tracking-[0.2em] uppercase text-white leading-tight">Complete Setup</h2>
          <p className="text-[12px] tracking-wider text-neutral-450 mt-1.5 uppercase">Setup your Vasavi academic details</p>
        </div>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-900/50 text-red-500 text-[13px] tracking-wider rounded-2xl text-center">
            {error}
          </div>
        )}

        <div className="glass-panel py-8 px-6 sm:px-10 rounded-[24px] border border-white/8 shadow-2xl space-y-6">
          
          {/* Read-Only user preview row */}
          <div className="flex items-center gap-4 pb-4 border-b border-white/5">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center flex-shrink-0">
              {profilePicture ? (
                <Image
                  src={profilePicture}
                  alt={fullName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-[16px] font-light text-neutral-450 uppercase">{fullName.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[14px] font-semibold text-white uppercase tracking-wider block truncate">{fullName}</span>
              <span className="text-[11px] text-neutral-455 block truncate">{email}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-[12px]">
            
            {/* Privacy selection */}
            <div className="space-y-1">
              <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">Profile Privacy Level</label>
              <select
                value={privacyLevel}
                onChange={(e) => setPrivacyLevel(e.target.value)}
                className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full cursor-pointer"
              >
                <option value="PUBLIC" className="bg-neutral-950">🌍 Public (Visible to everyone)</option>
                <option value="ACADEMIC" className="bg-neutral-950">🎓 Academic Community (Visible only to batch/dept matches)</option>
                <option value="IN_TOUCH_ONLY" className="bg-neutral-950">🔒 In-Touch Only (Visible only to accepted connections)</option>
              </select>
            </div>

            {/* Dropdown selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold flex items-center gap-1.5">
                  Admission Batch *
                  <span
                    title={ADMISSION_BATCH_TOOLTIP}
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-white/20 text-[9px] text-neutral-400 cursor-help hover:border-white/50 hover:text-white transition-colors"
                  >
                    i
                  </span>
                </label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full cursor-pointer"
                  required
                >
                  <option value="" className="bg-neutral-950">Select Batch</option>
                  {BATCH_OPTIONS.map((y) => (
                    <option key={y} value={y} className="bg-neutral-950">{y}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">Department *</label>
                <select
                  value={department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full cursor-pointer"
                  required
                >
                  <option value="" className="bg-neutral-950">Select Department</option>
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <option key={d} value={d} className="bg-neutral-950">{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  disabled={!department || (SECTION_MAPPING[department] || []).length === 0}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" className="bg-neutral-950">No Section</option>
                  {(SECTION_MAPPING[department] || []).map((sec) => (
                    <option key={sec} value={sec} className="bg-neutral-950">{sec}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Professional fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">Current Position (Optional)</label>
                <input
                  type="text"
                  value={currentPosition}
                  onChange={(e) => setCurrentPosition(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                  placeholder="e.g. Software Developer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">Current Company (Optional)</label>
                <input
                  type="text"
                  value={currentCompany}
                  onChange={(e) => setCurrentCompany(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                  placeholder="e.g. Amazon"
                />
              </div>
            </div>

            {/* City & Graduation year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">Current City (Optional)</label>
                <input
                  type="text"
                  value={currentCity}
                  onChange={(e) => setCurrentCity(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                  placeholder="e.g. Hyderabad"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">Graduation Year (Optional)</label>
                <input
                  type="text"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                  placeholder="e.g. 2026"
                />
              </div>
            </div>

            {/* Badges Selector */}
            <div className="space-y-2">
              <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">Custom Profile Badges</label>
              <div className="flex flex-wrap gap-4">
                {["Mentor", "Entrepreneur", "Hiring", "Reunion Organizer"].map((b) => (
                  <label key={b} className="flex items-center gap-2 text-[13px] text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBadges.includes(b)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBadges(prev => [...prev, b]);
                        } else {
                          setSelectedBadges(prev => prev.filter(item => item !== b));
                        }
                      }}
                      className="w-4 h-4 bg-neutral-900 border-white/10 rounded focus:ring-0 cursor-pointer"
                    />
                    {b}
                  </label>
                ))}
              </div>
            </div>

            {/* Open To Selector */}
            <div className="space-y-2">
              <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">Open To Preferences</label>
              <div className="flex flex-wrap gap-4">
                {["Mentoring", "Hiring", "Career Guidance"].map((o) => (
                  <label key={o} className="flex items-center gap-2 text-[13px] text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOpenTo.includes(o)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOpenTo(prev => [...prev, o]);
                        } else {
                          setSelectedOpenTo(prev => prev.filter(item => item !== o));
                        }
                      }}
                      className="w-4 h-4 bg-neutral-900 border-white/10 rounded focus:ring-0 cursor-pointer"
                    />
                    {o}
                  </label>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-1">
              <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">Skills (Optional, comma-separated)</label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                placeholder="e.g. Next.js, Java, Cloudinary"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] tracking-widest uppercase text-neutral-455 font-bold">Bio (Optional)</label>
                <span className="text-[9px] text-neutral-500 tracking-wider">
                  {bio.length} / 250
                </span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={250}
                className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] p-3 transition-colors duration-300 resize-none rounded-xl"
                placeholder="Brief summary..."
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">Phone Number * (10 digits)</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                placeholder="e.g. 9876543210"
                required
              />
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">LinkedIn URL (Optional)</label>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                  placeholder="linkedin.com/in/username"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">GitHub URL (Required for Software)</label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                  placeholder="github.com/username"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">Instagram URL (Optional)</label>
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                  placeholder="instagram.com/username"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={submitting}
              className="w-full py-4 text-center bg-white text-black text-[13px] font-bold tracking-widest uppercase hover:bg-neutral-200 transition-colors rounded-full cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Completing Setup..." : "Save and Continue"}
            </motion.button>

          </form>

          <button
            onClick={handleLogout}
            className="w-full py-3 border border-white/5 hover:border-white/20 text-neutral-500 hover:text-white transition-colors text-[12px] font-bold tracking-widest uppercase rounded-full cursor-pointer text-center"
          >
            Logout
          </button>

        </div>
      </div>
    </main>
  );
}
