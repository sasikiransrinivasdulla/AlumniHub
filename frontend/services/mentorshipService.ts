import { getAuthToken } from "./authService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface MentorshipRequestDto {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorProfilePicture?: string;
  menteeId: string;
  menteeName: string;
  menteeProfilePicture?: string;
  status: string;
  message?: string;
  sessionDate?: string;
  feedback?: string;
  rating?: number;
}

export interface MentorshipRequestCreateDto {
  mentorId: string;
  message?: string;
  sessionDate?: string;
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

export async function registerAsMentor(params: { skills: string; experience: string; company: string; availability: string; meetingMode: string; helpAreas: string }): Promise<void> {
  const qs = new URLSearchParams(params).toString();
  await authFetch(`${API_BASE}/api/mentorship/register?${qs}`, { method: "POST" });
}

export async function requestMentorship(dto: MentorshipRequestCreateDto): Promise<MentorshipRequestDto> {
  const res = await authFetch(`${API_BASE}/api/mentorship/request`, { method: "POST", body: JSON.stringify(dto) });
  return res.json();
}

export async function acceptMentorship(id: string): Promise<MentorshipRequestDto> {
  const res = await authFetch(`${API_BASE}/api/mentorship/requests/${id}/accept`, { method: "POST" });
  return res.json();
}

export async function rejectMentorship(id: string): Promise<MentorshipRequestDto> {
  const res = await authFetch(`${API_BASE}/api/mentorship/requests/${id}/reject`, { method: "POST" });
  return res.json();
}

export async function scheduleSession(id: string, sessionDate: string): Promise<MentorshipRequestDto> {
  const res = await authFetch(`${API_BASE}/api/mentorship/requests/${id}/schedule?sessionDate=${encodeURIComponent(sessionDate)}`, { method: "POST" });
  return res.json();
}

export async function submitFeedback(id: string, feedback: string, rating: number): Promise<MentorshipRequestDto> {
  const res = await authFetch(`${API_BASE}/api/mentorship/requests/${id}/feedback?feedback=${encodeURIComponent(feedback)}&rating=${rating}`, { method: "POST" });
  return res.json();
}

export async function getRequestsAsMentor(): Promise<MentorshipRequestDto[]> {
  const res = await authFetch(`${API_BASE}/api/mentorship/requests/mentor`);
  return res.json();
}

export async function getRequestsAsMentee(): Promise<MentorshipRequestDto[]> {
  const res = await authFetch(`${API_BASE}/api/mentorship/requests/mentee`);
  return res.json();
}

export async function getMentors(): Promise<any[]> {
  const res = await authFetch(`${API_BASE}/api/mentorship/mentors`);
  return res.json();
}
