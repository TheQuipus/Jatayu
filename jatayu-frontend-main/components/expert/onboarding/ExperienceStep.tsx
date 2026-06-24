"use client";

import Image from "next/image";
import { ArrowRight, Sprout, TrendingUp, Crown } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import shared from "./onboarding.shared.module.css";
import styles from "./ExperienceStep.module.css";

type ExperienceLevel = "emerging" | "established" | "leader";
type SelectedExperienceLevel = ExperienceLevel | "";

type ExperienceStepProps = {
  userName: string;
  experienceLevel: SelectedExperienceLevel;
  stepCompletion: boolean[];
  onSelectLevel: (level: ExperienceLevel) => void;
  onBack: () => void;
  onContinue: () => void;
  onJumpToStep?: (step: number) => void;
};

export default function ExperienceStep({
  userName,
  experienceLevel,
  stepCompletion,
  onSelectLevel,
  onBack,
  onContinue,
  onJumpToStep,
}: ExperienceStepProps) {
  const cards = [
    {
      id: "emerging" as ExperienceLevel,
      title: "Emerging Expert",
      icon: Sprout,
      desc: "1-3 years of practical experience. Building foundational expertise in the field.",
    },
    {
      id: "established" as ExperienceLevel,
      title: "Established Professional",
      icon: TrendingUp,
      desc: "4-9 years of experience. Proven track record of executing complex strategies.",
    },
    {
      id: "leader" as ExperienceLevel,
      title: "Industry Leader",
      icon: Crown,
      desc: "10+ years of experience. Recognized authority driving industry-level impact.",
    },
  ];

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
      <div className={shared.topHeader}>
        <OnboardingStepTitle userName={userName} />
        <div className={shared.stepPill}>
          <span>Step 3 of 9 - Experience</span>
        </div>
      </div>

      {/* Progress Tracker */}
      <OnboardingProgressBar currentStep={3} stepCompletion={stepCompletion} onStepClick={onJumpToStep} />

      </div>

      <div className={shared.cardBody}>
{/* Heading */}
      <h1 className={shared.questionTitle}>
        What is your <span className={shared.accentWord}>experience level</span>?
      </h1>

      <p className={shared.questionSubtitle}>
        This helps us match you with the right consultation requests.
      </p>

      {/* Card Grid Options */}
      <div className={styles.experienceGrid}>
        {cards.map((card, index) => {
          const IconComponent = card.icon;
          const isSelected = experienceLevel === card.id;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectLevel(card.id)}
              className={`${styles.experienceCard} ${isSelected ? styles.experienceCardSelected : ""} ${
                index === 0 ? styles.cardLeft : index === 2 ? styles.cardRight : ""
              }`}
            >
              {/* Inline SVG Background for custom clipped borders */}
              {(index === 0 || index === 2) && (
                <svg className={styles.cardBgSvg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <path
                    d={index === 0
                      ? "M6.6,0.3 L99.7,0 L100,99.7 L6.8,100 L0.2,95 L0,5.3 L6.6,0.3 Z"
                      : "M93.4,0.3 L0.3,0 L0,99.7 L93.2,100 L99.8,95 L100,5.3 L93.4,0.3 Z"
                    }
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              )}
              {isSelected && (
                <span className={styles.selectedLabelTag}>SELECTED</span>
              )}
              <div className={styles.experienceIconWrap}>
                <IconComponent className={styles.experienceCardIcon} />
              </div>
              <h3 className={styles.experienceCardTitle}>{card.title}</h3>
              <p className={styles.experienceCardDesc}>{card.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Step 3 Footer */}
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
            <strong>Solid choice!</strong>
            <small>Clients value transparency in experience.</small>
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
            className={shared.textBtn}
            onClick={onContinue}
          >
            Skip
          </button>
          <button
            type="button"
            className={shared.continueBtn}
            onClick={onContinue}
            disabled={!experienceLevel}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* SVG ClipPaths definitions */}
      <svg width="0" height="0" style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <clipPath id="custom-clip" clipPathUnits="objectBoundingBox">
            <path d="M0.934,0.003 L0.003,0 L0,0.997 L0.932,1 L0.998,0.95 L1,0.053 L0.934,0.003 Z" />
          </clipPath>
          <clipPath id="custom-clip-flipped" clipPathUnits="objectBoundingBox">
            <path d="M0.066,0.003 L0.997,0 L1,0.997 L0.068,1 L0.002,0.95 L0,0.053 L0.066,0.003 Z" />
          </clipPath>
        </defs>
      </svg>
    </section>
  );
}
