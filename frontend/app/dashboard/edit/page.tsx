"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, updateUserProfile, clearAuth, UserProfile } from "@/services/authService";
import { uploadProfileImage, deleteProfileImage } from "@/services/uploadService";
import Sidebar from "@/components/Sidebar";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BATCH_OPTIONS,
  DEPARTMENT_OPTIONS,
  SECTION_MAPPING,
  ADMISSION_BATCH_TOOLTIP,
} from "@/constants/profileConstants";


export default function EditProfile() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
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
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // v2.2 custom fields
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [selectedOpenTo, setSelectedOpenTo] = useState<string[]>([]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getUserProfile();
        if (!profile.profileCompleted) {
          router.push("/profile/setup");
          return;
        }
        setCurrentUser(profile);
        setFullName(profile.fullName || "");
        setEmail(profile.email || "");
        setFirebaseUid(profile.firebaseUid || "");
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
        setProfilePicture(profile.profilePicture || null);
        
        setSelectedBadges(profile.badges ? profile.badges.split(",").map(s => s.trim()).filter(Boolean) : []);
        setSelectedOpenTo(profile.openTo ? profile.openTo.split(",").map(s => s.trim()).filter(Boolean) : []);
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

  const handleDepartmentChange = (dept: string) => {
    setDepartment(dept);
    const sections = SECTION_MAPPING[dept] || [];
    if (sections.length === 0) {
      setSection("");
    } else {
      if (!sections.includes(section)) {
        setSection(sections[0] || "");
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds the maximum limit of 10 MB.");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported file format. Only JPG, JPEG, PNG, and WEBP are allowed.");
      return;
    }

    setError(null);
    setUploadingImage(true);
    setUploadProgress(0);

    try {
      const updatedUser = await uploadProfileImage(file, (percent) => {
        setUploadProgress(percent);
      });
      setProfilePicture(updatedUser.profilePicture);
      setCurrentUser(updatedUser);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
      setUploadProgress(null);
    }
  };

  const handleRemovePicture = async () => {
    if (!confirm("Are you sure you want to remove your profile picture?")) return;
    setError(null);
    setUploadingImage(true);
    try {
      const updatedUser = await deleteProfileImage();
      setProfilePicture(updatedUser.profilePicture);
      setCurrentUser(updatedUser);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to remove profile picture.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      setError("Please enter a valid GitHub URL.");
      return;
    }
    if (linkedinUrl && !/^(https?:\/\/)?([a-zA-Z0-9-]+\.)?linkedin\.com\/.*$/.test(linkedinUrl.trim())) {
      setError("Please enter a valid LinkedIn URL.");
      return;
    }
    if (instagramUrl && !/^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/.test(instagramUrl.trim())) {
      setError("Please enter a valid Instagram URL.");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateUserProfile({
        fullName: fullName.trim(),
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
      setCurrentUser(updated);
      router.push("/profile");
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
        <p className="text-[15px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse font-light">Loading profile details...</p>
      </main>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar user={currentUser} />

      <main className="flex-1 min-h-screen pl-20 md:pl-72 flex flex-col relative select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_100%)] pointer-events-none" />

        <div className="z-10 w-full max-w-2xl mx-auto px-6 md:px-12 py-10 md:py-16 flex flex-col space-y-8">
          
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h1 className="text-[20px] md:text-[22px] font-light tracking-[0.15em] uppercase text-white leading-tight">Edit Profile</h1>
              <p className="text-[12px] tracking-wider text-neutral-450 mt-1.5 uppercase">Modify your personal details</p>
            </div>
            <Link
              href="/profile"
              className="px-4 py-2 border border-white/10 hover:border-white text-[12px] font-semibold tracking-wider transition-colors uppercase rounded-full"
            >
              Cancel
            </Link>
          </div>

          {error && (
            <div className="p-4 bg-red-950/20 border border-red-900/50 text-red-500 text-[14px] tracking-wider rounded-2xl text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-[12px]">
            
            {/* Profile Photo Uploader */}
            <div className="glass-panel p-6 rounded-[20px] border border-white/8 flex items-center gap-6">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center flex-shrink-0 shadow-lg">
                {profilePicture ? (
                  <Image
                    src={profilePicture}
                    alt={fullName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-[20px] font-light text-neutral-450 uppercase">
                    {fullName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <span className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">Profile Picture</span>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 bg-white text-black text-[11px] font-bold tracking-widest uppercase hover:bg-neutral-200 transition-colors cursor-pointer rounded-full">
                    Change Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                  {profilePicture && (
                    <button
                      type="button"
                      onClick={handleRemovePicture}
                      disabled={uploadingImage}
                      className="px-4 py-2 bg-transparent text-white border border-white/10 hover:border-white text-[11px] font-bold tracking-widest uppercase rounded-full cursor-pointer transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {uploadProgress !== null && (
                  <div className="w-full bg-neutral-900 h-1 mt-1 overflow-hidden">
                    <div
                      className="bg-white h-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Read-Only Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-500 block font-bold">Email</label>
                <input
                  type="text"
                  value={email}
                  disabled
                  className="w-full bg-neutral-900/60 border border-neutral-900 text-neutral-500 text-[13px] px-3.5 py-2.5 cursor-not-allowed outline-none rounded-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-500 block font-bold">Firebase UID</label>
                <input
                  type="text"
                  value={firebaseUid}
                  disabled
                  className="w-full bg-neutral-900/60 border border-neutral-900 text-neutral-500 text-[13px] px-3.5 py-2.5 cursor-not-allowed outline-none rounded-full"
                />
              </div>
            </div>

            {/* Editable Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                placeholder="Your Full Name"
                required
              />
            </div>

            {/* Privacy Settings Selector */}
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
                  placeholder="e.g. Software Engineer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">Current Company (Optional)</label>
                <input
                  type="text"
                  value={currentCompany}
                  onChange={(e) => setCurrentCompany(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                  placeholder="e.g. Google"
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
                  placeholder="e.g. Bangalore"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-455 block font-bold">Graduation Year (Optional)</label>
                <input
                  type="text"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                  placeholder="e.g. 2024"
                />
              </div>
            </div>

            {/* Badges Selector */}
            <div className="space-y-3">
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
            <div className="space-y-3">
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
                placeholder="e.g. React, Spring Boot, PostgreSQL"
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
                placeholder="Tell classmates a bit about yourself..."
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
              {submitting ? "Saving Changes..." : "Save Profile Details"}
            </motion.button>

          </form>

        </div>
      </main>
    </div>
  );
}
