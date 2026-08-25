import { getToken } from "@/lib/api";
import { generateUUID } from "@/lib/uuid";
import type { CalendarBooking, BookingDetail } from "@/lib/seekerDashboard";
import type { ExpertiseTag } from "@/lib/experts";
import type { ConsultationType } from "@/lib/booking";
import { publicApiBase } from "@/lib/publicApiBase";
import { parseUtcDate, formatUtcToLocalDate, formatUtcToLocalTime } from "@/lib/dateTimeUtils";

const BASE_URL = publicApiBase();

export type BookingAvailability = { id: string; days: string[]; fromTime: string; toTime: string };
export type BookingOptions = {
  expertId: string;
  timezone: string;
  slotDurationMinutes: number;
  formats: string[];
  formatPrices: Record<string, string | number>;
  availabilities: BookingAvailability[];
  occupiedSlots: { startAt: string; endAt: string }[];
};
export type BookingAmounts = {
  consultationFee: number;
  platformFee: number;
  gst: number;
  creditAmount: number;
  total: number;
  payable: number;
  currency: string;
  unit: "paise" | "rupees" | string;
};

export type SeekerBookingPayment = {
  id: string;
  bookingId: string;
  provider: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  amount: number;
  currency: string;
  status: string;
  verifiedAt?: string | null;
  paidAt?: string | null;
  razorpayRefundId?: string | null;
  refundStatus?: string | null;
  refundedAmount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type SeekerBooking = {
  id: string;
  seekerId?: string;
  expertId?: string;
  status: string;
  consultationType?: string;
  subject?: string;
  context?: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  timezone?: string;
  expertName?: string;
  expertProfessionalTitle?: string;
  expertProfilePhotoSrc?: string;
  consultationFee?: number;
  platformFee?: number;
  gst?: number;
  creditsUsed?: number;
  creditAmount?: number;
  totalAmount?: number;
  payableAmount?: number;
  currency?: string;
  paymentStatus: string;
  expertRequestedAt?: string | null;
  expertRespondedAt?: string | null;
  declineReasonCode?: string | null;
  declineReasonNotes?: string | null;
  confirmedAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  payments?: SeekerBookingPayment[];
  refundStatus?: string | null;
  amounts?: BookingAmounts;
};

export function normalizeSeekerBooking(item: Record<string, unknown>): SeekerBooking {
  const amountsObj = (item.amounts || {}) as Record<string, unknown>;

  return {
    id: String(item.id || item._id || ""),
    seekerId: item.seekerId ? String(item.seekerId) : undefined,
    expertId: item.expertId ? String(item.expertId) : undefined,
    status: String(item.status || "awaiting_expert"),
    consultationType: item.consultationType ? String(item.consultationType) : "video",
    subject: item.subject ? String(item.subject) : item.topic ? String(item.topic) : "Consultation",
    context: item.context ? String(item.context) : item.description ? String(item.description) : "",
    scheduledStartAt: String(item.scheduledStartAt || new Date().toISOString()),
    scheduledEndAt: String(item.scheduledEndAt || new Date(Date.now() + 30 * 60000).toISOString()),
    timezone: String(item.timezone || "Asia/Calcutta"),
    expertName: String(item.expertName || "Expert"),
    expertProfessionalTitle: item.expertProfessionalTitle ? String(item.expertProfessionalTitle) : "Expert Advisor",
    expertProfilePhotoSrc: item.expertProfilePhotoSrc ? String(item.expertProfilePhotoSrc) : "/assets/img/avatar1.png",
    consultationFee: typeof item.consultationFee === "number" ? item.consultationFee : 0,
    platformFee: typeof item.platformFee === "number" ? item.platformFee : 0,
    gst: typeof item.gst === "number" ? item.gst : 0,
    creditsUsed: typeof item.creditsUsed === "number" ? item.creditsUsed : 0,
    creditAmount: typeof item.creditAmount === "number" ? item.creditAmount : 0,
    totalAmount: typeof item.totalAmount === "number" ? item.totalAmount : 0,
    payableAmount: typeof item.payableAmount === "number" ? item.payableAmount : 0,
    currency: String(item.currency || "INR"),
    paymentStatus: String(item.paymentStatus || "paid"),
    expertRequestedAt: item.expertRequestedAt ? String(item.expertRequestedAt) : null,
    expertRespondedAt: item.expertRespondedAt ? String(item.expertRespondedAt) : null,
    declineReasonCode: item.declineReasonCode ? String(item.declineReasonCode) : null,
    declineReasonNotes: item.declineReasonNotes ? String(item.declineReasonNotes) : null,
    confirmedAt: item.confirmedAt ? String(item.confirmedAt) : null,
    expiresAt: item.expiresAt ? String(item.expiresAt) : null,
    createdAt: item.createdAt ? String(item.createdAt) : new Date().toISOString(),
    updatedAt: item.updatedAt ? String(item.updatedAt) : new Date().toISOString(),
    payments: Array.isArray(item.payments) ? (item.payments as SeekerBookingPayment[]) : undefined,
    refundStatus: item.refundStatus ? String(item.refundStatus) : null,
    amounts: {
      consultationFee: typeof amountsObj.consultationFee === "number" ? amountsObj.consultationFee : 0,
      platformFee: typeof amountsObj.platformFee === "number" ? amountsObj.platformFee : 0,
      gst: typeof amountsObj.gst === "number" ? amountsObj.gst : 0,
      creditAmount: typeof amountsObj.creditAmount === "number" ? amountsObj.creditAmount : 0,
      total: typeof amountsObj.total === "number" ? amountsObj.total : 0,
      payable: typeof amountsObj.payable === "number" ? amountsObj.payable : 0,
      currency: String(amountsObj.currency || "INR"),
      unit: String(amountsObj.unit || "paise"),
    },
  };
}
export type CreateBookingResponse = {
  booking: SeekerBooking;
  checkoutRequired: boolean;
  razorpayOrder: { id: string; amount: number; currency: string } | null;
  reused: boolean;
};
export type RazorpayCheckoutResult = {
  razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string;
};

async function bookingFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Please sign in as a seeker before booking.");
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { message?: string }).message || "Booking request failed");
  return data as T;
}

export async function fetchBookingOptions(expertId: string): Promise<BookingOptions> {
  const response = await bookingFetch<{ bookingOptions: BookingOptions }>(
    `/api/seeker/experts/${encodeURIComponent(expertId)}/booking-options?days=28`,
  );
  return response.bookingOptions;
}

export function createBookingOrder(input: {
  expertId: string; consultationType: string; subject: string; context: string;
  scheduledStartAt: string; useCredits: boolean; idempotencyKey: string;
}): Promise<CreateBookingResponse> {
  return bookingFetch<CreateBookingResponse>("/api/seeker/bookings/orders", {
    method: "POST", body: JSON.stringify(input),
  });
}

export async function verifyBookingPayment(bookingId: string, payment: RazorpayCheckoutResult) {
  const response = await bookingFetch<{ booking: SeekerBooking }>(
    `/api/seeker/bookings/${encodeURIComponent(bookingId)}/verify-payment`,
    { method: "POST", body: JSON.stringify({
      razorpayOrderId: payment.razorpay_order_id,
      razorpayPaymentId: payment.razorpay_payment_id,
      razorpaySignature: payment.razorpay_signature,
    }) },
  );
  return response.booking
    ? normalizeSeekerBooking(response.booking as unknown as Record<string, unknown>)
    : ({} as SeekerBooking);
}

export type SeekerBookingsQueryParams = {
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
};

export type SeekerBookingsResponse = {
  bookings: SeekerBooking[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
};

export async function fetchSeekerBookings(params: SeekerBookingsQueryParams = {}): Promise<SeekerBookingsResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.sort) query.set("sort", params.sort);

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const res = await bookingFetch<Record<string, unknown>>(`/api/seeker/bookings${queryString}`);

  const rawList = (
    Array.isArray(res.bookings)
      ? res.bookings
      : Array.isArray(res.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : []
  ) as Record<string, unknown>[];

  const bookings = rawList.map((item) => normalizeSeekerBooking(item));

  const paginationRaw = (res.pagination || {}) as Record<string, unknown>;
  const totalPages =
    typeof paginationRaw.totalPages === "number"
      ? paginationRaw.totalPages
      : typeof paginationRaw.pages === "number"
      ? (paginationRaw.pages as number)
      : Math.ceil(bookings.length / (params.limit || 20)) || 1;

  const pagination = {
    page: Number(paginationRaw.page) || params.page || 1,
    limit: Number(paginationRaw.limit) || params.limit || 20,
    total: typeof paginationRaw.total === "number" ? paginationRaw.total : bookings.length,
    totalPages,
    hasNextPage:
      typeof paginationRaw.hasNextPage === "boolean"
        ? paginationRaw.hasNextPage
        : (params.page || 1) < totalPages,
    hasPreviousPage:
      typeof paginationRaw.hasPreviousPage === "boolean"
        ? paginationRaw.hasPreviousPage
        : (params.page || 1) > 1,
  };

  return {
    bookings,
    pagination,
  };
}

export async function fetchBooking(bookingId: string): Promise<SeekerBooking> {
  const response = await bookingFetch<Record<string, unknown>>(
    `/api/seeker/bookings/${encodeURIComponent(bookingId)}`,
  );
  if (response && typeof response === "object" && "booking" in response && response.booking) {
    return normalizeSeekerBooking(response.booking as Record<string, unknown>);
  }
  return normalizeSeekerBooking(response as Record<string, unknown>);
}

export const getSeekerBookingById = fetchBooking;

export function toCalendarBooking(b: SeekerBooking): CalendarBooking {
  const startDate = parseUtcDate(b.scheduledStartAt) || new Date();
  const endDate = parseUtcDate(b.scheduledEndAt) || new Date(startDate.getTime() + 30 * 60000);
  const now = new Date();

  const dayOffset = Math.round(
    (startDate.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      (24 * 60 * 60 * 1000)
  );
  const durationMinutes =
    !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())
      ? Math.max(15, Math.round((endDate.getTime() - startDate.getTime()) / 60000))
      : 30;

  const rawStatus = (b.status || "awaiting_expert").toLowerCase();
  const status: "confirmed" | "pending" | "cancelled" | "completed" =
    rawStatus === "confirmed" || rawStatus === "accepted"
      ? "confirmed"
      : rawStatus === "cancelled" || rawStatus === "declined"
      ? "cancelled"
      : rawStatus === "completed"
      ? "completed"
      : "pending";

  return {
    id: b.id,
    expert: {
      id: b.expertId || b.id,
      name: b.expertName || "Expert",
      role: b.expertProfessionalTitle || "Expert Advisor",
      image: b.expertProfilePhotoSrc || "/assets/img/avatar1.png",
      rating: 4.9,
      price: b.totalAmount || 500,
      replyTime: "Within 2 hours",
      reviewsCount: 24,
      desc: b.context || "",
      category: "Career & Jobs",
      topics: ["Career & Jobs" as ExpertiseTag],
      languages: ["English"],
    },
    specialty: b.subject || "Consultation",
    dayOffset,
    startHour: !isNaN(startDate.getTime()) ? startDate.getHours() : 18,
    startMinute: !isNaN(startDate.getTime()) ? startDate.getMinutes() : 30,
    durationMinutes,
    status,
    createdAt: b.createdAt,
  };
}

export function toBookingDetail(b: SeekerBooking): BookingDetail {
  const baseCalendar = toCalendarBooking(b);
  const startDate = parseUtcDate(b.scheduledStartAt);
  const createdAtDate = parseUtcDate(b.createdAt) || new Date();

  const formattedDate = formatUtcToLocalDate(startDate);
  const formattedTime = formatUtcToLocalTime(startDate);
  const placedOn = formatUtcToLocalDate(createdAtDate, { month: "short", day: "numeric", year: "numeric" });

  const placedDaysAgo = !isNaN(createdAtDate.getTime())
    ? Math.max(0, Math.floor((Date.now() - createdAtDate.getTime()) / (24 * 60 * 60 * 1000)))
    : 0;

  const rawType = (b.consultationType || "video").toLowerCase();
  const consultationType: ConsultationType =
    rawType === "text" || rawType === "chat"
      ? "text"
      : rawType === "shoutout" || rawType === "audio"
      ? "shoutout"
      : rawType === "group"
      ? "group"
      : "video";

  const consultationLabel =
    rawType === "audio"
      ? "Audio Call"
      : rawType === "chat" || rawType === "text"
      ? "1:1 Chat"
      : rawType === "shoutout"
      ? "Video Shoutout"
      : "Video Call";

  return {
    ...baseCalendar,
    referenceId: `REF-${b.id.slice(0, 8).toUpperCase()}`,
    consultationType,
    consultationLabel,
    placedOnLabel: placedOn,
    scheduledDateLabel: formattedDate,
    scheduledTimeLabel: formattedTime,
    durationLabel: `${baseCalendar.durationMinutes} minutes`,
    paymentStatus: b.paymentStatus === "paid" ? "paid" : "pending",
    consultationFee: b.consultationFee || b.totalAmount || 0,
    platformFee: b.platformFee || 0,
    gst: b.gst || 0,
    walletApplied: b.creditAmount || b.creditsUsed || 0,
    totalPaid: b.payableAmount || b.totalAmount || 0,
    invoiceId: `INV-${b.id.slice(0, 8).toUpperCase()}`,
    calendarUrl: "#",
    subject: b.subject || "Consultation Request",
    context: b.context || "No context provided.",
    attachments: [],
    placedDaysAgo,
    cancellationReason: b.declineReasonNotes || b.declineReasonCode || undefined,
  };
}

export async function getSeekerBookingDetailApi(bookingId: string): Promise<BookingDetail | null> {
  try {
    const rawBooking = await fetchBooking(bookingId);
    if (rawBooking && rawBooking.id) {
      return toBookingDetail(rawBooking);
    }
  } catch (err) {
    console.error("Failed to fetch seeker booking detail from API:", err);
  }
  return null;
}



function timeParts(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) throw new Error("Invalid selected slot time");
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (match[3].toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (match[3].toUpperCase() === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

function partsInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));
}

export function buildScheduledStartAt(date: Date, time: string, timezone: string): string {
  const { hour, minute } = timeParts(time);
  const desiredUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
  let result = new Date(desiredUtc);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const zoned = partsInTimezone(result, timezone);
    const representedUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second);
    result = new Date(result.getTime() + desiredUtc - representedUtc);
  }
  return result.toISOString();
}

export function getBookingIdempotencyKey(fingerprint: string): string {
  const storageKey = `booking-idempotency:${fingerprint}`;
  const existing = sessionStorage.getItem(storageKey);
  if (existing) return existing;
  const key = `booking-${generateUUID()}`;
  sessionStorage.setItem(storageKey, key);
  return key;
}

export function clearBookingIdempotencyKey(fingerprint: string) {
  sessionStorage.removeItem(`booking-idempotency:${fingerprint}`);
}
