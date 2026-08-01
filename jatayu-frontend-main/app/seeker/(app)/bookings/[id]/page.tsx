import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookingDetailView from "@/components/seeker/bookings/BookingDetail";
import { BOOKING_DETAILS, getBookingById } from "@/lib/seekerDashboard";
import styles from "./page.module.css";

type BookingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return BOOKING_DETAILS.map((booking) => ({
    id: booking.id,
  }));
}

export async function generateMetadata({ params }: BookingDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const booking = getBookingById(id);

  if (!booking) {
    return { title: "Booking — Jatayu" };
  }

  return {
    title: `${booking.referenceId} — Bookings — Jatayu`,
    description: `Booking details for your ${booking.consultationLabel} with ${booking.expert.name}.`,
  };
}

export default async function SeekerBookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = await params;
  const booking = getBookingById(id);

  if (!booking) {
    notFound();
  }

  return (
    <div className={styles.page}>
      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--scorpion)' }}>Loading session details...</div>}>
        <BookingDetailView booking={booking} />
      </Suspense>
    </div>
  );
}
