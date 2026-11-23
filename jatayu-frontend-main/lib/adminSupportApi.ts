import { getAdminToken } from "@/lib/api";
import { publicApiBase } from "@/lib/publicApiBase";
import type {
  SupportViewerStatus,
  SupportViewerStatusKey,
} from "@/lib/supportStatus";

export type AdminSupportDbStatus = "open" | "closed";
export type AdminSupportLastReplyBy = "requester" | "admin" | null;
export type AdminSupportRequesterType = "seeker" | "expert";
export type AdminSupportAuthorType = "admin" | "seeker" | "expert";

export type AdminSupportReply = {
  id: string;
  ticketId: string;
  authorType: AdminSupportAuthorType;
  authorId: string | null;
  authorName: string;
  adminId: string | null;
  adminName: string | null;
  fromEmail: string | null;
  toEmail: string | null;
  message: string;
  createdAt: string;
};

export type AdminSupportThreadItem = {
  id: string;
  authorType: AdminSupportAuthorType;
  authorName: string;
  message: string;
  createdAt: string;
  isInitial: boolean;
  fromEmail?: string | null;
  toEmail?: string | null;
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
  status: AdminSupportDbStatus;
  lastReplyBy: AdminSupportLastReplyBy;
  viewerStatus: SupportViewerStatus;
  statusLabel: string;
  adminNotifiedAt: string | null;
  lastRepliedAt: string | null;
  closedAt: string | null;
  closedByAdminId: string | null;
  createdAt: string;
  updatedAt: string;
  replies?: AdminSupportReply[];
  thread?: AdminSupportThreadItem[];
};

export type AdminSupportCounts = {
  all: number;
  new: number;
  in_progress: number;
  response_received: number;
  closed: number;
  needsAttention: number;
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

export type AdminSupportTicketStateResponse = {
  message: string;
  ticket: AdminSupportTicket;
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
  status?: "all" | SupportViewerStatusKey;
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

export async function getAdminSupportNeedsAttentionCount(): Promise<number> {
  const response = await getAdminSupportTickets({ page: 1, limit: 1 });
  return response.counts?.needsAttention ?? 0;
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

export async function closeAdminSupportTicket(
  ticketId: string,
): Promise<AdminSupportTicketStateResponse> {
  const response = await adminSupportRequest<AdminSupportTicketStateResponse>(
    `/tickets/${encodeURIComponent(ticketId)}/close`,
    {
      method: "POST",
    },
  );
  dispatchAdminSupportUpdated();
  return response;
}

export async function reopenAdminSupportTicket(
  ticketId: string,
): Promise<AdminSupportTicketStateResponse> {
  const response = await adminSupportRequest<AdminSupportTicketStateResponse>(
    `/tickets/${encodeURIComponent(ticketId)}/reopen`,
    {
      method: "POST",
    },
  );
  dispatchAdminSupportUpdated();
  return response;
}
