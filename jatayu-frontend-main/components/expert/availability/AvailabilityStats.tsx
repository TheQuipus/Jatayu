import { CalendarCheck, Clock3, TimerReset, TrendingUp } from "lucide-react";
import styles from "./ExpertAvailabilityPage.module.css";

const STATS = [
  { label: "Active schedule", value: "5 days", note: "Mon–Fri", icon: CalendarCheck },
  { label: "Weekly hours", value: "22 hrs", note: "+2 hrs this week", icon: Clock3 },
  { label: "Average response", value: "< 30m", note: "Top 12% of experts", icon: TimerReset },
  { label: "Booking rate", value: "87%", note: "+6% this month", icon: TrendingUp },
] as const;

export default function AvailabilityStats() {
  return (
    <section className={`${styles.statsGrid} ${styles.kpiRow}`} aria-label="Availability summary">
      {STATS.map(({ label, value, note, icon: Icon }) => (
        <article key={label} className={`${styles.statCard} ${styles.kpiCard}`}>
          <div className={`${styles.statHeader} ${styles.kpiHeader}`}>
            <span className={`${styles.statLabel} ${styles.kpiLabel}`}>{label}</span>
            <span className={`${styles.statIconBox} ${styles.kpiIconBox}`}>
              <Icon size={24} aria-hidden="true" />
            </span>
          </div>
          <div className={`${styles.statFooter} ${styles.kpiFooter}`}>
            <p className={`${styles.statValue} ${styles.kpiValue}`}>{value}</p>
            <small className={styles.statNote}>{note}</small>
          </div>
        </article>
      ))}
    </section>
  );
}
