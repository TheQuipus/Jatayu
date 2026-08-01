import { Coins } from "lucide-react";
import { MOCK_WALLET_BALANCE } from "@/lib/booking";
import { PAYMENT_METHODS, type PaymentMethodId } from "./checkoutTypes";
import { formatCurrency } from "./checkoutUtils";
import StepHeader from "./StepHeader";
import styles from "./StepPayment.module.css";

export type StepPaymentProps = {
  useCredits: boolean;
  onUseCreditsChange: (value: boolean) => void;
  paymentMethod: PaymentMethodId | null;
  onSelectPaymentMethod: (method: PaymentMethodId) => void;
};

export default function StepPayment({
  useCredits,
  onUseCreditsChange,
  paymentMethod,
  onSelectPaymentMethod,
}: StepPaymentProps) {
  return (
    <div className={styles.stepContent}>
      <StepHeader
        title="Payment Details"
        subtitle={
          <>
            Choose how you&apos;d like to pay.
            <br />
            You&apos;ll create an account before final confirmation.
          </>
        }
      />

      <div className={styles.creditsBanner}>
        <span className={styles.creditsIconWrap} aria-hidden="true">
          <Coins size={18} />
        </span>
        <div className={styles.creditsCopy}>
          <p className={styles.creditsTitle}>
            You have {formatCurrency(MOCK_WALLET_BALANCE)} in Jatayu Credits
          </p>
          <p className={styles.creditsHint}>
            Apply credits to reduce your payment amount
          </p>
        </div>
        <label className={styles.creditsToggle}>
          <input
            type="checkbox"
            className={styles.creditsToggleInput}
            checked={useCredits}
            onChange={(event) => onUseCreditsChange(event.target.checked)}
          />
          <span className={styles.creditsToggleTrack} aria-hidden="true">
            <span className={styles.creditsToggleThumb} />
          </span>
        </label>
      </div>

      <p className={styles.paymentPanelLabel}>Payment Method</p>

      <div className={styles.paymentOptions}>
        {PAYMENT_METHODS.map((method) => {
          const Icon = method.icon;
          const isActive = paymentMethod === method.id;
          const iconClass =
            styles[method.iconClass as keyof typeof styles] ?? styles.paymentIconUpi;

          return (
            <div
              key={method.id}
              className={`${styles.paymentOptionWrap} ${
                isActive ? styles.paymentOptionWrapActive : ""
              }`}
            >
              <div className={styles.paymentOptionSurface}>
                <button
                  type="button"
                  className={styles.paymentOption}
                  onClick={() => onSelectPaymentMethod(method.id)}
                >
                  <span className={`${styles.paymentIconWrap} ${iconClass}`}>
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className={styles.paymentOptionCopy}>
                    <span className={styles.paymentOptionTitle}>{method.title}</span>
                    <span className={styles.paymentOptionHint}>{method.hint}</span>
                  </span>
                  <span className={styles.paymentRadio} aria-hidden="true">
                    <span className={styles.paymentRadioDot} />
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
