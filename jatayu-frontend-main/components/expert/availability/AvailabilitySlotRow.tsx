import { X } from "lucide-react";
import TimePicker from "@/components/expert/onboarding/TimePicker";
import { WEEK_DAYS, hasValidTimes, type TimeSlot } from "@/lib/expertAvailability";

type AvailabilitySlotRowProps = {
  slot: TimeSlot;
  slotIndex: number;
  theme: "light" | "dark";
  styles: Record<string, string>;
  isConflicting: boolean;
  wouldConflict: (from: string, to: string, days: string[]) => boolean;
  onToggleDay: (day: string) => void;
  onUpdate: (field: "from" | "to", value: string) => void;
  onRemove: () => void;
};

export default function AvailabilitySlotRow({
  slot,
  slotIndex,
  theme,
  styles,
  isConflicting,
  wouldConflict,
  onToggleDay,
  onUpdate,
  onRemove,
}: AvailabilitySlotRowProps) {
  const canSelectDays = hasValidTimes(slot);

  return (
    <div className={`${styles.slotRow} ${isConflicting ? styles.slotRowConflict ?? "" : ""}`}>
      <div className={styles.slotTimes}>
        <TimePicker
          label="Start time"
          ariaLabel="Start time"
          value={slot.from}
          theme={theme}
          onChange={(value) => onUpdate("from", value)}
          validateTime={(time) => !wouldConflict(time, slot.to, slot.days)}
        />
        <TimePicker
          label="End time"
          ariaLabel="End time"
          value={slot.to}
          theme={theme}
          minTime={slot.from || undefined}
          onChange={(value) => onUpdate("to", value)}
          disabled={!slot.from}
          validateTime={(time) => !wouldConflict(slot.from, time, slot.days)}
        />
      </div>

      <div className={styles.slotDaysCol}>
        <div className={styles.daysCluster}>
          {WEEK_DAYS.map((day) => {
            const isSelected = slot.days.includes(day);
            const causesConflict = !isSelected && wouldConflict(slot.from, slot.to, [...slot.days, day]);
            const isDisabled = !canSelectDays || causesConflict;

            return (
              <button
                key={day}
                type="button"
                onClick={() => onToggleDay(day)}
                className={`${styles.dayBtn} ${isSelected ? styles.dayBtnSelected : ""}`}
                aria-pressed={isSelected}
                disabled={isDisabled}
                aria-label={`${isSelected ? "Remove" : "Add"} ${day} for this time slot`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {slotIndex > 0 ? (
        <button type="button" onClick={onRemove} className={styles.slotCloseBtn} aria-label="Remove time slot">
          <X size={15} />
        </button>
      ) : <span className={styles.slotCloseSpacer} aria-hidden="true" />}
    </div>
  );
}
