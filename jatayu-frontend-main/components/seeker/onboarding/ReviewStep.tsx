"use client";

import Image from "next/image";
import {
  ArrowRight,
  Target,
  Tag,
  FileText,
  Sparkles,
  Clock,
  MessageSquare,
  Globe,
  Wallet,
  User,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import shared from "./onboarding.shared.module.css";
import styles from "./ReviewStep.module.css";

type ReviewStepProps = {
  userName: string;
  categoryLabel: string;
  selectedTopics: string[];
  needsText: string;
  selectedOutcomeLabel: string;
  selectedUrgencyLabel: string;
  selectedFormatLabel: string;
  selectedLanguageLabel: string;
  selectedBudgetLabel: string;
  budgetValue: number;
  firstName: string;
  experienceLevel: string;
  communicationStyleLabel: string;
  onEditStep: (step: any) => void;
  onBack: () => void;
  onContinue: () => void;
};

export default function ReviewStep({
  userName,
  categoryLabel,
  selectedTopics,
  needsText,
  selectedOutcomeLabel,
  selectedUrgencyLabel,
  selectedFormatLabel,
  selectedLanguageLabel,
  selectedBudgetLabel,
  budgetValue,
  firstName,
  experienceLevel,
  communicationStyleLabel,
  onEditStep,
  onBack,
  onContinue,
}: ReviewStepProps) {
  // Format communication style key to user friendly label
  const getStyleLabel = (style: string) => {
    if (style === "direct") return "Direct & Concise";
    if (style === "collaborative") return "Collaborative & Warm";
    if (style === "analytical") return "Detailed & Analytical";
    return style || "Collaborative & Warm";
  };

  // Truncate long challenge descriptions
  const getTruncatedChallenge = (text: string) => {
    if (text.length <= 110) return text;
    return `${text.slice(0, 110)}...`;
  };

  const topicsSummary = () => {
    if (selectedTopics.length === 0) return "No topics selected";
    if (selectedTopics.length <= 2) return selectedTopics.join(", ");
    return `${selectedTopics.slice(0, 2).join(", ")}, +${selectedTopics.length - 2} more`;
  };

  return (
    <section className={shared.card} style={{ maxWidth: "1080px", minHeight: "860px" }}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
          <div className={shared.stepPill}>
            <span>Step 11 of 12 · Final Review</span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className={shared.progressContainer}>
          <div className={shared.progressTextRow}>
            <span>Matching Progress</span>
            <span>98%</span>
          </div>
          <div className={shared.progressBarBg}>
            <div className={shared.progressBarFill} style={{ width: "98%" }} />
          </div>
        </div>
      </div>

      <div className={shared.cardBody} style={{ minHeight: "auto", maxHeight: "none", overflowY: "visible" }}>
        {/* Heading */}
        <h1 className={shared.questionTitle} style={{ margin: "0 auto 12px" }}>
          Review your <span className={shared.accentWord}>preferences</span>
        </h1>

        <p className={shared.questionSubtitle} style={{ margin: "0 auto 36px" }}>
          Everything looks good? You can edit any section before we find your matches.
        </p>

        {/* Review Cards Grid */}
        <div className={styles.reviewGrid}>
          {/* Card 1: Main Need */}
          <div className={styles.reviewCard}>
            <div className={styles.cardHeaderRow}>
              <div className={styles.labelWrap}>
                <Target size={14} className={styles.cardIcon} />
                <span className={styles.cardLabel}>MAIN NEED</span>
              </div>
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => onEditStep("category")}
              >
                EDIT
              </button>
            </div>
            <p className={styles.cardValue}>{categoryLabel || "Not selected"}</p>
          </div>

          {/* Card 2: Topics */}
          <div className={styles.reviewCard}>
            <div className={styles.cardHeaderRow}>
              <div className={styles.labelWrap}>
                <Tag size={14} className={styles.cardIcon} />
                <span className={styles.cardLabel}>TOPICS</span>
              </div>
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => onEditStep("topics")}
              >
                EDIT
              </button>
            </div>
            <p className={styles.cardValue}>{topicsSummary()}</p>
          </div>

          {/* Card 3: Challenge (Spans full width) */}
          <div className={`${styles.reviewCard} ${styles.fullWidthCard}`}>
            <div className={styles.cardHeaderRow}>
              <div className={styles.labelWrap}>
                <FileText size={14} className={styles.cardIcon} />
                <span className={styles.cardLabel}>CHALLENGE</span>
              </div>
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => onEditStep("needs")}
              >
                EDIT
              </button>
            </div>
            <p className={styles.cardValue}>
              {getTruncatedChallenge(needsText || "Not described")}
              {needsText.length > 110 && (
                <span
                  className={styles.readMore}
                  onClick={() => onEditStep("needs")}
                >
                  {" "}
                  Read more
                </span>
              )}
            </p>
          </div>

          {/* Card 4: Desired Outcome */}
          <div className={styles.reviewCard}>
            <div className={styles.cardHeaderRow}>
              <div className={styles.labelWrap}>
                <Sparkles size={14} className={styles.cardIcon} />
                <span className={styles.cardLabel}>DESIRED OUTCOME</span>
              </div>
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => onEditStep("outcome")}
              >
                EDIT
              </button>
            </div>
            <p className={styles.cardValue}>{selectedOutcomeLabel}</p>
          </div>

          {/* Card 5: Urgency */}
          <div className={styles.reviewCard}>
            <div className={styles.cardHeaderRow}>
              <div className={styles.labelWrap}>
                <Clock size={14} className={styles.cardIcon} />
                <span className={styles.cardLabel}>URGENCY</span>
              </div>
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => onEditStep("urgency")}
              >
                EDIT
              </button>
            </div>
            <p className={styles.cardValue}>{selectedUrgencyLabel}</p>
          </div>

          {/* Card 6: Format */}
          <div className={styles.reviewCard}>
            <div className={styles.cardHeaderRow}>
              <div className={styles.labelWrap}>
                <MessageSquare size={14} className={styles.cardIcon} />
                <span className={styles.cardLabel}>FORMAT</span>
              </div>
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => onEditStep("format")}
              >
                EDIT
              </button>
            </div>
            <p className={styles.cardValue}>{selectedFormatLabel}</p>
          </div>

          {/* Card 7: Language */}
          <div className={styles.reviewCard}>
            <div className={styles.cardHeaderRow}>
              <div className={styles.labelWrap}>
                <Globe size={14} className={styles.cardIcon} />
                <span className={styles.cardLabel}>LANGUAGE</span>
              </div>
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => onEditStep("language")}
              >
                EDIT
              </button>
            </div>
            <p className={styles.cardValue}>{selectedLanguageLabel} (primary)</p>
          </div>

          {/* Card 8: Budget */}
          <div className={styles.reviewCard}>
            <div className={styles.cardHeaderRow}>
              <div className={styles.labelWrap}>
                <Wallet size={14} className={styles.cardIcon} />
                <span className={styles.cardLabel}>BUDGET</span>
              </div>
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => onEditStep("budget")}
              >
                EDIT
              </button>
            </div>
            <p className={styles.cardValue}>
              {selectedBudgetLabel} · ${budgetValue}/session
            </p>
          </div>

          {/* Card 9: About You */}
          <div className={styles.reviewCard}>
            <div className={styles.cardHeaderRow}>
              <div className={styles.labelWrap}>
                <User size={14} className={styles.cardIcon} />
                <span className={styles.cardLabel}>ABOUT YOU</span>
              </div>
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => onEditStep("personalisation")}
              >
                EDIT
              </button>
            </div>
            <p className={styles.cardValue}>
              {firstName || "Alex"} · {experienceLevel || "Experienced"} · {getStyleLabel(communicationStyleLabel)}
            </p>
          </div>
        </div>

        {/* Accuracy and Tips Bottom Row */}
        <div className={styles.bottomSection}>
          {/* Estimated Accuracy Card */}
          <div className={styles.accuracyCard}>
            <div className={styles.accuracyHeader}>
              <TrendingUp size={16} className={styles.accuracyIcon} />
              <span>Your Estimated Match Accuracy</span>
            </div>
            <div className={styles.accuracyContent}>
              <div className={styles.percentageGlow}>98%</div>
              <div className={styles.accuracyMeta}>
                <strong>Excellent Fit</strong>
                <span>Based on your detailed timeline, preferences, and custom scope details.</span>
              </div>
            </div>
          </div>

          {/* Match Tips Box */}
          <div className={styles.tipsCard}>
            <h4 className={styles.tipsTitle}>✨ Match Improvement Tips</h4>
            <ul className={styles.tipsList}>
              <li>
                <strong>Extend formats:</strong> Consider adding Video Call or Phone Call to match with more scheduling slots.
              </li>
              <li>
                <strong>Provide details:</strong> The challenge text is high quality and will be sent to guides for matching.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
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
            <strong>All set!</strong>
            <small>Ready to start matching process.</small>
          </div>
        </div>

        <div className={shared.footerActions}>
          <button
            type="button"
            className={shared.textBtn}
            onClick={onBack}
          >
            Back
          </button>
          <button
            type="button"
            className={shared.continueBtn}
            onClick={onContinue}
          >
            <span>Find My Matches</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
