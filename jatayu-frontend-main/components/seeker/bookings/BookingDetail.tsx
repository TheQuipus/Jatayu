"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  ClipboardList,
  Download,
  FileText,
  Flag,
  Headphones,
  Info,
  MessageSquare,
  Mic,
  Languages,
  MapPin,
  Phone,
  Shield,
  Star,
  Video,
  X,
  Zap,
} from "lucide-react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ContactActionButton from "@/components/ui/ContactActionButton";
import { useSeekerBreadcrumbs } from "@/components/seeker/SeekerShellContext";
import {
  formatCurrency,
  type BookingDetail,
} from "@/lib/seekerDashboard";
import type { ConsultationType } from "@/lib/booking";
import styles from "./BookingDetail.module.css";

type BookingDetailViewProps = {
  booking: BookingDetail;
};

const CONSULTATION_ICONS: Record<
  ConsultationType,
  typeof MessageSquare
> = {
  text: MessageSquare,
  video: Video,
  live: Phone,
  audio: Mic,
};

function handleDownloadInvoice(booking: BookingDetail) {
  const lines = [
    "JATAYU INVOICE",
    "",
    `Invoice ID: ${booking.invoiceId}`,
    `Booking ID: ${booking.referenceId}`,
    `Date: ${booking.placedOnLabel}`,
    "",
    `Expert: ${booking.expert.name}`,
    `Consultation: ${booking.consultationLabel}`,
    `Schedule: ${booking.scheduledDateLabel}, ${booking.scheduledTimeLabel}`,
    "",
    "LINE ITEMS",
    `${booking.consultationLabel}\t${formatCurrency(booking.consultationFee)}`,
    `Platform Fee\t${formatCurrency(booking.platformFee)}`,
    `GST (18%)\t${formatCurrency(booking.gst)}`,
    ...(booking.walletApplied > 0
      ? [`Jatayu Credits Applied\t− ${formatCurrency(booking.walletApplied)}`]
      : []),
    "",
    `Total Paid\t${formatCurrency(booking.totalPaid)}`,
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${booking.invoiceId}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function BookingDetailView({ booking }: BookingDetailViewProps) {
  const ConsultationIcon = CONSULTATION_ICONS[booking.consultationType];
  const nameParts = booking.expert.name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const breadcrumbNode = useMemo(
    () => (
      <Breadcrumbs
        items={[
          { label: "Bookings", href: "/seeker/bookings" },
          { label: booking.referenceId },
        ]}
      />
    ),
    [booking.referenceId]
  );

  useSeekerBreadcrumbs(breadcrumbNode);

  return (
    <section className={styles.detail}>
      <div className={`container ${styles.detailInner}`}>
        <div className={styles.pageTop}>
          <Link href="/seeker/bookings" className={styles.backLink}>
            <ArrowLeft size={14} aria-hidden="true" />
            Back to Bookings
          </Link>
        </div>

        <div className={styles.mainGrid}>
          <div className={styles.mainCol}>
            <div className={styles.bookingHero}>
              <article className={styles.bookingExpertCard}>
                <div className={styles.expertCategoryBadge}>
                  <span className={styles.expertCategoryDot} />
                  {(booking.expert.category || booking.expert.topics[0] || "Expert").toUpperCase()}
                </div>
                <div className={styles.bookingExpertImageWrap}>
                  <Image
                    src={booking.expert.image}
                    alt={booking.expert.name}
                    fill
                    className={styles.bookingExpertImage}
                    sizes="348px"
                    priority
                  />
                </div>
                <div className={styles.bookingExpertOverlay}>
                  <p className={styles.bookingExpertName}>
                    {booking.expert.name.toUpperCase()}
                    <BadgeCheck size={18} className={styles.expertVerified} aria-hidden="true" />
                  </p>
                  <p className={styles.bookingExpertDesc}>{booking.expert.desc}</p>
                </div>
              </article>

              <div className={styles.bookingExpertInfo}>
                <h1 className={`display ${styles.displayName}`}>
                  <span>{firstName}</span>
                  <span className="t-muted">{lastName}</span>
                </h1>

                <p className={styles.roleSub}>{booking.expert.role}</p>

                <div className={styles.starDivider}>
                  <span className={styles.dividerStar}>✦</span>
                  <span className={styles.dividerLine} />
                </div>

                <div className={styles.ratingsRow}>
                  <div className={styles.ratingItem}>
                    <Star size={16} fill="#EAB308" stroke="#EAB308" />
                    <span className={styles.ratingText}>
                      <strong>{booking.expert.rating}</strong> ({booking.expert.reviewsCount || 120} reviews)
                    </span>
                  </div>
                  <div className={styles.ratingItem}>
                    <Briefcase size={16} className={styles.statsIcon} />
                    <span className={styles.ratingText}>
                      <strong>{booking.expert.sessionsCompleted || "350+ Sessions Completed"}</strong>
                    </span>
                  </div>
                </div>

                <div className={styles.metaRow}>
                  <div className={styles.metaItem}>
                    <div className={styles.metaIconBadge}>
                      <Languages size={13} />
                    </div>
                    <span className={styles.metaVal}>{booking.expert.languages.join(", ")}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <div className={styles.metaIconBadge}>
                      <MapPin size={13} />
                    </div>
                    <span className={styles.metaVal}>{booking.expert.location || "India"}</span>
                  </div>
                  <div className={`${styles.metaItem} ${styles.metaItemGreen}`}>
                    <Zap size={14} fill="currentColor" />
                    <span className={styles.metaVal}>Replies in {booking.expert.replyTime}</span>
                  </div>
                </div>

                <p className={styles.bioText}>{booking.expert.bio || booking.expert.desc}</p>
              </div>
            </div>

            <article className={styles.sessionCard}>
              <div className={styles.sectionHead}>
                <ClipboardList size={16} aria-hidden="true" />
                <h2 className={styles.sectionTitle}>Session Details</h2>
              </div>

              <div className={styles.sessionSummary}>
                <div className={styles.summaryMain}>
                  <span className={styles.summaryIconWrap} aria-hidden="true">
                    <ConsultationIcon size={22} strokeWidth={2} />
                  </span>
                  <div className={styles.summaryCopy}>
                    <h1 className={styles.summaryTitle}>{booking.consultationLabel}</h1>
                    <p className={styles.summaryMeta}>
                      Booking ID: {booking.referenceId} • Placed on {booking.placedOnLabel}
                    </p>
                  </div>
                </div>

                {booking.consultationType === "live" ? (
                  <div className={styles.sessionSummaryAction}>
                    <ContactActionButton
                      label="Join Call Room"
                      avatarSrc={booking.expert.image}
                      avatarAlt={booking.expert.name}
                      href="#"
                      variant="dark"
                      wrapperClassName={styles.joinCallCtaWrap}
                      className={styles.joinCallCtaBtn}
                      fullWidth
                    />
                  </div>
                ) : null}
              </div>

              <div className={styles.sessionGrid}>
                <div className={styles.sessionInset}>
                  <span className={styles.sessionLabel}>Scheduled For</span>
                  <strong className={styles.sessionValue}>{booking.scheduledDateLabel}</strong>
                  <span className={styles.sessionHint}>{booking.scheduledTimeLabel}</span>
                </div>
                <div className={styles.sessionInset}>
                  <span className={styles.sessionLabel}>Duration</span>
                  <strong className={styles.sessionValue}>{booking.durationLabel}</strong>
                  <span className={styles.sessionHint}>{booking.consultationLabel}</span>
                </div>
              </div>

              <div className={styles.contextSection}>
                <span className={styles.fieldLabel}>Your Context / Question</span>
                {booking.subject ? (
                  <p className={styles.contextSubject}>{booking.subject}</p>
                ) : null}
                <p className={styles.contextText}>{booking.context}</p>
              </div>

              {booking.attachments.length > 0 ? (
                <div className={styles.attachmentsSection}>
                  <span className={styles.fieldLabel}>Attachments</span>
                  <ul className={styles.attachmentList}>
                    {booking.attachments.map((file) => (
                      <li key={file.name}>
                        <button type="button" className={styles.attachmentCard}>
                          <span className={styles.attachmentIconWrap} aria-hidden="true">
                            <FileText size={18} />
                          </span>
                          <span className={styles.attachmentCopy}>
                            <span className={styles.attachmentName}>{file.name}</span>
                            <span className={styles.attachmentSize}>{file.size}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>

          </div>

          <aside className={styles.rightCol}>
            <div className={styles.rightColInner}>
              <div className={styles.bookingBox}>
                <div className={styles.bookingHeader}>
                  <span className={styles.bookingHeaderTitle}>Payment Summary</span>
                  <span className={styles.bookingHeaderDots} />
                  <div className={styles.soundwaveIcon} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div className={styles.panelBody}>
                  <div className={styles.paymentHead}>
                    <span className={styles.paymentStatusLabel}>Status</span>
                    <span
                      className={`${styles.paymentBadge} ${
                        booking.paymentStatus === "paid" ? styles.paymentBadgePaid : styles.paymentBadgePending
                      }`}
                    >
                      {booking.paymentStatus === "paid" ? "Paid" : "Pending"}
                    </span>
                  </div>

                  <div className={styles.priceList}>
                    <div className={styles.priceRow}>
                      <span>Consultation Fee</span>
                      <strong>{formatCurrency(booking.consultationFee)}</strong>
                    </div>
                    <div className={styles.priceRow}>
                      <span>Platform Fee</span>
                      <strong>{formatCurrency(booking.platformFee)}</strong>
                    </div>
                    <div className={styles.priceRow}>
                      <span>GST (18%)</span>
                      <strong>{formatCurrency(booking.gst)}</strong>
                    </div>
                    {booking.walletApplied > 0 ? (
                      <div className={`${styles.priceRow} ${styles.walletRow}`}>
                        <span>Wallet Applied</span>
                        <strong>− {formatCurrency(booking.walletApplied)}</strong>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.totalRow}>
                    <span>Total Paid</span>
                    <strong>{formatCurrency(booking.totalPaid)}</strong>
                  </div>

                  <button
                    type="button"
                    className={styles.sidebarInvoiceBtn}
                    onClick={() => handleDownloadInvoice(booking)}
                  >
                    <Download size={14} aria-hidden="true" />
                    Download Invoice
                  </button>
                </div>

                <div className={styles.bookingFooter} aria-hidden="true" />
              </div>

              <div className={styles.bookingBox}>
                <div className={styles.bookingHeader}>
                  <span className={styles.bookingHeaderTitle}>Manage Booking</span>
                  <span className={styles.bookingHeaderDots} />
                  <div className={styles.soundwaveIcon} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div className={styles.panelBody}>
                  <div className={styles.manageActions}>
                    <button type="button" className={styles.manageAction}>
                      <span className={styles.manageActionIcon} aria-hidden="true">
                        <CalendarClock size={18} />
                      </span>
                      <span className={styles.manageActionCopy}>
                        <strong>Reschedule Session</strong>
                        <span>Change date or time (Free up to 24h before)</span>
                      </span>
                    </button>
                    <button type="button" className={styles.manageAction}>
                      <span className={`${styles.manageActionIcon} ${styles.manageActionIconDanger}`} aria-hidden="true">
                        <X size={18} />
                      </span>
                      <span className={styles.manageActionCopy}>
                        <strong>Cancel Booking</strong>
                        <span>Review cancellation policy before proceeding</span>
                      </span>
                    </button>
                  </div>

                  <div className={styles.policyBox}>
                    <Info size={16} className={styles.policyIcon} aria-hidden="true" />
                    <p className={styles.policyText}>
                      <strong>Cancellation Policy:</strong> Free cancellation up to 24 hours before the
                      session. 50% refund within 24 hours. No-shows are non-refundable.{" "}
                      <Link href="/terms" className={styles.policyLink}>
                        Read full policy
                      </Link>
                    </p>
                  </div>
                </div>

                <div className={styles.bookingFooter} aria-hidden="true" />
              </div>

              <div className={styles.bookingBox}>
                <div className={styles.bookingHeader}>
                  <span className={styles.bookingHeaderTitle}>Need Help?</span>
                  <span className={styles.bookingHeaderDots} />
                  <div className={styles.soundwaveIcon} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div className={styles.panelBody}>
                  <p className={styles.helpCopy}>
                    Having issues with your booking or the expert? Our support team is here to help.
                  </p>
                  <ul className={styles.helpLinks}>
                    <li>
                      <Link href="/seeker/dashboard#support" className={styles.helpLink}>
                        <Headphones size={14} aria-hidden="true" />
                        Contact Support
                      </Link>
                    </li>
                    <li>
                      <Link href="/terms" className={styles.helpLink}>
                        <Shield size={14} aria-hidden="true" />
                        Quality Assurance Policy
                      </Link>
                    </li>
                    <li>
                      <Link href="/seeker/dashboard#support" className={styles.helpLinkDanger}>
                        <Flag size={14} aria-hidden="true" />
                        Report an Issue
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className={styles.bookingFooter} aria-hidden="true" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
