import styles from "./ExpertAvailabilityPage.module.css";

export default function AvailabilityHeader() {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderText}>
        <div className={styles.eyebrow}>
          <span className={styles.livePulseDot} />
          <span>Expert Schedule Matrix // Availability</span>
        </div>
        <h1 className={styles.pageTitle}>
          Availability &amp; <span className={styles.accentWord}>Calendar</span>
        </h1>
        <p className={styles.pageSubtitle}>
          Configure your weekly working hours, manage date exceptions, and set custom booking parameters.
        </p>
      </div>
      <div className={styles.titleRule} aria-hidden="true" />
    </header>
  );
}
