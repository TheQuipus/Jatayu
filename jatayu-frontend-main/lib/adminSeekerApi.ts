import { getAdminToken } from "@/lib/api";
import type { SeekerUser, UserStatus } from "@/lib/adminUserManagement";
import { publicApiBase } from "@/lib/publicApiBase";

export type AdminSeekersResponse = {
  items: SeekerUser[];
  counts: Record<string, number>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

async function adminSeekerRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${publicApiBase()}/api/admin/seekers${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getAdminToken() || ""}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Unable to load seeker records");
  return data as T;
}

export function getAdminSeekers({ page = 1, limit = 100, search = "", status = "all" } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), status });
  if (search.trim()) params.set("search", search.trim());
  return adminSeekerRequest<AdminSeekersResponse>(`?${params.toString()}`);
}

export function updateAdminSeekerStatus(id: string, status: UserStatus) {
  return adminSeekerRequest<{ message: string; seeker: SeekerUser }>(`/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export type AdminSeekerBooking = {
  id: string;
  expertId: string;
  subject: string;
  context: string;
  expertName: string;
  expertProfessionalTitle: string;
  expertProfilePhotoSrc: string;
  status: string;
  consultationType: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  createdAt: string;
  amount: number;
  consultationFee: number;
  platformFee: number;
  gst: number;
  creditsUsed: number;
  paymentStatus: string;
};

export type AdminSeekerDetail = {
  seeker: SeekerUser;
  bookings: AdminSeekerBooking[];
  metrics: {
    completedBookings: number;
    totalDurationMinutes: number;
    avgSessionDurationMinutes: number;
    ratingCount: number;
    avgRatingGiven: number | null;
    consultationTypes: Record<string, number>;
  };
  verification: {
    emailVerified: boolean;
    phoneVerified: boolean;
    providers: string[];
  };
  notifications: {
    unreadCount: number;
  };
  credits: {
    balance: number;
    earned: number;
    spent: number;
    refunded: number;
    transactions: Array<{ id: string; amount: number; balanceAfter: number; type: string; source: string; reference: string; description: string; createdAt: string }>;
  };
  engagement: {
    savedExperts: Array<{ id: string; name: string; category: string; rating: number | null; reviews: number; hourlyRate: number | null; avatar: string; timeLabel: string }>;
    recentlyViewed: Array<{ id: string; name: string; category: string; rating: number | null; reviews: number; hourlyRate: number | null; avatar: string; timeLabel: string }>;
    automatedOffers: Array<{ id: string; type: "reminder" | "discount"; title: string; description: string; timing: string; discount?: string; status: "active" | "scheduled"; target: string }>;
  };
};

export const getAdminSeeker = (id: string) =>
  adminSeekerRequest<AdminSeekerDetail>(`/${encodeURIComponent(id)}`);

export function grantAdminSeekerCredits(id: string, amount: number, description?: string) {
  return adminSeekerRequest<{ message: string; credits: number; transaction: AdminSeekerDetail["credits"]["transactions"][number] }>(`/${encodeURIComponent(id)}/credits`, {
    method: "POST",
    body: JSON.stringify({ amount, ...(description ? { description } : {}) }),
  });
}

export type AdminSeekerNotification = { id: string; eventType: string; title: string; body: string; href: string; data: Record<string, unknown>; readAt: string | null; createdAt: string; category: "bookings" | "messages" | "payments" | "expert_updates" | "system" };
export function getAdminSeekerNotifications(id: string) { return adminSeekerRequest<{ items: AdminSeekerNotification[]; unreadCount: number }>(`/${encodeURIComponent(id)}/notifications`); }
export function markAdminSeekerNotificationRead(seekerId: string, notificationId: string) { return adminSeekerRequest<{ notification: AdminSeekerNotification }>(`/${encodeURIComponent(seekerId)}/notifications/${encodeURIComponent(notificationId)}/read`, { method: "PATCH" }); }
