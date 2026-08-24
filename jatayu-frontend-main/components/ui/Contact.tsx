"use client";

import { useState } from "react";
import ContactActionButton from "./ContactActionButton";
import PrimaryButton from "./PrimaryButton";
import styles from "./Contact.module.css";
import { handleJoinAsExpertClick, JOIN_AS_EXPERT_HREF } from "@/lib/joinAsExpertNav";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});

  const validateField = (fieldName: string, value: string) => {
    let err = "";
    if (fieldName === "name") {
      if (!value.trim()) {
        err = "Name is required";
      } else if (value.trim().length < 2) {
        err = "Name must be at least 2 characters";
      }
    } else if (fieldName === "email") {
      if (!value.trim()) {
        err = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        err = "Please enter a valid email address";
      }
    } else if (fieldName === "message") {
      if (!value.trim()) {
        err = "Message is required";
      } else if (value.trim().length < 10) {
        err = "Message must be at least 10 characters";
      }
    }
    setErrors((prev) => ({ ...prev, [fieldName]: err }));
    return !err;
  };

  const handleBlur = (fieldName: string, value: string) => {
    validateField(fieldName, value);
  };

  const handleChange = (fieldName: string, value: string) => {
    if (fieldName === "name") setName(value);
    if (fieldName === "email") setEmail(value);
    if (fieldName === "message") setMessage(value);

    // Clear error dynamically when user corrects it
    if (errors[fieldName as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isNameValid = validateField("name", name);
    const isEmailValid = validateField("email", email);
    const isMsgValid = validateField("message", message);

    if (isNameValid && isEmailValid && isMsgValid && agreed) {
      alert("Form submitted successfully! Getting you matched...");
      setName("");
      setEmail("");
      setMessage("");
      setAgreed(false);
      setErrors({});
    }
  };

  return (
    <>
      <section className={styles.contact} id="contact">
        <div className={`container ${styles.contactInner}`}>
          <div className={styles.contactLeft}>
            <span className={`eyebrow eyebrow--ghost ${styles.contactEyebrow}`}>
              <i className="dot dot--white"></i>get in touch
            </span>
          </div>

          <div className={styles.contactActionsWrap}>
            <div className={styles.contactActions}>
              <div className={styles.contactActionItem}>
                <p className={styles.contactActionText}>
                  Ask AI for information. Ask Jatayu for human guidance. Speak to verified experts who understand your language, ambition, constraints and real-world context.
                </p>
                <ContactActionButton
                  wrapperClassName={styles.contactActionBtnWrap}
                  className={styles.contactActionButton}
                  label="LET'S TALK"
                  avatarSrc="/assets/seekerbutton.svg"
                  avatarAlt="Seeker"
                  type="button"
                  fullWidth
                />
              </div>
              <div className={styles.contactActionItem}>
                <p className={styles.contactActionText}>Your expertise deserves a business model.</p>
                <ContactActionButton
                  wrapperClassName={styles.contactActionBtnWrap}
                  className={styles.contactActionButton}
                  label="JOIN AS EXPERT"
                  avatarSrc="/assets/expertbutton.svg"
                  avatarAlt="Expert"
                  href={JOIN_AS_EXPERT_HREF}
                  onClick={handleJoinAsExpertClick}
                  fullWidth
                />
              </div>
            </div>
          </div>

          <div className={styles.contactTitleWrap}>
            <h2 className={styles.contactTitle}>
              <span className={styles.contactTitleLine}>YOUR NEXT DECISION</span>
              <br />
              <span className={styles.contactTitleLine}>DESERVES MORE</span>
              <br />
              <span className={styles.contactTitleLine}>THAN GUESSWORK.</span>
            </h2>
          </div>

          <div className={styles.contactFormWrap}>
            <p className={styles.formIntro}>
              <span className={styles.formIntroLabel}>GET MATCHED - 24H RESPONSE</span>
              <br />
              <span className={styles.formIntroTime}>Let our experts clear your clouds.</span>
            </p>
            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <span>NAME</span>
                  {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
                </div>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onBlur={(e) => handleBlur("name", e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <span>EMAIL</span>
                  {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                </div>
                <input
                  type="email"
                  placeholder="jane@gmail.com"
                  value={email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={(e) => handleBlur("email", e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <span>MESSAGE</span>
                  {errors.message && <span className={styles.errorMessage}>{errors.message}</span>}
                </div>
                <input
                  type="text"
                  placeholder="Leave a message"
                  value={message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  onBlur={(e) => handleBlur("message", e.target.value)}
                />
              </label>
              <div className={styles.formFoot}>
                <label className={styles.termsLabel}>
                  <input
                    type="checkbox"
                    className={styles.termsCheckbox}
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <span className={styles.formTerms}>
                    BY SUBMITTING, YOU AGREE TO <a href="/terms" target="_blank" rel="noopener noreferrer">OUR TERMS</a> AND <a href="/privacy" target="_blank" rel="noopener noreferrer">PRIVACY POLICY</a>
                  </span>
                </label>
                <PrimaryButton
                  className={styles.formSubmit}
                  label="Get matched with an experrt"
                  variant="dark"
                  fullWidth
                  disabled={!agreed || !name.trim() || !email.trim() || !message.trim()}
                />
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
