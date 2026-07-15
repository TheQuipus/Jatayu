"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import darkStyles from "./TimePicker.module.css";
import lightStyles from "./TimePicker.light.module.css";

type Period = "AM" | "PM";

type DraftTime = {
  hour: number | null;
  minute: number | null;
  period: Period | null;
};

type TimePickerProps = {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minTime?: string;
  theme?: "dark" | "light";
  validateTime?: (value: string) => boolean;
};

const EMPTY_DISPLAY = "Select time";

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const PERIODS: Period[] = ["AM", "PM"];

const EMPTY_DRAFT: DraftTime = {
  hour: null,
  minute: null,
  period: null,
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
  if (draft.hour === null || draft.minute === null || draft.period === null) return "";
  const hour = String(draft.hour).padStart(2, "0");
  const minute = String(draft.minute).padStart(2, "0");
  return `${hour}:${minute} ${draft.period}`;
}

function draftToMinutes(draft: DraftTime) {
  if (draft.hour === null || draft.minute === null || draft.period === null) return 0;
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

function scrollColumnToActive(
  column: HTMLDivElement | null | undefined,
  button: HTMLButtonElement | null | undefined,
) {
  if (!column || !button) return;

  const top = button.offsetTop - column.clientHeight / 2 + button.offsetHeight / 2;
  column.scrollTop = Math.max(0, top);
}

const POPOVER_WIDTH = 220;
const POPOVER_ESTIMATED_HEIGHT = 280;

export default function TimePicker({
  ariaLabel,
  value,
  onChange,
  disabled = false,
  minTime,
  theme = "dark",
  validateTime,
}: TimePickerProps) {
  const styles = theme === "light" ? lightStyles : darkStyles;
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Partial<Record<keyof DraftTime, HTMLButtonElement | null>>>({});
  const columnContainerRefs = useRef<Partial<Record<keyof DraftTime, HTMLDivElement | null>>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [draft, setDraft] = useState<DraftTime>(parseTimeValue(value) ?? EMPTY_DRAFT);

  useEffect(() => {
    if (!isOpen) {
      setDraft(parseTimeValue(value) ?? EMPTY_DRAFT);
    }
  }, [value, isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !fieldRef.current) return;

    const updatePosition = () => {
      const rect = fieldRef.current!.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < POPOVER_ESTIMATED_HEIGHT && rect.top > POPOVER_ESTIMATED_HEIGHT;

      setPopoverStyle({
        position: "fixed",
        left: rect.left,
        width: POPOVER_WIDTH,
        zIndex: 9999,
        ...(openAbove
          ? { bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const activeKeys: (keyof DraftTime)[] = ["hour", "minute", "period"];
    activeKeys.forEach((key) => {
      scrollColumnToActive(columnContainerRefs.current[key], columnRefs.current[key]);
    });
  }, [isOpen, draft.hour, draft.minute, draft.period]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
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
  const isDraftComplete = draft.hour !== null && draft.minute !== null && draft.period !== null;
  const draftMinutes = isDraftComplete ? draftToMinutes(draft) : 0;
  const formattedDraft = isDraftComplete ? formatTimeValue(draft) : "";
  const isMinTimeValid = !isDraftComplete || minMinutes === null || draftMinutes > minMinutes;
  const isCustomValid = !isDraftComplete || !validateTime || validateTime(formattedDraft);
  const isDraftValid = isDraftComplete && isMinTimeValid && isCustomValid;
  const hasError = isDraftComplete && (!isMinTimeValid || !isCustomValid);

  const openPicker = () => {
    if (disabled) return;
    setDraft(parseTimeValue(value) ?? EMPTY_DRAFT);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    if (!isDraftValid) return;
    onChange(formatTimeValue(draft));
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
          ref={fieldRef}
          type="button"
          className={`${styles.timePickerField} ${isOpen ? styles.timePickerFieldOpen : ""} ${
            !value ? styles.timePickerFieldPlaceholder : ""
          }`}
          onClick={openPicker}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? popoverId : undefined}
        >
          <span className={styles.timePickerValue}>{value || EMPTY_DISPLAY}</span>
        </button>
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            className={styles.timePickerPopover}
            style={popoverStyle}
            role="dialog"
            aria-label={ariaLabel}
          >
          <div className={styles.timePickerColumns}>
            <div
              ref={(node) => {
                columnContainerRefs.current.hour = node;
              }}
              className={styles.timePickerColumn}
              aria-label="Hours"
            >
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
                    {padUnit(hour)}
                  </button>
                );
              })}
            </div>

            <div
              ref={(node) => {
                columnContainerRefs.current.minute = node;
              }}
              className={styles.timePickerColumn}
              aria-label="Minutes"
            >
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

            <div
              ref={(node) => {
                columnContainerRefs.current.period = node;
              }}
              className={styles.timePickerColumn}
              aria-label="AM or PM"
            >
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

          {hasError && (
            <div className={styles.timePickerError}>
              {!isMinTimeValid
                ? "Must be after start time"
                : "Time conflict with another slot"}
            </div>
          )}

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
        </div>,
          document.body,
        )}
    </div>
  );
}

export { getMinutesFromValue as getTimePickerMinutes };
