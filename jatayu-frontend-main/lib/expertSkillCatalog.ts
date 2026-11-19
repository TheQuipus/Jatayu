export const EXPERT_SKILL_CATEGORIES = [
  { id: "software", label: "Software Engineering" },
  { id: "design", label: "Product Design" },
  { id: "business", label: "Business Strategy" },
  { id: "marketing", label: "Marketing & Growth" },
  { id: "finance", label: "Finance & VC" },
  { id: "health", label: "Health & Wellness" },
  { id: "legal", label: "Legal & Compliance" },
  { id: "product", label: "Product Management" },
  { id: "data", label: "Data Science" },
] as const;

export const MAX_EXPERT_SECONDARY_SKILLS = 5;

export const EXPERT_SKILLS_BY_CATEGORY: Record<string, string[]> = {
  software: ["Frontend Development", "Backend Architecture", "Mobile Apps", "Cloud & DevOps", "System Design", "Security & Cryptography", "Database Tuning", "AI / ML Models", "API Integrations"],
  design: ["UI / UX Design", "Interaction Design", "Design Systems", "Wireframing", "Visual Branding", "User Research", "Prototyping", "Motion Design", "Webflow / Framer"],
  business: ["Market Research", "Financial Modeling", "Growth Strategy", "Operations Management", "Mergers & Acquisitions", "Startup Scaling", "Go-to-Market", "Change Management", "Competitive Analysis", "Pricing Strategy"],
  marketing: ["Meta & Google Ads", "SEO Strategy", "Content Marketing", "Brand Strategy", "Email Automation", "Product Marketing", "Conversion Optimization", "Influencer Marketing", "Growth Hacking"],
  finance: ["VC Fundraising", "Tax Advisory & GST", "Bookkeeping", "Equity & Cap Tables", "CFO Services", "Treasury Management", "Valuation Audits", "Audit Preparation"],
  health: ["Diet & Nutrition", "Mental Wellness", "Fitness Coaching", "Yoga & Mindfulness", "Sleep Hygiene", "Corporate Wellness", "Holistic Therapy"],
  legal: ["Founder Agreements", "ESOP Structuring", "SaaS Contracts", "IP & Patents", "Regulatory Compliance", "Company Incorporation", "Data Privacy (GDPR)"],
  product: ["Product Strategy", "Roadmapping", "Agile / Scrum", "User Story Mapping", "Product Analytics", "A/B Testing", "Feature Prioritization"],
  data: ["Data Warehousing", "SQL / Postgres", "Python Analytics", "Predictive Modeling", "BI Dashboards", "Big Data Pipelines", "A/B Test Analytics"],
};

export function cleanExpertCategorySkills(category: string, skills: string[]): string[] {
  const escapedCategory = category.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const prefixPattern = new RegExp(`^${escapedCategory}[\\s:\\-_]+`, "i");
  const seen = new Set<string>();
  return skills
    .map((skill) => {
      let cleaned = skill.replace(prefixPattern, "").trim();
      if (cleaned) cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      return cleaned || skill.trim();
    })
    .filter((skill) => {
      const key = skill.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function skillsForExpertCategory(category: string): string[] {
  const normalized = category.trim().toLowerCase();
  const match = EXPERT_SKILL_CATEGORIES.find((item) =>
    item.id === normalized || item.label.toLowerCase() === normalized);
  return match ? EXPERT_SKILLS_BY_CATEGORY[match.id] || [] : [];
}

export function selectExpertPrimarySkill(
  currentCategory: string,
  nextCategory: string,
  selectedSkills: string[],
): { category: string; skills: string[] } {
  return {
    category: nextCategory,
    skills: currentCategory === nextCategory ? selectedSkills : [],
  };
}

export function toggleExpertSecondarySkill(
  selectedSkills: string[],
  skill: string,
): string[] {
  const normalizedSkill = skill.trim().toLowerCase();
  const selectedSkill = selectedSkills.find(
    (item) => item.trim().toLowerCase() === normalizedSkill,
  );
  if (selectedSkill) {
    return selectedSkills.filter(
      (item) => item.trim().toLowerCase() !== normalizedSkill,
    );
  }
  if (
    !normalizedSkill ||
    selectedSkills.length >= MAX_EXPERT_SECONDARY_SKILLS
  ) {
    return selectedSkills;
  }
  return [...selectedSkills, skill.trim()];
}

export function addExpertSecondarySkill(
  selectedSkills: string[],
  skill: string,
): string[] {
  const trimmedSkill = skill.trim();
  if (
    !trimmedSkill ||
    selectedSkills.length >= MAX_EXPERT_SECONDARY_SKILLS ||
    selectedSkills.some(
      (item) => item.trim().toLowerCase() === trimmedSkill.toLowerCase(),
    )
  ) {
    return selectedSkills;
  }
  return [...selectedSkills, trimmedSkill];
}

export function removeExpertSecondarySkill(
  selectedSkills: string[],
  skill: string,
): string[] {
  return selectedSkills.filter(
    (item) => item.trim().toLowerCase() !== skill.trim().toLowerCase(),
  );
}
