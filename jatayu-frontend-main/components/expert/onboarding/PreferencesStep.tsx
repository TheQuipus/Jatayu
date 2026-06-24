"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Video,
  Phone,
  FileText,
  Users,
  Check,
} from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import shared from "./onboarding.shared.module.css";
import styles from "./PreferencesStep.module.css";
import {
  CONSULTATION_FORMATS,
  SESSION_LENGTHS,
} from "./preferencesData";

type PreferencesStepProps = {
  userName: string;
  selectedFormats: string[];
  onSelectedFormatsChange: (formats: string[]) => void;
  selectedLengths: string[];
  onSelectedLengthsChange: (lengths: string[]) => void;
  formatPrices: Record<string, string>;
  onFormatPricesChange: (prices: Record<string, string>) => void;
  stepCompletion: boolean[];
  onStepCompleteChange?: (step: number, complete: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
  onJumpToStep?: (step: number) => void;
};

const FORMAT_ICONS = {
  video: Video,
  audio: Phone,
  written: FileText,
  group: Users,
} as const;

export default function PreferencesStep({
  userName,
  selectedFormats,
  onSelectedFormatsChange,
  selectedLengths,
  onSelectedLengthsChange,
  formatPrices,
  onFormatPricesChange,
  stepCompletion,
  onStepCompleteChange,
  onBack,
  onContinue,
  onJumpToStep,
}: PreferencesStepProps) {
  const formatPriceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [acceptCustomRequests, setAcceptCustomRequests] = useState<boolean>(false);

  const isTextOnly =
    selectedFormats.length === 1 && selectedFormats[0] === "written";

  const canContinue =
    selectedFormats.length > 0 && (isTextOnly || selectedLengths.length > 0);

  useEffect(() => {
    if (isTextOnly) {
      onSelectedLengthsChange([]);
    }
  }, [isTextOnly, onSelectedLengthsChange]);

  useEffect(() => {
    onStepCompleteChange?.(6, canContinue);
  }, [canContinue, onStepCompleteChange]);

  const formats = CONSULTATION_FORMATS.map((format) => ({
    ...format,
    icon: FORMAT_ICONS[format.id],
  }));

  const lengths = SESSION_LENGTHS;

  const focusFormatPriceInput = (id: string) => {
    requestAnimationFrame(() => {
      const input = formatPriceInputRefs.current[id];
      if (!input) return;
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    });
  };

  const handleToggleFormat = (id: string) => {
    if (selectedFormats.includes(id)) {
      onSelectedFormatsChange(selectedFormats.filter((x) => x !== id));
      const next = { ...formatPrices };
      delete next[id];
      onFormatPricesChange(next);
    } else {
      onSelectedFormatsChange([...selectedFormats, id]);
      focusFormatPriceInput(id);
    }
  };

  const handleFormatPriceChange = (id: string, raw: string) => {
    onFormatPricesChange({
      ...formatPrices,
      [id]: raw.replace(/\D/g, ""),
    });
  };

  const handleToggleLength = (id: string) => {
    if (selectedLengths.includes(id)) {
      onSelectedLengthsChange(selectedLengths.filter((x) => x !== id));
    } else {
      onSelectedLengthsChange([...selectedLengths, id]);
    }
  };

  return (
    <section className={shared.card}>
      <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }} aria-hidden="true">
        <defs>
          <clipPath id="custom-clip" clipPathUnits="objectBoundingBox">
            <path d="M0,0.086 L0.018,0 H0.676 L0.696,0.086 H0.978 L1,0.311 V0.743 L0.984,0.839 L0.955,0.845 L0.9,1 H0 V0.086 Z" fillOpacity="0.05" strokeOpacity="0.1"/>
          </clipPath>
        </defs>
      </svg>
      <div className={shared.cardHeader}>
      <div className={shared.topHeader}>
        <OnboardingStepTitle userName={userName} />
        <div className={shared.stepPill}>
          <span>Step 6 of 9 - Consultation Preferences</span>
        </div>
      </div>

      {/* Progress Tracker */}
      <OnboardingProgressBar currentStep={6} stepCompletion={stepCompletion} onStepClick={onJumpToStep} />

      </div>

      <div className={shared.cardBody}>
{/* Heading */}
      <h1 className={`${shared.questionTitle} ${styles.questionTitle}`}>
        Define your <span className={shared.accentWord}>consultation style</span>
      </h1>

      <p className={`${shared.questionSubtitle} ${styles.questionSubtitle}`} style={{ marginBottom: "36px" }}>
        Choose how you want to interact with clients to ensure the best matches.
      </p>

      {/* Available Formats Section */}
      <div className={styles.preferencesSection}>
        <div className={styles.sectionHeaderRow}>
          <h2 className={styles.preferencesSectionLabel}>Preferred Consultation Formats</h2>
        </div>

        {/* 2x2 Formats Grid */}
        <div className={styles.formatsGrid}>
          {formats.map((fmt) => {
            const IconComponent = fmt.icon;
            const isSelected = selectedFormats.includes(fmt.id);

            return (
              <div
                key={fmt.id}
                className={`${styles.formatCard} ${isSelected ? styles.formatCardSelected : ""}`}
              >
                {/* SVG border overlay */}
                <svg className={styles.cardBorderSvg} viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
                  <path
                    d="M0,0.086 L0.018,0 H0.676 L0.696,0.086 H0.978 L1,0.311 V0.743 L0.984,0.839 L0.955,0.845 L0.9,1 H0 V0.086 Z"
                    fill="none"
                    stroke={isSelected ? "#E53B17" : "#FFFFFF"}
                    strokeOpacity={isSelected ? 1 : 0.08}
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                <div
                  className={`${styles.formatCheckbox} ${isSelected ? styles.formatCheckboxSelected : ""}`}
                  aria-hidden="true"
                >
                  {isSelected && <Check size={10} strokeWidth={3} />}
                </div>

                <div className={styles.formatCardBody}>
                  <button
                    type="button"
                    onClick={() => handleToggleFormat(fmt.id)}
                    className={styles.formatCardSelect}
                    aria-pressed={isSelected}
                  >
                    <div className={styles.formatCardInner}>
                      <div className={styles.formatIconCircle}>
                        <IconComponent className={styles.formatIcon} />
                      </div>
                      <div className={styles.formatInfo}>
                        <h3 className={styles.formatTitle}>{fmt.title}</h3>
                        <p className={styles.formatDesc}>{fmt.desc}</p>
                      </div>
                    </div>
                  </button>

                  <div
                    className={`${styles.formatPriceRow} ${!isSelected ? styles.formatPriceRowHidden : ""}`}
                    onPointerDown={(event) => event.stopPropagation()}
                    aria-hidden={!isSelected}
                  >
                    <span className={styles.formatPriceCurrency}>₹</span>
                    {isSelected ? (
                      <input
                        ref={(element) => {
                          formatPriceInputRefs.current[fmt.id] = element;
                        }}
                        type="text"
                        inputMode="numeric"
                        className={styles.formatPriceInput}
                        value={formatPrices[fmt.id] ?? ""}
                        onChange={(event) => handleFormatPriceChange(fmt.id, event.target.value)}
                        placeholder="0"
                        aria-label={`${fmt.title} rate in rupees`}
                      />
                    ) : (
                      <span className={styles.formatPriceInputPlaceholder}>0</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Lengths Section */}
      <div
        className={`${styles.preferencesSection} ${isTextOnly ? styles.lengthsSectionDisabled : ""}`}
        style={{ marginBottom: "28px" }}
      >
        <h2 className={styles.preferencesSectionLabel} style={{ marginBottom: "16px" }}>
          Preferred Session Lengths
        </h2>
        {isTextOnly && (
          <p className={styles.lengthsDisabledHint}>
            Session length is not required for text messaging.
          </p>
        )}
        <div className={styles.lengthsRow}>
          {lengths.map((len) => {
            const isSelected = selectedLengths.includes(len.id);

            return (
              <button
                key={len.id}
                type="button"
                onClick={() => handleToggleLength(len.id)}
                className={`${styles.lengthPill} ${isSelected ? styles.lengthPillSelected : ""}`}
                disabled={isTextOnly}
                aria-disabled={isTextOnly}
              >
                {len.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accept Custom Requests Toggle Card */}
      {/* <div className={styles.toggleCard}>
        <div className={styles.toggleTextWrap}>
          <h3 className={styles.toggleTitle}>Accept Custom Requests</h3>
          <p className={styles.toggleDesc}>Allow users to message you with unique consultation formats.</p>
        </div>
        <button
          type="button"
          onClick={() => setAcceptCustomRequests(!acceptCustomRequests)}
          className={`${styles.switchTrack} ${acceptCustomRequests ? styles.switchTrackActive : ""}`}
          aria-pressed={acceptCustomRequests}
          aria-label="Accept Custom Requests Toggle"
        >
          <span className={`${styles.switchThumb} ${acceptCustomRequests ? styles.switchThumbActive : ""}`} />
        </button>
      </div> */}

      {/* Step 6 Footer */}
      </div>

      <div className={shared.onboardingFooter}>
        <div className={shared.footerLeft}>
          <div className={shared.avatarMiniWrap}>
            <Image
              src="/assets/img/avatar1.png"
              alt="Expert advisor"
              width={36}
              height={36}
              className={shared.avatarMini}
            />
          </div>
          <div className={shared.footerTip}>
            <strong>Preferences Set +10%</strong>
            <small>Clear preferences help users understand what to expect.</small>
          </div>
        </div>

        <div className={shared.footerActions}>
          <button type="button" className={shared.textBtn} onClick={onBack}>
            Back
          </button>
          <button type="button" className={shared.textBtn} onClick={onContinue}>
            Skip
          </button>
          <button
            type="button"
            className={shared.continueBtn}
            onClick={onContinue}
            disabled={!canContinue}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
