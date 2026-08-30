import { getToken } from "@/lib/api";
import { publicApiBase } from "@/lib/publicApiBase";

export type AgoraSessionCredentials = {
  enabled: true;
  appId: string;
  channel: string;
  token: string;
  uid: number;
  role: "seeker" | "expert";
  capabilities: Array<"video" | "audio" | "chat">;
  expiresAt: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
};

export async function fetchAgoraSession(bookingId: string, role: "seeker" | "expert") {
  const path = role === "expert"
    ? `/api/expert/requests/${encodeURIComponent(bookingId)}/session/token`
    : `/api/seeker/bookings/${encodeURIComponent(bookingId)}/session/token`;
  const response = await fetch(`${publicApiBase()}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken() || ""}`, "Content-Type": "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Unable to enter the session room");
  return data.session as AgoraSessionCredentials;
}
