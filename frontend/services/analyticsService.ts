import { getAuthToken } from "./authService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface AnalyticsDto {
  connectionsCount: number;
  memoriesCount: number;
  profileViewsCount: number;
  searchAppearancesCount: number;
  likesReceivedCount: number;
  commentsReceivedCount: number;
  mostActiveMonth: string;
  connectionGrowth: Record<string, number>;
  profileViewsTrend: Record<string, number>;
}

export async function getAnalytics(): Promise<AnalyticsDto> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found.");

  const res = await fetch(`${API_BASE}/api/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text() || "Failed to load analytics");
  return res.json();
}
