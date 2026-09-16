"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Save } from "lucide-react";
import ExpertAvailability from "./ExpertAvailability";
import styles from "./ExpertAvailabilityPage.module.css";
import type { TimeSlot } from "@/lib/expertAvailability";
import { fetchExpertAvailability, saveExpertAvailability } from "@/lib/expertProfileApi";

type WeeklySchedulePanelProps = {
  onValidityChange?: (isValid: boolean) => void;
};

export default function WeeklySchedulePanel({ onValidityChange }: WeeklySchedulePanelProps = {}) {
  const [isValid, setIsValid] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadedSchedule, setLoadedSchedule] = useState<{
    timezone: string;
    slots: TimeSlot[];
  } | null>(null);
  const [currentSchedule, setCurrentSchedule] = useState<{
    timezone: string;
    slots: TimeSlot[];
  } | null>(null);

  useEffect(() => {
    let active = true;
    void fetchExpertAvailability()
      .then((schedule) => {
        if (!active) return;
        setLoadedSchedule(schedule);
        setCurrentSchedule(schedule);
      })
      .catch((error) => {
        console.error("Could not load expert availability:", error);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleValidityChange = useCallback((valid: boolean) => {
    setIsValid(valid);
    onValidityChange?.(valid);
  }, [onValidityChange]);

  const handleScheduleChange = useCallback((schedule: { timezone: string; slots: TimeSlot[] }) => {
    setCurrentSchedule(schedule);
    setIsSaved(false);
  }, []);

  const handleSave = async () => {
    if (!isValid || !currentSchedule || isSaving) return;
    setIsSaving(true);
    try {
      await saveExpertAvailability(currentSchedule.timezone, currentSchedule.slots);
      setLoadedSchedule(currentSchedule);
      setIsSaved(true);
      window.setTimeout(() => setIsSaved(false), 2200);
    } catch (error) {
      console.error("Could not save expert availability:", error);
    } finally {
      setIsSaving(false);
    }
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
            disabled={!isValid || !currentSchedule || isSaved || isSaving}
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
        <ExpertAvailability
          variant="app"
          initialTimezone={loadedSchedule?.timezone}
          initialSlots={loadedSchedule?.slots}
          onValidityChange={handleValidityChange}
          onScheduleChange={handleScheduleChange}
        />
      </div>
    </section>
  );
}
