"use client";

import { Clock, Star, Video, Wallet } from "lucide-react";
import type { ExpertUser, SeekerUser } from "@/lib/adminUserManagement";
import type { AdminSeekerDetail } from "@/lib/adminSeekerApi";
import styles from "./ProfileKpiRow.module.css";

type ProfileKpiRowProps = {
  user: ExpertUser | SeekerUser;
  isExpert: boolean;
  totalSessionsCount: number;
  moneyValue: number;
  seekerMetrics?: AdminSeekerDetail["metrics"];
};

export default function ProfileKpiRow({
  user,
  isExpert,
  totalSessionsCount,
  moneyValue,
  seekerMetrics,
}: ProfileKpiRowProps) {
  const expertUser = isExpert ? (user as ExpertUser) : undefined;
  const fallbackCount = isExpert ? totalSessionsCount : 0;
  const videoCount = seekerMetrics?.consultationTypes.video ?? fallbackCount;
  const liveChatCount = seekerMetrics?.consultationTypes.text ?? 0;
  const audioCount = seekerMetrics?.consultationTypes.audio ?? 0;
  const messagingCount = seekerMetrics?.consultationTypes.shoutout ?? 0;
  const averageDuration = seekerMetrics?.avgSessionDurationMinutes ?? 0;

  return (
    <div className={styles.kpiRow}>
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{isExpert ? "Sessions Completed" : "Bookings Completed"}</span>
          <div className={styles.kpiIconBox}>
            <Video size={20} />
          </div>
        </div>
        <h3 className={styles.kpiValue}>{isExpert ? totalSessionsCount : (seekerMetrics?.completedBookings ?? totalSessionsCount)}</h3>
        <div className={styles.breakdownRow}>
          <span className={styles.breakdownItem}>
            <strong>{videoCount}</strong> Video Call
          </span>
          <span className={styles.breakdownItem}>
            <strong>{liveChatCount}</strong> Live Chat
          </span>
          <span className={styles.breakdownItem}>
            <strong>{audioCount}</strong> Audio Call
          </span>
          <span className={styles.breakdownItem}>
            <strong>{messagingCount}</strong> Messaging
          </span>
        </div>
      </div>

      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{isExpert ? "Hours Taught" : "Booked Hours"}</span>
          <div className={styles.kpiIconBox}>
            <Clock size={20} />
          </div>
        </div>
        <h3 className={styles.kpiValue}>{isExpert && expertUser ? `${expertUser.completedSessions * 0.75}h` : `${((seekerMetrics?.totalDurationMinutes || 0) / 60).toFixed(1)}h`}</h3>
        <div className={styles.kpiSubDetail}>{isExpert ? "Avg. 45 min/session" : (averageDuration ? `Avg. ${averageDuration} min/session` : "No completed sessions")}</div>
      </div>

      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{isExpert ? "Avg. Rating Received" : "Avg. Rating Given"}</span>
          <div className={styles.kpiIconBox}>
            <Star size={20} />
          </div>
        </div>
        <h3 className={styles.kpiValue}>{isExpert && expertUser ? expertUser.rating.toFixed(1) : seekerMetrics?.avgRatingGiven?.toFixed(1) || "—"}</h3>
        <div className={styles.kpiSubDetail}>
          From {isExpert && expertUser ? expertUser.reviewCount : seekerMetrics?.ratingCount || 0} reviews
        </div>
      </div>

      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{isExpert ? "Total Earnings" : "Total Spent"}</span>
          <div className={styles.kpiIconBox}>
            <Wallet size={20} />
          </div>
        </div>
        <h3 className={styles.kpiValue}>₹{moneyValue.toLocaleString("en-IN")}</h3>
        <div className={styles.kpiSubDetail}>
          {isExpert && expertUser ? `₹${expertUser.hourlyRate}/hr rate` : "Lifetime activity"}
        </div>
      </div>
    </div>
  );
}
