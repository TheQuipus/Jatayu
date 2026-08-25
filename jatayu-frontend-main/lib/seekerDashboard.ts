import { featuredExperts, getExpertDetailHref, type Expert } from "@/lib/experts";
import {
  buildGoogleCalendarUrl,
  calculateBookingTotal,
  getConsultationPrice,
  type ConsultationType,
} from "@/lib/booking";

export type SeekerNavItem = {
  id: string;
  label: string;
  href: string;
  badge?: number;
};

export type CalendarBooking = {
  id: string;
  expert: Expert;
  specialty: string;
  dayOffset: number;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  createdAt?: string | number;
};

export type BookingAttachment = {
  name: string;
  size: string;
  kind: "pdf" | "docx" | "image";
};

export type BookingDetail = CalendarBooking & {
  referenceId: string;
  consultationType: ConsultationType;
  consultationLabel: string;
  placedOnLabel: string;
  scheduledDateLabel: string;
  scheduledTimeLabel: string;
  durationLabel: string;
  paymentStatus: "paid" | "pending";
  consultationFee: number;
  platformFee: number;
  gst: number;
  walletApplied: number;
  totalPaid: number;
  invoiceId: string;
  calendarUrl: string;
  subject: string;
  context: string;
  attachments: BookingAttachment[];
  placedDaysAgo: number;
  cancellationReason?: string;
};

export type UpcomingBooking = CalendarBooking;

export type ExpertUpdate = {
  id: string;
  expert: Expert;
  timeAgo: string;
  text: string;
};

export type SeekerNotification = {
  id: string;
  title: string;
  body: string;
  timeAgo: string;
  unread: boolean;
  href?: string;
  expert?: Expert;
};

export type SavedExpertEntry = {
  expert: Expert;
  rating: number;
};

export const SEEKER_PROFILE = {
  name: "Priya Sharma",
  avatar: "/assets/img/avatar1.png",
  isPro: true,
  greeting: "Good morning",
  email: "ananya@email.com",
  phone: "9898675444",
};

export const WALLET_BALANCE = 2450;

export const ACTIVITY_STATS = [
  { label: "Total Sessions", value: "24" },
  { label: "Hours Consulted", value: "18.5h" },
  { label: "Experts Connected", value: "8" },
  { label: "Open Tickets", value: "1" },
] as const;

export const MAIN_NAV: SeekerNavItem[] = [
  { id: "home", label: "Home", href: "/seeker/dashboard/" },
  { id: "discover", label: "Discover", href: "/seeker/discover/" },
  { id: "bookings", label: "Bookings", href: "/seeker/bookings/", badge: 2 },
];

export const PROFILE_NAV: SeekerNavItem = {
  id: "profile",
  label: "Profile",
  href: "/seeker/profile/",
};

export const QUICK_LINKS: SeekerNavItem[] = [
  { id: "tickets", label: "My Tickets", href: "/seeker/dashboard/#tickets" },
  { id: "saved", label: "Saved Experts", href: "/seeker/bookmark/" },
  { id: "support", label: "Support", href: "/seeker/dashboard/#support" },
];

export const TRENDING_CATEGORIES = [
  "Finance",
  "Legal",
  "Technology",
  "Career",
  "Marketing",
  "Education",
] as const;

export const CALENDAR_START_HOUR = 8;
export const CALENDAR_END_HOUR = 20;
export const CALENDAR_HOUR_HEIGHT = 64;

function daysUntilFriday(from = new Date()): number {
  const day = from.getDay();
  const diff = (5 - day + 7) % 7;
  return diff === 0 && day !== 5 ? 7 : diff;
}

export const UPCOMING_BOOKINGS: CalendarBooking[] = [
  {
    id: "booking-1",
    expert: featuredExperts[0],
    specialty: "Startup Advisor",
    dayOffset: 0,
    startHour: 10,
    startMinute: 0,
    durationMinutes: 60,
    status: "confirmed",
  },
  {
    id: "booking-2",
    expert: featuredExperts[4],
    specialty: "Growth Strategist",
    dayOffset: daysUntilFriday(),
    startHour: 15,
    startMinute: 30,
    durationMinutes: 30,
    status: "pending",
  },
  {
    id: "booking-3",
    expert: featuredExperts[2],
    specialty: "Tax & Finance",
    dayOffset: 0,
    startHour: 10,
    startMinute: 30,
    durationMinutes: 45,
    status: "confirmed",
  },
  {
    id: "booking-4",
    expert: featuredExperts[1],
    specialty: "Legal Tech",
    dayOffset: 1,
    startHour: 11,
    startMinute: 30,
    durationMinutes: 30,
    status: "cancelled",
  },
  {
    id: "booking-5",
    expert: featuredExperts[3],
    specialty: "Product Strategy",
    dayOffset: 4,
    startHour: 16,
    startMinute: 0,
    durationMinutes: 45,
    status: "confirmed",
  },
  {
    id: "booking-6",
    expert: featuredExperts[5],
    specialty: "Cybersecurity & Risk",
    dayOffset: -2,
    startHour: 14,
    startMinute: 30,
    durationMinutes: 60,
    status: "completed",
  },
  {
    id: "booking-7",
    expert: featuredExperts[6],
    specialty: "AI & Machine Learning",
    dayOffset: -7,
    startHour: 10,
    startMinute: 0,
    durationMinutes: 45,
    status: "completed",
  },
  {
    id: "booking-8",
    expert: featuredExperts[0],
    specialty: "Venture Capital & Pitch Deck",
    dayOffset: -22,
    startHour: 17,
    startMinute: 0,
    durationMinutes: 30,
    status: "completed",
  },
  {
    id: "booking-9",
    expert: featuredExperts[1],
    specialty: "Strategy & Advisory",
    dayOffset: 12,
    startHour: 11,
    startMinute: 0,
    durationMinutes: 45,
    status: "pending",
  },
];

const CONSULTATION_DISPLAY: Record<ConsultationType, string> = {
  text: "Text Messaging",
  video: "1:1 Video Call",
  shoutout: "Video Shoutout",
  group: "Group Session",
};

export function formatBookingDateKey(dayOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const dayStr = String(date.getDate()).padStart(2, "0");
  const monthStr = date.toLocaleDateString("en-IN", { month: "short" }).toLowerCase();
  const yearStr = date.getFullYear();
  return `${dayStr} ${monthStr} ${yearStr}`;
}

export function getBookingDateObject(dayOffset: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date;
}

function formatPlacedOn(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatScheduledDate(dayOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const formatted = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (dayOffset === 0) return `Today, ${formatted}`;
  if (dayOffset === 1) return `Tomorrow, ${formatted}`;

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatScheduledTimeRange(
  startHour: number,
  startMinute: number,
  durationMinutes: number
): string {
  const start = new Date();
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationMinutes);

  const format = (value: Date) =>
    value.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

  return `${format(start)} - ${format(end)} (IST)`;
}

function formatDurationLabel(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} Hour${hours > 1 ? "s" : ""}`;
  }
  return `${minutes} Minutes`;
}

function buildBookingDetail(
  booking: CalendarBooking,
  options: {
    referenceId: string;
    consultationType: ConsultationType;
    placedDaysAgo: number;
    walletApplied: number;
    invoiceId: string;
    subject: string;
    context: string;
    attachments: BookingAttachment[];
  }
): BookingDetail {
  const consultationFee = getConsultationPrice(booking.expert.price, options.consultationType);
  const breakdown = calculateBookingTotal(
    consultationFee,
    options.walletApplied + 500,
    options.walletApplied > 0
  );

  return {
    ...booking,
    referenceId: options.referenceId,
    consultationType: options.consultationType,
    consultationLabel: CONSULTATION_DISPLAY[options.consultationType],
    placedOnLabel: formatPlacedOn(options.placedDaysAgo),
    placedDaysAgo: options.placedDaysAgo,
    scheduledDateLabel: formatScheduledDate(booking.dayOffset),
    scheduledTimeLabel: formatScheduledTimeRange(
      booking.startHour,
      booking.startMinute,
      booking.durationMinutes
    ),
    durationLabel: formatDurationLabel(booking.durationMinutes),
    paymentStatus: booking.status === "confirmed" || booking.status === "completed" ? "paid" : "pending",
    consultationFee: breakdown.consultationFee,
    platformFee: breakdown.platformFee,
    gst: breakdown.gst,
    walletApplied: breakdown.walletApplied,
    totalPaid: breakdown.total,
    invoiceId: options.invoiceId,
    subject: options.subject,
    context: options.context,
    attachments: options.attachments,
    calendarUrl: buildGoogleCalendarUrl({
      expertName: booking.expert.name,
      dateId: `date-${booking.dayOffset}`,
      slotTime: (() => {
        const start = new Date();
        start.setHours(booking.startHour, booking.startMinute, 0, 0);
        return start.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
      })(),
      bookingId: options.invoiceId,
    }),
  };
}

export const BOOKING_DETAILS: BookingDetail[] = [
  buildBookingDetail(UPCOMING_BOOKINGS[0], {
    referenceId: "BK-98274",
    consultationType: "video",
    placedDaysAgo: 2,
    walletApplied: 1250,
    invoiceId: "JTY-20261022-98274",
    subject: "Seed round term sheet guidance",
    context:
      "I am raising a seed round for my SaaS startup and need help structuring the term sheet. Specifically looking for advice on valuation caps, pro-rata rights, and board seat negotiations with early-stage micro-VCs.",
    attachments: [
      { name: "Draft_Term_Sheet_v2.pdf", size: "2.4 MB", kind: "pdf" },
    ],
  }),
  buildBookingDetail(UPCOMING_BOOKINGS[1], {
    referenceId: "BK-98275",
    consultationType: "video",
    placedDaysAgo: 1,
    walletApplied: 0,
    invoiceId: "JTY-20261023-98275",
    subject: "D2C retention strategy review",
    context:
      "We are spending heavily on paid acquisition but retention drops after month two. I want a recorded walkthrough of retention loops we can test before the next funding milestone.",
    attachments: [],
  }),
  buildBookingDetail(UPCOMING_BOOKINGS[2], {
    referenceId: "BK-98276",
    consultationType: "text",
    placedDaysAgo: 3,
    walletApplied: 450,
    invoiceId: "JTY-20261021-98276",
    subject: "GST filing for creator income",
    context:
      "I earn from brand deals and affiliate income as a solo creator. Need clarity on GST registration thresholds, quarterly filing, and how to treat mixed business and personal expenses.",
    attachments: [
      { name: "Income_Summary_Q3.xlsx", size: "840 KB", kind: "docx" },
    ],
  }),
  buildBookingDetail(UPCOMING_BOOKINGS[3], {
    referenceId: "BK-98277",
    consultationType: "text",
    placedDaysAgo: 4,
    walletApplied: 0,
    invoiceId: "JTY-20261020-98277",
    subject: "Trademark registration process",
    context:
      "I need guidance on registering a trademark for my new brand name. What are the documents required and how long does the process typically take?",
    attachments: [],
  }),
  buildBookingDetail(UPCOMING_BOOKINGS[4], {
    referenceId: "BK-98278",
    consultationType: "video",
    placedDaysAgo: 1,
    walletApplied: 0,
    invoiceId: "JTY-20261024-98278",
    subject: "Product roadmap & architecture review",
    context:
      "Looking for feedback on scaling our backend microservices and prioritizing feature releases for Q3.",
    attachments: [],
  }),
  buildBookingDetail(UPCOMING_BOOKINGS[5], {
    referenceId: "BK-98279",
    consultationType: "video",
    placedDaysAgo: 4,
    walletApplied: 500,
    invoiceId: "JTY-20260727-98279",
    subject: "SOC2 Compliance & Security Hardening",
    context:
      "Reviewing our AWS cloud security posture and preparation for SOC2 Type II audit.",
    attachments: [],
  }),
  buildBookingDetail(UPCOMING_BOOKINGS[6], {
    referenceId: "BK-98280",
    consultationType: "text",
    placedDaysAgo: 9,
    walletApplied: 0,
    invoiceId: "JTY-20260722-98280",
    subject: "LLM Fine-tuning & RAG Architecture",
    context:
      "Discussion on vector embeddings, chunking strategies, and hybrid retrieval with PGVector.",
    attachments: [],
  }),
  buildBookingDetail(UPCOMING_BOOKINGS[7], {
    referenceId: "BK-98281",
    consultationType: "video",
    placedDaysAgo: 24,
    walletApplied: 0,
    invoiceId: "JTY-20260707-98281",
    subject: "VC Deck Advisory",
    context:
      "Initial feedback on financial projections and cap table structure for pre-seed round.",
    attachments: [],
  }),
  buildBookingDetail(UPCOMING_BOOKINGS[8], {
    referenceId: "BK-98282",
    consultationType: "video",
    placedDaysAgo: 0,
    walletApplied: 0,
    invoiceId: "JTY-20260810-98282",
    subject: "Strategy & Advisory Session",
    context:
      "Faraway consultation scheduled for deep dive into product roadmap and market positioning.",
    attachments: [],
  }),
];

export function getBookingById(id: string): BookingDetail | undefined {
  const found = BOOKING_DETAILS.find((booking) => booking.id === id);
  if (found) return found;

  return {
    id,
    referenceId: `BK-${id.slice(0, 5).toUpperCase()}`,
    expert: featuredExperts[0],
    specialty: "Consultation",
    dayOffset: 0,
    startHour: 18,
    startMinute: 30,
    durationMinutes: 30,
    status: "pending",
    consultationType: "video",
    consultationLabel: "1:1 Video Call",
    placedOnLabel: "Recently",
    placedDaysAgo: 0,
    scheduledDateLabel: "Today",
    scheduledTimeLabel: "06:30 PM - 07:00 PM (IST)",
    durationLabel: "30 Minutes",
    paymentStatus: "paid",
    consultationFee: 500,
    platformFee: 0,
    gst: 90,
    walletApplied: 0,
    totalPaid: 590,
    invoiceId: `JTY-${id.slice(0, 8).toUpperCase()}`,
    calendarUrl: "#",
    subject: "Consultation Session",
    context: "Session details",
    attachments: [],
  };
}

export function getBookingDetailHref(id: string): string {
  return `/seeker/bookings/${id}`;
}

export const RECOMMENDED_EXPERTS = featuredExperts.slice(0, 3);

export const SAVED_EXPERTS: SavedExpertEntry[] = [
  { expert: featuredExperts[6], rating: 4.7 },
  { expert: featuredExperts[1], rating: 4.9 },
  { expert: featuredExperts[4], rating: 4.8 },
];

export const EXPERT_UPDATES: ExpertUpdate[] = [
  {
    id: "update-1",
    expert: featuredExperts[0],
    timeAgo: "2h ago",
    text: "Just published a guide on seed round valuation for Indian SaaS startups. Book a session if you want personalized feedback.",
  },
  {
    id: "update-2",
    expert: featuredExperts[2],
    timeAgo: "5h ago",
    text: "New slots open this week for GST and creator income planning consultations.",
  },
  {
    id: "update-3",
    expert: featuredExperts[4],
    timeAgo: "1d ago",
    text: "Shared a framework for D2C retention loops — useful if you're scaling paid acquisition.",
  },
];

export const SEEKER_NOTIFICATIONS: SeekerNotification[] = [
  {
    id: "notif-1",
    title: "Session confirmed",
    body: "Your call with Rahul Mehta is confirmed for tomorrow at 10:00 AM.",
    timeAgo: "30m ago",
    unread: true,
    href: "/seeker/bookings/booking-1",
    expert: featuredExperts[0],
  },
  {
    id: "notif-2",
    title: "New message",
    body: "Ananya Kapoor replied to your question about GST filing.",
    timeAgo: "2h ago",
    unread: true,
    href: "/seeker/dashboard#messages",
    expert: featuredExperts[2],
  },
  {
    id: "notif-3",
    title: "Booking reminder",
    body: "Your session with Vikram Singh starts in 24 hours.",
    timeAgo: "5h ago",
    unread: true,
    href: "/seeker/bookings/booking-1",
    expert: featuredExperts[4],
  },
  {
    id: "notif-4",
    title: "Expert update",
    body: "Priya Nair shared a new guide on D2C retention loops.",
    timeAgo: "1d ago",
    unread: false,
    expert: featuredExperts[4],
  },
  {
    id: "notif-5",
    title: "Wallet credited",
    body: "₹500 added to your wallet. Ready for your next consultation.",
    timeAgo: "2d ago",
    unread: false,
  },
];

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function getExpertHref(expert: Expert): string {
  return getExpertDetailHref(expert, { seeker: true });
}

export function getPokeState(bookingId: string): { count: number; lastPokedAt: number | null } {
  if (typeof window === "undefined") {
    return { count: 0, lastPokedAt: null };
  }
  try {
    const raw = sessionStorage.getItem(`poke_state_${bookingId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.count === "number") {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to read poke state from sessionStorage", e);
  }
  return { count: 0, lastPokedAt: null };
}

export function savePokeState(bookingId: string, count: number, lastPokedAt: number | null): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`poke_state_${bookingId}`, JSON.stringify({ count, lastPokedAt }));
  } catch (e) {
    console.error("Failed to save poke state to sessionStorage", e);
  }
}

export async function getSeekerBookingsAsync(params?: { status?: string; page?: number; limit?: number; sort?: string }) {
  const { fetchSeekerBookings } = await import("./seekerBookingApi");
  try {
    return await fetchSeekerBookings(params);
  } catch {
    const status = params?.status || "all";
    let filtered = status === "all" ? UPCOMING_BOOKINGS : UPCOMING_BOOKINGS.filter((b) => b.status === status);
    return {
      bookings: filtered as any[],
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: filtered.length,
        totalPages: 1,
      },
    };
  }
}

export async function getSeekerBookingDetailAsync(bookingId: string) {
  const { fetchBooking } = await import("./seekerBookingApi");
  try {
    const res = await fetchBooking(bookingId);
    if (res) return res;
  } catch {
    // Fallback to local mock data
  }
  return getBookingById(bookingId);
}

