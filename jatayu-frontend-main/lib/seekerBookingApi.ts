import { getToken } from "@/lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
  consultationFee: number; platformFee: number; gst: number; creditAmount: number;
  total: number; payable: number; currency: string; unit: "paise";
};
export type SeekerBooking = {
  id: string; status: string; paymentStatus: string; scheduledStartAt: string;
  scheduledEndAt: string; timezone: string; creditsUsed: number; amounts: BookingAmounts;
};
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
  return response.booking;
}

export async function fetchBooking(bookingId: string) {
  const response = await bookingFetch<{ booking: SeekerBooking }>(
    `/api/seeker/bookings/${encodeURIComponent(bookingId)}`,
  );
  return response.booking;
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
  const key = `booking-${crypto.randomUUID()}`;
  sessionStorage.setItem(storageKey, key);
  return key;
}

export function clearBookingIdempotencyKey(fingerprint: string) {
  sessionStorage.removeItem(`booking-idempotency:${fingerprint}`);
}
