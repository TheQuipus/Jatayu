import { useState, useRef } from "react";
import { Target, Zap, Brain, Handshake, ShieldCheck, Lightbulb } from "lucide-react";
import ShinyText from "@/components/ui/ShinyText";
import TextButton from "@/components/ui/TextButton";
import TonePillButton from "@/components/ui/TonePillButton";
import {
  NEED_STEP_CHIPS,
  getSeekerOutcomeDescription,
} from "@/components/seeker/onboarding/seekerOutcomeOptions";
import {
  MAX_CONTEXT_LENGTH,
  type ContextImprovementStyleId,
} from "./checkoutTypes";
import {
  getImprovedContextText,
} from "./checkoutUtils";
import {
  callAiImproveNeeds,
  mapChipIdsToGoalNames,
} from "@/lib/aiImprovementApi";
import StepHeader from "./StepHeader";
import styles from "./StepQuestionContext.module.css";

const TONE_PILLS: Array<{ id: ContextImprovementStyleId; label: string }> = [
  { id: "casual", label: "Casual" },
  { id: "professional", label: "Professional" },
  { id: "concise", label: "Concise" },
];

function ContextChipIcon({ chipId }: { chipId: string }) {
  const iconProps = { className: styles.contextChipIcon, size: 14, "aria-hidden": true as const };

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

export type StepQuestionContextProps = {
  subject: string;
  onSubjectChange: (value: string) => void;
  context: string;
  onContextChange: (value: string) => void;
  selectedContextChips: string[];
  onSelectedContextChipsChange: (chips: string[]) => void;
  showContextImprovementPanel: boolean;
  onShowContextImprovementPanelChange: (show: boolean) => void;
  selectedContextImproveStyle: ContextImprovementStyleId | null;
  onSelectedContextImproveStyleChange: (style: ContextImprovementStyleId | null) => void;
};

export default function StepQuestionContext({
  subject,
  onSubjectChange,
  context,
  onContextChange,
  selectedContextChips,
  onSelectedContextChipsChange,
  showContextImprovementPanel,
  onShowContextImprovementPanelChange,
  selectedContextImproveStyle,
  onSelectedContextImproveStyleChange,
}: StepQuestionContextProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiOptionsMap, setAiOptionsMap] = useState<Record<string, string> | null>(null);
  const [sourceTextForImprovement, setSourceTextForImprovement] = useState<string>("");
  const aiRequestIdRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const canUseContextAiAssist = context.trim().length > 0;
  const hasContentToReset =
    subject.length > 0 || context.length > 0 || selectedContextChips.length > 0;

  const handleReset = () => {
    aiRequestIdRef.current += 1;
    setIsAiLoading(false);
    setAiOptionsMap(null);
    setSourceTextForImprovement("");
    onShowContextImprovementPanelChange(false);
    onSelectedContextImproveStyleChange(null);
    onSelectedContextChipsChange([]);
    onSubjectChange("");
    onContextChange("");
  };

  const buildTextFromSelectedContextChips = (chipIds: string[]) =>
    chipIds
      .map((chipId) => {
        const chip = NEED_STEP_CHIPS.find((item) => item.id === chipId);
        return chip ? getSeekerOutcomeDescription(chip.outcomeId) : "";
      })
      .filter(Boolean)
      .join("\n");

  const getPrefixForChips = (chipIds: string[]) => {
    if (chipIds.length === 0) return "";
    const text = buildTextFromSelectedContextChips(chipIds);
    return text ? text + "\n" : "";
  };

  const handleContextChipClick = (chip: (typeof NEED_STEP_CHIPS)[number]) => {
    aiRequestIdRef.current += 1;
    setIsAiLoading(false);
    setAiOptionsMap(null);
    setSourceTextForImprovement("");
    onShowContextImprovementPanelChange(false);
    onSelectedContextImproveStyleChange(null);

    const isSelected = selectedContextChips.includes(chip.id);
    const nextSelected = isSelected
      ? selectedContextChips.filter((id) => id !== chip.id)
      : [...selectedContextChips, chip.id];

    onSelectedContextChipsChange(nextSelected);

    const currentPrefixText = buildTextFromSelectedContextChips(selectedContextChips);
    const currentPrefix = currentPrefixText ? currentPrefixText + "\n" : "";
    let userSuffix = context;
    if (currentPrefix && context.startsWith(currentPrefix)) {
      userSuffix = context.slice(currentPrefix.length);
    } else if (currentPrefixText && context.startsWith(currentPrefixText)) {
      userSuffix = context.slice(currentPrefixText.length).replace(/^\n/, "");
    }

    const newPrefix = getPrefixForChips(nextSelected);
    const updatedText = (newPrefix + userSuffix).slice(0, MAX_CONTEXT_LENGTH);
    onContextChange(updatedText);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    aiRequestIdRef.current += 1;
    setIsAiLoading(false);
    setAiOptionsMap(null);
    setSourceTextForImprovement("");
    onShowContextImprovementPanelChange(false);
    onSelectedContextImproveStyleChange(null);
    onContextChange(e.target.value.slice(0, MAX_CONTEXT_LENGTH));
  };

  const applyImprovedText = (
    tone: ContextImprovementStyleId,
    optionsMap: Record<string, string> | null,
    baseText: string,
    prefix: string
  ) => {
    if (!baseText) return;
    const improvedSuffix =
      optionsMap && tone in optionsMap && optionsMap[tone]
        ? optionsMap[tone]
        : getImprovedContextText(tone, baseText);

    const updatedText = prefix ? `${prefix}${improvedSuffix}` : improvedSuffix;
    onContextChange(updatedText.slice(0, MAX_CONTEXT_LENGTH));
  };

  const handleContextAiAssist = async (overrideTone?: ContextImprovementStyleId) => {
    const prefix = getPrefixForChips(selectedContextChips);
    const userSuffix = prefix && context.startsWith(prefix) ? context.slice(prefix.length) : context;
    const targetText = (sourceTextForImprovement || userSuffix.trim() || context.trim()).trim();
    if (!targetText) return;

    const tone: ContextImprovementStyleId =
      overrideTone || selectedContextImproveStyle || "professional";
    onSelectedContextImproveStyleChange(tone);

    if (aiOptionsMap && sourceTextForImprovement) {
      applyImprovedText(tone, aiOptionsMap, sourceTextForImprovement, prefix);
      onShowContextImprovementPanelChange(true);
      return;
    }

    const requestId = ++aiRequestIdRef.current;
    setSourceTextForImprovement(targetText);
    setIsAiLoading(true);
    try {
      const goalNames = mapChipIdsToGoalNames(selectedContextChips);

      const data = await callAiImproveNeeds(
        {
          subject: subject.trim(),
          userText: targetText,
          selectedGoals: goalNames,
        },
        false
      );

      if (requestId !== aiRequestIdRef.current) return;

      const opts = data.options || data.suggestions || null;
      if (opts) {
        setAiOptionsMap(opts);
      }
      if (data.subject && !subject.trim()) {
        onSubjectChange(data.subject);
      }

      applyImprovedText(tone, opts, targetText, prefix);
      onShowContextImprovementPanelChange(true);
    } catch (err) {
      if (requestId !== aiRequestIdRef.current) return;
      console.error("AI Improvement API request error in Checkout:", err);
      applyImprovedText(tone, null, targetText, prefix);
      onShowContextImprovementPanelChange(true);
    } finally {
      if (requestId === aiRequestIdRef.current) {
        setIsAiLoading(false);
      }
    }
  };

  return (
    <div className={styles.stepContent}>
      <StepHeader
        title="Describe Your Question"
        subtitle="Be specific so the expert can give you the best possible response."
      />

      <div className={styles.questionStepSubject}>
        <div className={styles.subjectHeaderRow}>
          <label htmlFor="booking-subject" className={styles.contextLabel}>
            Subject / Topic
          </label>
          <TextButton
            type="button"
            label="Reset"
            className={styles.resetBtn}
            disabled={!hasContentToReset}
            onClick={handleReset}
          />
        </div>
        <input
          id="booking-subject"
          type="text"
          className={styles.subjectInput}
          placeholder="e.g. Career switch from engineering to product management"
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value)}
        />
      </div>

      <div className={styles.questionStepContext}>
        <label htmlFor="booking-context" className={styles.contextLabel}>
          Describe your challenges and questions.
        </label>
        <div className={styles.textareaBox}>
          <div className={styles.contextChipsRow}>
            {NEED_STEP_CHIPS.map((chip) => {
              const isSelected = selectedContextChips.includes(chip.id);

              return (
                <button
                  key={chip.id}
                  type="button"
                  className={`${styles.contextChip} ${
                    isSelected ? styles.contextChipSelected : ""
                  }`}
                  onClick={() => handleContextChipClick(chip)}
                  aria-pressed={isSelected}
                >
                  <ContextChipIcon chipId={chip.id} />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
          <div className={styles.contextTextEditor}>
            <textarea
              ref={textareaRef}
              id="booking-context"
              className={styles.textarea}
              placeholder="Eg. I've been in my current job for 3 years and feel stuck. I want to transition into product management but don't know where to start..."
              value={context}
              maxLength={MAX_CONTEXT_LENGTH}
              onChange={handleTextareaChange}
            />
          </div>
          <div className={styles.boxFooter}>
            {showContextImprovementPanel && canUseContextAiAssist ? (
              <div className={styles.pillsHeaderRow}>
                {TONE_PILLS.map((pill) => (
                  <TonePillButton
                    key={pill.id}
                    type="button"
                    label={pill.label}
                    selected={selectedContextImproveStyle === pill.id}
                    disabled={isAiLoading}
                    className={styles.tonePillButton}
                    onClick={() => handleContextAiAssist(pill.id)}
                  />
                ))}
              </div>
            ) : canUseContextAiAssist ? (
              <button
                type="button"
                className={styles.aiAssistTextBtn}
                onClick={() => handleContextAiAssist()}
                disabled={!canUseContextAiAssist || isAiLoading}
              >
                <ShinyText
                  text={isAiLoading ? "Improving..." : "Improve with JATAYU AI"}
                  icon="sparkles"
                  iconSize={14}
                  speed={2.5}
                  color="#E53B17"
                  shineColor="#ffffff"
                  disabled={!canUseContextAiAssist || isAiLoading}
                  className={styles.aiAssistShinyText}
                />
              </button>
            ) : (
              <div />
            )}

            <span className={styles.charCounter}>
              {context.length} / {MAX_CONTEXT_LENGTH}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.proTip}>
        <Lightbulb size={18} className={styles.proTipIcon} aria-hidden="true" />
        <p className={styles.proTipText}>
          <strong>Pro Tip </strong> Questions with clear context get 3x better responses. Include
          your current situation, goal, and what you&apos;ve already tried.
        </p>
      </div>
    </div>
  );
}
