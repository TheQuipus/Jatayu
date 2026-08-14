"use client";

import {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
} from "react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { useSeekerBreadcrumbs } from "@/components/seeker/SeekerShellContext";
import {
  buildPasswordContext,
  getPasswordHint,
  getPasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
} from "@/lib/passwordValidation";
import {
  MOCK_SEEKER_EMAIL,
  MOCK_WALLET_BALANCE,
  buildGoogleCalendarUrl,
  calculateBookingTotal,
  formatConfirmationSchedule,
  getConsultationPrice,
  getSlotDateById,
  parseSlotDateOffset,
  type ConsultationType,
} from "@/lib/booking";
import { type Expert, expertSlug } from "@/lib/experts";
import BookingConfirmation from "./BookingConfirmation";
import {
  CHECKOUT_OTP_LENGTH,
  CHECKOUT_OTP_RESEND_SECONDS,
  CHECKOUT_REGISTRATION_TOUCHED_DEFAULT,
  MIN_CONTEXT_LENGTH,
  INITIAL_PAYMENT_DETAILS,
  type CheckoutProps,
  type PaymentMethodId,
  type ContextImprovementStyleId,
  type CheckoutRegistrationFieldKey,
  type CheckoutRegistrationValues,
  type PaymentDetailsState,
} from "./checkoutTypes";
import {
  isCheckoutRegistrationComplete,
  formatCurrency,
  getDetailedPaymentMethodLabel,
} from "./checkoutUtils";
import CheckoutStepper from "./CheckoutStepper";
import StepConsultationType from "./StepConsultationType";
import StepQuestionContext from "./StepQuestionContext";
import StepPickSlot from "./StepPickSlot";
import StepBookingSummary from "./StepBookingSummary";
import CheckoutSidebar from "./CheckoutSidebar";
import CheckoutAuthModal from "./CheckoutAuthModal";
import CheckoutStepFooter from "./CheckoutStepFooter";
import {
  fetchSeekerProfileData,
  getStoredSeekerProfile,
  SEEKER_PROFILE_UPDATED_EVENT,
} from "@/lib/seekerProfileApi";
import { openRazorpayCheckout } from "@/lib/razorpay";
import {
  buildScheduledStartAt,
  clearBookingIdempotencyKey,
  createBookingOrder,
  fetchBooking,
  fetchBookingOptions,
  getBookingIdempotencyKey,
  verifyBookingPayment,
  type BookingOptions,
} from "@/lib/seekerBookingApi";
import styles from "./Checkout.module.css";

export default function Checkout({ expert, seeker = false }: CheckoutProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);

  useEffect(() => {
    setMaxStepReached((prev) => Math.max(prev, currentStep));
  }, [currentStep]);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [bookingOptions, setBookingOptions] = useState<BookingOptions | null>(null);
  const [bookingError, setBookingError] = useState("");
  const [confirmedBookingId, setConfirmedBookingId] = useState("");
  const initialFormat = (
    expert.formats && expert.formats.length > 0
      ? expert.formats[0]
      : expert.formatPrices && Object.keys(expert.formatPrices).length > 0
      ? Object.keys(expert.formatPrices)[0]
      : "video"
  ) as ConsultationType;

  const [consultationType, setConsultationType] = useState<ConsultationType | null>(
    () => initialFormat
  );
  const initialAvailableDateOffset = useMemo(() => {
    if (!expert.availabilities || expert.availabilities.length === 0) return 0;
    const today = new Date();
    for (let offset = 0; offset < 28; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
      const matches = expert.availabilities.some((rule) =>
        rule.days.some((day) => day.toLowerCase().slice(0, 3) === dayName.toLowerCase())
      );
      if (matches) return offset;
    }
    return 0;
  }, [expert.availabilities]);

  const [selectedDate, setSelectedDate] = useState(`date-${initialAvailableDateOffset}`);
  const [selectedSlot, setSelectedSlot] = useState(
    () => `date-${initialAvailableDateOffset}-slot-1`
  );
  const [selectedSlotTime, setSelectedSlotTime] = useState(
    () => expert.availabilities?.[0]?.fromTime || ""
  );
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

  useEffect(() => {
    const applyProfile = (data: { name?: string; email?: string; phone?: string }) => {
      if (data.name) {
        const parts = data.name.trim().split(" ");
        setRegisterFirstName((prev) => prev || parts[0] || "Priya");
        setRegisterLastName((prev) => prev || parts.slice(1).join(" ") || "Sharma");
      }
      if (data.email) {
        setRegisterEmail((prev) => prev || data.email || MOCK_SEEKER_EMAIL);
      }
      if (data.phone) {
        setRegisterPhone((prev) => prev || data.phone || "9898675444");
      }
    };

    const stored = getStoredSeekerProfile();
    applyProfile(stored);

    void fetchSeekerProfileData()
      .then((fetched) => {
        applyProfile(fetched);
      })
      .catch(() => {});

    if (typeof window !== "undefined") {
      const handleUpdate = () => {
        applyProfile(getStoredSeekerProfile());
      };
      window.addEventListener(SEEKER_PROFILE_UPDATED_EVENT, handleUpdate);
      return () => {
        window.removeEventListener(SEEKER_PROFILE_UPDATED_EVENT, handleUpdate);
      };
    }
  }, []);

  const expertIdentifier = expert.id || expertSlug(expert.name);

  useEffect(() => {
    if (!seeker) return;
    let active = true;
    void fetchBookingOptions(expertIdentifier)
      .then((options) => {
        if (!active) return;
        setBookingOptions(options);
        if (options.formats.length > 0) {
          setConsultationType((current) =>
            current && options.formats.includes(current) ? current : options.formats[0] as ConsultationType,
          );
        }
        const firstAvailability = options.availabilities[0];
        if (firstAvailability) setSelectedSlotTime(firstAvailability.fromTime);
        setSelectedSlot("");
      })
      .catch((error) => {
        if (active) setBookingError(error instanceof Error ? error.message : "Unable to load booking options");
      });
    return () => { active = false; };
  }, [expertIdentifier, seeker]);

  const bookingExpert = useMemo<Expert>(() => ({
    ...expert,
    id: bookingOptions?.expertId || expert.id,
    timezone: bookingOptions?.timezone || expert.timezone,
    formats: bookingOptions?.formats || expert.formats,
    formatPrices: bookingOptions?.formatPrices || expert.formatPrices,
    availabilities: bookingOptions?.availabilities || expert.availabilities,
  }), [bookingOptions, expert]);
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerTouched, setRegisterTouched] = useState(CHECKOUT_REGISTRATION_TOUCHED_DEFAULT);
  const [registerSubmitAttempted, setRegisterSubmitAttempted] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerOtpSent, setRegisterOtpSent] = useState(false);
  const [registerOtpVerified, setRegisterOtpVerified] = useState(false);
  const [registerOtpDigits, setRegisterOtpDigits] = useState<string[]>(
    Array(CHECKOUT_OTP_LENGTH).fill("")
  );
  const [registerOtpResendSeconds, setRegisterOtpResendSeconds] = useState(
    CHECKOUT_OTP_RESEND_SECONDS
  );
  const registerOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [useCredits, setUseCredits] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsState>(INITIAL_PAYMENT_DETAILS);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isAuthLogin, setIsAuthLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSubmitAttempted, setLoginSubmitAttempted] = useState(false);

  useEffect(() => {
    if (showAuthModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAuthModal]);

  const breadcrumbItems = useMemo(
    () => [
      { label: "Discover", href: seeker ? "/seeker/discover/" : "/expert/" },
      {
        label: expert.name,
        href: seeker
          ? `/seeker/expert/${expertSlug(expert.name)}/`
          : `/expert/${expertSlug(expert.name)}/`,
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
    ? bookingExpert.formatPrices && bookingExpert.formatPrices[consultationType] && !isNaN(Number(bookingExpert.formatPrices[consultationType]))
      ? Number(bookingExpert.formatPrices[consultationType])
      : getConsultationPrice(bookingExpert.price, consultationType)
    : 0;
  const creditsActive = currentStep >= 4 && useCredits;
  const breakdown = calculateBookingTotal(
    consultationFee,
    MOCK_WALLET_BALANCE,
    creditsActive
  );

  const selectedDateLabel = getSlotDateById(selectedDate);
  const scheduleLabel =
    selectedDateLabel && selectedSlotTime
      ? `${selectedDateLabel.headerDate}, ${selectedSlotTime}`
      : "—";

  const canContinueStep1 = Boolean(consultationType);
  const contextLength = context.trim().length;
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
    registerPasswordContext
  );
  const registerPasswordStrengthColor = getPasswordStrengthColor(
    registerPassword,
    registerPasswordContext
  );
  const registerPasswordStrengthLabel = getPasswordStrengthLabel(
    registerPassword,
    registerPasswordContext
  );
  const registerPasswordHint = getPasswordHint(registerPassword, registerPasswordContext);
  const isRegisterFormComplete = isCheckoutRegistrationComplete(registerFormValues);
  const isRegisterFormFilled = Boolean(
    registerFirstName.trim() &&
      registerLastName.trim() &&
      registerEmail.trim() &&
      registerPhone.trim() &&
      registerPassword.trim()
  );
  const isFullyCoveredByCredits = creditsActive && breakdown.total === 0;
  const isNetbankingValid =
    paymentMethod === "netbanking" ? Boolean(paymentDetails.netbanking.bankId) : true;
  const isCardValid =
    paymentMethod === "card"
      ? Boolean(paymentDetails.card.cardNumber.replace(/\D/g, "").length >= 12)
      : true;
  const canContinueStep4 =
    isFullyCoveredByCredits ||
    (Boolean(paymentMethod) && isNetbankingValid && isCardValid);
  const canSendRegisterOtp = isRegisterFormFilled;
  const canContinueStep5 =
    isRegisterFormComplete && registerOtpVerified && termsAccepted;

  const markRegisterFieldTouched = (field: CheckoutRegistrationFieldKey) => {
    setRegisterTouched((prev) => ({ ...prev, [field]: true }));
  };

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
    event: React.KeyboardEvent<HTMLInputElement>
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
    setRegisterTouched({
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      password: true,
    });
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

  const handleLoginSubmit = () => {
    setLoginSubmitAttempted(true);
    if (!loginEmail.trim() || !loginPassword.trim()) return;
    setRegisterEmail(loginEmail.trim());
    setRegisterOtpVerified(true);
    setTermsAccepted(true);
    setShowAuthModal(false);
    setCurrentStep(4);
  };

  const stepCanContinue =
    currentStep === 1
      ? canContinueStep1
      : currentStep === 2
        ? canContinueStep2
        : currentStep === 3
          ? canContinueStep3
          : false;

  function goToStep(step: number) {
    if (step >= 1 && step <= maxStepReached) {
      if (showAuthModal && step < 4) {
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
    if (currentStep === 3) {
      if (seeker || registerOtpVerified) {
        setCurrentStep(4);
      } else {
        setShowAuthModal(true);
      }
      return;
    }
    if (currentStep < 3) {
      setCurrentStep((step) => step + 1);
    }
  }

  function handleAuthContinue() {
    setRegisterSubmitAttempted(true);
    if (!canContinueStep5) return;
    setShowAuthModal(false);
    setCurrentStep(4);
  }

  const [invoiceId] = useState(() => `JTY-${Math.floor(100000 + Math.random() * 900000)}`);

  const confirmationSchedule = formatConfirmationSchedule(
    selectedDate,
    selectedSlotTime,
    false
  );

  const calendarUrl = buildGoogleCalendarUrl({
    expertName: bookingExpert.name,
    dateId: selectedDate,
    slotTime: selectedSlotTime,
    bookingId: confirmedBookingId || invoiceId,
  });

  async function handleConfirmBooking() {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);
    setBookingError("");

    try {
      if (!consultationType || !selectedSlotTime) throw new Error("Select a consultation type and available slot");
      const selectedDateValue = new Date();
      selectedDateValue.setHours(0, 0, 0, 0);
      selectedDateValue.setDate(selectedDateValue.getDate() + parseSlotDateOffset(selectedDate));
      const scheduledStartAt = buildScheduledStartAt(
        selectedDateValue,
        selectedSlotTime,
        bookingOptions?.timezone || bookingExpert.timezone || "Asia/Kolkata",
      );
      const fingerprint = [expertIdentifier, consultationType, scheduledStartAt].join(":");
      const idempotencyKey = getBookingIdempotencyKey(fingerprint);
      const userFullName =
        [registerFirstName, registerLastName].filter(Boolean).join(" ") || "Priya Sharma";
      const userEmailAddress = registerEmail || MOCK_SEEKER_EMAIL;
      const userPhoneNumber = registerPhone || "9898675444";

      const created = await createBookingOrder({
        expertId: bookingOptions?.expertId || expertIdentifier,
        consultationType,
        subject,
        context,
        scheduledStartAt,
        useCredits,
        idempotencyKey,
      });
      if (created.booking.status === "confirmed") {
        setConfirmedBookingId(created.booking.id);
        setBookingConfirmed(true);
        clearBookingIdempotencyKey(fingerprint);
        return;
      }
      if (["expired", "payment_failed"].includes(created.booking.status)) {
        clearBookingIdempotencyKey(fingerprint);
        throw new Error("The previous payment reservation expired. Click Confirm again to create a new booking.");
      }
      if (!created.razorpayOrder) throw new Error("Payment order was not returned by the server");
      const checkoutResult = await openRazorpayCheckout({
        order: created.razorpayOrder,
        expertName: bookingExpert.name,
        userName: userFullName,
        userEmail: userEmailAddress,
        userPhone: userPhoneNumber,
      });
      let verified = await verifyBookingPayment(created.booking.id, checkoutResult);
      for (let attempt = 0; verified.status === "payment_verified" && attempt < 10; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
        verified = await fetchBooking(created.booking.id);
      }
      if (verified.status !== "confirmed") throw new Error("Payment is being confirmed. Please check My Bookings shortly.");
      setConfirmedBookingId(verified.id);
      setBookingConfirmed(true);
      clearBookingIdempotencyKey(fingerprint);
    } catch (err) {
      console.error("Failed to process Razorpay payment:", err);
      setBookingError(err instanceof Error ? err.message : "Unable to complete booking");
    } finally {
      setIsProcessingPayment(false);
    }
  }

  function handleBack() {
    if (showAuthModal) {
      setShowAuthModal(false);
      resetRegisterOtpState();
      return;
    }
    if (currentStep === 4) {
      setCurrentStep(3);
      return;
    }
    goToStep(currentStep - 1);
  }



  if (bookingConfirmed) {
    return (
      <section className={`${styles.checkout} ${seeker ? styles.checkoutSeeker : ""}`}>
        <div className={`container ${styles.inner} ${styles.innerConfirmed}`}>
          {!seeker ? inlineBreadcrumbNode : null}
          <BookingConfirmation
            expertName={bookingExpert.name}
            scheduleLabel={confirmationSchedule}
            bookingId={confirmedBookingId || invoiceId}
            email={registerEmail || MOCK_SEEKER_EMAIL}
            calendarUrl={calendarUrl}
          />
        </div>
      </section>
    );
  }

  const completedSteps = [
    canContinueStep1,
    canContinueStep2,
    canContinueStep3,
  ];

  return (
    <section className={`${styles.checkout} ${seeker ? styles.checkoutSeeker : ""}`}>
      <div className={`container ${styles.inner}`}>
        {!seeker ? inlineBreadcrumbNode : null}

        <CheckoutStepper
          currentStep={currentStep}
          maxStepReached={maxStepReached}
          completedSteps={completedSteps}
          onGoToStep={goToStep}
        />

        <div className={styles.layout}>
          <div className={styles.layoutMain}>
            <div className={styles.stepViewport}>
              {bookingError ? <p className={styles.bookingError} role="alert">{bookingError}</p> : null}
              {currentStep === 1 && (
                <StepConsultationType
                  expert={bookingExpert}
                  consultationType={consultationType}
                  onSelectConsultationType={setConsultationType}
                />
              )}

              {currentStep === 2 && (
                <StepQuestionContext
                  subject={subject}
                  onSubjectChange={setSubject}
                  context={context}
                  onContextChange={setContext}
                  selectedContextChips={selectedContextChips}
                  onSelectedContextChipsChange={setSelectedContextChips}
                  showContextImprovementPanel={showContextImprovementPanel}
                  onShowContextImprovementPanelChange={setShowContextImprovementPanel}
                  selectedContextImproveStyle={selectedContextImproveStyle}
                  onSelectedContextImproveStyleChange={setSelectedContextImproveStyle}
                />
              )}

              {currentStep === 3 && (
                <StepPickSlot
                  expert={bookingExpert}
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  onSelectDate={selectSlotDate}
                  onSelectSlot={setSelectedSlot}
                  onSelectSlotTime={setSelectedSlotTime}
                  occupiedSlots={bookingOptions?.occupiedSlots}
                  timezone={bookingOptions?.timezone}
                  slotDurationMinutes={bookingOptions?.slotDurationMinutes}
                />
              )}

              {currentStep === 4 && (
                <StepBookingSummary
                  expert={bookingExpert}
                  consultationType={consultationType}
                  scheduleLabel={scheduleLabel}
                  paymentMethod={paymentMethod}
                  paymentDetails={paymentDetails}
                  subject={subject}
                  context={context}
                  registerFirstName={registerFirstName}
                  registerLastName={registerLastName}
                  registerEmail={registerEmail}
                  registerPhone={registerPhone}
                  invoiceId={invoiceId}
                  breakdown={breakdown}
                />
              )}

              {showAuthModal ? (
                <CheckoutAuthModal
                  onClose={() => setShowAuthModal(false)}
                  registerOtpSent={registerOtpSent}
                  isAuthLogin={isAuthLogin}
                  onSetIsAuthLogin={setIsAuthLogin}
                  loginEmail={loginEmail}
                  onLoginEmailChange={setLoginEmail}
                  loginPassword={loginPassword}
                  onLoginPasswordChange={setLoginPassword}
                  loginSubmitAttempted={loginSubmitAttempted}
                  onLoginSubmit={handleLoginSubmit}
                  registerFirstName={registerFirstName}
                  onRegisterFirstNameChange={setRegisterFirstName}
                  registerLastName={registerLastName}
                  onRegisterLastNameChange={setRegisterLastName}
                  registerEmail={registerEmail}
                  onRegisterEmailChange={setRegisterEmail}
                  registerPhone={registerPhone}
                  onRegisterPhoneChange={setRegisterPhone}
                  registerPassword={registerPassword}
                  onRegisterPasswordChange={setRegisterPassword}
                  registerTouched={registerTouched}
                  onMarkRegisterFieldTouched={markRegisterFieldTouched}
                  registerSubmitAttempted={registerSubmitAttempted}
                  showRegisterPassword={showRegisterPassword}
                  onToggleShowRegisterPassword={() =>
                    setShowRegisterPassword((prev) => !prev)
                  }
                  registerPasswordStrength={registerPasswordStrength}
                  registerPasswordStrengthColor={registerPasswordStrengthColor}
                  registerPasswordStrengthLabel={registerPasswordStrengthLabel}
                  registerPasswordHint={registerPasswordHint}
                  canSendRegisterOtp={canSendRegisterOtp}
                  onSendRegisterOtp={handleSendRegisterOtp}
                  onResetRegisterOtpState={resetRegisterOtpState}
                  registerOtpDigits={registerOtpDigits}
                  registerOtpInputRefs={registerOtpInputRefs}
                  updateRegisterOtpDigit={updateRegisterOtpDigit}
                  handleRegisterOtpKeyDown={handleRegisterOtpKeyDown}
                  handleRegisterOtpPaste={handleRegisterOtpPaste}
                  registerOtpResendSeconds={registerOtpResendSeconds}
                  onResendRegisterOtp={handleResendRegisterOtp}
                  termsAccepted={termsAccepted}
                  onTermsAcceptedChange={setTermsAccepted}
                  canContinueStep5={canContinueStep5}
                  onAuthContinue={handleAuthContinue}
                />
              ) : null}
            </div>

            <CheckoutStepFooter
              currentStep={currentStep}
              stepCanContinue={stepCanContinue}
              onBack={handleBack}
              onContinue={handleContinue}
            />
          </div>

          <CheckoutSidebar
            expert={bookingExpert}
            consultationType={consultationType}
            consultationFee={consultationFee}
            scheduleLabel={scheduleLabel}
            breakdown={breakdown}
            onConfirmBooking={currentStep === 4 ? handleConfirmBooking : undefined}
            isProcessingPayment={isProcessingPayment}
          />
        </div>
      </div>
    </section>
  );
}
