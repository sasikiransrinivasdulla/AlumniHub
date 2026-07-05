"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, updateUserProfile, UserProfile } from "@/services/authService";
import { uploadProfileImage, deleteProfileImage } from "@/services/uploadService";
import Sidebar from "@/components/Sidebar";
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
        <p className="text-[12px] tracking-[0.2em] uppercase text-neutral-500 animate-pulse">Loading Edit form...</p>
      </main>
    );
  }

  const availableSections = SECTION_MAPPING[department] || [];
  const isSoftwareBranch = ["CSE", "CST", "AIML", "CAI"].includes(department);

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden select-none">
      <Sidebar user={currentUser} />

      <main className="flex-1 h-screen overflow-y-auto pl-20 md:pl-72 flex flex-col relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_100%)] pointer-events-none" />

        <div className="z-10 w-full max-w-xl mx-auto px-6 md:px-8 py-8 md:py-12 flex flex-col space-y-6">
          
          <div className="pb-4 border-b border-white/5">
            <h1 className="text-[20px] md:text-[22px] font-light tracking-[0.15em] uppercase text-white leading-tight">Edit Profile</h1>
            <p className="text-[12px] tracking-wider text-neutral-450 mt-1.5 uppercase">Update your professional details below</p>
          </div>

          {error && (
            <div className="p-4 bg-red-950/20 border border-red-900/50 text-red-500 text-xs tracking-wider rounded-xl text-center">
              {error}
            </div>
          )}

          <motion.form 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit} 
            className="space-y-5 text-[12px]"
          >
            {/* Profile Picture Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-neutral-900/40 border border-white/5 rounded-2xl">
              <div className="relative w-16 h-16 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] tracking-widest text-neutral-600 uppercase">No Image</span>
                )}
              </div>
              
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <label className="text-[10px] tracking-widest uppercase text-neutral-400 font-bold">Profile Picture</label>
                <div className="flex flex-wrap gap-2">
                  <label className="px-4 py-2 bg-white text-black text-[10px] font-semibold tracking-widest uppercase hover:bg-neutral-200 transition-all duration-300 cursor-pointer text-center rounded-full">
                    {uploadingImage ? `Uploading...` : "Change Picture"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
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
                      className="px-4 py-2 bg-transparent text-white text-[10px] font-semibold tracking-widest uppercase border border-white/10 hover:border-white transition-colors cursor-pointer rounded-full"
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
              <label className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">Full Name *</label>
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
              <label className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">Profile Privacy Level</label>
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
                <label className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">Batch *</label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full cursor-pointer"
                  required
                >
                  <option value="" className="bg-neutral-950">Select Batch</option>
                  {BATCH_OPTIONS.map((range) => (
                    <option key={range} value={range} className="bg-neutral-950">{range}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">Department *</label>
                <select
                  value={department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full cursor-pointer"
                  required
                >
                  <option value="" className="bg-neutral-950">Select Department</option>
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <option key={dept} value={dept} className="bg-neutral-950">{dept}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">Section</label>
                {availableSections.length > 0 ? (
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full cursor-pointer"
                    required
                  >
                    <option value="" className="bg-neutral-950">Select Section</option>
                    {availableSections.map((sec) => (
                      <option key={sec} value={sec} className="bg-neutral-950">Section {sec}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value="No Section"
                    disabled
                    className="w-full bg-neutral-900/60 border border-neutral-900 text-neutral-500 text-[13px] px-3.5 py-2.5 cursor-not-allowed outline-none rounded-full"
                  />
                )}
              </div>
            </div>

            {/* Position and Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">Current Position (Optional)</label>
                <input
                  type="text"
                  value={currentPosition}
                  onChange={(e) => setCurrentPosition(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                  placeholder="e.g. Software Engineer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">Current Company (Optional)</label>
                <input
                  type="text"
                  value={currentCompany}
                  onChange={(e) => setCurrentCompany(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                  placeholder="e.g. Google"
                />
              </div>
            </div>

            {/* City and Graduation Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">Current City (Optional)</label>
                <input
                  type="text"
                  value={currentCity}
                  onChange={(e) => setCurrentCity(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                  placeholder="e.g. Bangalore"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">Graduation Year (Optional)</label>
                <input
                  type="text"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                  placeholder="e.g. 2024"
                />
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-1">
              <label className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">Skills (Optional, comma-separated)</label>
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
                <label className="text-[10px] tracking-widest uppercase text-neutral-450 font-bold">Bio (Optional)</label>
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
              <label className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">Phone Number *</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                placeholder="e.g. 9876543210"
                required
              />
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">LinkedIn URL (Optional)</label>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                  placeholder="linkedin.com/in/username"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">
                  GitHub URL {isSoftwareBranch ? "*" : ""}
                </label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                  placeholder="github.com/username"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-450 block font-bold">Instagram URL (Optional)</label>
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-white/5 focus:border-white focus:outline-none text-white text-[13px] px-3.5 py-2.5 transition-colors duration-300 rounded-full"
                  placeholder="instagram.com/username"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-5 border-t border-white/5">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 text-center bg-white text-black text-[13px] font-semibold tracking-[0.18em] uppercase hover:bg-neutral-200 transition-all duration-300 ease-out cursor-pointer disabled:opacity-50 rounded-full shadow-[0_4px_12px_rgba(255,255,255,0.08)]"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/profile")}
                disabled={submitting}
                className="flex-1 py-3 bg-transparent text-white text-[13px] font-semibold tracking-[0.18em] uppercase border border-white/10 hover:border-white transition-all duration-305 ease-out cursor-pointer disabled:opacity-50 rounded-full"
              >
                Cancel
              </button>
            </div>
          </motion.form>

        </div>
      </main>
    </div>
  );
}
