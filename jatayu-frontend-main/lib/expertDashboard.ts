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
  icon: "calendar" | "star" | "users" | "inbox";
};

export type EarningsMonth = {
  month: string;
  amount: number;
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

export type QuickAction = {
  id: string;
  label: string;
  href: string;
  icon: "calendar" | "pencil" | "upload";
};

export const EXPERT_DASHBOARD_HREF = "/expert/dashboard";
export const EXPERT_ONBOARDING_HREF = "/expert/expert-onboarding";
export const EXPERT_PROFILE_HREF = "/expert/profile";

import { DEFAULT_EXPERT_PROFILE } from "@/lib/expertProfile";

export const EXPERT_PROFILE = {
  name: DEFAULT_EXPERT_PROFILE.name,
  role: DEFAULT_EXPERT_PROFILE.role,
  avatar: DEFAULT_EXPERT_PROFILE.avatar,
  greeting: "Good morning",
};

export const PROFILE_STRENGTH = 78;

export const PROFILE_CHECKLIST: ProfileChecklistItem[] = [
  { id: "basic", label: "Basic info added", status: "done" },
  { id: "expertise", label: "Expertise defined", status: "done" },
  { id: "availability", label: "Availability set", status: "done" },
  { id: "documents", label: "Documents verified", status: "done" },
  { id: "portfolio", label: "Portfolio pending", status: "pending" },
  { id: "video", label: "Video intro missing", status: "pending" },
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

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "availability",
    label: "Update Availability",
    href: "/expert/availability",
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
    href: "/expert/availability",
  },
  { id: "requests", label: "Requests", href: "/expert/requests", badge: 3 },
  { id: "messages", label: "Messages", href: `${EXPERT_DASHBOARD_HREF}#messages`, badge: 5 },
  { id: "earnings", label: "Earnings", href: `${EXPERT_DASHBOARD_HREF}#earnings` },
  { id: "reviews", label: "Reviews", href: `${EXPERT_DASHBOARD_HREF}#reviews` },
];

export const SETTINGS_NAV: ExpertNavItem = {
  id: "settings",
  label: "Settings",
  href: `${EXPERT_DASHBOARD_HREF}#settings`,
};

export function formatExpertCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
