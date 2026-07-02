import { getAuthToken, UserProfile } from "./authService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function getAlumniDirectory(): Promise<UserProfile[]> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(`${API_BASE}/api/alumni`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || "Failed to load directory.");
  }

  return response.json();
}

export async function searchAlumniDirectory(query: string): Promise<UserProfile[]> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(`${API_BASE}/api/alumni/search?q=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || "Failed to search directory.");
  }

  return response.json();
}

export async function getAlumniDetails(id: string): Promise<UserProfile> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(`${API_BASE}/api/alumni/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 403) {
    throw new Error("403 Forbidden");
  }

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || "Failed to load profile details.");
  }

  return response.json();
}
