"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Briefcase, Languages, MapPin, Lightbulb } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import ExpertCard from "@/components/ui/ExpertCard";
import { type Expert } from "@/lib/experts";
import OnboardingStepTitle from "./OnboardingStepTitle";
import MatchingProgress from "./MatchingProgress";
import type { ProgressCompletion, ProgressStepKey } from "./MatchingProgress";
import shared from "./onboarding.shared.module.css";
import styles from "./ReviewStep.module.css";
import detailStyles from "../../expert/ExpertDetail.module.css";
type ReviewStepProps = {
  userName: string;
  categoryLabel: string;
  selectedTopics: string[];
  needsText: string;
  selectedFormatLabel: string;
  selectedLanguageLabel: string;
  selectedBudgetLabel: string;
  selectedBudgetPriceText: string;
  profilePhotoSrc: string;
  location: string;
  onChangeLocation: (val: string) => void;
  additionalContext: string;
  onChangeAdditionalContext: (val: string) => void;
  onEditStep: (step: any) => void;
  onBack: () => void;
  onContinue: () => void;
  progressCompletion: ProgressCompletion;
  onProgressStepClick: (step: ProgressStepKey) => void;
};

function getMatchGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  return "C";
}

export default function ReviewStep({
  userName,
  categoryLabel,
  selectedTopics,
  needsText,
  selectedFormatLabel,
  selectedLanguageLabel,
  selectedBudgetLabel,
  selectedBudgetPriceText,
  profilePhotoSrc,
  location,
  onChangeLocation,
  additionalContext,
  onChangeAdditionalContext,
  onEditStep,
  onBack,
  onContinue,
  progressCompletion,
  onProgressStepClick,
}: ReviewStepProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftLocation, setDraftLocation] = useState(location);
  const [draftAdditionalContext, setDraftAdditionalContext] = useState(additionalContext);

  const topicsSummary =
    selectedTopics.length > 0 ? selectedTopics.join(", ") : "None selected";

  const displayCompletion: ProgressCompletion = {
    ...progressCompletion,
    review: agreedToTerms,
  };

  const completedSignals = Object.values(displayCompletion).filter(Boolean).length;
  const totalSignals = Object.values(displayCompletion).length;
  const profileScore = Math.round((completedSignals / totalSignals) * 100);
  const matchGrade = getMatchGrade(profileScore);

  const nameParts = userName.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");
  const profileBio =
    needsText.trim() ||
    additionalContext.trim() ||
    "Add context to help experts understand your goals.";
  const previewStatsText = location.trim()
    ? `Based in ${location.trim()}`
    : "Add your location to complete your profile";

  const mockExpert: Expert = {
    name: userName.trim() || "Your Name",
    role: categoryLabel || "Domain not selected",
    desc: profileBio,
    image: profilePhotoSrc,
    category: categoryLabel || "Domain not selected",
    topics: [],
    languages: [],
    price: 0,
    rating: 0,
    replyTime: "—",
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      onChangeLocation(draftLocation);
      onChangeAdditionalContext(draftAdditionalContext);
      setIsEditing(false);
      return;
    }

    setDraftLocation(location);
    setDraftAdditionalContext(additionalContext);
    setIsEditing(true);
  };

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
        </div>

        <MatchingProgress
          currentStep={agreedToTerms ? undefined : "review"}
          completion={displayCompletion}
          onStepClick={onProgressStepClick}
        />
      </div>

      <div className={`${shared.cardBody} ${styles.reviewBody}`}>
        <h1 className={`${shared.questionTitle} ${styles.questionTitle}`}>
          Review your <span className={shared.accentWord}>Profile</span>
        </h1>

        <p className={`${shared.questionSubtitle} ${styles.questionSubtitle}`}>
          Take a final look at your preferences before we find your expert matches.
        </p>

        <div className={styles.reviewTopRow} style={{ marginBottom: "20px" }}>
          <div className={styles.strengthReportCard}>
            <div className={styles.strengthReportInfo}>
              <span className={styles.strengthReportLabel}>Profile Strength</span>
              <h4 className={styles.strengthReportValue}>Match Ready</h4>
            </div>
            <div className={styles.strengthGradeBadge}>
              <span>{matchGrade}</span>
            </div>
          </div>

          <div className={styles.finalTipCard}>
            <div className={styles.finalTipIconWrap}>
              <Lightbulb size={18} aria-hidden="true" />
            </div>
            <div className={styles.finalTipTextWrap}>
              <h5 className={styles.finalTipTitle}>Pro Tip</h5>
              <p className={styles.finalTipDesc}>
                Add clear challenge details and outcome goals to improve the quality of your expert matches.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.reviewBlockCard} style={{ marginBottom: "20px" }}>
          <div className={styles.reviewBlockHeader} style={{ marginBottom: "20px" }}>
            <h4 className={styles.reviewBlockTitle}>Your Profile</h4>
            <button type="button" onClick={handleToggleEdit} className={styles.reviewEditBtn}>
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
                  showLanguages={false}
                  statsText={previewStatsText}
                />
              </div>
            </div>
            <div className={`${detailStyles.centerCol} ${styles.reviewCenterCol}`}>
              {isEditing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", textAlign: "left" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "6px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Location</label>
                    <input
                      type="text"
                      value={draftLocation}
                      onChange={(e) => setDraftLocation(e.target.value)}
                      placeholder="City, Country"
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
                    <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "6px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Additional Context</label>
                    <textarea
                      value={draftAdditionalContext}
                      onChange={(e) => setDraftAdditionalContext(e.target.value)}
                      rows={4}
                      placeholder="Anything else you want your expert to know?"
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

                  <p className={detailStyles.roleSub} style={{ textAlign: "left" }}>{categoryLabel || "Domain not selected"}</p>

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
                      <span className={detailStyles.metaVal}>{selectedLanguageLabel || "Not selected"}</span>
                    </div>
                    <div className={detailStyles.metaItem}>
                      <div className={detailStyles.metaIconBadge}>
                        <MapPin size={13} />
                      </div>
                      <span className={detailStyles.metaVal}>{location.trim() || "Location not set"}</span>
                    </div>
                  </div>

                  <p className={detailStyles.bioText} style={{ textAlign: "left" }}>
                    {profileBio}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.reviewSplitRow} style={{ marginBottom: "20px" }}>
          <div className={styles.reviewBlockCard}>
            <div className={styles.reviewBlockHeader}>
              <h4 className={styles.reviewBlockTitle}>Guidance Overview</h4>
              <button type="button" onClick={() => onEditStep("category")} className={styles.reviewEditBtn}>
                Edit
              </button>
            </div>

            <div className={styles.reviewBlockContent}>
              <div className={styles.reviewDetailRow}>
                <span className={styles.reviewDetailLabel}>Domain</span>
                <span className={styles.reviewDetailValue}>{categoryLabel || "Not selected"}</span>
              </div>
              <div className={styles.reviewDetailRow}>
                <span className={styles.reviewDetailLabel}>Challenge</span>
                <span className={styles.reviewDetailValue}>{needsText.trim() || "Not described"}</span>
              </div>

            </div>
          </div>

          <div className={styles.reviewBlockCard}>
            <div className={styles.reviewBlockHeader}>
              <h4 className={styles.reviewBlockTitle}>Session Preferences</h4>
              <button type="button" onClick={() => onEditStep("format")} className={styles.reviewEditBtn}>
                Edit
              </button>
            </div>

            <div className={styles.reviewBlockContent}>
              <div className={styles.reviewDetailRow}>
                <span className={styles.reviewDetailLabel}>Format</span>
                <span className={styles.reviewDetailValue}>{selectedFormatLabel}</span>
              </div>
              <div className={styles.reviewDetailRow}>
                <span className={styles.reviewDetailLabel}>Language</span>
                <span className={styles.reviewDetailValue}>{selectedLanguageLabel}</span>
              </div>
              <div className={styles.reviewDetailRow}>
                <span className={styles.reviewDetailLabel}>Budget</span>
                <span className={styles.reviewDetailValue}>
                  {selectedBudgetLabel}
                  {selectedBudgetPriceText ? ` · ${selectedBudgetPriceText}/session` : ""}
                </span>
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
              BY CONTINUING, YOU AGREE TO{" "}
              <a href="#" onClick={(e) => e.preventDefault()}>OUR TERMS</a> AND{" "}
              <a href="#" onClick={(e) => e.preventDefault()}>PRIVACY POLICY</a>
            </span>
          </label>
        </div>
      </div>

      <div className={shared.onboardingFooter}>
        <div className={shared.footerLeft}>
          <div className={shared.avatarMiniWrap}>
            <Image
              src="/assets/img/avatar1.png"
              alt="Guide Advisor"
              width={36}
              height={36}
              className={shared.avatarMini}
            />
          </div>
          <div className={shared.footerTip}>
            <strong>Ready for Matching</strong>
            <small>You&apos;re all set to find your expert matches.</small>
          </div>
        </div>

        <div className={shared.footerActions}>
          <button type="button" className={shared.textBtn} onClick={onBack}>
            Back
          </button>
          <ContinueButton
            label="Find My Matches"
            showArrow={false}
            onClick={onContinue}
            disabled={!agreedToTerms}
          />
        </div>
      </div>
    </section>
  );
}
