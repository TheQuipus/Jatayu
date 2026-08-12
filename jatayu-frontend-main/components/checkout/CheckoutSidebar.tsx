import Image from "next/image";
import { Star, Compass, Calendar } from "lucide-react";
import { getConsultationLabel, type ConsultationType, type BookingBreakdown } from "@/lib/booking";
import type { Expert } from "@/lib/experts";
import ContinueButton from "@/components/ui/ContinueButton";
import {
  formatCurrency,
  formatExperience,
  formatSessions,
  shortTopicLabel,
} from "./checkoutUtils";
import styles from "./CheckoutSidebar.module.css";

export type CheckoutSidebarProps = {
  expert: Expert;
  consultationType: ConsultationType | null;
  consultationFee: number;
  scheduleLabel: string;
  breakdown: BookingBreakdown;
  onConfirmBooking?: () => void;
};

export default function CheckoutSidebar({
  expert,
  consultationType,
  consultationFee,
  scheduleLabel,
  breakdown,
  onConfirmBooking,
}: CheckoutSidebarProps) {
  const expertSubtitle = expert.role.split("|")[0]?.trim() ?? expert.role;
  const expertTags = expert.topics.slice(0, 3).map(shortTopicLabel);

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
          {expertTags[0] && (
            <span className={styles.expertCategory}>{expertTags[0]}</span>
          )}
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
    </>
  );

  const renderSelectionSummary = () => (
    <>
      <div className={`${styles.sectionDivider} ${styles.sectionDividerLeft}`}>
        <span>Session Detail</span>
      </div>

      <div className={styles.selectionGrid}>
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
      </div>
    </>
  );

  const renderPriceBreakdown = () => (
    <>
      <div className={`${styles.sectionDivider} ${styles.sectionDividerLeft}`}>
        <span>Payment Summary</span>
      </div>

      <div className={styles.priceList}>
        <div className={styles.priceRow}>
          <span>Consultation Fee</span>
          <strong>
            {consultationFee > 0 ? formatCurrency(breakdown.consultationFee) : "—"}
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
    </>
  );

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarInner}>
        <div className={styles.bookingBox}>
          <div className={styles.bookingHeader}>
            {!onConfirmBooking && (
              <>
                <span className={styles.bookingHeaderTitle}>Booking summary</span>
                <span className={styles.bookingHeaderDots} aria-hidden="true" />
              </>
            )}
            {onConfirmBooking && (
              <ContinueButton
                label={
                  breakdown.walletApplied > 0 && breakdown.total === 0
                    ? "Confirm Booking"
                    : `Confirm and Pay ${consultationFee > 0 ? formatCurrency(breakdown.total) : "—"}`
                }
                disabled={false}
                className={styles.confirmPayBtn}
                onClick={onConfirmBooking}
              />
            )}
          </div>

          <div className={styles.bookingBody}>
            {renderExpertSummary()}
            {renderSelectionSummary()}
            {renderPriceBreakdown()}
          </div>

          <div className={styles.bookingFooter}>
            <span className={styles.totalLabel}>
              Total
            </span>
            <span className={styles.totalAmount}>
              {consultationFee > 0 ? formatCurrency(breakdown.total) : "—"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
