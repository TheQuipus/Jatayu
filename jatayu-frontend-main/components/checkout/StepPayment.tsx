import { useState } from "react";
import {
  Check,
  Plus,
  Info,
  CreditCard,
} from "lucide-react";
import { MOCK_WALLET_BALANCE } from "@/lib/booking";
import {
  PAYMENT_METHODS,
  ALL_BANKS,
  type PaymentMethodId,
  type PaymentDetailsState,
} from "./checkoutTypes";
import {
  formatCurrency,
  formatMaskedCardNumber,
} from "./checkoutUtils";
import {
  VisaBadge,
  MastercardBadge,
  RupayBadge,
  UpiLogoBadge,
} from "./PaymentIcons";
import CardInfoModal, { type CardData } from "./CardInfoModal";
import StepHeader from "./StepHeader";
import ContinueButton from "@/components/ui/ContinueButton";
import styles from "./StepPayment.module.css";

export type StepPaymentProps = {
  useCredits: boolean;
  onUseCreditsChange: (value: boolean) => void;
  paymentMethod: PaymentMethodId | null;
  onSelectPaymentMethod: (method: PaymentMethodId | null) => void;
  paymentDetails: PaymentDetailsState;
  onUpdatePaymentDetails: (updater: (prev: PaymentDetailsState) => PaymentDetailsState) => void;
  onContinue?: () => void;
};

export default function StepPayment({
  useCredits,
  onUseCreditsChange,
  paymentMethod,
  onSelectPaymentMethod,
  paymentDetails,
  onUpdatePaymentDetails,
  onContinue,
}: StepPaymentProps) {
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  const handleTogglePaymentMethod = (methodId: PaymentMethodId) => {
    if (paymentMethod === methodId) {
      onSelectPaymentMethod(null);
    } else {
      onSelectPaymentMethod(methodId);
    }
  };

  const selectBank = (bankId: string) => {
    onUpdatePaymentDetails((prev) => ({
      ...prev,
      netbanking: { ...prev.netbanking, bankId },
    }));
  };

  const handleSaveCard = (cardData: CardData) => {
    onUpdatePaymentDetails((prev) => ({
      ...prev,
      card: {
        cardNumber: cardData.cardNumber,
        cardName: cardData.cardName,
        expiry: cardData.expiry,
        cvv: cardData.cvv,
        saveCard: cardData.saveCard,
      },
    }));
    onSelectPaymentMethod("card");
  };

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      setPromoApplied(true);
    }
  };

  return (
    <div className={styles.stepContent}>
      <StepHeader
        title="Payment method"
        subtitle="Choose how you'd like to pay for your consultation."
      />

      {/* Main Payment Selection Box */}
      <div className={styles.paymentContainerCard}>
        {/* Section 1: Your available balance */}
        <div className={styles.balanceSection}>
          <h3 className={styles.sectionHeading}>Your available balance</h3>

          <label className={styles.balanceRadioRow}>
            <input
              type="checkbox"
              className={styles.radioInput}
              checked={useCredits}
              onChange={(e) => onUseCreditsChange(e.target.checked)}
            />
            <span className={styles.radioOuter} aria-hidden="true">
              <span className={styles.radioInner} />
            </span>
            <span className={styles.balanceText}>
              Use your <span className={styles.balanceAmount}>{formatCurrency(MOCK_WALLET_BALANCE)}</span> Jatayu Balance
            </span>
          </label>

          <div className={styles.balanceInfoBanner}>
            {useCredits ? (
              <Check size={16} className={styles.blueInfoIcon} aria-hidden="true" />
            ) : (
              <Info size={16} className={styles.blueInfoIcon} aria-hidden="true" />
            )}
            <span>
              {useCredits ? (
                <>
                  {formatCurrency(MOCK_WALLET_BALANCE)} Jatayu Balance applied towards your booking.{" "}
                  <button type="button" className={styles.addMoneyLink} onClick={() => onUseCreditsChange(true)}>
                    Add money &amp; get rewarded
                  </button>
                </>
              ) : (
                <>
                  Apply your {formatCurrency(MOCK_WALLET_BALANCE)} balance or{" "}
                  <button type="button" className={styles.addMoneyLink} onClick={() => onUseCreditsChange(true)}>
                    Add money &amp; get rewarded
                  </button>
                </>
              )}
            </span>
          </div>

          <div className={styles.codeEntryRow}>
            <Plus size={16} className={styles.plusIcon} aria-hidden="true" />
            <div className={styles.codeInputWrap}>
              <input
                type="text"
                className={styles.codeInput}
                placeholder="Enter Code"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value);
                  setPromoApplied(false);
                }}
              />
              <ContinueButton
                label="Apply"
                showArrow={false}
                onClick={handleApplyPromo}
                disabled={!promoCode.trim()}
                className={styles.applyBtn}
              />
            </div>
            {promoApplied ? (
              <span className={styles.codeSuccess}>
                <Check size={14} /> Code Applied!
              </span>
            ) : null}
          </div>
        </div>

        <hr className={styles.sectionDivider} />

        {/* Section 2: Another payment method */}
        <div>
          <h3 className={styles.sectionHeading} style={{ marginBottom: "12px" }}>
            Another payment method
          </h3>

          <div className={styles.paymentOptionsList}>
            {PAYMENT_METHODS.map((method) => {
              const isActive = paymentMethod === method.id;

              return (
                <label
                  key={method.id}
                  className={styles.paymentRadioRow}
                  onClick={(e) => {
                    e.preventDefault();
                    handleTogglePaymentMethod(method.id);
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={isActive}
                    readOnly
                    className={styles.radioInput}
                  />
                  <span className={styles.radioOuter} aria-hidden="true">
                    <span className={styles.radioInner} />
                  </span>

                  <div className={styles.paymentOptionBody}>
                    <div className={styles.paymentTitleRow}>
                      <span className={styles.paymentOptionTitle}>{method.title}</span>
                      {method.id === "upi" ? <UpiLogoBadge /> : null}
                    </div>

                    {/* Smooth Expanded Card section on selecting Credit or debit card */}
                    {method.id === "card" ? (
                      <div
                        className={`${styles.cardExpandContainer} ${isActive ? styles.cardExpandContainerOpen : ""
                          }`}
                      >
                        <div className={styles.cardExpandInner}>
                          {paymentDetails.card.cardNumber ? (
                            <div className={styles.savedCardBox} onClick={(e) => e.stopPropagation()}>
                              <div className={styles.savedCardInfo}>
                                <CreditCard size={20} className={styles.savedCardIcon} />
                                <div>
                                  <p className={styles.savedCardNumber}>
                                    {formatMaskedCardNumber(paymentDetails.card.cardNumber)}
                                  </p>
                                  {paymentDetails.card.cardName ? (
                                    <p className={styles.savedCardSub}>
                                      {paymentDetails.card.cardName} &bull; Exp {paymentDetails.card.expiry}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                              <button
                                type="button"
                                className={styles.editCardBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCardModal(true);
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          ) : (
                            <div
                              className={styles.cardBadgesRowClickable}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPaymentMethod("card");
                                setShowCardModal(true);
                              }}
                              role="button"
                              tabIndex={0}
                              title="Click to add credit card details"
                            >
                              <span className={styles.plusIconBadge}>
                                <Plus size={16} />
                              </span>
                              <div className={styles.badgesGroup}>
                                <VisaBadge />
                                <MastercardBadge />
                                <RupayBadge />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {/* Smooth Expanded Net Banking Dropdown option */}
                    {method.id === "netbanking" ? (
                      <div
                        className={`${styles.expandContainer} ${
                          isActive ? styles.expandContainerOpen : ""
                        }`}
                      >
                        <div className={styles.expandInner}>
                          <div className={styles.selectDropdownWrap}>
                            <select
                              className={styles.bankSelect}
                              value={paymentDetails.netbanking.bankId}
                              onChange={(e) => {
                                onSelectPaymentMethod("netbanking");
                                selectBank(e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="">Choose an Option</option>
                              {ALL_BANKS.map((bank) => (
                                <option key={bank.id} value={bank.id}>
                                  {bank.name} ({bank.code})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Smooth Expanded UPI Highlight Notice */}
                    {method.id === "upi" ? (
                      <div
                        className={`${styles.expandContainer} ${
                          isActive ? styles.expandContainerOpen : ""
                        }`}
                      >
                        <div className={styles.expandInner}>
                          <div className={styles.upiHighlightNotice}>
                            <Info size={15} className={styles.upiNoticeIcon} aria-hidden="true" />
                            <span>
                              You will need to Scan the QR code on the payment page to complete the payment.
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <CardInfoModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        cardData={paymentDetails.card}
        onSaveCard={handleSaveCard}
      />
    </div>
  );
}
