import { getExpertToken, getSeekerToken, getToken } from "@/lib/api";
import { getEmailValidationError } from "@/lib/emailValidation";
import { publicApiBase } from "@/lib/publicApiBase";
import type {
  SupportViewerStatus,
  SupportViewerStatusKey,
} from "@/lib/supportStatus";

export const PREDEFINED_SUPPORT_SUBJECTS = [
  "Booking & Scheduling Issue",
  "Payment, Wallet & Refunds",
  "Session / Video & Audio Quality",
  "Account, Login & Verification",
  "Profile & Onboarding Help",
  "Report Expert / Client Behaviour",
  "Technical Bug",
] as const;

export const SUPPORT_SUBJECT_OPTIONS = PREDEFINED_SUPPORT_SUBJECTS.map((label) => ({
  value: label,
  label,
}));

export const SUPPORT_DESCRIPTION_MAX_LENGTH = 160;
export const SUPPORT_CUSTOM_SUBJECT_MAX_LENGTH = 120;

export type SupportRequesterRole = "seeker" | "expert";

export type SupportMeProfile = {
  id: string;
  role: SupportRequesterRole;
  fullName: string;
  email: string;
  phone: string;
};

export type SupportTicketRecord = {
  id: string;
  ticketNumber: string;
  requesterType: SupportRequesterRole;
  requesterId: string;
  requesterName: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
  status: "open" | "closed";
  lastReplyBy?: "requester" | "admin" | null;
  viewerStatus?: SupportViewerStatus;
  statusLabel?: string;
  adminNotifiedAt?: string | null;
  lastRepliedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSupportTicketPayload = {
  email: string;
  phone: string;
  subject: string;
  description: string;
};

export type SupportFormValidationErrors = {
  email?: string;
  phone?: string;
  subject?: string;
  description?: string;
};

export function isAdminRoutePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isOnboardingDarkThemePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/expert/expert-onboarding") ||
    pathname.startsWith("/seeker/seeker-onboarding") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")
  );
}

/**
 * Resolves the active seeker or expert token for support endpoints, matching
 * how `getToken()` / `resolveAuthToken('/api/notifications')` in `lib/api.ts` works:
 * - Never returns an admin token on `/admin/*` routes.
 * - On `/seeker/*` or `/checkout/*` routes, prefers `getSeekerToken()`, falling back to `getExpertToken()`.
 * - On `/expert/*` routes, prefers `getExpertToken()`, falling back to `getSeekerToken()`.
 * - On `/login` with `?role=user` or `?role=seeker`, prefers `getSeekerToken()`; with `?role=expert`, prefers `getExpertToken()`.
 * - Elsewhere, delegates to `getToken()` (`getExpertToken() || getSeekerToken()`).
 */
export function resolveSupportAuthToken(
  pathname?: string | null,
  search?: string | null,
): string | null {
  const activePath =
    pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  if (isAdminRoutePath(activePath)) {
    return null;
  }

  const seekerToken = getSeekerToken();
  const expertToken = getExpertToken();

  if (activePath.startsWith("/seeker") || activePath.startsWith("/checkout")) {
    return seekerToken || expertToken;
  }
  if (activePath.startsWith("/expert")) {
    return expertToken || seekerToken;
  }
  if (activePath.startsWith("/register")) {
    return seekerToken || expertToken;
  }
  if (activePath.startsWith("/login")) {
    const query =
      search ?? (typeof window !== "undefined" ? window.location.search : "");
    if (query.includes("role=user") || query.includes("role=seeker")) {
      return seekerToken || expertToken;
    }
    if (query.includes("role=expert")) {
      return expertToken || seekerToken;
    }
  }

  return getToken();
}

/**
 * Mirrors `normalizeSupportPhone` from `backend/controllers/supportController.js`:
 * strips non-digits, leading `91` on 12 digits, leading `910` on 13 digits,
 * and leading `0` on 11 digits.
 */
export function normalizeSupportPhone(value: string): string {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 13 && digits.startsWith("910")) {
    digits = digits.slice(3);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits;
}

export function isValidSupportPhone(value: string): boolean {
  return /^\d{10}$/.test(normalizeSupportPhone(value));
}

export function validateSupportCustomSubject(label: string): string | null {
  const trimmed = label.trim();
  if (trimmed.length < 2 || trimmed.length > SUPPORT_CUSTOM_SUBJECT_MAX_LENGTH) {
    return `Subject must be between 2 and ${SUPPORT_CUSTOM_SUBJECT_MAX_LENGTH} characters.`;
  }
  if (/[<>]/.test(trimmed)) {
    return "Subject must contain plain text only (no HTML tags).";
  }
  return null;
}

export function validateSupportFormInput(
  input: CreateSupportTicketPayload,
): {
  valid: boolean;
  errors: SupportFormValidationErrors;
  values: CreateSupportTicketPayload;
} {
  const errors: SupportFormValidationErrors = {};
  const rawEmail = (input.email ?? "").trim();
  const rawPhone = (input.phone ?? "").trim();
  const rawSubject = (input.subject ?? "").trim();
  const rawDescription = (input.description ?? "").trim();

  const emailErr = getEmailValidationError(rawEmail, {
    requiredMessage: "Email address is required.",
    invalidMessage: "Enter a valid email address.",
  });
  if (emailErr) {
    errors.email = emailErr;
  }

  const normalizedPhone = normalizeSupportPhone(rawPhone);
  if (!rawPhone) {
    errors.phone = "Mobile number is required.";
  } else if (!/^\d{10}$/.test(normalizedPhone)) {
    errors.phone = "Enter a valid 10-digit mobile number.";
  }

  const isPredefinedSubject = (PREDEFINED_SUPPORT_SUBJECTS as readonly string[]).includes(
    rawSubject,
  );
  if (!rawSubject) {
    errors.subject = "Subject is required.";
  } else if (!isPredefinedSubject) {
    const customSubjectErr = validateSupportCustomSubject(rawSubject);
    if (customSubjectErr) {
      errors.subject = customSubjectErr;
    }
  }

  if (!rawDescription) {
    errors.description = "Issue description is required.";
  } else if (
    rawDescription.length < 1 ||
    rawDescription.length > SUPPORT_DESCRIPTION_MAX_LENGTH
  ) {
    errors.description = `Issue description must be between 1 and ${SUPPORT_DESCRIPTION_MAX_LENGTH} characters.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values: {
      email: rawEmail.toLowerCase(),
      phone: normalizedPhone,
      subject: rawSubject,
      description: rawDescription,
    },
  };
}

export async function fetchSupportMe(
  pathname?: string | null,
): Promise<{ user: SupportMeProfile; categories: string[] }> {
  const token = resolveSupportAuthToken(pathname);
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${publicApiBase()}/api/support/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    user?: SupportMeProfile;
    categories?: string[];
  };

  if (!response.ok || !data.user) {
    throw new Error(data.message || "Unable to load support profile");
  }

  return {
    user: {
      ...data.user,
      phone: normalizeSupportPhone(data.user.phone || ""),
    },
    categories: Array.isArray(data.categories)
      ? data.categories
      : [...PREDEFINED_SUPPORT_SUBJECTS],
  };
}

export const OPEN_SUPPORT_FORM_EVENT = "jatayu:support:open_form";

export function openGlobalSupportForm(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_SUPPORT_FORM_EVENT));
}

export const MY_SUPPORT_TICKETS_UPDATED_EVENT = "jatayu:support:tickets_updated";

export function dispatchMySupportTicketsUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MY_SUPPORT_TICKETS_UPDATED_EVENT));
}

export async function getMySupportSummary(
  pathname?: string | null,
): Promise<{ responseReceivedCount: number }> {
  const token = resolveSupportAuthToken(pathname);
  if (!token) {
    return { responseReceivedCount: 0 };
  }

  const response = await fetch(`${publicApiBase()}/api/support/tickets/summary`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load support summary");
  }

  const data = (await response.json().catch(() => ({}))) as {
    responseReceivedCount?: number;
  };
  return {
    responseReceivedCount: Math.max(0, Number(data.responseReceivedCount) || 0),
  };
}

export type MySupportDbStatus = "open" | "closed";
export type MySupportLastReplyBy = "requester" | "admin" | null;
export type MySupportAuthorType = "admin" | "seeker" | "expert";

export type MySupportTicketSummary = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: MySupportDbStatus;
  lastReplyBy: MySupportLastReplyBy;
  viewerStatus: SupportViewerStatus;
  statusLabel: string;
  createdAt: string;
  lastRepliedAt: string | null;
  closedAt: string | null;
  replyCount: number;
};

export type MySupportReply = {
  id: string;
  authorType: MySupportAuthorType;
  authorName: string;
  adminName?: string;
  message: string;
  createdAt: string;
};

export type MySupportThreadItem = {
  id: string;
  authorType: MySupportAuthorType;
  authorName: string;
  message: string;
  createdAt: string;
  isInitial: boolean;
};

export type MySupportTicketDetail = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: MySupportDbStatus;
  lastReplyBy: MySupportLastReplyBy;
  viewerStatus: SupportViewerStatus;
  statusLabel: string;
  createdAt: string;
  lastRepliedAt: string | null;
  closedAt: string | null;
  replies: MySupportReply[];
  thread?: MySupportThreadItem[];
};

export type MySupportTicketsCounts = {
  all: number;
  in_progress: number;
  response_received: number;
  closed: number;
};

export type MySupportTicketsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type MySupportTicketsResponse = {
  items: MySupportTicketSummary[];
  counts: MySupportTicketsCounts;
  pagination: MySupportTicketsPagination;
};

export type MySupportTicketDetailResponse = {
  ticket: MySupportTicketDetail;
};

export type MySupportReplyResponse = {
  message: string;
  reply: MySupportReply;
  ticket: MySupportTicketDetail;
};

export type MySupportApiError = Error & {
  status?: number;
  code?: string;
};

export async function getMySupportTickets(
  {
    page = 1,
    limit = 10,
    status = "all",
  }: {
    page?: number;
    limit?: number;
    status?: "all" | Exclude<SupportViewerStatusKey, "new">;
  } = {},
  pathname?: string | null,
): Promise<MySupportTicketsResponse> {
  const token = resolveSupportAuthToken(pathname);
  if (!token) {
    throw new Error("Not authenticated");
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status && status !== "all") {
    params.set("status", status);
  }

  const response = await fetch(
    `${publicApiBase()}/api/support/tickets?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  const data = (await response.json().catch(() => ({}))) as MySupportTicketsResponse & {
    message?: string;
    code?: string;
  };

  if (!response.ok) {
    const err = new Error(
      data?.message || "Failed to load support tickets",
    ) as MySupportApiError;
    err.status = response.status;
    if (typeof data?.code === "string") err.code = data.code;
    throw err;
  }

  return {
    items: Array.isArray(data.items) ? data.items : [],
    counts: {
      all: data.counts?.all ?? 0,
      in_progress: data.counts?.in_progress ?? 0,
      response_received: data.counts?.response_received ?? 0,
      closed: data.counts?.closed ?? 0,
    },
    pagination: data.pagination || { page, limit, total: 0, totalPages: 1 },
  };
}

export async function getMySupportTicket(
  ticketId: string,
  pathname?: string | null,
): Promise<MySupportTicketDetailResponse> {
  const token = resolveSupportAuthToken(pathname);
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${publicApiBase()}/api/support/tickets/${encodeURIComponent(ticketId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  const data = (await response.json().catch(() => ({}))) as MySupportTicketDetailResponse & {
    message?: string;
    code?: string;
  };

  if (!response.ok || !data.ticket) {
    const err = new Error(
      data?.message || "Support ticket not found",
    ) as MySupportApiError;
    err.status = response.status;
    if (typeof data?.code === "string") err.code = data.code;
    throw err;
  }

  return data;
}

export async function createMySupportReply(
  ticketId: string,
  message: string,
  pathname?: string | null,
): Promise<MySupportReplyResponse> {
  const token = resolveSupportAuthToken(pathname);
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${publicApiBase()}/api/support/tickets/${encodeURIComponent(ticketId)}/replies`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    },
  );

  const data = (await response.json().catch(() => ({}))) as MySupportReplyResponse & {
    message?: string;
    code?: string;
  };

  if (!response.ok || !data.ticket) {
    const err = new Error(
      data?.message || "Failed to send reply. Please try again.",
    ) as MySupportApiError;
    err.status = response.status;
    if (typeof data?.code === "string") err.code = data.code;
    throw err;
  }

  dispatchMySupportTicketsUpdated();
  return data;
}

export async function submitSupportTicket(
  payload: CreateSupportTicketPayload,
  pathname?: string | null,
): Promise<{ message: string; ticket: SupportTicketRecord }> {
  const token = resolveSupportAuthToken(pathname);
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${publicApiBase()}/api/support/tickets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    ticket?: SupportTicketRecord;
    errors?: SupportFormValidationErrors;
  };

  if (!response.ok || !data.ticket) {
    throw new Error(
      data.message || "Something went wrong, please raise the ticket again.",
    );
  }

  dispatchMySupportTicketsUpdated();

  return {
    message: data.message || "Your support request has been submitted.",
    ticket: data.ticket,
  };
}
