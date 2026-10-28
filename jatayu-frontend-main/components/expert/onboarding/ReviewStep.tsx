"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  BriefcaseBusiness,
  Clock3,
  GraduationCap,
  Link as LinkIcon,
  MapPin,
} from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import ContinueButton from "@/components/ui/ContinueButton";
import shared from "./onboarding.shared.module.css";
import styles from "./ReviewStep.module.css";
import {
  formatPreferencesPricingSummary,
  getSessionLengthLabel,
} from "./preferencesData";
import {
  deriveExperienceLevel,
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
  location?: string;
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

function getProfileLink(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
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
  location = "",
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
  const profileName = userName.trim();
  const nameParts = profileName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");
  const role = professionalTitle.trim();
  const initials = nameParts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const hasProfilePhoto = Boolean(
    profilePhotoSrc.trim() && profilePhotoSrc !== "/assets/img/manportrait.png",
  );
  const linkedinHref = getProfileLink(linkedin);
  const hasCategory = Boolean(categoryLabel.trim() && categoryLabel !== "Not selected");

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
  const portfolioSamplesSummary = formatPortfolioSamplesSummary(portfolioSamples);
  const certificatesSummary = formatCertificatesSummary(certificates);
  const governmentIdSummary = formatGovernmentIdSummary(governmentId);
  const availabilitySummary = formatAvailabilitySummary(timezone, availabilitySlots);

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


      <div className={styles.reviewCanvas}>
        <section className={styles.profileHeader} aria-label="Profile preview">
          <div className={styles.coverBanner} aria-hidden="true" />
          <div className={styles.profileHeaderBody}>
            <div className={styles.profileAvatar}>
              {hasProfilePhoto ? (
                <Image
                  src={profilePhotoSrc}
                  alt={profileName ? `${profileName} profile photo` : "Profile photo"}
                  width={144}
                  height={144}
                  className={styles.profileAvatarImage}
                  unoptimized={profilePhotoSrc.startsWith("blob:") || profilePhotoSrc.startsWith("data:")}
                />
              ) : (
                <span aria-hidden="true">{initials || <BriefcaseBusiness size={38} />}</span>
              )}
            </div>

            <div className={styles.profileIdentity}>
              <h2 className={styles.profileName}>{profileName || "Name not provided"}</h2>
              {role ? <p className={styles.profileHeadline}>{role}</p> : null}
              {tagLine.trim() ? <p className={styles.profileTagline}>{tagLine.trim()}</p> : null}
              {location.trim() || hasCategory || filledEmployment.length > 0 ? (
                <div className={styles.profileMeta}>
                  {location.trim() ? (
                    <span className={styles.profileLocation}>
                      <MapPin size={14} aria-hidden="true" />
                      {location.trim()}
                    </span>
                  ) : null}
                  {hasCategory ? <span>{categoryLabel}</span> : null}
                  {hasCategory && filledEmployment.length > 0 ? <span aria-hidden="true">·</span> : null}
                  {filledEmployment.length > 0 ? (
                    <span>{EXPERIENCE_LABELS[derivedExperienceLevel]}</span>
                  ) : null}
                </div>
              ) : null}
              {linkedin.trim() ? (
                linkedinHref ? (
                  <a
                    className={styles.profileLink}
                    href={linkedinHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open LinkedIn profile in a new tab"
                  >
                    <LinkIcon size={16} aria-hidden="true" />
                    <span>{linkedin.trim()}</span>
                  </a>
                ) : (
                  <span className={styles.profileLink}>
                    <LinkIcon size={16} aria-hidden="true" />
                    <span>{linkedin.trim()}</span>
                  </span>
                )
              ) : null}
            </div>

            {bio.trim() ? <p className={styles.profileBio}>{bio.trim()}</p> : null}
          </div>
        </section>

        <div className={styles.profileSections}>
          <section className={`${styles.reviewBlockCard} ${styles.wideCard}`}>
            <div className={styles.reviewBlockHeader}>
              <h3 className={styles.reviewBlockTitle}>Experience</h3>
            </div>
            {filledEmployment.length ? (
              <div className={styles.entryList}>
                {filledEmployment.map((position) => {
                  const dates = formatPositionDates(position);
                  return (
                    <article className={styles.profileEntry} key={position.id}>
                      <div className={styles.entryIcon}><BriefcaseBusiness size={20} aria-hidden="true" /></div>
                      <div className={styles.entryContent}>
                        {position.jobTitle.trim() ? (
                          <h4 className={styles.entryTitle}>{position.jobTitle.trim()}</h4>
                        ) : null}
                        {position.company.trim() ? (
                          <p className={styles.entrySubtitle}>{position.company.trim()}</p>
                        ) : null}
                        {dates ? <p className={styles.entryMeta}>{dates}</p> : null}
                        {position.responsibilities.trim() ? (
                          <p className={styles.entryDescription}>{position.responsibilities.trim()}</p>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className={styles.emptyValue}>No employment history added</p>
            )}
          </section>

          <section className={styles.reviewBlockCard}>
            <div className={styles.reviewBlockHeader}>
              <h3 className={styles.reviewBlockTitle}>Education</h3>
            </div>
            {filledEducation.length ? (
              <div className={styles.entryList}>
                {filledEducation.map((degree) => (
                  <article className={styles.profileEntry} key={degree.id}>
                    <div className={styles.entryIcon}><GraduationCap size={20} aria-hidden="true" /></div>
                    <div className={styles.entryContent}>
                      {degree.degree.trim() ? <h4 className={styles.entryTitle}>{degree.degree.trim()}</h4> : null}
                      {degree.fieldOfStudy.trim() ? <p className={styles.entrySubtitle}>{degree.fieldOfStudy.trim()}</p> : null}
                      {degree.institution.trim() ? <p className={styles.entryMeta}>{degree.institution.trim()}</p> : null}
                      {degree.graduationYear.trim() ? <p className={styles.entryMeta}>{degree.graduationYear.trim()}</p> : null}
                      {degree.honours.trim() ? <p className={styles.entryDescription}>{degree.honours.trim()}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.emptyValue}>No education added</p>
            )}
          </section>

          <section className={styles.reviewBlockCard}>
            <div className={styles.reviewBlockHeader}>
              <h3 className={styles.reviewBlockTitle}>Consultation Details</h3>
            </div>
            <div className={styles.detailList}>
              <div className={styles.detailItem}>
                <span className={styles.reviewDetailLabel}>Formats & Pricing</span>
                <span className={styles.reviewDetailValue}>{formatsSummary}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.reviewDetailLabel}>Session Length</span>
                <span className={styles.reviewDetailValue}>{sessionLengthsSummary}</span>
              </div>
            </div>
          </section>

          <section className={styles.reviewBlockCard}>
            <div className={styles.reviewBlockHeader}>
              <h3 className={styles.reviewBlockTitle}>Audience & Languages</h3>
            </div>
            <div className={styles.detailList}>
              <div className={styles.detailItem}>
                <span className={styles.reviewDetailLabel}>Languages</span>
                <span className={styles.reviewDetailValue}>
                  {languages.length ? languages.join(", ") : "Not selected"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.reviewDetailLabel}>Target Audiences</span>
                <span className={styles.reviewDetailValue}>
                  {selectedAudiences.length
                    ? selectedAudiences.map((id) => AUDIENCE_LABELS[id] ?? id).join(", ")
                    : "Not selected"}
                </span>
              </div>
              {hasCategory ? (
                <div className={styles.detailItem}>
                  <span className={styles.reviewDetailLabel}>Category</span>
                  <span className={styles.reviewDetailValue}>{categoryLabel}</span>
                </div>
              ) : null}
              <div className={styles.detailItem}>
                <span className={styles.reviewDetailLabel}>Core Skills</span>
                {selectedSkills.length ? (
                  <ul className={styles.skillList}>
                    {selectedSkills.map((skill) => <li key={skill}>{skill}</li>)}
                  </ul>
                ) : (
                  <span className={styles.reviewDetailValue}>None selected</span>
                )}
              </div>
            </div>
          </section>

          <section className={styles.reviewBlockCard}>
            <div className={styles.reviewBlockHeader}>
              <h3 className={styles.reviewBlockTitle}>Portfolio</h3>
            </div>
            <div className={styles.detailList}>
              <div className={styles.detailItem}>
                <span className={styles.reviewDetailLabel}>Portfolio URL</span>
                <span className={styles.reviewDetailValue}>
                  {portfolio.trim() || "Not added"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.reviewDetailLabel}>Portfolio Samples</span>
                <span className={styles.reviewDetailValue}>{portfolioSamplesSummary}</span>
              </div>
            </div>
          </section>

          <section className={styles.reviewBlockCard}>
            <div className={styles.reviewBlockHeader}>
              <h3 className={styles.reviewBlockTitle}>Credentials</h3>
            </div>
            <div className={styles.detailList}>
              <div className={styles.detailItem}>
                <span className={styles.reviewDetailLabel}>Government ID</span>
                <span className={styles.reviewDetailValue}>{governmentIdSummary}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.reviewDetailLabel}>KYC Video</span>
                <span className={styles.reviewDetailValue}>
                  {kycVideoUrl.trim() ? "Uploaded" : "Not uploaded"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.reviewDetailLabel}>Certificates</span>
                <span className={styles.reviewDetailValue}>{certificatesSummary}</span>
              </div>
            </div>
          </section>

          <section className={styles.reviewBlockCard}>
            <div className={styles.reviewBlockHeader}>
              <h3 className={styles.reviewBlockTitle}>Availability</h3>
            </div>
            <div className={styles.detailList}>
              <div className={styles.detailItem}>
                <span className={styles.reviewDetailLabel}><Clock3 size={15} aria-hidden="true" /> Weekly Schedule</span>
                <span className={styles.reviewDetailValue}>{availabilitySummary}</span>
              </div>
            </div>
          </section>
        </div>

      <div className={styles.termsBar}>
        <div className={styles.termsLabel}>
          <input
            type="checkbox"
            className={styles.termsCheckbox}
            aria-label="By submitting, you agree to our terms and privacy policy"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
          />
          <span className={styles.termsText}>
            BY SUBMITTING, YOU AGREE TO{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>OUR TERMS</a> AND{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>PRIVACY POLICY</a>
          </span>
        </div>
      </div>
      </div>

      </div>

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
            <small>You&apos;re all set to submit your application.</small>
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
