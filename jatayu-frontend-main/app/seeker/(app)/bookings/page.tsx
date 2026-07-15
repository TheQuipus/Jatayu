import type { Metadata } from "next";
import BookingCalendar from "@/components/seeker/dashboard/BookingCalendar";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Bookings — Jatayu",
  description: "View and manage your upcoming expert sessions.",
};

export default function SeekerBookingsPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <BookingCalendar />
      </div>
    </section>
  );
}
