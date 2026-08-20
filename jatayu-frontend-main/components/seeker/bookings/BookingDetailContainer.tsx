"use client";

import { useEffect, useState } from "react";
import type { BookingDetail } from "@/lib/seekerDashboard";
import { getSeekerBookingDetailApi } from "@/lib/seekerBookingApi";
import BookingDetailView from "./BookingDetail";

type BookingDetailContainerProps = {
  bookingId: string;
  initialBooking?: BookingDetail;
};

export default function BookingDetailContainer({
  bookingId,
  initialBooking,
}: BookingDetailContainerProps) {
  const [booking, setBooking] = useState<BookingDetail | undefined>(initialBooking);
  const [loading, setLoading] = useState<boolean>(!initialBooking);

  useEffect(() => {
    let isSubscribed = true;
    getSeekerBookingDetailApi(bookingId)
      .then((data) => {
        if (isSubscribed && data) {
          setBooking(data);
          setLoading(false);
        } else if (isSubscribed) {
          setLoading(false);
        }
      })
      .catch(() => {
        if (isSubscribed) setLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [bookingId]);

  if (loading && !booking) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--scorpion)", fontFamily: "var(--font-body)" }}>
        Loading session details...
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--pomegranate)", fontFamily: "var(--font-body)" }}>
        Booking details not found or unavailable.
      </div>
    );
  }

  return <BookingDetailView booking={booking} />;
}
