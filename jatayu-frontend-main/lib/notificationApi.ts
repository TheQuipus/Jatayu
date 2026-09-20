import { getAdminToken, getToken } from "@/lib/api";
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
async function call(path: string, init?: RequestInit) {
  const response = await fetch(`${publicApiBase()}/api/notifications${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getToken() || getAdminToken() || ""}`,
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
}

export const fetchNotifications = (page = 1, limit = 50) =>
  call(`?page=${page}&limit=${limit}`) as Promise<NotificationsResponse>;
export const fetchNotificationUnreadCount = async () =>
  Number((await fetchNotifications(1, 1)).unreadCount) || 0;
export const readNotification = (id: string) =>
  call(`/${encodeURIComponent(id)}/read`, { method: "PATCH" });
export const readAllNotifications = () => call("/read-all", { method: "PATCH" });
