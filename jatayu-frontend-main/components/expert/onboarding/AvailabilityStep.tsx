"use client";

import { useState } from "react";
import Image from "next/image";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import ExpertAvailability from "@/components/expert/availability/ExpertAvailability";
import type { TimeSlot } from "@/lib/expertAvailability";
import ContinueButton from "@/components/ui/ContinueButton";
import shared from "./onboarding.shared.module.css";
import styles from "./AvailabilityStep.module.css";

type AvailabilityStepProps = {
  userName: string;
  stepCompletion: boolean[];
  onStepCompleteChange?: (step: number, complete: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
  onScheduleChange?: (data: { timezone: string; slots: TimeSlot[] }) => void;
  onJumpToStep?: (step: number) => void;
};

export default function AvailabilityStep({
  userName,
  stepCompletion,
  onStepCompleteChange,
  onBack,
  onContinue,
  onScheduleChange,
  onJumpToStep,
}: AvailabilityStepProps) {
  const [canContinue, setCanContinue] = useState(false);

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
        </div>

        <OnboardingProgressBar currentStep={8} stepCompletion={stepCompletion} onStepClick={onJumpToStep} />
      </div>

      <div className={shared.cardBody}>
        <h1 className={`${shared.questionTitle} ${styles.questionTitle}`}>
          Set your weekly <span className={shared.accentWord}>availability</span>
        </h1>

        <p className={`${shared.questionSubtitle} ${styles.questionSubtitle}`}>
          Define the days and times you&apos;re open for consultations. You can always adjust your schedule later.
        </p>

        <ExpertAvailability
          variant="onboarding"
          onValidityChange={(isValid) => {
            setCanContinue(isValid);
            onStepCompleteChange?.(8, isValid);
          }}
          onScheduleChange={onScheduleChange}
        />
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
            <strong>Availability Ready +10%</strong>
            <small>Great schedule. Users can book you easily.</small>
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
