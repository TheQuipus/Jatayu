"use client";

import Image from "next/image";
import { ArrowRight, MessageSquare, Video, Phone, Mail, Award } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import shared from "./onboarding.shared.module.css";
import styles from "./FormatStep.module.css";

type FormatOption = {
  id: string;
  title: string;
  icon: any; // Lucide icon component
  desc: string;
  innerTag: string;
  bullet: string;
  popularBadge?: string;
};

type FormatStepProps = {
  userName: string;
  selectedUrgency: string;
  selectedFormat: string;
  onSelectFormat: (format: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

const formatOptions: FormatOption[] = [
  {
    id: "chat",
    title: "Live Chat",
    icon: MessageSquare,
    desc: "Text-based real-time messaging",
    innerTag: "MOST POPULAR · INSTANT",
    bullet: "Available 24/7",
    popularBadge: "🏆 MOST POPULAR",
  },
  {
    id: "video",
    title: "Video Call",
    icon: Video,
    desc: "Face-to-face screen session",
    innerTag: "HIGHEST RATED",
    bullet: "Schedule 1h+ ahead",
  },
  {
    id: "phone",
    title: "Phone Call",
    icon: Phone,
    desc: "Voice-only conversation",
    innerTag: "QUICK & PERSONAL",
    bullet: "Flexible timing",
  },
  {
    id: "async",
    title: "Async Messages",
    icon: Mail,
    desc: "Send questions, get detailed replies",
    innerTag: "THOUGHTFUL ANSWERS",
    bullet: "48h response time",
  },
];

export default function FormatStep({
  userName,
  selectedUrgency,
  selectedFormat,
  onSelectFormat,
  onBack,
  onContinue,
}: FormatStepProps) {
  // Recommend formats dynamically based on the seeker's previously chosen urgency
  const getRecommendationText = () => {
    if (selectedUrgency === "rightnow" || selectedUrgency === "thisweek") {
      return (
        <span>
          Based on your urgency, we recommend: <strong>💬 Live Chat</strong> or <strong>📞 Phone Call</strong>
        </span>
      );
    }
    return (
      <span>
        Based on your timeline, we recommend: <strong>📹 Video Call</strong> or <strong>✉️ Async Messages</strong>
      </span>
    );
  };

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
          <div className={shared.stepPill}>
            <span>Step 7 of 12 · Consultation Format</span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className={shared.progressContainer}>
          <div className={shared.progressTextRow}>
            <span>Matching Progress</span>
            <span>70%</span>
          </div>
          <div className={shared.progressBarBg}>
            <div className={shared.progressBarFill} style={{ width: "70%" }} />
          </div>
        </div>
      </div>

      <div className={shared.cardBody}>
        {/* Heading */}
        <h1 className={shared.questionTitle}>
          How do you <span className={shared.accentWord}>prefer to connect</span>?
        </h1>

        <p className={shared.questionSubtitle}>
          Choose the consultation format that feels most comfortable for you.
        </p>

        {/* Recommended Pill */}
        <div className={styles.recommendationPill}>
          <div className={styles.recommendationContent}>
            <span className={styles.sparkleIcon}>✨</span>
            {getRecommendationText()}
          </div>
        </div>

        {/* 2x2 Grid */}
        <div className={styles.formatGrid}>
          {formatOptions.map((opt) => {
            const IconComponent = opt.icon;
            const isSelected = selectedFormat === opt.id;

            return (
              <div key={opt.id} className={styles.cardContainer}>
                {opt.popularBadge && (
                  <div className={styles.popularBadge}>
                    {opt.popularBadge}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => onSelectFormat(opt.id)}
                  className={`${styles.formatCard} ${isSelected ? styles.formatCardSelected : ""} ${
                    opt.popularBadge ? styles.hasPopularBadge : ""
                  }`}
                >
                  {/* Custom Radio Button Indicator */}
                  <div className={`${styles.radioIndicator} ${isSelected ? styles.radioSelected : ""}`}>
                    {isSelected && <div className={styles.radioDot} />}
                  </div>

                  {/* Left Icon Wrap */}
                  <div className={styles.iconWrap}>
                    <IconComponent size={20} className={styles.formatIcon} />
                  </div>

                  {/* Text Details */}
                  <h3 className={styles.cardTitle}>{opt.title}</h3>
                  <p className={styles.cardDesc}>{opt.desc}</p>

                  <div className={styles.cardFooterArea}>
                    <span className={styles.innerTag}>{opt.innerTag}</span>
                    <div className={styles.bulletRow}>
                      <span className={styles.greenDot} />
                      <span>{opt.bullet}</span>
                    </div>
                  </div>
                </button>
              </div>
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
            <strong>Matches await!</strong>
            <small>You will only see experts supporting this format.</small>
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
            disabled={!selectedFormat}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
