"use client";

import { useState } from "react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ExpertAvailability from "@/components/expert/availability/ExpertAvailability";
import styles from "./ExpertAvailabilityPage.module.css";

export default function ExpertAvailabilityPage() {
  const [canSave, setCanSave] = useState(false);

  return (
    <section className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <h1 className={styles.pageTitle}>
              Availability & <span className={styles.accentWord}>Calendar</span>
            </h1>
            <p className={styles.pageSubtitle}>
              Define the days and times you&apos;re open for consultations.
            </p>
          </div>
        </header>

        <div className={styles.editorCard}>
          <ExpertAvailability variant="app" onValidityChange={setCanSave} />

          <PrimaryButton
            type="button"
            label="Save Availability"
            variant="orange"
            fullWidth
            disabled={!canSave}
            className={styles.saveBtn}
          />
        </div>
      </div>
    </section>
  );
}
