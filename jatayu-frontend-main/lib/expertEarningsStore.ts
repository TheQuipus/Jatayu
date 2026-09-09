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
  credits: string;
  platformFee?: string;
};

export const EARNINGS_SUMMARY: EarningsSummary = {
  availableBalance: "₹32,400",
  nextPayoutDate: "Dec 24, 2024",
  totalEarned: "₹1,48,200",
  annualGoalPercent: 0,
  thisMonthRevenue: "₹39,600",
  thisMonthSessions: 8,
  pendingPayout: "₹8,400",
  totalInvoices: 18,
  avgPerSession: "₹2,200",
  credits: "1,250",
  platformFee: "10%",
};

export type PricingRevenuePoint = {
  price: string;
  numericPrice: number;
  revenue: number;
  sessions: number;
  isCurrentRate?: boolean;
};

export const PRICING_REVENUE_DATA: PricingRevenuePoint[] = [
  { price: "₹500", numericPrice: 500, revenue: 6500, sessions: 13 },
  { price: "₹1,000", numericPrice: 1000, revenue: 16000, sessions: 16 },
  { price: "₹1,500", numericPrice: 1500, revenue: 25500, sessions: 17 },
  { price: "₹2,200", numericPrice: 2200, revenue: 48400, sessions: 22, isCurrentRate: true },
  { price: "₹3,000", numericPrice: 3000, revenue: 36000, sessions: 12 },
  { price: "₹4,000", numericPrice: 4000, revenue: 28000, sessions: 7 },
  { price: "₹5,000", numericPrice: 5000, revenue: 20000, sessions: 4 },
];

export const PACKAGE_PRICING_REVENUE_DATA: PricingRevenuePoint[] = [
  { price: "₹500 (15m)", numericPrice: 500, revenue: 9500, sessions: 19 },
  { price: "₹1,200 (30m)", numericPrice: 1200, revenue: 21600, sessions: 18 },
  { price: "₹2,200 (60m)", numericPrice: 2200, revenue: 52800, sessions: 24, isCurrentRate: true },
  { price: "₹4,500 (Audit)", numericPrice: 4500, revenue: 36000, sessions: 8 },
  { price: "₹8,000 (Retainer)", numericPrice: 8000, revenue: 32000, sessions: 4 },
];

export const DAILY_REVENUE_DATA: RevenueDataPoint[] = [
  { label: "Mon", amount: 3500 },
  { label: "Tue", amount: 6200 },
  { label: "Wed", amount: 4800 },
  { label: "Thu", amount: 7500 },
  { label: "Fri", amount: 5400 },
  { label: "Sat", amount: 8200 },
  { label: "Sun", amount: 2800 },
];

export const MONTHLY_REVENUE_DATA: RevenueDataPoint[] = [
  { label: "Jul", amount: 42000 },
  { label: "Aug", amount: 51000 },
  { label: "Sep", amount: 48000 },
  { label: "Oct", amount: 62000 },
  { label: "Nov", amount: 71000 },
  { label: "Dec", amount: 84200 },
];

export const YEARLY_REVENUE_DATA: RevenueDataPoint[] = [
  { label: "2023", amount: 52000 },
  { label: "2024", amount: 98000 },
  { label: "2025", amount: 157000 },
  { label: "2026", amount: 391000 },
];

export const WEEKLY_REVENUE_DATA: RevenueDataPoint[] = [
  { label: "Week 1", amount: 18400 },
  { label: "Week 2", amount: 21200 },
  { label: "Week 3", amount: 19600 },
  { label: "Week 4", amount: 25000 },
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
    amount: "+₹21,600",
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
    amount: "+₹8,400",
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
    amount: "+₹9,600",
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
    amount: "+₹14,400",
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
    amount: "+₹18,000",
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
    amount: "₹10,800.00",
    status: "Paid",
  },
  {
    id: "inv-2",
    number: "INV-2024-017",
    client: "Aura Creative",
    issueDate: "Dec 12, 2024",
    dueDate: "Dec 19, 2024",
    amount: "₹8,400.00",
    status: "Pending",
  },
  {
    id: "inv-3",
    number: "INV-2024-016",
    client: "CloudScale Inc",
    issueDate: "Dec 05, 2024",
    dueDate: "Dec 12, 2024",
    amount: "₹12,000.00",
    status: "Paid",
  },
  {
    id: "inv-4",
    number: "INV-2024-015",
    client: "FinVenture",
    issueDate: "Nov 28, 2024",
    dueDate: "Dec 05, 2024",
    amount: "₹8,000.00",
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
    payout: "₹10,800.00",
  },
  {
    id: "job-2",
    title: "UX Audit & Design Systems Review",
    client: "Elena Vasquez (Aura Creative)",
    completedDate: "Dec 12, 2024",
    duration: "4 hrs",
    payout: "₹8,400.00",
  },
  {
    id: "job-3",
    title: "Cloud Infrastructure & Scale Review",
    client: "David Park (CloudScale Inc)",
    completedDate: "Dec 05, 2024",
    duration: "6 hrs",
    payout: "₹12,000.00",
  },
];
