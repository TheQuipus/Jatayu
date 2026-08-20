import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { BOOKING_STEPS } from "./checkoutTypes";
import styles from "./CheckoutStepper.module.css";

export type CheckoutStepperProps = {
  currentStep: number;
  maxStepReached?: number;
  completedSteps?: boolean[];
  onGoToStep: (step: number) => void;
};

export default function CheckoutStepper({
  currentStep,
  maxStepReached = currentStep,
  completedSteps = [],
  onGoToStep,
}: CheckoutStepperProps) {
  const highestStep = Math.max(currentStep, maxStepReached);

  return (
    <nav
      className={styles.stepper}
      aria-label="Booking progress"
      style={{ "--step-progress": currentStep - 1 } as CSSProperties}
    >
      <div className={styles.stepperTrack} aria-hidden="true">
        <div className={styles.stepperTrackFill} />
      </div>
      {BOOKING_STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = Boolean(completedSteps[index]);
        const isReached = stepNumber <= highestStep;
        const isClickable = isReached && !isActive;
        const showTick = isCompleted;
        const isFirst = index === 0;
        const isLast = index === BOOKING_STEPS.length - 1;

        return (
          <div
            key={label}
            className={`${styles.stepperItem} ${isFirst ? styles.stepperItemFirst : ""} ${
              isLast ? styles.stepperItemLast : ""
            }`}
          >
            <button
              type="button"
              className={styles.stepperBtn}
              disabled={!isClickable}
              aria-current={isActive ? "step" : undefined}
              onClick={() => onGoToStep(stepNumber)}
            >
              <span
                className={`${styles.stepperCircle} ${
                  isActive ? styles.stepperCircleActive : ""
                } ${!isActive && isCompleted ? styles.stepperCircleComplete : ""}`}
              >
                {showTick ? <Check size={14} strokeWidth={3} /> : stepNumber}
              </span>
              <span
                className={`${styles.stepperLabel} ${
                  isActive ? styles.stepperLabelActive : ""
                } ${!isActive && isCompleted ? styles.stepperLabelComplete : ""}`}
              >
                {label}
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
