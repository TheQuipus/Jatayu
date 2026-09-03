"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
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
  ChevronDown,
  Calendar,
} from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import type { ConsultationType } from "@/lib/booking";
import {
  getBookingDetailHref,
  type CalendarBooking,
  type BookingDetail,
} from "@/lib/seekerDashboard";
import { fetchSeekerBookings, toBookingDetail } from "@/lib/seekerBookingApi";
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

function formatTime(booking: CalendarBooking): string {
  const start = new Date();
  start.setHours(booking.startHour, booking.startMinute, 0, 0);

  return start.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
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
}

const PendingCardPokeBox: React.FC<PendingCardPokeBoxProps> = ({ bookingId, placedDaysAgo = 0 }) => {
  const [pokeState, setPokeState] = useState<{
    count: number;
    lastPokedAt: number | null;
  }>(() => ({
    count: 0,
    lastPokedAt: null,
  }));

  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isOneHourPassed = placedDaysAgo > 0;
  const cooldownDuration = 4 * 60 * 60 * 1000;
  const isCooldownActive = pokeState.lastPokedAt !== null && (currentTime - pokeState.lastPokedAt) < cooldownDuration;
  const remainingCooldownMs = pokeState.lastPokedAt !== null ? Math.max(0, cooldownDuration - (currentTime - pokeState.lastPokedAt)) : 0;

  const formatRemainingTime = (ms: number): string => {
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const handlePoke = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isOneHourPassed || pokeState.count >= 2 || isCooldownActive) return;

    setPokeState((prev) => ({
      count: prev.count + 1,
      lastPokedAt: Date.now(),
    }));
  };
  return (
    <div className={styles.pokeForm} onClick={(e) => e.stopPropagation()}>
      {!isOneHourPassed ? (
        <button disabled className={styles.pokeBtnDisabled} title="Poke option will be active 1 hour after booking placement.">
          <Lock size={12} />
          <span>Poke active in 1h</span>
        </button>
      ) : pokeState.count >= 2 ? (
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
          label={`Poke ${pokeState.count}/2`}
          onClick={handlePoke}
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

  const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => startOfDay(new Date()));
  const calendarPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarPickerRef.current &&
        !calendarPickerRef.current.contains(event.target as Node)
      ) {
        setIsCalendarPickerOpen(false);
      }
    }
    if (isCalendarPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarPickerOpen]);

  const monthMatrix = useMemo(() => {
    const year = pickerMonth.getFullYear();
    const month = pickerMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    let dayOfWeek = firstDayOfMonth.getDay() - 1; // Mon = 0
    if (dayOfWeek < 0) dayOfWeek = 6;
    const startDate = new Date(year, month, 1 - dayOfWeek);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(addDays(startDate, i));
    }
    return days;
  }, [pickerMonth]);

  const weekRows = useMemo(() => {
    const rows: Date[][] = [];
    for (let i = 0; i < monthMatrix.length; i += 7) {
      rows.push(monthMatrix.slice(i, i + 7));
    }
    return rows;
  }, [monthMatrix]);

  const [feedbackStates, setFeedbackStates] = useState<Record<string, {
    rating: number | null;
    category: string | null;
    comment: string;
    submitted: boolean;
  }>>({});



  const handleSelectRating = (bookingId: string, rating: number) => {
    setFeedbackStates((prev) => {
      const current = prev[bookingId];
      const newRating = current?.rating === rating ? null : rating;
      return {
        ...prev,
        [bookingId]: {
          ...(current || { category: null, comment: "", submitted: false }),
          rating: newRating,
          category: newRating === null ? null : (current?.category || null),
        },
      };
    });
  };

  const handleSelectCategory = (bookingId: string, category: string) => {
    setFeedbackStates((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || { rating: null, comment: "", submitted: false }),
        category,
      },
    }));
  };

  const handleChangeComment = (bookingId: string, comment: string) => {
    setFeedbackStates((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || { rating: null, category: null, submitted: false }),
        comment,
      },
    }));
  };

  const handleSubmitFeedback = (bookingId: string) => {
    setFeedbackStates((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || { rating: null, category: null, comment: "" }),
        submitted: true,
      },
    }));
  };

  const renderCancelledFeedbackForm = (bookingId: string) => {
    const feedback = feedbackStates[bookingId] || {
      rating: null,
      category: null,
      comment: "",
      submitted: false,
    };

    const ratingLabels: Record<number, string> = {
      1: "Bad",
      2: "Poor",
      3: "Fare",
      4: "Good",
      5: "Excellent",
    };

    if (feedback.submitted) {
      return (
        <div className={styles.feedbackSuccess}>
          <span className={styles.successStar}>✦</span>
          <p className={styles.successText}>
            Review submitted.
          </p>
        </div>
      );
    }

    return (
      <div className={styles.feedbackForm} onClick={(e) => e.stopPropagation()}>
        <span className={styles.feedbackFormTitle}>Rate your experience</span>
        <div className={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={styles.starBtn}
              onClick={() => handleSelectRating(bookingId, star)}
              aria-label={`Rate ${star} star`}
            >
              <Star
                size={16}
                fill={feedback.rating && star <= feedback.rating ? "#EAB308" : "transparent"}
                stroke={feedback.rating && star <= feedback.rating ? "#EAB308" : "var(--dove-gray)"}
              />
            </button>
          ))}
          {feedback.rating && (
            <span className={styles.ratingLabelText}>
              {ratingLabels[feedback.rating]}
            </span>
          )}
        </div>

        {feedback.rating && (
          <div className={styles.feedbackDetailsBlock}>
            {feedback.rating <= 3 ? (
              <div className={styles.wrongCategoryBox}>
                <span className={styles.inputLabel}>What went wrong? *</span>
                <div className={styles.categoriesList}>
                  {["Expert No show", "Didnt Accepted Request", "Other"].map((cat) => (
                    <label key={cat} className={styles.categoryLabel}>
                      <input
                        type="radio"
                        name={`wrong_category_${bookingId}`}
                        checked={feedback.category === cat}
                        onChange={() => handleSelectCategory(bookingId, cat)}
                        className={styles.categoryRadio}
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
                <textarea
                  placeholder="Additional details (optional)..."
                  value={feedback.comment}
                  onChange={(e) => handleChangeComment(bookingId, e.target.value)}
                  className={styles.feedbackTextarea}
                />
                <ContinueButton
                  label="Submit Feedback"
                  disabled={!feedback.category}
                  onClick={() => handleSubmitFeedback(bookingId)}
                  className={styles.joinBtn}
                />
              </div>
            ) : (
              <div className={styles.positiveFeedbackBox}>
                <span className={styles.inputLabel}>Write a review</span>
                <textarea
                  placeholder="Share details about your experience..."
                  value={feedback.comment}
                  onChange={(e) => handleChangeComment(bookingId, e.target.value)}
                  className={styles.feedbackTextarea}
                />
                <ContinueButton
                  label="Submit & Earn Credits"
                  onClick={() => handleSubmitFeedback(bookingId)}
                  className={styles.joinBtn}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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
        console.error("Failed to fetch seeker bookings for dashboard calendar:", err);
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  const getConfirmedCountdown = (bookingId: string) => {
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

    const remainingSecs = totalSeconds % 60;
    const remainingMins = totalMinutes % 60;
    const remainingHrs = totalHours % 24;

    const dd = String(totalDays).padStart(2, "0");
    const hh = String(totalDays > 0 ? remainingHrs : totalHours).padStart(2, "0");
    const mm = String(remainingMins).padStart(2, "0");
    const ss = String(remainingSecs).padStart(2, "0");

    if (totalDays > 0) {
      return `${dd}D:${hh}H:${mm}M:${ss}S`;
    } else {
      return `${hh}H:${mm}M:${ss}S`;
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

  const visibleDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(visibleStart, index)),
    [visibleStart]
  );

  const bookingsByDay = useMemo(() => {
    const map = new Map<number, BookingDetail[]>();

    visibleDays.forEach((day, index) => {
      const dayBookings = apiBookings.filter((booking) => {
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
  }, [today, visibleDays, apiBookings]);

  const rangeLabel = formatRangeLabel(visibleDays);

  return (
    <section className={`${styles.calendar} ${className}`.trim()}>
      <div className={styles.calendarShell}>
        <div className={styles.calendarToolbar}>
          <div className={styles.teamsToolbarGroup}>
            <button
              type="button"
              className={styles.teamsTodayBtn}
              onClick={() => {
                const now = startOfDay(new Date());
                setVisibleStart(getStartOfWeek(now));
                setPickerMonth(now);
              }}
              title="Go to Today"
            >
              <Calendar size={15} className={styles.teamsTodayIcon} />
              <span>Today</span>
            </button>

            <div className={styles.teamsNavNavBtns}>
              <button
                type="button"
                className={styles.teamsNavBtn}
                onClick={() => setVisibleStart((prev) => getStartOfWeek(addDays(prev, -7)))}
                aria-label="Previous week"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                className={styles.teamsNavBtn}
                onClick={() => setVisibleStart((prev) => getStartOfWeek(addDays(prev, 7)))}
                aria-label="Next week"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className={styles.pickerContainer} ref={calendarPickerRef}>
              <button
                type="button"
                className={`${styles.teamsDateDropdownBtn} ${isCalendarPickerOpen ? styles.teamsDateDropdownBtnActive : ""
                  }`}
                onClick={() => {
                  setPickerMonth(visibleStart);
                  setIsCalendarPickerOpen((prev) => !prev);
                }}
                aria-label="Toggle calendar month picker"
              >
                <span className={styles.teamsDateTitle}>
                  {formatTeamsMonthRange(visibleDays)}
                </span>
                <ChevronDown
                  size={15}
                  className={`${styles.teamsChevron} ${isCalendarPickerOpen ? styles.teamsChevronRotate : ""
                    }`}
                />
              </button>

              {isCalendarPickerOpen && (
                <div className={styles.monthPickerPopover}>
                  <div className={styles.popoverHeader}>
                    <span className={styles.popoverMonthLabel}>
                      {pickerMonth.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <div className={styles.popoverNavGroup}>
                      <button
                        type="button"
                        className={styles.popoverNavBtn}
                        onClick={() => {
                          const prev = new Date(pickerMonth);
                          prev.setMonth(prev.getMonth() - 1);
                          setPickerMonth(prev);
                        }}
                        aria-label="Previous month"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        className={styles.popoverNavBtn}
                        onClick={() => {
                          const next = new Date(pickerMonth);
                          next.setMonth(next.getMonth() + 1);
                          setPickerMonth(next);
                        }}
                        aria-label="Next month"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.popoverWeekHeader}>
                    <span>M</span>
                    <span>T</span>
                    <span>W</span>
                    <span>T</span>
                    <span>F</span>
                    <span>S</span>
                    <span>S</span>
                  </div>

                  <div className={styles.popoverGrid}>
                    {weekRows.map((row, rowIndex) => {
                      const isRowSelected = row.some((dayDate) =>
                        visibleDays.some((vd) => isSameDay(vd, dayDate))
                      );

                      return (
                        <div
                          key={rowIndex}
                          className={`${styles.popoverWeekRow} ${isRowSelected ? styles.popoverWeekRowSelected : ""
                            }`}
                        >
                          {row.map((dayDate) => {
                            const isCurrentMonth = dayDate.getMonth() === pickerMonth.getMonth();
                            const isToday = isSameDay(dayDate, today);
                            const isExactSelectedDate = isSameDay(visibleStart, dayDate);

                            return (
                              <button
                                key={dayDate.toISOString()}
                                type="button"
                                className={`
                                  ${styles.popoverDayBtn}
                                  ${!isCurrentMonth ? styles.popoverDayOtherMonth : ""}
                                  ${isToday ? styles.popoverDayToday : ""}
                                  ${isExactSelectedDate ? styles.popoverDaySelected : ""}
                                `.trim()}
                                onClick={() => {
                                  setVisibleStart(getStartOfWeek(dayDate));
                                  setIsCalendarPickerOpen(false);
                                }}
                              >
                                <span className={styles.popoverDayNum}>{dayDate.getDate()}</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.weekBoard}>
          {visibleDays.map((day, dayIndex) => {
            const dayBookings = bookingsByDay.get(dayIndex) ?? [];

            return (
              <div key={day.toISOString()} className={styles.dayColumn}>
                <div className={`${styles.dayHeader} ${isSameDay(day, today) ? styles.dayHeaderToday : ""}`}>
                  {isSameDay(day, today)
                    ? "Today"
                    : day.toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      weekday: "short",
                    })}
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
                              <div className={styles.metaRowLeft}>
                                <IconComponent size={13} className={styles.consultationIcon} aria-hidden="true" />
                                <span className={`${styles.statusBadge} ${styles.statusBadgeCancelled}`}>
                                  {formatStatus(booking.status)}
                                </span>
                              </div>
                              <span className={styles.bookingTime}>{formatTime(booking)}</span>
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
                          {renderCancelledFeedbackForm(booking.id)}
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
                              <div className={styles.metaRowLeft}>
                                <IconComponent size={13} className={styles.consultationIcon} aria-hidden="true" />
                                <span className={`${styles.statusBadge} ${styles.statusBadgeConfirmed}`}>
                                  {formatStatus(booking.status)}
                                </span>
                              </div>
                              <span className={styles.bookingTime}>{formatTime(booking)}</span>
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    router.push(`${getBookingDetailHref(booking.id)}?action=join`);
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
                            <div className={styles.metaRowLeft}>
                              <IconComponent size={13} className={styles.consultationIcon} aria-hidden="true" />
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
                            <span className={styles.bookingTime}>{formatTime(booking)}</span>
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
                        <PendingCardPokeBox bookingId={booking.id} placedDaysAgo={detail?.placedDaysAgo || 0} />
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
