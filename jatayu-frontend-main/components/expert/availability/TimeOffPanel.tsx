import { CalendarX2, Gift, Plus } from "lucide-react";
import styles from "./ExpertAvailabilityPage.module.css";

export default function TimeOffPanel() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.sectionIndex}>03</span>
          <h2>Time off &amp; holidays</h2>
          <p>Schedule longer personal breaks, leaves, or national holidays without modifying your weekly template.</p>
        </div>
        <button type="button" className={styles.outlineButton}>
          <span>View calendar</span>
        </button>
      </div>

      <div className={styles.timeOffList}>
        <article className={styles.timeOffCard}>
          <span className={styles.timeOffIcon}>
            <CalendarX2 size={16} />
          </span>
          <div className={styles.timeOffDetails}>
            <strong className={styles.timeOffTitle}>Winter Holiday Break</strong>
            <span className={styles.timeOffDate}>24–26 December · Full Day</span>
          </div>
          <span className={`${styles.statusBadge} ${styles.status_upcoming}`}>Upcoming</span>
        </article>

        <article className={styles.timeOffCard}>
          <span className={`${styles.timeOffIcon} ${styles.iconGift}`}>
            <Gift size={16} />
          </span>
          <div className={styles.timeOffDetails}>
            <strong className={styles.timeOffTitle}>Personal Recharge Day</strong>
            <span className={styles.timeOffDate}>8 January · Full Day</span>
          </div>
          <span className={`${styles.statusBadge} ${styles.status_planned}`}>Planned</span>
        </article>
      </div>

      <div className={styles.timeOffFooter}>
        <button type="button" className={styles.addTimeOff}>
          <Plus size={14} />
          <span>Add time off period</span>
        </button>
      </div>
    </section>
  );
}
