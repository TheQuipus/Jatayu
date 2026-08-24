"use client";

import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import RegisterLeftPanel from "@/components/expert/onboarding/RegisterLeftPanel";
import type { ExpertAccountStatus } from "@/lib/expertOnboardingStatus";
import register from "./register.shared.module.css";
import styles from "./AccountStatusStep.module.css";

type AccountStatusStepProps = {
  userName: string;
  accountStatus: ExpertAccountStatus;
  onContinue: () => void;
};

export default function AccountStatusStep({
  userName,
  accountStatus,
  onContinue,
}: AccountStatusStepProps) {
  const {
    headline,
    description,
    progressPercent,
    currentStepLabel,
    pendingSteps,
    applicationStatus,
    phase,
  } = accountStatus;

  const StatusIcon =
    phase === "rejected" ? AlertCircle : phase === "submitted" ? Clock3 : CheckCircle2;

  const iconClass =
    phase === "rejected"
      ? styles.statusIconWarning
      : phase === "submitted"
        ? styles.statusIconPending
        : styles.statusIconSuccess;

  return (
    <section className={register.registerCard}>
      <RegisterLeftPanel variant="login" />

      <div className={`${register.registerRight} ${styles.statusPanel}`}>
        <div className={styles.statusIconWrap}>
          <StatusIcon size={40} className={iconClass} />
        </div>

        <p className={styles.statusEyebrow}>Welcome back{userName ? `, ${userName}` : ""}</p>
        <h1 className={styles.statusTitle}>{headline}</h1>
        <p className={styles.statusDescription}>{description}</p>

        <div className={styles.statusMeta}>
          <span className={styles.statusBadge}>{applicationStatus}</span>
          {phase === "onboarding" ? (
            <span className={styles.statusProgress}>{progressPercent}% complete</span>
          ) : null}
        </div>

        {currentStepLabel ? (
          <p className={styles.currentStep}>
            Current step: <strong>{currentStepLabel}</strong>
          </p>
        ) : null}

        {pendingSteps.length > 0 ? (
          <ul className={styles.statusList}>
            {pendingSteps.map((step) => (
              <li
                key={step.id}
                className={
                  step.complete
                    ? styles.statusListItemDone
                    : step.current
                      ? styles.statusListItemCurrent
                      : styles.statusListItemPending
                }
              >
                {step.label}
              </li>
            ))}
          </ul>
        ) : null}

        <ContinueButton
          type="button"
          label={phase === "submitted" || phase === "approved" ? "Go to dashboard" : accountStatus.continueLabel}
          onClick={() => {
            if (phase === "submitted" || phase === "approved") {
              window.location.assign("/expert/dashboard/");
              return;
            }
            onContinue();
          }}
          className={styles.continueBtn}
          arrowSize={16}
        />
      </div>
    </section>
  );
}
