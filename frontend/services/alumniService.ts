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

export interface AlumniFilters {
  q?: string;
  company?: string;
  position?: string;
  batch?: string;
  department?: string;
  section?: string;
  city?: string;
  skills?: string;
  openTo?: string;
  badge?: string;
}

export async function searchAlumniDirectoryWithFilters(filters: AlumniFilters): Promise<UserProfile[]> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val) params.append(key, val);
  });

  const response = await fetch(`${API_BASE}/api/alumni/search?${params.toString()}`, {
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

export async function getRecommendations(): Promise<UserProfile[]> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(`${API_BASE}/api/alumni/recommendations`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || "Failed to load recommendations.");
  }

  return response.json();
}

/* In-Touch APIs */
export async function sendInTouchRequest(targetUserId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE}/api/in-touch/request/${targetUserId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await response.text() || "Failed to send In-Touch request");
}

export async function cancelInTouchRequest(targetUserId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE}/api/in-touch/cancel/${targetUserId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await response.text() || "Failed to cancel In-Touch request");
}

export async function acceptInTouchRequest(senderUserId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE}/api/in-touch/accept/${senderUserId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await response.text() || "Failed to accept In-Touch request");
}

export async function rejectInTouchRequest(senderUserId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE}/api/in-touch/reject/${senderUserId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await response.text() || "Failed to reject In-Touch request");
}

export async function removeInTouchConnection(targetUserId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE}/api/in-touch/remove/${targetUserId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await response.text() || "Failed to remove connection");
}

export async function getReceivedRequests(): Promise<UserProfile[]> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE}/api/in-touch/requests/received`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch received requests");
  return response.json();
}

export async function getSentRequests(): Promise<UserProfile[]> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE}/api/in-touch/requests/sent`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch sent requests");
  return response.json();
}

export async function getInTouchConnections(): Promise<UserProfile[]> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE}/api/in-touch/connections`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch In-Touch connections");
  return response.json();
}

/* Contact Request APIs */
export async function requestContactDetails(ownerUserId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE}/api/contact-requests/request/${ownerUserId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await response.text() || "Failed to request contact details");
}

export async function acceptContactRequest(requesterUserId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE}/api/contact-requests/accept/${requesterUserId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await response.text() || "Failed to accept contact request");
}

export async function rejectContactRequest(requesterUserId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE}/api/contact-requests/reject/${requesterUserId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await response.text() || "Failed to reject contact request");
}

export async function getPendingContactRequests(): Promise<UserProfile[]> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE}/api/contact-requests/pending`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch pending contact requests");
  return response.json();
}

/* Timeline APIs */
export interface TimelineEntry {
  id?: string;
  userId?: string;
  year: number;
  title: string;
  description: string;
}

export async function getTimelineEntries(userId: string): Promise<TimelineEntry[]> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE}/api/timeline/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to load timeline entries");
  return response.json();
}

export async function addTimelineEntry(entry: { year: number; title: string; description: string }): Promise<TimelineEntry> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE}/api/timeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(entry)
  });
  if (!response.ok) throw new Error("Failed to save timeline entry");
  return response.json();
}

export async function deleteTimelineEntry(entryId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE}/api/timeline/${entryId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to delete timeline entry");
}
