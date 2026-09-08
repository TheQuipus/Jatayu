import { useState } from "react";
import {
  checkoutConsultationTypes,
  getConsultationPrice,
  type ConsultationType,
} from "@/lib/booking";
import type { Expert } from "@/lib/experts";
import { formatCurrency } from "./checkoutUtils";
import StepHeader from "./StepHeader";
import styles from "./StepConsultationType.module.css";

export const DURATION_OPTIONS = [
  { id: "15min", label: "15min" },
  { id: "30min", label: "30min" },
  { id: "45min", label: "45min" },
  { id: "1hr", label: "1 hr" },
] as const;

export type StepConsultationTypeProps = {
  expert: Expert;
  consultationType: ConsultationType | null;
  onSelectConsultationType: (type: ConsultationType | null) => void;
  selectedDuration?: string;
  onSelectDuration?: (duration: string) => void;
  customDurationMinutes?: string;
  onCustomDurationMinutesChange?: (mins: string) => void;
};

export default function StepConsultationType({
  expert,
  consultationType,
  onSelectConsultationType,
  selectedDuration,
  onSelectDuration,
  customDurationMinutes,
  onCustomDurationMinutesChange,
}: StepConsultationTypeProps) {
  const [internalDuration, setInternalDuration] = useState<string>("15min");
  const [internalCustomMinutes, setInternalCustomMinutes] = useState<string>("");

  const currentDuration = selectedDuration ?? internalDuration;
  const currentCustomMinutes = customDurationMinutes ?? internalCustomMinutes;

  const handleSelectDuration = (durId: string) => {
    setInternalDuration(durId);
    onSelectDuration?.(durId);
  };

  const handleCustomMinutesChange = (val: string) => {
    setInternalCustomMinutes(val);
    onCustomDurationMinutesChange?.(val);
  };

  const availableFormats =
    expert.formats && expert.formats.length > 0
      ? expert.formats
      : expert.formatPrices
      ? Object.keys(expert.formatPrices)
      : ["text", "video", "shoutout", "group"];

  const filteredTypes = checkoutConsultationTypes.filter((opt) =>
    availableFormats.includes(opt.id)
  );

  const displayTypes = filteredTypes.length > 0 ? filteredTypes : checkoutConsultationTypes;

  return (
    <div className={styles.stepContent}>
      <StepHeader
        title="Choose Consultation Type"
        subtitle="Select how you'd like to connect with the expert."
      />

      <div className={styles.consultationGrid}>
        {displayTypes.map((option) => {
          let price = expert.price;
          if (expert.formatPrices && expert.formatPrices[option.id]) {
            const p = Number(expert.formatPrices[option.id]);
            if (!isNaN(p) && p > 0) price = p;
          } else {
            price = getConsultationPrice(expert.price, option.id);
          }
          const isActive = consultationType === option.id;

          return (
            <div
              key={option.id}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              className={`${styles.consultationCard} ${
                isActive ? styles.consultationCardActive : ""
              }`}
              onClick={() =>
                onSelectConsultationType(isActive ? null : option.id)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectConsultationType(isActive ? null : option.id);
                }
              }}
            >
              <div className={styles.consultationCardBody}>
                <span className={styles.consultationLabel}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/box.svg"
                    alt=""
                    className="mark"
                    aria-hidden="true"
                  />
                  {option.title.toUpperCase()}
                </span>
                <p className={styles.consultationQuote}>{formatCurrency(price)}/min</p>
                <div className={styles.consultationRule} aria-hidden="true" />
                <p className={styles.consultationDesc}>{option.desc}</p>
                <p className={styles.consultationActiveTitle}>{option.title}</p>

                {isActive && (
                  <div
                    className={styles.durationSection}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <div className={styles.durationGrid}>
                      {DURATION_OPTIONS.map((item) => {
                        const isChecked = currentDuration === item.id;
                        return (
                          <label
                            key={item.id}
                            className={styles.durationRadioItem}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectDuration(item.id);
                            }}
                          >
                            <input
                              type="radio"
                              name={`duration-${option.id}`}
                              value={item.id}
                              checked={isChecked}
                              onChange={() => handleSelectDuration(item.id)}
                              className={styles.durationRadioInput}
                            />
                            <span className={styles.durationRadioCircle} aria-hidden="true" />
                            <span className={styles.durationRadioText}>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div
                      className={`${styles.customDurationBox} ${
                        currentDuration === "custom" ? styles.customDurationBoxActive : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDuration("custom");
                      }}
                    >
                      <input
                        type="number"
                        min="1"
                        max="360"
                        value={currentDuration === "custom" ? currentCustomMinutes : ""}
                        onChange={(e) => {
                          handleSelectDuration("custom");
                          handleCustomMinutesChange(e.target.value);
                        }}
                        onFocus={() => handleSelectDuration("custom")}
                        placeholder="Custom"
                        className={styles.customDurationInput}
                      />
                      <span className={styles.customDurationSuffix}>mins</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
