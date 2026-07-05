import { getAuthToken } from "./authService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface AchievementDto {
  id: string;
  userId: string;
  userFullName: string;
  userProfilePicture?: string;
  type: string;
  title: string;
  description: string;
  companyOrInstitution?: string;
  date: string;
  link?: string;
}

export interface AchievementCreateDto {
  type: string;
  title: string;
  description: string;
  companyOrInstitution?: string;
  date: string;
  link?: string;
}

async function authFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) throw new Error(await res.text() || "Request failed");
  return res;
}

export async function createAchievement(dto: AchievementCreateDto): Promise<AchievementDto> {
  const res = await authFetch(`${API_BASE}/api/achievements`, { method: "POST", body: JSON.stringify(dto) });
  return res.json();
}

export async function getAchievements(): Promise<AchievementDto[]> {
  const res = await authFetch(`${API_BASE}/api/achievements`);
  return res.json();
}

export async function deleteAchievement(id: string): Promise<void> {
  await authFetch(`${API_BASE}/api/achievements/${id}`, { method: "DELETE" });
}
