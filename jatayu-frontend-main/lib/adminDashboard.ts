export type AdminNavItem = {
  id: string;
  label: string;
  href: string;
  badge?: number;
  badgeLabel?: string;
  badgeVariant?: "red" | "yellow" | "green";
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export type AdminMetric = {
  id: string;
  label: string;
  value: string;
  delta?: string;
  deltaType?: "positive" | "neutral" | "alert";
  tag?: string;
  tagVariant?: "urgent" | "high" | "review" | "auto" | "hold";
  footer?: string;
  footerHighlight?: boolean;
};

export type AdminActivity = {
  id: string;
  text: string;
  timeAgo: string;
  icon: "check" | "alert" | "user" | "refund";
};

export type GmvDataPoint = {
  day: string;
  amount: number;
};

export type SessionTypeSlice = {
  label: string;
  value: number;
  color: string;
};

export const ADMIN_DASHBOARD_HREF = "/admin/dashboard";
export const ADMIN_EXPERT_HREF = "/admin/applications";
export const ADMIN_USERS_HREF = "/admin/users/experts";
export const ADMIN_USERS_EXPERTS_HREF = "/admin/users/experts";
export const ADMIN_USERS_SEEKERS_HREF = "/admin/users/seekers";
export const ADMIN_SETTINGS_HREF = "/admin/settings";
export const ADMIN_LOGIN_HREF = "/admin";

export const ADMIN_EXPERT_PATH_PREFIXES = [
  "/admin/applications",
  "/admin/review",
  "/admin/expert-profile",
  "/admin/approval",
  "/admin/rejection-hold",
] as const;

export const ADMIN_USERS_PATH_PREFIXES = [
  "/admin/users",
] as const;

export const ADMIN_PROFILE = {
  name: "Rahul Sharma",
  shortName: "Rahul S.",
  role: "Super Admin",
  avatar: "/assets/img/avatar1.png",
  greeting: "Good morning",
};

export const ADMIN_NAV: AdminNavItem[] = [
  { id: "dashboard", label: "Dashboard", href: ADMIN_DASHBOARD_HREF },
  { id: "expert", label: "Expert Applications", href: ADMIN_EXPERT_HREF },
];

export const PRIMARY_METRICS: AdminMetric[] = [
  {
    id: "gmv",
    label: "GMV This Month",
    value: "₹1.24Cr",
    delta: "+18.4%",
    deltaType: "positive",
    footer: "vs ₹1.05Cr last month",
  },
  {
    id: "users",
    label: "Total Users",
    value: "48.2K",
    delta: "+2.1K",
    deltaType: "positive",
    footer: "1,204 new this week",
    footerHighlight: true,
  },
  {
    id: "experts",
    label: "Active Experts",
    value: "3,841",
    delta: "+84",
    deltaType: "positive",
    footer: "94.2% approval rate",
  },
  {
    id: "approvals",
    label: "Approvals Pending",
    value: "24",
    tag: "URGENT",
    tagVariant: "urgent",
    footer: "8 past 48hr SLA",
  },
];

export const SECONDARY_METRICS: AdminMetric[] = [
  { id: "sla", label: "SLA Breaches", value: "7", tag: "HIGH", tagVariant: "high" },
  { id: "disputes", label: "Open Disputes", value: "18", tag: "REVIEW", tagVariant: "review" },
  { id: "refunds", label: "Refunds (MTD)", value: "₹2.4L", tag: "AUTO", tagVariant: "auto" },
  { id: "payouts", label: "Payouts Queued", value: "₹18.7L", tag: "3 HOLD", tagVariant: "hold" },
];

export const GMV_TREND_14D: GmvDataPoint[] = [
  { day: "Jun 6", amount: 3.2 },
  { day: "Jun 7", amount: 3.8 },
  { day: "Jun 8", amount: 3.5 },
  { day: "Jun 9", amount: 4.1 },
  { day: "Jun 10", amount: 4.6 },
  { day: "Jun 11", amount: 4.2 },
  { day: "Jun 12", amount: 4.9 },
  { day: "Jun 13", amount: 5.1 },
  { day: "Jun 14", amount: 4.8 },
  { day: "Jun 15", amount: 5.4 },
  { day: "Jun 16", amount: 5.7 },
  { day: "Jun 17", amount: 5.3 },
  { day: "Jun 18", amount: 6.0 },
  { day: "Jun 19", amount: 6.2 },
];

export const SESSION_TYPES: SessionTypeSlice[] = [
  { label: "Text Consult", value: 42, color: "var(--tango)" },
  { label: "Video Message", value: 28, color: "var(--pomegranate)" },
  { label: "Live Call", value: 22, color: "#3B82F6" },
  { label: "Events", value: 8, color: "var(--green)" },
];

export const RECENT_ACTIVITY: AdminActivity[] = [
  { id: "1", text: "Expert Priya Sharma approved", timeAgo: "2m ago", icon: "check" },
  { id: "2", text: "Refund case #RC-20918 escalated", timeAgo: "8m ago", icon: "refund" },
  { id: "3", text: "New expert application from Amit Patel", timeAgo: "14m ago", icon: "user" },
  { id: "4", text: "SLA breach on session #S-48291", timeAgo: "22m ago", icon: "alert" },
  { id: "5", text: "Payout batch #PB-1042 approved", timeAgo: "35m ago", icon: "check" },
];

export const QUICK_ACTIONS = [
  { id: "applications", label: "Expert Applications Queue", href: "/admin/applications" },
  { id: "review", label: "Application Review", href: "/admin/review" },
  { id: "approval", label: "Approval Confirmation", href: "/admin/approval" },
  { id: "rejection", label: "Rejection & Hold", href: "/admin/rejection-hold" },
];

export const REVIEW_QUEUE_COUNT = 24;
