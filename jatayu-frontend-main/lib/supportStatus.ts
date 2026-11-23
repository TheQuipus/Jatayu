export type SupportViewerStatusKey =
  | "new"
  | "in_progress"
  | "response_received"
  | "closed";

export type SupportViewerStatus = {
  key: SupportViewerStatusKey;
  label: string;
};

export type SupportStatusBadgeTone = "red" | "amber" | "neutral" | "muted";

export type SupportStatusMeta = {
  key: SupportViewerStatusKey;
  label: string;
  badgeTone: SupportStatusBadgeTone;
};

export const SUPPORT_STATUS_META: Record<SupportViewerStatusKey, SupportStatusMeta> = {
  new: {
    key: "new",
    label: "New",
    badgeTone: "red",
  },
  in_progress: {
    key: "in_progress",
    label: "In Progress",
    badgeTone: "neutral",
  },
  response_received: {
    key: "response_received",
    label: "Response Received",
    badgeTone: "amber",
  },
  closed: {
    key: "closed",
    label: "Closed",
    badgeTone: "muted",
  },
};

export function isSupportViewerStatusKey(value: unknown): value is SupportViewerStatusKey {
  return (
    value === "new" ||
    value === "in_progress" ||
    value === "response_received" ||
    value === "closed"
  );
}

export function getSupportStatusMeta(key: SupportViewerStatusKey): SupportStatusMeta {
  return SUPPORT_STATUS_META[key] || SUPPORT_STATUS_META.in_progress;
}

export function resolveTicketViewerStatus(
  ticket: {
    status?: string | null;
    lastReplyBy?: "requester" | "admin" | null;
    viewerStatus?: { key?: string; label?: string } | null;
  } | null | undefined,
  viewerRole: "admin" | "requester" = "admin",
): SupportStatusMeta {
  if (ticket?.viewerStatus && isSupportViewerStatusKey(ticket.viewerStatus.key)) {
    return getSupportStatusMeta(ticket.viewerStatus.key);
  }

  const dbStatus = String(ticket?.status || "open").toLowerCase();
  if (dbStatus === "closed") {
    return SUPPORT_STATUS_META.closed;
  }

  const lastReplyBy = ticket?.lastReplyBy ? String(ticket.lastReplyBy).toLowerCase() : null;
  if (!lastReplyBy) {
    return viewerRole === "admin"
      ? SUPPORT_STATUS_META.new
      : SUPPORT_STATUS_META.in_progress;
  }

  if (lastReplyBy === "requester") {
    return viewerRole === "admin"
      ? SUPPORT_STATUS_META.response_received
      : SUPPORT_STATUS_META.in_progress;
  }

  return viewerRole === "admin"
    ? SUPPORT_STATUS_META.in_progress
    : SUPPORT_STATUS_META.response_received;
}
