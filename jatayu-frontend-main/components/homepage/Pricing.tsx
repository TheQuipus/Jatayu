"use client";

import { useEffect, useState } from "react";
import PrimaryButton from "../ui/PrimaryButton";
import styles from "./Pricing.module.css";
import HeroLines from "../ui/HeroLines";

export default function Pricing() {
  const [isExpert, setIsExpert] = useState(false);
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
      alert("Form submitted successfully! Thank you for applying as an expert.");
      setName("");
      setEmail("");
      setMessage("");
      setAgreed(false);
      setErrors({});
    }
  };

  useEffect(() => {
    const scrollToPricing = () => {
      requestAnimationFrame(() => {
        document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
      });
    };

    const applyFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("for") === "expert") {
        setIsExpert(true);
      }
    };

    const handlePricingNav = (event: Event) => {
      const custom = event as CustomEvent<{ isExpert?: boolean }>;
      if (custom.detail?.isExpert) {
        setIsExpert(true);
      }
      applyFromUrl();
      scrollToPricing();
    };

    applyFromUrl();
    if (window.location.hash === "#pricing") {
      scrollToPricing();
    }

    window.addEventListener("hashchange", () => {
      applyFromUrl();
      if (window.location.hash === "#pricing") {
        scrollToPricing();
      }
    });
    window.addEventListener("popstate", applyFromUrl);
    window.addEventListener("pricing-nav", handlePricingNav);

    return () => {
      window.removeEventListener("popstate", applyFromUrl);
      window.removeEventListener("pricing-nav", handlePricingNav);
    };
  }, []);

  const toggleMode = (mode: boolean) => {
    setIsExpert(mode);
  };

  const badgeText = isExpert ? "BECOME AN EXPERT" : "JATAYU EXPERT GUIDANCE";
  const priceText = isExpert ? null : "Warm & Accountable.";
  const ctaText = "Get in touch";
  const includesTitleText = "AI ANSWERS";
  const deliveryText = "2-3 weeks";

  const planItems = isExpert
    ? [
      "Create paid micro-consultations",
      "Build long-term audience relationships",
      "Grow beyond algorithm dependency",
      "Offer premium sessions",
      "Get paid instantly",
    ]
    : [
      "Personalised Consultation",
      "Trusted and verified expert profile",
      "Connect via text, video response, or live call",
      "Secure payments via UPI",
    ];

  const includesHeadline = "Fast but generic.";
  const includesItems = [
    "No lived experience",
    "No accountability",
    "Robotic language",
    "Good for information",
  ];

  return (
    <>
      <HeroLines />
      <section className={styles.pricing} id="pricing">
        <div className="container">
          <div className={styles.pricingHead}>
            <div>
              <span className="eyebrow eyebrow--light">
                <i className="dot"></i>09&nbsp;&nbsp;lets connect
              </span>
              <h2 className="display">
                <span className="t-dark">ai informs you.</span>
                <br />
                <span className="t-muted"><span className={styles.noWrapBlack}>A human expert</span><br />understand you.</span>
              </h2>
            </div>
            <div className={styles.pricingIntro}>
              <p>
                AI can give fast answers. But your career, business, money, education, and life decisions need context, empathy, and lived experience.
              </p>
              <div className={styles.toggle}>
                <button
                  className={`${styles.toggleBtn} ${!isExpert ? styles.toggleBtnActive : ""}`}
                  onClick={() => toggleMode(false)}
                >
                  for seeker
                </button>
                <button
                  className={`${styles.toggleBtn} ${isExpert ? styles.toggleBtnActive : ""}`}
                  onClick={() => toggleMode(true)}
                >
                  for expert
                </button>
              </div>
            </div>
          </div>

          <div className={styles.pricingBody}>
            <div className={`${styles.plan} ${isExpert ? styles.planExpert : ""}`}>
              <div className={styles.planTop}>
                <span className={styles.planBadge}>{badgeText}</span>
                <div className={styles.planDivider}></div>
              </div>
              <div className={styles.planBottom}>
                {priceText ? <div className={styles.planPrice}>{priceText}</div> : null}
                <ul className={styles.planList}>
                  {planItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                {!isExpert && (
                  <div className={styles.planCtaWrap}>
                    <PrimaryButton
                      href="#contact"
                      label={ctaText}
                      variant="light"
                      fullWidth
                      className={styles.planCta}
                    />
                  </div>
                )}
              </div>
            </div>

            {isExpert ? (
              <div className={styles.expertForm}>
                <form className={styles.form} onSubmit={handleSubmit}>
                  <label className={styles.field}>
                    <div className={styles.fieldLabelRow}>
                      <span>Name</span>
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
                      <span>Email</span>
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
                      <span>Message</span>
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
                  <label className={styles.checkboxField}>
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    <span className={styles.checkboxText}>
                      By submitting, you agree to our terms and privacy policy
                    </span>
                  </label>
                  <PrimaryButton
                    label={ctaText}
                    variant="light"
                    fullWidth
                    className={styles.formSubmit}
                    type="submit"
                    disabled={!agreed || !name.trim() || !email.trim() || !message.trim()}
                  />
                </form>
              </div>
            ) : (
              <div className={styles.includes}>
                <div className={styles.includesHead}>
                  <div className={styles.includesHeadTop}>
                    <h3>{includesTitleText}</h3>
                    <span>{deliveryText}</span>
                  </div>
                  <div className={styles.includesDivider}></div>
                </div>
                <div className={styles.includesPrice}>{includesHeadline}</div>
                <ul>
                  {includesItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
      <HeroLines rotate180 />
    </>
  );
}
