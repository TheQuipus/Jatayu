export type ConsultationType = "text" | "video" | "live" | "audio";

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
    id: "audio",
    title: "Shoutout",
    desc: "Quick shoutouts for fast advice when\nclients prefer privacy.",
    multiplier: 2.4,
    duration: "20 mins",
    badge: "Quick Hit",
    badgeVariant: "accent",
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
    id: "live",
    title: "Group Q&A",
    desc: "Host live sessions with up to\n5 people at a time.",
    multiplier: 4,
    duration: "30 mins",
    badge: "Real-Time",
    badgeVariant: "orange",
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

export const PLATFORM_FEE = 99;

export function calculateBookingTotal(
  consultationFee: number,
  walletBalance: number,
  useWallet: boolean
): BookingBreakdown {
  const platformFee = consultationFee > 0 ? PLATFORM_FEE : 0;
  const subtotal = consultationFee + platformFee;
  const gst = Math.round(subtotal * 0.18);
  const gross = consultationFee + platformFee + gst;
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

export function getTimeSlotsForDate(dateId: string): TimeSlot[] {
  const dateIndex = Number.parseInt(dateId.replace("date-", ""), 10) || 0;

  return BASE_TIME_SLOTS.map((slot, index) => ({
    ...slot,
    id: `${dateId}-slot-${index + 1}`,
    status:
      dateIndex % 3 === 1 && index === 3
        ? "booked"
        : dateIndex % 3 === 2 && index === 8
          ? "booked"
          : slot.status,
  }));
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

function parseTimeTo24h(time: string): { hours: number; minutes: number } {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hours: 11, minutes: 0 };

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return { hours, minutes };
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
