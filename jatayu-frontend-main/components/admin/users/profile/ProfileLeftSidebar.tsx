"use client";

import {
  Ban,
  Bell,
  BookOpen,
  Calendar,
  Edit3,
  HelpCircle,
  LineChart,
  Settings,
  UserCheck,
  Wallet,
} from "lucide-react";
import styles from "./ProfileLeftSidebar.module.css";

type ProfileLeftSidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalSessionsCount: number;
  isExpert?: boolean;
  status?: string;
  handleToggleStatus?: () => void;
};

export default function ProfileLeftSidebar({
  activeTab,
  setActiveTab,
  totalSessionsCount,
  isExpert = false,
  status,
  handleToggleStatus,
}: ProfileLeftSidebarProps) {
  return (
    <aside className={styles.sidebarLeft}>
      <div className={styles.navCard}>
        <div className={styles.navCardTitle}>{isExpert ? "Expert Profile Overview" : "Seeker Profile Overview"}</div>
        <ul className={styles.navList}>
          <li>
            <button
              type="button"
              data-navvalue="/overview"
              data-value="/overview"
              value="/overview"
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
              data-navvalue="/profile-management"
              data-value="/profile-management"
              value="/profile-management"
              className={`${styles.navItem} ${activeTab === "edit" || activeTab === "profile-management" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("edit")}
            >
              <span className={styles.navItemLeft}>
                <UserCheck size={16} /> Profile Management
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              data-navvalue="/session-history"
              data-value="/session-history"
              value="/session-history"
              className={`${styles.navItem} ${activeTab === "activity" || activeTab === "bookings" || activeTab === "session-history" ? styles.navItemActive : ""}`}
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
              data-navvalue="/wallet-credits"
              data-value="/wallet-credits"
              value="/wallet-credits"
              className={`${styles.navItem} ${activeTab === "payments" || activeTab === "wallet" || activeTab === "wallet-credits" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("payments")}
            >
              <span className={styles.navItemLeft}>
                <Wallet size={16} /> Wallet &amp; Credits
              </span>
            </button>
          </li>
          {!isExpert && (
            <li>
              <button
                type="button"
                data-navvalue="/financial-insights"
                data-value="/financial-insights"
                value="/financial-insights"
                className={`${styles.navItem} ${activeTab === "insights" || activeTab === "financial-insights" ? styles.navItemActive : ""}`}
                onClick={() => setActiveTab("insights")}
              >
                <span className={styles.navItemLeft}>
                  <LineChart size={16} /> Financial Insights
                </span>
              </button>
            </li>
          )}
          <li>
            <button
              type="button"
              data-navvalue="/notifications"
              data-value="/notifications"
              value="/notifications"
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
              data-navvalue="/settings"
              data-value="/settings"
              value="/settings"
              className={`${styles.navItem} ${activeTab === "settings" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <span className={styles.navItemLeft}>
                <Settings size={16} /> Settings
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              data-navvalue="/help-support"
              data-value="/help-support"
              value="/help-support"
              className={`${styles.navItem} ${activeTab === "help" || activeTab === "help-support" ? styles.navItemActive : ""}`}
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
