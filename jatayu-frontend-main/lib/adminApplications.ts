export type ApplicationStatus = "pending" | "in_review" | "on_hold" | "approved" | "rejected";

export type SlaStatus = "on_track" | "at_risk" | "breached";

export type ExpertApplication = {
  id: string;
  appId: string;
  name: string;
  city: string;
  avatar: string;
  category: string;
  categoryColor: string;
  languages: string[];
  submittedDate: string;
  submittedAgo: string;
  completeness: number;
  slaStatus: SlaStatus;
  slaLabel: string;
  slaLimit: string;
  status: ApplicationStatus;
  reviewer: { name: string; avatar: string } | null;
};

export type ApplicationKpi = {
  id: string;
  label: string;
  value: number;
  variant: "pending" | "review" | "hold" | "approved" | "rejected";
};

export const APPLICATIONS_PENDING_COUNT = 24;

export const APPLICATION_KPIS: ApplicationKpi[] = [
  { id: "pending", label: "Pending", value: 24, variant: "pending" },
  { id: "in_review", label: "In Review", value: 7, variant: "review" },
  { id: "on_hold", label: "On Hold", value: 5, variant: "hold" },
  { id: "approved", label: "Approved MTD", value: 142, variant: "approved" },
  { id: "rejected", label: "Rejected MTD", value: 19, variant: "rejected" },
];

export const STATUS_FILTER_COUNTS = {
  all: 36,
  pending: 24,
  in_review: 7,
  on_hold: 5,
};

export const EXPERT_APPLICATIONS: ExpertApplication[] = [
  {
    id: "1",
    appId: "APP-1082",
    name: "Sunita Rao",
    city: "Mumbai",
    avatar: "/assets/img/avatar2.png",
    category: "Finance",
    categoryColor: "#8B5CF6",
    languages: ["Hindi", "English"],
    submittedDate: "17 Jun 2025",
    submittedAgo: "52 hours ago",
    completeness: 85,
    slaStatus: "breached",
    slaLabel: "BREACHED",
    slaLimit: "Limit: 48hr",
    status: "pending",
    reviewer: null,
  },
  {
    id: "2",
    appId: "APP-1081",
    name: "Amit Patel",
    city: "Ahmedabad",
    avatar: "/assets/img/avatar3.png",
    category: "Startup",
    categoryColor: "var(--tango)",
    languages: ["Hindi", "Gujarati"],
    submittedDate: "18 Jun 2025",
    submittedAgo: "28 hours ago",
    completeness: 92,
    slaStatus: "on_track",
    slaLabel: "18hr left",
    slaLimit: "Limit: 48hr",
    status: "in_review",
    reviewer: { name: "Neha K.", avatar: "/assets/img/avatar1.png" },
  },
  {
    id: "3",
    appId: "APP-1080",
    name: "Priya Sharma",
    city: "Delhi",
    avatar: "/assets/img/avatar1.png",
    category: "Career",
    categoryColor: "#3B82F6",
    languages: ["Hindi", "English"],
    submittedDate: "18 Jun 2025",
    submittedAgo: "22 hours ago",
    completeness: 78,
    slaStatus: "on_track",
    slaLabel: "26hr left",
    slaLimit: "Limit: 48hr",
    status: "pending",
    reviewer: null,
  },
  {
    id: "4",
    appId: "APP-1079",
    name: "Arjun Mehta",
    city: "Bangalore",
    avatar: "/assets/img/avatar2.png",
    category: "Legal",
    categoryColor: "var(--pomegranate)",
    languages: ["English", "Kannada"],
    submittedDate: "17 Jun 2025",
    submittedAgo: "38 hours ago",
    completeness: 100,
    slaStatus: "on_track",
    slaLabel: "10hr left",
    slaLimit: "Limit: 48hr",
    status: "in_review",
    reviewer: { name: "Rahul S.", avatar: "/assets/img/avatar1.png" },
  },
  {
    id: "5",
    appId: "APP-1078",
    name: "Meera Iyer",
    city: "Chennai",
    avatar: "/assets/img/avatar3.png",
    category: "Health",
    categoryColor: "var(--green)",
    languages: ["Tamil", "English"],
    submittedDate: "19 Jun 2025",
    submittedAgo: "6 hours ago",
    completeness: 95,
    slaStatus: "on_track",
    slaLabel: "42hr left",
    slaLimit: "Limit: 48hr",
    status: "in_review",
    reviewer: { name: "Neha K.", avatar: "/assets/img/avatar1.png" },
  },
  {
    id: "6",
    appId: "APP-1077",
    name: "Vikram Singh",
    city: "Jaipur",
    avatar: "/assets/img/avatar1.png",
    category: "Finance",
    categoryColor: "#8B5CF6",
    languages: ["Hindi", "English"],
    submittedDate: "16 Jun 2025",
    submittedAgo: "58 hours ago",
    completeness: 72,
    slaStatus: "breached",
    slaLabel: "BREACHED",
    slaLimit: "Limit: 48hr",
    status: "pending",
    reviewer: null,
  },
  {
    id: "7",
    appId: "APP-1076",
    name: "Ananya Desai",
    city: "Pune",
    avatar: "/assets/img/avatar2.png",
    category: "Marketing",
    categoryColor: "#EC4899",
    languages: ["Marathi", "English"],
    submittedDate: "19 Jun 2025",
    submittedAgo: "4 hours ago",
    completeness: 88,
    slaStatus: "on_track",
    slaLabel: "44hr left",
    slaLimit: "Limit: 48hr",
    status: "pending",
    reviewer: null,
  },
  {
    id: "8",
    appId: "APP-1075",
    name: "Karan Malhotra",
    city: "Chandigarh",
    avatar: "/assets/img/avatar3.png",
    category: "Business",
    categoryColor: "var(--tango)",
    languages: ["Hindi", "Punjabi"],
    submittedDate: "15 Jun 2025",
    submittedAgo: "96 hours ago",
    completeness: 60,
    slaStatus: "breached",
    slaLabel: "BREACHED",
    slaLimit: "Limit: 48hr",
    status: "on_hold",
    reviewer: { name: "Arjun M.", avatar: "/assets/img/avatar3.png" },
  },
];

export const SLA_ALERT = {
  count: 8,
  oldestName: "Sunita Rao",
  oldestCategory: "Finance",
  oldestHours: 52,
  risk: "Expert drop-off",
};
