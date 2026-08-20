import { getStoredRequests, formatRequestPrice } from "./expertRequests";

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
  status: "new" | "pending" | "accepted" | "declined";
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
};

export function getRequestDetailById(requestId: string): RequestDetailModel {
  const list = getStoredRequests();
  const found = list.find((item) => item.id === requestId);

  if (!found) {
    return REQUEST_DETAIL_DATA;
  }

  const raw = (found.rawItem || {}) as Record<string, unknown>;
  const seeker = (raw.seeker || {}) as Record<string, unknown>;
  const amounts = (raw.amounts || {}) as Record<string, unknown>;

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
      seeker.category ||
      raw.seekerCategory ||
      ""
  );

  return {
    id: found.id,
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
      ...(found.status === "accepted"
        ? [
            {
              id: "hist-3",
              title: "Request Accepted",
              timestamp: "Recently",
              description: "Expert accepted the request and confirmed session schedule.",
              actor: "Expert",
            },
          ]
        : found.status === "declined"
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
  };
}
