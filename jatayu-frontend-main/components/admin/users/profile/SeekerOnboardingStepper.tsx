"use client";

import { useMemo, useState } from "react";
import {
  Check,
  FastForward,
  AlertTriangle,
  Compass,
  MapPin,
  Clock,
  CheckCircle2,
} from "lucide-react";
import type { SeekerUser } from "@/lib/adminUserManagement";
import {
  analyzeSeekerDropoutClient,
  type SeekerOnboardingAnalytics,
  type SeekerStepMetric,
} from "@/lib/seekerDropoutTracker";
import styles from "./SeekerOnboardingStepper.module.css";

interface SeekerOnboardingStepperProps {
  seeker: SeekerUser;
  analytics?: SeekerOnboardingAnalytics;
}

export default function SeekerOnboardingStepper({
  seeker,
  analytics: serverAnalytics,
}: SeekerOnboardingStepperProps) {
  const [activeTooltipStep, setActiveTooltipStep] = useState<string | null>(null);

  const data = useMemo(() => {
    if (serverAnalytics && Array.isArray(serverAnalytics.steps) && serverAnalytics.steps.length > 0) {
      return serverAnalytics;
    }
    return analyzeSeekerDropoutClient(seeker);
  }, [seeker, serverAnalytics]);

  // Compute filled line width percentage based on active/completed steps
  const filledLineStyle = useMemo(() => {
    const total = data.steps.length || 6;
    if (data.isComplete) {
      return { width: `calc((100% / ${total}) * ${total - 1})` };
    }
    const activeIdx = data.steps.findIndex((s) => s.status === "dropout" || s.status === "in_progress");
    if (activeIdx <= 0) {
      return { width: "0px" };
    }
    return { width: `calc((100% / ${total}) * ${activeIdx})` };
  }, [data]);

  return (
    <section className={styles.card} aria-label="Seeker Onboarding Progress & Dropout Tracker">
      {/* Header bar: Title, Progress Metric & Dropout/Complete Status */}
      <div className={styles.headerRow}>
        <div className={styles.headerTitleGroup}>
          <span className={styles.headerIcon}>
            <Compass size={15} />
          </span>
          <h3 className={styles.headerTitle}>Onboarding Funnel Progress</h3>
          <span className={styles.completionPill}>
            {data.completionPercent}% Complete
          </span>
        </div>

        {data.isComplete ? (
          <span className={`${styles.statusPill} ${styles.statusComplete}`}>
            <CheckCircle2 size={13} />
            <span>Onboarding Complete</span>
          </span>
        ) : data.isDropout ? (
          <span className={`${styles.statusPill} ${styles.statusDropout}`}>
            <span className={styles.pulseDot} />
            <AlertTriangle size={13} />
            <span>
              Dropped Out at {data.dropoutStepTitle || data.dropoutStep}
              {data.idleMinutes > 0 ? ` (${data.idleMinutes}m idle)` : ""}
            </span>
          </span>
        ) : (
          <span className={`${styles.statusPill} ${styles.statusInProgress}`}>
            <span className={styles.pulseDot} />
            <Clock size={13} />
            <span>In Progress ({data.dropoutStepTitle || data.dropoutStep})</span>
          </span>
        )}
      </div>

      {/* Horizontal Stepper Timeline (Image 2 style) */}
      <div className={styles.stepperWrapper}>
        <div className={styles.stepperTrack}>
          {/* Background grey connector line */}
          <div className={styles.connectorLine} aria-hidden="true" />
          {/* Filled active connector line */}
          <div
            className={styles.connectorLineFilled}
            style={filledLineStyle}
            aria-hidden="true"
          />

          {data.steps.map((step: SeekerStepMetric, idx: number) => {
            const isDropout = step.status === "dropout";
            const isInProgress = step.status === "in_progress";
            const isSubmitted = step.status === "submitted";
            const isSkipped = step.status === "skipped";

            return (
              <button
                key={step.id}
                type="button"
                className={`${styles.stepItem} ${
                  isDropout ? styles.stepItemDropout : ""
                } ${isInProgress ? styles.stepItemInProgress : ""}`}
                onClick={() => setActiveTooltipStep(activeTooltipStep === step.id ? null : step.id)}
                aria-label={`${step.title}: ${step.status} - ${step.valueSummary}`}
              >
                {/* Pointer callout anchored directly above dropout / in-progress node */}
                {isDropout && (
                  <div className={styles.pointerCallout} role="status">
                    <MapPin size={10} />
                    <span>Dropped Out Here</span>
                  </div>
                )}
                {isInProgress && (
                  <div className={styles.inProgressCallout} role="status">
                    <Clock size={10} />
                    <span>Current Step</span>
                  </div>
                )}

                {/* Squircle Node Badge */}
                <div
                  className={`${styles.badge} ${
                    isSubmitted
                      ? styles.badgeSubmitted
                      : isSkipped
                        ? styles.badgeSkipped
                        : isDropout
                          ? styles.badgeDropout
                          : isInProgress
                            ? styles.badgeInProgress
                            : styles.badgePending
                  }`}
                >
                  {isSubmitted ? (
                    <Check size={15} strokeWidth={2.8} />
                  ) : isSkipped ? (
                    <FastForward size={13} strokeWidth={2.2} />
                  ) : isDropout ? (
                    <AlertTriangle size={14} strokeWidth={2.4} />
                  ) : isInProgress ? (
                    <span>{idx + 1}</span>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Step Title & Subtitle / Value Preview */}
                <div className={styles.stepText}>
                  <span className={styles.stepTitle}>{step.title}</span>
                  <span className={styles.stepSubtitle} title={step.details || step.valueSummary}>
                    {step.valueSummary}
                  </span>
                  <span
                    className={`${styles.statusTag} ${
                      isSubmitted
                        ? styles.tagSubmitted
                        : isSkipped
                          ? styles.tagSkipped
                          : isDropout
                            ? styles.tagDropout
                            : isInProgress
                              ? styles.tagInProgress
                              : styles.tagPending
                    }`}
                  >
                    {isSubmitted
                      ? "Submitted"
                      : isSkipped
                        ? "Skipped"
                        : isDropout
                          ? "Dropout"
                          : isInProgress
                            ? "Active"
                            : "Pending"}
                  </span>
                </div>

                {/* Tooltip Card on Hover / Tap */}
                <div className={styles.tooltipCard} role="tooltip">
                  <strong>{step.title}</strong>: {step.details || step.valueSummary}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

