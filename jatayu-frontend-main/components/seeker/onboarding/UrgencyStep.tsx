"use client";

import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import shared from "./onboarding.shared.module.css";
import styles from "./UrgencyStep.module.css";

type UrgencyOption = {
  id: string;
  title: string;
  emoji: string;
  desc: string;
  tag: string;
  tagType: "high" | "active" | "flexible" | "low";
};

type UrgencyStepProps = {
  userName: string;
  selectedUrgency: string;
  onSelectUrgency: (urgency: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

const urgencyOptions: UrgencyOption[] = [
  {
    id: "rightnow",
    title: "Right Now",
    emoji: "🔥",
    desc: "I need help today or within 24 hours",
    tag: "HIGH PRIORITY",
    tagType: "high",
  },
  {
    id: "thisweek",
    title: "This Week",
    emoji: "⚡",
    desc: "I'd like to connect within 3–7 days",
    tag: "ACTIVE",
    tagType: "active",
  },
  {
    id: "thismonth",
    title: "This Month",
    emoji: "📅",
    desc: "I have a few weeks, no rush",
    tag: "FLEXIBLE",
    tagType: "flexible",
  },
  {
    id: "exploring",
    title: "Just Exploring",
    emoji: "🌙",
    desc: "I'm gathering info, no timeline yet",
    tag: "LOW",
    tagType: "low",
  },
];

export default function UrgencyStep({
  userName,
  selectedUrgency,
  onSelectUrgency,
  onBack,
  onContinue,
}: UrgencyStepProps) {
  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
          <div className={shared.stepPill}>
            <span>Step 6 of 12 · Timeline & Urgency</span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className={shared.progressContainer}>
          <div className={shared.progressTextRow}>
            <span>Matching Progress</span>
            <span>60%</span>
          </div>
          <div className={shared.progressBarBg}>
            <div className={shared.progressBarFill} style={{ width: "60%" }} />
          </div>
        </div>
      </div>

      <div className={shared.cardBody}>
        {/* Heading */}
        <h1 className={shared.questionTitle}>
          How urgently do you <span className={shared.accentWord}>need help</span>?
        </h1>

        <p className={shared.questionSubtitle}>
          This helps us prioritize experts who are available within your timeline.
        </p>

        {/* 2x2 Grid */}
        <div className={styles.urgencyGrid}>
          {urgencyOptions.map((opt) => {
            const isSelected = selectedUrgency === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectUrgency(opt.id)}
                className={`${styles.urgencyCard} ${isSelected ? styles.urgencyCardSelected : ""}`}
              >
                {/* Checked indicator top right */}
                {isSelected && (
                  <div className={styles.checkBadge}>
                    <Check size={12} strokeWidth={3} className={styles.checkIcon} />
                  </div>
                )}

                {/* Top Row: Emoji and Tag */}
                <div className={styles.cardHeaderRow}>
                  <span className={styles.emoji}>{opt.emoji}</span>
                  <span className={`${styles.statusTag} ${styles[opt.tagType]}`}>
                    {opt.tag}
                  </span>
                </div>

                {/* Bottom Row: Text */}
                <div className={styles.textWrap}>
                  <h3 className={styles.cardTitle}>{opt.title}</h3>
                  <p className={styles.cardDesc}>{opt.desc}</p>
                </div>
              </button>
            );
          })}
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
            <strong>Final step!</strong>
            <small>We will match schedules matching this urgency.</small>
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
            disabled={!selectedUrgency}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
