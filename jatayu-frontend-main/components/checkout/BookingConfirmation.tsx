"use client";

import Link from "next/link";
import { ArrowRight, Calendar, ClipboardList, Mail } from "lucide-react";
import styles from "./BookingConfirmation.module.css";

type BookingConfirmationProps = {
  expertName: string;
  scheduleLabel: string;
  bookingId: string;
  email: string;
  calendarUrl: string;
};

export default function BookingConfirmation({
  expertName,
  scheduleLabel,
  bookingId,
  email,
  calendarUrl,
}: BookingConfirmationProps) {
  return (
    <div className={styles.confirmation}>
      <header className={styles.header}>
        <div className={styles.successIconWrap} role="img" aria-label="Booking confirmed">
          <span className={styles.successRing} aria-hidden="true" />
          <span className={styles.successRingSecondary} aria-hidden="true" />
          <svg className={styles.successSvg} viewBox="0 0 88 88" aria-hidden="true">
            <circle className={styles.successCircle} cx="44" cy="44" r="36" />
            <path className={styles.successCheckmark} d="M28 45.5 38.5 56 60 34.5" />
          </svg>
        </div>

        <h1 className={styles.title}>Booking Confirmed!</h1>
        <span className={styles.titleRule} aria-hidden="true" />

        <p className={styles.subtitle}>
          Your session with <strong>{expertName}</strong> is scheduled for
        </p>
        <p className={styles.schedule}>{scheduleLabel}</p>
      </header>

      <article className={styles.infoCard} aria-label="Booking details">
        <div className={styles.sectionDivider}>
          <span>Booking Details</span>
        </div>

        <div className={styles.infoRow}>
          <span className={`${styles.infoIconWrap} ${styles.infoIconDoc}`}>
            <ClipboardList size={18} aria-hidden="true" />
          </span>
          <div className={styles.infoCopy}>
            <span className={styles.infoLabel}>Booking ID</span>
            <span className={styles.infoValue}>#{bookingId}</span>
          </div>
        </div>

        <div className={styles.infoRow}>
          <span className={`${styles.infoIconWrap} ${styles.infoIconMail}`}>
            <Mail size={18} aria-hidden="true" />
          </span>
          <div className={styles.infoCopy}>
            <span className={styles.infoLabel}>Confirmation Email</span>
            <span className={styles.infoValue}>{email}</span>
          </div>
        </div>

        <div className={styles.infoRow}>
          <span className={`${styles.infoIconWrap} ${styles.infoIconCal}`}>
            <Calendar size={18} aria-hidden="true" />
          </span>
          <div className={styles.infoCopy}>
            <span className={styles.infoLabel}>Calendar</span>
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.calendarLink}
            >
              Add to Google Calendar
            </a>
          </div>
        </div>
      </article>

      <div className={styles.actions}>
        <Link href="/seeker/bookings/booking-1" className={styles.secondaryBtn}>
          View Booking
        </Link>
        <Link href="/seeker/discover" className={styles.primaryBtn}>
          <span className={styles.primaryBtnLabel}>
            <span className={styles.primaryBtnTrack}>
              <span>Explore More Experts</span>
              <span aria-hidden="true">Explore More Experts</span>
            </span>
          </span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
