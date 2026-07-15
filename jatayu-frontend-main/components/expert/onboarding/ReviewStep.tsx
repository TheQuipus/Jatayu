"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Star, Briefcase, Languages, Lightbulb } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import ContinueButton from "@/components/ui/ContinueButton";
import shared from "./onboarding.shared.module.css";
import styles from "./ReviewStep.module.css";
import ExpertCard from "@/components/ui/ExpertCard";
import { type Expert } from "@/lib/experts";
import detailStyles from "../ExpertDetail.module.css";
import {
  formatPreferencesPricingSummary,
  getLowestFormatPrice,
  getSessionLengthLabel,
} from "./preferencesData";
import {
  deriveExperienceLevel,
  getDegreeSummary,
  getPositionSummary,
  isEducationDegreeStarted,
  MONTH_OPTIONS,
  type EducationDegree,
  type EmploymentPosition,
  type ExperienceLevel,
} from "@/lib/expertEmployment";
import { formatTimezoneLabel, type TimeSlot } from "@/lib/expertAvailability";
import type {
  ExpertCertificate,
  GovernmentIdData,
  GovernmentIdType,
  PortfolioSampleFile,
} from "@/lib/expertApplicationSubmission";

type ReviewStepProps = {
  userName: string;
  selectedSkills: string[];
  employmentPositions: EmploymentPosition[];
  educationDegrees: EducationDegree[];
  professionalTitle: string;
  tagLine: string;
  bio: string;
  onBioChange: (value: string) => void;
  categoryLabel: string;
  linkedin: string;
  portfolio: string;
  portfolioSamples: PortfolioSampleFile[];
  governmentId: GovernmentIdData | null;
  kycVideoUrl: string;
  certificates: ExpertCertificate[];
  languages: string[];
  selectedAudiences: string[];
  timezone: string;
  availabilitySlots: TimeSlot[];
  selectedFormats: string[];
  selectedLengths: string[];
  formatPrices: Record<string, string>;
  profilePhotoSrc: string;
  stepCompletion: boolean[];
  onStepCompleteChange?: (step: number, complete: boolean) => void;
  onBack: () => void;
  onSubmit: (payload: {
    name: string;
    professionalTitle: string;
    termsAccepted: boolean;
  }) => void | Promise<void>;
  onJumpToStep: (step: string) => void;
  onProgressStepClick?: (step: number) => void;
};

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  emerging: "Emerging Expert · 1–3 years",
  established: "Established Professional · 4–9 years",
  leader: "Industry Leader · 10+ years",
};

const AUDIENCE_LABELS: Record<string, string> = {
  startup: "Startup Founders",
  enterprise: "Enterprise Execs",
  career: "Career Transitioners",
  smb: "Small Business Owners",
};

const GOVERNMENT_ID_LABELS: Record<GovernmentIdType, string> = {
  aadhaar: "Aadhaar Card",
  pan: "PAN Card",
  passport: "Passport",
  voter: "Voter ID",
  driving: "Driving Licence",
};

function formatPositionDates(position: EmploymentPosition): string {
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

function getFilledEmploymentPositions(positions: EmploymentPosition[]) {
  return positions.filter((position) => position.jobTitle.trim() || position.company.trim());
}

function getFilledEducationDegrees(degrees: EducationDegree[]) {
  return degrees.filter(isEducationDegreeStarted);
}

function formatPortfolioSamplesSummary(samples: PortfolioSampleFile[]): string {
  const uploaded = samples.filter((sample) => sample.fileName.trim());
  if (uploaded.length === 0) return "None uploaded";
  return uploaded.map((sample) => sample.fileName).join(", ");
}

function formatCertificatesSummary(certificates: ExpertCertificate[]): string {
  if (certificates.length === 0) return "None added";
  return certificates
    .map((certificate) => certificate.name || certificate.fileName || "Certificate")
    .join(", ");
}

function formatGovernmentIdSummary(governmentId: GovernmentIdData | null): string {
  if (!governmentId) return "Not uploaded";
  const label = GOVERNMENT_ID_LABELS[governmentId.type] ?? governmentId.type;
  const sides = governmentId.back ? "Front & back uploaded" : "Front uploaded";
  return `${label} · ${sides}`;
}

function formatAvailabilitySummary(timezone: string, slots: TimeSlot[]): string {
  const activeSlots = slots.filter((slot) => slot.days.length > 0 && slot.from && slot.to);
  if (!timezone && activeSlots.length === 0) return "Not configured";

  const parts = [
    timezone ? formatTimezoneLabel(timezone) : "",
    ...activeSlots.map((slot) => `${slot.days.join(", ")} · ${slot.from} – ${slot.to}`),
  ].filter(Boolean);

  return parts.join(" | ");
}

function ReviewDetailList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className={styles.reviewDetailValue}>Not added</span>;
  }

  return (
    <ul className={styles.reviewDetailList}>
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className={styles.reviewDetailListItem}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function ReviewStep({
  userName,
  selectedSkills,
  employmentPositions,
  educationDegrees,
  professionalTitle,
  tagLine,
  bio,
  onBioChange,
  categoryLabel,
  linkedin,
  portfolio,
  portfolioSamples,
  governmentId,
  kycVideoUrl,
  certificates,
  languages,
  selectedAudiences,
  timezone,
  availabilitySlots,
  selectedFormats,
  selectedLengths,
  formatPrices,
  profilePhotoSrc,
  stepCompletion,
  onStepCompleteChange,
  onBack,
  onSubmit,
  onJumpToStep,
  onProgressStepClick,
}: ReviewStepProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const skillsSummary =
    selectedSkills.length > 0 ? selectedSkills.join(", ") : "None selected";

  const nameParts = userName.trim().split(/\s+/);
  const [firstName, setFirstName] = useState(nameParts[0] ?? "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" "));
  const [role, setRole] = useState(() => professionalTitle ?? "");
  const [isEditing, setIsEditing] = useState(false);

  const filledEmployment = useMemo(
    () => getFilledEmploymentPositions(employmentPositions),
    [employmentPositions],
  );
  const filledEducation = useMemo(
    () => getFilledEducationDegrees(educationDegrees),
    [educationDegrees],
  );
  const derivedExperienceLevel = useMemo(
    () => deriveExperienceLevel(employmentPositions),
    [employmentPositions],
  );

  const employmentSummaries = useMemo(
    () =>
      filledEmployment.map((position, index) => {
        const summary = getPositionSummary(position, index);
        const dates = formatPositionDates(position);
        return [summary, dates].filter(Boolean).join(" · ");
      }),
    [filledEmployment],
  );

  const educationSummaries = useMemo(
    () => filledEducation.map((degree, index) => getDegreeSummary(degree, index)),
    [filledEducation],
  );

  useEffect(() => {
    if (!isEditing) {
      setRole(professionalTitle);
    }
  }, [professionalTitle, isEditing]);

  useEffect(() => {
    onStepCompleteChange?.(9, agreedToTerms);
  }, [agreedToTerms, onStepCompleteChange]);

  const formatsSummary = formatPreferencesPricingSummary(selectedFormats, formatPrices);
  const sessionLengthsSummary =
    selectedLengths.length > 0
      ? selectedLengths.map(getSessionLengthLabel).join(", ")
      : selectedFormats.length === 1 && selectedFormats[0] === "written"
        ? "Not required"
        : "Not selected";
  const previewPrice = getLowestFormatPrice(formatPrices);

  const languagesSummary =
    languages.length > 0 ? languages.join(", ") : "Not selected";

  const audiencesSummary =
    selectedAudiences.length > 0
      ? selectedAudiences.map((id) => AUDIENCE_LABELS[id] ?? id).join(", ")
      : "Not selected";

  const portfolioSamplesSummary = formatPortfolioSamplesSummary(portfolioSamples);
  const certificatesSummary = formatCertificatesSummary(certificates);
  const governmentIdSummary = formatGovernmentIdSummary(governmentId);
  const availabilitySummary = formatAvailabilitySummary(timezone, availabilitySlots);

  const mockExpert: Expert = {
    name: `${firstName} ${lastName}`.trim() || userName.trim() || "Your Name",
    role: role || professionalTitle || "Professional Title",
    desc: tagLine.trim() || "Your tag line appears here.",
    image: profilePhotoSrc,
    category: categoryLabel || "Category",
    topics: [],
    languages,
    price: previewPrice,
    rating: 0,
    replyTime: "0 min",
    bio: bio,
  };

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
      <div className={shared.topHeader}>
        <OnboardingStepTitle userName={userName} />
      </div>

      {/* Progress Tracker */}
      <OnboardingProgressBar currentStep={9} stepCompletion={stepCompletion} onStepClick={onProgressStepClick} />

      </div>

      <div className={shared.cardBody}>
{/* Heading */}
      <h1 className={`${shared.questionTitle} ${styles.questionTitle}`}>
        Review your <span className={shared.accentWord}>Expert Profile</span>
      </h1>

      <p className={`${shared.questionSubtitle} ${styles.questionSubtitle}`} style={{ marginBottom: "32px" }}>
        Take a final look at your application before submitting it for verification.
      </p>

      {/* Top Cards Row: Profile Strength & Final Tip */}
      <div className={styles.reviewTopRow} style={{ marginBottom: "28px" }}>
        {/* Profile Strength Card */}
        <div className={styles.strengthReportCard}>
          <div className={styles.strengthReportInfo}>
            <span className={styles.strengthReportLabel}>Profile Strength</span>
            <h4 className={styles.strengthReportValue}>Verification Ready</h4>
          </div>
          <div className={styles.strengthGradeBadge}>
            <span>A+</span>
          </div>
        </div>

        {/* Final Tip Card */}
        <div className={styles.finalTipCard}>
          <div className={styles.finalTipIconWrap}>
            <Lightbulb size={20} aria-hidden="true" />
          </div>
          <div className={styles.finalTipTextWrap}>
            <h5 className={styles.finalTipTitle}>Pro Tip</h5>
            <p className={styles.finalTipDesc}>
              Your profile looks great! Adding a short video introduction later can boost your bookings by up to 30%.
            </p>
          </div>
        </div>
      </div>

      {/* Identity Block */}
      <div className={styles.reviewBlockCard} style={{ marginBottom: "20px" }}>
        <div className={styles.reviewBlockHeader} style={{ marginBottom: "20px" }}>
          <h4 className={styles.reviewBlockTitle}>Professional Identity</h4>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={styles.reviewEditBtn}
          >
            {isEditing ? "Save" : "Edit"}
          </button>
        </div>

        <div className={styles.reviewIdentityColumns}>
          <div className={styles.reviewLeftCol}>
            <div className={styles.expertCardWrapper}>
              <ExpertCard
                expert={mockExpert}
                linkToDetail={false}
                disableHover={true}
                showLanguages={languages.length > 0}
              />
            </div>
          </div>
          <div className={`${detailStyles.centerCol} ${styles.reviewCenterCol}`}>
            {isEditing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", textAlign: "left" }}>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "6px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        padding: "10px 14px",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                        fontFamily: "var(--font-body)",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "6px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        padding: "10px 14px",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                        fontFamily: "var(--font-body)",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "6px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Professional Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      padding: "10px 14px",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none",
                      fontFamily: "var(--font-body)",
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "6px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => onBioChange(e.target.value)}
                    rows={4}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      padding: "10px 14px",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "var(--font-body)",
                      lineHeight: "1.5",
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className={`display ${detailStyles.displayName}`} style={{ textAlign: "left" }}>
                  <span>{firstName}</span>
                  <span className="t-muted"> {lastName}</span>
                </h1>

                <p className={detailStyles.roleSub} style={{ textAlign: "left" }}>{role}</p>

                {tagLine.trim() ? (
                  <p className={detailStyles.roleSub} style={{ textAlign: "left", opacity: 0.75 }}>
                    {tagLine}
                  </p>
                ) : null}

                <div className={detailStyles.starDivider}>
                  <span className={detailStyles.dividerStar}>✦</span>
                  <span className={detailStyles.dividerLine} />
                </div>

                <div className={detailStyles.ratingsRow}>
                  <div className={detailStyles.ratingItem}>
                    <Star size={16} fill="#EAB308" stroke="#EAB308" />
                    <span className={detailStyles.ratingText}>
                      <strong>0.0</strong> (0 reviews)
                    </span>
                  </div>
                  <div className={detailStyles.ratingItem}>
                    <Briefcase size={16} className={detailStyles.statsIcon} />
                    <span className={detailStyles.ratingText}>
                      <strong>0 Sessions Completed</strong>
                    </span>
                  </div>
                </div>

                <div className={detailStyles.metaRow}>
                  <div className={detailStyles.metaItem}>
                    <div className={detailStyles.metaIconBadge}>
                      <Languages size={13} />
                    </div>
                    <span className={detailStyles.metaVal}>{languagesSummary}</span>
                  </div>
                </div>

                <p className={detailStyles.bioText} style={{ textAlign: "left" }}>
                  {bio}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Compact Section Cards */}
      <div className={styles.reviewSplitRow} style={{ marginBottom: "20px" }}>
        <div className={styles.reviewBlockCard}>
          <div className={styles.reviewBlockHeader}>
            <h4 className={styles.reviewBlockTitle}>Expertise & Experience</h4>
            <button
              type="button"
              onClick={() => onJumpToStep("experience")}
              className={styles.reviewEditBtn}
            >
              Edit
            </button>
          </div>

          <div className={styles.reviewBlockContent}>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>Category</span>
              <span className={styles.reviewDetailValue}>{categoryLabel}</span>
            </div>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>Core Skills</span>
              <span className={styles.reviewDetailValue}>{skillsSummary}</span>
            </div>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>Experience Level</span>
              <span className={styles.reviewDetailValue}>
                {EXPERIENCE_LABELS[derivedExperienceLevel]}
              </span>
            </div>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>Employment</span>
              <ReviewDetailList items={employmentSummaries} />
            </div>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>Education</span>
              <ReviewDetailList items={educationSummaries} />
            </div>
          </div>
        </div>

        <div className={styles.reviewBlockCard}>
          <div className={styles.reviewBlockHeader}>
            <h4 className={styles.reviewBlockTitle}>Portfolio</h4>
            <button
              type="button"
              onClick={() => onJumpToStep("experience")}
              className={styles.reviewEditBtn}
            >
              Edit
            </button>
          </div>

          <div className={styles.reviewBlockContent}>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>Portfolio URL</span>
              <span className={styles.reviewDetailValue}>
                {portfolio.trim() || "Not added"}
              </span>
            </div>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>Portfolio Samples</span>
              <span className={styles.reviewDetailValue}>{portfolioSamplesSummary}</span>
            </div>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>LinkedIn</span>
              <span className={styles.reviewDetailValue}>
                {linkedin.trim() || "Not added"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.reviewSplitRow} style={{ marginBottom: "20px" }}>
        <div className={styles.reviewBlockCard}>
          <div className={styles.reviewBlockHeader}>
            <h4 className={styles.reviewBlockTitle}>Consultation Details</h4>
            <button
              type="button"
              onClick={() => onJumpToStep("preferences")}
              className={styles.reviewEditBtn}
            >
              Edit
            </button>
          </div>

          <div className={styles.reviewBlockContent}>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>Formats & Pricing</span>
              <span className={styles.reviewDetailValue}>{formatsSummary}</span>
            </div>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>Session Length</span>
              <span className={styles.reviewDetailValue}>{sessionLengthsSummary}</span>
            </div>
          </div>
        </div>

        <div className={styles.reviewBlockCard}>
          <div className={styles.reviewBlockHeader}>
            <h4 className={styles.reviewBlockTitle}>Audience & Languages</h4>
            <button
              type="button"
              onClick={() => onJumpToStep("audience")}
              className={styles.reviewEditBtn}
            >
              Edit
            </button>
          </div>

          <div className={styles.reviewBlockContent}>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>Languages</span>
              <span className={styles.reviewDetailValue}>{languagesSummary}</span>
            </div>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>Target Audiences</span>
              <span className={styles.reviewDetailValue}>{audiencesSummary}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.reviewSplitRow} style={{ marginBottom: "20px" }}>
        <div className={styles.reviewBlockCard}>
          <div className={styles.reviewBlockHeader}>
            <h4 className={styles.reviewBlockTitle}>Credentials</h4>
            <button
              type="button"
              onClick={() => onJumpToStep("credentials")}
              className={styles.reviewEditBtn}
            >
              Edit
            </button>
          </div>

          <div className={styles.reviewBlockContent}>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>Government ID</span>
              <span className={styles.reviewDetailValue}>{governmentIdSummary}</span>
            </div>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>KYC Video</span>
              <span className={styles.reviewDetailValue}>
                {kycVideoUrl.trim() ? "Uploaded" : "Not uploaded"}
              </span>
            </div>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>Certificates</span>
              <span className={styles.reviewDetailValue}>{certificatesSummary}</span>
            </div>
          </div>
        </div>

        <div className={styles.reviewBlockCard}>
          <div className={styles.reviewBlockHeader}>
            <h4 className={styles.reviewBlockTitle}>Availability</h4>
            <button
              type="button"
              onClick={() => onJumpToStep("availability")}
              className={styles.reviewEditBtn}
            >
              Edit
            </button>
          </div>

          <div className={styles.reviewBlockContent}>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>Weekly Schedule</span>
              <span className={styles.reviewDetailValue}>{availabilitySummary}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.termsBar}>
        <label className={styles.termsLabel}>
          <input
            type="checkbox"
            className={styles.termsCheckbox}
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
          />
          <span className={styles.termsText}>
            BY SUBMITTING, YOU AGREE TO{" "}
            <a href="#" onClick={(e) => e.stopPropagation()}>OUR TERMS</a> AND{" "}
            <a href="#" onClick={(e) => e.stopPropagation()}>PRIVACY POLICY</a>
          </span>
        </label>
      </div>

      {/* Footer */}      </div>

      <div className={shared.onboardingFooter}>
        <div className={shared.footerLeft}>
          <div className={shared.avatarMiniWrap}>
            <Image
              src="/assets/img/avatar1.png"
              alt="Expert advisor"
              width={36}
              height={36}
              className={shared.avatarMini}
            />
          </div>
          <div className={shared.footerTip}>
            <strong>Ready for Review</strong>
            <small>You're all set to submit your application.</small>
          </div>
        </div>

        <div className={shared.footerActions}>
          <button type="button" className={shared.textBtn} onClick={onBack}>
            Back
          </button>
          <ContinueButton
            label="Submit for Verification"
            showArrow={false}
            onClick={() =>
              onSubmit({
                name: `${firstName} ${lastName}`.trim() || userName.trim(),
                professionalTitle: role.trim() || professionalTitle,
                termsAccepted: agreedToTerms,
              })
            }
            disabled={!agreedToTerms}
          />
        </div>
      </div>
    </section>
  );
}
