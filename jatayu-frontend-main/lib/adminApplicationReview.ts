import type { ApplicationStatus } from "./expertApplicationSubmission";

export type ReviewDocument = {
  id: string;
  name: string;
  iconVariant: "red" | "blue" | "purple" | "yellow";
  verified: boolean;
  url: string | null;
  size?: string;
};

export type ReviewCertification = {
  id: string;
  name: string;
  issuer: string;
  verified: boolean;
  url: string | null;
};

export type ReviewNote = {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  text: string;
};

export type ReviewKycCheckStatus = "verified" | "pending" | "missing";

export type ReviewKycCheck = {
  id: string;
  label: string;
  value: string;
  status: ReviewKycCheckStatus;
};

export type ReviewKyc = {
  overallStatus: "complete" | "partial" | "pending";
  matchScore: number;
  provider: string;
  verifiedAt: string | null;
  checks: ReviewKycCheck[];
  idDocumentName: string | null;
  idDocumentUrl: string | null;
  videoUrl: string | null;
  hasVideo: boolean;
};

export type ReviewEducationItem = {
  id: string;
  degree: string;
  field: string;
  institution: string;
  year: string;
  honours?: string;
};

export type ReviewAvailabilitySlot = {
  id: string;
  days: string;
  hours: string;
};

export type ReviewAvailability = {
  timezone: string;
  timezoneLabel: string;
  acceptCustomRequests: boolean;
  slots: ReviewAvailabilitySlot[];
};

export type ReviewPortfolioItem = {
  id: string;
  title: string;
  subtitle: string;
  url?: string;
  type: "link" | "document";
  verified: boolean;
};

export type ReviewExperienceItem = {
  id: string;
  title: string;
  company: string;
  level: string;
  dates: string;
  description: string;
  skills: string[];
};

export type ReviewCategoryFit = {
  primaryCategory: string;
  categoryId: string;
  skills: string[];
  audiences: string[];
  languages: string[];
  skillCount: number;
  matchScore: number;
  recommendation: "strong" | "moderate" | "review";
  flags: { id: string; label: string; clear: boolean }[];
};

export type ApplicationReviewDetail = {
  appId: string;
  name: string;
  title: string;
  category: string;
  avatar: string;
  submittedDate: string;
  status: ApplicationStatus;
  slaLabel: string;
  slaLimit: string;
  queueIndex: number;
  queueTotal: number;
  indexScore: number;
  city: string;
  email: string;
  phone: string;
  languages: string;
  askedRate: string;
  completeness: number;
  bio: string;
  idVerified: boolean;
  linkedIn: boolean;
  stats: { label: string; value: string; highlight?: boolean }[];
  documents: ReviewDocument[];
  certifications: ReviewCertification[];
  kyc: ReviewKyc;
  portfolio: ReviewPortfolioItem[];
  experienceItems: ReviewExperienceItem[];
  educationItems: ReviewEducationItem[];
  availability: ReviewAvailability;
  categoryFit: ReviewCategoryFit;
  notes: ReviewNote[];
};

export const REVIEW_TABS = [
  { id: "documents", label: "Documents" },
  { id: "certifications", label: "Certifications" },
  { id: "portfolio", label: "Portfolio" },
  { id: "experience", label: "Experience" },
  { id: "availability", label: "Availability" },
  { id: "kyc", label: "KYC" },
  { id: "category", label: "Category Fit" },
] as const;

export type ReviewTabId = (typeof REVIEW_TABS)[number]["id"];

export function getDefaultReviewAppId(): string {
  return "APP-1079";
}
