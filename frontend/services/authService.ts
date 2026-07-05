import { requestCache } from "./cacheService";

export interface UserExperience {
  id?: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  currentJob?: boolean;
  description?: string;
}

export interface UserEducation {
  id?: string;
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface UserProject {
  id?: string;
  title: string;
  description?: string;
  url?: string;
  role?: string;
}

export interface UserCertification {
  id?: string;
  name: string;
  issuingOrganization: string;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string;
  fullName: string;
  profilePicture: string | null;
  batch: string | null;
  department: string | null;
  section: string | null;
  bio: string | null;
  currentPosition: string | null;
  currentCompany: string | null;
  currentCity: string | null;
  skills: string | null;
  graduationYear: string | null;
  privacyLevel: string | null;
  badges: string | null;
  openTo: string | null;
  recommendationReason?: string;
  inTouchStatus: string | null;
  inTouchConnectedSince: string | null;
  contactRequestStatus: string | null;
  hasFullAccess: boolean;
  phoneNumber: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  instagramUrl: string | null;
  profileCompleted: boolean;
  role: string;

  // Mentorship settings
  mentorSkills?: string | null;
  mentorExperience?: string | null;
  mentorCompany?: string | null;
  mentorAvailability?: string | null;
  mentorMeetingMode?: string | null;
  mentorHelpAreas?: string | null;

  // Advanced profile sections
  resumeUrl?: string | null;
  portfolioUrl?: string | null;
  websiteUrl?: string | null;
  researchPapers?: string | null;

  // Counter metrics
  profileViews?: number;
  searchAppearances?: number;

  // Lists
  experiences?: UserExperience[];
  educations?: UserEducation[];
  projects?: UserProject[];
  certifications?: UserCertification[];

  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
  authStatus: string;
}

// Clean the API URL env variable
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080")
  .trim()
  .replace(/^["']|["']$/g, "")
  .trim();

export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return (payload.exp * 1000) < (Date.now() + 10000); // 10s buffer
  } catch {
    return true;
  }
}

export async function loginWithFirebaseToken(firebaseToken: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ firebaseToken }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Authentication failed on the backend.");
  }

  return response.json();
}

// Token and User Storage helper methods
export const setAuthToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("alumni_hub_token", token);
  }
};

export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("alumni_hub_token");
    if (token && isTokenExpired(token)) {
      clearAuth();
      return null;
    }
    return token;
  }
  return null;
};

export const setAuthUser = (user: UserProfile) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("alumni_hub_user", JSON.stringify(user));
  }
};

export const getAuthUser = (): UserProfile | null => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("alumni_hub_token");
    if (!token || isTokenExpired(token)) {
      clearAuth();
      return null;
    }
    const userStr = localStorage.getItem("alumni_hub_user");
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

export const clearAuth = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("alumni_hub_token");
    localStorage.removeItem("alumni_hub_user");
    requestCache.clear();
  }
};

export async function getUserProfile(forceFetch = false): Promise<UserProfile> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No authentication token found.");
  }

  if (!forceFetch) {
    const cachedProfile = requestCache.get("user_profile");
    if (cachedProfile) return cachedProfile;
  }

  const response = await fetch(`${API_URL}/api/user/me`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 403 || response.status === 401) {
      clearAuth();
    }
    const errorText = await response.text();
    throw new Error(errorText || "Failed to load user profile.");
  }

  const user = await response.json();
  setAuthUser(user);
  requestCache.set("user_profile", user, 30000); // Cache for 30s
  return user;
}

export async function updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No authentication token found.");
  }

  const response = await fetch(`${API_URL}/api/user/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to update profile.");
  }

  const updatedUser = await response.json();
  setAuthUser(updatedUser);
  requestCache.delete("user_profile"); // invalidate cache
  return updatedUser;
}
