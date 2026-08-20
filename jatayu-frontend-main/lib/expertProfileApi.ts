import { getProfile, updateProfile } from "@/lib/api";
import type { ExperienceLevel, ExpertProfileData } from "@/lib/expertProfile";
import { DEFAULT_EXPERT_PROFILE } from "@/lib/expertProfile";
import type { TimeSlot } from "@/lib/expertAvailability";
import { deriveLocationFromTimezone } from "@/lib/expertApplicationMedia";
import { saveExpertProfile } from "@/lib/expertStore";

type BackendExpertProfile = {
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
  status?: string;
  onboardingStep?: string;
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

export function mapBackendProfileToExpertData(
  expert: BackendExpertProfile,
): ExpertProfileData {
  const metadata = expert.onboardingMetadata ?? {};
  const languages =
    asStringArray(metadata.languages).length > 0
      ? asStringArray(metadata.languages)
      : asStringArray(expert.focusAreas);

  return {
    name: expert.fullName || DEFAULT_EXPERT_PROFILE.name,
    role: expert.professionalTitle || DEFAULT_EXPERT_PROFILE.role,
    avatar: expert.profilePhotoSrc || DEFAULT_EXPERT_PROFILE.avatar,
    tagLine: expert.tagLine || "",
    bio: expert.bio || "",
    category: expert.category || DEFAULT_EXPERT_PROFILE.category,
    skills: expert.skills || [],
    experienceLevel: (expert.experienceLevel as ExperienceLevel) || "established",
    languages: languages.length > 0 ? languages : ["English"],
    location: deriveLocationFromTimezone(expert.timezone || "") || "India",
  };
}

export function mapBackendAvailability(expert: BackendExpertProfile): {
  timezone: string;
  slots: TimeSlot[];
} {
  return {
    timezone: expert.timezone || "",
    slots: (expert.availabilities || []).map((slot) => ({
      id: slot.id,
      days: slot.days || [],
      from: slot.fromTime,
      to: slot.toTime,
    })),
  };
}

export async function fetchExpertProfileData(): Promise<ExpertProfileData> {
  const expert = (await getProfile()) as BackendExpertProfile;
  const mapped = mapBackendProfileToExpertData(expert);
  saveExpertProfile(mapped);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("expert-profile-updated"));
  }
  return mapped;
}

export async function saveExpertProfileData(
  profile: ExpertProfileData,
  photoFile?: File | null,
): Promise<void> {
  await updateProfile(
    {
      professionalTitle: profile.role,
      tagLine: profile.tagLine,
      bio: profile.bio,
      category: profile.category,
      skills: profile.skills,
      experienceLevel: profile.experienceLevel,
      profilePhotoSrc: photoFile ? undefined : profile.avatar,
      onboardingMetadata: {
        languages: profile.languages,
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
