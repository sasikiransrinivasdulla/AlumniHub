import { getAuthToken } from "./authService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface JobOpeningDto {
  id: string;
  company: string;
  role: string;
  location?: string;
  category: string;
  description: string;
  requirements?: string;
  externalLink?: string;
  creatorId: string;
  creatorName: string;
  saved: boolean;
}

export interface JobOpeningCreateDto {
  company: string;
  role: string;
  location?: string;
  category: string;
  description: string;
  requirements?: string;
  externalLink?: string;
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

export async function createJob(dto: JobOpeningCreateDto): Promise<JobOpeningDto> {
  const res = await authFetch(`${API_BASE}/api/jobs`, { method: "POST", body: JSON.stringify(dto) });
  return res.json();
}

export async function getJobs(): Promise<JobOpeningDto[]> {
  const res = await authFetch(`${API_BASE}/api/jobs`);
  return res.json();
}

export async function deleteJob(id: string): Promise<void> {
  await authFetch(`${API_BASE}/api/jobs/${id}`, { method: "DELETE" });
}

export async function saveJob(id: string): Promise<JobOpeningDto> {
  const res = await authFetch(`${API_BASE}/api/jobs/${id}/save`, { method: "POST" });
  return res.json();
}

export async function unsaveJob(id: string): Promise<JobOpeningDto> {
  const res = await authFetch(`${API_BASE}/api/jobs/${id}/unsave`, { method: "POST" });
  return res.json();
}

export async function getSavedJobs(): Promise<JobOpeningDto[]> {
  const res = await authFetch(`${API_BASE}/api/jobs/saved`);
  return res.json();
}
