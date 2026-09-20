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

export function skillsForExpertCategory(category: string): string[] {
  const normalized = category.trim().toLowerCase();
  const match = EXPERT_SKILL_CATEGORIES.find((item) =>
    item.id === normalized || item.label.toLowerCase() === normalized);
  return match ? EXPERT_SKILLS_BY_CATEGORY[match.id] || [] : [];
}
