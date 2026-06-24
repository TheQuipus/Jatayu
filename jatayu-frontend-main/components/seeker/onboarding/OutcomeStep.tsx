"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import shared from "./onboarding.shared.module.css";
import styles from "./OutcomeStep.module.css";

type OutcomeOption = {
  id: string;
  title: string;
  emoji: string;
  desc: string;
};

type OutcomeStepProps = {
  userName: string;
  selectedOutcome: string;
  onSelectOutcome: (outcome: string) => void;
  selectedExtras: string[];
  onToggleExtra: (extra: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

const outcomeOptions: OutcomeOption[] = [
  {
    id: "clarity",
    title: "Clarity & Direction",
    emoji: "🎯",
    desc: "I want to understand my options and have a clear path forward",
  },
  {
    id: "plan",
    title: "Quick Actionable Plan",
    emoji: "⚡",
    desc: "I need a concrete plan I can start executing this week",
  },
  {
    id: "knowledge",
    title: "Deep Knowledge",
    emoji: "🧠",
    desc: "I want to fully understand a topic or situation",
  },
  {
    id: "accountability",
    title: "Accountability & Support",
    emoji: "💪",
    desc: "I want someone to keep me on track and motivated",
  },
  {
    id: "resolved",
    title: "Problem Solved",
    emoji: "🛡️",
    desc: "I have a specific problem I need resolved",
  },
  {
    id: "transformation",
    title: "Long-term Transformation",
    emoji: "🌟",
    desc: "I want lasting change and ongoing growth",
  },
];

const optionalHopes = [
  "Expand Network",
  "Idea Validation",
  "Skill Building",
  "Confidence Boost",
];

export default function OutcomeStep({
  userName,
  selectedOutcome,
  onSelectOutcome,
  selectedExtras,
  onToggleExtra,
  onBack,
  onContinue,
}: OutcomeStepProps) {
  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
          <div className={shared.stepPill}>
            <span>Step 5 of 12 · Desired Outcome</span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className={shared.progressContainer}>
          <div className={shared.progressTextRow}>
            <span>Matching Progress</span>
            <span>50%</span>
          </div>
          <div className={shared.progressBarBg}>
            <div className={shared.progressBarFill} style={{ width: "50%" }} />
          </div>
        </div>
      </div>

      <div className={shared.cardBody}>
        {/* Heading */}
        <h1 className={shared.questionTitle}>
          What outcome are you <span className={shared.accentWord}>hoping for</span>?
        </h1>

        <p className={shared.questionSubtitle}>
          Choose your primary goal. This helps us find experts who specialize in delivering exactly this result.
        </p>

        {/* Grid 2x3 */}
        <div className={styles.outcomeGrid}>
          {outcomeOptions.map((opt) => {
            const isSelected = selectedOutcome === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectOutcome(opt.id)}
                className={`${styles.outcomeCard} ${isSelected ? styles.outcomeCardSelected : ""}`}
              >
                <div className={styles.emojiWrap}>{opt.emoji}</div>
                <div className={styles.textWrap}>
                  <h3 className={styles.cardTitle}>{opt.title}</h3>
                  <p className={styles.cardDesc}>{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Optional Section */}
        <div className={styles.optionalSection}>
          <h4 className={styles.optionalLabel}>Also hoping for (optional):</h4>
          <div className={styles.optionalChipsRow}>
            {optionalHopes.map((hope) => {
              const isSelected = selectedExtras.includes(hope);
              return (
                <button
                  key={hope}
                  type="button"
                  onClick={() => onToggleExtra(hope)}
                  className={`${styles.hopeChip} ${isSelected ? styles.hopeChipSelected : ""}`}
                >
                  {hope}
                </button>
              );
            })}
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
            <strong>Almost matched!</strong>
            <small>Specifying target outcomes shapes consultation structures.</small>
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
            disabled={!selectedOutcome}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
