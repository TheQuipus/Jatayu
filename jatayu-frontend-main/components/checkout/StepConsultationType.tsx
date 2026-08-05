import {
  checkoutConsultationTypes,
  getConsultationPrice,
  type ConsultationType,
} from "@/lib/booking";
import type { Expert } from "@/lib/experts";
import { formatCurrency } from "./checkoutUtils";
import StepHeader from "./StepHeader";
import styles from "./StepConsultationType.module.css";

export type StepConsultationTypeProps = {
  expert: Expert;
  consultationType: ConsultationType | null;
  onSelectConsultationType: (type: ConsultationType | null) => void;
};

export default function StepConsultationType({
  expert,
  consultationType,
  onSelectConsultationType,
}: StepConsultationTypeProps) {
  return (
    <div className={styles.stepContent}>
      <StepHeader
        title="Choose Consultation Type"
        subtitle="Select how you'd like to connect with the expert."
      />

      <div className={styles.consultationGrid}>
        {checkoutConsultationTypes.map((option) => {
          const price = getConsultationPrice(expert.price, option.id);
          const isActive = consultationType === option.id;

          return (
            <button
              key={option.id}
              type="button"
              className={`${styles.consultationCard} ${
                isActive ? styles.consultationCardActive : ""
              }`}
              onClick={() =>
                onSelectConsultationType(isActive ? null : option.id)
              }
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
                <p className={styles.consultationQuote}>{formatCurrency(price)}</p>
                <div className={styles.consultationRule} aria-hidden="true" />
                <p className={styles.consultationDesc}>{option.desc}</p>
                <p className={styles.consultationActiveTitle}>{option.title}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
