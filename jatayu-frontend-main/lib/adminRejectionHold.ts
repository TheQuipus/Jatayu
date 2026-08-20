export type DecisionType = "reject" | "hold";

export type RejectionReason = {
  id: string;
  label: string;
};

export type ReviewHistoryEvent = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: "done" | "current" | "pending";
};

export type NotificationChannel = "whatsapp" | "sms" | "email";

export type RejectionHoldDetail = {
  appId: string;
  name: string;
  avatar: string;
  status: string;
  submittedDate: string;
  profileScore: number;
  riskFlag: "Low" | "Medium" | "High";
  defaultDecision: DecisionType;
  defaultReasonId: string;
  decisionSummary: string;
  resubmissionGuidance: string;
  whatsappPreview: string;
  templateVariables: string[];
  reviewHistory: ReviewHistoryEvent[];
  reviewerName: string;
};

export const REJECTION_REASONS: RejectionReason[] = [
  { id: "insufficient_credentials", label: "Insufficient Credentials" },
  { id: "incomplete_profile", label: "Incomplete Profile" },
  { id: "pricing_violation", label: "Pricing Policy Violation" },
  { id: "duplicate_account", label: "Duplicate Account" },
  { id: "quality_concerns", label: "Sample Answer Quality" },
  { id: "identity_mismatch", label: "Identity Mismatch" },
  { id: "category_mismatch", label: "Category Mismatch" },
  { id: "other", label: "Other (Specify in Notes)" },
];

const REJECTION_DATA: Record<string, RejectionHoldDetail> = {
  "APP-1079": {
    appId: "APP-1079",
    name: "Arjun Mehta",
    avatar: "/assets/img/avatar2.png",
    status: "Under Review",
    submittedDate: "Jun 17, 2025",
    profileScore: 62,
    riskFlag: "Medium",
    defaultDecision: "reject",
    defaultReasonId: "missing_video",
    decisionSummary:
      "Application rejected due to missing intro video despite strong credentials. Applicant has complete documentation but failed to upload required 60-second intro video after two reminder emails. Recommend 20-day reapply window with guidance on video requirements.",
    resubmissionGuidance:
      "Your application was not approved because the required intro video was not submitted. Please record a 60-second video introducing yourself, your expertise, and how you can help seekers. Use good lighting, clear audio, and speak in at least one language listed on your profile.",
    whatsappPreview:
      "Hi Arjun Mehta, your Jatayu expert application (APP-1079) was not approved. Reason: Missing Intro Video. You may reapply after 20 days. View guidance: jatayu.com/reapply",
    templateVariables: [
      "{{expert_name}}",
      "{{app_id}}",
      "{{rejection_reason}}",
      "{{reapply_date}}",
      "{{guidance_link}}",
    ],
    reviewHistory: [
      {
        id: "h1",
        title: "Application Submitted",
        description: "Expert application received and queued for review.",
        timestamp: "Jun 17, 2025 · 9:14 AM",
        status: "done",
      },
      {
        id: "h2",
        title: "Assigned to Reviewer",
        description: "Assigned to Rahul Sharma for initial review.",
        timestamp: "Jun 17, 2025 · 11:30 AM",
        status: "done",
      },
      {
        id: "h3",
        title: "Documents Verified",
        description: "4/4 documents passed automated verification.",
        timestamp: "Jun 18, 2025 · 10:02 AM",
        status: "done",
      },
      {
        id: "h4",
        title: "Video Reminder Sent",
        description: "Automated reminder sent for missing intro video.",
        timestamp: "Jun 18, 2025 · 2:00 PM",
        status: "done",
      },
      {
        id: "h5",
        title: "Decision Pending",
        description: "Awaiting admin decision — reject or hold.",
        timestamp: "Jun 19, 2025 · Now",
        status: "current",
      },
    ],
    reviewerName: "Rahul Sharma",
  },
};

export function getRejectionHoldDetail(appId: string): RejectionHoldDetail | null {
  return REJECTION_DATA[appId] ?? null;
}

export function getDefaultRejectionHoldAppId(): string {
  return "APP-1079";
}
