"use client";

import Link from "next/link";
import styles from "./ProfileRecentBookings.module.css";

type ProfileRecentBookingsProps = {
  isExpert: boolean;
  setActiveTab?: (tab: string) => void;
};

export default function ProfileRecentBookings({ isExpert, setActiveTab }: ProfileRecentBookingsProps) {
  return (
    <div className={styles.activityCard}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Recent Session History</h3>
        {setActiveTab ? (
          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            style={{ background: "none", border: "none", padding: 0, fontSize: "13px", fontWeight: 600, color: "var(--tango)", cursor: "pointer" }}
          >
            View all →
          </button>
        ) : (
          <Link href="#" style={{ fontSize: "13px", fontWeight: 600, color: "var(--tango)", textDecoration: "none" }}>
            View all →
          </Link>
        )}
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Session Topic</th>
            <th>{isExpert ? "Client / Seeker" : "Expert Consultant"}</th>
            <th>Date &amp; Time</th>
            <th>Duration</th>
            <th>Status</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ fontWeight: 600 }}>Kundali &amp; Career Consultation</td>
            <td>Meera Nair</td>
            <td style={{ color: "var(--dove-gray)" }}>20 Aug 2026, 4:00 PM</td>
            <td>45 mins</td>
            <td><span className={styles.tagVerified}>Completed</span></td>
            <td style={{ fontWeight: 600 }}>₹1,500</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600 }}>Commercial Vastu Analysis</td>
            <td>Aarav Gupta</td>
            <td style={{ color: "var(--dove-gray)" }}>18 Aug 2026, 11:30 AM</td>
            <td>60 mins</td>
            <td><span className={styles.tagVerified}>Completed</span></td>
            <td style={{ fontWeight: 600 }}>₹2,200</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600 }}>Tarot Reading &amp; Guidance</td>
            <td>Rohan Verma</td>
            <td style={{ color: "var(--dove-gray)" }}>12 Aug 2026, 2:15 PM</td>
            <td>30 mins</td>
            <td><span className={styles.tagVerified}>Completed</span></td>
            <td style={{ fontWeight: 600 }}>₹900</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
