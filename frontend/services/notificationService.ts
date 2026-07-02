import { getAuthToken } from "./authService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface NotificationDto {
  id: string;
  senderId: string;
  senderName: string;
  senderProfilePicture: string | null;
  type: 'LIKE' | 'COMMENT' | 'MESSAGE' | 'MENTION';
  targetId: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(page = 0, size = 20): Promise<{ content: NotificationDto[]; last: boolean }> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(`${API_BASE}/api/notifications?page=${page}&size=${size}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load notifications.");
  }
  return response.json();
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const token = getAuthToken();
  if (!token) return 0;

  const response = await fetch(`${API_BASE}/api/notifications/unread-count`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return 0;
  }
  return response.json();
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(`${API_BASE}/api/notifications/read`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to mark notifications as read.");
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to mark notification as read.");
  }
}
