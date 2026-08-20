import type { ExpertApplicationSubmission } from "./expertApplicationSubmission";
import {
  formatPositionDates,
  getFilledEducationDegrees,
  getFilledEmploymentPositions,
} from "./expertEmployment";
import { formatTimezoneLabel } from "./expertAvailability";
import {
  buildPricingMenu,
  computeCompleteness,
  formatSubmittedDate,
  getAskedRate,
  getCategoryColor,
  getExperienceYearsLabel,
  getSlaStatus,
  getSubmittedAgo,
} from "./expertApplicationsStore";
import { getFormatTitle, getSessionLengthLabel, getLowestFormatPrice } from "@/components/expert/onboarding/preferencesData";
import type { ExpertProfileRatingItem } from "./adminExpertProfile";
import { ADMIN_PROFILE } from "./adminDashboard";
import { expertiseTags, type Expert, type ExpertiseTag } from "./experts";

const DOC_ICON_VARIANTS = ["red", "blue", "purple", "yellow"] as const;

const AUDIENCE_LABELS: Record<string, string> = {
  startup: "Startup Founders",
  enterprise: "Enterprise Execs",
  career: "Career Transitioners",
  smb: "Small Business Owners",
};

function safeSkills(skills: unknown): string[] {
  if (Array.isArray(skills)) return skills.filter((s): s is string => typeof s === "string");
  if (typeof skills === "string" && skills.trim()) {
    return skills.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function safeDays(days: unknown): string[] {
  if (Array.isArray(days)) return days.filter((d): d is string => typeof d === "string");
  if (typeof days === "string" && days.trim()) {
    return days.split(",").map((d) => d.trim()).filter(Boolean);
  }
  return [];
}

function isAdminVerified(app: ExpertApplicationSubmission): boolean {
  return app.status === "approved";
}

function kycCheckStatus(
  hasData: boolean,
  app: ExpertApplicationSubmission,
): "verified" | "pending" | "missing" {
  if (!hasData) return "missing";
  if (isAdminVerified(app)) return "verified";
  return "pending";
}

function verificationStatus(
  hasData: boolean,
  app: ExpertApplicationSubmission,
): "pass" | "pending" | "missing" {
  if (!hasData) return "missing";
  if (isAdminVerified(app)) return "pass";
  return "pending";
}

function checklistStatus(
  hasData: boolean,
  app: ExpertApplicationSubmission,
  excellent = false,
): "passed" | "excellent" | "pending" {
  if (!hasData) return "pending";
  if (!isAdminVerified(app)) return "pending";
  return excellent ? "excellent" : "passed";
}

function getAudienceLabel(id: string): string {
  return AUDIENCE_LABELS[id] ?? id;
}

function buildPortfolioItems(app: ExpertApplicationSubmission) {
  const verified = isAdminVerified(app);
  const items: {
    id: string;
    title: string;
    subtitle: string;
    url?: string;
    type: "link" | "document";
    verified: boolean;
  }[] = [];
  const seenIds = new Set<string>();

  const pushItem = (item: {
    id: string;
    title: string;
    subtitle: string;
    url?: string;
    type: "link" | "document";
    verified: boolean;
  }) => {
    let uniqueId = item.id;
    let counter = 1;
    while (seenIds.has(uniqueId)) {
      uniqueId = `${item.id}-${counter++}`;
    }
    seenIds.add(uniqueId);
    items.push({ ...item, id: uniqueId });
  };

  const normalizedAppLinkedin = app.linkedin ? app.linkedin.trim().replace(/^https?:\/\//i, "") : "";
  const normalizedAppPortfolio = app.portfolio ? app.portfolio.trim().replace(/^https?:\/\//i, "") : "";

  if (app.linkedin) {
    pushItem({
      id: "portfolio-linkedin",
      title: "LinkedIn Profile",
      subtitle: "Professional network profile",
      url: app.linkedin.startsWith("http") ? app.linkedin : `https://${app.linkedin}`,
      type: "link" as const,
      verified,
    });
  }

  for (const link of app.portfolioLinks ?? []) {
    if (!link.url.trim()) continue;
    const normalizedLinkUrl = link.url.trim().replace(/^https?:\/\//i, "");
    if (normalizedAppLinkedin && normalizedLinkUrl === normalizedAppLinkedin) {
      continue;
    }
    if (normalizedAppPortfolio && normalizedLinkUrl === normalizedAppPortfolio) {
      continue;
    }
    pushItem({
      id: link.id || `portfolio-${link.platform.toLowerCase()}`,
      title: link.platform,
      subtitle: link.url,
      url: link.url.startsWith("http") ? link.url : `https://${link.url}`,
      type: "link" as const,
      verified,
    });
  }

  if (
    app.portfolio &&
    normalizedAppPortfolio !== normalizedAppLinkedin &&
    !(app.portfolioLinks ?? []).some(
      (link) => link.url.trim().replace(/^https?:\/\//i, "") === normalizedAppPortfolio,
    )
  ) {
    pushItem({
      id: "portfolio-site",
      title: "Portfolio / Website",
      subtitle: "Work samples and case studies",
      url: app.portfolio.startsWith("http") ? app.portfolio : `https://${app.portfolio}`,
      type: "link" as const,
      verified,
    });
  }

  for (const sample of app.portfolioSamples ?? []) {
    pushItem({
      id: sample.id ? `sample-${sample.id}` : `sample-${sample.fileName}`,
      title: sample.description.trim() || sample.fileName,
      subtitle: `${sample.fileSize} · ${sample.fileType}`,
      url: sample.url,
      type: "document" as const,
      verified: sample.status === "complete" && verified,
    });
  }

  return items;
}

function inferCertIssuer(name: string): string {
  if (/bar council/i.test(name)) return "Bar Council of India";
  if (/google|ux/i.test(name)) return "Google";
  if (/llb|law/i.test(name)) return "University";
  if (/degree|certificate/i.test(name)) return "Issuing Institution";
  return "Uploaded during onboarding";
}

function isUserUploadedMedia(url: string): boolean {
  return url.startsWith("data:") || url.startsWith("blob:");
}

function buildReviewDocuments(app: ExpertApplicationSubmission) {
  const verified = isAdminVerified(app);
  const docs: {
    id: string;
    name: string;
    iconVariant: (typeof DOC_ICON_VARIANTS)[number];
    verified: boolean;
    url: string | null;
    size?: string;
  }[] = [];
  const seenIds = new Set<string>();

  const pushDoc = (doc: {
    id: string;
    name: string;
    iconVariant: (typeof DOC_ICON_VARIANTS)[number];
    verified: boolean;
    url: string | null;
    size?: string;
  }) => {
    if (seenIds.has(doc.id)) return;
    seenIds.add(doc.id);
    docs.push(doc);
  };

  const typeLabels: Record<string, string> = {
    aadhaar: "Aadhaar Card",
    pan: "PAN Card",
    passport: "Passport",
    voter: "Voter ID",
    driving: "Driving Licence",
  };

  if (app.avatar && isUserUploadedMedia(app.avatar)) {
    pushDoc({
      id: "profile-photo",
      name: "Profile Photo",
      iconVariant: DOC_ICON_VARIANTS[docs.length % DOC_ICON_VARIANTS.length],
      verified,
      url: app.avatar,
    });
  }

  if (app.governmentId?.front) {
    const label = typeLabels[app.governmentId.type] ?? "Government ID";
    pushDoc({
      id: "gov-id-front",
      name: `${label} (Front)`,
      iconVariant: DOC_ICON_VARIANTS[docs.length % DOC_ICON_VARIANTS.length],
      verified,
      url: app.governmentId.front.url ?? getCertificatePreviewUrl({ name: label }),
      size: app.governmentId.front.size,
    });
  }

  if (app.governmentId?.back) {
    const label = typeLabels[app.governmentId.type] ?? "Government ID";
    pushDoc({
      id: "gov-id-back",
      name: `${label} (Back)`,
      iconVariant: DOC_ICON_VARIANTS[docs.length % DOC_ICON_VARIANTS.length],
      verified,
      url: app.governmentId.back.url ?? getCertificatePreviewUrl({ name: label }),
      size: app.governmentId.back.size,
    });
  }

  for (const cert of app.certificates) {
    if (isIdentityDocumentName(cert.name)) {
      pushDoc({
        id: cert.id,
        name: cert.name,
        iconVariant: DOC_ICON_VARIANTS[docs.length % DOC_ICON_VARIANTS.length],
        verified,
        url: getCertificatePreviewUrl(cert),
        size: cert.size,
      });
    }
  }

  return docs;
}

function buildReviewCertifications(app: ExpertApplicationSubmission) {
  const verified = isAdminVerified(app);
  const seenIds = new Set<string>();

  return app.certificates
    .filter((cert) => !isIdentityDocumentName(cert.name))
    .filter((cert) => {
      if (seenIds.has(cert.id)) return false;
      seenIds.add(cert.id);
      return true;
    })
    .map((cert) => ({
      id: cert.id,
      name: cert.name.replace(/\.pdf$/i, ""),
      issuer: cert.issuer ?? inferCertIssuer(cert.name),
      verified,
      url: getCertificatePreviewUrl(cert),
    }));
}

function buildReviewExperience(app: ExpertApplicationSubmission) {
  const positions = getFilledEmploymentPositions(app.employmentPositions ?? []);
  const seenIds = new Set<string>();

  if (positions.length > 0) {
    return positions
      .filter((position) => {
        if (seenIds.has(position.id)) return false;
        seenIds.add(position.id);
        return true;
      })
      .map((position) => ({
        id: position.id,
        title: position.jobTitle.trim() || "Role",
        company: position.company.trim() || "—",
        level: getExperienceYearsLabel(app.experienceLevel),
        dates: formatPositionDates(position),
        description: position.responsibilities.trim() || "No responsibilities provided.",
        skills: safeSkills(app.skills).slice(0, 3),
      }));
  }

  if (!app.professionalTitle.trim() && !app.bio.trim() && !app.tagLine.trim()) {
    return [];
  }

  return [
    {
      id: "fallback-experience",
      title: app.professionalTitle || "Professional",
      company: app.categoryLabel || "—",
      level: getExperienceYearsLabel(app.experienceLevel),
      dates: "Submitted via onboarding",
      description: app.bio || app.tagLine || "No experience summary provided.",
      skills: safeSkills(app.skills).slice(0, 3),
    },
  ];
}

function buildReviewEducation(app: ExpertApplicationSubmission) {
  const degrees = getFilledEducationDegrees(app.educationDegrees ?? []);
  const seenIds = new Set<string>();

  return degrees
    .filter((degree) => {
      if (seenIds.has(degree.id)) return false;
      seenIds.add(degree.id);
      return true;
    })
    .map((degree) => ({
      id: degree.id,
      degree: degree.degree.trim() || "Degree",
      field: degree.fieldOfStudy.trim() || "—",
      institution: degree.institution.trim() || "—",
      year: degree.graduationYear.trim() || "—",
      honours: degree.honours.trim() || undefined,
    }));
}

function buildReviewAvailability(app: ExpertApplicationSubmission) {
  const seenKeys = new Set<string>();
  const slots: { id: string; days: string; hours: string }[] = [];

  for (const slot of app.availabilitySlots ?? []) {
    const daysArr = safeDays(slot.days);
    const key = `${daysArr.join(",")}_${slot.from}_${slot.to}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    slots.push({
      id: slot.id,
      days: daysArr.length > 0 ? daysArr.join(", ") : "No days selected",
      hours: slot.from && slot.to ? `${slot.from} – ${slot.to}` : "Hours not set",
    });
  }

  return {
    timezone: app.timezone,
    timezoneLabel: app.timezone ? formatTimezoneLabel(app.timezone) : "Not configured",
    acceptCustomRequests: app.acceptCustomRequests ?? false,
    slots,
  };
}

function buildCategoryFit(app: ExpertApplicationSubmission) {
  const skills = safeSkills(app.skills);
  const audiences = (Array.isArray(app.audiences) ? app.audiences : []).map(getAudienceLabel);
  const languages = Array.isArray(app.languages) ? app.languages : [];
  const checks = [
    Boolean(app.categoryLabel),
    skills.length >= 3,
    languages.length >= 1,
    audiences.length >= 1,
    skills.length >= 5,
  ];
  const passed = checks.filter(Boolean).length;
  const matchScore = Math.round((passed / checks.length) * 100);

  let recommendation: "strong" | "moderate" | "review" = "review";
  if (matchScore >= 80) recommendation = "strong";
  else if (matchScore >= 60) recommendation = "moderate";

  return {
    primaryCategory: app.categoryLabel,
    categoryId: app.categoryId,
    skills,
    audiences,
    languages,
    skillCount: skills.length,
    matchScore,
    recommendation,
    flags: [
      {
        id: "f1",
        label: "Category–skills alignment",
        clear: skills.length >= 3,
      },
      {
        id: "f2",
        label: "Target audience defined",
        clear: app.audiences.length > 0,
      },
      {
        id: "f3",
        label: "Language coverage",
        clear: app.languages.length > 0,
      },
      {
        id: "f4",
        label: "Duplicate category submission",
        clear: true,
      },
    ],
  };
}

function buildVerificationChecks(app: ExpertApplicationSubmission) {
  const idDocument = findIdentityDocument(app);
  const checks = [
    {
      id: "email",
      label: "Email",
      value: app.email || "Not provided",
      status: verificationStatus(Boolean(app.email), app),
    },
    {
      id: "phone",
      label: "Phone",
      value: app.phone || "Not provided",
      status: verificationStatus(Boolean(app.phone), app),
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      value: app.linkedin || "Not provided",
      status: verificationStatus(Boolean(app.linkedin), app),
    },
    {
      id: "gov_id",
      label: "Government ID",
      value: idDocument?.name ?? "Not uploaded",
      status: verificationStatus(Boolean(idDocument), app),
    },
    {
      id: "certs",
      label: "Credentials",
      value: `${app.certificates.length} document${app.certificates.length === 1 ? "" : "s"}`,
      status: verificationStatus(app.certificates.length > 0, app),
    },
    {
      id: "portfolio",
      label: "Portfolio Link",
      value: app.portfolio || "Not provided",
      status: verificationStatus(Boolean(app.portfolio), app),
    },
  ];

  const passed = checks.filter((check) => check.status === "pass").length;
  return {
    score: Math.round((passed / checks.length) * 100),
    checks,
  };
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

function maskPhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.length <= 4) return trimmed;
  return `${trimmed.slice(0, 3)}${"•".repeat(Math.max(trimmed.length - 7, 4))}${trimmed.slice(-4)}`;
}

function findIdentityDocument(app: ExpertApplicationSubmission) {
  if (app.governmentId?.front) {
    const typeLabels: Record<string, string> = {
      aadhaar: "Aadhaar Card",
      pan: "PAN Card",
      passport: "Passport",
      voter: "Voter ID",
      driving: "Driving Licence",
    };
    return {
      name: typeLabels[app.governmentId.type] ?? "Government ID",
      url: app.governmentId.front.url,
    };
  }
  const pattern = /identity|photo id|aadhaar|aadhar|pan card|passport|government|voter|driving/i;
  return app.certificates.find((cert) => pattern.test(cert.name)) ?? null;
}

function isIdentityDocumentName(name: string): boolean {
  return /identity|photo id|aadhaar|aadhar|pan card|passport|government|voter|driving/i.test(name);
}

function getCertificatePreviewUrl(cert: { name: string; url?: string }): string | null {
  if (cert.url) return cert.url;
  if (isIdentityDocumentName(cert.name)) {
    return "/assets/img/consultantphoto.png";
  }
  if (/\.pdf$/i.test(cert.name)) {
    return "/assets/legal.png";
  }
  return null;
}

function buildReviewKyc(app: ExpertApplicationSubmission) {
  const idDocument = findIdentityDocument(app);
  const hasGovId = Boolean(idDocument);
  const hasEmail = Boolean(app.email);
  const hasPhone = Boolean(app.phone);

  const checks = [
    {
      id: "gov_id",
      label: "Government ID",
      value: idDocument?.name ?? "Not uploaded",
      status: kycCheckStatus(hasGovId, app),
    },
    {
      id: "email",
      label: "Email Verification",
      value: hasEmail ? maskEmail(app.email) : "Not provided",
      status: kycCheckStatus(hasEmail, app),
    },
    {
      id: "phone",
      label: "Phone / OTP Verification",
      value: hasPhone ? maskPhone(app.phone) : "Not provided",
      status: kycCheckStatus(hasPhone, app),
    },
    {
      id: "name",
      label: "Legal Name on ID",
      value: app.name || "Not provided",
      status: kycCheckStatus(Boolean(app.name), app),
    },
    {
      id: "location",
      label: "Location Declaration",
      value: app.location || "Not provided",
      status: kycCheckStatus(Boolean(app.location), app),
    },
  ];

  const submittedCount = checks.filter((check) => check.status !== "missing").length;
  const matchScore = Math.round((submittedCount / checks.length) * 100);
  const overallStatus = isAdminVerified(app)
    ? ("complete" as const)
    : hasGovId && hasEmail && hasPhone
      ? ("partial" as const)
      : ("pending" as const);

  return {
    overallStatus,
    matchScore,
    provider: "Government ID verification",
    verifiedAt: isAdminVerified(app) ? formatSubmittedDate(app.submittedAt) : null,
    checks,
    idDocumentName: idDocument?.name ?? null,
    idDocumentUrl: idDocument ? getCertificatePreviewUrl(idDocument) : null,
    videoUrl: app.kycVideoUrl ?? null,
    hasVideo: Boolean(app.kycVideoUrl),
  };
}

export function mapToApplicationReview(app: ExpertApplicationSubmission) {
  const sla = getSlaStatus(app.submittedAt);
  const completeness = computeCompleteness(app);
  const queueIndex = 1;
  const queueTotal = 1;

  return {
    appId: app.appId,
    name: app.name,
    title: `${app.professionalTitle} · ${getExperienceYearsLabel(app.experienceLevel)}`,
    category: app.categoryLabel,
    avatar: app.avatar,
    submittedDate: formatSubmittedDate(app.submittedAt),
    status: app.status,
    slaLabel: sla.slaLabel,
    slaLimit: "SLA 48hr",
    queueIndex,
    queueTotal,
    indexScore: completeness,
    city: app.location.split(",")[0]?.trim() || app.location,
    email: app.email,
    phone: app.phone,
    languages: app.languages.join(" + ") || "—",
    askedRate: getAskedRate(app),
    completeness,
    bio: app.bio || app.tagLine,
    idVerified: isAdminVerified(app),
    linkedIn: Boolean(app.linkedin),
    stats: [
      { label: "YRS EXP.", value: app.experienceLevel === "leader" ? "10+" : app.experienceLevel === "established" ? "4-9" : "1-3" },
      { label: "SESSIONS", value: "0" },
      { label: "CREDENTIALS", value: String(app.certificates.length) },
    ],
    certifications: buildReviewCertifications(app),
    documents: buildReviewDocuments(app),
    kyc: buildReviewKyc(app),
    portfolio: buildPortfolioItems(app),
    experienceItems: buildReviewExperience(app),
    educationItems: buildReviewEducation(app),
    availability: buildReviewAvailability(app),
    categoryFit: buildCategoryFit(app),
    notes: app.reviewerNote
      ? [
          {
            id: "n1",
            author: ADMIN_PROFILE.name,
            avatar: ADMIN_PROFILE.avatar,
            timestamp: formatSubmittedDate(app.submittedAt),
            text: app.reviewerNote,
          },
        ]
      : [],
  };
}

export function mapApplicationToExpert(app: ExpertApplicationSubmission): Expert {
  const primaryTopic = mapCategoryToExpertiseTag(app);
  const lowestPrice = getLowestFormatPrice(app.formatPrices);
  const price = lowestPrice ? Number(lowestPrice) : 299;
  const sampleAnswers =
    app.tagLine && app.bio
      ? [{ question: app.tagLine, answer: app.bio }]
      : app.bio
        ? [
            {
              question: `What expertise does ${app.name.split(" ")[0]} offer?`,
              answer: app.bio,
            },
          ]
        : undefined;

  return {
    name: app.name,
    role: app.professionalTitle,
    desc: app.tagLine || app.bio || app.professionalTitle,
    bio: app.bio,
    image: app.avatar,
    category: app.categoryLabel,
    topics: [primaryTopic, ...(safeSkills(app.skills).slice(0, 4) as ExpertiseTag[])],
    languages: app.languages.length > 0 ? app.languages : ["English"],
    price,
    rating: 5,
    replyTime: "24 hr",
    location: app.location,
    sampleAnswers,
    email: app.email,
    phone: app.phone,
    formats: app.formats,
    formatPrices: app.formatPrices,
  };
}

function mapCategoryToExpertiseTag(app: ExpertApplicationSubmission): ExpertiseTag {
  const exact = expertiseTags.find((tag) => tag === app.categoryLabel);
  if (exact) return exact;

  const byId: Record<string, ExpertiseTag> = {
    legal: "Legal & Compliance",
    finance: "Startup & Fundraising",
    marketing: "SMB Growth",
    design: "Creator Access",
    software: "Career & Jobs",
  };

  return byId[app.categoryId] ?? "Career & Jobs";
}

export function mapToExpertProfile(app: ExpertApplicationSubmission) {
  const completeness = computeCompleteness(app);

  return {
    appId: app.appId,
    name: app.name,
    headline: app.professionalTitle,
    category: app.categoryLabel,
    categoryBadge: app.categoryLabel,
    topApplicant: isAdminVerified(app) && completeness >= 90,
    avatar: app.avatar,
    submittedDate: formatSubmittedDate(app.submittedAt),
    location: app.location,
    experienceLabel: getExperienceYearsLabel(app.experienceLevel),
    phone: app.phone,
    idVerified: isAdminVerified(app),
    linkedIn: Boolean(app.linkedin),
    phoneVerified: isAdminVerified(app) && Boolean(app.phone),
    trustScore: completeness,
    stats: [
      { label: "YRS EXP", value: app.experienceLevel === "leader" ? "10+" : app.experienceLevel === "established" ? "4-9" : "1-3" },
      { label: "SESSIONS", value: "0" },
      { label: "AVG RATING", value: "—" },
      { label: "DOCS", value: String(app.certificates.length) },
      { label: "PORTFOLIO", value: app.portfolio ? "1" : "0" },
      { label: "COMPLETE", value: `${completeness}%` },
    ],
    languages: Array.isArray(app.languages) ? app.languages : [],
    expertise: safeSkills(app.skills).slice(0, 4).map((skill, index) => ({
      label: skill,
      color: [getCategoryColor(app.categoryLabel), "var(--tango)", "#3B82F6", "var(--green)"][index % 4],
    })),
    bio: app.bio,
    videoTranscript: app.tagLine ? `"${app.tagLine}"` : "",
    videoDuration: app.formats.includes("video") ? "Pending upload" : "Not provided",
    pricing: buildPricingMenu(app),
    availability: (app.availabilitySlots ?? []).flatMap((slot) => {
      const daysArr = safeDays(slot.days);
      return daysArr.length > 0
        ? [
            {
              id: slot.id,
              label: daysArr.join(", "),
              hours: `${slot.from} – ${slot.to}`,
              variant: "open" as const,
            },
          ]
        : [];
    }),
    availabilityNote: app.timezone ? `Timezone: ${app.timezone}` : "Availability set during onboarding.",
    experience: (getFilledEmploymentPositions(app.employmentPositions ?? []).length > 0
      ? getFilledEmploymentPositions(app.employmentPositions ?? []).map((pos) => ({
          id: pos.id,
          title: pos.jobTitle.trim() || app.professionalTitle,
          company: `${pos.company.trim()} · ${app.location}`,
          dates: formatPositionDates(pos),
          description: pos.responsibilities.trim() || app.bio || app.tagLine,
          skills: safeSkills(app.skills).slice(0, 3),
          iconVariant: "purple" as const,
        }))
      : [
          {
            id: "e1",
            title: app.professionalTitle || "Professional",
            company: `${app.categoryLabel} · ${app.location}`,
            dates: "From onboarding",
            description: app.bio || app.tagLine,
            skills: safeSkills(app.skills).slice(0, 3),
            iconVariant: "purple" as const,
          },
        ]
    ),
    allSkills: safeSkills(app.skills),
    audiences: app.audiences.map(getAudienceLabel),
    portfolioItems: buildPortfolioItems(app),
    verification: buildVerificationChecks(app),
    ratings: {
      avgRating: null,
      totalReviews: 0,
      items: [] as ExpertProfileRatingItem[],
    },
    internalNotes: app.reviewerNote
      ? [
          {
            id: "n1",
            author: ADMIN_PROFILE.name,
            avatar: ADMIN_PROFILE.avatar,
            timestamp: formatSubmittedDate(app.submittedAt),
            text: app.reviewerNote,
          },
        ]
      : [],
  };
}

export function mapToApprovalConfirmation(app: ExpertApplicationSubmission) {
  const completeness = computeCompleteness(app);
  const hasPricing = getLowestFormatPrice(app.formatPrices) > 0;
  const hasAvailability = (app.availabilitySlots ?? []).some((slot) => safeDays(slot.days).length > 0);

  const checklist = [
    {
      id: "c1",
      title: "Identity Verification",
      description: "Contact details and profile identity captured during onboarding.",
      status: checklistStatus(Boolean(app.email && app.phone), app),
    },
    {
      id: "c2",
      title: "Professional Credentials",
      description: "Certificates and portfolio links submitted in onboarding.",
      status: checklistStatus(app.certificates.length > 0, app),
    },
    {
      id: "c4",
      title: "Sample Answer Quality",
      description: "Bio and tagline provided during identity step.",
      status: checklistStatus(Boolean(app.bio), app, true),
    },
    {
      id: "c5",
      title: "Pricing Policy",
      description: "Consultation prices set during onboarding preferences.",
      status: checklistStatus(hasPricing, app),
    },
    {
      id: "c6",
      title: "Availability Calendar",
      description: "Weekly schedule configured in availability step.",
      status: checklistStatus(hasAvailability, app),
    },
    {
      id: "c7",
      title: "Terms Agreement",
      description: "Accepted during registration flow — pending admin confirmation.",
      status: checklistStatus(true, app),
    },
    {
      id: "c8",
      title: "Platform Flags",
      description: "Duplicate account and sanctions screening.",
      status: checklistStatus(true, app),
    },
    {
      id: "c9",
      title: "LinkedIn Validation",
      description: "LinkedIn profile link from credentials step.",
      status: checklistStatus(Boolean(app.linkedin), app),
    },
    {
      id: "c10",
      title: "Payout Method Setup",
      description: "Bank or UPI details required before first payout.",
      status: "pending" as const,
    },
  ];

  const passed = checklist.filter((item) => item.status !== "pending").length;
  const recommendation =
    app.status === "rejected"
      ? ("reject" as const)
      : app.status === "on_hold"
        ? ("hold" as const)
        : ("approve" as const);

  return {
    appId: app.appId,
    name: app.name,
    category: app.categoryLabel,
    avatar: app.avatar,
    location: app.location,
    experience: getExperienceYearsLabel(app.experienceLevel),
    trustScore: completeness,
    trustMax: 100,
    recommendation,
    quickStats: [
      {
        label: "Docs Verified",
        value: isAdminVerified(app)
          ? `${app.certificates.length}/${Math.max(app.certificates.length, 1)}`
          : `0/${Math.max(app.certificates.length, 1)}`,
        done: isAdminVerified(app) && app.certificates.length > 0,
      },
      {
        label: "Sample Answer",
        value: app.bio ? (isAdminVerified(app) ? "Verified" : "Pending Review") : "Missing",
        done: isAdminVerified(app) && Boolean(app.bio),
      },
      {
        label: "Availability",
        value: hasAvailability
          ? isAdminVerified(app)
            ? "Verified"
            : "Pending Review"
          : "Missing",
        done: isAdminVerified(app) && hasAvailability,
      },
    ],
    reviewerNote: {
      author: ADMIN_PROFILE.name,
      timestamp: formatSubmittedDate(app.submittedAt),
      text:
        app.reviewerNote ||
        `${app.name} completed expert onboarding with ${completeness}% profile completeness.`,
    },
    checklist,
    credentials: [
      ...(app.email
        ? [
            {
              id: "cr-email",
              label: "Email",
              status: verificationStatus(true, app),
            },
          ]
        : []),
      ...(app.phone
        ? [
            {
              id: "cr-phone",
              label: "Phone",
              status: verificationStatus(true, app),
            },
          ]
        : []),
      ...app.certificates.map((cert) => ({
        id: cert.id,
        label: cert.name,
        status: verificationStatus(true, app),
      })),
      { id: "cr-bank", label: "Bank / UPI", status: "pending" as const },
    ],
    riskResults: [
      { id: "r1", label: "Duplicate Account", result: "Clear", clear: true },
      { id: "r2", label: "Sanctions List", result: "Clear", clear: true },
      { id: "r3", label: "Document Forgery", result: "Clear", clear: true },
      { id: "r4", label: "Prior Violations", result: "None", clear: true },
    ],
    checklistPassed: passed,
    checklistTotal: checklist.length,
    adminName: ADMIN_PROFILE.name,
  };
}

export function mapToRejectionHold(app: ExpertApplicationSubmission) {
  const completeness = computeCompleteness(app);
  const sla = getSlaStatus(app.submittedAt);

  return {
    appId: app.appId,
    name: app.name,
    avatar: app.avatar,
    status: app.status === "pending" ? "Under Review" : app.status.replace("_", " "),
    submittedDate: formatSubmittedDate(app.submittedAt),
    profileScore: completeness,
    riskFlag: sla.slaStatus === "breached" ? ("Medium" as const) : ("Low" as const),
    defaultDecision: "hold" as const,
    defaultReasonId: "incomplete_profile",
    decisionSummary: `${app.name} submitted onboarding for ${app.categoryLabel}. Profile awaiting final review. Completeness: ${completeness}%.`,
    resubmissionGuidance:
      "Please review the feedback and update any incomplete sections in your expert onboarding profile.",
    whatsappPreview: `Hi ${app.name}, your Jatayu expert application (${app.appId}) requires updates before approval.`,
    templateVariables: ["{{expert_name}}", "{{app_id}}", "{{rejection_reason}}", "{{reapply_date}}"],
    reviewHistory: [
      {
        id: "h1",
        title: "Application Submitted",
        description: "Expert completed onboarding and submitted application.",
        timestamp: formatSubmittedDate(app.submittedAt),
        status: "done" as const,
      },
      {
        id: "h2",
        title: "Onboarding Data Received",
        description: `Category: ${app.categoryLabel}. Skills: ${safeSkills(app.skills).slice(0, 3).join(", ")}.`,
        timestamp: getSubmittedAgo(app.submittedAt),
        status: "done" as const,
      },
      {
        id: "h3",
        title: "Decision Pending",
        description: "Awaiting admin reject or hold decision.",
        timestamp: "Now",
        status: "current" as const,
      },
    ],
    reviewerName: ADMIN_PROFILE.name,
  };
}

export function getSlaAlert(applications: ExpertApplicationSubmission[]) {
  const breached = applications.filter(
    (app) => getSlaStatus(app.submittedAt).slaStatus === "breached",
  );
  const oldest = breached[0];

  if (!oldest) {
    return {
      count: 0,
      oldestAppId: "",
      oldestName: "",
      oldestCategory: "",
      oldestHours: 0,
      risk: "",
    };
  }

  const sla = getSlaStatus(oldest.submittedAt);

  return {
    count: breached.length,
    oldestAppId: oldest.appId,
    oldestName: oldest.name,
    oldestCategory: oldest.categoryLabel,
    oldestHours: sla.hoursElapsed,
    risk: "Expert drop-off",
  };
}
