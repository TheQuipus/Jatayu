import { getAdminToken } from "@/lib/api";
import { publicApiBase } from "@/lib/publicApiBase";

export type AdminSupportTicketStatus = "open" | "replied";
export type AdminSupportRequesterType = "seeker" | "expert";

export type AdminSupportReply = {
  id: string;
  ticketId: string;
  adminId: string | null;
  adminName: string;
  fromEmail: string;
  toEmail: string;
  message: string;
  createdAt: string;
};

export type AdminSupportTicket = {
  id: string;
  ticketNumber: string;
  requesterType: AdminSupportRequesterType;
  requesterId: string;
  requesterName: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
  status: AdminSupportTicketStatus;
  adminNotifiedAt: string | null;
  lastRepliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  replies?: AdminSupportReply[];
};

export type AdminSupportCounts = {
  all: number;
  open: number;
  replied: number;
};

export type AdminSupportPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminSupportTicketsResponse = {
  items: AdminSupportTicket[];
  counts: AdminSupportCounts;
  pagination: AdminSupportPagination;
};

export type AdminSupportTicketDetailResponse = {
  ticket: AdminSupportTicket;
  supportFromEmail: string | null;
};

export type AdminSupportTicketReplyResponse = {
  message: string;
  reply: AdminSupportReply;
  ticket: AdminSupportTicket;
  supportFromEmail: string | null;
};

export type AdminSupportApiError = Error & {
  status?: number;
  code?: string;
};

export const ADMIN_SUPPORT_UPDATED_EVENT = "admin-support-updated";

export function dispatchAdminSupportUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADMIN_SUPPORT_UPDATED_EVENT));
}

async function adminSupportRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${publicApiBase()}/api/admin/support${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getAdminToken() || ""}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(
      typeof data?.message === "string" && data.message.trim()
        ? data.message
        : "Unable to load support tickets",
    ) as AdminSupportApiError;
    err.status = response.status;
    if (typeof data?.code === "string") {
      err.code = data.code;
    }
    throw err;
  }

  return data as T;
}

export function getAdminSupportTickets({
  page = 1,
  limit = 25,
  status = "all",
  requesterType = "all",
  search = "",
}: {
  page?: number;
  limit?: number;
  status?: "all" | AdminSupportTicketStatus;
  requesterType?: "all" | AdminSupportRequesterType;
  search?: string;
} = {}): Promise<AdminSupportTicketsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status && status !== "all") {
    params.set("status", status);
  }
  if (requesterType && requesterType !== "all") {
    params.set("requesterType", requesterType);
  }
  if (search.trim()) {
    params.set("search", search.trim());
  }
  return adminSupportRequest<AdminSupportTicketsResponse>(`/tickets?${params.toString()}`);
}

export async function getAdminSupportOpenCount(): Promise<number> {
  const response = await getAdminSupportTickets({ page: 1, limit: 1 });
  return response.counts?.open ?? 0;
}

export function getAdminSupportTicket(ticketId: string): Promise<AdminSupportTicketDetailResponse> {
  return adminSupportRequest<AdminSupportTicketDetailResponse>(
    `/tickets/${encodeURIComponent(ticketId)}`,
  );
}

export async function replyToAdminSupportTicket(
  ticketId: string,
  message: string,
): Promise<AdminSupportTicketReplyResponse> {
  const response = await adminSupportRequest<AdminSupportTicketReplyResponse>(
    `/tickets/${encodeURIComponent(ticketId)}/reply`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    },
  );
  dispatchAdminSupportUpdated();
  return response;
}
