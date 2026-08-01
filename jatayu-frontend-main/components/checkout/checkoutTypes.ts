import type { ReactNode } from "react";
import type { Expert } from "@/lib/experts";
import type { ConsultationType } from "@/lib/booking";
import { Smartphone, CreditCard, Building2 } from "lucide-react";

export type CheckoutProps = {
  expert: Expert;
  seeker?: boolean;
};

export const BOOKING_STEPS = [
  "Consultation Type",
  "Your Question",
  "Pick Slot",
  "Payment",
  "Confirm",
] as const;

export const PAYMENT_ICON_CLASSES = {
  paymentIconUpi: "paymentIconUpi",
  paymentIconCard: "paymentIconCard",
  paymentIconBank: "paymentIconBank",
} as const;

export const PAYMENT_METHODS = [
  {
    id: "upi" as const,
    title: "UPI",
    hint: "Google Pay, PhonePe, Paytm, or any UPI ID",
    icon: Smartphone,
    iconClass: PAYMENT_ICON_CLASSES.paymentIconUpi,
  },
  {
    id: "card" as const,
    title: "Debit / Credit Card",
    hint: "Visa, Mastercard, RuPay",
    icon: CreditCard,
    iconClass: PAYMENT_ICON_CLASSES.paymentIconCard,
  },
  {
    id: "netbanking" as const,
    title: "Net Banking",
    hint: "All major banks supported",
    icon: Building2,
    iconClass: PAYMENT_ICON_CLASSES.paymentIconBank,
  },
];

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export const MIN_CONTEXT_LENGTH = 3;
export const MAX_CONTEXT_LENGTH = 1000;

export const CONTEXT_IMPROVEMENT_STYLES = [
  { id: "professional", label: "More Professional" },
  { id: "casual", label: "Casual" },
  { id: "concise", label: "More Concise" },
] as const;

export type ContextImprovementStyleId = (typeof CONTEXT_IMPROVEMENT_STYLES)[number]["id"];

export const DEFAULT_CONTEXT_IMPROVE_HINT =
  "Choose your Goal or describe your challenges and questions";

export const CHECKOUT_OTP_LENGTH = 6;
export const CHECKOUT_OTP_RESEND_SECONDS = 24;

export type CheckoutRegistrationFieldKey =
  | "firstName"
  | "lastName"
  | "email"
  | "phoneNumber"
  | "password";

export type CheckoutRegistrationValues = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
};

export const CHECKOUT_REGISTRATION_FIELDS: CheckoutRegistrationFieldKey[] = [
  "firstName",
  "lastName",
  "email",
  "phoneNumber",
  "password",
];

export const CHECKOUT_REGISTRATION_TOUCHED_DEFAULT: Record<CheckoutRegistrationFieldKey, boolean> = {
  firstName: false,
  lastName: false,
  email: false,
  phoneNumber: false,
  password: false,
};
