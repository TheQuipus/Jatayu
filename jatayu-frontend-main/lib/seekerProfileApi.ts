import { getSeekerProfile, getSeekerMe, getSeekerToken } from "@/lib/api";
import { SEEKER_PROFILE } from "@/lib/seekerDashboard";

export type SeekerProfileData = {
  name: string;
  avatar: string;
  category?: string;
  isPro?: boolean;
  email?: string;
  phone?: string;
  topics?: string[];
  needsSubject?: string;
  needsText?: string;
  selectedNeedChips?: string[];
  selectedBudget?: string;
  selectedLanguages?: string[];
};

export type SeekerQuestionPrefill = {
  subject: string;
  context: string;
  selectedContextChips: string[];
};

const SEEKER_PROFILE_STORAGE_KEY = "jatayu_seeker_profile";
export const SEEKER_PROFILE_UPDATED_EVENT = "seeker-profile-updated";

const NEED_CHIP_LOOKUP: Record<string, string> = {
  clarity: "clarity",
  "clarity & direction": "clarity",
  plan: "plan",
  "actionable plan": "plan",
  "quick actionable plan": "plan",
  knowledge: "knowledge",
  "deep knowledge": "knowledge",
  support: "support",
  "help & support": "support",
  "accountability & support": "support",
  solution: "solution",
  "specific solution": "solution",
  "problem solved": "solution",
};

type BackendSeekerProfile = {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  profilePhotoSrc?: string;
  avatarUrl?: string;
  avatar?: string;
  category?: string;
  selectedCategory?: string;
  categoryName?: string;
  isPro?: boolean;
  topics?: unknown;
  selectedTopics?: unknown;
  needsSubject?: string;
  needsText?: string;
  selectedNeedChips?: unknown;
  selectedBudget?: string;
  selectedLanguages?: unknown;
  onboardingMetadata?: Record<string, unknown> | null;
};

function normalizeStringArrayField(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export function normalizeNeedChipIds(value: unknown): string[] {
  const raw = normalizeStringArrayField(value);
  const result: string[] = [];
  for (const item of raw) {
    const mapped = NEED_CHIP_LOOKUP[item.toLowerCase()];
    if (mapped && !result.includes(mapped)) {
      result.push(mapped);
    }
  }
  return result;
}

export function formatCategoryLabel(category?: string): string {
  if (!category || !category.trim()) return "Seeker";

  const catMap: Record<string, string> = {
    "career-work": "Career & Work",
    "legal-compliance": "Legal & Compliance",
    "business-entrepreneurship": "Business & Entrepreneurship",
    "personal-growth": "Personal Growth",
    "finance-investment": "Finance & Investment",
    "software": "Software & Development",
    "design": "Design & Creative",
    "business": "Business",
    "marketing": "Marketing & Growth",
    "finance": "Finance & Tax",
    "health": "Health & Wellness",
    "legal": "Legal & Compliance",
    "product": "Product Management",
    "data": "Data & Analytics",
  };

  const clean = category.trim().toLowerCase();
  if (catMap[clean]) return catMap[clean];

  return category
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function getStoredSeekerProfile(): SeekerProfileData {
  if (typeof window === "undefined") {
    return {
      name: SEEKER_PROFILE.name,
      avatar: SEEKER_PROFILE.avatar,
      category: "",
      isPro: SEEKER_PROFILE.isPro,
      email: SEEKER_PROFILE.email,
      phone: "",
      topics: [],
      needsSubject: "",
      needsText: "",
      selectedNeedChips: [],
    };
  }

  try {
    const raw = sessionStorage.getItem(SEEKER_PROFILE_STORAGE_KEY) || localStorage.getItem(SEEKER_PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SeekerProfileData;
      return {
        name: parsed.name || SEEKER_PROFILE.name,
        avatar: parsed.avatar || SEEKER_PROFILE.avatar,
        category: parsed.category || sessionStorage.getItem("jatayu_seeker_category") || "",
        isPro: parsed.isPro ?? SEEKER_PROFILE.isPro,
        email: parsed.email || SEEKER_PROFILE.email,
        phone: parsed.phone || "",
        topics: normalizeStringArrayField(parsed.topics),
        needsSubject: typeof parsed.needsSubject === "string" ? parsed.needsSubject : "",
        needsText: typeof parsed.needsText === "string" ? parsed.needsText : "",
        selectedNeedChips: normalizeNeedChipIds(parsed.selectedNeedChips),
        selectedBudget: typeof parsed.selectedBudget === "string" ? parsed.selectedBudget : "",
        selectedLanguages: normalizeStringArrayField(parsed.selectedLanguages),
      };
    }
  } catch {
    // Ignore JSON errors
  }

  return {
    name: SEEKER_PROFILE.name,
    avatar: SEEKER_PROFILE.avatar,
    category: sessionStorage.getItem("jatayu_seeker_category") || "",
    isPro: SEEKER_PROFILE.isPro,
    email: SEEKER_PROFILE.email,
    phone: "",
    topics: [],
    needsSubject: "",
    needsText: "",
    selectedNeedChips: [],
  };
}

export function saveStoredSeekerProfile(data: Partial<SeekerProfileData>): void {
  if (typeof window === "undefined") return;
  const current = getStoredSeekerProfile();
  const updated: SeekerProfileData = {
    ...current,
    ...data,
  };
  const serialized = JSON.stringify(updated);
  sessionStorage.setItem(SEEKER_PROFILE_STORAGE_KEY, serialized);
  localStorage.setItem(SEEKER_PROFILE_STORAGE_KEY, serialized);
  if (data.category) {
    sessionStorage.setItem("jatayu_seeker_category", data.category);
  }
  try {
    const rawUser = localStorage.getItem("jatayu_seeker_user");
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser) as Record<string, unknown>;
      if (data.phone !== undefined) {
        parsedUser.phone = data.phone;
      }
      if (data.name !== undefined) {
        parsedUser.fullName = data.name;
      }
      if (data.category !== undefined) {
        parsedUser.category = data.category;
      }
      if (data.topics !== undefined) {
        parsedUser.topics = data.topics;
      }
      if (data.needsSubject !== undefined) {
        parsedUser.needsSubject = data.needsSubject;
      }
      if (data.needsText !== undefined) {
        parsedUser.needsText = data.needsText;
      }
      if (data.selectedNeedChips !== undefined) {
        parsedUser.selectedNeedChips = data.selectedNeedChips;
      }
      localStorage.setItem("jatayu_seeker_user", JSON.stringify(parsedUser));
    }
  } catch {
    // Ignore JSON errors
  }
  window.dispatchEvent(new Event(SEEKER_PROFILE_UPDATED_EVENT));
}

export function mapBackendSeekerToProfile(
  data: BackendSeekerProfile,
): SeekerProfileData {
  const metadata =
    data.onboardingMetadata && typeof data.onboardingMetadata === "object"
      ? data.onboardingMetadata
      : {};
  const rawMetadataSubject =
    typeof metadata.needsSubject === "string"
      ? metadata.needsSubject
      : typeof metadata.subject === "string"
        ? metadata.subject
        : "";
  const rawTopics = data.topics !== undefined ? data.topics : data.selectedTopics;

  return {
    name: data.fullName || data.name || SEEKER_PROFILE.name,
    avatar: data.profilePhotoSrc || data.avatarUrl || data.avatar || SEEKER_PROFILE.avatar,
    category: data.category || data.selectedCategory || data.categoryName || "",
    isPro: data.isPro ?? SEEKER_PROFILE.isPro,
    email: data.email || SEEKER_PROFILE.email,
    phone: data.phone || "",
    topics: normalizeStringArrayField(rawTopics),
    needsSubject: (typeof data.needsSubject === "string" ? data.needsSubject : rawMetadataSubject).trim(),
    needsText: typeof data.needsText === "string" ? data.needsText : "",
    selectedNeedChips: normalizeNeedChipIds(data.selectedNeedChips),
    selectedBudget: typeof data.selectedBudget === "string" ? data.selectedBudget.trim() : "",
    selectedLanguages: normalizeStringArrayField(data.selectedLanguages),
  };
}

export function deriveSeekerQuestionPrefill(
  profile?: Partial<SeekerProfileData> | null,
): SeekerQuestionPrefill {
  if (!profile) {
    return { subject: "", context: "", selectedContextChips: [] };
  }

  const explicitSubject =
    typeof profile.needsSubject === "string" ? profile.needsSubject.trim() : "";
  const topicsList = normalizeStringArrayField(profile.topics);
  const rawCategory =
    typeof profile.category === "string" ? profile.category.trim() : "";
  const categorySubject = rawCategory ? formatCategoryLabel(rawCategory) : "";

  const subject =
    explicitSubject ||
    (topicsList.length > 0 ? topicsList.join(", ") : "") ||
    categorySubject;

  const context =
    typeof profile.needsText === "string"
      ? profile.needsText.trim().slice(0, 1000)
      : "";

  const selectedContextChips = normalizeNeedChipIds(profile.selectedNeedChips);

  return {
    subject,
    context,
    selectedContextChips,
  };
}

export async function fetchSeekerProfileData(): Promise<SeekerProfileData> {
  let backendData: BackendSeekerProfile = {};
  let fromServer = false;
  if (getSeekerToken()) {
    try {
      backendData = (await getSeekerMe()) as BackendSeekerProfile;
      fromServer = true;
    } catch {
      backendData = (await getSeekerProfile()) as BackendSeekerProfile;
    }
  } else {
    backendData = (await getSeekerProfile()) as BackendSeekerProfile;
  }
  const mapped = mapBackendSeekerToProfile(backendData);
  if (!fromServer) {
    const existing = getStoredSeekerProfile();
    if (!mapped.category && existing.category) mapped.category = existing.category;
    if ((!mapped.topics || mapped.topics.length === 0) && existing.topics?.length) {
      mapped.topics = existing.topics;
    }
    if (!mapped.needsSubject && existing.needsSubject) mapped.needsSubject = existing.needsSubject;
    if (!mapped.needsText && existing.needsText) mapped.needsText = existing.needsText;
    if (
      (!mapped.selectedNeedChips || mapped.selectedNeedChips.length === 0) &&
      existing.selectedNeedChips?.length
    ) {
      mapped.selectedNeedChips = existing.selectedNeedChips;
    }
    if (!mapped.selectedBudget && existing.selectedBudget) {
      mapped.selectedBudget = existing.selectedBudget;
    }
    if (
      (!mapped.selectedLanguages || mapped.selectedLanguages.length === 0) &&
      existing.selectedLanguages?.length
    ) {
      mapped.selectedLanguages = existing.selectedLanguages;
    }
  }
  saveStoredSeekerProfile(mapped);
  return mapped;
}
