import type { Expert } from "@/lib/experts";
import SlotCalendarView from "./SlotCalendarView";
import StepHeader from "./StepHeader";
import styles from "./StepPickSlot.module.css";

export type StepPickSlotProps = {
  expert: Expert;
  selectedDate: string;
  selectedSlot: string;
  onSelectDate: (dateId: string) => void;
  onSelectSlot: (slot: string) => void;
};

export default function StepPickSlot({
  expert,
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
}: StepPickSlotProps) {
  return (
    <div className={styles.stepContent}>
      <StepHeader
        title="Pick a Slot"
        subtitle="Pick an available slot from the expert's calendar."
      />

      <div className={styles.slotStep}>
        <SlotCalendarView
          availabilities={expert.availabilities}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          onSelectDate={onSelectDate}
          onSelectSlot={onSelectSlot}
        />
      </div>
    </div>
  );
}
