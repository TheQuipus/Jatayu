"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Target, Zap, Brain, Handshake, ShieldCheck } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import MatchingProgress from "./MatchingProgress";
import type { ProgressCompletion, ProgressStepKey } from "./MatchingProgress";
import ContinueButton from "@/components/ui/ContinueButton";
import ShinyText from "@/components/ui/ShinyText";
import TonePillButton from "@/components/ui/TonePillButton";
import TextButton from "@/components/ui/TextButton";
import shared from "./onboarding.shared.module.css";
import styles from "./NeedsStep.module.css";
import register from "./register.shared.module.css";
import {
  NEED_STEP_CHIPS,
  getSeekerOutcomeDescription,
} from "./seekerOutcomeOptions";
import {
  type AiImprovementStyleId as ImprovementStyleId,
  transformTextWithAi as getImprovedText,
} from "@/lib/aiTextImprovement";
import {
  callAiImproveNeeds,
  mapChipIdsToGoalNames,
} from "@/lib/aiImprovementApi";

const TONE_PILLS: Array<{ id: ImprovementStyleId; label: string }> = [
  { id: "casual", label: "Casual" },
  { id: "professional", label: "Professional" },
  { id: "concise", label: "Concise" },
];

function NeedChipIcon({ chipId, isSelected }: { chipId: string; isSelected?: boolean }) {
  const iconClass = `${styles.suggestedPillIcon} ${isSelected ? styles.suggestedPillIconSelected : ""
    }`;
  const iconProps = { className: iconClass, size: 16, "aria-hidden": true as const };

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

function detectChipsFromText(text: string): string[] {
  if (!text) return [];
  const found: string[] = [];
  for (const chip of NEED_STEP_CHIPS) {
    const desc = getSeekerOutcomeDescription(chip.outcomeId);
    if (desc && text.includes(desc)) {
      found.push(chip.id);
    }
  }
  return found;
}

type NeedsStepProps = {
  userName: string;
  subject?: string;
  onChangeSubject?: (subject: string) => void;
  step1CategoryOrTopic?: string;
  needsText: string;
  onChangeNeedsText: (text: string) => void;
  selectedNeedChips?: string[];
  onSelectedNeedChipsChange?: (chips: string[]) => void;
  onBack: () => void;
  onContinue: () => void;
  progressCompletion: ProgressCompletion;
  onProgressStepClick: (step: ProgressStepKey) => void;
};

export default function NeedsStep({
  userName,
  subject,
  onChangeSubject,
  step1CategoryOrTopic,
  needsText,
  onChangeNeedsText,
  selectedNeedChips: selectedNeedChipsProp,
  onSelectedNeedChipsChange: onSelectedNeedChipsChangeProp,
  onBack,
  onContinue,
  progressCompletion,
  onProgressStepClick,
}: NeedsStepProps) {
  const [showTones, setShowTones] = useState(false);
  const [selectedTone, setSelectedTone] = useState<ImprovementStyleId | null>(null);
  const [internalSelectedNeedChips, setInternalSelectedNeedChips] = useState<string[]>(() => {
    if (selectedNeedChipsProp && selectedNeedChipsProp.length > 0) {
      return selectedNeedChipsProp;
    }
    return detectChipsFromText(needsText);
  });

  const selectedNeedChips = selectedNeedChipsProp ?? internalSelectedNeedChips;

  const setSelectedNeedChips = (chips: string[]) => {
    setInternalSelectedNeedChips(chips);
    onSelectedNeedChipsChangeProp?.(chips);
  };

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiOptionsMap, setAiOptionsMap] = useState<Record<string, string> | null>(null);
  const [sourceTextForImprovement, setSourceTextForImprovement] = useState<string>("");
  const aiRequestIdRef = useRef(0);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaMirrorRef = useRef<HTMLDivElement | null>(null);

  const buildTextFromSelectedChips = (chipIds: string[]) =>
    chipIds
      .map((chipId) => {
        const chip = NEED_STEP_CHIPS.find((item) => item.id === chipId);
        return chip ? getSeekerOutcomeDescription(chip.outcomeId) : "";
      })
      .filter(Boolean)
      .join("\n");

  const getLockedPrefixForChips = (chipIds: string[]) => {
    if (chipIds.length === 0) return "";
    const text = buildTextFromSelectedChips(chipIds);
    return text ? text + "\n" : "";
  };

  const getLockedPrefix = () => getLockedPrefixForChips(selectedNeedChips);

  const lockedPrefix = getLockedPrefix();
  const userTypedSuffix = lockedPrefix
    ? (needsText.startsWith(lockedPrefix) ? needsText.slice(lockedPrefix.length) : "")
    : needsText;
  const canUseAiAssist = userTypedSuffix.trim().length > 0;

  const applyImprovedText = (
    tone: ImprovementStyleId,
    optionsMap: Record<string, string> | null,
    baseText: string,
    prefix: string,
  ) => {
    if (!baseText) return;
    const improvedSuffix =
      optionsMap && tone in optionsMap && optionsMap[tone]
        ? optionsMap[tone]
        : getImprovedText(tone, baseText);

    const updatedText = prefix ? `${prefix}${improvedSuffix}` : improvedSuffix;
    onChangeNeedsText(updatedText.slice(0, 1000));
  };

  const handleImproveNeeds = async (overrideTone?: ImprovementStyleId) => {
    const prefix = getLockedPrefix();
    const userSuffix =
      prefix && needsText.startsWith(prefix) ? needsText.slice(prefix.length) : needsText;
    const targetText = (sourceTextForImprovement || userSuffix.trim() || needsText.trim()).trim();
    if (!targetText) return;

    const tone: ImprovementStyleId = overrideTone || selectedTone || "professional";
    setSelectedTone(tone);

    // If options are already cached for the current text, apply immediately without re-fetching
    if (aiOptionsMap && sourceTextForImprovement) {
      applyImprovedText(tone, aiOptionsMap, sourceTextForImprovement, prefix);
      setShowTones(true);
      return;
    }

    const requestId = ++aiRequestIdRef.current;
    setSourceTextForImprovement(targetText);
    setIsAiLoading(true);

    try {
      const effectiveSubject =
        subject && subject.trim() ? subject.trim() : step1CategoryOrTopic || "";
      const goalNames = mapChipIdsToGoalNames(selectedNeedChips);

      const data = await callAiImproveNeeds(
        {
          subject: effectiveSubject,
          userText: targetText,
          selectedGoals: goalNames,
        },
        true,
      );

      if (requestId !== aiRequestIdRef.current) return;

      const opts = data.options || data.suggestions || null;
      if (opts) {
        setAiOptionsMap(opts);
      }
      if (data.subject && (!subject || !subject.trim()) && onChangeSubject) {
        onChangeSubject(data.subject);
      }

      applyImprovedText(tone, opts, targetText, prefix);
      setShowTones(true);
    } catch (err) {
      if (requestId !== aiRequestIdRef.current) return;
      console.error("AI improvement request failed, using local fallback:", err);
      applyImprovedText(tone, null, targetText, prefix);
      setShowTones(true);
    } finally {
      if (requestId === aiRequestIdRef.current) {
        setIsAiLoading(false);
      }
    }
  };

  const handleNeedChipClick = (chip: (typeof NEED_STEP_CHIPS)[number]) => {
    aiRequestIdRef.current += 1;
    setIsAiLoading(false);
    setAiOptionsMap(null);
    setSourceTextForImprovement("");
    setShowTones(false);
    setSelectedTone(null);

    const isSelected = selectedNeedChips.includes(chip.id);
    const nextSelected = isSelected
      ? selectedNeedChips.filter((id) => id !== chip.id)
      : [...selectedNeedChips, chip.id];

    setSelectedNeedChips(nextSelected);

    const currentPrefix = getLockedPrefix();
    let userSuffix = "";
    if (currentPrefix && needsText.startsWith(currentPrefix)) {
      userSuffix = needsText.slice(currentPrefix.length);
    } else if (!currentPrefix && needsText) {
      userSuffix = needsText;
    }

    const newPrefix = getLockedPrefixForChips(nextSelected);
    const updatedText = (newPrefix + userSuffix).slice(0, 1000);
    onChangeNeedsText(updatedText);

    if (newPrefix) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const targetPos = Math.min(newPrefix.length, updatedText.length);
          textareaRef.current.setSelectionRange(targetPos, targetPos);
        }
      }, 0);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    aiRequestIdRef.current += 1;
    setIsAiLoading(false);
    setSelectedTone(null);
    setShowTones(false);
    setAiOptionsMap(null);
    setSourceTextForImprovement("");

    const val = e.target.value;
    const lockedPrefix = getLockedPrefix();

    if (!lockedPrefix) {
      onChangeNeedsText(val.slice(0, 1000));
      return;
    }

    if (val.startsWith(lockedPrefix)) {
      onChangeNeedsText(val.slice(0, 1000));
    } else {
      let userSuffix = "";
      if (val.length > lockedPrefix.length) {
        userSuffix = val.slice(lockedPrefix.length);
      }
      const restored = (lockedPrefix + userSuffix).slice(0, 1000);
      onChangeNeedsText(restored);
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const lockedPrefix = getLockedPrefix();
    if (!lockedPrefix) return;

    const target = e.currentTarget;
    const { selectionStart, selectionEnd } = target;

    if (e.key === "Backspace") {
      if (selectionStart <= lockedPrefix.length && selectionEnd <= lockedPrefix.length) {
        e.preventDefault();
      } else if (selectionStart < lockedPrefix.length) {
        e.preventDefault();
        target.setSelectionRange(lockedPrefix.length, selectionEnd);
      }
    } else if (e.key === "Delete") {
      if (selectionStart < lockedPrefix.length) {
        e.preventDefault();
      }
    }
  };

  const ensureCursorAfterPrefix = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const lockedPrefix = getLockedPrefix();
    if (!lockedPrefix) return;

    const target = e.currentTarget;
    if (target.selectionStart < lockedPrefix.length) {
      target.setSelectionRange(lockedPrefix.length, lockedPrefix.length);
    }
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
                      className={`${styles.suggestedPill} ${isSelected ? styles.suggestedPillSelected : ""
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

              <div className={styles.needsTextEditor}>
                <div
                  ref={textareaMirrorRef}
                  className={styles.needsTextMirror}
                  aria-hidden="true"
                >
                  <span className={styles.suggestionText}>{lockedPrefix}</span>
                  <span className={styles.typedText}>{userTypedSuffix}</span>
                </div>
                <textarea
                  ref={textareaRef}
                  className={`${register.textareaField} ${styles.needsTextarea}`}
                  placeholder={
                    "Eg. I've been in my current job for 3 years and feel stuck. I want to transition into product management but don't know where to start..."
                  }
                  value={needsText}
                  onChange={handleTextareaChange}
                  onKeyDown={handleTextareaKeyDown}
                  onClick={ensureCursorAfterPrefix}
                  onSelect={ensureCursorAfterPrefix}
                  onScroll={(event) => {
                    if (textareaMirrorRef.current) {
                      textareaMirrorRef.current.scrollTop = event.currentTarget.scrollTop;
                    }
                  }}
                  maxLength={1000}
                />
              </div>

              <div className={styles.boxFooter}>
                {showTones && canUseAiAssist ? (
                  <div className={styles.pillsHeaderRow}>
                    {TONE_PILLS.map((pill) => (
                      <TonePillButton
                        key={pill.id}
                        type="button"
                        label={pill.label}
                        selected={selectedTone === pill.id}
                        disabled={isAiLoading}
                        className={styles.tonePillButton}
                        onClick={() => handleImproveNeeds(pill.id)}
                      />
                    ))}
                  </div>
                ) : canUseAiAssist ? (
                  <button
                    type="button"
                    className={styles.aiAssistTextBtn}
                    onClick={() => handleImproveNeeds()}
                    disabled={!canUseAiAssist || isAiLoading}
                  >
                    <ShinyText
                      text={isAiLoading ? "Improving..." : "Improve with JATAYU AI"}
                      icon="sparkles"
                      iconSize={14}
                      speed={2.5}
                      color="#E53B17"
                      shineColor="#ffffff"
                      disabled={!canUseAiAssist || isAiLoading}
                      className={styles.aiAssistShinyText}
                    />
                  </button>
                ) : (
                  <div />
                )}

                <span className={styles.charCounter}>
                  {needsText.length} / 1000
                </span>
              </div>
            </div>

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
          <TextButton
            type="button"
            className={shared.textBtn}
            onClick={onBack}
            label="Back"
          />
          <TextButton type="button" className={shared.textBtn} onClick={onContinue} label="Skip" />
          <ContinueButton
            onClick={onContinue}
            disabled={needsText.trim().length < 10}
          />
        </div>
      </div>
    </section>
  );
}