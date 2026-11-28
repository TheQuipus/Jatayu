import { getAdminToken, getToken } from "@/lib/api";
import { handleAdminApiUnauthorized } from "@/lib/adminIdleSession";
import { publicApiBase } from "@/lib/publicApiBase";
export type AppNotification = {
  id: string;
  eventType?: string;
  title: string;
  body: string;
  href?: string | null;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
};
export type NotificationsResponse = {
  items: AppNotification[];
  unreadCount: number;
  pagination?: { page: number; limit: number; total: number; pages: number };
};
function resolveNotificationAuthToken(): string {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
    return getAdminToken() || "";
  }
  return getToken() || getAdminToken() || "";
}

async function call(path: string, init?: RequestInit & { passive?: boolean }) {
  const isAdminPath = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
  const { passive, ...fetchInit } = init || {};
  const response = await fetch(`${publicApiBase()}/api/notifications${path}`, {
    ...fetchInit,
    headers: {
      Authorization: `Bearer ${resolveNotificationAuthToken()}`,
      "Content-Type": "application/json",
      ...(isAdminPath && passive ? { "X-Admin-Activity": "passive" } : {}),
      ...(fetchInit.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (isAdminPath) {
      handleAdminApiUnauthorized(response.status, typeof data?.code === "string" ? data.code : undefined);
    }
    throw new Error(data.message || "Notification request failed");
  }
  return data;
}

export const fetchNotifications = (page = 1, limit = 50, options?: { passive?: boolean }) =>
  call(`?page=${page}&limit=${limit}`, { passive: options?.passive }) as Promise<NotificationsResponse>;
export const fetchNotificationUnreadCount = async () =>
  Number((await fetchNotifications(1, 1)).unreadCount) || 0;
export const readNotification = (id: string) =>
  call(`/${encodeURIComponent(id)}/read`, { method: "PATCH" });
export const readAllNotifications = () => call("/read-all", { method: "PATCH" });
