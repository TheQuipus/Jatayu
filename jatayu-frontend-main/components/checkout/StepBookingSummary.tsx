import { MOCK_SEEKER_EMAIL, type ConsultationType } from "@/lib/booking";
import type { Expert } from "@/lib/experts";
import type { PaymentMethodId, PaymentDetailsState } from "./checkoutTypes";
import StepHeader from "./StepHeader";
import styles from "./StepBookingSummary.module.css";

export type StepBookingSummaryProps = {
  expert: Expert;
  consultationType: ConsultationType | null;
  scheduleLabel: string;
  paymentMethod: PaymentMethodId | null;
  paymentDetails?: PaymentDetailsState;
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
  onConfirmBooking?: () => void;
};

export default function StepBookingSummary({
  expert,
  consultationType,
  scheduleLabel,
  paymentMethod,
  paymentDetails,
  subject,
  context,
  registerFirstName,
  registerLastName,
  registerEmail,
  registerPhone,
  invoiceId,
  breakdown,
}: StepBookingSummaryProps) {
  const fullName = [registerFirstName, registerLastName].filter(Boolean).join(" ") || "User";
  const userPhone = registerPhone ? `+91 ${registerPhone}` : "—";
  const userEmail = registerEmail || MOCK_SEEKER_EMAIL;

  return (
    <div className={styles.stepContent}>
      <StepHeader
        title="Booking Summary"
        subtitle="Please review your session and payment details before completing your booking."
      />
      <div className={styles.bookingBox}>
        <div className={styles.bookingBody}>
          {/* Section 2: Your Query */}
          <div className={styles.summarySection}>
            <div className={styles.sectionHeaderLine}>
              <span className={styles.sectionHeaderTitle}>Your Query</span>
              <span className={styles.sectionLine} aria-hidden="true" />
            </div>

            <div className={styles.sessionGrid}>
              <div className={`${styles.sessionInset} ${styles.sessionInsetFull}`}>
                <span className={styles.sessionLabel}>Subject / Topic</span>
                <span className={styles.sessionValue}>{subject || "General Consultation"}</span>
              </div>

              <div className={`${styles.sessionInset} ${styles.sessionInsetFull}`}>
                <span className={styles.sessionLabel}>Describe your challenges and questions</span>
                <p className={styles.contextText}>{context || "No additional context provided."}</p>
              </div>
            </div>
          </div>

          {/* Section 3: Account Details */}
          <div className={styles.summarySection}>
            <div className={styles.sectionHeaderLine}>
              <span className={styles.sectionHeaderTitle}>Account Details</span>
              <span className={styles.sectionLine} aria-hidden="true" />
            </div>

            <div className={styles.sessionGrid}>
              <div className={styles.sessionInset}>
                <span className={styles.sessionLabel}>Full Name</span>
                <span className={styles.sessionValue}>{fullName}</span>
              </div>

              <div className={styles.sessionInset}>
                <span className={styles.sessionLabel}>Email Address</span>
                <span className={styles.sessionValue}>{userEmail}</span>
              </div>

              <div className={styles.sessionInset}>
                <span className={styles.sessionLabel}>Phone Number</span>
                <span className={styles.sessionValue}>{userPhone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
