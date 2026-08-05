export type ChecklistStatus = "passed" | "excellent" | "pending";

export type ApprovalChecklistItem = {
  id: string;
  title: string;
  description: string;
  status: ChecklistStatus;
};

export type CredentialCheck = {
  id: string;
  label: string;
  status: "pass" | "pending" | "missing";
};

export type RiskResult = {
  id: string;
  label: string;
  result: string;
  clear: boolean;
};

export type ApprovalStep = {
  id: number;
  label: string;
  href?: string;
  active?: boolean;
  completed?: boolean;
};

export type ApprovalConfirmationDetail = {
  appId: string;
  name: string;
  category: string;
  avatar: string;
  location: string;
  experience: string;
  trustScore: number;
  trustMax: number;
  recommendation: "approve" | "reject" | "hold";
  quickStats: { label: string; value: string; done: boolean }[];
  reviewerNote: {
    author: string;
    timestamp: string;
    text: string;
  };
  checklist: ApprovalChecklistItem[];
  credentials: CredentialCheck[];
  riskResults: RiskResult[];
  checklistPassed: number;
  checklistTotal: number;
  adminName: string;
};

export const APPROVAL_STEPS: ApprovalStep[] = [
  { id: 1, label: "Application Review", href: "/admin/review/APP-1079", completed: true },
  { id: 2, label: "Profile Inspection", href: "/admin/expert-profile/APP-1079", completed: true },
  { id: 3, label: "Credential Verification", completed: true },
  { id: 4, label: "Approval Confirmation", active: true },
];

const APPROVAL_DATA: Record<string, ApprovalConfirmationDetail> = {
  "APP-1079": {
    appId: "APP-1079",
    name: "Arjun Mehta",
    category: "Legal Expert",
    avatar: "/assets/img/avatar2.png",
    location: "Bangalore, Karnataka",
    experience: "12 yrs experience",
    trustScore: 85,
    trustMax: 100,
    recommendation: "approve",
    quickStats: [
      { label: "Docs Verified", value: "4/4", done: true },
      { label: "Intro Video", value: "Uploaded", done: true },
      { label: "Sample Answer", value: "Excellent", done: true },
      { label: "Availability", value: "Set", done: true },
    ],
    reviewerNote: {
      author: "Rahul Sharma",
      timestamp: "Jun 18, 2025 · 4:32 PM",
      text: "Strong legal credentials with complete documentation. Intro video is professional and sample answer demonstrates domain expertise. Recommend standard tier activation pending payout method setup.",
    },
    checklist: [
      {
        id: "c1",
        title: "Identity Verification",
        description: "Government ID and selfie match confirmed via KYC provider.",
        status: "passed",
      },
      {
        id: "c2",
        title: "Professional Credentials",
        description: "Bar Council certificate and LLB degree verified against registry.",
        status: "passed",
      },
      {
        id: "c3",
        title: "Intro Video",
        description: "58-second intro video uploaded, clear audio and professional presentation.",
        status: "passed",
      },
      {
        id: "c4",
        title: "Sample Answer Quality",
        description: "Sample response rated excellent by automated quality engine.",
        status: "excellent",
      },
      {
        id: "c5",
        title: "Pricing Policy",
        description: "All service rates within platform guidelines for legal category.",
        status: "passed",
      },
      {
        id: "c6",
        title: "Availability Calendar",
        description: "Weekly schedule configured with at least 20 hours available.",
        status: "passed",
      },
      {
        id: "c7",
        title: "Terms Agreement",
        description: "Expert terms of service and code of conduct accepted.",
        status: "passed",
      },
      {
        id: "c8",
        title: "Platform Flags",
        description: "No duplicate accounts, sanctions, or prior violations detected.",
        status: "passed",
      },
      {
        id: "c9",
        title: "LinkedIn Validation",
        description: "LinkedIn profile matches applicant identity and experience claims.",
        status: "passed",
      },
      {
        id: "c10",
        title: "Payout Method Setup",
        description: "Bank account or UPI details required before first payout.",
        status: "pending",
      },
    ],
    credentials: [
      { id: "cr1", label: "Aadhaar KYC", status: "pass" },
      { id: "cr2", label: "PAN Verification", status: "pass" },
      { id: "cr3", label: "LLB — NLSIU", status: "pass" },
      { id: "cr4", label: "Bar Council ID", status: "pass" },
      { id: "cr5", label: "Employment Letter", status: "pass" },
      { id: "cr6", label: "Bank / UPI", status: "pending" },
    ],
    riskResults: [
      { id: "r1", label: "Duplicate Account", result: "Clear", clear: true },
      { id: "r2", label: "Sanctions List", result: "Clear", clear: true },
      { id: "r3", label: "Document Forgery", result: "Clear", clear: true },
      { id: "r4", label: "Prior Violations", result: "None", clear: true },
    ],
    checklistPassed: 9,
    checklistTotal: 10,
    adminName: "Rahul Sharma",
  },
};

export function getApprovalConfirmation(appId: string): ApprovalConfirmationDetail | null {
  return APPROVAL_DATA[appId] ?? null;
}

export function getDefaultApprovalAppId(): string {
  return "APP-1079";
}
