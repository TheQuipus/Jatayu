import type { EducationDegree, EmploymentPosition } from "./expertEmployment";
import type { ExperienceLevel } from "./expertProfile";
import type { TimeSlot } from "./expertAvailability";

export type ApplicationStatus = "pending" | "in_review" | "on_hold" | "approved" | "rejected";

export type SlaStatus = "on_track" | "at_risk" | "breached";

export type ExpertCertificate = {
  id: string;
  name: string;
  issuer?: string;
  size?: string;
  url?: string;
  fileName?: string;
};

export type GovernmentIdType = "aadhaar" | "pan" | "passport" | "voter" | "driving";

export type GovernmentIdUpload = {
  name: string;
  size: string;
  url?: string;
};

export type GovernmentIdData = {
  type: GovernmentIdType;
  front: GovernmentIdUpload;
  back?: GovernmentIdUpload;
};

export type PortfolioSampleFile = {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  description: string;
  url?: string;
  status: "uploading" | "complete";
  progress: number;
};

export type PortfolioLink = {
  id: string;
  url: string;
  platform: string;
};

export type ExpertApplicationSubmission = {
  appId: string;
  submittedAt: string;
  status: ApplicationStatus;
  name: string;
  email: string;
  phone: string;
  categoryId: string;
  categoryLabel: string;
  skills: string[];
  experienceLevel: ExperienceLevel;
  professionalTitle: string;
  tagLine: string;
  bio: string;
  avatar: string;
  location: string;
  linkedin: string;
  portfolio: string;
  portfolioSamples: PortfolioSampleFile[];
  portfolioLinks: PortfolioLink[];
  governmentId?: GovernmentIdData;
  kycVideoUrl?: string;
  certificates: ExpertCertificate[];
  formats: string[];
  lengths: string[];
  formatPrices: Record<string, string>;
  languages: string[];
  audiences: string[];
  timezone: string;
  availabilitySlots: TimeSlot[];
  employmentPositions: EmploymentPosition[];
  educationDegrees: EducationDegree[];
  acceptCustomRequests: boolean;
  termsAcceptedAt: string;
  reviewerNote?: string;
};

export type ExpertApplicationDraft = Partial<
  Omit<ExpertApplicationSubmission, "appId" | "submittedAt" | "status">
>;
