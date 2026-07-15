import ExpertProfileEditor from "@/components/expert/profile/ExpertProfileEditor";
import styles from "./ExpertProfilePage.module.css";

export default function ExpertProfilePage() {
  return (
    <section className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            Your <span className={styles.accentWord}>Profile</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Edit how you appear to seekers — same fields as onboarding.
          </p>
        </header>

        <ExpertProfileEditor />
      </div>
    </section>
  );
}
