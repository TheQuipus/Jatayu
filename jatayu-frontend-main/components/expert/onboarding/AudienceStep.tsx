"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight, Check, Plus, Rocket, Building, Briefcase, Store } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import shared from "./onboarding.shared.module.css";
import styles from "./AudienceStep.module.css";

type AudienceStepProps = {
  userName: string;
  stepCompletion: boolean[];
  onStepCompleteChange?: (step: number, complete: boolean) => void;
  onBack: () => void;
  onContinue: (data: { targetAudience: string[]; focusAreas: string[] }) => void;
  onJumpToStep?: (step: number) => void;
};

type AudienceType = {
  id: string;
  title: string;
  desc: string;
  icon: any;
};

const audiences: AudienceType[] = [
  {
    id: "startup",
    title: "Startup Founders",
    desc: "Early-stage entrepreneurs, seed to Series A seeking strategic growth advice.",
    icon: Rocket,
  },
  {
    id: "enterprise",
    title: "Enterprise Execs",
    desc: "Corporate leaders needing specific domain expertise or leadership coaching.",
    icon: Building,
  },
  {
    id: "career",
    title: "Career Transitioners",
    desc: "Professionals looking to pivot industries or level up their careers.",
    icon: Briefcase,
  },
  {
    id: "smb",
    title: "Small Business Owners",
    desc: "Local or niche business owners looking for scaling and operations guidance.",
    icon: Store,
  },
];

export default function AudienceStep({
  userName,
  stepCompletion,
  onStepCompleteChange,
  onBack,
  onContinue,
  onJumpToStep,
}: AudienceStepProps) {
  const [languages, setLanguages] = useState<string[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [newLanguage, setNewLanguage] = useState("");

  const canContinue = languages.length > 0 && selectedAudiences.length > 0;

  useEffect(() => {
    onStepCompleteChange?.(7, canContinue);
  }, [canContinue, onStepCompleteChange]);

  const presetLanguages = [
    "English",
    "Hindi",
    "Bengali",
    "Marathi",
    "Telugu",
    "Tamil",
    "Gujarati",
    "Kannada",
    "Malayalam",
    "Odia",
    "Punjabi",
  ];

  const handleToggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      if (languages.length > 1) {
        setLanguages(languages.filter((l) => l !== lang));
      }
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const handleAddCustomLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLanguage.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages([...languages, trimmed]);
      setNewLanguage("");
      setShowAddLanguage(false);
    }
  };

  const maxAudiences = 3;
  const remainingAudiences = maxAudiences - selectedAudiences.length;
  const audienceInstructionText =
    selectedAudiences.length === maxAudiences
      ? "Selected audience type"
      : `Select up to ${remainingAudiences} primary audience type${remainingAudiences === 1 ? "" : "s"}`;

  const handleToggleAudience = (id: string) => {
    if (selectedAudiences.includes(id)) {
      setSelectedAudiences(selectedAudiences.filter((a) => a !== id));
    } else {
      if (selectedAudiences.length < maxAudiences) {
        setSelectedAudiences([...selectedAudiences, id]);
      }
    }
  };

  return (
    <section className={shared.card}>
      <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }} aria-hidden="true">
        <defs>
          <clipPath id="custom-clip" clipPathUnits="objectBoundingBox">
            <path d="M0,0.086 L0.018,0 H0.676 L0.696,0.086 H0.978 L1,0.311 V0.743 L0.984,0.839 L0.955,0.845 L0.9,1 H0 V0.086 Z" fillOpacity="0.05" strokeOpacity="0.1"/>
          </clipPath>
        </defs>
      </svg>
      <div className={shared.cardHeader}>
      <div className={shared.topHeader}>
        <OnboardingStepTitle userName={userName} />
        <div className={shared.stepPill}>
          <span>Step 7 of 9 - Languages & Audience</span>
        </div>
      </div>

      {/* Progress Tracker */}
      <OnboardingProgressBar currentStep={7} stepCompletion={stepCompletion} onStepClick={onJumpToStep} />

      </div>

      <div className={shared.cardBody}>
{/* Heading */}
      <h1 className={`${shared.questionTitle} ${styles.questionTitle}`}>
        Define your <span className={shared.accentWord}>target audience</span>
      </h1>

      <p className={`${shared.questionSubtitle} ${styles.questionSubtitle}`} style={{ marginBottom: "36px" }}>
        Help us match you with the right clients by selecting your languages and ideal audience.
      </p>

      {/* Languages Selection section */}
      <div className={styles.audienceSection} style={{ marginBottom: "32px" }}>
        <div className={styles.sectionHeaderRow}>
          <h3 className={styles.preferencesSectionLabel}>Languages you consult in</h3>
        </div>

        <div className={styles.languagesCluster}>
          {presetLanguages.map((lang) => {
            const isSelected = languages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleToggleLanguage(lang)}
                className={`${styles.languagePill} ${isSelected ? styles.languagePillSelected : ""}`}
              >
                <span
                  className={`${styles.languageCheckbox} ${isSelected ? styles.languageCheckboxSelected : ""}`}
                  aria-hidden="true"
                >
                  {isSelected && <Check size={8} strokeWidth={3} />}
                </span>
                <span>{lang}</span>
              </button>
            );
          })}

          {/* Render custom added languages if not in preset */}
          {languages
            .filter((lang) => !presetLanguages.includes(lang))
            .map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleToggleLanguage(lang)}
                className={`${styles.languagePill} ${styles.languagePillSelected}`}
              >
                <span className={`${styles.languageCheckbox} ${styles.languageCheckboxSelected}`} aria-hidden="true">
                  <Check size={8} strokeWidth={3} />
                </span>
                <span>{lang}</span>
              </button>
            ))}

          {!showAddLanguage ? (
            <button
              type="button"
              onClick={() => setShowAddLanguage(true)}
              className={styles.addLanguageBtn}
            >
              <Plus size={14} />
              <span>Add Other</span>
            </button>
          ) : (
            <form onSubmit={handleAddCustomLanguage} className={styles.addLanguageForm}>
              <input
                type="text"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Language name..."
                className={styles.addLanguageInput}
                autoFocus
              />
              <button type="submit" className={styles.addLanguageSubmit}>
                Add
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Ideal Clients / Audiences selection section */}
      <div className={styles.audienceSection} style={{ marginBottom: "40px" }}>
        <div className={styles.sectionHeaderRow}>
          <h3 className={styles.preferencesSectionLabel}>Your ideal clients</h3>
        </div>
        <p className={styles.sectionInstruction}>{audienceInstructionText}</p>

        <div className={styles.audiencesGrid}>
          {audiences.map((aud) => {
            const isSelected = selectedAudiences.includes(aud.id);
            const Icon = aud.icon;
            return (
              <button
                key={aud.id}
                type="button"
                onClick={() => handleToggleAudience(aud.id)}
                className={`${styles.audienceCard} ${isSelected ? styles.audienceCardSelected : ""}`}
              >
                {/* SVG border overlay */}
                <svg className={styles.cardBorderSvg} viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
                  <path
                    d="M0,0.086 L0.018,0 H0.676 L0.696,0.086 H0.978 L1,0.311 V0.743 L0.984,0.839 L0.955,0.845 L0.9,1 H0 V0.086 Z"
                    fill="none"
                    stroke={isSelected ? "#E53B17" : "#FFFFFF"}
                    strokeOpacity={isSelected ? 1 : 0.08}
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                <div className={styles.audienceIconWrap}>
                  <Icon className={styles.audienceCardIcon} />
                </div>
                <div className={styles.audienceTextWrap}>
                  <h4 className={styles.audienceTitle}>{aud.title}</h4>
                  <p className={styles.audienceDesc}>{aud.desc}</p>
                </div>
                <div
                  className={`${styles.audienceCheckbox} ${isSelected ? styles.audienceCheckboxSelected : ""}`}
                  aria-hidden="true"
                >
                  {isSelected && <Check size={10} strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      </div>

      <div className={shared.onboardingFooter}>
        <div className={shared.footerLeft}>
          <div className={shared.avatarMiniWrap}>
            <Image
              src="/assets/img/avatar1.png"
              alt="Expert advisor"
              width={36}
              height={36}
              className={shared.avatarMini}
            />
          </div>
          <div className={shared.footerTip}>
            <strong>Reach Expanded +10%</strong>
            <small>Clear audiences help us find the right matches.</small>
          </div>
        </div>

        <div className={shared.footerActions}>
          <button type="button" className={shared.textBtn} onClick={onBack}>
            Back
          </button>
          <button type="button" className={shared.textBtn} onClick={() => onContinue({ targetAudience: selectedAudiences, focusAreas: languages })}>
            Skip
          </button>
          <button
            type="button"
            className={shared.continueBtn}
            onClick={() => onContinue({ targetAudience: selectedAudiences, focusAreas: languages })}
            disabled={languages.length === 0 || selectedAudiences.length === 0}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
