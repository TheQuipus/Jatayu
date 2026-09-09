"use client";

import AvailabilityHeader from "./AvailabilityHeader";
import WeeklySchedulePanel from "./WeeklySchedulePanel";
import AvailabilityCalendar from "./AvailabilityCalendar";
import AvailabilityExceptions from "./AvailabilityExceptions";
import BookingPreferences from "./BookingPreferences";
import styles from "./ExpertAvailabilityPage.module.css";

export default function ExpertAvailabilityPage() {
  return (
    <section className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <AvailabilityHeader />

        <div className={styles.dashboardGrid}>
          <div className={styles.mainColumn}>
            <WeeklySchedulePanel />
            <AvailabilityExceptions />
            <BookingPreferences />
          </div>

          <aside className={styles.sideColumn}>
            <AvailabilityCalendar />
          </aside>
        </div>
      </div>
    </section>
  );
}
