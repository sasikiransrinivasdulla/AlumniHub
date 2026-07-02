import { getAuthToken, UserProfile } from "./authService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface ConversationDto {
  id: string;
  participant: UserProfile;
  lastMessageText: string | null;
  lastMessageImageUrl: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderProfilePicture: string | null;
  text: string;
  imageUrl: string | null;
  createdAt: string;
  isRead: boolean;
}

export async function getOrCreateConversation(targetUserId: string): Promise<ConversationDto> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(`${API_BASE}/api/chat/conversations?targetUserId=${targetUserId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || "Failed to get or create conversation.");
  }

  return response.json();
}

export async function getConversations(): Promise<ConversationDto[]> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(`${API_BASE}/api/chat/conversations`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || "Failed to load conversations.");
  }

  return response.json();
}

export async function getMessages(
  conversationId: string,
  page = 0,
  size = 20
): Promise<{ content: MessageDto[]; last: boolean }> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(
    `${API_BASE}/api/chat/conversations/${conversationId}/messages?page=${page}&size=${size}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 403) {
    throw new Error("403 Forbidden");
  }

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || "Failed to load messages.");
  }

  return response.json();
}

export async function sendMessage(
  conversationId: string,
  text: string,
  imageUrl?: string | null
): Promise<MessageDto> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(`${API_BASE}/api/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, imageUrl }),
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || "Failed to send message.");
  }

  return response.json();
}

export async function markAsRead(conversationId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(`${API_BASE}/api/chat/conversations/${conversationId}/read`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || "Failed to mark conversation as read.");
  }
}

export async function deleteMessage(messageId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(`${API_BASE}/api/chat/messages/${messageId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || "Failed to delete message.");
  }
}

export async function getUnreadCount(): Promise<number> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(`${API_BASE}/api/chat/unread-count`, {
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
