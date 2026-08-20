import type { EducationDegree, EmploymentPosition } from "./expertEmployment";
import type { ExperienceLevel } from "./expertProfile";
import type {
  ApplicationStatus,
  ExpertApplicationSubmission,
  ExpertCertificate,
  GovernmentIdData,
  PortfolioSampleFile,
} from "./expertApplicationSubmission";
import type { TimeSlot } from "./expertAvailability";
import { deriveLocationFromTimezone } from "./expertApplicationMedia";
import { createEmptyEducationDegree, createEmptyEmploymentPosition } from "./expertEmployment";

export type BackendExpertApplication = {
  id: string;
  applicationNumber?: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  category?: string | null;
  skills?: string[] | null;
  experienceLevel?: string | null;
  professionalTitle?: string | null;
  tagLine?: string | null;
  bio?: string | null;
  profilePhotoSrc?: string | null;
  targetAudience?: string[] | string | null;
  focusAreas?: string[] | null;
  timezone?: string | null;
  selectedFormats?: string[] | null;
  selectedLengths?: string[] | null;
  formatPrices?: Record<string, string> | null;
  onboardingMetadata?: Record<string, unknown> | null;
  status?: string | null;
  frontendStatus?: ApplicationStatus;
  onboardingStep?: string | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
  reviewerNote?: string | null;
  credentials?: Array<{
    id: string;
    type: string;
    title: string;
    institution: string;
    startYear?: string | number | null;
    endYear?: string | number | null;
    description?: string | null;
  }>;
  availabilities?: Array<{
    id: string;
    days: string[];
    fromTime: string;
    toTime: string;
  }>;
};

function mapBackendStatus(expert: BackendExpertApplication): ApplicationStatus {
  if (expert.frontendStatus) return expert.frontendStatus;

  switch (expert.status) {
    case "pending_review":
      return "pending";
    case "in_review":
      return "in_review";
    case "on_hold":
      return "on_hold";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    default:
      return "pending";
  }
}

function slugifyCategory(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "general";
}

function mapCredentialsToEmployment(
  credentials: BackendExpertApplication["credentials"],
): EmploymentPosition[] {
  if (!credentials?.length) return [createEmptyEmploymentPosition()];

  const employment = credentials
    .filter((item) => item.type === "employment")
    .map((item) => ({
      id: item.id,
      jobTitle: item.title || "",
      company: item.institution || "",
      startMonth: "",
      startYear: item.startYear ? String(item.startYear) : "",
      endMonth: "",
      endYear: item.endYear ? String(item.endYear) : "",
      currentlyWorking: !item.endYear,
      responsibilities: item.description || "",
    }));

  return employment.length > 0 ? employment : [createEmptyEmploymentPosition()];
}

function mapCredentialsToEducation(
  credentials: BackendExpertApplication["credentials"],
): EducationDegree[] {
  if (!credentials?.length) return [createEmptyEducationDegree()];

  const education = credentials
    .filter((item) => item.type === "education")
    .map((item) => ({
      id: item.id,
      degree: item.title || "",
      fieldOfStudy: item.description || "",
      institution: item.institution || "",
      graduationYear: item.endYear ? String(item.endYear) : item.startYear ? String(item.startYear) : "",
      honours: "",
    }));

  return education.length > 0 ? education : [createEmptyEducationDegree()];
}

function mapAvailabilities(
  availabilities: BackendExpertApplication["availabilities"],
): TimeSlot[] {
  if (!availabilities?.length) return [];

  return availabilities.map((slot) => ({
    id: slot.id,
    days: asStringArray(slot.days),
    from: slot.fromTime,
    to: slot.toTime,
  }));
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim() !== "");
      }
    } catch {
      // not a JSON string
    }
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

export function mapBackendExpertToApplication(
  expert: BackendExpertApplication,
): ExpertApplicationSubmission {
  const metadata = expert.onboardingMetadata ?? {};
  const categoryLabel = expert.category || "General";
  const timezone = expert.timezone || "";
  const audiences =
    asStringArray(metadata.audiences).length > 0
      ? asStringArray(metadata.audiences)
      : asStringArray(expert.targetAudience);
  const languages =
    asStringArray(metadata.languages).length > 0
      ? asStringArray(metadata.languages)
      : asStringArray(expert.focusAreas);
  const skills =
    asStringArray(metadata.skills).length > 0
      ? asStringArray(metadata.skills)
      : asStringArray(expert.skills);

  return {
    appId: expert.applicationNumber || expert.id,
    submittedAt: expert.submittedAt || expert.updatedAt || new Date().toISOString(),
    status: mapBackendStatus(expert),
    name: expert.fullName,
    email: expert.email,
    phone: expert.phone || "",
    categoryId: slugifyCategory(categoryLabel),
    categoryLabel,
    skills,
    experienceLevel: (expert.experienceLevel as ExperienceLevel) || "established",
    professionalTitle: expert.professionalTitle || categoryLabel,
    tagLine: expert.tagLine || "",
    bio: expert.bio || "",
    avatar: expert.profilePhotoSrc || "/assets/img/manportrait.png",
    location: deriveLocationFromTimezone(timezone) || "India",
    linkedin: typeof metadata.linkedin === "string" ? metadata.linkedin : "",
    portfolio: typeof metadata.portfolio === "string" ? metadata.portfolio : "",
    portfolioSamples: Array.isArray(metadata.portfolioSamples)
      ? (metadata.portfolioSamples as PortfolioSampleFile[])
      : [],
    portfolioLinks: [],
    governmentId: metadata.governmentId as GovernmentIdData | undefined,
    kycVideoUrl: typeof metadata.kycVideoUrl === "string" ? metadata.kycVideoUrl : undefined,
    certificates: Array.isArray(metadata.certificates)
      ? (metadata.certificates as ExpertCertificate[])
      : [],
    formats: asStringArray(expert.selectedFormats),
    lengths: asStringArray(expert.selectedLengths),
    formatPrices: expert.formatPrices || {},
    languages: languages.length > 0 ? languages : ["English"],
    audiences,
    timezone,
    availabilitySlots: mapAvailabilities(expert.availabilities),
    employmentPositions: mapCredentialsToEmployment(expert.credentials),
    educationDegrees: mapCredentialsToEducation(expert.credentials),
    acceptCustomRequests: Boolean(metadata.acceptCustomRequests),
    termsAcceptedAt:
      typeof metadata.termsAcceptedAt === "string"
        ? metadata.termsAcceptedAt
        : expert.submittedAt || expert.updatedAt || new Date().toISOString(),
    reviewerNote: expert.reviewerNote || undefined,
    onboardingStep: expert.onboardingStep || undefined,
  };
}

export function mapBackendExpertsToApplications(
  experts: BackendExpertApplication[],
): ExpertApplicationSubmission[] {
  return experts.map(mapBackendExpertToApplication);
}
