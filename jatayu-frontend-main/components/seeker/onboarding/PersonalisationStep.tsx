"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import shared from "./onboarding.shared.module.css";
import styles from "./PersonalisationStep.module.css";

type PersonalisationStepProps = {
  userName: string;
  firstName: string;
  onChangeFirstName: (val: string) => void;
  experienceLevel: string;
  onChangeExperienceLevel: (val: string) => void;
  communicationStyle: string;
  onChangeCommunicationStyle: (val: string) => void;
  ageRange: string;
  onChangeAgeRange: (val: string) => void;
  location: string;
  onChangeLocation: (val: string) => void;
  additionalContext: string;
  onChangeAdditionalContext: (val: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

const completionChecklist = [
  { id: "needs", label: "Needs Defined", icon: "✓" },
  { id: "topics", label: "Topics Chosen", icon: "✓" },
  { id: "challenge", label: "Challenge Described", icon: "✓" },
  { id: "outcome", label: "Outcome Set", icon: "✓" },
  { id: "format", label: "Format Selected", icon: "✓" },
  { id: "almost", label: "Almost there!", icon: "✨" },
];

const experienceLevels = [
  "Beginner / Just starting",
  "Intermediate / Some experience",
  "Advanced / Experienced",
  "Expert / Leading in the field",
];

const communicationStyles = [
  { id: "direct", label: "Direct & Concise" },
  { id: "collaborative", label: "Collaborative & Warm" },
  { id: "analytical", label: "Detailed & Analytical" },
];

const ageRanges = ["18–24", "25–34", "35–44", "45–54", "55+"];

export default function PersonalisationStep({
  userName,
  firstName,
  onChangeFirstName,
  experienceLevel,
  onChangeExperienceLevel,
  communicationStyle,
  onChangeCommunicationStyle,
  ageRange,
  onChangeAgeRange,
  location,
  onChangeLocation,
  additionalContext,
  onChangeAdditionalContext,
  onBack,
  onContinue,
}: PersonalisationStepProps) {
  return (
    <section className={shared.card} style={{ minHeight: "820px" }}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
          
          <div className={styles.headerRightSide}>
            <span className={styles.saveIndicator}>
              <span className={styles.greenDot} /> Changes saved automatically
            </span>
            <div className={shared.stepPill}>
              <span>Step 10 of 12 · Personalisation</span>
            </div>
          </div>
        </div>
      </div>

      <div className={shared.cardBody} style={{ minHeight: "619px", maxHeight: "none" }}>
        {/* Heading */}
        <h1 className={shared.questionTitle} style={{ margin: "0 auto 12px" }}>
          Tell us a <span className={shared.accentWord}>bit about yourself</span>
        </h1>

        <p className={shared.questionSubtitle} style={{ margin: "0 auto 24px" }}>
          A few quick details help us fine-tune your expert match for the best possible connection.
        </p>

        {/* Checklist Cluster */}
        <div className={styles.checklistRow}>
          {completionChecklist.map((item) => (
            <div
              key={item.id}
              className={`${styles.checklistPill} ${
                item.id === "almost" ? styles.almostPill : ""
              }`}
            >
              <span className={item.id === "almost" ? styles.sparkleIcon : styles.checkIcon}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.trackerLabel}>PROFILE COMPLETION TRACKER</div>

        {/* Form Container */}
        <form className={styles.formContainer} onSubmit={(e) => e.preventDefault()}>
          {/* Row 1: Name and Experience level */}
          <div className={styles.formRow2Col}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="firstName">
                Your first name
              </label>
              <input
                id="firstName"
                type="text"
                placeholder="e.g. Alex"
                value={firstName}
                onChange={(e) => onChangeFirstName(e.target.value)}
                className={styles.textInput}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="experienceLevel">
                Your experience level in this area
              </label>
              <div className={styles.selectWrapper}>
                <select
                  id="experienceLevel"
                  value={experienceLevel}
                  onChange={(e) => onChangeExperienceLevel(e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="">Select level</option>
                  {experienceLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Preferred communication style */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Preferred expert communication style
            </label>
            <div className={styles.stylePillsRow}>
              {communicationStyles.map((style) => {
                const isSelected = communicationStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => onChangeCommunicationStyle(style.id)}
                    className={`${styles.stylePill} ${
                      isSelected ? styles.stylePillSelected : ""
                    }`}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Age range */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Age range (optional)</label>
            <div className={styles.agePillsRow}>
              {ageRanges.map((range) => {
                const isSelected = ageRange === range;
                return (
                  <button
                    key={range}
                    type="button"
                    onClick={() => onChangeAgeRange(range)}
                    className={`${styles.agePill} ${
                      isSelected ? styles.agePillSelected : ""
                    }`}
                  >
                    {range}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: Where are you based */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="location">
              Where are you based?
            </label>
            <input
              id="location"
              type="text"
              placeholder="City, Country"
              value={location}
              onChange={(e) => onChangeLocation(e.target.value)}
              className={styles.textInput}
            />
          </div>

          {/* Row 5: Additional context */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="additionalContext">
              Any additional context
            </label>
            <textarea
              id="additionalContext"
              placeholder="Anything else you want your expert to know?"
              value={additionalContext}
              onChange={(e) => onChangeAdditionalContext(e.target.value)}
              className={styles.textareaInput}
              rows={4}
            />
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className={shared.onboardingFooter}>
        <div className={shared.footerLeft}>
          <div className={shared.avatarMiniWrap}>
            <Image
              src="/assets/img/avatar1.png"
              alt="Guide Advisor"
              width={36}
              height={36}
              className={shared.avatarMini}
            />
          </div>
          <div className={shared.footerTip}>
            <strong>Almost matched!</strong>
            <small>Personalizing matches ensures much more alignment.</small>
          </div>
        </div>

        <div className={shared.footerActions}>
          <button
            type="button"
            className={shared.textBtn}
            onClick={onBack}
          >
            Back
          </button>
          <button
            type="button"
            className={shared.continueBtn}
            onClick={onContinue}
            disabled={!firstName || !experienceLevel || !communicationStyle}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
