import { useState, useRef } from "react";
import { Target, Zap, Brain, Handshake, ShieldCheck, Lightbulb } from "lucide-react";
import ShinyText from "@/components/ui/ShinyText";
import {
  NEED_STEP_CHIPS,
  getSeekerOutcomeDescription,
} from "@/components/seeker/onboarding/seekerOutcomeOptions";
import {
  MAX_CONTEXT_LENGTH,
  CONTEXT_IMPROVEMENT_STYLES,
  type ContextImprovementStyleId,
} from "./checkoutTypes";
import {
  getImprovedContextText,
  getContextImprovementHint,
} from "./checkoutUtils";
import { generateAiSubject } from "@/lib/aiTextImprovement";
import StepHeader from "./StepHeader";
import styles from "./StepQuestionContext.module.css";

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
  const [isImprovementApplied, setIsImprovementApplied] = useState(false);
  const [sourceTextForImprovement, setSourceTextForImprovement] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const canUseContextAiAssist = context.trim().length > 0;

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
    setIsImprovementApplied(false);
    const isSelected = selectedContextChips.includes(chip.id);
    const nextSelected = isSelected
      ? selectedContextChips.filter((id) => id !== chip.id)
      : [...selectedContextChips, chip.id];

    if (nextSelected.length === 0) {
      onShowContextImprovementPanelChange(false);
      onSelectedContextImproveStyleChange(null);
    }

    onSelectedContextChipsChange(nextSelected);

    const currentPrefix = getPrefixForChips(selectedContextChips);
    let userSuffix = context;
    if (currentPrefix && context.startsWith(currentPrefix)) {
      userSuffix = context.slice(currentPrefix.length);
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
    setIsImprovementApplied(false);
    onContextChange(e.target.value.slice(0, MAX_CONTEXT_LENGTH));
  };

  const handleContextAiAssist = () => {
    onShowContextImprovementPanelChange(true);
    onSelectedContextImproveStyleChange("professional");
    setIsImprovementApplied(false);
    const prefix = getPrefixForChips(selectedContextChips);
    const userSuffix = prefix && context.startsWith(prefix) ? context.slice(prefix.length) : context;
    setSourceTextForImprovement(userSuffix.trim() || context.trim());
  };

  const handleContextImproveStyle = (styleId: ContextImprovementStyleId) => {
    const prefix = getPrefixForChips(selectedContextChips);
    const targetText =
      sourceTextForImprovement ||
      (prefix && context.startsWith(prefix) ? context.slice(prefix.length) : context).trim() ||
      context.trim();
    if (!targetText) return;
    const improvedSuffix = getImprovedContextText(styleId, targetText);
    const updatedText = prefix ? `${prefix}${improvedSuffix}` : improvedSuffix;
    onContextChange(updatedText.slice(0, MAX_CONTEXT_LENGTH));
  };

  const handleGenerateAiSubject = () => {
    const generated = generateAiSubject(context, subject);
    onSubjectChange(generated);
  };

  const handleApplyContextImprovement = () => {
    if (!selectedContextImproveStyle || isImprovementApplied) return;
    handleContextImproveStyle(selectedContextImproveStyle);
    if (!subject.trim() && context.trim()) {
      onSubjectChange(generateAiSubject(context, ""));
    }
    setIsImprovementApplied(true);
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
          <span className={styles.charCounter}>
            {context.length} / {MAX_CONTEXT_LENGTH}
          </span>
          {canUseContextAiAssist && !showContextImprovementPanel ? (
            <button
              type="button"
              className={styles.aiAssistTextBtn}
              onClick={handleContextAiAssist}
              disabled={!canUseContextAiAssist}
            >
              <ShinyText
                text="Improve With Jatayu AI"
                icon="sparkles"
                iconSize={14}
                speed={2.5}
                color="#E53B17"
                shineColor="#ffffff"
                disabled={!canUseContextAiAssist}
                className={styles.aiAssistShinyText}
              />
            </button>
          ) : null}
        </div>
      </div>

      {showContextImprovementPanel ? (
        <div className={styles.aiImprovePanel}>
          <div className={styles.improvementChipsWrap}>
            {CONTEXT_IMPROVEMENT_STYLES.map((style) => {
              const isSelected = selectedContextImproveStyle === style.id;

              return (
                <button
                  key={style.id}
                  type="button"
                  className={`${styles.improvementChip} ${
                    isSelected ? styles.improvementChipSelected : ""
                  }`}
                  onClick={() => {
                    onSelectedContextImproveStyleChange(isSelected ? null : style.id);
                    setIsImprovementApplied(false);
                  }}
                  aria-pressed={isSelected}
                >
                  {style.label}
                </button>
              );
            })}
          </div>
          <p className={styles.aiImproveHint}>
            {getContextImprovementHint(
              selectedContextImproveStyle,
              sourceTextForImprovement || context
            )}
          </p>
          <button
            type="button"
            className={styles.aiApplyBtn}
            onClick={handleApplyContextImprovement}
            disabled={!selectedContextImproveStyle || isImprovementApplied}
          >
            <ShinyText
              text={isImprovementApplied ? "Applied" : "Apply"}
              speed={2.5}
              color="#E53B17"
              shineColor="#ffffff"
              disabled={!selectedContextImproveStyle || isImprovementApplied}
              className={styles.aiApplyShinyText}
            />
          </button>
        </div>
      ) : null}

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
