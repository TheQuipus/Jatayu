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
  Info,
  Star,
  Lock,
  Hourglass,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import type { ConsultationType } from "@/lib/booking";
import {
  getBookingDetailHref,
  getPokeState,
  savePokeState,
  type CalendarBooking,
  type BookingDetail,
} from "@/lib/seekerDashboard";
import { fetchSeekerBookings, pokeBookingExpert, toBookingDetail } from "@/lib/seekerBookingApi";
import styles from "./BookingCalendar.module.css";

const CONSULTATION_ICONS: Record<ConsultationType, typeof MessageSquare> = {
  text: MessageSquare,
  video: Video,
  shoutout: Clapperboard,
  group: Users,
};

function formatTeamsMonthRange(days: Date[]): string {
  if (!days || days.length === 0) return "";
  const first = days[0];
  const last = days[days.length - 1];
  const m1 = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const m2 = last.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  if (m1 === m2) {
    return m1;
  }
  const month1 = first.toLocaleDateString("en-US", { month: "long" });
  const year1 = first.getFullYear();
  const month2 = last.toLocaleDateString("en-US", { month: "long" });
  const year2 = last.getFullYear();

  if (year1 === year2) {
    return `${month1} - ${month2} ${year1}`;
  }
  return `${month1} ${year1} - ${month2} ${year2}`;
}

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
  let day = next.getDay() - 1; // Mon = 0, Tue = 1 ... Sun = 6
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
  const first = days[0];
  const last = days[days.length - 1];
  const month = first.toLocaleDateString("en-IN", { month: "short" });
  const endMonth = last.toLocaleDateString("en-IN", { month: "short" });

  const firstDayStr = String(first.getDate()).padStart(2, "0");
  const lastDayStr = String(last.getDate()).padStart(2, "0");

  return `${month} ${firstDayStr} - ${endMonth} ${lastDayStr}`;
}

interface PendingCardPokeBoxProps {
  bookingId: string;
  placedDaysAgo?: number;
  createdAt?: number | string;
  initialCount?: number;
  initialLastPokedAt?: string | null;
  maxCount?: number;
  nextAllowedAt?: string | null;
}

const PendingCardPokeBox: React.FC<PendingCardPokeBoxProps> = ({
  bookingId,
  placedDaysAgo = 0,
  createdAt,
  initialCount = 0,
  initialLastPokedAt = null,
  maxCount = 2,
  nextAllowedAt = null,
}) => {
  const [pokeState, setPokeState] = useState<{
    count: number;
    lastPokedAt: number | null;
  }>({
    count: 0,
    lastPokedAt: null,
  });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setPokeState(initialCount || initialLastPokedAt ? {
      count: initialCount,
      lastPokedAt: initialLastPokedAt ? new Date(initialLastPokedAt).getTime() : null,
    } : getPokeState(bookingId));
  }, [bookingId, initialCount, initialLastPokedAt]);

  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine elapsed time since booking placement
  const bookingTimeMs = createdAt
    ? typeof createdAt === "string"
      ? new Date(createdAt).getTime()
      : createdAt
    : Date.now() - placedDaysAgo * 24 * 60 * 60 * 1000;

  const fourHoursMs = 1 * 60 * 60 * 1000;
  const timeSinceCreationMs = currentTime - bookingTimeMs;
  const serverNextAllowedMs = nextAllowedAt ? new Date(nextAllowedAt).getTime() : null;
  const isInitialDelayPassed = serverNextAllowedMs
    ? currentTime >= serverNextAllowedMs || pokeState.count > 0
    : timeSinceCreationMs >= fourHoursMs || placedDaysAgo > 0;
  const remainingInitialMs = serverNextAllowedMs
    ? Math.max(0, serverNextAllowedMs - currentTime)
    : Math.max(0, fourHoursMs - timeSinceCreationMs);

  const isCooldownActive =
    isMounted &&
    pokeState.lastPokedAt !== null &&
    (serverNextAllowedMs
      ? currentTime < serverNextAllowedMs
      : currentTime - pokeState.lastPokedAt < 4 * 60 * 60 * 1000);

  const remainingCooldownMs =
    pokeState.lastPokedAt !== null
      ? serverNextAllowedMs
        ? Math.max(0, serverNextAllowedMs - currentTime)
        : Math.max(0, 4 * 60 * 60 * 1000 - (currentTime - pokeState.lastPokedAt))
      : 0;

  const formatRemainingTime = (ms: number): string => {
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const handlePoke = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isInitialDelayPassed || pokeState.count >= maxCount || isCooldownActive) return;
    try {
      const updated = await pokeBookingExpert(bookingId);
      const nextCount = updated.poke?.count || pokeState.count + 1;
      const now = updated.poke?.lastPokedAt
        ? new Date(updated.poke.lastPokedAt).getTime()
        : Date.now();
      setPokeState({ count: nextCount, lastPokedAt: now });
      savePokeState(bookingId, nextCount, now);
    } catch (error) {
      console.error("Failed to poke expert:", error);
    }
  };

  return (
    <div className={styles.pokeForm} onClick={(e) => e.stopPropagation()}>
      {!isInitialDelayPassed ? (
        <button
          disabled
          className={styles.pokeBtnDisabled}
          title="Poke option becomes active after the configured waiting period."
        >
          <Lock size={12} />
          <span>Poke active in {formatRemainingTime(remainingInitialMs)}</span>
        </button>
      ) : pokeState.count >= maxCount ? (
        <button disabled className={styles.pokeBtnDisabled}>
          <CheckCircle2 size={12} />
          <span>Max pokes reached</span>
        </button>
      ) : isCooldownActive ? (
        <button disabled className={styles.pokeBtnDisabled}>
          <Hourglass size={12} />
          <span>Next poke: {formatRemainingTime(remainingCooldownMs)}</span>
        </button>
      ) : (
        <ContinueButton
          label={`Poke ${pokeState.count}/${maxCount}`}
          onClick={handlePoke}
          showArrow={false}
          leadingIcon={
            <Image
              src="/pointright.svg"
              alt=""
              width={16}
              height={16}
              className={styles.pokeIconSvg}
              aria-hidden="true"
            />
          }
          className={styles.joinBtn}
        />
      )}
    </div>
  );
};

function formatStatus(status: CalendarBooking["status"]): string {
  if (status === "confirmed") return "Accepted";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Pending";
}

type BookingCalendarProps = {
  className?: string;
};

export default function BookingCalendar({ className = "" }: BookingCalendarProps) {
  const router = useRouter();
  const today = useMemo(() => {
    return startOfDay(new Date());
  }, []);

  const initialVisibleStart = useMemo(() => {
    return getStartOfWeek(today);
  }, [today]);

  const [visibleStart, setVisibleStart] = useState(initialVisibleStart);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());



  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getConfirmedCountdown = (bookingId: string) => {
    if (
      typeof window !== "undefined" &&
      (window.sessionStorage.getItem("fast_forward_timer") === "true" ||
        window.location.search.includes("testJoin") ||
        window.location.search.includes("action=join"))
    ) {
      return null;
    }

    const detail = apiBookings.find((b) => b.id === bookingId);
    if (!detail) return null;

    const targetDate = new Date(currentTime);
    targetDate.setDate(targetDate.getDate() + detail.dayOffset);
    targetDate.setHours(detail.startHour, detail.startMinute, 0, 0);

    const diffMs = targetDate.getTime() - currentTime;
    // Hide countdown timer 5 minutes prior to meeting start time
    if (diffMs <= 5 * 60 * 1000) {
      return null;
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    if (totalDays > 0) {
      const remainingHours = totalHours % 24;
      const dd = String(totalDays).padStart(2, "0");
      const hh = String(remainingHours).padStart(2, "0");
      return `${dd}D::${hh}H`;
    } else {
      const remainingMinutes = totalMinutes % 60;
      const hh = String(totalHours).padStart(2, "0");
      const mm = String(remainingMinutes).padStart(2, "0");
      return `${hh}H:${mm}M`;
    }
  };

  useEffect(() => {
    let parsedStart: Date | null = null;

    try {
      const savedStart = sessionStorage.getItem("booking_calendar_visible_start");
      if (savedStart) {
        const parsed = new Date(savedStart);
        if (!isNaN(parsed.getTime())) {
          parsedStart = parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load visibleStart from sessionStorage", e);
    }

    setTimeout(() => {
      if (parsedStart) {
        setVisibleStart(parsedStart);
      }
      setIsLoaded(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      sessionStorage.setItem("booking_calendar_visible_start", visibleStart.toISOString());
    } catch (e) {
      console.error("Failed to save visibleStart to sessionStorage", e);
    }
  }, [visibleStart, isLoaded]);

  const [pageStart, setPageStart] = useState(0);
  const [apiBookings, setApiBookings] = useState<BookingDetail[]>([]);

  useEffect(() => {
    let isSubscribed = true;
    fetchSeekerBookings()
      .then((res) => {
        if (isSubscribed && res.bookings) {
          const mapped = res.bookings.map((b) => toBookingDetail(b));
          setApiBookings(mapped);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch seeker bookings for calendar:", err);
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  const upcomingBookings = useMemo(() => {
    return apiBookings.filter(
      (booking) => booking.status !== "completed"
    );
  }, [apiBookings]);

  const allBookingOffsets = useMemo(() => {
    const offsetsWithBookings = Array.from(
      new Set(upcomingBookings.map((b) => Math.max(0, b.dayOffset)))
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
  }, [upcomingBookings]);

  const visibleDays = useMemo(() => {
    const currentBatch = allBookingOffsets.slice(pageStart, pageStart + 7);
    return currentBatch.map((offset) => addDays(today, offset));
  }, [today, allBookingOffsets, pageStart]);

  const hasFarawayBooking = useMemo(() => {
    return allBookingOffsets.length > pageStart + 7;
  }, [allBookingOffsets, pageStart]);

  const bookingsByDay = useMemo(() => {
    const map = new Map<number, BookingDetail[]>();

    visibleDays.forEach((day, index) => {
      const dayBookings = upcomingBookings.filter((booking) => {
        return isSameDay(addDays(today, booking.dayOffset), day);
      });

      dayBookings.sort((a, b) => {
        const timeA = a.startHour * 60 + a.startMinute;
        const timeB = b.startHour * 60 + b.startMinute;
        return timeA - timeB;
      });

      map.set(index, dayBookings);
    });

    return map;
  }, [today, upcomingBookings, visibleDays]);

  return (
    <section className={`${styles.calendar} ${className}`.trim()}>
      <div className={styles.calendarShell}>
        <div className={styles.weekBoard}>
          {visibleDays.map((day, dayIndex) => {
            const dayBookings = bookingsByDay.get(dayIndex) ?? [];

            return (
              <div key={day.toISOString()} className={styles.dayColumn}>
                <div className={`${styles.dayHeader} ${isSameDay(day, today) ? styles.dayHeaderToday : ""}`}>
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
                    {isSameDay(day, today)
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
                      title="View next booking dates (Faraway booking ahead)"
                      aria-label="View next booking dates"
                    >
                      <ChevronRight size={13} />
                    </button>
                  )}
                </div>

                <div className={styles.dayContent}>
                  {dayBookings.length === 0 ? <span className={styles.emptyDay} /> : null}
                  {dayBookings.map((booking, index) => {
                    const detail = booking;
                    const IconComponent = (booking.consultationType && CONSULTATION_ICONS[booking.consultationType]) || MessageSquare;

                    if (booking.status === "cancelled") {
                      return (
                        <div
                          key={booking.id}
                          className={`${styles.bookingEvent} ${styles.bookingEventCancelledCard}`}
                          style={{ marginTop: index === 0 ? 0 : 14 }}
                        >
                          <Link
                            href={getBookingDetailHref(booking.id)}
                            className={styles.cancelledHeaderLink}
                          >
                            <div className={styles.bookingMetaRow}>
                              <div className={styles.metaRowTop}>
                                <div className={styles.consultationTag}>
                                  <IconComponent size={13} className={styles.consultationIcon} aria-hidden="true" />
                                  <span className={styles.consultationLabelText}>
                                    {detail?.consultationLabel || "1:1 Video Call"}
                                  </span>
                                </div>
                                <div className={styles.statusBadgeWrap}>
                                  <span className={`${styles.statusBadge} ${styles.statusBadgeCancelled}`}>
                                    {formatStatus(booking.status)}
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
                                loading={booking.expert.image === "/assets/img/team1.png" || booking.expert.image === "/assets/img/team2.png" ? "eager" : undefined}
                              />
                            </div>
                            <p className={styles.bookingName}>{booking.expert.name}</p>
                            <p className={styles.bookingType}>{booking.specialty}</p>
                          </Link>
                          <div className={styles.cancelledDivider} />
                          <div className={styles.pokeForm} onClick={(e) => e.stopPropagation()}>
                            <ContinueButton
                              label="Write Review"
                              showArrow={false}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                router.push(`${getBookingDetailHref(booking.id)}?action=review`);
                              }}
                              className={styles.joinBtn}
                            />
                          </div>
                        </div>
                      );
                    }
                    if (booking.status === "confirmed") {
                      const countdown = getConfirmedCountdown(booking.id);
                      return (
                        <div
                          key={booking.id}
                          className={`${styles.bookingEvent} ${styles.bookingEventConfirmedCard}`}
                          style={{ marginTop: index === 0 ? 0 : 14 }}
                        >
                          <Link
                            href={getBookingDetailHref(booking.id)}
                            className={styles.confirmedHeaderLink}
                          >
                            <div className={styles.bookingMetaRow}>
                              <div className={styles.metaRowTop}>
                                <div className={styles.consultationTag}>
                                  <IconComponent size={13} className={styles.consultationIcon} aria-hidden="true" />
                                  <span className={styles.consultationLabelText}>
                                    {detail?.consultationLabel || "1:1 Video Call"}
                                  </span>
                                </div>
                                <div className={styles.statusBadgeWrap}>
                                  <span className={`${styles.statusBadge} ${styles.statusBadgeConfirmed}`}>
                                    {formatStatus(booking.status)}
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
                                loading={booking.expert.image === "/assets/img/team1.png" || booking.expert.image === "/assets/img/team2.png" ? "eager" : undefined}
                              />
                            </div>
                            <p className={styles.bookingName}>{booking.expert.name}</p>
                            <p className={styles.bookingType}>{booking.specialty}</p>
                          </Link>
                          {countdown ? (
                            <>
                              <div className={styles.confirmedDivider} />
                              <div className={styles.countdownForm}>
                                <span className={styles.countdownTitle}>Time Remaining</span>
                                <div className={styles.countdownBox}>
                                  <span className={styles.countdownText}>{countdown}</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className={styles.confirmedDivider} />
                              <div className={styles.joinActionBox}>
                                <ContinueButton
                                  label="Join Session"
                                  showArrow={false}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    router.push(`${getBookingDetailHref(booking.id)}?action=join&from=calendar`);
                                  }}
                                  className={styles.joinBtn}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={booking.id}
                        className={`${styles.bookingEvent} ${styles.bookingEventPendingCard}`}
                        style={{ marginTop: index === 0 ? 0 : 14 }}
                      >
                        <Link
                          href={getBookingDetailHref(booking.id)}
                          className={styles.pendingHeaderLink}
                        >
                          <div className={styles.bookingMetaRow}>
                            <div className={styles.metaRowTop}>
                              <div className={styles.consultationTag}>
                                <IconComponent size={13} className={styles.consultationIcon} aria-hidden="true" />
                                <span className={styles.consultationLabelText}>
                                  {detail?.consultationLabel || "1:1 Video Call"}
                                </span>
                              </div>
                              <div className={styles.statusBadgeWrap}>
                                <span className={`${styles.statusBadge} ${styles.statusBadgePending}`}>
                                  {formatStatus(booking.status)}
                                </span>
                                <span className={styles.tooltipContainer} onClick={(e) => e.preventDefault()}>
                                  <Info size={13} className={styles.infoIcon} />
                                  <span className={styles.tooltipText}>
                                    Booking will be auto canceled if not accepted within given time you will not be charged and presented with similar expert profile
                                  </span>
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
                              loading={booking.expert.image === "/assets/img/team1.png" || booking.expert.image === "/assets/img/team2.png" ? "eager" : undefined}
                            />
                          </div>
                          <p className={styles.bookingName}>{booking.expert.name}</p>
                          <p className={styles.bookingType}>{booking.specialty}</p>
                        </Link>
                        <div className={styles.pendingDivider} />
                        <PendingCardPokeBox
                          bookingId={booking.id}
                          placedDaysAgo={detail?.placedDaysAgo || 0}
                          createdAt={booking.createdAt}
                          initialCount={booking.pokeCount}
                          initialLastPokedAt={booking.lastPokedAt}
                          maxCount={booking.pokeMaxCount}
                          nextAllowedAt={booking.pokeNextAllowedAt}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
