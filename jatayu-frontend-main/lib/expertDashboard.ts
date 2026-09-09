export type ExpertNavItem = {
  id: string;
  label: string;
  href: string;
  badge?: number;
};

export type ProfileChecklistItem = {
  id: string;
  label: string;
  status: "done" | "pending";
};

export type ExpertStat = {
  id: string;
  label: string;
  value: string;
  delta: string;
  deltaType: "positive" | "neutral" | "alert";
  icon: "calendar" | "star" | "users" | "inbox" | "calendar-check" | "clock" | "timer" | "trend";
};

export type EarningsMonth = {
  month: string;
  amount: number;
};

export type EarningsDataPoint = {
  label: string;
  amount: number;
};

export type EarningsTimeframe = "day" | "month" | "year";

export type EarningsTimeframeData = {
  total: number;
  delta: string;
  label: string;
  points: EarningsDataPoint[];
};

export type ExpertSession = {
  id: string;
  title: string;
  client: string;
  timeLabel: string;
  dayLabel: string;
  isToday?: boolean;
};

export type ExpertMessage = {
  id: string;
  client: string;
  avatar: string;
  preview: string;
  timeAgo: string;
  unread: boolean;
};

export type ExpertTopReview = {
  id: string;
  client: string;
  role: string;
  avatar: string;
  rating: number;
  sessionTitle: string;
  comment: string;
  date: string;
};

export type QuickAction = {
  id: string;
  label: string;
  href: string;
  icon: "calendar" | "pencil" | "upload";
};

export const EXPERT_DASHBOARD_HREF = "/expert/dashboard/";
export const EXPERT_ONBOARDING_HREF = "/expert/expert-onboarding/";
export const EXPERT_PROFILE_HREF = "/expert/profile/";

import { DEFAULT_EXPERT_PROFILE } from "@/lib/expertProfile";

export const EXPERT_PROFILE = {
  name: DEFAULT_EXPERT_PROFILE.name,
  role: DEFAULT_EXPERT_PROFILE.role,
  avatar: DEFAULT_EXPERT_PROFILE.avatar,
  greeting: "Good morning",
};

export const PROFILE_STRENGTH = 78;

export const PROFILE_CHECKLIST: ProfileChecklistItem[] = [
  { id: "category", label: "Expert category", status: "done" },
  { id: "skills", label: "Skills & expertise", status: "done" },
  { id: "experience", label: "Work experience", status: "done" },
  { id: "identity", label: "Profile identity", status: "done" },
  { id: "credentials", label: "Credentials & KYC", status: "done" },
  { id: "preferences", label: "Consultation preferences", status: "done" },
  { id: "audience", label: "Target audience", status: "done" },
  { id: "availability", label: "Availability schedule", status: "pending" },
  { id: "review", label: "Review & submit", status: "pending" },
];

export const EXPERT_STATS: ExpertStat[] = [
  {
    id: "sessions",
    label: "Sessions Done",
    value: "24",
    delta: "+12%",
    deltaType: "positive",
    icon: "calendar",
  },
  {
    id: "rating",
    label: "Avg Rating",
    value: "4.9",
    delta: "+0.2",
    deltaType: "positive",
    icon: "star",
  },
  {
    id: "clients",
    label: "Total Clients",
    value: "31",
    delta: "+5",
    deltaType: "positive",
    icon: "users",
  },
  {
    id: "requests",
    label: "Pending Requests",
    value: "3",
    delta: "New",
    deltaType: "alert",
    icon: "inbox",
  },
  {
    id: "weekly-hours",
    label: "Weekly hours",
    value: "22 hrs",
    delta: "+2 hrs",
    deltaType: "positive",
    icon: "clock",
  },
  {
    id: "avg-response",
    label: "Average response",
    value: "< 30m",
    delta: "Top 12%",
    deltaType: "positive",
    icon: "timer",
  },
  {
    id: "booking-rate",
    label: "Booking rate",
    value: "87%",
    delta: "+6%",
    deltaType: "positive",
    icon: "trend",
  },
];

export const EARNINGS_TOTAL = 84200;
export const EARNINGS_DELTA = "+18%";

export const EARNINGS_BY_MONTH: EarningsMonth[] = [
  { month: "Jul", amount: 42000 },
  { month: "Aug", amount: 51000 },
  { month: "Sep", amount: 48000 },
  { month: "Oct", amount: 62000 },
  { month: "Nov", amount: 71000 },
  { month: "Dec", amount: 84200 },
];

export const EARNINGS_DATA: Record<EarningsTimeframe, EarningsTimeframeData> = {
  day: {
    total: 38400,
    delta: "+12% this week",
    label: "Past 7 Days",
    points: [
      { label: "Mon", amount: 3500 },
      { label: "Tue", amount: 6200 },
      { label: "Wed", amount: 4800 },
      { label: "Thu", amount: 7500 },
      { label: "Fri", amount: 5400 },
      { label: "Sat", amount: 8200 },
      { label: "Sun", amount: 2800 },
    ],
  },
  month: {
    total: 84200,
    delta: "+18% this month",
    label: "Last 6 Months",
    points: [
      { label: "Jul", amount: 42000 },
      { label: "Aug", amount: 51000 },
      { label: "Sep", amount: 48000 },
      { label: "Oct", amount: 62000 },
      { label: "Nov", amount: 71000 },
      { label: "Dec", amount: 84200 },
    ],
  },
  year: {
    total: 391000,
    delta: "+34% this year",
    label: "Past 4 Years",
    points: [
      { label: "2023", amount: 52000 },
      { label: "2024", amount: 98000 },
      { label: "2025", amount: 157000 },
      { label: "2026", amount: 391000 },
    ],
  },
};

export const UPCOMING_SESSIONS: ExpertSession[] = [
  {
    id: "session-1",
    title: "Strategy Deep Dive",
    client: "James Whitfield",
    timeLabel: "10:00 AM",
    dayLabel: "Today",
    isToday: true,
  },
  {
    id: "session-2",
    title: "UX Audit Review",
    client: "Priya Sharma",
    timeLabel: "2:30 PM",
    dayLabel: "Tomorrow",
  },
  {
    id: "session-3",
    title: "Product Roadmap",
    client: "Arjun Patel",
    timeLabel: "11:00 AM",
    dayLabel: "Thu",
  },
];

export type ExpertRecentSession = {
  id: string;
  client: string;
  clientRole?: string;
  avatar: string;
  sessionTitle: string;
  dateLabel: string;
  durationLabel: string;
  payout: string;
  status: "Completed" | "Confirmed" | "In Review";
};

export const RECENT_SESSIONS: ExpertRecentSession[] = [
  {
    id: "rs-1",
    client: "Marcus Williams",
    clientRole: "Head of Product",
    avatar: "/assets/img/avatar2.png",
    sessionTitle: "Product Strategy Workshop",
    dateLabel: "Dec 16, 2024",
    durationLabel: "60 mins · 1:1 Video",
    payout: "₹10,800",
    status: "Completed",
  },
  {
    id: "rs-2",
    client: "Elena Vasquez",
    clientRole: "Design Lead",
    avatar: "/assets/img/avatar3.png",
    sessionTitle: "UX Audit & Design Review",
    dateLabel: "Dec 12, 2024",
    durationLabel: "45 mins · 1:1 Video",
    payout: "₹8,400",
    status: "Completed",
  },
  {
    id: "rs-3",
    client: "David Park",
    clientRole: "VP of Engineering",
    avatar: "/assets/img/avatar4.png",
    sessionTitle: "Cloud Architecture Review",
    dateLabel: "Dec 05, 2024",
    durationLabel: "60 mins · 1:1 Video",
    payout: "₹12,000",
    status: "Completed",
  },
];

export const RECENT_MESSAGES: ExpertMessage[] = [
  {
    id: "msg-1",
    client: "James Whitfield",
    avatar: "/assets/img/avatar2.png",
    preview: "Thanks for the session notes — can we schedule a follow-up?",
    timeAgo: "12m ago",
    unread: true,
  },
  {
    id: "msg-2",
    client: "Priya Sharma",
    avatar: "/assets/img/avatar3.png",
    preview: "I've uploaded the wireframes you requested.",
    timeAgo: "1h ago",
    unread: true,
  },
  {
    id: "msg-3",
    client: "Ananya Kapoor",
    avatar: "/assets/img/avatar4.png",
    preview: "Quick question about the retention framework you shared.",
    timeAgo: "3h ago",
    unread: false,
  },
];

export const TOP_REVIEWS: ExpertTopReview[] = [
  {
    id: "rev-1",
    client: "Marcus Williams",
    role: "Head of Product, Nexus",
    avatar: "/assets/img/avatar2.png",
    rating: 5.0,
    sessionTitle: "Product Strategy",
    comment: "Sarah is an exceptional UX strategist. Her workshop was incredibly actionable and frameworks were immediately applicable.",
    date: "Dec 20",
  },
  {
    id: "rev-2",
    client: "Elena Vasquez",
    role: "Design Lead, Aura Creative",
    avatar: "/assets/img/avatar3.png",
    rating: 5.0,
    sessionTitle: "UX Audit Review",
    comment: "Came in with a messy UX problem and left with a clear roadmap. Ability to cut through complexity was remarkable.",
    date: "Dec 14",
  },
  {
    id: "rev-3",
    client: "Priya Sharma",
    role: "Design Director, HealthPulse",
    avatar: "/assets/img/avatar4.png",
    rating: 5.0,
    sessionTitle: "Design Thinking",
    comment: "Transformative session. Sarah brings a rare blend of empathy and analytical rigour. Our entire team left energized.",
    date: "Nov 20",
  },
];

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "availability",
    label: "Update Availability",
    href: "/expert/availability/",
    icon: "calendar",
  },
  {
    id: "profile",
    label: "Edit Profile",
    href: EXPERT_PROFILE_HREF,
    icon: "pencil",
  },
  {
    id: "documents",
    label: "Upload Documents",
    href: `${EXPERT_DASHBOARD_HREF}#documents`,
    icon: "upload",
  },
];

export const MAIN_NAV: ExpertNavItem[] = [
  { id: "dashboard", label: "Dashboard", href: EXPERT_DASHBOARD_HREF },
  { id: "profile", label: "Profile", href: EXPERT_PROFILE_HREF },
  {
    id: "availability",
    label: "Availability & Calendar",
    href: "/expert/availability/",
  },
  { id: "requests", label: "Requests", href: "/expert/requests/", badge: 3 },
  { id: "earnings", label: "Earnings", href: "/expert/earnings/" },
  { id: "reviews", label: "Reviews", href: "/expert/reviews/" },
  { id: "achievements", label: "Achievements", href: "/expert/achievements/" },
  { id: "notifications", label: "Notifications", href: "/expert/notifications/", badge: 5 },
];

export const EXPERT_SETTINGS_HREF = "/expert/settings/";

export const SETTINGS_NAV: ExpertNavItem = {
  id: "settings",
  label: "Settings",
  href: "/expert/settings/",
};

export function formatExpertCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
