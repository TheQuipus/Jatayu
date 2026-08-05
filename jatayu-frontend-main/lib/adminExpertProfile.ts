export type ExpertProfileTab = {
  id: string;
  label: string;
};

export type ExpertProfilePricing = {
  id: string;
  label: string;
  price: string;
  unit: string;
};

export type ExpertProfileAvailability = {
  id: string;
  label: string;
  hours: string;
  variant: "open" | "limited" | "closed";
};

export type ExpertProfileExperience = {
  id: string;
  title: string;
  company: string;
  dates: string;
  description: string;
  skills: string[];
  iconVariant: "purple" | "blue" | "orange";
};

export type ExpertProfilePortfolioItem = {
  id: string;
  title: string;
  subtitle: string;
  url?: string;
  type: "link" | "document";
  verified: boolean;
};

export type ExpertProfileVerificationCheck = {
  id: string;
  label: string;
  value: string;
  status: "pass" | "pending" | "missing";
};

export type ExpertProfileRatingItem = {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
};

export type ExpertProfileInternalNote = {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  text: string;
};

export type AdminExpertProfileDetail = {
  appId: string;
  name: string;
  headline: string;
  category: string;
  categoryBadge: string;
  topApplicant: boolean;
  avatar: string;
  submittedDate: string;
  location: string;
  experienceLabel: string;
  phone: string;
  idVerified: boolean;
  linkedIn: boolean;
  phoneVerified: boolean;
  trustScore: number;
  stats: { label: string; value: string }[];
  languages: string[];
  expertise: { label: string; color: string }[];
  bio: string;
  videoTranscript: string;
  videoDuration: string;
  pricing: ExpertProfilePricing[];
  availability: ExpertProfileAvailability[];
  availabilityNote: string;
  experience: ExpertProfileExperience[];
  allSkills: string[];
  audiences: string[];
  portfolioItems: ExpertProfilePortfolioItem[];
  verification: {
    score: number;
    checks: ExpertProfileVerificationCheck[];
  };
  ratings: {
    avgRating: number | null;
    totalReviews: number;
    items: ExpertProfileRatingItem[];
  };
  internalNotes: ExpertProfileInternalNote[];
};

export const EXPERT_PROFILE_TABS: ExpertProfileTab[] = [
  { id: "overview", label: "Overview" },
  { id: "expertise", label: "Expertise" },
  { id: "portfolio", label: "Portfolio" },
  { id: "ratings", label: "Ratings & Reviews" },
  { id: "verification", label: "Verification" },
  { id: "notes", label: "Internal Notes" },
];

export function getDefaultExpertProfileAppId(): string {
  return "APP-1079";
}
