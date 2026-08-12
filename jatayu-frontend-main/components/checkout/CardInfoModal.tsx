import { useState, useEffect } from "react";
import { X, CreditCard, User, Calendar, Lock } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import {
  formatCardNumber,
  formatCardExpiry,
  detectCardNetwork,
  isValidCardExpiry,
} from "./checkoutUtils";
import { VisaBadge, MastercardBadge, RupayBadge } from "./PaymentIcons";
import styles from "./CardInfoModal.module.css";

export type CardData = {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
  saveCard: boolean;
};

export type CardInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cardData: CardData;
  onSaveCard: (data: CardData) => void;
};

export default function CardInfoModal({
  isOpen,
  onClose,
  cardData,
  onSaveCard,
}: CardInfoModalProps) {
  const [cardNumber, setCardNumber] = useState(cardData.cardNumber || "");
  const [cardName, setCardName] = useState(cardData.cardName || "");
  const [expiry, setExpiry] = useState(cardData.expiry || "");
  const [cvv, setCvv] = useState(cardData.cvv || "");
  const [saveCard, setSaveCard] = useState(cardData.saveCard ?? true);

  useEffect(() => {
    if (isOpen) {
      setCardNumber(cardData.cardNumber || "");
      setCardName(cardData.cardName || "");
      setExpiry(cardData.expiry || "");
      setCvv(cardData.cvv || "");
      setSaveCard(cardData.saveCard ?? true);
    }
  }, [isOpen, cardData]);

  if (!isOpen) return null;

  const rawDigits = cardNumber.replace(/\D/g, "");
  const network = detectCardNetwork(cardNumber);
  const isFormValid =
    rawDigits.length >= 12 &&
    isValidCardExpiry(expiry) &&
    cvv.replace(/\D/g, "").length >= 3;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiry(formatCardExpiry(e.target.value));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvv(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    onSaveCard({
      cardNumber,
      cardName,
      expiry,
      cvv,
      saveCard,
    });
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <span className={styles.modalHeaderTitle}>Add Card Details</span>
          <span className={styles.modalHeaderDots} aria-hidden="true" />
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.supportedBadgesRow}>
            <span className={styles.supportedText}>We support all major cards</span>
            <div className={styles.badgesGroup}>
              <VisaBadge />
              <MastercardBadge />
              <RupayBadge />
            </div>
          </div>

          {/* Card Number */}
          <div className={styles.formGroup}>
            <label className={styles.inputLabel}>Card Number</label>
            <div className={styles.inputWrapper}>
              <CreditCard size={18} className={styles.inputIcon} />
              <input
                type="text"
                className={`${styles.cardInput} ${styles.cardInputWithBadge}`}
                placeholder="4532 1234 5678 9010"
                value={cardNumber}
                onChange={handleCardNumberChange}
                maxLength={23}
                autoFocus
              />
              <div className={styles.detectedBadge}>
                {network === "visa" && <VisaBadge />}
                {network === "mastercard" && <MastercardBadge />}
                {network === "rupay" && <RupayBadge />}
              </div>
            </div>
          </div>

          {/* Cardholder Name */}
          <div className={styles.formGroup}>
            <label className={styles.inputLabel}>Name on Card</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <input
                type="text"
                className={styles.cardInput}
                placeholder="e.g. Priya Sharma"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
            </div>
          </div>

          {/* Expiry & CVV */}
          <div className={styles.twoColumnRow}>
            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Expiry Date</label>
              <div className={styles.inputWrapper}>
                <Calendar size={18} className={styles.inputIcon} />
                <input
                  type="text"
                  className={styles.cardInput}
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={handleExpiryChange}
                  maxLength={5}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>CVV / CVC</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type="password"
                  className={styles.cardInput}
                  placeholder="123"
                  value={cvv}
                  onChange={handleCvvChange}
                  maxLength={4}
                />
              </div>
            </div>
          </div>

          {/* Save Card Checkbox */}
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
            />
            <span className={styles.checkboxLabel}>Save card securely for future payments</span>
          </label>

          {/* Modal Footer */}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <ContinueButton
              type="submit"
              label="Save Card Details"
              showArrow={false}
              disabled={!isFormValid}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
