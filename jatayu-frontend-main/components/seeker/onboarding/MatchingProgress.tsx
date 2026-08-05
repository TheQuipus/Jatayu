import styles from "./MatchingProgress.module.css";
import {
  SEEKER_ONBOARDING_STEPS,
  formatSeekerStepLabel,
  getSeekerStepNumber,
  type SeekerOnboardingStepKey,
} from "./seekerOnboardingSteps";

export type ProgressStepKey = SeekerOnboardingStepKey;
export type ProgressCompletion = Record<ProgressStepKey, boolean>;

const orderedSteps = SEEKER_ONBOARDING_STEPS;

type MatchingProgressProps = {
  currentStep?: ProgressStepKey;
  completion: ProgressCompletion;
  onStepClick: (step: ProgressStepKey) => void;
};

export default function MatchingProgress({
  currentStep,
  completion,
  onStepClick,
}: MatchingProgressProps) {
  const completedCount = orderedSteps.filter((step) => completion[step]).length;
  const percentage = Math.round((completedCount / orderedSteps.length) * 100);
  const displayStep = currentStep ?? orderedSteps[orderedSteps.length - 1];
  const stepLabel = formatSeekerStepLabel(getSeekerStepNumber(displayStep));

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressTextRow}>
        <div className={styles.progressMeta}>
          <span>Progress</span>
          <span>{percentage}%</span>

        </div>
        <span>{stepLabel}</span>
      </div>
      <div className={styles.segments}>
        {orderedSteps.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onStepClick(step)}
            className={`${styles.segment} ${
              step === currentStep
                ? styles.segmentCurrent
                : completion[step]
                  ? styles.segmentFilled
                  : ""
            }`}
            aria-label={`Go to ${step} step`}
          />
        ))}
      </div>
    </div>
  );
}
