import { getAdminToken } from "@/lib/api";
import type { ExpertUser, UserStatus } from "@/lib/adminUserManagement";
import { publicApiBase } from "@/lib/publicApiBase";

export type AdminExpertsResponse = {
  items: ExpertUser[];
  counts: {
    all: number;
    active: number;
    on_hold: number;
    suspended: number;
  };
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type AdminExpertDetail = {
  expert: ExpertUser;
  bookings: Array<{
    id: string;
    seekerId: string;
    seekerName: string;
    subject: string;
    status: string;
    consultationType: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    createdAt: string;
    amount: number;
    paymentStatus: string;
  }>;
  credentials: Array<{
    id: string;
    type: string;
    title: string;
    issuer: string;
    issueDate?: string;
    documentUrl?: string;
  }>;
  availabilities: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;
};

async function adminExpertRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${publicApiBase()}/api/admin/experts${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getAdminToken() || ""}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Unable to load expert records");
  return data as T;
}

export function getAdminExperts({ page = 1, limit = 100, search = "", status = "all" } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), status });
  if (search.trim()) params.set("search", search.trim());
  return adminExpertRequest<AdminExpertsResponse>(`?${params.toString()}`);
}

export function getAdminExpert(expertId: string) {
  return adminExpertRequest<AdminExpertDetail>(`/${encodeURIComponent(expertId)}`);
}

export function updateAdminExpertStatus(id: string, status: UserStatus) {
  return adminExpertRequest<{ message: string; expert: ExpertUser }>(`/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
