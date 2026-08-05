export type RequestStatus = "new" | "pending" | "accepted" | "declined";

export type ClientRequest = {
  id: string;
  clientName: string;
  clientAvatar: string;
  title: string;
  description: string;
  status: RequestStatus;
  urgent?: boolean;
  repeatClient?: boolean;
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
      "I'm looking for a senior UX strategist to help my team redefine our product vision. We have a product review in 2 weeks and need a focused strategy workshop session...",
    status: "new",
    urgent: true,
    price: 1200,
    timeAgo: "32 min ago",
    dateLabel: "Dec 20, 2024",
    durationLabel: "Full day · 8 hrs",
    formatLabel: "Video call",
    createdAt: Date.now() - 32 * 60 * 1000,
  },
  {
    id: "req-2",
    clientName: "Elena Vasquez",
    clientAvatar: "/assets/img/avatar3.png",
    title: "UX Audit — SaaS Platform Redesign",
    description:
      "We've recently shipped a new version of our dashboard and users are reporting confusion with the navigation. Looking for a thorough UX audit with actionable recommendations...",
    status: "new",
    price: 580,
    timeAgo: "1 hr ago",
    dateLabel: "Flexible - Jan 2025",
    durationLabel: "2 hrs session",
    formatLabel: "Async + live",
    createdAt: Date.now() - 60 * 60 * 1000,
  },
  {
    id: "req-3",
    clientName: "David Park",
    clientAvatar: "/assets/img/avatar4.png",
    title: "Design Systems Consultation — 4-week Engagement",
    description:
      "Following up on our previous session. Ready to move forward with the full design system buildout. Looking to engage for approximately 4 weeks, 2 sessions per week...",
    status: "new",
    repeatClient: true,
    price: 3200,
    timeAgo: "3 hrs ago",
    dateLabel: "Starting Jan 6",
    durationLabel: "4 wk · 8 sessions",
    formatLabel: "Video call",
    createdAt: Date.now() - 3 * 60 * 60 * 1000,
  },
  {
    id: "req-4",
    clientName: "Priya Sharma",
    clientAvatar: "/assets/img/avatar1.png",
    title: "D2C Growth Strategy Session",
    description:
      "Running a D2C skincare brand and need expert guidance on scaling paid acquisition while improving retention. Looking for actionable frameworks we can implement immediately.",
    status: "pending",
    price: 850,
    timeAgo: "1d ago",
    dateLabel: "Flexible within next 2 weeks",
    durationLabel: "1 hr",
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
    price: 1500,
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
  return `$${amount.toLocaleString("en-US")}`;
}

