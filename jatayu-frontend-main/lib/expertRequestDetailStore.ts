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
  title: "Product Strategy Workshop",
  subtitle: "Product Strategy Workshop — Full Day",
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
      totalSpent: "$2,400",
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
    duration: "Full Day - 8 hours",
    format: "Video Call (Zoom)",
    participantsCount: "8 team members",
    language: "English",
    recurrence: "One-time session",
    proposedPrice: "$2,400.00",
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
      description: "Escrow funds held in full ($2,400.00).",
      actor: "System",
    },
  ],
};
