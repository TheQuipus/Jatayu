"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import {
  getOffsetFromDate,
  getSlotDateById,
  getTimeSlotsForDate,
  isSlotDateOffsetSelectable,
  MAX_SLOT_DAY_OFFSET,
  parseSlotDateOffset,
  type TimeSlot,
} from "@/lib/booking";
import styles from "./SlotCalendarView.module.css";

import type { ExpertAvailability } from "@/lib/experts";

type CalendarViewMode = "week" | "month";

type SlotCalendarViewProps = {
  availabilities?: ExpertAvailability[];
  selectedDate: string;
  selectedSlot: string;
  onSelectDate: (dateId: string) => void;
  onSelectSlot: (slotId: string) => void;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type DayColumn = {
  date: Date;
  offset: number;
  dateId: string;
  selectable: boolean;
  isToday: boolean;
  slots: TimeSlot[];
};

type MonthCell = {
  date: Date;
  offset: number;
  dateId: string;
  inMonth: boolean;
  selectable: boolean;
  isToday: boolean;
  availableCount: number;
};

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateFromOffset(offset: number): Date {
  const date = startOfDay(new Date());
  date.setDate(date.getDate() + offset);
  return date;
}

function clampWeekStartOffset(startOffset: number): number {
  const maxStart = Math.max(0, MAX_SLOT_DAY_OFFSET - 7);
  return Math.min(Math.max(0, startOffset), maxStart);
}

function getRollingWeekStartOffset(offset: number): number {
  const clamped = Math.max(0, Math.min(offset, MAX_SLOT_DAY_OFFSET - 1));
  return clampWeekStartOffset(Math.floor(clamped / 7) * 7);
}

function isDayMatchingAvailabilities(date: Date, availabilities?: ExpertAvailability[]): boolean {
  if (!availabilities || availabilities.length === 0) return true;
  const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
  return availabilities.some((rule) =>
    rule.days.some((d) => d.toLowerCase().slice(0, 3) === dayName.toLowerCase())
  );
}

function getSlotsForDateAndAvailabilities(
  date: Date,
  dateId: string,
  availabilities?: ExpertAvailability[]
): TimeSlot[] {
  const isMatch = isDayMatchingAvailabilities(date, availabilities);
  if (!isMatch) return [];

  if (!availabilities || availabilities.length === 0) {
    return getTimeSlotsForDate(dateId);
  }

  const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
  const matchingRule = availabilities.find((rule) =>
    rule.days.some((d) => d.toLowerCase().slice(0, 3) === dayName.toLowerCase())
  );

  const fromTime = matchingRule?.fromTime || "12:00 AM";

  return [
    { id: `${dateId}-slot-1`, time: fromTime, status: "available" },
    { id: `${dateId}-slot-2`, time: "12:15 AM", status: "available" },
    { id: `${dateId}-slot-3`, time: "12:30 AM", status: "available" },
    { id: `${dateId}-slot-4`, time: "12:45 AM", status: "available" },
  ];
}

function buildWeekDays(
  weekStartOffset: number,
  today: Date,
  availabilities?: ExpertAvailability[]
): DayColumn[] {
  return Array.from({ length: 7 }, (_, index) => {
    const offset = weekStartOffset + index;
    const date = dateFromOffset(offset);
    const dateId = `date-${offset}`;
    const dayMatches = isDayMatchingAvailabilities(date, availabilities);
    const selectable = isSlotDateOffsetSelectable(offset) && dayMatches;

    return {
      date,
      offset,
      dateId,
      selectable,
      isToday: isSameDay(date, today),
      slots: selectable ? getSlotsForDateAndAvailabilities(date, dateId, availabilities) : [],
    };
  });
}

function buildMonthCells(
  viewMonth: Date,
  today: Date,
  availabilities?: ExpertAvailability[]
): MonthCell[] {
  const firstOfMonth = startOfMonth(viewMonth);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const offset = getOffsetFromDate(date);
    const dateId = `date-${offset}`;
    const dayMatches = isDayMatchingAvailabilities(date, availabilities);
    const selectable = isSlotDateOffsetSelectable(offset) && dayMatches;
    const availableCount = selectable
      ? getSlotsForDateAndAvailabilities(date, dateId, availabilities).filter(
          (slot) => slot.status === "available"
        ).length
      : 0;

    return {
      date,
      offset,
      dateId,
      inMonth: date.getMonth() === viewMonth.getMonth(),
      selectable,
      isToday: isSameDay(date, today),
      availableCount,
    };
  });
}

function formatWeekRangeLabel(weekStartOffset: number): string {
  const weekStart = dateFromOffset(weekStartOffset);
  const weekEnd = dateFromOffset(weekStartOffset + 6);

  const startLabel = weekStart.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
  const endLabel = weekEnd.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startLabel} – ${endLabel}`;
}

export default function SlotCalendarView({
  availabilities,
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
}: SlotCalendarViewProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const selectedOffset = parseSlotDateOffset(selectedDate);

  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [weekStartOffset, setWeekStartOffset] = useState(() =>
    getRollingWeekStartOffset(selectedOffset),
  );
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(dateFromOffset(selectedOffset)),
  );
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);
  const monthSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMonthSelectOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (monthSelectRef.current && !monthSelectRef.current.contains(event.target as Node)) {
        setIsMonthSelectOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isMonthSelectOpen]);

  const weekDays = useMemo(
    () => buildWeekDays(weekStartOffset, today, availabilities),
    [weekStartOffset, today, availabilities],
  );
  const monthCells = useMemo(
    () => buildMonthCells(viewMonth, today, availabilities),
    [viewMonth, today, availabilities],
  );

  const availableMonths = useMemo(() => {
    const result: { label: string; date: Date }[] = [];
    const start = startOfMonth(today);
    for (let i = 0; i < 6; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      result.push({ label, date: d });
    }
    return result;
  }, [today]);

  const selectedMonthObj = availableMonths.find(
    (m) =>
      m.date.getFullYear() === viewMonth.getFullYear() &&
      m.date.getMonth() === viewMonth.getMonth()
  );
  const selectedMonthLabel =
    selectedMonthObj?.label ||
    viewMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const periodLabel =
    viewMode === "week"
      ? formatWeekRangeLabel(weekStartOffset)
      : viewMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const canGoPrev =
    viewMode === "week"
      ? weekStartOffset > 0
      : startOfMonth(viewMonth).getTime() > startOfMonth(today).getTime();

  const canGoNext =
    viewMode === "week"
      ? weekStartOffset < clampWeekStartOffset(MAX_SLOT_DAY_OFFSET)
      : startOfMonth(viewMonth).getTime() <
        startOfMonth(dateFromOffset(MAX_SLOT_DAY_OFFSET - 1)).getTime();

  const handlePrev = () => {
    if (!canGoPrev) return;
    if (viewMode === "week") {
      setWeekStartOffset((current) => clampWeekStartOffset(current - 7));
      return;
    }
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const handleNext = () => {
    if (!canGoNext) return;
    if (viewMode === "week") {
      setWeekStartOffset((current) => clampWeekStartOffset(current + 7));
      return;
    }
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  const handleViewModeChange = (mode: CalendarViewMode) => {
    setViewMode(mode);
    if (mode === "week") {
      setWeekStartOffset(getRollingWeekStartOffset(selectedOffset));
    } else {
      setViewMonth(startOfMonth(dateFromOffset(selectedOffset)));
    }
  };

  const handleMonthDaySelect = (cell: MonthCell) => {
    if (!cell.selectable) return;
    onSelectDate(cell.dateId);
    setWeekStartOffset(getRollingWeekStartOffset(cell.offset));
  };

  const handleSlotClick = (dateId: string, slot: TimeSlot) => {
    if (slot.status === "booked") return;
    onSelectDate(dateId);
    onSelectSlot(slot.id);
  };

  const selectedDateMeta = getSlotDateById(selectedDate);
  const selectedDaySlots = getTimeSlotsForDate(selectedDate);



  const handleMonthDropdownChange = (newMonthDate: Date) => {
    setViewMonth(newMonthDate);
    const monthStart = startOfMonth(newMonthDate);
    const diffTime = monthStart.getTime() - startOfMonth(today).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
    const targetOffset = Math.max(0, diffDays);

    setWeekStartOffset(clampWeekStartOffset(getRollingWeekStartOffset(targetOffset)));
    onSelectDate(`date-${targetOffset}`);
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>

          <div className={styles.navGroup}>
            <button
              type="button"
              className={styles.navBtn}
              aria-label={viewMode === "week" ? "Previous week" : "Previous month"}
              disabled={!canGoPrev}
              onClick={handlePrev}
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.navBtn}
              aria-label={viewMode === "week" ? "Next week" : "Next month"}
              disabled={!canGoNext}
              onClick={handleNext}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
          <h2 className={styles.periodLabel}>{periodLabel}</h2>
        </div>

        <div className={styles.customSelectContainer} ref={monthSelectRef}>
          <button
            type="button"
            className={styles.customSelectTrigger}
            onClick={() => setIsMonthSelectOpen(!isMonthSelectOpen)}
            aria-haspopup="listbox"
            aria-expanded={isMonthSelectOpen}
          >
            <span>{selectedMonthLabel}</span>
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={styles.customSelectChevron}
              aria-hidden="true"
            />
          </button>
          {isMonthSelectOpen && (
            <ul className={styles.customSelectList} role="listbox">
              {availableMonths.map((m) => {
                const isSelected =
                  m.date.getFullYear() === viewMonth.getFullYear() &&
                  m.date.getMonth() === viewMonth.getMonth();
                return (
                  <li key={m.date.toISOString()} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`${styles.customSelectItem} ${
                        isSelected ? styles.customSelectItemActive : ""
                      }`}
                      onClick={() => {
                        handleMonthDropdownChange(m.date);
                        setIsMonthSelectOpen(false);
                      }}
                    >
                      {m.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {viewMode === "week" ? (
        <div className={styles.weekView}>
          <div className={styles.weekHeader}>
            {weekDays.map((day) => (
              <div
                key={day.dateId}
                className={`${styles.weekDayHead} ${
                  day.isToday ? styles.weekDayHeadToday : ""
                } ${!day.selectable ? styles.weekDayHeadDisabled : ""}`}
              >
                <span className={styles.weekDayName}>
                  {day.isToday ? "Today" : `${DAY_LABELS[day.date.getDay()]} ${day.date.getDate()}`}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.weekBody}>
            {weekDays.map((day) => {
              return (
                <div
                  key={day.dateId}
                  className={`${styles.weekDayColumn} ${
                    !day.selectable ? styles.weekDayColumnDisabled : ""
                  }`}
                >
                  {!day.selectable ? null : day.slots.length === 0 ? (
                    <span className={styles.emptyDayNote}>No slots</span>
                  ) : (
                    <div className={styles.weekSlotList}>
                      {day.slots.map((slot) => {
                        const isBooked = slot.status === "booked";
                        const isSelected = selectedSlot === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isBooked}
                            className={`${styles.weekSlot} ${
                              isBooked
                                ? styles.weekSlotBooked
                                : isSelected
                                  ? styles.weekSlotSelected
                                  : styles.weekSlotAvailable
                            }`}
                            onClick={() => handleSlotClick(day.dateId, slot)}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.monthView}>
          <div className={styles.monthWeekdays} aria-hidden="true">
            {DAY_LABELS.map((label) => (
              <span key={label} className={styles.monthWeekday}>
                {label}
              </span>
            ))}
          </div>

          <div className={styles.monthGrid}>
            {monthCells.map((cell) => {
              const isSelected = cell.dateId === selectedDate;
              const hasAvailableSlots = cell.selectable && cell.availableCount > 0;
              return (
                <button
                  key={cell.date.toISOString()}
                  type="button"
                  disabled={!cell.selectable}
                  className={`${styles.monthCell} ${
                    !cell.inMonth ? styles.monthCellOutside : ""
                  } ${isSelected ? styles.monthCellSelected : ""}`}
                  onClick={() => handleMonthDaySelect(cell)}
                >
                  <span className={styles.monthDayNum}>{cell.date.getDate()}</span>
                  {hasAvailableSlots ? <span className={styles.orangeDot} aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>

          <div className={styles.monthTimes}>
            <p className={styles.monthTimesHeading}>
              Available times
              {selectedDateMeta ? ` — ${selectedDateMeta.sublabel}` : ""}
            </p>
            <div className={styles.monthTimeGrid}>
              {selectedDaySlots.map((slot) => {
                const isBooked = slot.status === "booked";
                const isSelected = selectedSlot === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={isBooked}
                    className={`${styles.weekSlot} ${
                      isBooked
                        ? styles.weekSlotBooked
                        : isSelected
                          ? styles.weekSlotSelected
                          : styles.weekSlotAvailable
                    }`}
                    onClick={() => handleSlotClick(selectedDate, slot)}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
