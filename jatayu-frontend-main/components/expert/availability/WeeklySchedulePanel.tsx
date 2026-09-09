"use client";

import { useState } from "react";
import { Check, Save } from "lucide-react";
import ExpertAvailability from "./ExpertAvailability";
import styles from "./ExpertAvailabilityPage.module.css";

type WeeklySchedulePanelProps = {
  onValidityChange?: (isValid: boolean) => void;
};

export default function WeeklySchedulePanel({ onValidityChange }: WeeklySchedulePanelProps = {}) {
  const [isValid, setIsValid] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleValidityChange = (valid: boolean) => {
    setIsValid(valid);
    onValidityChange?.(valid);
  };

  const handleSave = () => {
    if (!isValid) return;
    setIsSaved(true);
    window.setTimeout(() => setIsSaved(false), 2200);
  };

  return (
    <section id="weekly-schedule" className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.sectionIndex}>01</span>
          <h2>Weekly schedule</h2>
          <p>Define standard recurring operating hours when seekers can book a consultation.</p>
        </div>
        <div className={styles.panelHeaderActions}>
          <button
            type="button"
            className={`${styles.panelSaveBtn} ${isSaved ? styles.savedState : ""}`}
            onClick={handleSave}
            disabled={!isValid || isSaved}
            aria-label="Save weekly schedule"
          >
            {isSaved ? (
              <>
                <Check size={13} />
                <span>Schedule saved</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Save schedule</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className={styles.panelBody}>
        <ExpertAvailability variant="app" onValidityChange={handleValidityChange} />
      </div>
    </section>
  );
}
