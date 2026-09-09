"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import AvailabilitySlotRow from "./AvailabilitySlotRow";
import onboardingStyles from "@/components/expert/onboarding/AvailabilityStep.module.css";
import appStyles from "./ExpertAvailability.module.css";
import {
  createEmptySlot,
  formatTimezoneLabel,
  getConflictingSlotIds,
  getMinutes,
  hasValidTimes,
  isAvailabilityValid,
  wouldSlotConflict,
  type TimeSlot,
} from "@/lib/expertAvailability";

export type { TimeSlot };

type ExpertAvailabilityProps = {
  variant?: "onboarding" | "app";
  onValidityChange?: (isValid: boolean) => void;
  onScheduleChange?: (data: { timezone: string; slots: TimeSlot[] }) => void;
};

const DEFAULT_SLOT: TimeSlot = {
  id: "slot-default",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  from: "09:00 AM",
  to: "05:00 PM",
};

export default function ExpertAvailability({
  variant = "onboarding",
  onValidityChange,
  onScheduleChange,
}: ExpertAvailabilityProps) {
  const styles = variant === "app" ? appStyles : onboardingStyles;
  const theme = variant === "app" ? "light" : "dark";
  const [timezone] = useState("Asia/Kolkata");
  const [timezoneLabel] = useState(() => formatTimezoneLabel("Asia/Kolkata"));
  const [slots, setSlots] = useState<TimeSlot[]>([DEFAULT_SLOT]);

  const conflictingSlotIds = useMemo(() => getConflictingSlotIds(slots), [slots]);
  const isValid = isAvailabilityValid(timezone, slots);

  useEffect(() => {
    onValidityChange?.(isValid);
    if (isValid && timezone) onScheduleChange?.({ timezone, slots });
  }, [isValid, onScheduleChange, onValidityChange, slots, timezone]);

  const conflicts = (slotId: string, from: string, to: string, days: string[]) =>
    wouldSlotConflict(slots, slotId, from, to, days);

  const handleToggleDay = (slotId: string, day: string) => {
    setSlots((current) => current.map((slot) => {
      if (slot.id !== slotId || !hasValidTimes(slot)) return slot;
      const selected = slot.days.includes(day);
      const nextDays = selected ? slot.days.filter((item) => item !== day) : [...slot.days, day];
      return !selected && conflicts(slot.id, slot.from, slot.to, nextDays) ? slot : { ...slot, days: nextDays };
    }));
  };

  const handleUpdateSlot = (slotId: string, field: "from" | "to", value: string) => {
    setSlots((current) => current.map((slot) => {
      if (slot.id !== slotId) return slot;
      let updated = { ...slot, [field]: value };
      if (field === "from" && updated.to && getMinutes(updated.to) <= getMinutes(value)) {
        updated = { ...updated, to: "" };
      }
      return hasValidTimes(updated) ? updated : { ...updated, days: [] };
    }));
  };

  return (
    <div className={styles.hoursPane}>
      <div className={styles.hoursPaneHeader}>
        <div>
          <span className={appStyles.timezoneEyebrow}>Timezone</span>
          <h4 className={styles.hoursPaneTitle}>{timezoneLabel}</h4>
        </div>
        <div className={styles.slotDaysCol}>
          <span className={`${styles.hoursPaneTitle} ${styles.selectDaysLabel}`}>Select days</span>
        </div>
      </div>

      <div className={styles.slotsContainer}>
        {slots.map((slot, index) => (
          <AvailabilitySlotRow
            key={slot.id}
            slot={slot}
            slotIndex={index}
            theme={theme}
            styles={styles}
            isConflicting={conflictingSlotIds.has(slot.id)}
            wouldConflict={(from, to, days) => conflicts(slot.id, from, to, days)}
            onToggleDay={(day) => handleToggleDay(slot.id, day)}
            onUpdate={(field, value) => handleUpdateSlot(slot.id, field, value)}
            onRemove={() => setSlots((current) => current.filter((item) => item.id !== slot.id))}
          />
        ))}

        {conflictingSlotIds.size > 0 ? (
          <p className={appStyles.conflictMessage}>Some time slots overlap on the same days. Please resolve the conflict.</p>
        ) : null}

        <button
          type="button"
          onClick={() => setSlots((current) => [...current, createEmptySlot()])}
          className={`${styles.addSlotBtn} ${slots.length >= 5 ? appStyles.limitButton : ""}`}
          disabled={slots.length >= 5}
        >
          {slots.length < 5 ? <><Plus size={14} /><span>Add time slot</span></> : <span>Maximum of 5 time slots reached</span>}
        </button>
      </div>
    </div>
  );
}
