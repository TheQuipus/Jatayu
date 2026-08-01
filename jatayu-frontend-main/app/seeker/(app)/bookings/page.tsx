import type { Metadata } from "next";
import BookingsPageContent from "@/components/seeker/bookings/BookingsPageContent";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Bookings — Jatayu",
  description: "View and manage your upcoming expert sessions.",
};

export default function SeekerBookingsPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <BookingsPageContent />
      </div>
    </section>
  );
}
