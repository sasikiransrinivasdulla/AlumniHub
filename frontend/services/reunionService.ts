import { getAuthToken } from "./authService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface ReunionMediaDto {
  id: string;
  url: string;
  mediaType: string;
  caption?: string;
  creatorId: string;
  creatorName: string;
}

export interface ReunionCommentDto {
  id: string;
  userId: string;
  userFullName: string;
  userProfilePicture?: string;
  text: string;
  createdAt: string;
}

export interface ReunionCollectionDto {
  id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  photos: ReunionMediaDto[];
  comments: ReunionCommentDto[];
  attendeesCount: number;
  attending: boolean;
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

export async function getReunions(): Promise<ReunionCollectionDto[]> {
  const res = await authFetch(`${API_BASE}/api/reunions`);
  return res.json();
}

export async function createReunion(title: string, description: string, date: string, location: string): Promise<ReunionCollectionDto> {
  const qs = new URLSearchParams({ title, description, date, location }).toString();
  const res = await authFetch(`${API_BASE}/api/reunions?${qs}`, { method: "POST" });
  return res.json();
}

export async function rsvpReunion(id: string): Promise<ReunionCollectionDto> {
  const res = await authFetch(`${API_BASE}/api/reunions/${id}/rsvp`, { method: "POST" });
  return res.json();
}

export async function withdrawReunion(id: string): Promise<ReunionCollectionDto> {
  const res = await authFetch(`${API_BASE}/api/reunions/${id}/withdraw`, { method: "POST" });
  return res.json();
}

export async function addReunionMedia(id: string, url: string, mediaType: string, caption?: string): Promise<ReunionMediaDto> {
  const qs = new URLSearchParams({ url, mediaType, ...(caption ? { caption } : {}) }).toString();
  const res = await authFetch(`${API_BASE}/api/reunions/${id}/media?${qs}`, { method: "POST" });
  return res.json();
}

export async function addReunionComment(id: string, text: string): Promise<ReunionCommentDto> {
  const res = await authFetch(`${API_BASE}/api/reunions/${id}/comment?text=${encodeURIComponent(text)}`, { method: "POST" });
  return res.json();
}
