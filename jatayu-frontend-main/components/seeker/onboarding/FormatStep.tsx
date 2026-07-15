"use client";

import Image from "next/image";
import {
  ArrowRight,
  Video,
  Phone,
  FileText,
  Users,
} from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import MatchingProgress from "./MatchingProgress";
import type { ProgressCompletion, ProgressStepKey } from "./MatchingProgress";
import ContinueButton from "@/components/ui/ContinueButton";
import shared from "./onboarding.shared.module.css";
import styles from "./FormatStep.module.css";
import cards from "./preferenceCard.shared.module.css";
import { CONSULTATION_FORMATS } from "./preferencesData";
import { ClipPathDefs, ClippedCardBorder, SelectionCheckbox } from "./clippedCard";
import clipped from "./clippedCard.module.css";
type FormatStepProps = {
  userName: string;
  selectedFormats: string[];
  onSelectedFormatsChange: (formats: string[]) => void;
  onBack: () => void;
  onContinue: () => void;
  progressCompletion: ProgressCompletion;
  onProgressStepClick: (step: ProgressStepKey) => void;
};

const FORMAT_ICONS = {
  video: Video,
  audio: Phone,
  written: FileText,
  group: Users,
} as const;

export default function FormatStep({
  userName,
  selectedFormats,
  onSelectedFormatsChange,
  onBack,
  onContinue,
  progressCompletion,
  onProgressStepClick,
}: FormatStepProps) {
  const canContinue = selectedFormats.length > 0;

  const formats = CONSULTATION_FORMATS.map((format) => ({
    ...format,
    icon: FORMAT_ICONS[format.id],
  }));

  const handleToggleFormat = (id: string) => {
    if (selectedFormats.includes(id)) {
      onSelectedFormatsChange(selectedFormats.filter((x) => x !== id));
    } else {
      onSelectedFormatsChange([...selectedFormats, id]);
    }
  };

  return (
    <section className={shared.card}>
      <ClipPathDefs />
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
        </div>

        <MatchingProgress
          currentStep="format"
          completion={progressCompletion}
          onStepClick={onProgressStepClick}
        />
      </div>

      <div className={shared.cardBody}>
        <h1 className={`${shared.questionTitle} ${styles.questionTitle}`}>
          Your preferred <span className={shared.accentWord}>consultation style</span>
        </h1>

        <p className={`${shared.questionSubtitle} ${styles.questionSubtitle}`}>
          Choose how you want to interact with experts to ensure the best matches.
        </p>

        <div className={styles.preferencesSection}>
          <div className={cards.optionsGrid}>
            {formats.map((fmt) => {
              const IconComponent = fmt.icon;
              const isSelected = selectedFormats.includes(fmt.id);

              return (
                <div
                  key={fmt.id}
                  className={`${cards.optionCard} ${clipped.clippedCard} ${isSelected ? `${cards.optionCardSelected} ${clipped.clippedCardSelected}` : ""}`}
                >
                  <ClippedCardBorder isSelected={isSelected} />

                  <SelectionCheckbox isSelected={isSelected} />

                  <button
                    type="button"
                    onClick={() => handleToggleFormat(fmt.id)}
                    className={cards.optionCardSelect}
                    aria-pressed={isSelected}
                  >
                    <div className={cards.optionCardInner}>
                      <div className={cards.optionIconCircle}>
                        <IconComponent className={cards.optionIcon} />
                      </div>
                      <div className={cards.optionInfo}>
                        <h3 className={cards.optionTitle}>{fmt.title}</h3>
                        <p className={cards.optionDesc}>{fmt.desc}</p>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
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
            <strong>Preferences Set +10%</strong>
            <small>Clear preferences help us match you with the right experts.</small>
          </div>
        </div>

        <div className={shared.footerActions}>
          <button type="button" className={shared.textBtn} onClick={onBack}>
            Back
          </button>
          <button type="button" className={shared.textBtn} onClick={onContinue}>
            Skip
          </button>
          <ContinueButton onClick={onContinue} disabled={!canContinue} />
        </div>
      </div>
    </section>
  );
}
