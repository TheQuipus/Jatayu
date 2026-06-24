"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Clock, X } from "lucide-react";
import styles from "./TimePicker.module.css";

type Period = "AM" | "PM";

type DraftTime = {
  hour: number;
  minute: number;
  period: Period;
};

type TimePickerProps = {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minTime?: string;
};

const EMPTY_DISPLAY = "0:00";

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const PERIODS: Period[] = ["AM", "PM"];

const DEFAULT_DRAFT: DraftTime = {
  hour: 9,
  minute: 0,
  period: "AM",
};

function parseTimeValue(value: string): DraftTime | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (!match) return null;

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase() as Period;

  if (hour < 1 || hour > 12 || minute > 59) return null;

  return { hour, minute, period };
}

function formatTimeValue(draft: DraftTime) {
  const hour = String(draft.hour).padStart(2, "0");
  const minute = String(draft.minute).padStart(2, "0");
  return `${hour}:${minute} ${draft.period}`;
}

function draftToMinutes(draft: DraftTime) {
  let hours = draft.hour;

  if (draft.period === "PM" && hours < 12) hours += 12;
  if (draft.period === "AM" && hours === 12) hours = 0;

  return hours * 60 + draft.minute;
}

function getMinutesFromValue(value: string) {
  const parsed = parseTimeValue(value);
  return parsed ? draftToMinutes(parsed) : 0;
}

function padUnit(value: number) {
  return String(value).padStart(2, "0");
}

export default function TimePicker({
  ariaLabel,
  value,
  onChange,
  disabled = false,
  minTime,
}: TimePickerProps) {
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Partial<Record<keyof DraftTime, HTMLButtonElement | null>>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<DraftTime>(parseTimeValue(value) ?? DEFAULT_DRAFT);

  useEffect(() => {
    if (!isOpen) {
      setDraft(parseTimeValue(value) ?? DEFAULT_DRAFT);
    }
  }, [value, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const activeKeys: (keyof DraftTime)[] = ["hour", "minute", "period"];
    activeKeys.forEach((key) => {
      columnRefs.current[key]?.scrollIntoView({ block: "center" });
    });
  }, [isOpen, draft.hour, draft.minute, draft.period]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const minMinutes = minTime ? getMinutesFromValue(minTime) : null;
  const draftMinutes = draftToMinutes(draft);
  const isDraftValid = minMinutes === null || draftMinutes > minMinutes;

  const openPicker = () => {
    if (disabled) return;
    setDraft(parseTimeValue(value) ?? DEFAULT_DRAFT);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    if (!isDraftValid) return;
    onChange(formatTimeValue(draft));
    setIsOpen(false);
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  const updateDraft = (patch: Partial<DraftTime>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  return (
    <div
      ref={rootRef}
      className={`${styles.timePicker} ${disabled ? styles.timePickerDisabled : ""}`}
    >
      <div className={styles.timePickerFieldOuter}>
        <button
          type="button"
          className={`${styles.timePickerField} ${isOpen ? styles.timePickerFieldOpen : ""}`}
          onClick={openPicker}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? popoverId : undefined}
        >
          <Clock size={14} className={styles.timePickerIcon} aria-hidden="true" />
          <span
            className={`${styles.timePickerValue} ${!value ? styles.timePickerPlaceholder : ""}`}
          >
            {value || EMPTY_DISPLAY}
          </span>
        </button>
        {value && !disabled && (
          <button
            type="button"
            className={styles.timePickerClear}
            onClick={handleClear}
            aria-label={`Clear ${ariaLabel.toLowerCase()}`}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div id={popoverId} className={styles.timePickerPopover} role="dialog" aria-label={ariaLabel}>
          <div className={styles.timePickerColumns}>
            <div className={styles.timePickerColumn} aria-label="Hours">
              {HOURS.map((hour) => {
                const isActive = draft.hour === hour;
                return (
                  <button
                    key={hour}
                    type="button"
                    ref={isActive ? (node) => { columnRefs.current.hour = node; } : undefined}
                    className={`${styles.timePickerColumnItem} ${
                      isActive ? styles.timePickerColumnItemActive : ""
                    }`}
                    onClick={() => updateDraft({ hour })}
                  >
                    {hour}
                  </button>
                );
              })}
            </div>

            <div className={styles.timePickerColumn} aria-label="Minutes">
              {MINUTES.map((minute) => {
                const isActive = draft.minute === minute;
                return (
                  <button
                    key={minute}
                    type="button"
                    ref={isActive ? (node) => { columnRefs.current.minute = node; } : undefined}
                    className={`${styles.timePickerColumnItem} ${
                      isActive ? styles.timePickerColumnItemActive : ""
                    }`}
                    onClick={() => updateDraft({ minute })}
                  >
                    {padUnit(minute)}
                  </button>
                );
              })}
            </div>

            <div className={styles.timePickerColumn} aria-label="AM or PM">
              {PERIODS.map((period) => {
                const isActive = draft.period === period;
                return (
                  <button
                    key={period}
                    type="button"
                    ref={isActive ? (node) => { columnRefs.current.period = node; } : undefined}
                    className={`${styles.timePickerColumnItem} ${
                      isActive ? styles.timePickerColumnItemActive : ""
                    }`}
                    onClick={() => updateDraft({ period })}
                  >
                    {period}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.timePickerFooter}>
            <button type="button" className={styles.timePickerAction} onClick={() => setIsOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.timePickerAction}
              onClick={handleConfirm}
              disabled={!isDraftValid}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { getMinutesFromValue as getTimePickerMinutes };
