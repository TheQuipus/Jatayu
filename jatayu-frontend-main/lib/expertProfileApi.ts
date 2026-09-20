import { getDigilockerKycStatus, getProfile, updateProfile } from "@/lib/api";
import type { ExperienceLevel, ExpertProfileData } from "@/lib/expertProfile";
import type { TimeSlot } from "@/lib/expertAvailability";
import { saveExpertProfile } from "@/lib/expertStore";

export type BackendExpertProfile = {
  applicationNumber?: string | null;
  fullName?: string;
  professionalTitle?: string;
  profilePhotoSrc?: string;
  tagLine?: string;
  bio?: string;
  category?: string;
  skills?: string[];
  experienceLevel?: string;
  focusAreas?: string[] | null;
  timezone?: string | null;
  onboardingMetadata?: Record<string, unknown> | null;
  availabilities?: Array<{
    id: string;
    days: string[];
    fromTime: string;
    toTime: string;
  }>;
  credentials?: unknown[];
  selectedFormats?: string[] | null;
  selectedLengths?: string[] | null;
  formatPrices?: Record<string, string> | null;
  targetAudience?: string[] | string | null;
  status?: string;
  onboardingStep?: string;
  reviewerNote?: string | null;
  submittedAt?: string | null;
};

export type ExpertBookingPreferences = {
  autoAcceptBookings: boolean;
  allowInstantBookings: boolean;
  syncCalendar: boolean;
  automatedReminders: boolean;
  minimumNoticeMinutes: number;
  advanceBookingWindowDays: number;
};

export const DEFAULT_EXPERT_BOOKING_PREFERENCES: ExpertBookingPreferences = {
  autoAcceptBookings: false,
  allowInstantBookings: false,
  syncCalendar: true,
  automatedReminders: true,
  minimumNoticeMinutes: 120,
  advanceBookingWindowDays: 90,
};

export function mapExpertBookingPreferences(profile: BackendExpertProfile): ExpertBookingPreferences {
  const metadata = asRecord(profile.onboardingMetadata);
  const stored = asRecord(metadata.bookingPreferences);
  const minimumNoticeMinutes = Number(stored.minimumNoticeMinutes);
  const advanceBookingWindowDays = Number(stored.advanceBookingWindowDays);
  return {
    autoAcceptBookings: stored.autoAcceptBookings === true,
    allowInstantBookings: stored.allowInstantBookings === true,
    syncCalendar: true,
    automatedReminders: stored.automatedReminders !== false,
    minimumNoticeMinutes: Number.isInteger(minimumNoticeMinutes) && minimumNoticeMinutes >= 0
      ? minimumNoticeMinutes
      : DEFAULT_EXPERT_BOOKING_PREFERENCES.minimumNoticeMinutes,
    advanceBookingWindowDays: Number.isInteger(advanceBookingWindowDays) && advanceBookingWindowDays > 0
      ? advanceBookingWindowDays
      : DEFAULT_EXPERT_BOOKING_PREFERENCES.advanceBookingWindowDays,
  };
}

export type ExpertDashboardProfile = {
  profile: ExpertProfileData;
  reviewStatus: string;
  reviewerNote: string | null;
  submittedAt: string | null;
  completion: {
    percentage: number;
    checklist: Array<{ id: string; label: string; status: "done" | "pending" }>;
  };
};

function asStringArray(value: unknown): string[] {
  let normalized = value;
  if (typeof normalized === "string") {
    const serialized = normalized;
    try {
      normalized = JSON.parse(serialized);
    } catch {
      return serialized.split(",").map((item: string) => item.trim()).filter(Boolean);
    }
  }
  if (Array.isArray(normalized)) {
    return normalized.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

function normalizeBackendProfile(expert: BackendExpertProfile): BackendExpertProfile {
  const raw = expert as BackendExpertProfile & Record<string, unknown>;
  const availabilities = Array.isArray(raw.availabilities) ? raw.availabilities : [];
  return {
    ...expert,
    skills: asStringArray(raw.skills),
    focusAreas: asStringArray(raw.focusAreas),
    selectedFormats: asStringArray(raw.selectedFormats),
    selectedLengths: asStringArray(raw.selectedLengths),
    targetAudience: asStringArray(raw.targetAudience),
    formatPrices: asRecord(raw.formatPrices) as Record<string, string>,
    onboardingMetadata: asRecord(raw.onboardingMetadata),
    credentials: Array.isArray(raw.credentials) ? raw.credentials : [],
    availabilities: availabilities.map((slot) => ({
      ...slot,
      days: asStringArray(slot.days),
    })),
  };
}

export function mapBackendProfileToExpertData(
  expert: BackendExpertProfile,
): ExpertProfileData {
  const normalizedExpert = normalizeBackendProfile(expert);
  const metadata = normalizedExpert.onboardingMetadata ?? {};
  const languages =
    asStringArray(metadata.languages).length > 0
      ? asStringArray(metadata.languages)
      : asStringArray(normalizedExpert.focusAreas);
  const storedLocation = typeof metadata.location === "string"
    ? metadata.location.trim()
    : "";
  // These exact values were previously inserted by frontend fallbacks. `Kolkata`
  // was derived from the availability timezone `Asia/Kolkata`, not user input.
  const legacyLocations = new Set(["Bengaluru, India", "Kolkata", "India"]);
  const location = legacyLocations.has(storedLocation) ? "" : storedLocation;

  return {
    name: normalizedExpert.fullName || "",
    role: normalizedExpert.professionalTitle || "",
    avatar: normalizedExpert.profilePhotoSrc || "/assets/img/profile-placeholder.svg",
    tagLine: normalizedExpert.tagLine || "",
    bio: normalizedExpert.bio || "",
    category: normalizedExpert.category || "",
    skills: asStringArray(normalizedExpert.skills),
    experienceLevel: (normalizedExpert.experienceLevel as ExperienceLevel) || "",
    languages,
    location,
  };
}

export function mapBackendAvailability(expert: BackendExpertProfile): {
  timezone: string;
  slots: TimeSlot[];
} {
  const normalizedExpert = normalizeBackendProfile(expert);
  return {
    timezone: normalizedExpert.timezone || "",
    slots: (normalizedExpert.availabilities || []).map((slot) => ({
      id: slot.id,
      days: slot.days || [],
      from: slot.fromTime,
      to: slot.toTime,
    })),
  };
}

export async function fetchExpertProfileData(): Promise<ExpertProfileData> {
  const expert = normalizeBackendProfile((await getProfile()) as BackendExpertProfile);
  const mapped = mapBackendProfileToExpertData(expert);
  saveExpertProfile(mapped);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("expert-profile-updated"));
  }
  return mapped;
}

export async function fetchExpertProfileRecord(): Promise<BackendExpertProfile> {
  return normalizeBackendProfile((await getProfile()) as BackendExpertProfile);
}

export async function fetchExpertDashboardProfile(): Promise<ExpertDashboardProfile> {
  const [profileResponse, digilocker] = await Promise.all([
    getProfile(),
    getDigilockerKycStatus().catch(() => null),
  ]);
  const expert = normalizeBackendProfile(profileResponse as BackendExpertProfile);
  const profile = mapBackendProfileToExpertData(expert);
  const metadata = expert.onboardingMetadata || {};
  const credentials = expert.credentials || [];
  const hasWorkExperience = credentials.some((item) =>
    item && typeof item === "object" && (item as { type?: string }).type === "experience"
  );
  const hasKyc = digilocker?.kyc?.status === "verified"
    || Boolean(metadata.governmentId)
    || Boolean(metadata.kycVideoUrl);
  const formats = expert.selectedFormats || [];
  const lengths = expert.selectedLengths || [];
  const prices = expert.formatPrices || {};
  const submitted = Boolean(expert.submittedAt)
    || ["pending_review", "in_review", "on_hold", "approved", "rejected"].includes(expert.status || "")
    || expert.onboardingStep === "success";
  const checklist: ExpertDashboardProfile["completion"]["checklist"] = [
    { id: "category", label: "Expert category", status: profile.category ? "done" : "pending" },
    { id: "skills", label: "Skills & expertise", status: profile.skills.length ? "done" : "pending" },
    { id: "experience", label: "Work experience", status: hasWorkExperience ? "done" : "pending" },
    { id: "identity", label: "Profile identity", status: profile.name && profile.role && profile.tagLine && profile.bio ? "done" : "pending" },
    { id: "credentials", label: "Credentials & KYC", status: credentials.length > 0 && hasKyc ? "done" : "pending" },
    { id: "preferences", label: "Consultation preferences", status: formats.length > 0 && lengths.length > 0 && formats.every((format) => Number(prices[format]) > 0) ? "done" : "pending" },
    { id: "audience", label: "Target audience", status: asStringArray(expert.targetAudience).length ? "done" : "pending" },
    { id: "availability", label: "Availability schedule", status: expert.timezone && expert.availabilities?.length ? "done" : "pending" },
    { id: "review", label: "Review & submit", status: submitted ? "done" : "pending" },
  ];
  const completedCount = checklist.filter((item) => item.status === "done").length;
  saveExpertProfile(profile);
  return {
    profile,
    reviewStatus: expert.status || "draft",
    reviewerNote: expert.reviewerNote || null,
    submittedAt: expert.submittedAt || null,
    completion: {
      percentage: Math.round((completedCount / checklist.length) * 100),
      checklist,
    },
  };
}

export async function saveExpertProfileData(
  profile: ExpertProfileData,
  photoFile?: File | null,
  additionalPayload: Parameters<typeof updateProfile>[0] = {},
): Promise<void> {
  await updateProfile(
    {
      ...additionalPayload,
      fullName: profile.name,
      professionalTitle: profile.role,
      tagLine: profile.tagLine,
      bio: profile.bio,
      category: profile.category,
      skills: profile.skills,
      experienceLevel: profile.experienceLevel,
      profilePhotoSrc: photoFile || profile.avatar === "/assets/img/profile-placeholder.svg" ? undefined : profile.avatar,
      onboardingMetadata: {
        ...(additionalPayload.onboardingMetadata || {}),
        languages: profile.languages,
        location: profile.location,
      },
    },
    photoFile,
  );

  saveExpertProfile(profile);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("expert-profile-updated"));
  }
}

export async function saveExpertAvailability(
  timezone: string,
  slots: TimeSlot[],
): Promise<void> {
  await updateProfile({
    timezone,
    availabilitySlots: slots.map((slot) => ({
      days: slot.days,
      from: slot.from,
      to: slot.to,
    })),
  });
}

export async function fetchExpertAvailability(): Promise<{
  timezone: string;
  slots: TimeSlot[];
}> {
  const expert = (await getProfile()) as BackendExpertProfile;
  return mapBackendAvailability(expert);
}
