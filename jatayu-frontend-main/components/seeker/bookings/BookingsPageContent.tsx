"use client";

import { useState } from "react";
import BookingCalendar from "@/components/seeker/bookings/BookingCalendar";
import BookingHistory from "@/components/seeker/bookings/BookingHistory";
import styles from "./BookingsPageContent.module.css";

export default function BookingsPageContent() {
  const [activeTab, setActiveTab] = useState<"calendar" | "history">("calendar");

  return (
    <div className={styles.container}>
      <div className={styles.tabHeader}>
        <div className={styles.tabGroup} role="tablist" aria-label="Bookings navigation">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "calendar"}
            className={`${styles.tabBtn} ${activeTab === "calendar" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("calendar")}
          >
            Schedule
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "history"}
            className={`${styles.tabBtn} ${activeTab === "history" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Booking History
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === "calendar" ? (
          <BookingCalendar />
        ) : (
          <BookingHistory />
        )}
      </div>
    </div>
  );
}
