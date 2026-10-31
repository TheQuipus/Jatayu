export type ExperienceLevel = "emerging" | "established" | "leader";

export type ExpertProfileData = {
  name: string;
  role: string;
  avatar: string;
  tagLine: string;
  bio: string;
  category: string;
  skills: string[];
  experienceLevel: ExperienceLevel | "";
  languages: string[];
  location: string;
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  emerging: "Emerging Expert · 1–3 years",
  established: "Established Professional · 4–9 years",
  leader: "Industry Leader · 10+ years",
};

export const DEFAULT_EXPERT_PROFILE: ExpertProfileData = {
  name: "",
  role: "",
  avatar: "/assets/img/profile-placeholder.svg",
  tagLine: "",
  bio: "",
  category: "",
  skills: [],
  experienceLevel: "",
  languages: [],
  location: "",
};

export function getSecondarySkills(primarySkill: string, skills: string[]): string[] {
  const normalizedPrimarySkill = primarySkill.trim().toLowerCase();
  const seen = new Set<string>();
  return skills.filter((skill) => {
    const normalizedSkill = skill.trim().toLowerCase();
    if (
      !normalizedSkill ||
      normalizedSkill === normalizedPrimarySkill ||
      seen.has(normalizedSkill)
    ) {
      return false;
    }
    seen.add(normalizedSkill);
    return true;
  });
}

export function isExpertProfileValid(profile: ExpertProfileData): boolean {
  return (
    profile.name.trim().length > 0 &&
    profile.role.trim().length > 0 &&
    profile.tagLine.trim().length > 0 &&
    profile.bio.trim().length > 0 &&
    profile.category.trim().length > 0 &&
    profile.skills.length > 0
  );
}
