"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import shared from "./onboarding.shared.module.css";
import styles from "./NeedsStep.module.css";

type NeedsStepProps = {
  userName: string;
  needsText: string;
  onChangeNeedsText: (text: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export default function NeedsStep({
  userName,
  needsText,
  onChangeNeedsText,
  onBack,
  onContinue,
}: NeedsStepProps) {
  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
          <div className={shared.stepPill}>
            <span>Step 4 of 12 · Details</span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className={shared.progressContainer}>
          <div className={shared.progressTextRow}>
            <span>Matching Progress</span>
            <span>40%</span>
          </div>
          <div className={shared.progressBarBg}>
            <div className={shared.progressBarFill} style={{ width: "40%" }} />
          </div>
        </div>
      </div>

      <div className={shared.cardBody}>
        {/* Heading */}
        <h1 className={shared.questionTitle}>
          Tell us about <span className={shared.accentWord}>your needs</span>
        </h1>

        <p className={shared.questionSubtitle}>
          Describe the challenge, question, or goal you want to discuss with our experts.
        </p>

        {/* Needs Textarea Input */}
        <div className={styles.textareaWrapper}>
          <textarea
            className={styles.needsTextarea}
            placeholder="E.g., I am looking to scale our startup's organic traffic and need a solid SEO roadmap, or I need assistance preparing for a technical system design interview..."
            value={needsText}
            onChange={(e) => onChangeNeedsText(e.target.value)}
            maxLength={1000}
          />
          <div className={styles.charCounter}>
            {needsText.length} / 1000
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
            <strong>Be detailed!</strong>
            <small>More details ensure a much more accurate match.</small>
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
            disabled={needsText.trim().length < 10}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
