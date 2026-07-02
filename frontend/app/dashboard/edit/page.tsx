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

    // Client-side validations
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
      // Also update sidebar model
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
      // Also update sidebar model
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
      const updated = await updateUserProfile({
        fullName: fullName.trim(),
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
      setCurrentUser(updated);
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
  const isSoftwareBranch = ["CSE", "CST", "AIML", "CAI"].includes(department);

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      {/* Fixed Left Sidebar */}
      <Sidebar user={currentUser} />

      {/* Main Edit Container */}
      <main className="flex-1 h-screen overflow-y-auto pl-16 md:pl-64 flex flex-col relative select-none">
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_100%)] pointer-events-none" />

        <div className="z-10 w-full max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col space-y-8">
          
          {/* Header */}
          <div className="pb-4 border-b border-neutral-900">
            <h1 className="text-xl md:text-2xl font-light tracking-widest uppercase text-white">Edit Profile</h1>
            <p className="text-xs tracking-wider text-neutral-500 mt-1 uppercase">Update your professional details below</p>
          </div>

          {error && (
            <div className="p-4 bg-red-950/20 border border-red-900/50 text-red-500 text-xs tracking-wider">
              {error}
            </div>
          )}

          <motion.form 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit} 
            className="space-y-6"
          >
            {/* Profile Picture Upload Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-neutral-900/40 border border-neutral-900 rounded-2xl">
              <div className="relative w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden">
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
                  <label className="px-4 py-2 bg-white text-black text-[10px] font-semibold tracking-widest uppercase hover:bg-neutral-200 transition-all duration-300 cursor-pointer text-center rounded-xl">
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
                      className="px-4 py-2 bg-transparent text-white text-[10px] font-semibold tracking-widest uppercase border border-neutral-800 hover:border-white transition-all duration-305 cursor-pointer rounded-xl"
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
                  className="w-full bg-neutral-900/60 border border-neutral-900 text-neutral-500 text-sm p-3 cursor-not-allowed outline-none rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-500 block font-bold">Firebase UID</label>
                <input
                  type="text"
                  value={firebaseUid}
                  disabled
                  className="w-full bg-neutral-900/60 border border-neutral-900 text-neutral-500 text-sm p-3 cursor-not-allowed outline-none rounded-xl"
                />
              </div>
            </div>

            {/* Editable Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] tracking-widest uppercase text-neutral-400 block font-bold">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-neutral-900/60 border border-neutral-850 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300 rounded-xl"
                placeholder="Your Full Name"
                required
              />
            </div>

            {/* Dropdown selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-400 block font-bold">Batch *</label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-neutral-850 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300 rounded-xl cursor-pointer"
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
                <label className="text-[10px] tracking-widest uppercase text-neutral-400 block font-bold">Department *</label>
                <select
                  value={department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-neutral-850 focus:border-white focus:outline-none text-white text-xs sm:text-sm p-3 transition-colors duration-300 rounded-xl cursor-pointer"
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
                <label className="text-[10px] tracking-widest uppercase text-neutral-400 block font-bold">Section</label>
                {availableSections.length > 0 ? (
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full bg-neutral-900/60 border border-neutral-850 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300 rounded-xl cursor-pointer"
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
                    className="w-full bg-neutral-900/60 border border-neutral-900 text-neutral-500 text-sm p-3 cursor-not-allowed outline-none rounded-xl"
                  />
                )}
              </div>
            </div>

            {/* Current Position */}
            <div className="space-y-1">
              <label className="text-[10px] tracking-widest uppercase text-neutral-400 block font-bold">Current Position (Optional)</label>
              <input
                type="text"
                value={currentPosition}
                onChange={(e) => setCurrentPosition(e.target.value)}
                className="w-full bg-neutral-900/60 border border-neutral-850 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300 rounded-xl"
                placeholder="e.g. Software Engineer at Google"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] tracking-widest uppercase text-neutral-400 font-bold">Bio (Optional)</label>
                <span className="text-[9px] text-neutral-500 tracking-wider">
                  {bio.length} / 250
                </span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={250}
                className="w-full bg-neutral-900/60 border border-neutral-850 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300 resize-none rounded-xl"
                placeholder="Tell classmates a bit about yourself..."
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-[10px] tracking-widest uppercase text-neutral-400 block font-bold">Phone Number *</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-neutral-900/60 border border-neutral-850 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300 rounded-xl"
                placeholder="e.g. 9876543210"
                required
              />
            </div>

            {/* LinkedIn, GitHub, Instagram Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-400 block font-bold">LinkedIn URL (Optional)</label>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-neutral-850 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300 rounded-xl"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-400 block font-bold">
                  GitHub URL {isSoftwareBranch ? "*" : "(Optional)"}
                </label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-neutral-850 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300 rounded-xl"
                  placeholder="https://github.com/username"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] tracking-widest uppercase text-neutral-400 block font-bold">Instagram URL (Optional)</label>
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-neutral-850 focus:border-white focus:outline-none text-white text-sm p-3 transition-colors duration-300 rounded-xl"
                  placeholder="https://instagram.com/username"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-neutral-900">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 text-center bg-white text-black text-xs font-semibold tracking-widest uppercase hover:bg-neutral-200 transition-all duration-300 ease-out cursor-pointer disabled:opacity-50 rounded-xl"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                disabled={submitting}
                className="flex-1 py-3 bg-transparent text-white text-xs font-semibold tracking-widest uppercase border border-neutral-800 hover:border-white transition-all duration-300 ease-out cursor-pointer disabled:opacity-50 rounded-xl"
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
