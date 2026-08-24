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
  "Confirm & Pay",
] as const;

export const PAYMENT_ICON_CLASSES = {
  paymentIconUpi: "paymentIconUpi",
  paymentIconCard: "paymentIconCard",
  paymentIconBank: "paymentIconBank",
} as const;

export type PaymentMethodItem = {
  id: "card" | "netbanking" | "upi";
  title: string;
  hint: string;
  icon: React.ComponentType<{ size?: number }>;
  iconClass: string;
  disabled?: boolean;
};

export const PAYMENT_METHODS: PaymentMethodItem[] = [
  {
    id: "card",
    title: "Credit or debit card",
    hint: "Visa, Mastercard, AMEX, Diners, Maestro, RuPay",
    icon: CreditCard,
    iconClass: PAYMENT_ICON_CLASSES.paymentIconCard,
  },
  {
    id: "netbanking",
    title: "Net Banking",
    hint: "All major banks supported",
    icon: Building2,
    iconClass: PAYMENT_ICON_CLASSES.paymentIconBank,
  },
  {
    id: "upi",
    title: "Scan and Pay with",
    hint: "Scan QR code or use GPay, PhonePe, Paytm",
    icon: Smartphone,
    iconClass: PAYMENT_ICON_CLASSES.paymentIconUpi,
  },
];

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export const MIN_CONTEXT_LENGTH = 3;
export const MAX_CONTEXT_LENGTH = 1000;

import { AI_IMPROVEMENT_STYLES, DEFAULT_AI_IMPROVE_HINT } from "@/lib/aiTextImprovement";

export const CONTEXT_IMPROVEMENT_STYLES = AI_IMPROVEMENT_STYLES;

export type ContextImprovementStyleId = (typeof CONTEXT_IMPROVEMENT_STYLES)[number]["id"];

export const DEFAULT_CONTEXT_IMPROVE_HINT = DEFAULT_AI_IMPROVE_HINT;

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

export type UpiMode = "id" | "app" | "qr";

export type UpiAppItem = {
  id: string;
  name: string;
  badge?: string;
};

export const POPULAR_UPI_APPS: UpiAppItem[] = [
  { id: "gpay", name: "Google Pay", badge: "Fast" },
  { id: "phonepe", name: "PhonePe", badge: "Popular" },
  { id: "paytm", name: "Paytm UPI" },
  { id: "bhim", name: "BHIM" },
  { id: "cred", name: "CRED UPI", badge: "Cashback" },
];

export const COMMON_UPI_HANDLES = [
  "@okaxis",
  "@ybl",
  "@paytm",
  "@ibl",
  "@apl",
  "@oksbi",
  "@icici",
];

export type BankItem = {
  id: string;
  name: string;
  code: string;
  popular?: boolean;
  uptime?: string;
};

export const POPULAR_BANKS: BankItem[] = [
  { id: "hdfc", name: "HDFC Bank", code: "HDFC", popular: true, uptime: "99.9% uptime" },
  { id: "icici", name: "ICICI Bank", code: "ICICI", popular: true, uptime: "99.8% uptime" },
  { id: "sbi", name: "State Bank of India", code: "SBI", popular: true, uptime: "99.5% uptime" },
  { id: "axis", name: "Axis Bank", code: "AXIS", popular: true, uptime: "99.7% uptime" },
  { id: "kotak", name: "Kotak Mahindra Bank", code: "KOTAK", popular: true, uptime: "99.8% uptime" },
  { id: "pnb", name: "Punjab National Bank", code: "PNB", popular: true, uptime: "99.2% uptime" },
];

export const OTHER_BANKS: BankItem[] = [
  { id: "bob", name: "Bank of Baroda", code: "BOB" },
  { id: "canara", name: "Canara Bank", code: "CNRB" },
  { id: "union", name: "Union Bank of India", code: "UBI" },
  { id: "indusind", name: "IndusInd Bank", code: "INDB" },
  { id: "idfc", name: "IDFC FIRST Bank", code: "IDFC" },
  { id: "federal", name: "Federal Bank", code: "FDRL" },
  { id: "yes", name: "YES Bank", code: "YES" },
  { id: "au", name: "AU Small Finance Bank", code: "AUBL" },
  { id: "central", name: "Central Bank of India", code: "CBI" },
  { id: "indian", name: "Indian Bank", code: "IDIB" },
  { id: "uco", name: "UCO Bank", code: "UCO" },
  { id: "dbs", name: "DBS Bank India", code: "DBS" },
  { id: "standard_chartered", name: "Standard Chartered Bank", code: "SCB" },
  { id: "hsbc", name: "HSBC India", code: "HSBC" },
  { id: "citi", name: "Citibank India", code: "CITI" },
  { id: "rbl", name: "RBL Bank", code: "RATN" },
  { id: "bandhan", name: "Bandhan Bank", code: "BDBL" },
  { id: "south_indian", name: "South Indian Bank", code: "SIB" },
  { id: "karur_vysya", name: "Karur Vysya Bank", code: "KVB" },
  { id: "tmb", name: "Tamilnad Mercantile Bank", code: "TMB" },
  { id: "karnataka", name: "Karnataka Bank", code: "KBL" },
  { id: "j_and_k", name: "Jammu & Kashmir Bank", code: "JKB" },
  { id: "psb", name: "Punjab & Sind Bank", code: "PSB" },
  { id: "maharashtra", name: "Bank of Maharashtra", code: "BOM" },
];

export const ALL_BANKS = [...POPULAR_BANKS, ...OTHER_BANKS];

export type PaymentDetailsState = {
  upi: {
    mode: UpiMode;
    upiId: string;
    selectedApp: string;
    isVerified: boolean;
  };
  card: {
    cardNumber: string;
    cardName: string;
    expiry: string;
    cvv: string;
    saveCard: boolean;
  };
  netbanking: {
    bankId: string;
  };
};

export const INITIAL_PAYMENT_DETAILS: PaymentDetailsState = {
  upi: {
    mode: "id",
    upiId: "",
    selectedApp: "gpay",
    isVerified: false,
  },
  card: {
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
    saveCard: true,
  },
  netbanking: {
    bankId: "",
  },
};

