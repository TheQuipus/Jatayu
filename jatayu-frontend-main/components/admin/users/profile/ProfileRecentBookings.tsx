"use client";

import Link from "next/link";
import styles from "./ProfileRecentBookings.module.css";

type ProfileRecentBookingsProps = {
  isExpert: boolean;
  setActiveTab?: (tab: string) => void;
  onSelectBooking?: (id: string | null) => void;
};

const RECENT_SESSIONS = [
  {
    id: "booking-1",
    topic: "Kundali & Career Consultation",
    person: "Meera Nair",
    dateTime: "20 Aug 2026, 4:00 PM",
    duration: "45 mins",
    status: "Completed",
    amount: "₹1,500",
  },
  {
    id: "booking-2",
    topic: "Commercial Vastu Analysis",
    person: "Aarav Gupta",
    dateTime: "18 Aug 2026, 11:30 AM",
    duration: "60 mins",
    status: "Completed",
    amount: "₹2,200",
  },
  {
    id: "booking-3",
    topic: "Tarot Reading & Guidance",
    person: "Rohan Verma",
    dateTime: "12 Aug 2026, 2:15 PM",
    duration: "30 mins",
    status: "Completed",
    amount: "₹900",
  },
];

export default function ProfileRecentBookings({
  isExpert,
  setActiveTab,
  onSelectBooking,
}: ProfileRecentBookingsProps) {
  const handleOpenBooking = (bookingId: string) => {
    if (onSelectBooking) {
      onSelectBooking(bookingId);
    }
    if (setActiveTab) {
      setActiveTab("activity");
    }
  };

  return (
    <div className={styles.activityCard}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Recent Session History</h3>
        {setActiveTab ? (
          <button
            type="button"
            onClick={() => {
              if (onSelectBooking) onSelectBooking(null);
              setActiveTab("activity");
            }}
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
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {RECENT_SESSIONS.map((session) => (
            <tr
              key={session.id}
              onClick={() => handleOpenBooking(session.id)}
              style={{ cursor: "pointer" }}
            >
              <td style={{ fontWeight: 600 }}>{session.topic}</td>
              <td>{session.person}</td>
              <td style={{ color: "var(--dove-gray)" }}>{session.dateTime}</td>
              <td>{session.duration}</td>
              <td><span className={styles.tagVerified}>{session.status}</span></td>
              <td style={{ fontWeight: 600 }}>{session.amount}</td>
              <td>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenBooking(session.id);
                  }}
                  style={{
                    background: "var(--gallery)",
                    border: "1px solid var(--mercury)",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--ink)",
                    cursor: "pointer",
                  }}
                >
                  View Details →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
