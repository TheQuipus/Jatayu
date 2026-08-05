"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import TimePicker from "@/components/expert/onboarding/TimePicker";
import onboardingStyles from "@/components/expert/onboarding/AvailabilityStep.module.css";
import appStyles from "./ExpertAvailability.module.css";
import {
  WEEK_DAYS,
  createEmptySlot,
  createDefaultSlot,
  formatTimezoneLabel,
  getMachineTimezone,
  getMinutes,
  hasValidTimes,
  isAvailabilityValid,
  type TimeSlot,
} from "@/lib/expertAvailability";

export type { TimeSlot };

type ExpertAvailabilityProps = {
  variant?: "onboarding" | "app";
  initialSchedule?: { timezone: string; slots: TimeSlot[] };
  onValidityChange?: (isValid: boolean) => void;
  onScheduleChange?: (data: { timezone: string; slots: TimeSlot[] }) => void;
};

export default function ExpertAvailability({
  variant = "onboarding",
  initialSchedule,
  onValidityChange,
  onScheduleChange,
}: ExpertAvailabilityProps) {
  const styles = variant === "app" ? appStyles : onboardingStyles;
  const timePickerTheme = variant === "app" ? "light" : "dark";

  const [timezone, setTimezone] = useState(initialSchedule?.timezone || "");
  const [timezoneLabel, setTimezoneLabel] = useState(
    initialSchedule?.timezone
      ? formatTimezoneLabel(initialSchedule.timezone)
      : "Detecting timezone...",
  );
  const [slots, setSlots] = useState<TimeSlot[]>(
    () => initialSchedule?.slots?.length ? initialSchedule.slots : [createEmptySlot()],
  );

  useEffect(() => {
    if (initialSchedule?.timezone) {
      setTimezone(initialSchedule.timezone);
      setTimezoneLabel(formatTimezoneLabel(initialSchedule.timezone));
    }
    if (initialSchedule?.slots?.length) {
      setSlots(initialSchedule.slots);
    }
  }, [initialSchedule]);

  useEffect(() => {
    if (initialSchedule?.timezone) return;

    const detectedTimezone = getMachineTimezone();
    setTimezone(detectedTimezone);
    setTimezoneLabel(formatTimezoneLabel(detectedTimezone));
  }, [initialSchedule?.timezone]);

  const getConflictingSlotIds = (currentSlots: TimeSlot[]): Set<string> => {
    const conflictingIds = new Set<string>();
    for (let i = 0; i < currentSlots.length; i++) {
      const slotA = currentSlots[i];
      if (!slotA.from || !slotA.to || getMinutes(slotA.to) <= getMinutes(slotA.from)) {
        continue;
      }
      for (let j = i + 1; j < currentSlots.length; j++) {
        const slotB = currentSlots[j];
        if (!slotB.from || !slotB.to || getMinutes(slotB.to) <= getMinutes(slotB.from)) {
          continue;
        }
        const shareDay = slotA.days.some((day) => slotB.days.includes(day));
        if (shareDay) {
          const timeAFrom = getMinutes(slotA.from);
          const timeATo = getMinutes(slotA.to);
          const timeBFrom = getMinutes(slotB.from);
          const timeBTo = getMinutes(slotB.to);

          if (timeAFrom < timeBTo && timeBFrom < timeATo) {
            conflictingIds.add(slotA.id);
            conflictingIds.add(slotB.id);
          }
        }
      }
    }
    return conflictingIds;
  };

  const conflictingSlotIds = getConflictingSlotIds(slots);

  const wouldConflict = (slotId: string, from: string, to: string, days: string[]): boolean => {
    if (!from || !to || !days.length) return false;
    const proposedFrom = getMinutes(from);
    const proposedTo = getMinutes(to);
    if (proposedTo <= proposedFrom) return false;

    return slots.some((other) => {
      if (other.id === slotId) return false;
      if (!other.from || !other.to || !other.days.length) return false;

      const shareDay = days.some((day) => other.days.includes(day));
      if (!shareDay) return false;

      const otherFrom = getMinutes(other.from);
      const otherTo = getMinutes(other.to);
      return proposedFrom < otherTo && otherFrom < proposedTo;
    });
  };

  const handleToggleDay = (slotId: string, day: string) => {
    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.id !== slotId || !hasValidTimes(slot)) return slot;
        const hasDay = slot.days.includes(day);
        if (!hasDay && wouldConflict(slot.id, slot.from, slot.to, [...slot.days, day])) {
          return slot;
        }
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
    if (slots.length >= 5) return;
    setSlots((prev) => [...prev, createEmptySlot()]);
  };

  const handleRemoveSlot = (slotId: string) => {
    setSlots((prev) => prev.filter((slot) => slot.id !== slotId));
  };

  const isValid = isAvailabilityValid(timezone, slots);

  useEffect(() => {
    onValidityChange?.(isValid);
    if (isValid && timezone) {
      onScheduleChange?.({ timezone, slots });
    }
  }, [isValid, onValidityChange, onScheduleChange, slots, timezone]);

  return (
    <>
      <div className={styles.hoursPane}>
        <div className={styles.hoursPaneHeader}>
          <h4 className={styles.hoursPaneTitle}>{timezoneLabel}</h4>
          <div className={styles.slotDaysCol}>
            <span className={`${styles.hoursPaneTitle} ${styles.selectDaysLabel}`}>Select days</span>
          </div>
        </div>

        <div className={styles.slotsContainer}>
          {slots.map((slot, slotIndex) => {
            const canSelectDays = hasValidTimes(slot);
            const isConflicting = conflictingSlotIds.has(slot.id);

            return (
              <div
                key={slot.id}
                className={styles.slotRow}
                style={isConflicting ? { borderColor: "#e53b17", boxShadow: "0 0 0 1px #e53b17" } : undefined}
              >
                <div className={styles.slotTimes}>
                  <TimePicker
                    label="Start time"
                    ariaLabel="Start time"
                    value={slot.from}
                    theme={timePickerTheme}
                    onChange={(nextValue) => handleUpdateSlot(slot.id, "from", nextValue)}
                    validateTime={(time) => !wouldConflict(slot.id, time, slot.to, slot.days)}
                  />

                  <TimePicker
                    label="End time"
                    ariaLabel="End time"
                    value={slot.to}
                    theme={timePickerTheme}
                    minTime={slot.from || undefined}
                    onChange={(nextValue) => handleUpdateSlot(slot.id, "to", nextValue)}
                    disabled={!slot.from}
                    validateTime={(time) => !wouldConflict(slot.id, slot.from, time, slot.days)}
                  />
                </div>

                <div className={styles.slotDaysCol}>
                  <div className={styles.daysCluster}>
                    {WEEK_DAYS.map((day) => {
                      const isSelected = slot.days.includes(day);
                      const causesConflict = !isSelected && wouldConflict(slot.id, slot.from, slot.to, [...slot.days, day]);
                      const isBtnDisabled = !canSelectDays || causesConflict;

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleToggleDay(slot.id, day)}
                          className={`${styles.dayBtn} ${isSelected ? styles.dayBtnSelected : ""}`}
                          aria-pressed={isSelected}
                          aria-disabled={isBtnDisabled}
                          disabled={isBtnDisabled}
                          style={causesConflict ? { opacity: 0.3, cursor: "not-allowed" } : undefined}
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

          {conflictingSlotIds.size > 0 && (
            <div style={{ color: "#e53b17", fontSize: "14px", fontWeight: 500, marginTop: "-4px", marginBottom: "8px" }}>
              Some time slots overlap on the same days. Please resolve conflicts.
            </div>
          )}

          {slots.length < 5 ? (
            <button type="button" onClick={handleAddSlot} className={styles.addSlotBtn}>
              <Plus size={14} />
              <span>Add Time Slot</span>
            </button>
          ) : (
            <button
              type="button"
              className={styles.addSlotBtn}
              disabled
              style={{ opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" }}
            >
              <span>Maximum of 5 time slots reached</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
