"use client";

import { LogOut } from "lucide-react";
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
            <button
              onClick={() => window.location.assign("/login")}
              className={styles.logoutBtn}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
          <p className={styles.pageSubtitle}>
            Edit how you appear to seekers — same fields as onboarding.
          </p>
        </header>

        <ExpertProfileEditor />
      </div>
    </section>
  );
}
