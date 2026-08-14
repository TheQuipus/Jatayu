import type { RazorpayCheckoutResult } from "@/lib/seekerBookingApi";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Razorpay Checkout")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout"));
    document.body.appendChild(script);
  });
}

async function fetchKeyId(): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/payments/razorpay/config`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !(data as { keyId?: string }).keyId) throw new Error("Razorpay is not configured");
  return (data as { keyId: string }).keyId;
}

export async function openRazorpayCheckout(options: {
  order: { id: string; amount: number; currency: string };
  expertName: string;
  userName: string;
  userEmail: string;
  userPhone: string;
}): Promise<RazorpayCheckoutResult> {
  const [, keyId] = await Promise.all([loadRazorpayScript(), fetchKeyId()]);
  const RazorpayConstructor = window.Razorpay;
  if (!RazorpayConstructor) throw new Error("Razorpay Checkout is unavailable");

  return new Promise((resolve, reject) => {
    const checkout = new RazorpayConstructor({
      key: keyId,
      order_id: options.order.id,
      amount: options.order.amount,
      currency: options.order.currency,
      name: "Jatayu",
      description: `Consultation with ${options.expertName}`,
      prefill: { name: options.userName, email: options.userEmail, contact: options.userPhone },
      theme: { color: "#0f172a" },
      handler: (response: RazorpayCheckoutResult) => resolve(response),
      modal: { ondismiss: () => reject(new Error("Payment was cancelled")) },
    });
    checkout.open();
  });
}
