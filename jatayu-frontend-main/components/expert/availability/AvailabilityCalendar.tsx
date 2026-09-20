"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Clock3, Video } from "lucide-react";
import { getExpertRequests } from "@/lib/api";
import type { ClientRequest } from "@/lib/expertRequests";
import styles from "./ExpertAvailabilityPage.module.css";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function requestDate(request: ClientRequest) {
  if (!request.scheduledStartAt) return null;
  const date = new Date(request.scheduledStartAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function requestEndDate(request: ClientRequest) {
  if (!request.scheduledEndAt) return null;
  const date = new Date(request.scheduledEndAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatSessionTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function AvailabilityCalendar() {
  const [today] = useState(() => new Date());
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [sessions, setSessions] = useState<ClientRequest[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    void getExpertRequests({ status: "accepted", page: 1, limit: 100, sort: "oldest" })
      .then((response) => {
        if (active) setSessions(response.requests);
      })
      .catch(() => {
        if (active) setSessionsError("Unable to load scheduled sessions.");
      })
      .finally(() => {
        if (active) setSessionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const view = useMemo(() => {
    const date = new Date(today);
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
  }, [monthOffset, today]);

  const bookedDates = useMemo(() => new Set(
    sessions.map(requestDate).filter((date): date is Date => Boolean(date)).map(dateKey),
  ), [sessions]);

  const selectedDateKey = dateKey(selectedDate);
  const selectedSessions = useMemo(() => sessions
    .filter((request) => {
      const start = requestDate(request);
      return start && dateKey(start) === selectedDateKey;
    })
    .sort((left, right) => (requestDate(left)?.getTime() || 0) - (requestDate(right)?.getTime() || 0)),
  [selectedDateKey, sessions]);

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
          const calendarDate = new Date(view.year, view.month, day);
          const calendarDateKey = dateKey(calendarDate);
          const hasSession = bookedDates.has(calendarDateKey);
          const isBlocked = [2, 18].includes(day);
          const isSelected = selectedDateKey === calendarDateKey;

          return (
            <button
              key={day}
              type="button"
              className={`${styles.calendarDay} ${isSelected ? styles.selectedDay : ""} ${
                hasSession ? styles.hasSession : ""
              } ${isBlocked ? styles.isBlocked : ""}`}
              onClick={() => setSelectedDate(calendarDate)}
              aria-label={`${calendarDate.toLocaleDateString()}${hasSession ? ", booked session" : ""}`}
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

      <div className={styles.selectedDaySessions}>
        <div className={styles.selectedDaySessionsHeader}>
          <div>
            <h3>Sessions</h3>
            <p>{selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</p>
          </div>
          <span>{selectedSessions.length}</span>
        </div>

        {sessionsLoading ? (
          <p className={styles.sessionEmpty}>Loading sessions…</p>
        ) : sessionsError ? (
          <p className={styles.sessionError}>{sessionsError}</p>
        ) : selectedSessions.length === 0 ? (
          <p className={styles.sessionEmpty}>No active or scheduled sessions for this day.</p>
        ) : (
          <div className={styles.selectedSessionList}>
            {selectedSessions.map((session) => {
              const start = requestDate(session)!;
              const end = requestEndDate(session);
              const isActive = start.getTime() <= currentTime && Boolean(end && end.getTime() > currentTime);
              return (
                <article key={session.id} className={styles.selectedSessionCard}>
                  <div className={styles.selectedSessionTopline}>
                    <span className={isActive ? styles.sessionStatusActive : styles.sessionStatusScheduled}>
                      {isActive ? "Active" : "Scheduled"}
                    </span>
                    <span className={styles.selectedSessionTime}>
                      <Clock3 size={11} />
                      {formatSessionTime(start)}{end ? ` – ${formatSessionTime(end)}` : ""}
                    </span>
                  </div>
                  <strong>{session.clientName}</strong>
                  <p>{session.title}</p>
                  <div className={styles.selectedSessionFooter}>
                    <span><Video size={11} /> {session.formatLabel}</span>
                    <Link href={`/expert/requests/${session.id}/`} aria-label={`View session with ${session.clientName}`}>
                      View <ArrowUpRight size={12} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
