import { ArrowLeft } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import SecondaryCTA from "@/components/ui/SecondaryCTA";
import styles from "./CheckoutStepFooter.module.css";

export type CheckoutStepFooterProps = {
  currentStep: number;
  stepCanContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
};

export default function CheckoutStepFooter({
  currentStep,
  stepCanContinue,
  onBack,
  onContinue,
}: CheckoutStepFooterProps) {
  const showBack = currentStep > 1 && currentStep < 4;
  const showContinue = currentStep < 4;
  const continueLabel = "Continue";

  if (!showBack && !showContinue) return null;

  return (
    <div className={styles.stepFooter}>
      <div className={styles.stepFooterLeft}>
        {showBack ? (
          <SecondaryCTA
            label="Back"
            showArrow={false}
            leadingIcon={<ArrowLeft size={14} aria-hidden="true" />}
            onClick={onBack}
          />
        ) : null}
        {showContinue ? (
          <ContinueButton
            label={continueLabel}
            disabled={!stepCanContinue}
            onClick={onContinue}
            className={styles.mainContinueBtn}
          />
        ) : null}
      </div>
    </div>
  );
}
