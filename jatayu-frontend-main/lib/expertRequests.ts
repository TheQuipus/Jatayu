export type RequestStatus = "new" | "pending" | "accepted" | "declined";

export type ClientRequest = {
  id: string;
  clientName: string;
  clientAvatar: string;
  title: string;
  description: string;
  status: RequestStatus;
  urgent?: boolean;
  price: number;
  timeAgo: string;
  dateLabel: string;
  durationLabel: string;
  formatLabel: string;
  createdAt: number;
};

export type RequestStatusFilter = "all" | RequestStatus;

export type RequestSort = "newest" | "oldest";

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  new: "New",
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
};

export const REQUEST_SUMMARY = {
  new: 3,
  pending: 2,
  accepted: 18,
  declined: 4,
} as const;

export const CLIENT_REQUESTS: ClientRequest[] = [
  {
    id: "req-1",
    clientName: "Marcus Williams",
    clientAvatar: "/assets/img/avatar2.png",
    title: "Product Strategy Workshop — Full Day",
    description:
      "I'm an early-stage startup founder looking for a comprehensive product strategy session. We need help defining our roadmap, prioritising features, and aligning our team around a clear vision for the next 12 months.",
    status: "new",
    urgent: true,
    price: 96000,
    timeAgo: "32 min ago",
    dateLabel: "Dec 20, 2024",
    durationLabel: "Full day — 8 hrs",
    formatLabel: "Video call",
    createdAt: Date.now() - 32 * 60 * 1000,
  },
  {
    id: "req-2",
    clientName: "Priya Sharma",
    clientAvatar: "/assets/img/avatar3.png",
    title: "D2C Growth Strategy Session",
    description:
      "Running a D2C skincare brand and need expert guidance on scaling paid acquisition while improving retention. Looking for actionable frameworks we can implement immediately.",
    status: "pending",
    price: 68000,
    timeAgo: "2h ago",
    dateLabel: "Flexible within next 2 weeks",
    durationLabel: "1 hr",
    formatLabel: "Video call",
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: "req-3",
    clientName: "James Whitfield",
    clientAvatar: "/assets/img/avatar4.png",
    title: "UX Audit for SaaS Dashboard",
    description:
      "We recently launched a B2B analytics dashboard and user feedback suggests navigation issues. Need a thorough UX audit with specific recommendations.",
    status: "new",
    price: 45000,
    timeAgo: "5h ago",
    dateLabel: "Dec 22, 2024",
    durationLabel: "90 min",
    formatLabel: "Video call",
    createdAt: Date.now() - 5 * 60 * 60 * 1000,
  },
  {
    id: "req-4",
    clientName: "Ananya Kapoor",
    clientAvatar: "/assets/img/avatar1.png",
    title: "Seed Round Pitch Deck Review",
    description:
      "Preparing for investor meetings next month. Would like feedback on our pitch deck narrative, financial projections slide, and overall storytelling.",
    status: "new",
    price: 32000,
    timeAgo: "1d ago",
    dateLabel: "Dec 18, 2024",
    durationLabel: "45 min",
    formatLabel: "Video call",
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
  },
  {
    id: "req-5",
    clientName: "Arjun Patel",
    clientAvatar: "/assets/img/avatar2.png",
    title: "Team OKR Framework Setup",
    description:
      "Growing from 15 to 40 people and need help implementing an OKR framework that works for a hybrid product-engineering org.",
    status: "pending",
    price: 52000,
    timeAgo: "1d ago",
    dateLabel: "Jan 5, 2025",
    durationLabel: "2 hrs",
    formatLabel: "Video call",
    createdAt: Date.now() - 26 * 60 * 60 * 1000,
  },
];

export function getRequestCounts() {
  const total =
    REQUEST_SUMMARY.new +
    REQUEST_SUMMARY.pending +
    REQUEST_SUMMARY.accepted +
    REQUEST_SUMMARY.declined;

  return {
    all: total,
    new: REQUEST_SUMMARY.new,
    pending: REQUEST_SUMMARY.pending,
    accepted: REQUEST_SUMMARY.accepted,
    declined: REQUEST_SUMMARY.declined,
  };
}

export function formatRequestPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
