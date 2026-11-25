export const SEEKER_PREDEFINED_CATEGORIES = [
  { id: "career-work", label: "Career & Work" },
  { id: "legal-compliance", label: "Legal & Compliance" },
  { id: "business-entrepreneurship", label: "Business & Entrepreneurship" },
  { id: "personal-growth", label: "Personal Growth" },
  { id: "finance-investment", label: "Finance & Investment" },
  { id: "software", label: "Software & Development" },
  { id: "design", label: "Design & Creative" },
  { id: "business", label: "Business & Consulting" },
  { id: "marketing", label: "Marketing & Growth" },
  { id: "finance", label: "Finance & Tax" },
  { id: "health", label: "Health & Wellness" },
  { id: "legal", label: "Legal & Founder Contracts" },
  { id: "product", label: "Product Management" },
  { id: "data", label: "Data & Analytics" },
] as const;

export const SEEKER_PRESET_LANGUAGES = [
  "English",
  "Hindi",
  "Bengali",
  "Marathi",
  "Telugu",
  "Tamil",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Odia",
  "Punjabi",
] as const;

export function getSeekerCategoryLabel(value: string): string {
  const clean = value.trim().toLowerCase();
  const match = SEEKER_PREDEFINED_CATEGORIES.find(
    (cat) => cat.id === clean || cat.label.toLowerCase() === clean,
  );
  return match ? match.label : value;
}
