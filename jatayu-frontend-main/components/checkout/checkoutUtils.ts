import { getEmailValidationError } from "@/lib/emailValidation";
import { buildPasswordContext } from "@/lib/passwordValidation";
import {
  PAYMENT_METHODS,
  DEFAULT_CONTEXT_IMPROVE_HINT,
  CHECKOUT_REGISTRATION_FIELDS,
  type PaymentMethodId,
  type ContextImprovementStyleId,
  type CheckoutRegistrationFieldKey,
  type CheckoutRegistrationValues,
} from "./checkoutTypes";

export function getPaymentMethodLabel(method: PaymentMethodId | null): string {
  return PAYMENT_METHODS.find((item) => item.id === method)?.title ?? "Not selected";
}

export function getImprovedContextText(
  styleId: ContextImprovementStyleId,
  current: string
): string {
  const trimmed = current.trim();
  if (!trimmed) return current;

  const profPrefix = "I am seeking expert guidance on the following challenge:\n";
  const casualPrefix = "Hey! I'd love help with this:\n";

  let baseText = trimmed;
  if (baseText.startsWith(profPrefix)) {
    baseText = baseText.slice(profPrefix.length).trim();
  } else if (baseText.startsWith(casualPrefix)) {
    baseText = baseText.slice(casualPrefix.length).trim();
  }

  if (styleId === "professional") {
    return `${profPrefix}${baseText}`;
  }

  if (styleId === "casual") {
    return `${casualPrefix}${baseText}`;
  }

  const sentences = baseText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences.slice(0, 2).join(" ");
}

export function getContextImprovementHint(
  styleId: ContextImprovementStyleId | null,
  currentText: string
): string {
  if (!styleId || !currentText.trim()) {
    return DEFAULT_CONTEXT_IMPROVE_HINT;
  }

  return getImprovedContextText(styleId, currentText.trim());
}

export function maskCheckoutPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last3 = digits.slice(-3) || "444";
  return `+91 XXXXXXX${last3}`;
}

export function maskCheckoutEmail(email: string): string {
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf("@");
  if (atIndex <= 0) return trimmed;

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  if (local.length <= 2) {
    return `${local[0] ?? ""}***@${domain}`;
  }
  return `${local.slice(0, 2)}***@${domain}`;
}

export function formatCurrency(amount: number): string {
  return `₹ ${amount.toLocaleString("en-IN")}`;
}

export function formatSessions(sessionsCompleted?: string): string {
  if (!sessionsCompleted) return "1.2k sessions";
  const match = sessionsCompleted.match(/(\d+)/);
  if (!match) return sessionsCompleted.toLowerCase();
  const count = Number(match[1]);
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k sessions`;
  return `${count} sessions`;
}

export function formatExperience(role: string): string {
  const match = role.match(/(\d+)\+?\s*yrs?/i);
  if (match) return `${match[1]} yrs`;
  return "12 yrs";
}

export function shortTopicLabel(topic: string): string {
  const map: Record<string, string> = {
    "Startup & Fundraising": "Startup",
    "Career & Jobs": "Career",
    "Legal & Compliance": "Legal",
    "Tax & Finance": "Finance",
    "Education & Admissions": "Education",
    "SMB Growth": "Growth",
    "Creator Access": "Creator",
    "Enterprise Learning": "Enterprise",
  };
  return map[topic] ?? topic.split(" ")[0];
}

export function getCheckoutRegistrationFieldError(
  field: CheckoutRegistrationFieldKey,
  values: CheckoutRegistrationValues
): string | null {
  const { firstName, lastName, email, phoneNumber, password } = values;

  switch (field) {
    case "firstName":
      if (!firstName.trim()) return "Required";
      if (firstName.trim().length < 2) return "Too short";
      return null;
    case "lastName":
      if (!lastName.trim()) return "Required";
      if (lastName.trim().length < 2) return "Too short";
      return null;
    case "email":
      return getEmailValidationError(email);
    case "phoneNumber": {
      const digits = phoneNumber.replace(/\D/g, "");
      if (!digits) return "Required";
      if (digits.length !== 10) return "Enter a 10-digit number";
      return null;
    }
    case "password":
      if (!password) return "Required";
      if (password.length < 6) return "At least 6 characters";
      return null;
    default:
      return null;
  }
}

export function isCheckoutRegistrationComplete(values: CheckoutRegistrationValues): boolean {
  return CHECKOUT_REGISTRATION_FIELDS.every(
    (field) => !getCheckoutRegistrationFieldError(field, values)
  );
}

export function isValidUpiId(upiId: string): boolean {
  const trimmed = upiId.trim();
  if (!trimmed.includes("@")) return false;
  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;
  const [handle, provider] = parts;
  return (handle?.length ?? 0) >= 2 && (provider?.length ?? 0) >= 2;
}

export function formatCardNumber(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function detectCardNetwork(cardNumber: string): "visa" | "mastercard" | "rupay" | "amex" | "generic" {
  const digits = cardNumber.replace(/\D/g, "");
  if (!digits) return "generic";
  if (digits.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "mastercard";
  if (/^(60|65|353|356)/.test(digits)) return "rupay";
  if (/^3[47]/.test(digits)) return "amex";
  return "generic";
}

export function formatCardExpiry(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

export function isValidCardExpiry(expiry: string): boolean {
  const digits = expiry.replace(/\D/g, "");
  if (digits.length !== 4) return false;
  const month = parseInt(digits.slice(0, 2), 10);
  const year = parseInt(digits.slice(2), 10);
  if (month < 1 || month > 12) return false;
  return year >= 24 && year <= 45;
}

export function getDetailedPaymentMethodLabel(
  method: PaymentMethodId | null,
  details?: {
    upi?: { mode: string; upiId: string; selectedApp: string };
    card?: { cardNumber: string; saveCard: boolean };
    netbanking?: { bankId: string };
  }
): string {
  if (!method) return "Not selected";
  if (method === "upi") {
    if (details?.upi?.mode === "qr") {
      return "UPI (QR Code Scan)";
    }
    if (details?.upi?.upiId) {
      return `UPI (${details.upi.upiId.trim()})`;
    }
    const appNames: Record<string, string> = {
      gpay: "Google Pay",
      phonepe: "PhonePe",
      paytm: "Paytm UPI",
      bhim: "BHIM",
      cred: "CRED UPI",
    };
    const app = details?.upi?.selectedApp ? appNames[details.upi.selectedApp] : null;
    return app ? `UPI (${app})` : "UPI";
  }
  if (method === "card") {
    const rawCard = details?.card?.cardNumber?.replace(/\D/g, "") ?? "";
    if (rawCard.length >= 4) {
      const network = detectCardNetwork(rawCard).toUpperCase();
      const last4 = rawCard.slice(-4);
      return `${network !== "GENERIC" ? network : "Card"} ending in •••• ${last4}`;
    }
    return "Debit / Credit Card";
  }
  if (method === "netbanking") {
    const bankMap: Record<string, string> = {
      hdfc: "HDFC Bank",
      icici: "ICICI Bank",
      sbi: "State Bank of India",
      axis: "Axis Bank",
      kotak: "Kotak Mahindra Bank",
      pnb: "Punjab National Bank",
      bob: "Bank of Baroda",
      canara: "Canara Bank",
      union: "Union Bank of India",
      indusind: "IndusInd Bank",
      idfc: "IDFC FIRST Bank",
      federal: "Federal Bank",
      yes: "YES Bank",
    };
    const bankName = details?.netbanking?.bankId ? bankMap[details.netbanking.bankId] : null;
    return bankName ? `Net Banking (${bankName})` : "Net Banking";
  }
  return getPaymentMethodLabel(method);
}

