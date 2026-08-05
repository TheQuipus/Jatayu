import { useState } from "react";
import {
  Coins,
  CheckCircle2,
  QrCode,
  Lock,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Check,
} from "lucide-react";
import { MOCK_WALLET_BALANCE } from "@/lib/booking";
import {
  PAYMENT_METHODS,
  POPULAR_UPI_APPS,
  COMMON_UPI_HANDLES,
  POPULAR_BANKS,
  ALL_BANKS,
  type PaymentMethodId,
  type PaymentDetailsState,
  type UpiMode,
} from "./checkoutTypes";
import {
  formatCurrency,
  isValidUpiId,
  formatCardNumber,
  detectCardNetwork,
  formatCardExpiry,
} from "./checkoutUtils";
import {
  GPayIcon,
  PhonePeIcon,
  PaytmIcon,
  BhimIcon,
  CredIcon,
  HdfcBankIcon,
  IciciBankIcon,
  SbiBankIcon,
  AxisBankIcon,
  KotakBankIcon,
  PnbBankIcon,
  GenericBankIcon,
} from "./PaymentIcons";
import StepHeader from "./StepHeader";
import styles from "./StepPayment.module.css";

const UPI_APP_ICONS: Record<string, React.FC<{ size?: number }>> = {
  gpay: GPayIcon,
  phonepe: PhonePeIcon,
  paytm: PaytmIcon,
  bhim: BhimIcon,
  cred: CredIcon,
};

const BANK_ICONS: Record<string, React.FC<{ size?: number }>> = {
  hdfc: HdfcBankIcon,
  icici: IciciBankIcon,
  sbi: SbiBankIcon,
  axis: AxisBankIcon,
  kotak: KotakBankIcon,
  pnb: PnbBankIcon,
};

export type StepPaymentProps = {
  useCredits: boolean;
  onUseCreditsChange: (value: boolean) => void;
  paymentMethod: PaymentMethodId | null;
  onSelectPaymentMethod: (method: PaymentMethodId) => void;
  paymentDetails: PaymentDetailsState;
  onUpdatePaymentDetails: (updater: (prev: PaymentDetailsState) => PaymentDetailsState) => void;
};

export default function StepPayment({
  useCredits,
  onUseCreditsChange,
  paymentMethod,
  onSelectPaymentMethod,
  paymentDetails,
  onUpdatePaymentDetails,
}: StepPaymentProps) {
  const [showCvv, setShowCvv] = useState(false);

  const setUpiMode = (mode: UpiMode) => {
    onUpdatePaymentDetails((prev) => ({
      ...prev,
      upi: { ...prev.upi, mode },
    }));
  };

  const handleUpiIdChange = (value: string) => {
    onUpdatePaymentDetails((prev) => ({
      ...prev,
      upi: {
        ...prev.upi,
        upiId: value,
        isVerified: isValidUpiId(value),
      },
    }));
  };

  const appendHandleToUpi = (handle: string) => {
    let current = paymentDetails.upi.upiId.trim();
    if (current.includes("@")) {
      current = current.split("@")[0] ?? "";
    }
    if (!current) {
      current = "seeker";
    }
    const nextVal = `${current}${handle}`;
    handleUpiIdChange(nextVal);
  };

  const selectUpiApp = (appId: string) => {
    onUpdatePaymentDetails((prev) => ({
      ...prev,
      upi: { ...prev.upi, selectedApp: appId },
    }));
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    onUpdatePaymentDetails((prev) => ({
      ...prev,
      card: { ...prev.card, cardNumber: formatted },
    }));
  };

  const handleCardExpiryChange = (value: string) => {
    const formatted = formatCardExpiry(value);
    onUpdatePaymentDetails((prev) => ({
      ...prev,
      card: { ...prev.card, expiry: formatted },
    }));
  };

  const handleCardCvvChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    onUpdatePaymentDetails((prev) => ({
      ...prev,
      card: { ...prev.card, cvv: digits },
    }));
  };

  const handleCardNameChange = (value: string) => {
    onUpdatePaymentDetails((prev) => ({
      ...prev,
      card: { ...prev.card, cardName: value },
    }));
  };

  const toggleSaveCard = () => {
    onUpdatePaymentDetails((prev) => ({
      ...prev,
      card: { ...prev.card, saveCard: !prev.card.saveCard },
    }));
  };

  const selectBank = (bankId: string) => {
    onUpdatePaymentDetails((prev) => ({
      ...prev,
      netbanking: { ...prev.netbanking, bankId },
    }));
  };

  const cardNetwork = detectCardNetwork(paymentDetails.card.cardNumber);

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

      {/* Jatayu Credits Banner */}
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

      {/* Payment Options Accordion */}
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
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className={styles.paymentOptionCopy}>
                    <span className={styles.paymentOptionTitle}>{method.title}</span>
                    <span className={styles.paymentOptionHint}>{method.hint}</span>
                  </span>
                  <span className={styles.paymentRadio} aria-hidden="true">
                    <span className={styles.paymentRadioDot} />
                  </span>
                </button>

              {/* Expanded Sub-Panel when active */}
              {isActive ? (
                <div className={styles.paymentDetailsSubpanel}>
                  {/* UPI Details Panel */}
                  {method.id === "upi" ? (
                    <div>
                      <div className={styles.upiModeTabs}>
                        <button
                          type="button"
                          className={`${styles.upiTabBtn} ${
                            paymentDetails.upi.mode === "id" ? styles.upiTabBtnActive : ""
                          }`}
                          onClick={() => setUpiMode("id")}
                        >
                          <Smartphone size={13} />
                          Enter VPA / UPI ID
                        </button>
                        <button
                          type="button"
                          className={`${styles.upiTabBtn} ${
                            paymentDetails.upi.mode === "app" ? styles.upiTabBtnActive : ""
                          }`}
                          onClick={() => setUpiMode("app")}
                        >
                          <Sparkles size={13} />
                          Instant App Pay
                        </button>
                        <button
                          type="button"
                          className={`${styles.upiTabBtn} ${
                            paymentDetails.upi.mode === "qr" ? styles.upiTabBtnActive : ""
                          }`}
                          onClick={() => setUpiMode("qr")}
                        >
                          <QrCode size={13} />
                          Scan QR Code
                        </button>
                      </div>

                      {paymentDetails.upi.mode === "id" ? (
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel}>
                            <span>Enter your UPI ID / Virtual Address</span>
                            {paymentDetails.upi.isVerified ? (
                              <span className={styles.verifiedBadge}>
                                <Check size={12} /> Verified VPA
                              </span>
                            ) : null}
                          </label>
                          <div className={styles.fieldInputWrap}>
                            <input
                              type="text"
                              className={`${styles.fieldInput} ${
                                paymentDetails.upi.isVerified ? styles.fieldInputSuccess : ""
                              }`}
                              placeholder="e.g. mobile@upi or name@okaxis"
                              value={paymentDetails.upi.upiId}
                              onChange={(e) => handleUpiIdChange(e.target.value)}
                            />
                          </div>

                          <div className={styles.handlePillsRow}>
                            {COMMON_UPI_HANDLES.map((handle) => (
                              <button
                                key={handle}
                                type="button"
                                className={styles.handlePill}
                                onClick={() => appendHandleToUpi(handle)}
                              >
                                {handle}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {paymentDetails.upi.mode === "app" ? (
                        <div>
                          <label className={styles.fieldLabel}>Select your preferred UPI App</label>
                          <div className={styles.upiAppGrid}>
                            {POPULAR_UPI_APPS.map((app) => {
                              const isAppActive = paymentDetails.upi.selectedApp === app.id;
                              const AppIcon = UPI_APP_ICONS[app.id] ?? GPayIcon;
                              return (
                                <button
                                  key={app.id}
                                  type="button"
                                  className={`${styles.upiAppCard} ${
                                    isAppActive ? styles.upiAppCardActive : ""
                                  }`}
                                  onClick={() => selectUpiApp(app.id)}
                                >
                                  {app.badge ? (
                                    <span className={styles.upiAppBadge}>{app.badge}</span>
                                  ) : null}
                                  <span className={styles.upiAppIconWrap}>
                                    <AppIcon size={32} />
                                  </span>
                                  <span className={styles.upiAppName}>{app.name}</span>
                                </button>
                              );
                            })}
                          </div>
                          <p className={styles.upiAppNotice}>
                            <CheckCircle2 size={14} className={styles.upiNoticeIcon} />
                            <span>
                              A collect request will be sent to your app upon confirmation.
                            </span>
                          </p>
                        </div>
                      ) : null}

                      {paymentDetails.upi.mode === "qr" ? (
                        <div className={styles.qrCodeWrap}>
                          <div className={styles.qrFrame}>
                            <svg
                              className={styles.qrSvg}
                              viewBox="0 0 100 100"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <rect width="100" height="100" fill="#FFFFFF" />
                              <path
                                d="M10 10H40V40H10V10ZM20 20V30H30V20H20ZM60 10H90V40H60V10ZM70 20V30H80V20H70ZM10 60H40V90H10V60ZM20 70V80H30V70H20Z"
                                fill="#F26522"
                              />
                              <path
                                d="M45 10H55V20H45V10ZM45 30H55V40H45V30ZM10 45H20V55H10V45ZM30 45H40V55H30V45ZM50 45H60V55H50V45ZM70 45H90V55H70V45ZM45 60H55V70H45V60ZM60 60H70V70H60V60ZM80 60H90V70H80V60ZM45 80H55V90H45V80ZM60 80H70V90H60V80ZM80 80H90V90H80V80Z"
                                fill="#0E1217"
                              />
                            </svg>
                          </div>
                          <p className={styles.qrCopy}>Scan with any UPI App (GPay, PhonePe, Paytm)</p>
                          <span className={styles.qrTimer}>QR Code auto-refreshes in 09:42 min</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Card Details Panel */}
                  {method.id === "card" ? (
                    <div className={styles.cardFormGrid}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                          <span>Card Number</span>
                          {cardNetwork !== "generic" ? (
                            <span
                              className={`${styles.cardNetworkBadge} ${
                                styles[`cardNetwork${cardNetwork.charAt(0).toUpperCase() + cardNetwork.slice(1)}`]
                              }`}
                            >
                              {cardNetwork}
                            </span>
                          ) : null}
                        </label>
                        <div className={styles.fieldInputWrap}>
                          <input
                            type="text"
                            className={styles.fieldInput}
                            placeholder="4532 •••• •••• 8921"
                            value={paymentDetails.card.cardNumber}
                            onChange={(e) => handleCardNumberChange(e.target.value)}
                            maxLength={19}
                          />
                        </div>
                      </div>

                      <div className={styles.cardRow}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel}>Expiry Date</label>
                          <input
                            type="text"
                            className={styles.fieldInput}
                            placeholder="MM / YY"
                            value={paymentDetails.card.expiry}
                            onChange={(e) => handleCardExpiryChange(e.target.value)}
                            maxLength={5}
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel}>CVV / CVC</label>
                          <div className={styles.fieldInputWrap}>
                            <input
                              type={showCvv ? "text" : "password"}
                              className={styles.fieldInput}
                              placeholder="•••"
                              value={paymentDetails.card.cvv}
                              onChange={(e) => handleCardCvvChange(e.target.value)}
                              maxLength={4}
                            />
                            <button
                              type="button"
                              className={styles.fieldInputIconRight}
                              onClick={() => setShowCvv((prev) => !prev)}
                              style={{ pointerEvents: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--dove-gray)", fontSize: "11px" }}
                            >
                              {showCvv ? "Hide" : "Show"}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Cardholder Name</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          placeholder="Name as printed on card"
                          value={paymentDetails.card.cardName}
                          onChange={(e) => handleCardNameChange(e.target.value)}
                        />
                      </div>

                      <label className={styles.checkboxRow}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={paymentDetails.card.saveCard}
                          onChange={toggleSaveCard}
                        />
                        <span className={styles.checkboxLabel}>
                          Save card securely for faster checkout (Encrypted as per RBI guidelines)
                        </span>
                      </label>
                    </div>
                  ) : null}

                  {/* Net Banking Details Panel */}
                  {method.id === "netbanking" ? (
                    <div>
                      <label className={styles.fieldLabel}>Popular Indian Banks</label>
                      <div className={styles.popularBanksGrid}>
                        {POPULAR_BANKS.map((bank) => {
                          const isBankActive = paymentDetails.netbanking.bankId === bank.id;
                          const BankIcon = BANK_ICONS[bank.id] ?? GenericBankIcon;
                          return (
                            <button
                              key={bank.id}
                              type="button"
                              className={`${styles.bankTile} ${
                                isBankActive ? styles.bankTileActive : ""
                              }`}
                              onClick={() => selectBank(bank.id)}
                            >
                              <span className={styles.bankIconWrap}>
                                <BankIcon size={26} />
                              </span>
                              <div className={styles.bankTileCopy}>
                                <span className={styles.bankName}>{bank.name}</span>
                                <span className={styles.bankCode}>{bank.code}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className={styles.selectGroup}>
                        <label className={styles.fieldLabel}>Or select from 30+ other banks</label>
                        <select
                          className={styles.bankSelect}
                          value={paymentDetails.netbanking.bankId}
                          onChange={(e) => selectBank(e.target.value)}
                        >
                          {ALL_BANKS.map((bank) => (
                            <option key={bank.id} value={bank.id}>
                              {bank.name} ({bank.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Security Footer Banner */}
      <div className={styles.securityBanner}>
        <span className={styles.securityItem}>
          <Lock size={14} className={styles.securityIcon} />
          256-bit SSL Encryption
        </span>
        <span className={styles.securityItem}>
          <ShieldCheck size={14} className={styles.securityIcon} />
          PCI-DSS Compliant
        </span>
        <span className={styles.securityItem}>
          <Sparkles size={14} className={styles.securityIcon} />
          Instant Refund Guarantee
        </span>
      </div>
    </div>
  );
}
