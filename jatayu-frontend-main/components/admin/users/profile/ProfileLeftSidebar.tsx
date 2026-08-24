"use client";

import {
  Bell,
  BookOpen,
  Calendar,
  Edit3,
  HelpCircle,
  Settings,
  Wallet,
} from "lucide-react";
import styles from "./ProfileLeftSidebar.module.css";

type ProfileLeftSidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalSessionsCount: number;
};

export default function ProfileLeftSidebar({
  activeTab,
  setActiveTab,
  totalSessionsCount,
}: ProfileLeftSidebarProps) {
  return (
    <aside className={styles.sidebarLeft}>
      <div className={styles.navCard}>
        <div className={styles.navCardTitle}>My Account</div>
        <ul className={styles.navList}>
          <li>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "overview" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <span className={styles.navItemLeft}>
                <BookOpen size={16} /> Overview
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "edit" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("edit")}
            >
              <span className={styles.navItemLeft}>
                <Edit3 size={16} /> Edit Profile
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "activity" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("activity")}
            >
              <span className={styles.navItemLeft}>
                <Calendar size={16} /> Session History
              </span>
              <span className={styles.navBadge}>{totalSessionsCount}</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "payments" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("payments")}
            >
              <span className={styles.navItemLeft}>
                <Wallet size={16} /> Payments &amp; Invoices
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "notifications" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("notifications")}
            >
              <span className={styles.navItemLeft}>
                <Bell size={16} /> Notifications
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "settings" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <span className={styles.navItemLeft}>
                <Settings size={16} /> Preferences
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "help" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("help")}
            >
              <span className={styles.navItemLeft}>
                <HelpCircle size={16} /> Help &amp; Support
              </span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}
