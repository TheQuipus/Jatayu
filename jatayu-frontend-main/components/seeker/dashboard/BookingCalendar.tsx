"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal, Sparkles } from "lucide-react";
import {
  UPCOMING_BOOKINGS,
  getBookingDetailHref,
  type CalendarBooking,
} from "@/lib/seekerDashboard";
import styles from "./BookingCalendar.module.css";

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(booking: CalendarBooking): string {
  const start = new Date();
  start.setHours(booking.startHour, booking.startMinute, 0, 0);

  return start.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRangeLabel(days: Date[]): string {
  const first = days[0];
  const last = days[days.length - 1];
  const sameMonth = first.getMonth() === last.getMonth();
  const month = first.toLocaleDateString("en-IN", { month: "short" });
  const endMonth = last.toLocaleDateString("en-IN", { month: "short" });

  return sameMonth
    ? `${month} ${first.getDate()} - ${last.getDate()}`
    : `${month} ${first.getDate()} - ${endMonth} ${last.getDate()}`;
}

function formatStatus(status: CalendarBooking["status"]): string {
  return status === "confirmed" ? "Confirmed" : "Pending";
}

type BookingCalendarProps = {
  className?: string;
};

export default function BookingCalendar({ className = "" }: BookingCalendarProps) {
  const today = useMemo(() => {
    return startOfDay(new Date());
  }, []);

  const [visibleStart, setVisibleStart] = useState(today);

  const visibleDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(visibleStart, index)),
    [visibleStart]
  );

  const bookingsByDay = useMemo(() => {
    const map = new Map<number, CalendarBooking[]>();

    visibleDays.forEach((day, index) => {
      const dayBookings = UPCOMING_BOOKINGS.filter((booking) =>
        isSameDay(addDays(today, booking.dayOffset), day)
      );
      map.set(index, dayBookings);
    });

    return map;
  }, [today, visibleDays]);

  const rangeLabel = formatRangeLabel(visibleDays);

  return (
    <section className={`${styles.calendar} ${className}`.trim()}>
      <div className={styles.calendarShell}>
        <div className={styles.calendarToolbar}>
          <div className={styles.toolbarLeft}>
            <span className={styles.rangeLabel}>{rangeLabel}</span>
            <button type="button" className={styles.iconGhostBtn} aria-label="Calendar settings">
              <Sparkles size={13} aria-hidden="true" />
            </button>
            <button type="button" className={styles.iconGhostBtn} aria-label="More calendar actions">
              <MoreHorizontal size={15} aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            className={styles.weekNavBtn}
            aria-label="Previous week"
            onClick={() => setVisibleStart((current) => addDays(current, -7))}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className={styles.weekNavBtn}
            aria-label="Next week"
            onClick={() => setVisibleStart((current) => addDays(current, 7))}
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            className={styles.todayBtn}
            onClick={() => setVisibleStart(today)}
          >
            Today
          </button>

          <div className={styles.toolbarRight}>
            <select className={styles.viewSelect} aria-label="Calendar view" defaultValue="week">
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
        </div>

        <div className={styles.weekBoard}>
          {visibleDays.map((day, dayIndex) => {
            const dayBookings = bookingsByDay.get(dayIndex) ?? [];

            return (
              <div key={day.toISOString()} className={styles.dayColumn}>
                <div className={styles.dayHeader}>
                  {day.toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                  })}
                </div>

                <div className={styles.dayContent}>
                  {dayBookings.length === 0 ? <span className={styles.emptyDay} /> : null}
                  {dayBookings.map((booking, index) => (
                    <Link
                      key={booking.id}
                      href={getBookingDetailHref(booking.id)}
                      className={`${styles.bookingEvent} ${
                        booking.status === "confirmed"
                          ? styles.bookingEventConfirmed
                          : styles.bookingEventPending
                      }`}
                      style={{ marginTop: index === 0 ? 0 : 14 }}
                    >
                      <div className={styles.bookingMetaRow}>
                        <span className={styles.channelDot} aria-hidden="true" />
                        <span className={styles.bookingType}>{booking.specialty}</span>
                        <span className={styles.bookingTime}>{formatTime(booking)}</span>
                      </div>
                      <div className={styles.bookingThumb}>
                        <Image
                          src={booking.expert.image}
                          alt={booking.expert.name}
                          fill
                          className={styles.bookingImage}
                          sizes="180px"
                        />
                      </div>
                      <p className={styles.bookingName}>{booking.expert.name}</p>
                      <p className={styles.bookingSummary}>
                        {booking.status === "confirmed" ? "Confirmed session" : "Awaiting confirmation"}
                      </p>
                      <span
                        className={`${styles.statusBadge} ${
                          booking.status === "confirmed"
                            ? styles.statusBadgeConfirmed
                            : styles.statusBadgePending
                        }`}
                      >
                        {formatStatus(booking.status)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
