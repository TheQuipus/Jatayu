import { getProfile, updateProfile } from "@/lib/api";
import type { ExperienceLevel, ExpertProfileData } from "@/lib/expertProfile";
import { DEFAULT_EXPERT_PROFILE } from "@/lib/expertProfile";
import type { TimeSlot } from "@/lib/expertAvailability";
import { deriveLocationFromTimezone } from "@/lib/expertApplicationMedia";
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

export type ExpertDashboardProfile = {
  profile: ExpertProfileData;
  reviewStatus: string;
  reviewerNote: string | null;
  submittedAt: string | null;
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

  return {
    name: normalizedExpert.fullName || DEFAULT_EXPERT_PROFILE.name,
    role: normalizedExpert.professionalTitle || DEFAULT_EXPERT_PROFILE.role,
    avatar: normalizedExpert.profilePhotoSrc || DEFAULT_EXPERT_PROFILE.avatar,
    tagLine: normalizedExpert.tagLine || "",
    bio: normalizedExpert.bio || "",
    category: normalizedExpert.category || DEFAULT_EXPERT_PROFILE.category,
    skills: asStringArray(normalizedExpert.skills),
    experienceLevel: (normalizedExpert.experienceLevel as ExperienceLevel) || "established",
    languages: languages.length > 0 ? languages : ["English"],
    location: typeof metadata.location === "string"
      ? metadata.location
      : deriveLocationFromTimezone(normalizedExpert.timezone || "") || "India",
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
  const expert = normalizeBackendProfile((await getProfile()) as BackendExpertProfile);
  const profile = mapBackendProfileToExpertData(expert);
  saveExpertProfile(profile);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("expert-profile-updated"));
  }
  return {
    profile,
    reviewStatus: expert.status || "draft",
    reviewerNote: expert.reviewerNote || null,
    submittedAt: expert.submittedAt || null,
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
      profilePhotoSrc: photoFile ? undefined : profile.avatar,
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
