"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

type CalendarViewMode = "week" | "month";

type SlotCalendarViewProps = {
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

function buildWeekDays(weekStartOffset: number, today: Date): DayColumn[] {
  return Array.from({ length: 7 }, (_, index) => {
    const offset = weekStartOffset + index;
    const date = dateFromOffset(offset);
    const dateId = `date-${offset}`;
    const selectable = isSlotDateOffsetSelectable(offset);

    return {
      date,
      offset,
      dateId,
      selectable,
      isToday: isSameDay(date, today),
      slots: selectable ? getTimeSlotsForDate(dateId) : [],
    };
  });
}

function buildMonthCells(viewMonth: Date, today: Date): MonthCell[] {
  const firstOfMonth = startOfMonth(viewMonth);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const offset = getOffsetFromDate(date);
    const dateId = `date-${offset}`;
    const selectable = isSlotDateOffsetSelectable(offset);
    const availableCount = selectable
      ? getTimeSlotsForDate(dateId).filter((slot) => slot.status === "available").length
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

  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();
  const startLabel = weekStart.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const endLabel = weekEnd.toLocaleDateString("en-IN", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startLabel} – ${endLabel}`;
}

export default function SlotCalendarView({
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

  const weekDays = useMemo(
    () => buildWeekDays(weekStartOffset, today),
    [weekStartOffset, today],
  );
  const monthCells = useMemo(() => buildMonthCells(viewMonth, today), [viewMonth, today]);

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

  const handleToday = () => {
    setWeekStartOffset(0);
    setViewMonth(startOfMonth(today));
    onSelectDate("date-0");
  };

  const handleViewModeChange = (mode: CalendarViewMode) => {
    setViewMode(mode);
    if (mode === "week") {
      setWeekStartOffset(getRollingWeekStartOffset(selectedOffset));
    } else {
      setViewMonth(startOfMonth(dateFromOffset(selectedOffset)));
    }
  };

  const handleDaySelect = (dateId: string, selectable: boolean) => {
    if (!selectable) return;
    onSelectDate(dateId);
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

  return (
    <div className={styles.calendar}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button type="button" className={styles.todayBtn} onClick={handleToday}>
            Today
          </button>
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

        <div className={styles.viewToggle} role="group" aria-label="Calendar view">
          <button
            type="button"
            className={`${styles.viewBtn} ${viewMode === "week" ? styles.viewBtnActive : ""}`}
            aria-pressed={viewMode === "week"}
            onClick={() => handleViewModeChange("week")}
          >
            Week
          </button>
          <button
            type="button"
            className={`${styles.viewBtn} ${viewMode === "month" ? styles.viewBtnActive : ""}`}
            aria-pressed={viewMode === "month"}
            onClick={() => handleViewModeChange("month")}
          >
            Month
          </button>
        </div>
      </div>

      {viewMode === "week" ? (
        <div className={styles.weekView}>
          <div className={styles.weekHeader}>
            {weekDays.map((day) => {
              const isSelected = day.dateId === selectedDate;
              return (
                <button
                  key={day.dateId}
                  type="button"
                  className={`${styles.weekDayHead} ${
                    day.isToday ? styles.weekDayHeadToday : ""
                  } ${isSelected ? styles.weekDayHeadSelected : ""} ${
                    !day.selectable ? styles.weekDayHeadDisabled : ""
                  }`}
                  disabled={!day.selectable}
                  onClick={() => handleDaySelect(day.dateId, day.selectable)}
                >
                  <span className={styles.weekDayName}>
                    {DAY_LABELS[day.date.getDay()]}
                  </span>
                  <span className={styles.weekDayNum}>{day.date.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.weekBody}>
            {weekDays.map((day) => {
              const isSelectedDay = day.dateId === selectedDate;
              return (
                <div
                  key={day.dateId}
                  className={`${styles.weekDayColumn} ${
                    isSelectedDay ? styles.weekDayColumnSelected : ""
                  } ${!day.selectable ? styles.weekDayColumnDisabled : ""}`}
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
              return (
                <button
                  key={cell.date.toISOString()}
                  type="button"
                  disabled={!cell.selectable}
                  className={`${styles.monthCell} ${
                    !cell.inMonth ? styles.monthCellOutside : ""
                  } ${cell.isToday ? styles.monthCellToday : ""} ${
                    isSelected ? styles.monthCellSelected : ""
                  }`}
                  onClick={() => handleMonthDaySelect(cell)}
                >
                  <span className={styles.monthDayNum}>{cell.date.getDate()}</span>
                  {cell.selectable && cell.availableCount > 0 ? (
                    <span className={styles.monthSlotCount}>
                      {cell.availableCount}{" "}
                      {cell.availableCount === 1 ? "slot" : "slots"}
                    </span>
                  ) : cell.selectable ? (
                    <span className={styles.monthSlotCountMuted}>Full</span>
                  ) : null}
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
