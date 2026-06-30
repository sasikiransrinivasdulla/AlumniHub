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
  phoneNumber: string | null;
  role: string;
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
    return localStorage.getItem("alumni_hub_token");
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
    const userStr = localStorage.getItem("alumni_hub_user");
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

export const clearAuth = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("alumni_hub_token");
    localStorage.removeItem("alumni_hub_user");
  }
};
