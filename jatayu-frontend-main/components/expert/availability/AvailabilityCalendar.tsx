"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./ExpertAvailabilityPage.module.css";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function AvailabilityCalendar() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const view = useMemo(() => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + monthOffset);
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    return {
      year,
      month,
      firstDay,
      days,
      title: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  }, [monthOffset]);

  return (
    <section className={`${styles.panel} ${styles.calendarPanel}`}>
      <div className={styles.calendarHeader}>
        <button
          type="button"
          className={styles.calendarNavBtn}
          onClick={() => setMonthOffset((value) => value - 1)}
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className={styles.calendarTitle}>{view.title}</h2>
        <button
          type="button"
          className={styles.calendarNavBtn}
          onClick={() => setMonthOffset((value) => value + 1)}
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className={styles.calendarGrid}>
        {WEEKDAYS.map((day) => (
          <span key={day} className={styles.weekday}>
            {day}
          </span>
        ))}
        {Array.from({ length: view.firstDay }).map((_, index) => (
          <span key={`blank-${index}`} className={styles.calendarBlank} />
        ))}
        {Array.from({ length: view.days }, (_, index) => index + 1).map((day) => {
          const hasSession = [4, 8, 12, 16, 21, 25].includes(day);
          const isBlocked = [2, 18].includes(day);
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              type="button"
              className={`${styles.calendarDay} ${isSelected ? styles.selectedDay : ""} ${
                hasSession ? styles.hasSession : ""
              } ${isBlocked ? styles.isBlocked : ""}`}
              onClick={() => setSelectedDay(day)}
            >
              <span>{day}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.calendarLegend}>
        <span className={styles.legendItem}>
          <i className={styles.legendAvailable} /> Available
        </span>
        <span className={styles.legendItem}>
          <i className={styles.legendSession} /> Booked
        </span>
        <span className={styles.legendItem}>
          <i className={styles.legendBlocked} /> Blocked
        </span>
      </div>
    </section>
  );
}
