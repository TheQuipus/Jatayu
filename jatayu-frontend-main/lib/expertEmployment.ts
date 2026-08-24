import { generateUUID } from "@/lib/uuid";

export type EmploymentPosition = {
  id: string;
  jobTitle: string;
  company: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  currentlyWorking: boolean;
  responsibilities: string;
};

export type ExperienceLevel = "emerging" | "established" | "leader";

export const MAX_EMPLOYMENT_POSITIONS = 5;

export const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const;

export function getCurrentMonthYear(): { month: string; year: string } {
  const now = new Date();
  return {
    month: String(now.getMonth() + 1).padStart(2, "0"),
    year: String(now.getFullYear()),
  };
}

export function createEmptyEmploymentPosition(): EmploymentPosition {
  return {
    id: generateUUID(),
    jobTitle: "",
    company: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    currentlyWorking: false,
    responsibilities: "",
  };
}

export function getYearOptions(count = 50): string[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: count }, (_, index) => String(currentYear - index));
}

export function isPositionDateOrderValid(position: EmploymentPosition): boolean {
  if (position.currentlyWorking) return true;
  if (!position.startYear || !position.endYear) return true;

  const startYear = Number.parseInt(position.startYear, 10);
  const endYear = Number.parseInt(position.endYear, 10);

  if (endYear < startYear) return false;
  if (endYear > startYear) return true;

  if (position.startMonth && position.endMonth) {
    const startMonth = Number.parseInt(position.startMonth, 10);
    const endMonth = Number.parseInt(position.endMonth, 10);
    if (endMonth < startMonth) return false;
  }

  return true;
}

export function isPositionDateNotInFuture(position: EmploymentPosition): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (position.startYear) {
    const sYear = Number.parseInt(position.startYear, 10);
    if (sYear > currentYear) return false;
    if (sYear === currentYear && position.startMonth) {
      const sMonth = Number.parseInt(position.startMonth, 10);
      if (sMonth > currentMonth) return false;
    }
  }

  if (!position.currentlyWorking && position.endYear) {
    const eYear = Number.parseInt(position.endYear, 10);
    if (eYear > currentYear) return false;
    if (eYear === currentYear && position.endMonth) {
      const eMonth = Number.parseInt(position.endMonth, 10);
      if (eMonth > currentMonth) return false;
    }
  }

  return true;
}

export function isEmploymentPositionValid(position: EmploymentPosition): boolean {
  const hasStart = Boolean(position.startMonth && position.startYear);
  const hasEnd = Boolean(position.endMonth && position.endYear);

  return (
    Boolean(position.jobTitle.trim() && position.company.trim()) &&
    hasStart &&
    (position.currentlyWorking || hasEnd) &&
    isPositionDateOrderValid(position) &&
    isPositionDateNotInFuture(position)
  );
}

export function deriveExperienceLevel(positions: EmploymentPosition[]): ExperienceLevel {
  const now = new Date();
  let totalMonths = 0;

  for (const position of positions) {
    if (!position.startMonth || !position.startYear) continue;

    const start = new Date(
      Number.parseInt(position.startYear, 10),
      Number.parseInt(position.startMonth, 10) - 1,
      1,
    );

    const end =
      position.currentlyWorking || !position.endMonth || !position.endYear
        ? now
        : new Date(
            Number.parseInt(position.endYear, 10),
            Number.parseInt(position.endMonth, 10) - 1,
            1,
          );

    if (end >= start) {
      totalMonths +=
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
    }
  }

  const years = totalMonths / 12;
  if (years >= 10) return "leader";
  if (years >= 4) return "established";
  return "emerging";
}

export function getPositionSummary(position: EmploymentPosition, index: number): string {
  const title = position.jobTitle.trim();
  const company = position.company.trim();

  if (title && company) return `${title} at ${company}`;
  if (title) return title;
  if (company) return company;
  return `Position ${index + 1}`;
}

export function getFilledEmploymentPositions(positions: EmploymentPosition[]): EmploymentPosition[] {
  return positions.filter((position) => position.jobTitle.trim() || position.company.trim());
}

export function formatPositionDates(position: EmploymentPosition): string {
  const startMonthLabel =
    MONTH_OPTIONS.find((month) => month.value === position.startMonth)?.label.slice(0, 3) ?? "";
  const start =
    startMonthLabel && position.startYear ? `${startMonthLabel} ${position.startYear}` : "";

  if (position.currentlyWorking) {
    return start ? `${start} – Present` : "Present";
  }

  const endMonthLabel =
    MONTH_OPTIONS.find((month) => month.value === position.endMonth)?.label.slice(0, 3) ?? "";
  const end = endMonthLabel && position.endYear ? `${endMonthLabel} ${position.endYear}` : "";

  if (start && end) return `${start} – ${end}`;
  return start || end || "";
}

export type EducationDegree = {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear: string;
  honours: string;
};

export type NotableLink = {
  id: string;
  url: string;
  type: string;
};

export type NotableAchievements = {
  selectedTypes: string[];
  description: string;
  links: NotableLink[];
};

export const MAX_EDUCATION_DEGREES = 4;
export const MAX_ACHIEVEMENT_DESCRIPTION = 300;

export const DEGREE_OPTIONS = [
  "High School",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "MBA",
  "PhD / Doctorate",
  "Diploma",
  "Professional Certification",
  "Other",
] as const;

export const FIELD_OF_STUDY_OPTIONS = [
  "Computer Science / IT",
  "Engineering",
  "Business Administration",
  "Finance / Accounting",
  "Marketing / Communications",
  "Economics",
  "Law / Legal Studies",
  "Medicine / Healthcare",
  "Design / Arts / Architecture",
  "Social Sciences / Psychology",
  "Humanities",
  "Sciences (Physics, Chemistry, Bio)",
  "Other",
] as const;

export const LINK_TYPES = [
  "LinkedIn",
  "Press Article",
  "TED Talk",
  "YouTube",
  "Portfolio",
  "Other",
] as const;

export const ACHIEVEMENT_TYPE_OPTIONS = [
  { id: "founded", label: "Founded a company" },
  { id: "funding", label: "Raised ₹1Cr+ funding" },
  { id: "exit", label: "Successful exit / acquisition" },
  { id: "media", label: "Media / press features" },
  { id: "awards", label: "Awards & recognitions" },
  { id: "published", label: "Published books / papers" },
  { id: "speaker", label: "Speaker at conferences" },
  { id: "team", label: "Led a team of 50+" },
  { id: "revenue", label: "₹10Cr+ revenue impact" },
  { id: "international", label: "International experience" },
  { id: "social", label: "10K+ YouTube / social followers" },
  { id: "government", label: "Government / policy work" },
] as const;

export function createEmptyEducationDegree(): EducationDegree {
  return {
    id: generateUUID(),
    degree: "",
    fieldOfStudy: "",
    institution: "",
    graduationYear: "",
    honours: "",
  };
}

export function createEmptyNotableLink(): NotableLink {
  return {
    id: generateUUID(),
    url: "",
    type: "LinkedIn",
  };
}

export function createEmptyNotableAchievements(): NotableAchievements {
  return {
    selectedTypes: [],
    description: "",
    links: [createEmptyNotableLink()],
  };
}

export function getDegreeSummary(degree: EducationDegree, index: number): string {
  const qualification = degree.degree.trim();
  const institution = degree.institution.trim();
  const field = degree.fieldOfStudy.trim();

  if (qualification && institution) return `${qualification} · ${institution}`;
  if (qualification && field) return `${qualification} · ${field}`;
  if (qualification) return qualification;
  if (institution) return institution;
  return `Degree ${index + 1}`;
}

export function isEducationDegreeStarted(degree: EducationDegree): boolean {
  return Boolean(
    degree.degree ||
      degree.fieldOfStudy.trim() ||
      degree.institution.trim() ||
      degree.graduationYear.trim() ||
      degree.honours.trim(),
  );
}

export function getFilledEducationDegrees(degrees: EducationDegree[]): EducationDegree[] {
  return degrees.filter(isEducationDegreeStarted);
}

export function isGraduationYearInvalid(graduationYear: string): boolean {
  const val = graduationYear.trim();
  if (!val) return false;
  const year = Number.parseInt(val, 10);
  const currentYear = new Date().getFullYear();
  const minYear = 1950;
  const maxYear = currentYear + 6;
  return val.length < 4 || Number.isNaN(year) || year < minYear || year > maxYear;
}

export function isEducationDegreeValid(degree: EducationDegree): boolean {
  if (!isEducationDegreeStarted(degree)) return true;
  if (!degree.institution.trim()) return false;
  if (isGraduationYearInvalid(degree.graduationYear)) return false;
  return true;
}
