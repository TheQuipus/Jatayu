import ExpertProfileEditor from "@/components/expert/profile/ExpertProfileEditor";
import styles from "./ExpertProfilePage.module.css";

export default function ExpertProfilePage() {
  return (
    <section className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <header className={styles.pageHeader}>
          <div className={styles.headerTop}>
            <h1 className={styles.pageTitle}>
              Your <span className={styles.accentWord}>Profile</span>
            </h1>
          </div>
          <p className={styles.pageSubtitle}>
            Complete view of your expert onboarding application, consultation settings, credentials, and public presence.
          </p>
        </header>

        <ExpertProfileEditor />
      </div>
    </section>
  );
}
