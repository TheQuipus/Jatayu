import type { ReactNode } from "react";
import styles from "./StepHeader.module.css";

export type StepHeaderProps = {
  title: string;
  subtitle: ReactNode;
};

export default function StepHeader({ title, subtitle }: StepHeaderProps) {
  return (
    <div className={styles.stepHead}>
      <h1 className={styles.stepTitle}>{title}</h1>
      <div className={styles.stepRuleRow}>
        <span className={styles.benefitsRule} aria-hidden="true" />
      </div>
      <p className={styles.stepSubtitle}>{subtitle}</p>
    </div>
  );
}
