"use client";

import { useState } from "react";
import Image from "next/image";
import { Target, Zap, Brain, Handshake, ShieldCheck } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import MatchingProgress from "./MatchingProgress";
import type { ProgressCompletion, ProgressStepKey } from "./MatchingProgress";
import ContinueButton from "@/components/ui/ContinueButton";
import ShinyText from "@/components/ui/ShinyText";
import shared from "./onboarding.shared.module.css";
import styles from "./NeedsStep.module.css";
import register from "./register.shared.module.css";
import {
  NEED_STEP_CHIPS,
  getSeekerOutcomeDescription,
} from "./seekerOutcomeOptions";

const IMPROVEMENT_STYLES = [
  { id: "professional", label: "More Professional" },
  { id: "casual", label: "Casual" },
  { id: "concise", label: "More Concise" },
] as const;

type ImprovementStyleId = (typeof IMPROVEMENT_STYLES)[number]["id"];

const DEFAULT_IMPROVE_HINT = "Choose your Goal or describe your challenges and questions";

function getImprovedText(styleId: ImprovementStyleId, current: string): string {
  if (!current.trim()) return current;

  if (styleId === "professional") {
    return `I am seeking expert guidance on the following challenge:\n${current}`;
  }

  if (styleId === "casual") {
    return `Hey! I'd love help with this:\n${current}`;
  }

  const sentences = current
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return sentences.slice(0, 2).join(" ");
}

function getImprovementHint(
  styleId: ImprovementStyleId | null,
  currentText: string,
): string {
  if (!styleId || !currentText.trim()) {
    return DEFAULT_IMPROVE_HINT;
  }

  return getImprovedText(styleId, currentText.trim());
}

function NeedChipIcon({ chipId, isSelected }: { chipId: string; isSelected?: boolean }) {
  const iconClass = `${styles.suggestedPillIcon} ${
    isSelected ? styles.suggestedPillIconSelected : ""
  }`;
  const iconProps = { className: iconClass, size: 14, "aria-hidden": true as const };

  switch (chipId) {
    case "clarity":
      return <Target {...iconProps} />;
    case "plan":
      return <Zap {...iconProps} />;
    case "knowledge":
      return <Brain {...iconProps} />;
    case "support":
      return <Handshake {...iconProps} />;
    case "solution":
      return <ShieldCheck {...iconProps} />;
    default:
      return null;
  }
}

type NeedsStepProps = {
  userName: string;
  needsText: string;
  onChangeNeedsText: (text: string) => void;
  onBack: () => void;
  onContinue: () => void;
  progressCompletion: ProgressCompletion;
  onProgressStepClick: (step: ProgressStepKey) => void;
};

export default function NeedsStep({
  userName,
  needsText,
  onChangeNeedsText,
  onBack,
  onContinue,
  progressCompletion,
  onProgressStepClick,
}: NeedsStepProps) {
  const [showImprovementPanel, setShowImprovementPanel] = useState(false);
  const [selectedImproveStyle, setSelectedImproveStyle] = useState<ImprovementStyleId | null>(
    null,
  );
  const [selectedNeedChips, setSelectedNeedChips] = useState<string[]>([]);
  const hasSelectedNeedChip = selectedNeedChips.length > 0;
  const canUseAiAssist = needsText.trim().length > 0;

  const handleAiAssist = () => {
    setShowImprovementPanel(true);
  };

  const buildTextFromSelectedChips = (chipIds: string[]) =>
    chipIds
      .map((chipId) => {
        const chip = NEED_STEP_CHIPS.find((item) => item.id === chipId);
        return chip ? getSeekerOutcomeDescription(chip.outcomeId) : "";
      })
      .filter(Boolean)
      .join("\n");

  const handleNeedChipClick = (chip: (typeof NEED_STEP_CHIPS)[number]) => {
    const isSelected = selectedNeedChips.includes(chip.id);
    const nextSelected = isSelected
      ? selectedNeedChips.filter((id) => id !== chip.id)
      : [...selectedNeedChips, chip.id];

    if (nextSelected.length === 0) {
      setShowImprovementPanel(false);
      setSelectedImproveStyle(null);
    }

    setSelectedNeedChips(nextSelected);
    onChangeNeedsText(buildTextFromSelectedChips(nextSelected).slice(0, 1000));
  };

  const handleImproveStyle = (styleId: ImprovementStyleId) => {
    const current = needsText.trim();
    if (!current) return;
    onChangeNeedsText(getImprovedText(styleId, current).slice(0, 1000));
  };

  const handleApplyImprovement = () => {
    if (!selectedImproveStyle) return;
    handleImproveStyle(selectedImproveStyle);
  };

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
        </div>

        <MatchingProgress
          currentStep="needs"
          completion={progressCompletion}
          onStepClick={onProgressStepClick}
        />
      </div>

      <div className={`${shared.cardBody} ${styles.needsBody}`}>
        <div className={styles.needsSplit}>
          <div className={styles.leftPanel}>
            <h1 className={`${shared.questionTitle} ${styles.questionTitle}`}>
              Tell us about <span className={shared.accentWord}>your needs</span>
            </h1>

            <p className={`${shared.questionSubtitle} ${styles.questionSubtitle}`}>
            Choose your goal, or describe your challenges and questions.
            </p>

            <div className={`${register.textareaWrap} ${styles.textareaWrapper}`}>
              <div className={styles.needChipsRow}>
                {NEED_STEP_CHIPS.map((chip) => {
                  const isSelected = selectedNeedChips.includes(chip.id);

                  return (
                    <button
                      key={chip.id}
                      type="button"
                      className={`${styles.suggestedPill} ${
                        isSelected ? styles.suggestedPillSelected : ""
                      }`}
                      onClick={() => handleNeedChipClick(chip)}
                      aria-pressed={isSelected}
                    >
                      <NeedChipIcon chipId={chip.id} isSelected={isSelected} />
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>
              <textarea
                className={`${register.textareaField} ${styles.needsTextarea}`}
                placeholder={
                  "Eg. I've been in my current job for 3 years and feel stuck. I want to transition into product management but don't know where to start..."
                }
                value={needsText}
                onChange={(e) => onChangeNeedsText(e.target.value)}
                maxLength={1000}
              />
              <div className={styles.charCounter}>
                {needsText.length} / 1000
              </div>
              {hasSelectedNeedChip && !showImprovementPanel ? (
                <button
                  type="button"
                  className={styles.aiAssistTextBtn}
                  onClick={handleAiAssist}
                  disabled={!canUseAiAssist}
                >
                  <ShinyText
                    text="Improve With AI"
                    icon="sparkles"
                    iconSize={14}
                    speed={2.5}
                    color="#E53B17"
                    shineColor="#ffffff"
                    disabled={!canUseAiAssist}
                    className={styles.aiAssistShinyText}
                  />
                </button>
              ) : null}
            </div>

            {showImprovementPanel ? (
              <div className={styles.aiImprovePanel}>
                <div className={styles.improvementChipsWrap}>
                  {IMPROVEMENT_STYLES.map((style) => {
                    const isSelected = selectedImproveStyle === style.id;

                    return (
                      <button
                        key={style.id}
                        type="button"
                        className={`${styles.improvementChip} ${
                          isSelected ? styles.improvementChipSelected : ""
                        }`}
                        onClick={() => setSelectedImproveStyle(style.id)}
                        aria-pressed={isSelected}
                      >
                        {style.label}
                      </button>
                    );
                  })}
                </div>
                <p className={styles.aiImproveHint}>
                  {getImprovementHint(selectedImproveStyle, needsText)}
                </p>
                <button
                  type="button"
                  className={styles.aiApplyBtn}
                  onClick={handleApplyImprovement}
                  disabled={!selectedImproveStyle}
                >
                  <ShinyText
                    text="Apply"
                    speed={2.5}
                    color="#E53B17"
                    shineColor="#ffffff"
                    disabled={!selectedImproveStyle}
                    className={styles.aiApplyShinyText}
                  />
                </button>
              </div>
            ) : null}

            {/* Pro Tip */}
            <div className={styles.proTipContainer}>
              <strong className={styles.proTipTitle}>Pro Tip</strong>
              <p className={styles.proTipText}>
                Questions with clear context get 3x better responses. Include your current situation, goal, and what you&apos;ve already tried.
              </p>
            </div>
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
            <strong>Your description is private</strong>
            <small>Only matched experts see this</small>
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
          <button type="button" className={shared.textBtn} onClick={onContinue}>
            Skip
          </button>
          <ContinueButton
            onClick={onContinue}
            disabled={needsText.trim().length < 10}
          />
        </div>
      </div>
    </section>
  );
}
