"use client";

import type { ReactNode } from "react";
import styles from "./Field.module.css";

type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export default function Field({ label, hint, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
      {hint ? <p className={styles.fieldHint}>{hint}</p> : null}
    </div>
  );
}
