import { getAuthToken } from "./authService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface EventDto {
  id: string;
  title: string;
  description: string;
  bannerUrl?: string;
  location?: string;
  online?: boolean;
  meetingLink?: string;
  startDate: string;
  endDate: string;
  capacity?: number;
  organizerId: string;
  organizerName: string;
  participantsCount: number;
  participating: boolean;
}

export interface EventCreateDto {
  title: string;
  description: string;
  bannerUrl?: string;
  location?: string;
  online?: boolean;
  meetingLink?: string;
  startDate: string;
  endDate: string;
  capacity?: number;
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

export async function createEvent(dto: EventCreateDto): Promise<EventDto> {
  const res = await authFetch(`${API_BASE}/api/events`, { method: "POST", body: JSON.stringify(dto) });
  return res.json();
}

export async function updateEvent(id: string, dto: EventCreateDto): Promise<EventDto> {
  const res = await authFetch(`${API_BASE}/api/events/${id}`, { method: "PUT", body: JSON.stringify(dto) });
  return res.json();
}

export async function deleteEvent(id: string): Promise<void> {
  await authFetch(`${API_BASE}/api/events/${id}`, { method: "DELETE" });
}

export async function rsvpEvent(id: string): Promise<EventDto> {
  const res = await authFetch(`${API_BASE}/api/events/${id}/rsvp`, { method: "POST" });
  return res.json();
}

export async function withdrawRsvp(id: string): Promise<EventDto> {
  const res = await authFetch(`${API_BASE}/api/events/${id}/withdraw`, { method: "POST" });
  return res.json();
}

export async function getUpcomingEvents(): Promise<EventDto[]> {
  const res = await authFetch(`${API_BASE}/api/events/upcoming`);
  return res.json();
}

export async function getPastEvents(): Promise<EventDto[]> {
  const res = await authFetch(`${API_BASE}/api/events/past`);
  return res.json();
}

export async function getPopularEvents(): Promise<EventDto[]> {
  const res = await authFetch(`${API_BASE}/api/events/popular`);
  return res.json();
}

export async function getMyEvents(): Promise<EventDto[]> {
  const res = await authFetch(`${API_BASE}/api/events/my`);
  return res.json();
}
