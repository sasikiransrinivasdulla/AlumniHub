"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, updateUserProfile, UserProfile } from "@/services/authService";

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

export default function EditProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [firebaseUid, setFirebaseUid] = useState("");
  const [batch, setBatch] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getUserProfile();
        // If not onboarded, they should use /profile/setup, but let's allow editing if completed,
        // or redirect to setup if incomplete.
        if (!profile.profileCompleted) {
          router.push("/profile/setup");
          return;
        }
        setFullName(profile.fullName || "");
        setEmail(profile.email || "");
        setFirebaseUid(profile.firebaseUid || "");
        setBatch(profile.batch || "");
        setDepartment(profile.department || "");
        setSection(profile.section || "");
        setCurrentPosition(profile.currentPosition || "");
        setBio(profile.bio || "");
        setPhoneNumber(profile.phoneNumber || "");
        setLinkedinUrl(profile.linkedinUrl || "");
        setGithubUrl(profile.githubUrl || "");
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch profile details.");
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  // Handle department change to update section options
  const handleDepartmentChange = (dept: string) => {
    setDepartment(dept);
    const sections = SECTION_MAPPING[dept] || [];
    if (sections.length === 0) {
      setSection("");
    } else {
      // If previous section is not valid for new department, reset it
      if (!sections.includes(section)) {
        setSection(sections[0] || "");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    if (!fullName.trim()) {
      setError("Full Name is required.");
      return;
    }
    if (fullName.length > 100) {
      setError("Full Name must not exceed 100 characters.");
      return;
    }
    if (!batch) {
      setError("Please select a Batch.");
      return;
    }
    if (!department) {
      setError("Please select a Department.");
      return;
    }
    const sections = SECTION_MAPPING[department] || [];
    if (sections.length > 0 && !section) {
      setError("Please select a Section.");
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
    if (linkedinUrl && !/^(https?:\/\/)?([a-zA-Z0-9-]+\.)?linkedin\.com\/.*$/.test(linkedinUrl)) {
      setError("Please enter a valid LinkedIn URL.");
      return;
    }
    if (githubUrl && !/^(https?:\/\/)?(www\.)?github\.com\/.*$/.test(githubUrl)) {
      setError("Please enter a valid GitHub URL.");
      return;
    }

    setSubmitting(true);
    try {
      await updateUserProfile({
        fullName: fullName.trim(),
        batch,
        department,
        section: section || null,
        currentPosition: currentPosition.trim() || null,
        bio: bio.trim() || null,
        phoneNumber: phoneNumber.trim(),
        linkedinUrl: linkedinUrl.trim() || null,
        githubUrl: githubUrl.trim() || null,
      });
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 animate-pulse">Loading Edit form...</p>
      </main>
    );
  }

  const availableSections = SECTION_MAPPING[department] || [];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-6 py-12 relative overflow-hidden select-none">
      {/* Radial glow background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_100%)] pointer-events-none" />

      {/* Form Container */}
      <div className="z-10 flex flex-col w-full max-w-2xl bg-neutral-950 p-8 md:p-12 border border-neutral-900 shadow-2xl space-y-8">
        
        {/* Title */}
        <div className="pb-4 border-b border-neutral-900">
          <h1 className="text-xl font-light tracking-widest uppercase text-white">Edit Profile</h1>
          <p className="text-xs tracking-wider text-neutral-500 mt-1">Update your professional details below.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-900/50 text-red-500 text-xs tracking-wider">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Read-Only Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] tracking-widest uppercase text-neutral-500 block">Email</label>
              <input
                type="text"
                value={email}
                disabled
                className="w-full bg-neutral-900 border border-neutral-900 text-neutral-500 text-sm p-3 cursor-not-allowed outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] tracking-widest uppercase text-neutral-500 block">Firebase UID</label>
              <input
                type="text"
                value={firebaseUid}
                disabled
                className="w-full bg-neutral-900 border border-neutral-900 text-neutral-500 text-sm p-3 cursor-not-allowed outline-none"
              />
            </div>
          </div>

          {/* Editable Full Name */}
          <div className="space-y-1">
            <label className="text-[10px] tracking-widest uppercase text-neutral-400 block">Full Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300"
              placeholder="Your Full Name"
              required
            />
          </div>

          {/* Dropdown selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] tracking-widest uppercase text-neutral-400 block">Batch *</label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300 rounded-none cursor-pointer"
                required
              >
                <option value="">Select Batch</option>
                {BATCH_OPTIONS.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] tracking-widest uppercase text-neutral-400 block">Department *</label>
              <select
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-white focus:outline-none text-white text-xs sm:text-sm p-3 transition-colors duration-300 rounded-none cursor-pointer"
                required
              >
                <option value="">Select Department</option>
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] tracking-widest uppercase text-neutral-400 block">Section</label>
              {availableSections.length > 0 ? (
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300 rounded-none cursor-pointer"
                  required
                >
                  <option value="">Select Section</option>
                  {availableSections.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value="No Section"
                  disabled
                  className="w-full bg-neutral-900 border border-neutral-900 text-neutral-500 text-sm p-3 cursor-not-allowed outline-none"
                />
              )}
            </div>
          </div>

          {/* Current Position */}
          <div className="space-y-1">
            <label className="text-[10px] tracking-widest uppercase text-neutral-400 block">Current Position</label>
            <input
              type="text"
              value={currentPosition}
              onChange={(e) => setCurrentPosition(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300"
              placeholder="e.g. Software Engineer at Google"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] tracking-widest uppercase text-neutral-400">Bio</label>
              <span className="text-[9px] text-neutral-500 tracking-wider">
                {bio.length} / 250
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={250}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300 resize-none"
              placeholder="Tell classmates a bit about yourself..."
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="text-[10px] tracking-widest uppercase text-neutral-400 block">Phone Number *</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300"
              placeholder="e.g. 9876543210"
              required
            />
          </div>

          {/* LinkedIn & GitHub Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] tracking-widest uppercase text-neutral-400 block">LinkedIn URL</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300"
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] tracking-widest uppercase text-neutral-400 block">GitHub URL</label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300"
                placeholder="https://github.com/username"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-neutral-900">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 text-center bg-white text-black text-xs font-semibold tracking-widest uppercase hover:bg-neutral-200 transition-all duration-300 ease-out cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              disabled={submitting}
              className="flex-1 py-3 bg-transparent text-white text-xs font-semibold tracking-widest uppercase border border-neutral-800 hover:border-white transition-all duration-300 ease-out cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>

      </div>
    </main>
  );
}
