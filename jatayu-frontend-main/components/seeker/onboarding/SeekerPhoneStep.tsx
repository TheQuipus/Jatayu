"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import { isValidSeekerPhone, normalizeSeekerPhone } from "@/lib/seekerPhone";
import RegisterLeftPanel from "./RegisterLeftPanel";
import register from "./register.shared.module.css";
import styles from "./RegisterStep.module.css";

type SeekerPhoneStepProps = {
  userName: string;
  onContinue: (phone: string) => Promise<void>;
};

export default function SeekerPhoneStep({ userName, onContinue }: SeekerPhoneStepProps) {
  const [phone, setPhone] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhone = normalizeSeekerPhone(phone);
    if (!isValidSeekerPhone(normalizedPhone)) {
      setSubmitError("Enter a valid 10-digit phone number.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      await onContinue(normalizedPhone);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save your phone number.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={register.registerCard}>
      <RegisterLeftPanel variant="register" />
      <div className={register.registerRight}>
        <h1 className={styles.registerFormIntro}>
          {userName ? `Hi ${userName.split(/\s+/)[0]}, add your phone number` : "Add your phone number"}
        </h1>
        <p className={styles.registerFormIntro}>
          We need your contact number to complete your seeker profile.
        </p>
        <form className={styles.registerForm} onSubmit={handleSubmit} noValidate>
          <div className={register.fieldGroup}>
            <label className={register.registerFieldLabel} htmlFor="seeker-phone-onboarding">
              Phone Number
            </label>
            <div className={register.inputWithIconWrap}>
              <Phone className={register.inputInnerIcon} size={16} />
              <span className={styles.phonePrefix} aria-hidden="true">+91</span>
              <input
                id="seeker-phone-onboarding"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                className={register.textFieldWithIcon}
                placeholder="10-digit number"
                value={phone}
                onChange={(event) => {
                  setPhone(normalizeSeekerPhone(event.target.value).slice(0, 10));
                  setSubmitError("");
                }}
                maxLength={10}
                aria-invalid={Boolean(submitError)}
              />
            </div>
          </div>
          {submitError ? <p className={register.fieldErrorStatic} role="alert">{submitError}</p> : null}
          <ContinueButton
            type="submit"
            label={isSubmitting ? "Saving..." : "Continue"}
            disabled={isSubmitting}
          />
        </form>
      </div>
    </section>
  );
}
