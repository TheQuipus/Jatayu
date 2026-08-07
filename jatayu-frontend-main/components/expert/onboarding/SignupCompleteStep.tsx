"use client";

import { CheckCircle2 } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import RegisterLeftPanel from "@/components/expert/onboarding/RegisterLeftPanel";
import register from "./register.shared.module.css";
import styles from "./AccountStatusStep.module.css";

type SignupCompleteStepProps = {
  userName: string;
  onContinue: () => void;
};

export default function SignupCompleteStep({ userName, onContinue }: SignupCompleteStepProps) {
  return (
    <section className={register.registerCard}>
      <RegisterLeftPanel variant="login" />

      <div className={`${register.registerRight} ${styles.statusPanel}`}>
        <div className={styles.statusIconWrap}>
          <CheckCircle2 size={40} className={styles.statusIconSuccess} />
        </div>

        <h1 className={styles.statusTitle}>
          Account <span className={styles.accent}>verified</span>
        </h1>

        <p className={styles.statusDescription}>
          {userName ? `${userName}, your` : "Your"} signup is complete. Next, set up your expert
          profile so we can review your application.
        </p>

        <ul className={styles.statusList}>
          <li className={styles.statusListItemDone}>Email & phone verified</li>
          <li className={styles.statusListItemPending}>Expert profile onboarding</li>
          <li className={styles.statusListItemPending}>Application review</li>
        </ul>

        <ContinueButton
          type="button"
          label="Continue to onboarding"
          onClick={onContinue}
          className={styles.continueBtn}
          arrowSize={16}
        />
      </div>
    </section>
  );
}
