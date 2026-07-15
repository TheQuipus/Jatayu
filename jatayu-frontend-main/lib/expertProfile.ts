export type ExperienceLevel = "emerging" | "established" | "leader";

export type ExpertProfileData = {
  name: string;
  role: string;
  avatar: string;
  tagLine: string;
  bio: string;
  category: string;
  skills: string[];
  experienceLevel: ExperienceLevel;
  languages: string[];
  location: string;
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  emerging: "Emerging Expert · 1–3 years",
  established: "Established Professional · 4–9 years",
  leader: "Industry Leader · 10+ years",
};

export const DEFAULT_EXPERT_PROFILE: ExpertProfileData = {
  name: "Sarah Mitchell",
  role: "UX Strategy Expert",
  avatar: "/assets/img/avatar1.png",
  tagLine:
    "I help product teams turn research into roadmaps that ship — with clarity, speed, and measurable outcomes.",
  bio:
    "I'm a UX strategy consultant with 9+ years guiding B2B and D2C teams through research, positioning, and design system decisions. I focus on practical frameworks clients can apply immediately.",
  category: "Product Design",
  skills: ["UX Strategy", "Product Research", "Design Systems", "Workshop Facilitation", "Roadmapping"],
  experienceLevel: "established",
  languages: ["English", "Hindi"],
  location: "Bengaluru, India",
};

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
