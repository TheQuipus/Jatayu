export type PayoutStatus = "Paid" | "Pending" | "Transit";

export type PayoutMethodType = "stripe" | "paypal" | "bank";

export type PayoutMethod = {
  id: string;
  type: PayoutMethodType;
  title: string;
  detail: string;
  badge?: string;
  isDefault?: boolean;
  status: "Verified" | "Active" | "Pending";
};

export type RevenueDataPoint = {
  label: string; // e.g. "Jan", "Feb", ...
  amount: number;
};

export type TransactionItem = {
  id: string;
  description: string;
  subtext: string;
  date: string;
  method: PayoutMethodType;
  methodLabel: string;
  transactionId: string;
  amount: string;
  status: PayoutStatus;
};

export type InvoiceItem = {
  id: string;
  number: string;
  client: string;
  issueDate: string;
  dueDate: string;
  amount: string;
  status: "Paid" | "Pending" | "Overdue";
};

export type CompletedJobItem = {
  id: string;
  title: string;
  client: string;
  completedDate: string;
  duration: string;
  payout: string;
};

export type EarningsSummary = {
  availableBalance: string;
  nextPayoutDate: string;
  totalEarned: string;
  annualGoalPercent: number;
  thisMonthRevenue: string;
  thisMonthSessions: number;
  pendingPayout: string;
  totalInvoices: number;
  avgPerSession: string;
  platformFee: string;
};

export const EARNINGS_SUMMARY: EarningsSummary = {
  availableBalance: "$3,240.00",
  nextPayoutDate: "Dec 24, 2024",
  totalEarned: "$14,820",
  annualGoalPercent: 74,
  thisMonthRevenue: "$3,960",
  thisMonthSessions: 8,
  pendingPayout: "$840",
  totalInvoices: 18,
  avgPerSession: "$220",
  platformFee: "10%",
};

export const MONTHLY_REVENUE_DATA: RevenueDataPoint[] = [
  { label: "Jan", amount: 1200 },
  { label: "Feb", amount: 1850 },
  { label: "Mar", amount: 2100 },
  { label: "Apr", amount: 1950 },
  { label: "May", amount: 2400 },
  { label: "Jun", amount: 2800 },
  { label: "Jul", amount: 3100 },
  { label: "Aug", amount: 2900 },
  { label: "Sep", amount: 3400 },
  { label: "Oct", amount: 3800 },
  { label: "Nov", amount: 4100 },
  { label: "Dec", amount: 3960 },
];

export const WEEKLY_REVENUE_DATA: RevenueDataPoint[] = [
  { label: "Week 1", amount: 840 },
  { label: "Week 2", amount: 1120 },
  { label: "Week 3", amount: 960 },
  { label: "Week 4", amount: 1040 },
];

export const PAYOUT_METHODS: PayoutMethod[] = [
  {
    id: "pm-1",
    type: "stripe",
    title: "Stripe Connect",
    detail: "sarah.mitchell.io · Verified",
    badge: "Default",
    isDefault: true,
    status: "Verified",
  },
  {
    id: "pm-2",
    type: "paypal",
    title: "PayPal",
    detail: "s.mitchell@paypal · Active",
    status: "Active",
  },
  {
    id: "pm-3",
    type: "bank",
    title: "Bank Transfer",
    detail: "Chase — ••••8121 · Pending",
    badge: "Verify",
    status: "Pending",
  },
];

export const TRANSACTIONS_HISTORY: TransactionItem[] = [
  {
    id: "txn-1",
    description: "Weekly Payout",
    subtext: "3 sessions · Dec 9–15",
    date: "Dec 16, 2024",
    method: "stripe",
    methodLabel: "Stripe",
    transactionId: "TXN_9x740f...",
    amount: "+$2,160",
    status: "Paid",
  },
  {
    id: "txn-2",
    description: "Pending Payout",
    subtext: "1 session · Dec 17–20",
    date: "Dec 23, 2024",
    method: "stripe",
    methodLabel: "Stripe",
    transactionId: "TXN_pending...",
    amount: "+$840",
    status: "Pending",
  },
  {
    id: "txn-3",
    description: "Weekly Payout",
    subtext: "2 sessions · Dec 2–8",
    date: "Dec 09, 2024",
    method: "paypal",
    methodLabel: "PayPal",
    transactionId: "TXN_5v924x...",
    amount: "+$960",
    status: "Paid",
  },
  {
    id: "txn-4",
    description: "Processing",
    subtext: "Bulk payout · Nov 25–Dec 1",
    date: "Dec 02, 2024",
    method: "bank",
    methodLabel: "Bank",
    transactionId: "TXN_7m019p...",
    amount: "+$1,440",
    status: "Transit",
  },
  {
    id: "txn-5",
    description: "Weekly Payout",
    subtext: "3 sessions · Nov 18–24",
    date: "Nov 25, 2024",
    method: "stripe",
    methodLabel: "Stripe",
    transactionId: "TXN_2d481m...",
    amount: "+$1,800",
    status: "Paid",
  },
];

export const INVOICES_LIST: InvoiceItem[] = [
  {
    id: "inv-1",
    number: "INV-2024-018",
    client: "Nexus Technologies",
    issueDate: "Dec 16, 2024",
    dueDate: "Dec 23, 2024",
    amount: "$1,080.00",
    status: "Paid",
  },
  {
    id: "inv-2",
    number: "INV-2024-017",
    client: "Aura Creative",
    issueDate: "Dec 12, 2024",
    dueDate: "Dec 19, 2024",
    amount: "$840.00",
    status: "Pending",
  },
  {
    id: "inv-3",
    number: "INV-2024-016",
    client: "CloudScale Inc",
    issueDate: "Dec 05, 2024",
    dueDate: "Dec 12, 2024",
    amount: "$1,200.00",
    status: "Paid",
  },
  {
    id: "inv-4",
    number: "INV-2024-015",
    client: "FinVenture",
    issueDate: "Nov 28, 2024",
    dueDate: "Dec 05, 2024",
    amount: "$800.00",
    status: "Paid",
  },
];

export const COMPLETED_JOBS_LIST: CompletedJobItem[] = [
  {
    id: "job-1",
    title: "Product Strategy Workshop",
    client: "Marcus Williams (Nexus Technologies)",
    completedDate: "Dec 16, 2024",
    duration: "Full Day (8 hrs)",
    payout: "$1,080.00",
  },
  {
    id: "job-2",
    title: "UX Audit & Design Systems Review",
    client: "Elena Vasquez (Aura Creative)",
    completedDate: "Dec 12, 2024",
    duration: "4 hrs",
    payout: "$840.00",
  },
  {
    id: "job-3",
    title: "Cloud Infrastructure & Scale Review",
    client: "David Park (CloudScale Inc)",
    completedDate: "Dec 05, 2024",
    duration: "6 hrs",
    payout: "$1,200.00",
  },
];
