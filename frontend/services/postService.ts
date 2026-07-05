import { getAuthToken } from "./authService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface Post {
  id: string;
  userId: string;
  userFullName: string;
  userProfilePicture: string | null;
  userCurrentPosition: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  mediaType: string; // "IMAGE" | "VIDEO"
  caption: string;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostCreateData {
  imageUrl?: string | null;
  videoUrl?: string | null;
  mediaType?: string;
  caption: string;
}

export async function createPost(postData: PostCreateData): Promise<Post> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(`${API_BASE}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || "Failed to share memory.");
  }

  return response.json();
}

export async function getMemoriesFeed(): Promise<Post[]> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(`${API_BASE}/api/posts/feed`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || "Failed to load feed.");
  }

  return response.json();
}

export async function getMemoryOfTheDay(): Promise<Post | null> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const response = await fetch(`${API_BASE}/api/posts/memory-of-the-day`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 204) {
    return null;
  }
  if (!response.ok) {
    return null;
  }
  return response.json();
}
