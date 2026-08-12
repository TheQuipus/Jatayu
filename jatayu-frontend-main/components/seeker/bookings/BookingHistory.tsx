"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MessageSquare, Video, Clapperboard, Users, Calendar, Clock } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import {
  BOOKING_DETAILS,
  formatBookingDateKey,
  getBookingDateObject,
  type BookingDetail,
} from "@/lib/seekerDashboard";
import type { ConsultationType } from "@/lib/booking";
import styles from "./BookingHistory.module.css";

const CONSULTATION_ICONS: Record<ConsultationType, typeof MessageSquare> = {
  text: MessageSquare,
  video: Video,
  shoutout: Clapperboard,
  group: Users,
};

function formatStatus(status: BookingDetail["status"]): string {
  if (status === "confirmed") return "Accepted";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Pending";
}

export default function BookingHistory() {
  const router = useRouter();

  const groupedBookings = useMemo(() => {
    const filtered = BOOKING_DETAILS.filter(
      (booking) => booking.status === "confirmed" || booking.status === "completed" || booking.status === "cancelled"
    );

    const groupsMap = new Map<string, { dateKey: string; dateObj: Date; bookings: BookingDetail[] }>();

    filtered.forEach((booking) => {
      const dateKey = formatBookingDateKey(booking.dayOffset);
      const dateObj = getBookingDateObject(booking.dayOffset);

      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, {
          dateKey,
          dateObj,
          bookings: [],
        });
      }

      groupsMap.get(dateKey)!.bookings.push(booking);
    });

    const groups = Array.from(groupsMap.values());
    groups.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

    return groups;
  }, []);

  return (
    <div className={styles.historyContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>ALL BOOKINGS</h2>
      </div>

      {groupedBookings.map((group) => (
        <div key={group.dateKey} className={styles.dateGroupSection}>
          <div className={styles.dateHeaderBanner}>
            <div className={styles.dateHeaderLeft}>
              <span className={styles.dateTitle}>{group.dateKey}</span>
            </div>
            <span className={styles.dateBadge}>
              {group.bookings.length} {group.bookings.length === 1 ? "Session" : "Sessions"}
            </span>
          </div>

          <div className={styles.grid}>
            {group.bookings.map((booking) => {
              const IconComponent = CONSULTATION_ICONS[booking.consultationType];

              return (
                <div key={booking.id} className={styles.card}>
                  <div className={styles.statusLine}>
                    <span
                      className={`${styles.statusText} ${
                        booking.status === "confirmed" || booking.status === "completed"
                          ? styles.statusTextConfirmed
                          : booking.status === "cancelled"
                          ? styles.statusTextCancelled
                          : styles.statusTextPending
                      }`}
                    >
                      {formatStatus(booking.status)}
                    </span>
                  </div>

                  <div className={styles.cardHeader}>
                    <div className={styles.expertInfo}>
                      <div className={styles.avatarWrap}>
                        <Image
                          src={booking.expert.image}
                          alt={booking.expert.name}
                          width={44}
                          height={44}
                          className={styles.avatar}
                        />
                      </div>
                      <div>
                        <h3 className={styles.expertName}>{booking.expert.name}</h3>
                        <p className={styles.specialty}>{booking.specialty}</p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.cardBody}>
                    <div className={styles.metaItem}>
                      <Calendar size={14} className={styles.metaIcon} />
                      <span>{booking.scheduledDateLabel}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <Clock size={14} className={styles.metaIcon} />
                      <span>{booking.scheduledTimeLabel}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <IconComponent size={14} className={styles.metaIcon} />
                      <span>{booking.consultationLabel} • {booking.durationLabel}</span>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <ContinueButton
                      label="View Details"
                      onClick={() => router.push(`/seeker/bookings/${booking.id}`)}
                      className={styles.detailsContinueBtn}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

