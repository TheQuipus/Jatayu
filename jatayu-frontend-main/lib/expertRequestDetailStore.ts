import { getStoredRequests, formatRequestPrice } from "./expertRequests";
import { formatUtcRelativeTime, formatUtcToLocalDate, formatUtcToLocalTime, parseUtcDate } from "./dateTimeUtils";

export type RequestDetailAttachment = {
  id: string;
  name: string;
  size: string;
  uploadedTime: string;
  type: "pdf" | "excel" | "doc" | "image";
  url: string;
};

export type RequestDetailHistoryEvent = {
  id: string;
  title: string;
  timestamp: string;
  description: string;
  actor: string;
};

export type RequestDetailModel = {
  id: string;
  expertProfessionalTitle: string;
  title: string;
  subtitle: string;
  submittedDate: string;
  status: "new" | "pending" | "accepted" | "declined" | "completed" | "cancelled";
  statusText: string;
  timeReceivedAgo: string;
  respondTimeLeft: string;
  client: {
    name: string;
    avatar: string;
    role: string;
    company: string;
    location: string;
    timezone: string;
    isOnline: boolean;
    rating: number;
    totalSessions: number;
    isVerified: boolean;
    isPro: boolean;
    isOrg: boolean;
    stats: {
      sessionsBooked: number;
      totalSpent: string;
      completionRate: string;
    };
  };
  proposal: {
    summary: string;
    paragraphs: string[];
    tags: string[];
    scopeDeliverables: string[];
  };
  sessionDetails: {
    requestedDate: string;
    duration: string;
    format: string;
    participantsCount: string;
    language: string;
    recurrence: string;
    proposedPrice: string;
  };
  attachments: RequestDetailAttachment[];
  history: RequestDetailHistoryEvent[];
  sessionAccess?: {
    enabled: boolean;
    opensAt: string;
    closesAt: string;
    canJoin: boolean;
    joinBeforeMinutes: number;
  };
  scheduledEndAt?: string;
  scheduledStartAt?: string;
  paymentStatus: string;
  paymentDetails?: {
    consultationFee: string;
    platformFee: string;
    gst: string;
    creditsApplied: string;
    payable: string;
  };
};

export const REQUEST_DETAIL_DATA: RequestDetailModel = {
  id: "req-1",
  expertProfessionalTitle: "Business Strategy",
  title: "Product Strategy Workshop",
  subtitle: "Product Strategy Workshop — 09:00 AM - 05:00 PM",
  submittedDate: "Dec 17, 2024 at 10:32 AM",
  status: "new",
  statusText: "New Request — Awaiting your response",
  timeReceivedAgo: "Received 32 minutes ago",
  respondTimeLeft: "Respond within 24h 28m to maintain response rate",
  client: {
    name: "Marcus Williams",
    avatar: "/assets/img/avatar2.png",
    role: "Head of Product",
    company: "Nexus Technologies",
    location: "San Francisco, CA",
    timezone: "PST (UTC-8)",
    isOnline: true,
    rating: 5.0,
    totalSessions: 12,
    isVerified: true,
    isPro: true,
    isOrg: true,
    stats: {
      sessionsBooked: 3,
      totalSpent: "₹12,000",
      completionRate: "100%",
    },
  },
  proposal: {
    summary:
      "I'm looking for a senior UX strategist to help my team redefine our product vision and roadmap.",
    paragraphs: [
      "I'm looking for a senior UX strategist to help my team redefine our product vision and roadmap. We have a major product review coming up in 2 weeks and need a focused, outcome-driven strategy workshop session that will help us align around a clear direction.",
      "Ideally, we'd cover: current-state product audit, competitor landscape overview, user persona alignment, and a prioritized roadmap for Q1 2025. The team is 8 people — 3 product managers and 3 senior designers.",
      "We've done similar workshops before but lacked a structured framework. Looking for someone who can bring a proven methodology and keep the session on track while encouraging participation.",
    ],
    tags: [
      "Product Strategy",
      "UX Workshop",
      "Roadmap Planning",
      "Team Facilitation",
      "SaaS",
    ],
    scopeDeliverables: [
      "Pre-workshop discovery call & product audit review",
      "Full-day 8-hour interactive Zoom facilitation",
      "Prioritized Q1 2025 Product Roadmap canvas",
      "Post-session summary report & action items document",
    ],
  },
  sessionDetails: {
    requestedDate: "December 20, 2024",
    duration: "09:00 AM - 05:00 PM",
    format: "Video Call",
    participantsCount: "8 team members",
    language: "English",
    recurrence: "One-time session",
    proposedPrice: "₹12,000.00",
  },
  attachments: [
    {
      id: "att-1",
      name: "Product_Brief_Q1_2025.pdf",
      size: "2.4 MB",
      uploadedTime: "Uploaded 32 mins ago",
      type: "pdf",
      url: "#",
    },
    {
      id: "att-2",
      name: "Competitor_Analysis_Dec24.xlsx",
      size: "1.8 MB",
      uploadedTime: "Uploaded 32 mins ago",
      type: "excel",
      url: "#",
    },
  ],
  history: [
    {
      id: "hist-1",
      title: "Request Submitted",
      timestamp: "Dec 17, 2024 at 10:32 AM",
      description: "Marcus Williams submitted a new workshop request.",
      actor: "Marcus Williams",
    },
    {
      id: "hist-2",
      title: "Payment Authorized",
      timestamp: "Dec 17, 2024 at 10:32 AM",
      description: "Escrow funds held in full (₹12,000.00).",
      actor: "System",
    },
  ],
  paymentStatus: "authorized",
  paymentDetails: { consultationFee: "₹12,000", platformFee: "₹0", gst: "₹0", creditsApplied: "₹0", payable: "₹12,000" },
};

function arrayOfStrings(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return [];
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function formatTimestamp(value: unknown): string {
  const date = parseUtcDate(value as string | Date | number);
  if (!date) return "Not available";
  return `${formatUtcToLocalDate(date, { month: "short", day: "numeric", year: "numeric" })} at ${formatUtcToLocalTime(date)}`;
}

export function mapExpertRequestDetail(raw: Record<string, unknown>): RequestDetailModel {
  const seeker = objectValue(raw.seeker);
  const stats = objectValue(seeker.stats);
  const amounts = objectValue(raw.amounts);
  const payment = objectValue(raw.payment);
  const scheduledStart = parseUtcDate(raw.scheduledStartAt as string | Date | number);
  const scheduledEnd = parseUtcDate(raw.scheduledEndAt as string | Date | number);
  const requestedDate = scheduledStart
    ? formatUtcToLocalDate(scheduledStart, { month: "long", day: "numeric", year: "numeric", weekday: "long" })
    : "Not scheduled";
  const duration = scheduledStart && scheduledEnd
    ? `${formatUtcToLocalTime(scheduledStart)} - ${formatUtcToLocalTime(scheduledEnd)}`
    : "Not available";
  const durationMinutes = scheduledStart && scheduledEnd
    ? Math.max(0, Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / 60000))
    : 0;
  const type = String(raw.consultationType || "consultation").toLowerCase();
  const format = type === "video" ? "Video call" : type === "text" || type === "chat" ? "Text chat" : type === "group" ? "Group consultation" : type === "shoutout" ? "Shoutout" : type;
  const totalPaise = Number(amounts.consultationFee ?? raw.consultationFee ?? amounts.total ?? raw.totalAmount ?? 0);
  const totalRupees = String(amounts.unit || "paise") === "paise" ? totalPaise / 100 : totalPaise;
  const clientName = String(seeker.fullName || "Client");
  const clientCategory = String(seeker.category || "");
  const topics = arrayOfStrings(seeker.topics);
  const needChips = arrayOfStrings(seeker.selectedNeedChips);
  const context = String(raw.context || seeker.needsText || seeker.additionalContext || "No additional context provided.");
  const status = String(raw.requestStatus || raw.status || "new") as RequestDetailModel["status"];
  const responseSeconds = Number(raw.responseTimeRemainingSeconds || 0);
  const responseHours = Math.floor(responseSeconds / 3600);
  const responseMinutes = Math.floor((responseSeconds % 3600) / 60);
  const submittedAt = raw.expertRequestedAt || raw.createdAt;
  const history: RequestDetailHistoryEvent[] = [{ id: "submitted", title: "Request submitted", timestamp: formatTimestamp(submittedAt), description: `${clientName} submitted this booking request.`, actor: clientName }];
  if (payment.status || raw.paymentStatus) history.push({ id: "payment", title: "Payment updated", timestamp: formatTimestamp(payment.paidAt || payment.verifiedAt || raw.createdAt), description: `Payment status: ${String(raw.paymentStatus || payment.status).replaceAll("_", " ")}.`, actor: "System" });
  if (raw.expertRespondedAt) history.push({ id: "response", title: status === "declined" ? "Request declined" : "Request accepted", timestamp: formatTimestamp(raw.expertRespondedAt), description: status === "declined" ? String(raw.declineReasonNotes || raw.declineReasonCode || "Request declined by expert.") : "The expert accepted and confirmed the session.", actor: "Expert" });
  if (status === "completed") history.push({ id: "completed", title: "Session completed", timestamp: formatTimestamp(raw.scheduledEndAt), description: "The scheduled consultation duration ended.", actor: "System" });
  return {
    id: String(raw.id),
    expertProfessionalTitle: String(raw.expertProfessionalTitle || ""),
    title: String(raw.subject || "Consultation"),
    subtitle: `${String(raw.subject || "Consultation")} — ${duration}`,
    submittedDate: formatTimestamp(submittedAt),
    status,
    statusText: status === "new" ? "New Request — Awaiting your response" : status === "pending" ? "Pending Response" : status === "accepted" ? "Session Confirmed & Accepted" : status === "completed" ? "Session Completed" : status === "cancelled" ? "Session Cancelled" : "Request Declined",
    timeReceivedAgo: submittedAt ? `Received ${formatUtcRelativeTime(parseUtcDate(submittedAt as string | Date | number) || new Date())}` : "Received time unavailable",
    respondTimeLeft: responseSeconds > 0 ? `Respond within ${responseHours}h ${responseMinutes}m to maintain response rate` : status === "new" || status === "pending" ? "Response window has passed" : "Response completed",
    client: {
      name: clientName, avatar: String(seeker.profilePhotoSrc || "/assets/img/profile-placeholder.svg"), role: clientCategory,
      company: "", location: String(seeker.location || "Not provided"), timezone: String(raw.timezone || "Not provided"),
      isOnline: false, rating: 0, totalSessions: Number(stats.completedSessions || 0),
      isVerified: Boolean(seeker.isEmailVerified || seeker.isPhoneVerified), isPro: false, isOrg: false,
      stats: { sessionsBooked: Number(stats.sessionsBooked || 0), totalSpent: formatRequestPrice(Number(stats.totalSpent || 0) / 100), completionRate: `${Number(stats.completionRate || 0)}%` },
    },
    proposal: { summary: context, paragraphs: [context], tags: [...new Set([clientCategory, ...topics, ...needChips])].filter(Boolean), scopeDeliverables: [] },
    sessionDetails: { requestedDate, duration: durationMinutes ? `${duration} (${durationMinutes} minutes)` : duration, format, participantsCount: type === "group" ? "Group session" : "1-on-1 session", language: arrayOfStrings(seeker.selectedLanguages).join(", ") || "Not provided", recurrence: "One-time session", proposedPrice: formatRequestPrice(totalRupees) },
    attachments: [], history,
    sessionAccess: raw.sessionAccess && typeof raw.sessionAccess === "object" ? raw.sessionAccess as RequestDetailModel["sessionAccess"] : undefined,
    scheduledStartAt: raw.scheduledStartAt ? String(raw.scheduledStartAt) : undefined,
    scheduledEndAt: raw.scheduledEndAt ? String(raw.scheduledEndAt) : undefined,
    paymentStatus: String(raw.paymentStatus || payment.status || "not available").replaceAll("_", " "),
    paymentDetails: {
      consultationFee: formatRequestPrice(Number(amounts.consultationFee || 0) / 100),
      platformFee: formatRequestPrice(Number(amounts.platformFee || 0) / 100),
      gst: formatRequestPrice(Number(amounts.gst || 0) / 100),
      creditsApplied: formatRequestPrice(Number(amounts.creditAmount || 0) / 100),
      payable: formatRequestPrice(Number(amounts.payable || 0) / 100),
    },
  };
}

export function getRequestDetailById(requestId: string): RequestDetailModel {
  const list = getStoredRequests();
  const found = list.find((item) => item.id === requestId);

  if (!found) {
    return { ...REQUEST_DETAIL_DATA, id: requestId, title: "Loading request…", subtitle: "", client: { ...REQUEST_DETAIL_DATA.client, name: "Loading…", role: "", company: "", location: "", timezone: "", rating: 0, totalSessions: 0, isVerified: false, isPro: false, isOrg: false, stats: { sessionsBooked: 0, totalSpent: "₹0", completionRate: "0%" } }, attachments: [], history: [] };
  }

  const raw = (found.rawItem || {}) as Record<string, unknown>;
  const seeker = (raw.seeker || {}) as Record<string, unknown>;
  const amounts = (raw.amounts || {}) as Record<string, unknown>;
  const sessionAccess = raw.sessionAccess && typeof raw.sessionAccess === "object"
    ? raw.sessionAccess as RequestDetailModel["sessionAccess"]
    : undefined;

  const clientName = String(seeker.fullName || found.clientName || "Client");
  const clientAvatar = String(seeker.profilePhotoSrc || found.clientAvatar || "/assets/img/avatar2.png");
  const clientLocation = String(seeker.location || raw.seekerLocation || "India");
  const clientCategory = String(seeker.category || raw.seekerCategory || "");
  const timezoneStr = String(raw.timezone || seeker.timezone || "Asia/Calcutta");

  const languagesList = Array.isArray(seeker.selectedLanguages)
    ? (seeker.selectedLanguages as string[]).map(String)
    : ["English"];

  const contextText = String(raw.context || found.description || "");

  let feeTotal = found.price;
  if (typeof amounts.total === "number") {
    feeTotal = amounts.unit === "paise" ? Math.round(amounts.total / 100) : amounts.total;
  }

  const expertProfTitle = String(
    raw.expertProfessionalTitle ||
      found.expertProfessionalTitle ||
      raw.professionalTitle ||
      ""
  );

  return {
    id: found.id,
    scheduledEndAt: found.scheduledEndAt,
    expertProfessionalTitle: expertProfTitle,
    title: found.title,
    subtitle: `${found.title} — ${found.durationLabel}`,
    submittedDate: found.dateLabel,
    status: found.status,
    statusText:
      found.status === "new"
        ? "New Request — Awaiting your response"
        : found.status === "pending"
        ? "Pending Response"
        : found.status === "accepted"
        ? "Session Confirmed & Accepted"
        : found.status === "completed"
        ? "Session Completed"
        : found.status === "cancelled"
        ? "Session Cancelled"
        : "Request Declined",
    timeReceivedAgo: `Received ${found.timeAgo}`,
    respondTimeLeft: "Respond within 24h to maintain response rate",
    client: {
      name: clientName,
      avatar: clientAvatar,
      role: clientCategory,
      company: "Jatayu Member",
      location: clientLocation,
      timezone: timezoneStr,
      isOnline: true,
      rating: 5.0,
      totalSessions: 1,
      isVerified: true,
      isPro: true,
      isOrg: false,
      stats: {
        sessionsBooked: 1,
        totalSpent: formatRequestPrice(feeTotal),
        completionRate: "100%",
      },
    },
    proposal: {
      summary: contextText,
      paragraphs: [contextText].filter(Boolean),
      tags: [clientCategory, found.formatLabel, "1:1 Consultation"].filter(Boolean),
      scopeDeliverables: [
        `1:1 Consultation session (${found.durationLabel})`,
        "Direct guidance & answers to submitted context",
        "Post-session recommendations",
      ],
    },
    sessionDetails: {
      requestedDate: found.dateLabel,
      duration: found.durationLabel,
      format: found.formatLabel,
      participantsCount: "1-on-1 session",
      language: languagesList.join(", "),
      recurrence: "One-time session",
      proposedPrice: formatRequestPrice(feeTotal),
    },
    attachments: REQUEST_DETAIL_DATA.attachments,
    history: [
      {
        id: "hist-1",
        title: "Request Submitted",
        timestamp: found.dateLabel,
        description: `${clientName} submitted a session request.`,
        actor: clientName,
      },
      {
        id: "hist-2",
        title: "Payment Authorized",
        timestamp: found.dateLabel,
        description: `Escrow funds held in full (${formatRequestPrice(feeTotal)}).`,
        actor: "System",
      },
      ...(found.status === "accepted" || found.status === "completed"
        ? [
            {
              id: "hist-3",
              title: "Request Accepted",
              timestamp: "Recently",
              description: "Expert accepted the request and confirmed session schedule.",
              actor: "Expert",
            },
            ...(found.status === "completed"
              ? [{
                  id: "hist-4",
                  title: "Session Completed",
                  timestamp: found.scheduledEndAt || "Recently",
                  description: "The scheduled consultation duration has ended.",
                  actor: "System",
                }]
              : []),
          ]
        : found.status === "declined" || found.status === "cancelled"
        ? [
            {
              id: "hist-3",
              title: "Request Declined",
              timestamp: "Recently",
              description: `Expert declined request. Reason: ${found.declineReason || "Not specified"}.`,
              actor: "Expert",
            },
          ]
        : []),
    ],
    sessionAccess,
    paymentStatus: String(raw.paymentStatus || "not available").replaceAll("_", " "),
    paymentDetails: {
      consultationFee: formatRequestPrice(Number(amounts.consultationFee || 0) / 100),
      platformFee: formatRequestPrice(Number(amounts.platformFee || 0) / 100),
      gst: formatRequestPrice(Number(amounts.gst || 0) / 100),
      creditsApplied: formatRequestPrice(Number(amounts.creditAmount || 0) / 100),
      payable: formatRequestPrice(Number(amounts.payable || 0) / 100),
    },
  };
}
