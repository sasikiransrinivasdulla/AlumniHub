"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, updateUserProfile, UserProfile } from "@/services/authService";
import Image from "next/image";
import { motion } from "framer-motion";

const BATCH_OPTIONS = Array.from({ length: 24 }, (_, i) => `${2000 + i}-${2004 + i}`);

const DEPARTMENT_OPTIONS = [
  "CST",
  "CSE",
  "ECE",
  "ECT",
  "AIML",
  "CAI",
  "EEE",
  "MECH",
  "CIVIL",
];

const SECTION_MAPPING: Record<string, string[]> = {
  CST: [],
  ECT: [],
  CSE: ["A", "B", "C", "D"],
  ECE: ["A", "B", "C"],
  EEE: ["A", "B", "C"],
  MECH: ["A", "B"],
  CIVIL: ["A", "B"],
  AIML: ["A", "B"],
  CAI: ["A", "B"],
};

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
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  useEffect(() => {
    async function checkSetup() {
      try {
        const profile = await getUserProfile();
        // If already completed profile setup, bypass this page
        if (profile.profileCompleted) {
          router.push("/dashboard");
          return;
        }
        setEmail(profile.email || "");
        setFullName(profile.fullName || "");
        setProfilePicture(profile.profilePicture || null);
        // Pre-fill if there are values
        setBatch(profile.batch || "");
        setDepartment(profile.department || "");
        setSection(profile.section || "");
        setCurrentPosition(profile.currentPosition || "");
        setBio(profile.bio || "");
        setPhoneNumber(profile.phoneNumber || "");
        setLinkedinUrl(profile.linkedinUrl || "");
        setGithubUrl(profile.githubUrl || "");
        setInstagramUrl(profile.instagramUrl || "");
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

    // Client-side validations
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
    if (currentPosition.length > 100) {
      setError("Current Position must not exceed 100 characters.");
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

    // Branch-based GitHub validation
    const isSoftwareBranch = ["CSE", "CST", "AIML", "CAI"].includes(department);
    if (isSoftwareBranch && !githubUrl.trim()) {
      setError(`GitHub profile URL is required for software-related branch (${department}).`);
      return;
    }

    if (githubUrl && !/^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/.test(githubUrl.trim())) {
      setError("Please enter a valid GitHub profile URL (e.g., https://github.com/username).");
      return;
    }
    if (linkedinUrl && !/^(https?:\/\/)?([a-zA-Z0-9-]+\.)?linkedin\.com\/.*$/.test(linkedinUrl.trim())) {
      setError("Please enter a valid LinkedIn URL.");
      return;
    }
    if (instagramUrl && !/^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/.test(instagramUrl.trim())) {
      setError("Please enter a valid Instagram URL (e.g., https://instagram.com/username).");
      return;
    }

    setSubmitting(true);
    try {
      await updateUserProfile({
        fullName,
        batch,
        department,
        section: section || null,
        currentPosition: currentPosition.trim() || null,
        bio: bio.trim() || null,
        phoneNumber: phoneNumber.trim(),
        linkedinUrl: linkedinUrl.trim() || null,
        githubUrl: githubUrl.trim() || null,
        instagramUrl: instagramUrl.trim() || null,
      });
      // Successful save sets profileCompleted = true in DB. Redirect to Dashboard.
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[15px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse">Initializing Profile Setup...</p>
      </main>
    );
  }

  const availableSections = SECTION_MAPPING[department] || [];
  const isSoftwareBranch = ["CSE", "CST", "AIML", "CAI"].includes(department);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-6 py-12 relative overflow-hidden select-none">
      
      {/* Radial glow background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)] pointer-events-none" />

      {/* Form Container */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="z-10 flex flex-col w-full max-w-xl glass-panel p-6 md:p-10 shadow-2xl space-y-6 rounded-[20px] border border-white/8"
      >
        
        {/* Title */}
        <div className="pb-4 border-b border-white/5 text-center sm:text-left">
          <h1 className="text-[22px] md:text-[24px] font-light tracking-[0.15em] uppercase text-white leading-tight">Complete Your Profile</h1>
          <p className="text-[13px] tracking-wider text-neutral-400 mt-1.5">Please provide the remaining graduation details to access the platform.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-900/50 text-red-500 text-[13px] tracking-wider rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar & Read-Only User Metadata */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-white/5">
            <div className="relative w-18 h-18 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center flex-shrink-0">
              {profilePicture ? (
                <Image
                  src={profilePicture}
                  alt={fullName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-2xl font-light text-neutral-450">
                  {fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <span className="text-[15px] font-semibold tracking-wide text-white block leading-none">{fullName}</span>
              <span className="text-[13px] tracking-wider text-neutral-400 block mt-1 leading-none">{email}</span>
              <span className="inline-block mt-3 text-[11px] tracking-widest uppercase text-neutral-450 bg-white/5 px-3 py-1 border border-white/10 rounded-lg">
                Google Authenticated
              </span>
            </div>
          </div>

          {/* Academic Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] tracking-wider uppercase text-neutral-400 block">Batch *</label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full glass-input focus:outline-none text-[13px] px-3.5 py-2.5 rounded-full cursor-pointer"
                required
              >
                <option value="" className="bg-neutral-950">Select Batch</option>
                {BATCH_OPTIONS.map((range) => (
                  <option key={range} value={range} className="bg-neutral-950">
                    {range}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] tracking-wider uppercase text-neutral-400 block">Department *</label>
              <select
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full glass-input focus:outline-none text-[13px] px-3.5 py-2.5 rounded-full cursor-pointer"
                required
              >
                <option value="" className="bg-neutral-950">Select Department</option>
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <option key={dept} value={dept} className="bg-neutral-950">
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] tracking-wider uppercase text-neutral-400 block">Section</label>
              {availableSections.length > 0 ? (
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full glass-input focus:outline-none text-[13px] px-3.5 py-2.5 rounded-full cursor-pointer"
                  required
                >
                  <option value="" className="bg-neutral-950">Select Section</option>
                  {availableSections.map((sec) => (
                    <option key={sec} value={sec} className="bg-neutral-950">
                      Section {sec}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value="No Section"
                  disabled
                  className="w-full bg-white/5 border border-white/5 text-neutral-500 text-[13px] px-3.5 py-2.5 cursor-not-allowed outline-none rounded-full"
                />
              )}
            </div>
          </div>

          {/* Current Position */}
          <div className="space-y-1.5">
            <label className="text-[11px] tracking-wider uppercase text-neutral-400 block">Current Position (Optional)</label>
            <input
              type="text"
              value={currentPosition}
              onChange={(e) => setCurrentPosition(e.target.value)}
              className="w-full glass-input focus:outline-none text-[13px] px-3.5 py-2.5 rounded-full"
              placeholder="e.g. Software Engineer at Google"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] tracking-wider uppercase text-neutral-400">Bio (Optional)</label>
              <span className="text-[11px] text-neutral-500 tracking-wider">
                {bio.length} / 250
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={250}
              className="w-full glass-input focus:outline-none text-[13px] p-3.5 resize-none rounded-[16px]"
              placeholder="Tell classmates a bit about yourself..."
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-[11px] tracking-wider uppercase text-neutral-400 block">Phone Number *</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full glass-input focus:outline-none text-[13px] px-3.5 py-2.5 rounded-full"
              placeholder="e.g. 9876543210"
              required
            />
          </div>

          {/* LinkedIn, GitHub, Instagram Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] tracking-wider uppercase text-neutral-400 block font-medium">LinkedIn URL</label>
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full glass-input focus:outline-none text-[13px] px-3.5 py-2.5 rounded-full"
                placeholder="linkedin.com/in/username"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] tracking-wider uppercase text-neutral-400 block font-medium">
                GitHub URL {isSoftwareBranch ? "*" : ""}
              </label>
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full glass-input focus:outline-none text-[13px] px-3.5 py-2.5 rounded-full"
                placeholder="github.com/username"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] tracking-wider uppercase text-neutral-400 block font-medium">Instagram URL</label>
              <input
                type="text"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="w-full glass-input focus:outline-none text-[13px] px-3.5 py-2.5 rounded-full"
                placeholder="instagram.com/username"
              />
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-5 border-t border-white/5">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-white text-black hover:bg-neutral-200 text-[13px] font-semibold tracking-[0.18em] uppercase transition-all duration-305 ease-out cursor-pointer disabled:opacity-50 rounded-full shadow-[0_4px_12px_rgba(255,255,255,0.08)]"
            >
              {submitting ? "Saving Profile..." : "Complete Setup"}
            </button>
          </div>
        </form>

      </motion.div>
    </main>
  );
}
