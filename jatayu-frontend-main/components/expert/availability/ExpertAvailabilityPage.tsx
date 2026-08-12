"use client";

import { useEffect, useState } from "react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ExpertAvailability from "@/components/expert/availability/ExpertAvailability";
import {
  fetchExpertAvailability,
  saveExpertAvailability,
} from "@/lib/expertProfileApi";
import type { TimeSlot } from "@/lib/expertAvailability";
import styles from "./ExpertAvailabilityPage.module.css";

export default function ExpertAvailabilityPage() {
  const [canSave, setCanSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [initialSchedule, setInitialSchedule] = useState<{
    timezone: string;
    slots: TimeSlot[];
  } | null>(null);
  const [schedule, setSchedule] = useState<{ timezone: string; slots: TimeSlot[] } | null>(
    null,
  );

  useEffect(() => {
    void fetchExpertAvailability()
      .then((data) => {
        if (data.timezone || data.slots.length > 0) {
          setInitialSchedule(data);
          setSchedule(data);
        }
      })
      .catch(() => {
        // Keep default empty schedule when profile has no availability yet.
      });
  }, []);

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
          <ExpertAvailability
            variant="app"
            initialSchedule={initialSchedule ?? undefined}
            onValidityChange={setCanSave}
            onScheduleChange={setSchedule}
          />

          <PrimaryButton
            type="button"
            label={isSaving ? "Saving..." : "Save Availability"}
            variant="orange"
            fullWidth
            disabled={!canSave || isSaving || !schedule}
            className={styles.saveBtn}
            onClick={async () => {
              if (!schedule) return;
              setIsSaving(true);
              setSaveError(null);
              setSaved(false);
              try {
                await saveExpertAvailability(schedule.timezone, schedule.slots);
                setInitialSchedule(schedule);
                setSaved(true);
              } catch (error) {
                setSaveError(
                  error instanceof Error ? error.message : "Could not save availability.",
                );
              } finally {
                setIsSaving(false);
              }
            }}
          />
          {saveError ? <p className={styles.pageSubtitle}>{saveError}</p> : null}
          {saved ? <p className={styles.pageSubtitle}>Availability saved successfully.</p> : null}
        </div>
      </div>
    </section>
  );
}
