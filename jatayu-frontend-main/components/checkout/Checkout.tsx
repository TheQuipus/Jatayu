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
  registerSeeker,
  verifySeekerOtp,
  resendSeekerOtp,
  seekerLogin,
  setSeekerId,
  getSeekerId,
  removeSeekerId,
  setToken,
  getToken,
  removeToken,
  getPublicExpert,
} from "@/lib/api";
import {
  fetchSeekerProfileData,
  getStoredSeekerProfile,
  SEEKER_PROFILE_UPDATED_EVENT,
} from "@/lib/seekerProfileApi";
import { isDuplicateRegistrationMessage } from "@/lib/expertOnboardingStatus";
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
    // The server-provided booking rule is applied by SlotCalendarView once
    // booking options load. This initial choice only excludes past slots.
    const bufferAdvance = Date.now();
    const parseMinutes = (value: string) => {
      if (!value) return null;
      const ampmMatch = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
      if (ampmMatch) {
        let hour = Number(ampmMatch[1]);
        if (ampmMatch[3].toUpperCase() === "PM" && hour !== 12) hour += 12;
        if (ampmMatch[3].toUpperCase() === "AM" && hour === 12) hour = 0;
        return hour * 60 + Number(ampmMatch[2]);
      }
      const h24Match = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
      if (h24Match) {
        return Number(h24Match[1]) * 60 + Number(h24Match[2]);
      }
      return null;
    };

    for (let offset = 0; offset < 28; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
      const matchingRules = expert.availabilities.filter((rule) =>
        rule.days.some((day) => {
          const cleanD = day.trim().toLowerCase();
          return cleanD.startsWith(dayName.toLowerCase()) || dayName.toLowerCase().startsWith(cleanD.slice(0, 3));
        })
      );
      if (matchingRules.length > 0) {
        const hasFutureSlot = matchingRules.some((rule) => {
          const minutes = parseMinutes(rule.fromTime);
          if (minutes === null) return true;
          const slotDate = new Date(d);
          slotDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
          return slotDate.getTime() >= bufferAdvance;
        });
        if (hasFutureSlot) return offset;
      }
    }
    return 0;
  }, [expert.availabilities]);
  const [selectedDate, setSelectedDate] = useState(`date-${initialAvailableDateOffset}`);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedSlotTime, setSelectedSlotTime] = useState("");
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
    if (getToken() && getSeekerId()) {
      setRegisterOtpVerified(true);
    }

    void fetchSeekerProfileData()
      .then((fetched) => {
        applyProfile(fetched);
        if (getToken() && getSeekerId()) {
          setRegisterOtpVerified(true);
        }
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
  const [publicExpertData, setPublicExpertData] = useState<Expert | null>(null);

  useEffect(() => {
    let active = true;
    const identifier = expert.id || expertSlug(expert.name);
    const token = getToken();

    if (token) {
      void fetchBookingOptions(identifier)
        .then((options) => {
          if (!active) return;
          setBookingOptions(options);
          if (options.formats.length > 0) {
            setConsultationType((current) =>
              current && options.formats.includes(current) ? current : options.formats[0] as ConsultationType,
            );
          }
          setSelectedSlot("");
          setSelectedSlotTime("");
        })
        .catch((error) => {
          console.warn("[Checkout] Notice fetching bookingOptions API:", error);
          void getPublicExpert(identifier).then((pubExp) => {
            if (active && pubExp) {
              setPublicExpertData(pubExp);
            }
          });
        });
    } else {
      void getPublicExpert(identifier)
        .then((pubExp) => {
          if (!active || !pubExp) return;
          setPublicExpertData(pubExp);
          const formats = pubExp.formats;
          if (formats && formats.length > 0) {
            setConsultationType((current) =>
              current && formats.includes(current) ? current : formats[0] as ConsultationType,
            );
          }
          setSelectedSlot("");
          setSelectedSlotTime("");
        })
        .catch((error) => {
          console.error("[Checkout] Error fetching public expert API:", error);
        });
    }

    return () => { active = false; };
  }, [expert, expertIdentifier, seeker]);

  const bookingExpert = useMemo<Expert>(() => {
    const source = publicExpertData || expert;
    return {
      ...source,
      id: bookingOptions?.expertId || publicExpertData?.id || expert.id,
      timezone: bookingOptions?.timezone || publicExpertData?.timezone || expert.timezone || "Asia/Kolkata",
      formats: (bookingOptions?.formats && bookingOptions.formats.length > 0)
        ? bookingOptions.formats
        : (publicExpertData?.formats && publicExpertData.formats.length > 0)
        ? publicExpertData.formats
        : expert.formats,
      formatPrices: bookingOptions?.formatPrices || publicExpertData?.formatPrices || expert.formatPrices,
      availabilities: (bookingOptions?.availabilities && bookingOptions.availabilities.length > 0)
        ? bookingOptions.availabilities
        : (publicExpertData?.availabilities && publicExpertData.availabilities.length > 0)
        ? publicExpertData.availabilities
        : expert.availabilities,
    };
  }, [bookingOptions, publicExpertData, expert]);

  const [currentSeekerId, setCurrentSeekerId] = useState("");
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
  const canContinueStep3 = Boolean(selectedDate && selectedSlot && selectedSlotTime);
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
      const isComplete = char && next.every((digit) => digit !== "");
      if (isComplete) {
        setRegisterOtpVerified(true);
        if (currentSeekerId) {
          verifySeekerOtp({ seekerId: currentSeekerId, code: next.join("") })
            .then((res) => {
              if (res.token) setToken(res.token);
            })
            .catch((err) => console.warn("OTP verification notice:", err));
        }
      } else {
        setRegisterOtpVerified(false);
      }
      return next;
    });
    if (char && index < CHECKOUT_OTP_LENGTH - 1) {
      registerOtpInputRefs.current[index + 1]?.focus();
    }
  }, [currentSeekerId]);

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
    if (next.every((digit) => digit !== "") && currentSeekerId) {
      verifySeekerOtp({ seekerId: currentSeekerId, code: next.join("") })
        .then((res) => {
          if (res.token) setToken(res.token);
        })
        .catch((err) => console.warn("OTP verification notice:", err));
    }
    const focusIndex = Math.min(pasted.length, CHECKOUT_OTP_LENGTH - 1);
    registerOtpInputRefs.current[focusIndex]?.focus();
  };

  const handleSendRegisterOtp = async () => {
    setRegisterSubmitAttempted(true);
    setRegisterTouched({
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      password: true,
    });
    if (!isRegisterFormComplete) return;

    try {
      const fullName = [registerFirstName.trim(), registerLastName.trim()].filter(Boolean).join(" ");
      const response = await registerSeeker({
        fullName,
        email: registerEmail.trim(),
        password: registerPassword,
        phone: registerPhone.trim(),
      });
      if (response?.seekerId) {
        setCurrentSeekerId(response.seekerId);
        setSeekerId(response.seekerId);
      }
      if ((response as any)?.token) {
        setToken((response as any).token);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      if (isDuplicateRegistrationMessage(message)) {
        setBookingError(`${message} Please log in to your existing account.`);
        setLoginEmail(registerEmail.trim());
        setIsAuthLogin(true);
        setShowAuthModal(true);
        return;
      }
      console.warn("Seeker registration API notice:", err);
      setBookingError(message);
      return;
    }

    setRegisterOtpSent(true);
    setRegisterOtpVerified(false);
    setRegisterOtpDigits(Array(CHECKOUT_OTP_LENGTH).fill(""));
    setRegisterOtpResendSeconds(CHECKOUT_OTP_RESEND_SECONDS);
    queueMicrotask(() => registerOtpInputRefs.current[0]?.focus());
  };

  const handleResendRegisterOtp = async () => {
    if (registerOtpResendSeconds > 0) return;
    if (currentSeekerId) {
      try {
        await resendSeekerOtp({ seekerId: currentSeekerId });
      } catch (err) {
        console.warn("Resend OTP notice:", err);
      }
    }
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

  const handleLoginSubmit = async () => {
    setLoginSubmitAttempted(true);
    if (!loginEmail.trim() || !loginPassword.trim()) return;

    try {
      const authRes = await seekerLogin({
        email: loginEmail.trim(),
        password: loginPassword.trim(),
      });
      if (authRes?.token) {
        setToken(authRes.token);
      }
      if (authRes?.user?.id) {
        setSeekerId(authRes.user.id);
      }
      setRegisterEmail(loginEmail.trim());
      setRegisterOtpVerified(true);
      setTermsAccepted(true);
      setShowAuthModal(false);
      setCurrentStep(4);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Seeker login failed.";
      console.warn("Seeker login API notice:", err);
      setBookingError(msg);
    }
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
      setSelectedSlotTime("");
    }
    setSelectedDate(dateId);
  }

  function handleContinue() {
    if (!stepCanContinue) return;
    if (currentStep === 3) {
      const isSeeker = Boolean(getToken() && getSeekerId());
      const isAuthenticated = Boolean(seeker || registerOtpVerified || isSeeker);
      if (isAuthenticated) {
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

    if (!getSeekerId() && currentSeekerId) {
      setSeekerId(currentSeekerId);
    }

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

    const isSeeker = Boolean(getToken() && getSeekerId());
    if (!isSeeker && !seeker && !registerOtpVerified) {
      setIsProcessingPayment(false);
      setShowAuthModal(true);
      return;
    }
    if (!getSeekerId() && currentSeekerId) {
      setSeekerId(currentSeekerId);
    }

    try {
      if (!consultationType || !selectedSlot || !selectedSlotTime) {
        throw new Error("Select a consultation type and available slot");
      }
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
      for (let attempt = 0; verified.status === "payment_verified" && attempt < 5; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
        const latest = await fetchBooking(created.booking.id).catch(() => null);
        if (latest) verified = latest;
      }
      const validVerifiedStatuses = ["confirmed", "payment_verified", "awaiting_expert", "pending", "accepted"];
      if (!verified || !validVerifiedStatuses.includes(String(verified.status || "").toLowerCase())) {
        throw new Error("Payment verification failed. Please check My Bookings.");
      }
      setConfirmedBookingId(verified.id);
      setBookingConfirmed(true);
      clearBookingIdempotencyKey(fingerprint);
    } catch (err) {
      console.error("Failed to process Razorpay payment:", err);
      const errMsg = err instanceof Error ? err.message : "Unable to complete booking";
      if (errMsg.toLowerCase().includes("not authorized") || errMsg.toLowerCase().includes("sign in")) {
        removeToken();
        removeSeekerId();
        setRegisterOtpVerified(false);
        setBookingError("Your seeker session expired or is invalid. Please log in or register to complete booking.");
        setShowAuthModal(true);
      } else {
        setBookingError(errMsg);
      }
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
    currentStep > 1 && canContinueStep1,
    currentStep > 2 && canContinueStep2,
    currentStep > 3 && canContinueStep3,
    bookingConfirmed,
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
                  minimumLeadTimeMinutes={bookingOptions?.minimumLeadTimeMinutes}
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
