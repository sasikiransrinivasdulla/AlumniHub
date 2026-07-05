import { getAuthToken } from "./authService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface ReferralDto {
  id: string;
  company: string;
  role: string;
  location?: string;
  experienceRequired?: string;
  salaryRange?: string;
  deadline?: string;
  requirements?: string;
  creatorId: string;
  creatorName: string;
}

export interface ReferralCreateDto {
  company: string;
  role: string;
  location?: string;
  experienceRequired?: string;
  salaryRange?: string;
  deadline?: string;
  requirements?: string;
}

export interface ReferralRequestDto {
  id: string;
  referralId: string;
  referralCompany: string;
  referralRole: string;
  requesterId: string;
  requesterName: string;
  resumeUrl: string;
  status: string;
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

export async function createReferral(dto: ReferralCreateDto): Promise<ReferralDto> {
  const res = await authFetch(`${API_BASE}/api/referrals`, { method: "POST", body: JSON.stringify(dto) });
  return res.json();
}

export async function getReferrals(): Promise<ReferralDto[]> {
  const res = await authFetch(`${API_BASE}/api/referrals`);
  return res.json();
}

export async function deleteReferral(id: string): Promise<void> {
  await authFetch(`${API_BASE}/api/referrals/${id}`, { method: "DELETE" });
}

export async function applyForReferral(id: string, resumeUrl: string): Promise<ReferralRequestDto> {
  const res = await authFetch(`${API_BASE}/api/referrals/${id}/apply?resumeUrl=${encodeURIComponent(resumeUrl)}`, { method: "POST" });
  return res.json();
}

export async function getMyReferralRequests(): Promise<ReferralRequestDto[]> {
  const res = await authFetch(`${API_BASE}/api/referrals/requests`);
  return res.json();
}

export async function fulfillReferralRequest(id: string): Promise<ReferralRequestDto> {
  const res = await authFetch(`${API_BASE}/api/referrals/requests/${id}/fulfill`, { method: "POST" });
  return res.json();
}
