"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Clock, Plus, X } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import TimePicker from "./TimePicker";
import shared from "./onboarding.shared.module.css";
import styles from "./AvailabilityStep.module.css";

type AvailabilityStepProps = {
  userName: string;
  stepCompletion: boolean[];
  onStepCompleteChange?: (step: number, complete: boolean) => void;
  onBack: () => void;
  onContinue: (data: { slots: TimeSlot[]; timezone: string }) => void;
  onJumpToStep?: (step: number) => void;
};

type TimeSlot = {
  id: string;
  days: string[];
  from: string;
  to: string;
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function createEmptySlot(): TimeSlot {
  return {
    id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    days: [],
    from: "",
    to: "",
  };
}

function getMinutes(timeStr: string) {
  if (!timeStr) return 0;

  if (/AM|PM/i.test(timeStr)) {
    const [time, modifier] = timeStr.split(" ");
    const [hoursStr, minutesStr] = time.split(":");
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr || "0", 10);

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  const [hoursStr, minutesStr] = timeStr.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr || "0", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;

  return hours * 60 + minutes;
}

function hasValidTimes(slot: TimeSlot) {
  return Boolean(slot.from && slot.to && getMinutes(slot.to) > getMinutes(slot.from));
}

function getMachineTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function formatTimezoneLabel(timeZone: string) {
  try {
    const longName = new Intl.DateTimeFormat(undefined, {
      timeZone,
      timeZoneName: "long",
    })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;

    const shortOffset = new Intl.DateTimeFormat(undefined, {
      timeZone,
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;

    if (longName && shortOffset) {
      return `${longName} (${shortOffset})`;
    }

    return timeZone.replace(/_/g, " ");
  } catch {
    return timeZone.replace(/_/g, " ");
  }
}

export default function AvailabilityStep({
  userName,
  stepCompletion,
  onStepCompleteChange,
  onBack,
  onContinue,
  onJumpToStep,
}: AvailabilityStepProps) {
  const [timezone, setTimezone] = useState("");
  const [timezoneLabel, setTimezoneLabel] = useState("Detecting timezone...");
  const [slots, setSlots] = useState<TimeSlot[]>(() => [createEmptySlot()]);

  useEffect(() => {
    const detectedTimezone = getMachineTimezone();
    setTimezone(detectedTimezone);
    setTimezoneLabel(formatTimezoneLabel(detectedTimezone));
  }, []);

  const handleToggleDay = (slotId: string, day: string) => {
    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.id !== slotId || !hasValidTimes(slot)) return slot;
        const hasDay = slot.days.includes(day);
        return {
          ...slot,
          days: hasDay ? slot.days.filter((d) => d !== day) : [...slot.days, day],
        };
      }),
    );
  };

  const handleUpdateSlot = (slotId: string, field: "from" | "to", value: string) => {
    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.id !== slotId) return slot;

        let updatedSlot = { ...slot, [field]: value };

        if (
          field === "from" &&
          updatedSlot.to &&
          getMinutes(updatedSlot.to) <= getMinutes(value)
        ) {
          updatedSlot = { ...updatedSlot, to: "" };
        }

        return hasValidTimes(updatedSlot) ? updatedSlot : { ...updatedSlot, days: [] };
      }),
    );
  };

  const handleAddSlot = () => {
    setSlots((prev) => [...prev, createEmptySlot()]);
  };

  const handleRemoveSlot = (slotId: string) => {
    setSlots((prev) => prev.filter((slot) => slot.id !== slotId));
  };

  const hasValidSlot = slots.some(
    (slot) =>
      slot.days.length > 0 &&
      slot.from &&
      slot.to &&
      getMinutes(slot.to) > getMinutes(slot.from),
  );
  const canContinue = Boolean(timezone) && hasValidSlot;

  useEffect(() => {
    onStepCompleteChange?.(8, canContinue);
  }, [canContinue, onStepCompleteChange]);

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
          <div className={shared.stepPill}>
            <span>Step 8 of 9 - Availability Calendar</span>
          </div>
        </div>

        <OnboardingProgressBar currentStep={8} stepCompletion={stepCompletion} onStepClick={onJumpToStep} />
      </div>

      <div className={shared.cardBody}>
        <h1 className={`${shared.questionTitle} ${styles.questionTitle}`}>
          Set your weekly <span className={shared.accentWord}>availability</span>
        </h1>

        <p className={`${shared.questionSubtitle} ${styles.questionSubtitle}`} style={{ marginBottom: "32px" }}>
          Define the days and times you&apos;re open for consultations. You can always adjust your schedule later.
        </p>

        <div className={styles.timezoneCard}>
          <Clock size={20} className={styles.timezoneIcon} />
          <div className={styles.timezoneContent}>
            <span className={styles.timezoneLabel}>Your Timezone</span>
            <span className={styles.timezoneValue}>{timezoneLabel}</span>
          </div>
        </div>

        <div className={styles.hoursPane}>
          <div className={styles.hoursPaneHeader}>
            <h4 className={styles.hoursPaneTitle}>Define Hours</h4>
            <div className={styles.slotDaysCol}>
              <span className={`${styles.hoursPaneTitle} ${styles.selectDaysLabel}`}>Select days</span>
            </div>
          </div>

          <div className={styles.slotsContainer}>
            {slots.map((slot, slotIndex) => {
              const canSelectDays = hasValidTimes(slot);

              return (
              <div key={slot.id} className={styles.slotRow}>
                <div className={styles.slotTimes}>
                  <TimePicker
                    ariaLabel="Start time"
                    value={slot.from}
                    onChange={(nextValue) => handleUpdateSlot(slot.id, "from", nextValue)}
                  />

                  <span className={styles.slotToDivider}>to</span>

                  <TimePicker
                    ariaLabel="End time"
                    value={slot.to}
                    minTime={slot.from || undefined}
                    onChange={(nextValue) => handleUpdateSlot(slot.id, "to", nextValue)}
                    disabled={!slot.from}
                  />
                </div>

                <div className={styles.slotDaysCol}>
                  <div className={styles.daysCluster}>
                    {WEEK_DAYS.map((day) => {
                      const isSelected = slot.days.includes(day);

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleToggleDay(slot.id, day)}
                          className={`${styles.dayBtn} ${isSelected ? styles.dayBtnSelected : ""}`}
                          aria-pressed={isSelected}
                          aria-disabled={!canSelectDays}
                          disabled={!canSelectDays}
                          aria-label={`${isSelected ? "Remove" : "Add"} ${day} for this time slot`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {slotIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(slot.id)}
                    className={styles.slotCloseBtn}
                    aria-label="Remove time slot"
                  >
                    <X size={15} />
                  </button>
                ) : (
                  <span className={styles.slotCloseSpacer} aria-hidden="true" />
                )}
              </div>
            );
            })}

            <button type="button" onClick={handleAddSlot} className={styles.addSlotBtn}>
              <Plus size={14} />
              <span>Add Time Slot</span>
            </button>
          </div>
        </div>
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
          <button type="button" className={shared.textBtn} onClick={() => onContinue({ slots, timezone })}>
            Skip
          </button>
          <button
            type="button"
            className={shared.continueBtn}
            onClick={() => onContinue({ slots, timezone })}
            disabled={!canContinue}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
