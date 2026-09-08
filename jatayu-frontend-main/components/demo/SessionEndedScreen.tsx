"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  PhoneOff,
  CheckCircle2,
  CreditCard,
  Clock,
  ShieldCheck,
  X,
  Smartphone,
  Building2,
  QrCode,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Lottie from "lottie-react";
import coinAnimation from "@/public/Lottie/coin_p.json";
import ContinueButton from "@/components/ui/ContinueButton";
import styles from "./SessionEndedScreen.module.css";

export type PendingExtension = {
  minutes: number;
  amount: number;
};

export type SessionEndedScreenProps = {
  role?: "seeker" | "expert";
  expertName?: string;
  expertRole?: string;
  clientName?: string;
  clientRole?: string;
  pendingExtension?: PendingExtension | null;
  isExpertBooked?: boolean;
  isExpertAvailable?: boolean;
  sessionDetailsUrl?: string;
  onLeaveRoom?: () => void;
  onStartExtendedSession?: (minutes: number) => void;
};

export default function SessionEndedScreen({
  role = "seeker",
  expertName = "Dr. Ananya Sharma",
  clientName = "Vikram Malhotra",
  pendingExtension,
  isExpertBooked = false,
  isExpertAvailable,
  sessionDetailsUrl,
  onLeaveRoom,
  onStartExtendedSession,
}: SessionEndedScreenProps) {
  const isSeeker = role === "seeker";
  const isExpert = role === "expert";
  const otherName = isSeeker ? expertName : clientName;

  const defaultLeaveUrl =
    sessionDetailsUrl ||
    (isExpert ? "/expert/requests/req-1" : "/seeker/bookings/booking-1");

  const handleReturnToSessionDetails = () => {
    if (onLeaveRoom) {
      onLeaveRoom();
    } else if (typeof window !== "undefined") {
      window.location.href = defaultLeaveUrl;
    }
  };

  // Rating state (for normal call end)
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [issueText, setIssueText] = useState<string>("");

  // Settlement states (when extension occurred on seeker side)
  const [paymentMethod, setPaymentMethod] = useState<"gateway" | "credits">("gateway");
  const [isPaymentCompleted, setIsPaymentCompleted] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [useCredits, setUseCredits] = useState<boolean>(true);

  const totalCredits = 450;
  const consultationFee = pendingExtension?.amount ?? 0;
  const creditsApplied = useCredits ? Math.min(totalCredits, consultationFee) : 0;
  const remainingCredits = totalCredits - creditsApplied;
  const netTotal = consultationFee - creditsApplied;

  // Fake Razorpay Modal state
  const [isRazorpayOpen, setIsRazorpayOpen] = useState<boolean>(false);
  const [selectedRazorpayOption, setSelectedRazorpayOption] = useState<string>("upi_instant");
  const [razorpayStatus, setRazorpayStatus] = useState<"idle" | "processing" | "success">("idle");

  // Seeker auto-resume state (10s countdown after payment)
  const [seekerResumeSeconds, setSeekerResumeSeconds] = useState<number>(10);

  useEffect(() => {
    if (!isPaymentCompleted) return;
    const timer = setInterval(() => {
      setSeekerResumeSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          const mins = pendingExtension?.minutes || 15;
          if (typeof window !== "undefined") {
            try {
              const bc = new BroadcastChannel("jatayu_demo_sync_v1");
              bc.postMessage({ type: "EXTENDED_SESSION_STARTED", mins });
              bc.close();
              localStorage.setItem("jatayu_demo_sync_v1", JSON.stringify({ type: "EXTENDED_SESSION_STARTED", mins, _t: Date.now() }));
            } catch (e) { }
          }
          onStartExtendedSession?.(mins);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaymentCompleted, onStartExtendedSession, pendingExtension]);

  const hasPendingSettlement = isSeeker && Boolean(pendingExtension && pendingExtension.amount > 0);
  const isExpertWaitingExtension = isExpert && Boolean(pendingExtension && pendingExtension.minutes > 0);

  // Expert waiting state (2-minute countdown buffer for session extension)
  const [expertWaitSeconds, setExpertWaitSeconds] = useState<number>(120);

  useEffect(() => {
    if (!isExpertWaitingExtension) return;
    const timer = setInterval(() => {
      setExpertWaitSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onStartExtendedSession?.(pendingExtension?.minutes || 15);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExpertWaitingExtension, onStartExtendedSession, pendingExtension]);

  const handleRate = (starIndex: number) => {
    if (rating === starIndex) {
      setRating(0);
      setHoverRating(0);
      setFeedbackSubmitted(false);
      setIssueText("");
      return;
    }
    setRating(starIndex);
    if (starIndex === 1) {
      setFeedbackSubmitted(false);
    } else {
      setFeedbackSubmitted(true);
    }
  };

  const handleIssueSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFeedbackSubmitted(true);
  };

  const handlePay = () => {
    if (isProcessingPayment) return;
    if (useCredits && netTotal === 0) {
      setPaymentMethod("credits");
      setIsProcessingPayment(true);
      setTimeout(() => {
        setIsProcessingPayment(false);
        setIsPaymentCompleted(true);
      }, 1000);
    } else {
      setPaymentMethod(useCredits && creditsApplied > 0 ? "credits" : "gateway");
      setRazorpayStatus("idle");
      setIsRazorpayOpen(true);
    }
  };

  const handleRazorpayPay = () => {
    if (razorpayStatus !== "idle") return;
    setRazorpayStatus("processing");
    setTimeout(() => {
      setRazorpayStatus("success");
      setTimeout(() => {
        setIsRazorpayOpen(false);
        const mins = pendingExtension?.minutes || 15;
        if (typeof window !== "undefined") {
          try {
            const bc = new BroadcastChannel("jatayu_demo_sync_v1");
            bc.postMessage({ type: "EXTENDED_SESSION_STARTED", mins });
            bc.close();
            localStorage.setItem(
              "jatayu_demo_sync_v1",
              JSON.stringify({ type: "EXTENDED_SESSION_STARTED", mins, _t: Date.now() })
            );
          } catch (e) { }
        }
        onStartExtendedSession?.(mins);
      }, 600);
    }, 1000);
  };

  // --- EXPERT WAITING SCREEN (When extension was agreed) ---
  if (isExpertWaitingExtension) {
    const waitMins = Math.floor(expertWaitSeconds / 60);
    const waitSecs = expertWaitSeconds % 60;
    const formattedWaitTime = `${String(waitMins).padStart(2, "0")}:${String(waitSecs).padStart(2, "0")}`;

    return (
      <div className={styles.overlay}>
        <div className={styles.container}>
          {/* Jatayu Angled Polygon Header */}
          <div className={styles.header}>
            <span className={styles.headerTitle}>Session Extension</span>
            <span className={styles.headerDots} />
          </div>

          {/* Jatayu Body */}
          <div className={styles.body}>
            <div className={styles.waitingIconWrapper}>
              <Clock size={28} className={styles.waitingIcon} />
            </div>

            <header>
              <h2 className={styles.title}>
                {pendingExtension?.minutes} min session will begin in
              </h2>
              <div className={styles.titleRule} aria-hidden="true" />
            </header>

            {/* Countdown Badge & Live Status */}
            <div className={styles.waitingStatusCard}>
              <div className={styles.waitingCountdownBadge}>
                {formattedWaitTime}
              </div>
              <div className={styles.waitingStatusRow}>
                <span className={styles.pulseDot} />
                <span>
                  {expertWaitSeconds > 0
                    ? "Note - be ready your session will automatically started."
                    : "Starting extended session..."}
                </span>
              </div>
            </div>
          </div>

          {/* Jatayu Angled Polygon Footer */}
          <div className={styles.footer} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Jatayu Angled Polygon Header */}
        <div className={styles.header}>
          <span className={styles.headerTitle}>
            {hasPendingSettlement && pendingExtension && !isPaymentCompleted
              ? "Extension Settlement"
              : "Session Ended"}
          </span>
          <span className={styles.headerDots} />
        </div>

        {/* Jatayu Body */}
        <div className={styles.body}>
          {hasPendingSettlement && pendingExtension ? (
            isPaymentCompleted ? (
              /* Payment Success State */
              <>
                <div className={styles.successIconWrapper}>
                  <CheckCircle2 size={32} className={styles.successIcon} />
                </div>

                <header>
                  <h2 className={styles.title}>Payment Successful</h2>
                  <div className={styles.titleRule} aria-hidden="true" />
                  <div className={styles.subtitle}>
                    Your extension payment of{" "}
                    <strong>
                      {paymentMethod === "credits" ? (
                        <span className={styles.inlineCreditsAmount}>
                          <Lottie
                            animationData={coinAnimation}
                            loop={true}
                            autoplay={true}
                            style={{ width: 18, height: 18, display: "inline-block", verticalAlign: "middle" }}
                          />
                          {pendingExtension.amount.toLocaleString()}
                        </span>
                      ) : (
                        `₹${pendingExtension.amount.toLocaleString()}`
                      )}
                    </strong>{" "}
                    has been settled. Your consultation with{" "}
                    <strong>{otherName}</strong> has been extended by{" "}
                    <strong>+{pendingExtension.minutes} minutes</strong>.
                  </div>
                </header>

                {/* 10s Auto Resume Countdown Display */}
                <div className={styles.waitingStatusCard}>
                  <div className={styles.waitingCountdownBadge}>
                    {seekerResumeSeconds}s
                  </div>
                  <div className={styles.waitingStatusRow}>
                    <span className={styles.pulseDotGreen} />
                    <span>Resuming extended session automatically...</span>
                  </div>
                </div>
              </>
            ) : (
              /* Extension Payment Breakdown & Method Selection */
              <>
                <div className={styles.endIconWrapper}>
                  <CreditCard size={24} className={styles.endIcon} />
                </div>

                <header>
                  <h2 className={styles.title}>Extend Session</h2>
                  <div className={styles.titleRule} aria-hidden="true" />
                  <p className={styles.subtitle}>
                    You requested to extend current session by{" "}
                    <strong>+{pendingExtension.minutes} minutes</strong>.
                  </p>
                </header>


                {/* Choose Payment Method (One Row Per Option) */}
                {/* Payment summary */}
                <div className={styles.paymentSummaryCard}>
                  <div className={styles.summaryTitleRow}>
                    <span className={styles.summaryTitle}>Payment summary</span>
                  </div>

                  <div className={styles.summaryList}>
                    {/* Consultation fee */}
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Consultation fee</span>
                      <strong className={styles.summaryValue}>
                        ₹{consultationFee.toLocaleString()}
                      </strong>
                    </div>

                    {/* Total credits */}
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Total credits</span>
                      <div className={styles.creditsBadge}>
                        <Lottie
                          animationData={coinAnimation}
                          loop={true}
                          autoplay={true}
                          style={{ width: 16, height: 16 }}
                        />
                        <span>{totalCredits.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Use Credits Checkbox & Credit Balance beside it */}
                    <label className={styles.useCreditsRow}>
                      <div className={styles.useCreditsLeft}>
                        <input
                          type="checkbox"
                          className={styles.useCreditsCheckbox}
                          checked={useCredits}
                          onChange={(e) => setUseCredits(e.target.checked)}
                          disabled={totalCredits <= 0 || isProcessingPayment}
                        />
                        <span className={styles.useCreditsLabel}>Use Credits</span>
                        <span className={styles.creditBalanceBeside}>
                          (Credit balance: {remainingCredits.toLocaleString()})
                        </span>
                      </div>
                      {useCredits && creditsApplied > 0 && (
                        <span className={styles.creditsDeduction}>
                          − ₹{creditsApplied.toLocaleString()}
                        </span>
                      )}
                    </label>

                    <div className={styles.summaryDivider} />

                    {/* Total */}
                    <div className={styles.summaryTotalRow}>
                      <span className={styles.summaryTotalLabel}>Total</span>
                      <strong className={styles.summaryTotalValue}>
                        {netTotal === 0 ? "₹0 (Paid with Credits)" : `₹${netTotal.toLocaleString()}`}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <ContinueButton
                      label={
                        isProcessingPayment
                          ? useCredits && netTotal === 0
                            ? "Deducting Credits..."
                            : "Connecting..."
                          : netTotal === 0
                            ? "Pay with Credits"
                            : `Pay ₹${netTotal.toLocaleString()}`
                      }
                      onClick={handlePay}
                      disabled={isProcessingPayment}
                    />
                  </div>
                </div>
              </>
            )
          ) : (
            /* Standard Clean Screen (No Extension Added) */
            <>
              <div className={styles.endIconWrapper}>
                <PhoneOff size={24} className={styles.endIcon} />
              </div>

              <header>
                <h2 className={styles.title}>Session Ended</h2>
                <div className={styles.titleRule} aria-hidden="true" />
                <p className={styles.subtitle}>
                  Your session with <strong>{otherName}</strong> has ended.
                </p>
              </header>

              {/* Clean Call Quality Rating */}
              <div className={styles.ratingSection}>
                <span className={styles.ratingLabel}>
                  {feedbackSubmitted
                    ? "Thanks for your feedback!"
                    : rating === 1
                    ? "What went wrong?"
                    : "How was the audio and video quality?"}
                </span>
                <div className={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        className={styles.starBtn}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => handleRate(star)}
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                      >
                        <Star
                          size={26}
                          className={isFilled ? styles.starFilled : styles.starEmpty}
                        />
                      </button>
                    );
                  })}
                </div>

                {rating === 1 && !feedbackSubmitted && (
                  <form className={styles.issueForm} onSubmit={handleIssueSubmit}>
                    <div className={styles.issueInputWrapper}>
                      <input
                        type="text"
                        className={styles.issueInput}
                        placeholder="Tell us what went wrong..."
                        value={issueText}
                        onChange={(e) => setIssueText(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="submit"
                        className={styles.issueSubmitBtn}
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Action: Return to Session Details (Tertiary CTA: Capslock & Orange) */}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.tertiaryCtaBtn}
                  onClick={handleReturnToSessionDetails}
                >
                  <span>RETURN TO SESSION DETAILS</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Jatayu Angled Polygon Footer */}
        <div className={styles.footer} />
      </div>

      {/* Fake Razorpay Checkout Modal */}
      {isRazorpayOpen && pendingExtension && (
        <div
          className={styles.razorpayOverlay}
          onClick={() => razorpayStatus === "idle" && setIsRazorpayOpen(false)}
        >
          <div className={styles.razorpayModal} onClick={(e) => e.stopPropagation()}>
            {/* Razorpay Header */}
            <div className={styles.razorpayHeader}>
              <div className={styles.razorpayHeaderTop}>
                <div className={styles.razorpayBrand}>
                  <div className={styles.razorpayLogoIcon}>R</div>
                  <span>Razorpay Trusted Business</span>
                </div>
                <button
                  type="button"
                  className={styles.razorpayCloseBtn}
                  onClick={() => razorpayStatus === "idle" && setIsRazorpayOpen(false)}
                  aria-label="Close Razorpay Checkout"
                  disabled={razorpayStatus !== "idle"}
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.razorpayHeaderDetails}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px", color: "#ffffff" }}>
                    Jatayu Consultations
                  </div>
                  <div className={styles.razorpayHeaderPurpose}>
                    Session Extension (+{pendingExtension.minutes} mins)
                  </div>
                </div>
                <div className={styles.razorpayHeaderAmount}>
                  ₹{netTotal.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Contact Details Bar */}
            <div className={styles.razorpayContactBar}>
              <span>+91 98765 43210</span>
              <span>rahul.sharma@example.com</span>
            </div>

            {/* Payment Options */}
            <div className={styles.razorpayBody}>
              <span className={styles.razorpaySectionLabel}>Preferred Payment Method</span>
              <div className={styles.razorpayOptionList}>
                {/* Instant UPI option */}
                <div
                  className={`${styles.razorpayOptionItem} ${
                    selectedRazorpayOption === "upi_instant" ? styles.razorpayOptionItemActive : ""
                  }`}
                  onClick={() => razorpayStatus === "idle" && setSelectedRazorpayOption("upi_instant")}
                >
                  <div className={styles.razorpayOptionLeft}>
                    <div className={styles.razorpayOptionIcon}>
                      <Smartphone size={18} />
                    </div>
                    <div className={styles.razorpayOptionInfo}>
                      <span className={styles.razorpayOptionTitle}>Google Pay / PhonePe / Paytm</span>
                      <span className={styles.razorpayOptionSubtitle}>Instant 1-Click UPI Payment</span>
                    </div>
                  </div>
                  <div
                    className={`${styles.razorpayRadio} ${
                      selectedRazorpayOption === "upi_instant" ? styles.razorpayRadioActive : ""
                    }`}
                  >
                    {selectedRazorpayOption === "upi_instant" && <div className={styles.razorpayRadioDot} />}
                  </div>
                </div>

                {/* QR Code Option */}
                <div
                  className={`${styles.razorpayOptionItem} ${
                    selectedRazorpayOption === "upi_qr" ? styles.razorpayOptionItemActive : ""
                  }`}
                  onClick={() => razorpayStatus === "idle" && setSelectedRazorpayOption("upi_qr")}
                >
                  <div className={styles.razorpayOptionLeft}>
                    <div className={styles.razorpayOptionIcon}>
                      <QrCode size={18} />
                    </div>
                    <div className={styles.razorpayOptionInfo}>
                      <span className={styles.razorpayOptionTitle}>Scan UPI QR Code</span>
                      <span className={styles.razorpayOptionSubtitle}>Pay using any UPI app</span>
                    </div>
                  </div>
                  <div
                    className={`${styles.razorpayRadio} ${
                      selectedRazorpayOption === "upi_qr" ? styles.razorpayRadioActive : ""
                    }`}
                  >
                    {selectedRazorpayOption === "upi_qr" && <div className={styles.razorpayRadioDot} />}
                  </div>
                </div>
              </div>

              <span className={styles.razorpaySectionLabel}>Cards & Netbanking</span>
              <div className={styles.razorpayOptionList}>
                {/* Cards Option */}
                <div
                  className={`${styles.razorpayOptionItem} ${
                    selectedRazorpayOption === "card" ? styles.razorpayOptionItemActive : ""
                  }`}
                  onClick={() => razorpayStatus === "idle" && setSelectedRazorpayOption("card")}
                >
                  <div className={styles.razorpayOptionLeft}>
                    <div className={styles.razorpayOptionIcon}>
                      <CreditCard size={18} />
                    </div>
                    <div className={styles.razorpayOptionInfo}>
                      <span className={styles.razorpayOptionTitle}>Credit / Debit Card</span>
                      <span className={styles.razorpayOptionSubtitle}>Visa, Mastercard, RuPay</span>
                    </div>
                  </div>
                  <div
                    className={`${styles.razorpayRadio} ${
                      selectedRazorpayOption === "card" ? styles.razorpayRadioActive : ""
                    }`}
                  >
                    {selectedRazorpayOption === "card" && <div className={styles.razorpayRadioDot} />}
                  </div>
                </div>

                {/* Netbanking Option */}
                <div
                  className={`${styles.razorpayOptionItem} ${
                    selectedRazorpayOption === "netbanking" ? styles.razorpayOptionItemActive : ""
                  }`}
                  onClick={() => razorpayStatus === "idle" && setSelectedRazorpayOption("netbanking")}
                >
                  <div className={styles.razorpayOptionLeft}>
                    <div className={styles.razorpayOptionIcon}>
                      <Building2 size={18} />
                    </div>
                    <div className={styles.razorpayOptionInfo}>
                      <span className={styles.razorpayOptionTitle}>Netbanking</span>
                      <span className={styles.razorpayOptionSubtitle}>All Indian Banks</span>
                    </div>
                  </div>
                  <div
                    className={`${styles.razorpayRadio} ${
                      selectedRazorpayOption === "netbanking" ? styles.razorpayRadioActive : ""
                    }`}
                  >
                    {selectedRazorpayOption === "netbanking" && <div className={styles.razorpayRadioDot} />}
                  </div>
                </div>
              </div>
            </div>

            {/* Razorpay Footer */}
            <div className={styles.razorpayFooter}>
              <button
                type="button"
                className={`${styles.razorpayPayBtn} ${
                  razorpayStatus === "success" ? styles.razorpayPayBtnSuccess : ""
                }`}
                onClick={handleRazorpayPay}
                disabled={razorpayStatus !== "idle"}
              >
                {razorpayStatus === "processing" ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : razorpayStatus === "success" ? (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Payment Successful! Resuming...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹{netTotal.toLocaleString()}</span>
                    <ShieldCheck size={16} />
                  </>
                )}
              </button>
              <div className={styles.razorpaySecurityBadge}>
                <ShieldCheck size={14} color="#10b981" />
                <span>Secured by Razorpay • 256-bit SSL encryption</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
