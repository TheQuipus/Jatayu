import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReportForm from "./ReportForm";
import BookingDetailView from "@/components/seeker/bookings/BookingDetail";
import SeekerShell from "@/components/seeker/SeekerShell";
import { getBookingById, BOOKING_DETAILS } from "@/lib/seekerDashboard";
import styles from "./page.module.css";

type ReportPageProps = {
  params: Promise<{ bookingId: string }>;
};

export function generateStaticParams() {
  return BOOKING_DETAILS.map((booking) => ({
    bookingId: booking.id,
  }));
}

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { bookingId } = await params;
  const booking = getBookingById(bookingId);

  if (!booking) {
    return { title: "Report Expert — Jatayu" };
  }

  return {
    title: `Report ${booking.expert.name} — Jatayu`,
    description: `File a report regarding your session with expert ${booking.expert.name}.`,
  };
}

export default async function SeekerReportPage({ params }: ReportPageProps) {
  const { bookingId } = await params;
  const booking = getBookingById(bookingId);

  if (!booking) {
    notFound();
  }

  return (
    <SeekerShell>
      <div style={{ position: "relative" }}>
        <Suspense fallback={null}>
          <BookingDetailView booking={booking} />
        </Suspense>
        <div className={styles.page}>
          <ReportForm booking={booking} />
        </div>
      </div>
    </SeekerShell>
  );
}
