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

  const textCount = Math.floor(totalSessionsCount * 0.4);
  const videoCount = Math.floor(totalSessionsCount * 0.35);
  const callCount = Math.max(0, totalSessionsCount - textCount - videoCount);

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
            <strong>{textCount}</strong> Text
          </span>
          <span className={styles.breakdownSep}>·</span>
          <span className={styles.breakdownItem}>
            <strong>{videoCount}</strong> Video
          </span>
          <span className={styles.breakdownSep}>·</span>
          <span className={styles.breakdownItem}>
            <strong>{callCount}</strong> Call
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
