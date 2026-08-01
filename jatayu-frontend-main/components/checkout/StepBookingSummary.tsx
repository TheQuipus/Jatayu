import Image from "next/image";
import { Star, Lock } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { getConsultationLabel, MOCK_SEEKER_EMAIL, type ConsultationType } from "@/lib/booking";
import type { Expert } from "@/lib/experts";
import type { PaymentMethodId } from "./checkoutTypes";
import {
  formatCurrency,
  formatExperience,
  getPaymentMethodLabel,
} from "./checkoutUtils";
import StepHeader from "./StepHeader";
import styles from "./StepBookingSummary.module.css";

export type StepBookingSummaryProps = {
  expert: Expert;
  consultationType: ConsultationType | null;
  scheduleLabel: string;
  paymentMethod: PaymentMethodId | null;
  subject: string;
  context: string;
  registerFirstName: string;
  registerLastName: string;
  registerEmail: string;
  registerPhone: string;
  invoiceId: string;
  breakdown: {
    consultationFee: number;
    platformFee: number;
    gst: number;
    walletApplied: number;
    total: number;
  };
  onConfirmBooking: () => void;
};

export default function StepBookingSummary({
  expert,
  consultationType,
  scheduleLabel,
  paymentMethod,
  subject,
  context,
  registerFirstName,
  registerLastName,
  registerEmail,
  registerPhone,
  invoiceId,
  breakdown,
  onConfirmBooking,
}: StepBookingSummaryProps) {
  const expertSubtitle = expert.role.split("|")[0]?.trim() ?? expert.role;
  const fullName = [registerFirstName, registerLastName].filter(Boolean).join(" ") || "User";
  const userPhone = registerPhone ? `+91 ${registerPhone}` : "—";
  const userEmail = registerEmail || MOCK_SEEKER_EMAIL;

  return (
    <div className={styles.stepContent}>
      <StepHeader
        title="Booking Summary"
        subtitle="Please review your session and payment details before completing your booking."
      />

      <div className={styles.summaryPageCard}>
        {/* Booking Ref at top left */}
        <div className={styles.summaryRefTopLeft}>
          <span className={styles.invoiceEyebrow}>Booking Ref</span>
          <span className={styles.invoiceNumber}>{invoiceId}</span>
        </div>

        {/* Section 1: Expert Details */}
        <div className={styles.summarySection}>
          <div className={styles.sectionHeaderLine}>
            <span className={styles.sectionHeaderTitle}>Expert Details</span>
            <span className={styles.sectionLine} aria-hidden="true" />
          </div>

          <div className={styles.summaryExpertBanner}>
            <div className={styles.summaryExpertAvatar}>
              <Image
                src={expert.image}
                alt={expert.name}
                fill
                className={styles.expertAvatarImg}
                sizes="60px"
              />
            </div>
            <div className={styles.summaryExpertInfo}>
              <h3 className={styles.summaryExpertName}>{expert.name}</h3>
              <p className={styles.summaryExpertRole}>{expertSubtitle}</p>
              <div className={styles.summaryExpertMeta}>
                <span className={styles.statItem}>
                  <Star size={13} aria-hidden="true" />
                  {expert.rating} ({expert.reviewsCount ?? 243} reviews)
                </span>
                <span className={styles.statDot} aria-hidden="true" />
                <span className={styles.statItem}>{formatExperience(expert.role)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Session Details */}
        <div className={styles.summarySection}>
          <div className={styles.sectionHeaderLine}>
            <span className={styles.sectionHeaderTitle}>Session Details</span>
            <span className={styles.sectionLine} aria-hidden="true" />
          </div>
          <div className={styles.confirmDetailsGrid}>
            <div className={styles.confirmDetailItem}>
              <span className={styles.confirmDetailLabel}>Consultation Type</span>
              <span className={styles.confirmDetailValue}>
                {consultationType ? getConsultationLabel(consultationType) : "—"}
              </span>
            </div>

            <div className={styles.confirmDetailItem}>
              <span className={styles.confirmDetailLabel}>Schedule</span>
              <span className={styles.confirmDetailValue}>{scheduleLabel}</span>
            </div>

            <div className={`${styles.confirmDetailItem} ${styles.confirmDetailFullWidth}`}>
              <span className={styles.confirmDetailLabel}>Subject / Topic</span>
              <span className={styles.confirmDetailValue}>{subject || "General Consultation"}</span>
            </div>

            <div className={`${styles.confirmDetailItem} ${styles.confirmDetailFullWidth}`}>
              <span className={styles.confirmDetailLabel}>Describe your challenges and questions</span>
              <p className={styles.confirmDetailText}>{context || "No additional context provided."}</p>
            </div>
          </div>
        </div>

        {/* Section 3: Account Details */}
        <div className={styles.summarySection}>
          <div className={styles.sectionHeaderLine}>
            <span className={styles.sectionHeaderTitle}>Account Details</span>
            <span className={styles.sectionLine} aria-hidden="true" />
          </div>
          <div className={styles.confirmDetailsGrid}>
            <div className={styles.confirmDetailItem}>
              <span className={styles.confirmDetailLabel}>Full Name</span>
              <span className={styles.confirmDetailValue}>{fullName}</span>
            </div>

            <div className={styles.confirmDetailItem}>
              <span className={styles.confirmDetailLabel}>Email Address</span>
              <span className={styles.confirmDetailValue}>{userEmail}</span>
            </div>

            <div className={styles.confirmDetailItem}>
              <span className={styles.confirmDetailLabel}>Phone Number</span>
              <span className={styles.confirmDetailValue}>{userPhone}</span>
            </div>
          </div>
        </div>

        {/* Section 4: Payment Details */}
        <div className={styles.summarySection}>
          <div className={styles.sectionHeaderLine}>
            <span className={styles.sectionHeaderTitle}>Payment Details</span>
            <span className={styles.sectionLine} aria-hidden="true" />
          </div>

          <div className={styles.confirmDetailsGrid}>
            <div className={styles.confirmDetailItem}>
              <span className={styles.confirmDetailLabel}>Payment Method</span>
              <span className={styles.confirmDetailValue}>
                {getPaymentMethodLabel(paymentMethod)}
              </span>
            </div>
          </div>

          <div className={styles.priceBreakdownBox}>
            <div className={styles.priceRow}>
              <span>Consultation Fee</span>
              <strong>{formatCurrency(breakdown.consultationFee)}</strong>
            </div>
            <div className={styles.priceRow}>
              <span>GST (18%)</span>
              <strong>{formatCurrency(breakdown.gst)}</strong>
            </div>
            {breakdown.walletApplied > 0 ? (
              <div className={`${styles.priceRow} ${styles.creditsRow}`}>
                <span>Credits Applied</span>
                <strong>− {formatCurrency(breakdown.walletApplied)}</strong>
              </div>
            ) : null}

            <div className={styles.invoiceTotalRow}>
              <span className={styles.totalLabel}>Total Payable</span>
              <strong>{formatCurrency(breakdown.total)}</strong>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className={styles.confirmPayWrap}>
          <PrimaryButton
            label={`Confirm and Pay ${formatCurrency(breakdown.total)}`}
            variant="orange"
            fullWidth
            disabled={!paymentMethod}
            className={styles.confirmPayBtn}
            onClick={onConfirmBooking}
          />
          <p className={styles.summaryGuaranteedNote}>
            <Lock size={13} className={styles.summaryLockIcon} aria-hidden="true" />
            <span>100% Secure Checkout &bull; Verified Expert Guidance</span>
          </p>
        </div>
      </div>
    </div>
  );
}
