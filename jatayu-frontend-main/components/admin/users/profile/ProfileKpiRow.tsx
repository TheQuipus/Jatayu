"use client";

import { Clock, Star, Video, Wallet } from "lucide-react";
import type { ExpertUser, SeekerUser } from "@/lib/adminUserManagement";
import styles from "./ProfileKpiRow.module.css";

type ProfileKpiRowProps = {
  user: ExpertUser | SeekerUser;
  isExpert: boolean;
  totalSessionsCount: number;
  moneyValue: number;
};

export default function ProfileKpiRow({
  user,
  isExpert,
  totalSessionsCount,
  moneyValue,
}: ProfileKpiRowProps) {
  const expertUser = isExpert ? (user as ExpertUser) : undefined;

  const videoCount = Math.floor(totalSessionsCount * 0.5);
  const liveChatCount = Math.floor(totalSessionsCount * 0.25);
  const audioCount = Math.floor(totalSessionsCount * 0.15);
  const messagingCount = Math.max(0, totalSessionsCount - videoCount - liveChatCount - audioCount);

  return (
    <div className={styles.kpiRow}>
      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{isExpert ? "Sessions Completed" : "Bookings Completed"}</span>
          <div className={styles.kpiIconBox}>
            <Video size={20} />
          </div>
        </div>
        <h3 className={styles.kpiValue}>{totalSessionsCount}</h3>
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
        <h3 className={styles.kpiValue}>{isExpert && expertUser ? `${expertUser.completedSessions * 0.75}h` : "18.5h"}</h3>
        <div className={styles.kpiSubDetail}>Avg. 45 min/session</div>
      </div>

      <div className={styles.kpiCard}>
        <div className={styles.kpiHeader}>
          <span className={styles.kpiLabel}>{isExpert ? "Avg. Rating Received" : "Avg. Rating Given"}</span>
          <div className={styles.kpiIconBox}>
            <Star size={20} />
          </div>
        </div>
        <h3 className={styles.kpiValue}>{isExpert && expertUser ? expertUser.rating.toFixed(1) : "4.8"}</h3>
        <div className={styles.kpiSubDetail}>
          From {isExpert && expertUser ? expertUser.reviewCount : "19"} reviews
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
