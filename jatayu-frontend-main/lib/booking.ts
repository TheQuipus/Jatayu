import { buildScheduledStartAt } from "@/lib/seekerBookingApi";

export type ConsultationType = "text" | "video" | "shoutout" | "group";

export type ConsultationBadgeVariant = "green" | "purple" | "orange" | "accent";

export const consultationTypes: {
  id: ConsultationType;
  title: string;
  desc: string;
  multiplier: number;
  duration?: string;
  badge?: string;
  badgeVariant?: ConsultationBadgeVariant;
}[] = [
  {
    id: "video",
    title: "1:1 Video Call",
    desc: "Face-to-face interaction for deep dives,\nstrategy, and mentorship.",
    multiplier: 1.6,
    badge: "Deep Dive",
    badgeVariant: "purple",
  },
  {
    id: "text",
    title: "Text Messaging",
    desc: "Send and receive messages with\nyour clients anytime.",
    multiplier: 1,
    badge: "Most Popular",
    badgeVariant: "green",
  },
  {
    id: "shoutout",
    title: "Video Shoutout",
    desc: "Get a personalized video response\nto your question.",
    multiplier: 0.8,
    badge: "Personalized",
    badgeVariant: "orange",
  },
  {
    id: "group",
    title: "Live Chat",
    desc: "Real-time live messaging and\ninteractive chat session.",
    multiplier: 1.2,
    badge: "Interactive",
    badgeVariant: "accent",
  },
];

export const checkoutConsultationTypes = consultationTypes;

export function getConsultationPrice(basePrice: number, type: ConsultationType): number {
  const option = consultationTypes.find((item) => item.id === type);
  return Math.round(basePrice * (option?.multiplier ?? 1));
}

export function getConsultationLabel(type: ConsultationType): string {
  return consultationTypes.find((item) => item.id === type)?.title ?? "Consultation";
}

export type BookingBreakdown = {
  consultationFee: number;
  platformFee: number;
  gst: number;
  walletApplied: number;
  total: number;
};

export const PLATFORM_FEE = 0;

export function calculateBookingTotal(
  consultationFee: number,
  walletBalance: number,
  useWallet: boolean
): BookingBreakdown {
  const platformFee = 0;
  const subtotal = consultationFee;
  const gst = Math.round(subtotal * 0.18);
  const gross = consultationFee + gst;
  const walletApplied = useWallet ? Math.min(walletBalance, gross) : 0;
  const total = gross - walletApplied;

  return { consultationFee, platformFee, gst, walletApplied, total };
}

export const MOCK_WALLET_BALANCE = 450;

export type SlotDate = {
  id: string;
  day: string;
  weekdayShort: string;
  label: string;
  sublabel: string;
  headerDate: string;
};

export const SLOT_DAYS_PER_PAGE = 7;
export const MAX_SLOT_DAY_OFFSET = 28;

export function getAvailableDates(
  startOffset = 0,
  count = SLOT_DAYS_PER_PAGE
): SlotDate[] {
  const today = new Date();
  const formatter = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });

  const labels = ["Today", "Tomorrow"];
  return Array.from({ length: count }, (_, index) => {
    const offset = startOffset + index;
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const parts = formatter.formatToParts(date);
    const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
    const day = parts.find((p) => p.type === "day")?.value ?? "";
    const month = parts.find((p) => p.type === "month")?.value ?? "";

    return {
      id: `date-${offset}`,
      day,
      weekdayShort: weekday.slice(0, 3).toUpperCase(),
      label: offset === 0 ? labels[0] : offset === 1 ? labels[1] : weekday,
      sublabel: `${day} ${month}`,
      headerDate: `${month.toUpperCase()} ${day}`,
    };
  });
}

export function getSlotDateById(dateId: string): SlotDate | undefined {
  const offset = parseSlotDateOffset(dateId);
  if (offset < 0) return undefined;
  return getAvailableDates(offset, 1)[0];
}

export function parseSlotDateOffset(dateId: string): number {
  const offset = Number.parseInt(dateId.replace("date-", ""), 10);
  return Number.isNaN(offset) ? 0 : offset;
}

export function isSlotDateOffsetSelectable(offset: number): boolean {
  return offset >= 0 && offset < MAX_SLOT_DAY_OFFSET;
}

export function getDateWindowStartForOffset(offset: number): number {
  const maxStart = Math.max(0, MAX_SLOT_DAY_OFFSET - SLOT_DAYS_PER_PAGE);
  const aligned = Math.floor(offset / SLOT_DAYS_PER_PAGE) * SLOT_DAYS_PER_PAGE;
  return Math.min(Math.max(0, aligned), maxStart);
}

export function getOffsetFromDate(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function formatSlotDateWindowLabel(dates: SlotDate[]): string {
  if (dates.length === 0) return "";

  const parseOffset = (id: string) => Number.parseInt(id.replace("date-", ""), 10) || 0;
  const start = new Date();
  start.setDate(start.getDate() + parseOffset(dates[0].id));
  const end = new Date();
  end.setDate(end.getDate() + parseOffset(dates[dates.length - 1].id));

  const sameMonth = start.getMonth() === end.getMonth();
  const monthFormatter = new Intl.DateTimeFormat("en-IN", { month: "short" });
  const dayFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric" });

  if (sameMonth) {
    return `${dayFormatter.format(start)} – ${dayFormatter.format(end)} ${monthFormatter.format(start)}`;
  }

  return `${dayFormatter.format(start)} ${monthFormatter.format(start)} – ${dayFormatter.format(end)} ${monthFormatter.format(end)}`;
}

export type TimeSlot = {
  id: string;
  time: string;
  status: "available" | "booked";
};

const BASE_TIME_SLOTS: Omit<TimeSlot, "id">[] = [
  { time: "9:00 AM", status: "booked" },
  { time: "10:00 AM", status: "available" },
  { time: "10:30 AM", status: "available" },
  { time: "11:00 AM", status: "available" },
  { time: "11:30 AM", status: "available" },
  { time: "12:00 PM", status: "booked" },
  { time: "1:00 PM", status: "booked" },
  { time: "3:00 PM", status: "available" },
  { time: "4:00 PM", status: "available" },
  { time: "5:00 PM", status: "available" },
];

export function getTimeSlotsForDate(
  dateId: string,
  timezone = "Asia/Kolkata",
  minimumLeadTimeMinutes = 0,
): TimeSlot[] {
  const dateIndex = Number.parseInt(dateId.replace("date-", ""), 10) || 0;
  const dateObj = new Date();
  dateObj.setHours(0, 0, 0, 0);
  dateObj.setDate(dateObj.getDate() + dateIndex);

  const bufferAdvance = Date.now() + Math.max(0, minimumLeadTimeMinutes) * 60 * 1000;

  return BASE_TIME_SLOTS.map((slot, index) => {
    let isPastOrTooSoon = false;
    try {
      const instant = new Date(buildScheduledStartAt(dateObj, slot.time, timezone)).getTime();
      isPastOrTooSoon = instant < bufferAdvance;
    } catch {
      // fallback if parsing fails
    }

    const baseStatus =
      dateIndex % 3 === 1 && index === 3
        ? "booked"
        : dateIndex % 3 === 2 && index === 8
          ? "booked"
          : slot.status;

    return {
      ...slot,
      id: `${dateId}-slot-${index + 1}`,
      status: isPastOrTooSoon ? "booked" : baseStatus,
    };
  });
}

export function findTimeSlot(dateId: string, slotId: string): TimeSlot | undefined {
  return getTimeSlotsForDate(dateId).find((slot) => slot.id === slotId);
}

export const MOCK_SEEKER_EMAIL = "ananya@email.com";

export function formatConfirmationSchedule(
  dateId: string,
  slotTime: string | undefined,
  isAsync: boolean
): string {
  if (isAsync || !slotTime) {
    return "Flexible — expert will respond within 48 hours";
  }

  const dateIndex = Number.parseInt(dateId.replace("date-", ""), 10) || 0;
  const date = new Date();
  date.setDate(date.getDate() + dateIndex);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);

  return `${formattedDate} at ${slotTime}`;
}

export function parseTimeTo24h(time: string): { hours: number; minutes: number } {
  if (!time) return { hours: 11, minutes: 0 };
  const ampmMatch = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = Number.parseInt(ampmMatch[1], 10);
    const minutes = Number.parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return { hours, minutes };
  }
  const h24Match = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (h24Match) {
    const hours = Number.parseInt(h24Match[1], 10);
    const minutes = Number.parseInt(h24Match[2], 10);
    return { hours, minutes };
  }
  return { hours: 11, minutes: 0 };
}

function formatGoogleCalendarDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

export function buildGoogleCalendarUrl(options: {
  expertName: string;
  dateId: string;
  slotTime?: string;
  bookingId: string;
}): string {
  const { expertName, dateId, slotTime, bookingId } = options;
  const dateIndex = Number.parseInt(dateId.replace("date-", ""), 10) || 0;
  const start = new Date();
  start.setDate(start.getDate() + dateIndex);

  if (slotTime) {
    const { hours, minutes } = parseTimeTo24h(slotTime);
    start.setHours(hours, minutes, 0, 0);
  } else {
    start.setHours(11, 0, 0, 0);
  }

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Session with ${expertName}`,
    dates: `${formatGoogleCalendarDate(start)}/${formatGoogleCalendarDate(end)}`,
    details: `Booking ID: ${bookingId}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
