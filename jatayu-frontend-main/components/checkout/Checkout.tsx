"use client";

import Image from "next/image";
import {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  CreditCard,
  Lightbulb,
  Smartphone,
  Star,
  Coins,
  Compass,
  Calendar,
  Building2,
  ArrowLeft,
  Target,
  Zap,
  Brain,
  Handshake,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ShinyText from "@/components/ui/ShinyText";
import { useSeekerBreadcrumbs } from "@/components/seeker/SeekerShellContext";
import { getEmailValidationError } from "@/lib/emailValidation";
import {
  buildPasswordContext,
  getPasswordHint,
  getPasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  getPasswordValidationError,
} from "@/lib/passwordValidation";
import {
  MOCK_SEEKER_EMAIL,
  MOCK_WALLET_BALANCE,
  buildGoogleCalendarUrl,
  calculateBookingTotal,
  checkoutConsultationTypes,
  formatConfirmationSchedule,
  getConsultationLabel,
  getConsultationPrice,
  getSlotDateById,
  findTimeSlot,
  type ConsultationType,
} from "@/lib/booking";
import { type Expert, expertSlug } from "@/lib/experts";
import BookingConfirmation from "./BookingConfirmation";
import SlotCalendarView from "./SlotCalendarView";
import {
  NEED_STEP_CHIPS,
  getSeekerOutcomeDescription,
} from "@/components/seeker/onboarding/seekerOutcomeOptions";
import styles from "./Checkout.module.css";

type CheckoutProps = {
  expert: Expert;
  seeker?: boolean;
};

const BOOKING_STEPS = [
  "Consultation Type",
  "Your Question",
  "Pick Slot",
  "Payment",
  "Confirm",
] as const;

function StepHeader({ title, subtitle }: { title: string; subtitle: ReactNode }) {
  return (
    <div className={styles.stepHead}>
      <h1 className={styles.stepTitle}>{title}</h1>
      <p className={styles.stepSubtitle}>{subtitle}</p>
      <span className={styles.stepRule} aria-hidden="true" />
    </div>
  );
}

const PAYMENT_ICON_CLASSES = {
  paymentIconUpi: "paymentIconUpi",
  paymentIconCard: "paymentIconCard",
  paymentIconBank: "paymentIconBank",
} as const;

const PAYMENT_METHODS = [
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

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

function getPaymentMethodLabel(method: PaymentMethodId | null): string {
  return PAYMENT_METHODS.find((item) => item.id === method)?.title ?? "Not selected";
}

const MIN_CONTEXT_LENGTH = 3;
const MAX_CONTEXT_LENGTH = 1000;

const CONTEXT_IMPROVEMENT_STYLES = [
  { id: "professional", label: "More Professional" },
  { id: "casual", label: "Casual" },
  { id: "concise", label: "More Concise" },
] as const;

type ContextImprovementStyleId = (typeof CONTEXT_IMPROVEMENT_STYLES)[number]["id"];

const DEFAULT_CONTEXT_IMPROVE_HINT =
  "Choose your Goal or describe your challenges and questions";

function getImprovedContextText(styleId: ContextImprovementStyleId, current: string): string {
  if (!current.trim()) return current;

  if (styleId === "professional") {
    return `I am seeking expert guidance on the following challenge:\n${current}`;
  }

  if (styleId === "casual") {
    return `Hey! I'd love help with this:\n${current}`;
  }

  const sentences = current
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences.slice(0, 2).join(" ");
}

function getContextImprovementHint(
  styleId: ContextImprovementStyleId | null,
  currentText: string,
): string {
  if (!styleId || !currentText.trim()) {
    return DEFAULT_CONTEXT_IMPROVE_HINT;
  }

  return getImprovedContextText(styleId, currentText.trim());
}

function ContextChipIcon({ chipId }: { chipId: string }) {
  const iconProps = { className: styles.contextChipIcon, size: 14, "aria-hidden": true as const };

  switch (chipId) {
    case "clarity":
      return <Target {...iconProps} />;
    case "plan":
      return <Zap {...iconProps} />;
    case "knowledge":
      return <Brain {...iconProps} />;
    case "support":
      return <Handshake {...iconProps} />;
    case "solution":
      return <ShieldCheck {...iconProps} />;
    default:
      return null;
  }
}

const CHECKOUT_OTP_LENGTH = 6;
const CHECKOUT_OTP_RESEND_SECONDS = 24;

function maskCheckoutPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last3 = digits.slice(-3) || "444";
  return `+91 XXXXXXX${last3}`;
}

function maskCheckoutEmail(email: string): string {
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

function formatCurrency(amount: number): string {
  return `₹ ${amount.toLocaleString("en-IN")}`;
}

function formatSessions(sessionsCompleted?: string): string {
  if (!sessionsCompleted) return "1.2k sessions";
  const match = sessionsCompleted.match(/(\d+)/);
  if (!match) return sessionsCompleted.toLowerCase();
  const count = Number(match[1]);
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k sessions`;
  return `${count} sessions`;
}

function formatExperience(role: string): string {
  const match = role.match(/(\d+)\+?\s*yrs?/i);
  if (match) return `${match[1]} yrs`;
  return "12 yrs";
}

function shortTopicLabel(topic: string): string {
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

type CheckoutRegistrationFieldKey =
  | "firstName"
  | "lastName"
  | "email"
  | "phoneNumber"
  | "password";

type CheckoutRegistrationValues = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
};

const CHECKOUT_REGISTRATION_FIELDS: CheckoutRegistrationFieldKey[] = [
  "firstName",
  "lastName",
  "email",
  "phoneNumber",
  "password",
];

const CHECKOUT_REGISTRATION_TOUCHED_DEFAULT: Record<CheckoutRegistrationFieldKey, boolean> = {
  firstName: false,
  lastName: false,
  email: false,
  phoneNumber: false,
  password: false,
};

function getCheckoutRegistrationFieldError(
  field: CheckoutRegistrationFieldKey,
  values: CheckoutRegistrationValues,
): string | null {
  const { firstName, lastName, email, phoneNumber, password } = values;
  const passwordContext = buildPasswordContext({ email, firstName, lastName });

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
      return getPasswordValidationError(password, passwordContext);
    default:
      return null;
  }
}

function isCheckoutRegistrationComplete(values: CheckoutRegistrationValues): boolean {
  return CHECKOUT_REGISTRATION_FIELDS.every(
    (field) => !getCheckoutRegistrationFieldError(field, values),
  );
}

export default function Checkout({ expert, seeker = false }: CheckoutProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const invoiceSeed = useId();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [consultationType, setConsultationType] = useState<ConsultationType | null>(null);
  const [selectedDate, setSelectedDate] = useState("date-0");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [subject, setSubject] = useState("");
  const [context, setContext] = useState("");
  const [showContextImprovementPanel, setShowContextImprovementPanel] = useState(false);
  const [selectedContextImproveStyle, setSelectedContextImproveStyle] =
    useState<ContextImprovementStyleId | null>(null);
  const [selectedContextChips, setSelectedContextChips] = useState<string[]>([]);
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerTouched, setRegisterTouched] = useState(CHECKOUT_REGISTRATION_TOUCHED_DEFAULT);
  const [registerSubmitAttempted, setRegisterSubmitAttempted] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerOtpSent, setRegisterOtpSent] = useState(false);
  const [registerOtpVerified, setRegisterOtpVerified] = useState(false);
  const [registerOtpDigits, setRegisterOtpDigits] = useState<string[]>(
    Array(CHECKOUT_OTP_LENGTH).fill(""),
  );
  const [registerOtpResendSeconds, setRegisterOtpResendSeconds] = useState(
    CHECKOUT_OTP_RESEND_SECONDS,
  );
  const registerOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [priceBreakdownExpanded, setPriceBreakdownExpanded] = useState(false);
  const [useCredits, setUseCredits] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const breadcrumbItems = useMemo(
    () => [
      { label: "Discover", href: seeker ? "/seeker/discover" : "/expert" },
      {
        label: expert.name,
        href: seeker
          ? `/seeker/expert/${expertSlug(expert.name)}`
          : `/expert/${expertSlug(expert.name)}`,
      },
      { label: "Checkout" },
    ],
    [expert.name, seeker]
  );

  const breadcrumbNode = useMemo(
    () => <Breadcrumbs items={breadcrumbItems} />,
    [breadcrumbItems]
  );

  const inlineBreadcrumbNode = useMemo(
    () => <div className={styles.breadcrumbWrap}>{breadcrumbNode}</div>,
    [breadcrumbNode]
  );

  useSeekerBreadcrumbs(seeker ? breadcrumbNode : null);

  const consultationFee = consultationType
    ? getConsultationPrice(expert.price, consultationType)
    : 0;
  const creditsActive = currentStep >= 4 && useCredits;
  const breakdown = calculateBookingTotal(
    consultationFee,
    MOCK_WALLET_BALANCE,
    creditsActive
  );

  const selectedDateLabel = getSlotDateById(selectedDate);
  const selectedSlotLabel = findTimeSlot(selectedDate, selectedSlot);

  const scheduleLabel =
    selectedDateLabel && selectedSlotLabel
      ? `${selectedDateLabel.headerDate}, ${selectedSlotLabel.time}`
      : "—";

  const canContinueStep1 = Boolean(consultationType);
  const contextLength = context.trim().length;
  const hasSelectedContextChip = selectedContextChips.length > 0;
  const canUseContextAiAssist = context.trim().length > 0;
  const canContinueStep2 =
    subject.trim().length >= MIN_CONTEXT_LENGTH && contextLength >= MIN_CONTEXT_LENGTH;
  const canContinueStep3 = Boolean(selectedDate && selectedSlot);
  const registerFormValues: CheckoutRegistrationValues = {
    firstName: registerFirstName,
    lastName: registerLastName,
    email: registerEmail,
    phoneNumber: registerPhone,
    password: registerPassword,
  };
  const registerPasswordContext = buildPasswordContext({
    email: registerEmail,
    firstName: registerFirstName,
    lastName: registerLastName,
  });
  const registerPasswordStrength = getPasswordStrength(
    registerPassword,
    registerPasswordContext,
  );
  const registerPasswordStrengthColor = getPasswordStrengthColor(
    registerPassword,
    registerPasswordContext,
  );
  const registerPasswordStrengthLabel = getPasswordStrengthLabel(
    registerPassword,
    registerPasswordContext,
  );
  const registerPasswordHint = getPasswordHint(registerPassword, registerPasswordContext);
  const isRegisterFormComplete = isCheckoutRegistrationComplete(registerFormValues);
  const canContinueStep4 = Boolean(paymentMethod);
  const canSendRegisterOtp = isRegisterFormComplete && !registerOtpVerified;
  const canContinueStep5 =
    isRegisterFormComplete && registerOtpVerified && termsAccepted;

  const markRegisterFieldTouched = (field: CheckoutRegistrationFieldKey) => {
    setRegisterTouched((prev) => ({ ...prev, [field]: true }));
  };

  const registerFieldError = (field: CheckoutRegistrationFieldKey) => {
    if (!registerTouched[field] && !registerSubmitAttempted) return null;
    return getCheckoutRegistrationFieldError(field, registerFormValues);
  };

  const registerInputWrapClass = (field: CheckoutRegistrationFieldKey, extraClass?: string) =>
    [
      styles.registerInputWrap,
      registerFieldError(field) ? styles.registerInputWrapError : "",
      extraClass,
    ]
      .filter(Boolean)
      .join(" ");

  useEffect(() => {
    if (!registerOtpSent || registerOtpResendSeconds <= 0) return;
    const timer = setInterval(() => {
      setRegisterOtpResendSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [registerOtpSent, registerOtpResendSeconds]);

  const previousRegisterContactRef = useRef({
    phone: registerPhone,
    email: registerEmail,
  });

  useEffect(() => {
    const previous = previousRegisterContactRef.current;
    const contactChanged =
      previous.phone !== registerPhone || previous.email !== registerEmail;
    previousRegisterContactRef.current = { phone: registerPhone, email: registerEmail };

    if (!registerOtpSent || !contactChanged) return;
    setRegisterOtpVerified(false);
    setRegisterOtpDigits(Array(CHECKOUT_OTP_LENGTH).fill(""));
    setRegisterOtpResendSeconds(CHECKOUT_OTP_RESEND_SECONDS);
  }, [registerPhone, registerEmail, registerOtpSent]);

  const updateRegisterOtpDigit = useCallback((index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    setRegisterOtpDigits((prev) => {
      const next = [...prev];
      next[index] = char;
      if (char && next.every((digit) => digit !== "")) {
        setRegisterOtpVerified(true);
      } else {
        setRegisterOtpVerified(false);
      }
      return next;
    });
    if (char && index < CHECKOUT_OTP_LENGTH - 1) {
      registerOtpInputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleRegisterOtpKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !registerOtpDigits[index] && index > 0) {
      registerOtpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleRegisterOtpPaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CHECKOUT_OTP_LENGTH);
    if (!pasted) return;

    const next = Array(CHECKOUT_OTP_LENGTH).fill("");
    pasted.split("").forEach((char, index) => {
      next[index] = char;
    });
    setRegisterOtpDigits(next);
    setRegisterOtpVerified(next.every((digit) => digit !== ""));
    const focusIndex = Math.min(pasted.length, CHECKOUT_OTP_LENGTH - 1);
    registerOtpInputRefs.current[focusIndex]?.focus();
  };

  const handleSendRegisterOtp = () => {
    setRegisterSubmitAttempted(true);
    if (!isRegisterFormComplete) return;
    setRegisterOtpSent(true);
    setRegisterOtpVerified(false);
    setRegisterOtpDigits(Array(CHECKOUT_OTP_LENGTH).fill(""));
    setRegisterOtpResendSeconds(CHECKOUT_OTP_RESEND_SECONDS);
    queueMicrotask(() => registerOtpInputRefs.current[0]?.focus());
  };

  const handleResendRegisterOtp = () => {
    if (registerOtpResendSeconds > 0) return;
    setRegisterOtpVerified(false);
    setRegisterOtpDigits(Array(CHECKOUT_OTP_LENGTH).fill(""));
    setRegisterOtpResendSeconds(CHECKOUT_OTP_RESEND_SECONDS);
    registerOtpInputRefs.current[0]?.focus();
  };

  const resetRegisterOtpState = () => {
    setRegisterOtpSent(false);
    setRegisterOtpVerified(false);
    setRegisterOtpDigits(Array(CHECKOUT_OTP_LENGTH).fill(""));
    setRegisterOtpResendSeconds(CHECKOUT_OTP_RESEND_SECONDS);
  };

  const stepCanContinue =
    currentStep === 1
      ? canContinueStep1
      : currentStep === 2
        ? canContinueStep2
        : currentStep === 3
          ? canContinueStep3
          : currentStep === 4
            ? canContinueStep4
            : false;

  const buildTextFromSelectedContextChips = (chipIds: string[]) =>
    chipIds
      .map((chipId) => {
        const chip = NEED_STEP_CHIPS.find((item) => item.id === chipId);
        return chip ? getSeekerOutcomeDescription(chip.outcomeId) : "";
      })
      .filter(Boolean)
      .join("\n");

  const handleContextChipClick = (chip: (typeof NEED_STEP_CHIPS)[number]) => {
    const isSelected = selectedContextChips.includes(chip.id);
    const nextSelected = isSelected
      ? selectedContextChips.filter((id) => id !== chip.id)
      : [...selectedContextChips, chip.id];

    if (nextSelected.length === 0) {
      setShowContextImprovementPanel(false);
      setSelectedContextImproveStyle(null);
    }

    setSelectedContextChips(nextSelected);
    setContext(buildTextFromSelectedContextChips(nextSelected).slice(0, MAX_CONTEXT_LENGTH));
  };

  const handleContextAiAssist = () => {
    setShowContextImprovementPanel(true);
  };

  const handleContextImproveStyle = (styleId: ContextImprovementStyleId) => {
    const current = context.trim();
    if (!current) return;
    setContext(getImprovedContextText(styleId, current).slice(0, MAX_CONTEXT_LENGTH));
  };

  const handleApplyContextImprovement = () => {
    if (!selectedContextImproveStyle) return;
    handleContextImproveStyle(selectedContextImproveStyle);
  };

  function goToStep(step: number) {
    if (step >= 1 && step <= currentStep) {
      if (showAuthModal && step < 5) {
        setShowAuthModal(false);
        resetRegisterOtpState();
      }
      setCurrentStep(step);
    }
  }

  function selectSlotDate(dateId: string) {
    if (dateId !== selectedDate) {
      setSelectedSlot("");
    }
    setSelectedDate(dateId);
  }

  function handleContinue() {
    if (!stepCanContinue) return;
    if (currentStep === 4) {
      setShowAuthModal(true);
      return;
    }
    if (currentStep < 4) {
      setCurrentStep((step) => step + 1);
    }
  }

  function handleAuthContinue() {
    setRegisterSubmitAttempted(true);
    if (!canContinueStep5) return;
    setShowAuthModal(false);
    setCurrentStep(5);
  }

  const expertSubtitle = expert.role.split("|")[0]?.trim() ?? expert.role;
  const expertTags = expert.topics.slice(0, 3).map(shortTopicLabel);
  const invoiceId = `JTY-${invoiceSeed.replace(/:/g, "").toUpperCase()}`;

  const confirmationSchedule = formatConfirmationSchedule(
    selectedDate,
    selectedSlotLabel?.time,
    false
  );

  const calendarUrl = buildGoogleCalendarUrl({
    expertName: expert.name,
    dateId: selectedDate,
    slotTime: selectedSlotLabel?.time,
    bookingId: invoiceId,
  });

  function handleConfirmBooking() {
    if (!paymentMethod || !termsAccepted) return;
    setBookingConfirmed(true);
  }

  function handleBack() {
    if (showAuthModal) {
      setShowAuthModal(false);
      resetRegisterOtpState();
      return;
    }
    if (currentStep === 5) {
      setCurrentStep(4);
      return;
    }
    goToStep(currentStep - 1);
  }

  const renderStepFooter = () => {
    const showBack = currentStep > 1;
    const showContinue = currentStep < 5;
    const continueLabel = "Continue";

    return (
      <div className={styles.stepFooter}>
        <div className={styles.stepFooterLeft}>
          {showBack ? (
            <button
              type="button"
              className={styles.backBtn}
              onClick={handleBack}
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back
            </button>
          ) : null}
          {showContinue ? (
            <ContinueButton
              label={continueLabel}
              disabled={!stepCanContinue}
              onClick={handleContinue}
              className={styles.mainContinueBtn}
            />
          ) : null}
        </div>
      </div>
    );
  };

  const renderExpertSummary = () => (
    <>
      <div className={styles.expertProfile}>
        <div className={styles.expertAvatar}>
          <Image
            src={expert.image}
            alt={expert.name}
            fill
            className={styles.expertAvatarImg}
            sizes="52px"
          />
        </div>
        <div className={styles.expertInfo}>
          <p className={styles.expertName}>{expert.name}</p>
          <p className={styles.expertRole}>{expertSubtitle}</p>
        </div>
      </div>

      <div className={styles.expertStats}>
        <span className={styles.statItem}>
          <Star size={13} aria-hidden="true" />
          {expert.rating} ({expert.reviewsCount ?? 243} reviews)
        </span>
        <span className={styles.statDot} aria-hidden="true" />
        <span className={styles.statItem}>{formatExperience(expert.role)}</span>
        <span className={styles.statDot} aria-hidden="true" />
        <span className={styles.statItem}>{formatSessions(expert.sessionsCompleted)}</span>
      </div>

      <div className={styles.expertTags}>
        {expertTags.map((tag) => (
          <span key={tag} className={styles.expertTag}>
            {tag}
          </span>
        ))}
      </div>
    </>
  );

  const renderSelectionSummary = () => (
    <>
      <div className={styles.sectionDivider}>
        <span>Your Selection</span>
      </div>

      <div className={styles.selectionRow}>
        <Compass size={16} className={styles.selectionIcon} aria-hidden="true" />
        <div className={styles.selectionContent}>
          <span className={styles.selectionLabel}>Consultation Type</span>
          <span className={styles.selectionValue}>
            {consultationType ? getConsultationLabel(consultationType) : "Not Selected"}
          </span>
        </div>
      </div>

      <div className={styles.selectionRow}>
        <Calendar size={16} className={styles.selectionIcon} aria-hidden="true" />
        <div className={styles.selectionContent}>
          <span className={styles.selectionLabel}>Schedule</span>
          <span className={styles.selectionValue}>{scheduleLabel}</span>
        </div>
      </div>
    </>
  );

  const renderPriceBreakdown = () => (
    <>
      <div className={styles.sectionDivider}>
        <span>Price</span>
      </div>

      <div
        className={`${styles.priceListCollapse} ${
          priceBreakdownExpanded ? styles.priceListCollapseOpen : ""
        }`}
        aria-hidden={!priceBreakdownExpanded}
      >
        <div className={styles.priceList}>
          <div className={styles.priceRow}>
            <span>Consultation Fee</span>
            <strong>
              {consultationFee > 0 ? formatCurrency(breakdown.consultationFee) : "—"}
            </strong>
          </div>
          <div className={styles.priceRow}>
            <span>Platform Fee</span>
            <strong>
              {consultationFee > 0 ? formatCurrency(breakdown.platformFee) : "—"}
            </strong>
          </div>
          <div className={styles.priceRow}>
            <span>GST (18%)</span>
            <strong>{consultationFee > 0 ? formatCurrency(breakdown.gst) : "—"}</strong>
          </div>
          <div className={`${styles.priceRow} ${styles.creditsRow}`}>
            <span>Credits Applied</span>
            <strong>
              {breakdown.walletApplied > 0
                ? `− ${formatCurrency(breakdown.walletApplied)}`
                : "—"}
            </strong>
          </div>
        </div>
      </div>

      {consultationFee > 0 ? (
        <button
          type="button"
          className={styles.priceSeeMoreBtn}
          onClick={() => setPriceBreakdownExpanded((expanded) => !expanded)}
          aria-expanded={priceBreakdownExpanded}
        >
          {priceBreakdownExpanded ? "See less" : "See more"}
        </button>
      ) : null}
    </>
  );

  if (bookingConfirmed) {
    return (
      <section className={`${styles.checkout} ${seeker ? styles.checkoutSeeker : ""}`}>
        <div className={`container ${styles.inner} ${styles.innerConfirmed}`}>
          {!seeker ? inlineBreadcrumbNode : null}
          <BookingConfirmation
            expertName={expert.name}
            scheduleLabel={confirmationSchedule}
            bookingId={invoiceId}
            email={registerEmail || MOCK_SEEKER_EMAIL}
            calendarUrl={calendarUrl}
          />
        </div>
      </section>
    );
  }

  return (
    <section className={`${styles.checkout} ${seeker ? styles.checkoutSeeker : ""}`}>
      <div className={`container ${styles.inner}`}>
        {!seeker ? inlineBreadcrumbNode : null}
        <nav
          className={styles.stepper}
          aria-label="Booking progress"
          style={{ "--step-progress": currentStep - 1 } as CSSProperties}
        >
          <div className={styles.stepperTrack} aria-hidden="true">
            <div className={styles.stepperTrackFill} />
          </div>
          {BOOKING_STEPS.map((label, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isComplete = stepNumber < currentStep;
            const isClickable = isComplete;
            const isFirst = index === 0;
            const isLast = index === BOOKING_STEPS.length - 1;

            return (
              <div
                key={label}
                className={`${styles.stepperItem} ${
                  isFirst ? styles.stepperItemFirst : ""
                } ${isLast ? styles.stepperItemLast : ""}`}
              >
                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={!isClickable}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => goToStep(stepNumber)}
                >
                  <span
                    className={`${styles.stepperCircle} ${
                      isActive ? styles.stepperCircleActive : ""
                    } ${isComplete ? styles.stepperCircleComplete : ""}`}
                  >
                    {stepNumber}
                  </span>
                  <span
                    className={`${styles.stepperLabel} ${
                      isActive ? styles.stepperLabelActive : ""
                    }`}
                  >
                    {label}
                  </span>
                </button>
              </div>
            );
          })}
        </nav>

        <div className={styles.layout}>
          <div className={styles.layoutMain}>
            <div className={styles.stepViewport}>
            {currentStep === 1 && (
              <div className={styles.stepContent}>
                <StepHeader
                  title="Choose Consultation Type"
                  subtitle="Select how you'd like to connect with the expert."
                />

                <div className={styles.consultationGrid}>
                  {checkoutConsultationTypes.map((option) => {
                    const price = getConsultationPrice(expert.price, option.id);
                    const isActive = consultationType === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`${styles.consultationCard} ${
                          isActive ? styles.consultationCardActive : ""
                        }`}
                        onClick={() => setConsultationType(option.id)}
                      >
                        <div className={styles.consultationCardBody}>
                          <span className={styles.consultationLabel}>
                            <img
                              src="/assets/box.svg"
                              alt=""
                              className="mark"
                              aria-hidden="true"
                            />
                            {option.title.toUpperCase()}
                          </span>
                          <p className={styles.consultationQuote}>{formatCurrency(price)}</p>
                          <div className={styles.consultationRule} aria-hidden="true" />
                          <p className={styles.consultationDesc}>{option.desc}</p>
                          <p className={styles.consultationActiveTitle}>{option.title}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

              </div>
            )}

            {currentStep === 2 && (
              <div className={`${styles.stepContent} ${styles.questionStep}`}>
                <h1 className={styles.questionStepTitle}>Describe Your Question</h1>
                <p className={styles.questionStepSubtitle}>
                  Be specific so the expert can give you the best possible response.
                </p>

                <div className={styles.questionStepSubject}>
                  <label htmlFor="booking-subject" className={styles.contextLabel}>
                    Subject / Topic
                  </label>
                  <input
                    id="booking-subject"
                    type="text"
                    className={styles.subjectInput}
                    placeholder="e.g. Career switch from engineering to product management"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                  />
                </div>

                <div className={styles.textareaBox}>
                  <div className={styles.contextChipsRow}>
                    {NEED_STEP_CHIPS.map((chip) => {
                      const isSelected = selectedContextChips.includes(chip.id);

                      return (
                        <button
                          key={chip.id}
                          type="button"
                          className={`${styles.contextChip} ${
                            isSelected ? styles.contextChipSelected : ""
                          }`}
                          onClick={() => handleContextChipClick(chip)}
                          aria-pressed={isSelected}
                        >
                          <ContextChipIcon chipId={chip.id} />
                          <span>{chip.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    id="booking-context"
                    className={styles.textarea}
                    placeholder="Eg. I've been in my current job for 3 years and feel stuck. I want to transition into product management but don't know where to start..."
                    value={context}
                    maxLength={MAX_CONTEXT_LENGTH}
                    onChange={(event) => setContext(event.target.value)}
                  />
                  <span className={styles.charCounter}>
                    {context.length} / {MAX_CONTEXT_LENGTH}
                  </span>
                  {hasSelectedContextChip ? (
                    <button
                      type="button"
                      className={styles.aiAssistTextBtn}
                      onClick={handleContextAiAssist}
                      disabled={!canUseContextAiAssist}
                    >
                      <ShinyText
                        text="Improve With AI"
                        icon="sparkles"
                        iconSize={14}
                        speed={2.5}
                        color="#E53B17"
                        shineColor="#ffffff"
                        disabled={!canUseContextAiAssist}
                        className={styles.aiAssistShinyText}
                      />
                    </button>
                  ) : null}
                </div>

                {showContextImprovementPanel ? (
                  <div className={styles.aiImprovePanel}>
                    <div className={styles.improvementChipsWrap}>
                      {CONTEXT_IMPROVEMENT_STYLES.map((style) => {
                        const isSelected = selectedContextImproveStyle === style.id;

                        return (
                          <button
                            key={style.id}
                            type="button"
                            className={`${styles.improvementChip} ${
                              isSelected ? styles.improvementChipSelected : ""
                            }`}
                            onClick={() => setSelectedContextImproveStyle(style.id)}
                            aria-pressed={isSelected}
                          >
                            {style.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className={styles.aiImproveHint}>
                      {getContextImprovementHint(selectedContextImproveStyle, context)}
                    </p>
                    <button
                      type="button"
                      className={styles.aiApplyBtn}
                      onClick={handleApplyContextImprovement}
                      disabled={!selectedContextImproveStyle}
                    >
                      Apply
                    </button>
                  </div>
                ) : null}

                <div className={styles.proTip}>
                  <Lightbulb size={18} className={styles.proTipIcon} aria-hidden="true" />
                  <p className={styles.proTipText}>
                    <strong>Pro Tip </strong> Questions with clear context get 3x better responses.
                    Include your current situation, goal, and what you&apos;ve already tried.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className={styles.stepContent}>
                <StepHeader
                  title="Pick a Slot"
                  subtitle="Pick an available slot from the expert's calendar."
                />

                <div className={styles.slotStep}>
                  <SlotCalendarView
                    selectedDate={selectedDate}
                    selectedSlot={selectedSlot}
                    onSelectDate={selectSlotDate}
                    onSelectSlot={setSelectedSlot}
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className={styles.stepContent}>
                <StepHeader
                  title="Payment Details"
                  subtitle={
                    <>
                      Choose how you&apos;d like to pay.
                      <br />
                      You&apos;ll sign in or create an account before final confirmation.
                    </>
                  }
                />

                <div className={styles.creditsBanner}>
                  <span className={styles.creditsIconWrap} aria-hidden="true">
                    <Coins size={18} />
                  </span>
                  <div className={styles.creditsCopy}>
                    <p className={styles.creditsTitle}>
                      You have {formatCurrency(MOCK_WALLET_BALANCE)} in Jatayu Credits
                    </p>
                    <p className={styles.creditsHint}>
                      Apply credits to reduce your payment amount
                    </p>
                  </div>
                  <label className={styles.creditsToggle}>
                    <input
                      type="checkbox"
                      className={styles.creditsToggleInput}
                      checked={useCredits}
                      onChange={(event) => setUseCredits(event.target.checked)}
                    />
                    <span className={styles.creditsToggleTrack} aria-hidden="true">
                      <span className={styles.creditsToggleThumb} />
                    </span>
                  </label>
                </div>

                <p className={styles.paymentPanelLabel}>Payment Method</p>

                <div className={styles.paymentOptions}>
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const isActive = paymentMethod === method.id;
                    const iconClass =
                      styles[method.iconClass as keyof typeof styles] ?? styles.paymentIconUpi;

                    return (
                      <div
                        key={method.id}
                        className={`${styles.paymentOptionWrap} ${
                          isActive ? styles.paymentOptionWrapActive : ""
                        }`}
                      >
                        <div className={styles.paymentOptionSurface}>
                          <button
                            type="button"
                            className={styles.paymentOption}
                            onClick={() => setPaymentMethod(method.id)}
                          >
                            <span className={`${styles.paymentIconWrap} ${iconClass}`}>
                              <Icon size={18} aria-hidden="true" />
                            </span>
                            <span className={styles.paymentOptionCopy}>
                              <span className={styles.paymentOptionTitle}>{method.title}</span>
                              <span className={styles.paymentOptionHint}>{method.hint}</span>
                            </span>
                            <span className={styles.paymentRadio} aria-hidden="true">
                              <span className={styles.paymentRadioDot} />
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {currentStep === 5 && (
              <div className={styles.stepContent}>
                <StepHeader
                  title="Confirm Booking"
                  subtitle="Review the details below and confirm the payment amount."
                />

                <div className={styles.confirmCard}>
                  <div className={styles.confirmCardBody}>
                    <div className={styles.confirmCardSummary}>
                      <div className={styles.sectionDivider}>
                        <span>Booking Details</span>
                      </div>

                      <div className={styles.selectionRow}>
                        <Compass size={16} className={styles.selectionIcon} aria-hidden="true" />
                        <div className={styles.selectionContent}>
                          <span className={styles.selectionLabel}>Consultation Type</span>
                          <span className={styles.selectionValue}>
                            {consultationType ? getConsultationLabel(consultationType) : "—"}
                          </span>
                        </div>
                      </div>

                      <div className={styles.selectionRow}>
                        <Calendar size={16} className={styles.selectionIcon} aria-hidden="true" />
                        <div className={styles.selectionContent}>
                          <span className={styles.selectionLabel}>Schedule</span>
                          <span className={styles.selectionValue}>{scheduleLabel}</span>
                        </div>
                      </div>

                      <div className={styles.selectionRow}>
                        <CreditCard
                          size={16}
                          className={styles.selectionIcon}
                          aria-hidden="true"
                        />
                        <div className={styles.selectionContent}>
                          <span className={styles.selectionLabel}>Payment Method</span>
                          <span className={styles.selectionValue}>
                            {getPaymentMethodLabel(paymentMethod)}
                          </span>
                        </div>
                      </div>

                      <div className={styles.selectionRow}>
                        <User size={16} className={styles.selectionIcon} aria-hidden="true" />
                        <div className={styles.selectionContent}>
                          <span className={styles.selectionLabel}>Account</span>
                          <span className={styles.selectionValue}>
                            {[registerFirstName, registerLastName].filter(Boolean).join(" ") || "—"}
                          </span>
                          <span className={styles.selectionLabel}>
                            {registerEmail || MOCK_SEEKER_EMAIL}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.confirmCardInvoice}>
                      <div className={styles.invoiceHeader}>
                        <div>
                          <p className={styles.invoiceEyebrow}>Payment Summary</p>
                          <p className={styles.invoiceNumber}>{invoiceId}</p>
                        </div>
                      </div>

                      <div className={styles.invoiceMetaGrid}>
                        <div>
                          <span className={styles.invoiceMetaLabel}>Expert</span>
                          <span className={styles.invoiceMetaValue}>{expert.name}</span>
                        </div>
                        <div>
                          <span className={styles.invoiceMetaLabel}>Phone</span>
                          <span className={styles.invoiceMetaValue}>
                            {registerPhone ? `+91 ${registerPhone}` : "—"}
                          </span>
                        </div>
                        <div>
                          <span className={styles.invoiceMetaLabel}>Subject</span>
                          <span className={styles.invoiceMetaValue}>{subject || "—"}</span>
                        </div>
                        <div>
                          <span className={styles.invoiceMetaLabel}>Payment</span>
                          <span className={styles.invoiceMetaValue}>
                            {getPaymentMethodLabel(paymentMethod)}
                          </span>
                        </div>
                      </div>

                      <div className={styles.invoiceTable}>
                        <div className={styles.invoiceTableHead}>
                          <span>Description</span>
                          <span>Amount</span>
                        </div>
                        <div className={styles.invoiceTableRow}>
                          <span>Consultation Fee</span>
                          <strong>{formatCurrency(breakdown.consultationFee)}</strong>
                        </div>
                        <div className={styles.invoiceTableRow}>
                          <span>Platform Fee</span>
                          <strong>{formatCurrency(breakdown.platformFee)}</strong>
                        </div>
                        <div className={styles.invoiceTableRow}>
                          <span>GST (18%)</span>
                          <strong>{formatCurrency(breakdown.gst)}</strong>
                        </div>
                        {breakdown.walletApplied > 0 ? (
                          <div
                            className={`${styles.invoiceTableRow} ${styles.invoiceCreditRow}`}
                          >
                            <span>Credits Applied</span>
                            <strong>− {formatCurrency(breakdown.walletApplied)}</strong>
                          </div>
                        ) : null}
                      </div>

                      <div className={styles.invoiceTotalRow}>
                        <span>Total payable</span>
                        <strong>{formatCurrency(breakdown.total)}</strong>
                      </div>

                      <p className={styles.termsNote}>
                        Your account is verified and your payment will be processed using the
                        selected method.
                      </p>

                      <div className={styles.confirmPayWrap}>
                        <PrimaryButton
                          label={`Confirm and Pay ${formatCurrency(breakdown.total)}`}
                          variant="orange"
                          fullWidth
                          disabled={!paymentMethod}
                          className={styles.confirmPayBtn}
                          onClick={handleConfirmBooking}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
            {showAuthModal ? (
              <div className={styles.authModalOverlay} role="dialog" aria-modal="true" aria-labelledby="checkout-auth-modal-title">
                <div className={styles.authModal}>
                  <div className={styles.authModalHeader}>
                    <div>
                      <h2 id="checkout-auth-modal-title" className={styles.authModalTitle}>
                        Login / Sign Up
                      </h2>
                      <p className={styles.authModalSubtitle}>
                        Create your account to save this booking before final confirmation.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.authModalClose}
                      onClick={() => setShowAuthModal(false)}
                      aria-label="Close login or sign up popup"
                    >
                      Close
                    </button>
                  </div>

                  <div className={styles.registerPanel}>
                    <p className={styles.registerIntro}>
                      Enter your details to create your account and verify your identity.
                    </p>

                    <div className={styles.registerForm}>
                      <div className={styles.registerNameRow}>
                        <div className={styles.registerFieldGroup}>
                          <label className={styles.registerFieldLabel} htmlFor="checkout-first-name">
                            First Name
                          </label>
                          <div className={styles.registerInputFieldWrap}>
                            <div className={registerInputWrapClass("firstName")}>
                              <User className={styles.registerInputIcon} size={16} />
                              <input
                                id="checkout-first-name"
                                type="text"
                                className={styles.registerInput}
                                placeholder="Aryan"
                                value={registerFirstName}
                                onChange={(event) => setRegisterFirstName(event.target.value)}
                                onBlur={() => markRegisterFieldTouched("firstName")}
                                autoComplete="given-name"
                                aria-invalid={Boolean(registerFieldError("firstName"))}
                              />
                            </div>
                            {registerFieldError("firstName") ? (
                              <span className={styles.registerFieldError}>
                                {registerFieldError("firstName")}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className={styles.registerFieldGroup}>
                          <label className={styles.registerFieldLabel} htmlFor="checkout-last-name">
                            Last Name
                          </label>
                          <div className={styles.registerInputFieldWrap}>
                            <div className={registerInputWrapClass("lastName")}>
                              <input
                                id="checkout-last-name"
                                type="text"
                                className={styles.registerInput}
                                placeholder="Singh"
                                value={registerLastName}
                                onChange={(event) => setRegisterLastName(event.target.value)}
                                onBlur={() => markRegisterFieldTouched("lastName")}
                                autoComplete="family-name"
                                aria-invalid={Boolean(registerFieldError("lastName"))}
                              />
                            </div>
                            {registerFieldError("lastName") ? (
                              <span className={styles.registerFieldError}>
                                {registerFieldError("lastName")}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className={styles.registerFieldGroup}>
                        <label className={styles.registerFieldLabel} htmlFor="checkout-email">
                          Email Address
                        </label>
                        <div className={styles.registerInputFieldWrap}>
                          <div className={registerInputWrapClass("email")}>
                            <Mail className={styles.registerInputIcon} size={16} />
                            <input
                              id="checkout-email"
                              type="email"
                              className={styles.registerInput}
                              placeholder="Aryan23@gmail.com"
                              value={registerEmail}
                              onChange={(event) => setRegisterEmail(event.target.value)}
                              onBlur={() => markRegisterFieldTouched("email")}
                              autoComplete="email"
                              aria-invalid={Boolean(registerFieldError("email"))}
                            />
                          </div>
                          {registerFieldError("email") ? (
                            <span className={styles.registerFieldError}>
                              {registerFieldError("email")}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className={styles.registerFieldGroup}>
                        <label className={styles.registerFieldLabel} htmlFor="checkout-password">
                          Password
                        </label>
                        <div className={styles.registerInputFieldWrap}>
                          <div
                            className={registerInputWrapClass(
                              "password",
                              styles.registerInputWrapWithToggle,
                            )}
                          >
                            <Lock className={styles.registerInputIcon} size={16} />
                            <input
                              id="checkout-password"
                              type={showRegisterPassword ? "text" : "password"}
                              className={`${styles.registerInput} ${styles.registerInputWithToggle}`}
                              placeholder="Create a secure password"
                              value={registerPassword}
                              onChange={(event) => setRegisterPassword(event.target.value)}
                              onBlur={() => markRegisterFieldTouched("password")}
                              autoComplete="new-password"
                              aria-invalid={Boolean(registerFieldError("password"))}
                            />
                            <button
                              type="button"
                              className={styles.registerPasswordToggle}
                              onClick={() => setShowRegisterPassword((prev) => !prev)}
                              aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                              aria-pressed={showRegisterPassword}
                            >
                              {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <div className={styles.registerPasswordStrengthRow}>
                            <div className={styles.registerPasswordStrengthBars}>
                              {[0, 1, 2, 3].map((index) => (
                                <div
                                  key={index}
                                  className={styles.registerPasswordStrengthBar}
                                  style={{
                                    background:
                                      index < registerPasswordStrength
                                        ? registerPasswordStrengthColor
                                        : "var(--mercury)",
                                  }}
                                />
                              ))}
                            </div>
                            <div className={styles.registerPasswordStrengthLabels}>
                              {registerPasswordStrengthLabel ? (
                                <span
                                  className={styles.registerPasswordStrengthLabel}
                                  style={{ color: registerPasswordStrengthColor }}
                                >
                                  {registerPasswordStrengthLabel}
                                </span>
                              ) : registerPasswordHint ? (
                                <span
                                  className={`${styles.registerPasswordHint} ${
                                    registerFieldError("password")
                                      ? styles.registerPasswordHintError
                                      : ""
                                  }`}
                                  aria-live="polite"
                                >
                                  {registerPasswordHint}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.registerFieldGroup}>
                        <label className={styles.registerFieldLabel} htmlFor="checkout-phone">
                          Phone
                        </label>
                        <div className={styles.registerInputFieldWrap}>
                          <div className={registerInputWrapClass("phoneNumber")}>
                            <Phone className={styles.registerInputIcon} size={16} />
                            <span className={styles.registerPhonePrefix} aria-hidden="true">
                              +91
                            </span>
                            <input
                              id="checkout-phone"
                              type="tel"
                              inputMode="numeric"
                              className={styles.registerInput}
                              placeholder="9898675444"
                              value={registerPhone}
                              onChange={(event) =>
                                setRegisterPhone(
                                  event.target.value.replace(/\D/g, "").slice(0, 10),
                                )
                              }
                              onBlur={() => markRegisterFieldTouched("phoneNumber")}
                              autoComplete="tel-national"
                              maxLength={10}
                              aria-invalid={Boolean(registerFieldError("phoneNumber"))}
                            />
                          </div>
                          {registerFieldError("phoneNumber") ? (
                            <span className={styles.registerFieldError}>
                              {registerFieldError("phoneNumber")}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {!registerOtpSent ? (
                        <ContinueButton
                          type="button"
                          label="Send Verification Code"
                          disabled={!canSendRegisterOtp}
                          onClick={handleSendRegisterOtp}
                          className={styles.registerSendOtpBtn}
                        />
                      ) : (
                        <div className={styles.registerOtpSection}>
                          <p className={styles.registerOtpSentText}>
                            A 6 digit verification code has been sent to
                            <br />
                            {maskCheckoutPhone(registerPhone)} & {maskCheckoutEmail(registerEmail)}
                          </p>

                          <div className={styles.registerOtpFieldGroup}>
                            <span className={styles.registerFieldLabel}>Enter the Code</span>
                            <div
                              className={styles.registerOtpInputRow}
                              onPaste={handleRegisterOtpPaste}
                            >
                              {registerOtpDigits.map((digit, index) => (
                                <input
                                  key={index}
                                  ref={(element) => {
                                    registerOtpInputRefs.current[index] = element;
                                  }}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={1}
                                  className={`${styles.registerOtpInput} ${
                                    digit ? styles.registerOtpInputFilled : ""
                                  }`}
                                  value={digit}
                                  placeholder="__"
                                  aria-label={`Digit ${index + 1}`}
                                  onChange={(event) =>
                                    updateRegisterOtpDigit(index, event.target.value)
                                  }
                                  onKeyDown={(event) => handleRegisterOtpKeyDown(index, event)}
                                  autoFocus={index === 0}
                                />
                              ))}
                            </div>
                          </div>

                          <p className={styles.registerOtpResendText}>
                            {registerOtpResendSeconds > 0 ? (
                              <>
                                <span className={styles.registerOtpResendMuted}>
                                  Resend the code again in{" "}
                                </span>
                                <span className={styles.registerOtpResendHighlight}>
                                  {registerOtpResendSeconds} Seconds
                                </span>
                              </>
                            ) : (
                              <button
                                type="button"
                                className={styles.registerOtpResendLink}
                                onClick={handleResendRegisterOtp}
                              >
                                Resend the code
                              </button>
                            )}
                          </p>

                          {registerOtpVerified ? (
                            <p className={styles.registerOtpVerifiedText}>Phone verified</p>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <label className={styles.termsAgreement}>
                      <input
                        type="checkbox"
                        className={styles.termsAgreementCheckbox}
                        checked={termsAccepted}
                        onChange={(event) => setTermsAccepted(event.target.checked)}
                      />
                      <span className={styles.termsAgreementText}>
                        By confirming, you agree to our{" "}
                        <a href="/terms" className={styles.termsLink}>
                          Terms
                        </a>
                      </span>
                    </label>

                    <div className={styles.authModalActions}>
                      <ContinueButton
                        type="button"
                        label="Continue to Confirm"
                        disabled={!canContinueStep5}
                        onClick={handleAuthContinue}
                        className={styles.registerSendOtpBtn}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            </div>
            {renderStepFooter()}
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sidebarInner}>
              <div className={styles.bookingBox}>
                <div className={styles.bookingHeader}>
                  <span className={styles.bookingHeaderTitle}>Booking summary</span>
                  <span className={styles.bookingHeaderDots} aria-hidden="true" />
                  <div className={styles.soundwaveIcon} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div className={styles.bookingBody}>
                  {renderExpertSummary()}
                  {renderSelectionSummary()}
                  {renderPriceBreakdown()}
                </div>

                <div className={styles.bookingFooter}>
                  <span className={styles.totalLabel}>Total</span>
                  <span className={styles.totalAmount}>
                    {consultationFee > 0 ? formatCurrency(breakdown.total) : "—"}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
