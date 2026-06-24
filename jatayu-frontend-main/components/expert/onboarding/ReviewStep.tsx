"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Star, Briefcase, Languages, MapPin } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
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

type ExperienceLevel = "emerging" | "established" | "leader";
type SelectedExperienceLevel = ExperienceLevel | "";

type ReviewStepProps = {
  userName: string;
  selectedSkills: string[];
  experienceLevel: SelectedExperienceLevel;
  professionalTitle: string;
  tagLine: string;
  bio: string;
  onBioChange: (value: string) => void;
  categoryLabel: string;
  selectedFormats: string[];
  selectedLengths: string[];
  formatPrices: Record<string, string>;
  stepCompletion: boolean[];
  onStepCompleteChange?: (step: number, complete: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
  onJumpToStep: (step: any) => void;
  onProgressStepClick?: (step: number) => void;
};

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  emerging: "Emerging Expert · 1–3 years",
  established: "Established Professional · 4–9 years",
  leader: "Industry Leader · 10+ years",
};

export default function ReviewStep({
  userName,
  selectedSkills,
  experienceLevel,
  professionalTitle,
  tagLine,
  bio,
  onBioChange,
  categoryLabel,
  selectedFormats,
  selectedLengths,
  formatPrices,
  stepCompletion,
  onStepCompleteChange,
  onBack,
  onSubmit,
  onJumpToStep,
  onProgressStepClick,
}: ReviewStepProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const previewSkills = selectedSkills.slice(0, 3);
  const skillsSummary =
    selectedSkills.length > 0 ? selectedSkills.join(", ") : "None selected";

  const nameParts = userName.trim().split(/\s+/);
  const [firstName, setFirstName] = useState(nameParts[0] ?? "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" "));
  const [role, setRole] = useState(professionalTitle);
  const [isEditing, setIsEditing] = useState(false);

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

  const mockExpert: Expert = {
    name: `${firstName} ${lastName}`.trim() || userName.trim() || "Your Name",
    role: role || professionalTitle || "Professional Title",
    desc: tagLine.trim() || "Your tag line appears here.",
    image: "/assets/img/avatar1.png",
    category: categoryLabel || "Category",
    topics: [],
    languages: [],
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
        <div className={shared.stepPill}>
          <span>Step 9 of 9 - Review Profile</span>
        </div>
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
          <div className={styles.finalTipIconWrap}>💡</div>
          <div className={styles.finalTipTextWrap}>
            <h5 className={styles.finalTipTitle}>Final Tip</h5>
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
              <ExpertCard expert={mockExpert} linkToDetail={false} disableHover={true} showLanguages={false} />
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
                    <span className={detailStyles.metaVal}>English, Hindi</span>
                  </div>
                  <div className={detailStyles.metaItem}>
                    <div className={detailStyles.metaIconBadge}>
                      <MapPin size={13} />
                    </div>
                    <span className={detailStyles.metaVal}>Mumbai, India</span>
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
              <span className={styles.reviewDetailLabel}>Experience</span>
              <span className={styles.reviewDetailValue}>
                {experienceLevel ? EXPERIENCE_LABELS[experienceLevel] : "Not selected"}
              </span>
            </div>
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>Core Skills</span>
              <span className={styles.reviewDetailValue}>{skillsSummary}</span>
            </div>
          </div>
        </div>

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
            <div className={styles.reviewDetailRow}>
              <span className={styles.reviewDetailLabel}>Custom Requests</span>
              <span className={styles.reviewDetailValue}>Accepted</span>
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
          <button type="button" className={shared.textBtn} onClick={onSubmit}>
            Skip
          </button>
          <button
            type="button"
            className={`${shared.continueBtn} ${!agreedToTerms ? styles.continueBtnDisabled : ""}`}
            onClick={onSubmit}
            disabled={!agreedToTerms}
          >
            <span>Submit for Verification</span>
          </button>        </div>
      </div>
    </section>
  );
}
