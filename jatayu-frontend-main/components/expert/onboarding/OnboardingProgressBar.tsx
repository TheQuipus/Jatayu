import shared from "./onboarding.shared.module.css";

export const EXPERT_ONBOARDING_STEPS = [
  "category",
  "skills",
  "experience",
  "identity",
  "credentials",
  "preferences",
  "audience",
  "availability",
  "review",
] as const;

const TOTAL_STEPS = EXPERT_ONBOARDING_STEPS.length;

type OnboardingProgressBarProps = {
  currentStep: number;
  stepCompletion: boolean[];
  onStepClick?: (step: number) => void;
};

export default function OnboardingProgressBar({
  currentStep,
  stepCompletion,
  onStepClick,
}: OnboardingProgressBarProps) {
  const filledCount = stepCompletion.filter(Boolean).length;
  const percent = Math.round((filledCount / TOTAL_STEPS) * 100);

  return (
    <div className={shared.progressContainer}>
      <div className={shared.progressTextRow}>
        <span>Application Progress</span>
        <span>{percent}%</span>
      </div>
      <div className={shared.progressBarBg}>
        {Array.from({ length: TOTAL_STEPS }, (_, index) => {
          const stepNumber = index + 1;
          const isFilled = Boolean(stepCompletion[index]);
          const isPrevious = stepNumber < currentStep;
          const isClickable = Boolean(onStepClick && isPrevious);

          return (
            <button
              key={stepNumber}
              type="button"
              className={`${shared.progressBarSegment} ${
                isFilled ? shared.progressBarSegmentFilled : ""
              } ${isClickable ? shared.progressBarSegmentClickable : ""}`}
              disabled={!isClickable}
              aria-label={`Go to step ${stepNumber}`}
              aria-current={stepNumber === currentStep ? "step" : undefined}
              onClick={() => onStepClick?.(stepNumber)}
            />
          );
        })}
      </div>
    </div>
  );
}
