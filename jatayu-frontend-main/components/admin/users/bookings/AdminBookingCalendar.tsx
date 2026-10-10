"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Video,
  Clapperboard,
  Users,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import type { ConsultationType } from "@/lib/booking";
import type { Expert } from "@/lib/experts";
import {
  UPCOMING_BOOKINGS,
  getBookingById,
  type BookingDetail,
  type CalendarBooking,
} from "@/lib/seekerDashboard";
import type { ExpertUser, SeekerUser } from "@/lib/adminUserManagement";
import type { AdminSeekerBooking } from "@/lib/adminSeekerApi";
import AdminBookingDetailInfo from "./AdminBookingDetailInfo";
import styles from "./AdminBookingCalendar.module.css";

const CONSULTATION_ICONS: Record<ConsultationType, typeof MessageSquare> = {
  text: MessageSquare,
  video: Video,
  shoutout: Clapperboard,
  group: Users,
};

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getStartOfWeek(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  let day = next.getDay() - 1; // Mon = 0 ... Sun = 6
  if (day < 0) day = 6;
  next.setDate(next.getDate() - day);
  return next;
}

function formatTimeRange(booking: CalendarBooking): string {
  const start = new Date();
  start.setHours(booking.startHour, booking.startMinute, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + booking.durationMinutes);

  const format = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase();

  return `${format(start)} - ${format(end)}`;
}

function formatRangeLabel(days: Date[]): string {
  if (!days || days.length === 0) return "";
  const first = days[0];
  const last = days[days.length - 1];
  const month = first.toLocaleDateString("en-IN", { month: "short" });
  const endMonth = last.toLocaleDateString("en-IN", { month: "short" });

  const firstDayStr = String(first.getDate()).padStart(2, "0");
  const lastDayStr = String(last.getDate()).padStart(2, "0");

  if (month === endMonth) {
    return `${month} ${firstDayStr} - ${lastDayStr}, ${first.getFullYear()}`;
  }

  return `${month} ${firstDayStr} - ${endMonth} ${lastDayStr}, ${first.getFullYear()}`;
}

type StatusFilter = "all" | "confirmed" | "pending" | "completed" | "cancelled";

function toBookingDetail(booking: AdminSeekerBooking): BookingDetail {
  const start = new Date(booking.scheduledStartAt);
  const end = new Date(booking.scheduledEndAt);
  const durationMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const status = booking.status === "awaiting_expert" ? "pending" : booking.status === "declined" ? "cancelled" : booking.status;
  const consultationType = booking.consultationType as ConsultationType;
  return {
    id: booking.id,
    expert: { id: booking.expertId, name: booking.expertName, price: 0, image: booking.expertProfilePhotoSrc || "/assets/img/manportrait.png", desc: booking.expertProfessionalTitle || "Expert consultant", category: "", role: booking.expertProfessionalTitle || "Expert", rating: 0, reviewsCount: 0, sessionsCompleted: 0, languages: [], location: "", replyTime: "Not available", bio: "", topics: [] } as unknown as Expert,
    specialty: booking.expertProfessionalTitle || "Consultation",
    dayOffset: Math.round((startOfDay(start).getTime() - startOfDay(new Date()).getTime()) / 86400000),
    startHour: start.getHours(), startMinute: start.getMinutes(), durationMinutes,
    status: (["confirmed", "pending", "cancelled", "completed"].includes(status) ? status : "pending") as CalendarBooking["status"],
    referenceId: booking.id, consultationType, consultationLabel: consultationType.replace(/_/g, " "),
    placedOnLabel: new Date(booking.createdAt).toLocaleDateString("en-IN"),
    scheduledDateLabel: start.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    scheduledTimeLabel: start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    durationLabel: durationMinutes + " mins", paymentStatus: ["paid", "paid_with_credits"].includes(booking.paymentStatus) ? "paid" : "pending",
    consultationFee: booking.consultationFee, platformFee: booking.platformFee, gst: booking.gst, walletApplied: booking.creditsUsed, totalPaid: booking.amount, invoiceId: booking.id, calendarUrl: "", subject: booking.subject, context: booking.context, attachments: [], placedDaysAgo: Math.max(0, Math.floor((Date.now() - new Date(booking.createdAt).getTime()) / 86400000)), cancellationReason: booking.status === "declined" ? "Declined by expert" : undefined,
  };
}

type AdminBookingCalendarProps = {
  className?: string;
  selectedBookingId?: string | null;
  onSelectBooking?: (id: string | null) => void;
  user?: ExpertUser | SeekerUser;
  isExpert?: boolean;
  bookings?: AdminSeekerBooking[];
};

export default function AdminBookingCalendar({
  className = "",
  selectedBookingId,
  onSelectBooking,
  user,
  isExpert = false,
  bookings,
}: AdminBookingCalendarProps) {
  const router = useRouter();
  const [internalSelectedBookingId, setInternalSelectedBookingId] = useState<string | null>(null);

  const activeBookingId = selectedBookingId !== undefined ? selectedBookingId : internalSelectedBookingId;

  const handleSelectBooking = (id: string | null) => {
    if (onSelectBooking) {
      onSelectBooking(id);
    } else {
      setInternalSelectedBookingId(id);
    }
  };

  const today = useMemo(() => {
    return startOfDay(new Date());
  }, []);

  const [pageStart, setPageStart] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const allBookings = useMemo(() => {
    if (!bookings) return UPCOMING_BOOKINGS;
    return bookings.map((booking) => {
      const start = new Date(booking.scheduledStartAt);
      const end = new Date(booking.scheduledEndAt);
      const dayOffset = Math.round((startOfDay(start).getTime() - today.getTime()) / 86400000);
      const normalizedStatus = booking.status === "awaiting_expert" ? "pending" : booking.status === "declined" ? "cancelled" : booking.status;
      return {
        id: booking.id,
        expert: { id: booking.expertId, name: booking.expertName, image: booking.expertProfilePhotoSrc || "/assets/img/manportrait.png" } as unknown as Expert,
        specialty: booking.subject,
        dayOffset,
        startHour: start.getHours(),
        startMinute: start.getMinutes(),
        durationMinutes: Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)),
        status: (["confirmed", "pending", "cancelled", "completed"].includes(normalizedStatus) ? normalizedStatus : "pending") as CalendarBooking["status"],
        consultationType: booking.consultationType,
        scheduledStartAt: booking.scheduledStartAt,
        scheduledEndAt: booking.scheduledEndAt,
      };
    });
  }, [bookings, today]);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return allBookings;
    return allBookings.filter((b) => b.status === statusFilter);
  }, [allBookings, statusFilter]);

  const allBookingOffsets = useMemo(() => {
    const offsetsWithBookings = Array.from(
      new Set(filteredBookings.map((b) => b.dayOffset))
    ).sort((a, b) => a - b);

    if (!offsetsWithBookings.includes(0)) {
      offsetsWithBookings.unshift(0);
    }

    let lastOffset = offsetsWithBookings[offsetsWithBookings.length - 1] ?? 0;
    while (offsetsWithBookings.length < 7) {
      lastOffset += 1;
      offsetsWithBookings.push(lastOffset);
    }

    return offsetsWithBookings;
  }, [filteredBookings]);

  const visibleDays = useMemo(() => {
    const currentBatch = allBookingOffsets.slice(pageStart, pageStart + 7);
    return currentBatch.map((offset) => addDays(today, offset));
  }, [today, allBookingOffsets, pageStart]);

  const hasFarawayBooking = useMemo(() => {
    return allBookingOffsets.length > pageStart + 7;
  }, [allBookingOffsets, pageStart]);

  const bookingsByDay = useMemo(() => {
    const map = new Map<number, CalendarBooking[]>();

    visibleDays.forEach((day, index) => {
      const dayBookings = filteredBookings.filter((booking) => {
        const bookingDate = addDays(today, booking.dayOffset);
        return isSameDay(bookingDate, day);
      });

      dayBookings.sort((a, b) => {
        const timeA = a.startHour * 60 + a.startMinute;
        const timeB = b.startHour * 60 + b.startMinute;
        return timeA - timeB;
      });

      map.set(index, dayBookings);
    });

    return map;
  }, [today, filteredBookings, visibleDays]);

  // If a booking is selected, render the Session Detail view directly inside Admin Panel
  if (activeBookingId) {
    const storedBooking = bookings?.find((item) => item.id === activeBookingId);
    const bookingDetail = storedBooking ? toBookingDetail(storedBooking) : bookings ? undefined : getBookingById(activeBookingId);
    if (bookingDetail) {
      return (
        <div className={`${styles.calendarWrapper} ${className}`.trim()}>
          <AdminBookingDetailInfo
            booking={bookingDetail}
            sessionState={bookingDetail.status === "completed" ? "completed" : "detail"}
            onJoinSession={() => alert("Admin Monitoring: Session room")}
            onSubmitReview={() => {}}
            submittedReview={null}
            notes=""
            isAdmin={true}
            onBack={() => handleSelectBooking(null)}
            user={user}
            isExpert={isExpert}
          />
        </div>
      );
    }
  }

  // KPI Stats
  const totalCount = allBookings.length;
  const confirmedCount = allBookings.filter((b) => b.status === "confirmed").length;
  const pendingCount = allBookings.filter((b) => b.status === "pending").length;
  const completedCount = allBookings.filter((b) => b.status === "completed").length;
  const cancelledCount = allBookings.filter((b) => b.status === "cancelled").length;

  return (
    <div className={`${styles.calendarWrapper} ${className}`.trim()}>
      {/* 1. Page Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2 className={styles.pageTitle}>User Booking History</h2>
          <p className={styles.pageSubtitle}>
            Calendar view of all scheduled, pending, completed, and cancelled consultation sessions
          </p>
        </div>
      </div>

      {/* 2. Stats KPI Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563eb" }}>
            <CalendarIcon size={20} />
          </div>
          <div>
            <div className={styles.statVal}>{totalCount}</div>
            <div className={styles.statLabel}>Total Bookings</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(34, 197, 94, 0.1)", color: "#16a34a" }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className={styles.statVal}>{confirmedCount}</div>
            <div className={styles.statLabel}>Confirmed</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(249, 115, 22, 0.1)", color: "#ea580c" }}>
            <Clock size={20} />
          </div>
          <div>
            <div className={styles.statVal}>{pendingCount}</div>
            <div className={styles.statLabel}>Pending</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#dc2626" }}>
            <XCircle size={20} />
          </div>
          <div>
            <div className={styles.statVal}>{cancelledCount}</div>
            <div className={styles.statLabel}>Cancelled</div>
          </div>
        </div>
      </div>



      {/* 4. Calendar Week Grid */}
      <div className={styles.calendarShell}>
        <div className={styles.weekBoard}>
          {visibleDays.map((day, dayIndex) => {
            const dayBookings = bookingsByDay.get(dayIndex) ?? [];
            const isToday = isSameDay(day, today);

            return (
              <div key={day.toISOString()} className={styles.dayColumn}>
                <div className={`${styles.dayHeader} ${isToday ? styles.dayHeaderToday : ""}`}>
                  {dayIndex === 0 && pageStart > 0 && (
                    <button
                      type="button"
                      className={styles.rowStartArrowBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPageStart((prev) => Math.max(0, prev - 7));
                      }}
                      title="View previous booking dates"
                      aria-label="View previous booking dates"
                    >
                      <ChevronLeft size={13} />
                    </button>
                  )}
                  <span>
                    {isToday
                      ? "Today"
                      : day.toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          weekday: "short",
                        })}
                  </span>
                  {dayIndex === 6 && hasFarawayBooking && (
                    <button
                      type="button"
                      className={styles.rowEndArrowBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPageStart((prev) => prev + 7);
                      }}
                      title="View next booking dates"
                      aria-label="View next booking dates"
                    >
                      <ChevronRight size={13} />
                    </button>
                  )}
                </div>

                <div className={styles.dayContent}>
                  {dayBookings.length === 0 ? null : (
                    dayBookings.map((booking) => {
                      const consultationType: ConsultationType =
                        (("consultationType" in booking ? booking.consultationType : undefined) || "text") as ConsultationType;
                      const IconComp = CONSULTATION_ICONS[consultationType] || MessageSquare;

                      let cardClass = styles.bookingCardConfirmed;
                      let badgeClass = styles.badgeConfirmed;
                      let statusText = "Accepted";

                      if (booking.status === "pending") {
                        cardClass = styles.bookingCardPending;
                        badgeClass = styles.badgePending;
                        statusText = "Pending";
                      } else if (booking.status === "cancelled") {
                        cardClass = styles.bookingCardCancelled;
                        badgeClass = styles.badgeCancelled;
                        statusText = "Cancelled";
                      } else if (booking.status === "completed") {
                        cardClass = styles.bookingCardCompleted;
                        badgeClass = styles.badgeCompleted;
                        statusText = "Completed";
                      }

                      return (
                        <div
                          key={booking.id}
                          className={`${styles.bookingCard} ${cardClass}`}
                          onClick={() => handleSelectBooking(booking.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className={styles.bookingMetaRow}>
                            <div className={styles.metaRowTop}>
                              <div className={styles.consultationTag}>
                                <IconComp size={13} className={styles.consultationIcon} />
                                <span className={styles.consultationLabelText}>
                                  {consultationType === "video" ? "1:1 Video Call" : "1:1 Session"}
                                </span>
                              </div>
                              <div className={styles.statusBadgeWrap}>
                                <span className={`${styles.statusBadge} ${badgeClass}`}>
                                  {statusText}
                                </span>
                              </div>
                            </div>
                            <span className={styles.bookingTime}>{formatTimeRange(booking)}</span>
                          </div>

                          <div className={styles.bookingThumb}>
                            <Image
                              src={booking.expert.image}
                              alt={booking.expert.name}
                              fill
                              className={styles.bookingImage}
                              sizes="180px"
                            />
                          </div>

                          <p className={styles.bookingName}>{booking.expert.name}</p>
                          <p className={styles.bookingType}>{booking.specialty}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
