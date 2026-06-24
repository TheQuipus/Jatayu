"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Search } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import shared from "./onboarding.shared.module.css";
import styles from "./LanguageStep.module.css";

type LanguageOption = {
  id: string;
  code: string;
  name: string;
  expertsCount: number;
};

type LanguageStepProps = {
  userName: string;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

const languageOptions: LanguageOption[] = [
  { id: "english", code: "US", name: "English", expertsCount: 420 },
  { id: "french", code: "FR", name: "French", expertsCount: 125 },
  { id: "german", code: "DE", name: "German", expertsCount: 110 },
  { id: "spanish", code: "ES", name: "Spanish", expertsCount: 180 },
  { id: "portuguese", code: "PT", name: "Portuguese", expertsCount: 85 },
  { id: "italian", code: "IT", name: "Italian", expertsCount: 90 },
  { id: "mandarin", code: "CN", name: "Mandarin", expertsCount: 150 },
  { id: "japanese", code: "JP", name: "Japanese", expertsCount: 95 },
  { id: "korean", code: "KR", name: "Korean", expertsCount: 70 },
  { id: "arabic", code: "AE", name: "Arabic", expertsCount: 115 },
  { id: "russian", code: "RU", name: "Russian", expertsCount: 80 },
  { id: "hindi", code: "IN", name: "Hindi", expertsCount: 135 },
];

export default function LanguageStep({
  userName,
  selectedLanguage,
  onSelectLanguage,
  onBack,
  onContinue,
}: LanguageStepProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLanguages = languageOptions.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
          <div className={shared.stepPill}>
            <span>Step 8 of 12 · Language</span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className={shared.progressContainer}>
          <div className={shared.progressTextRow}>
            <span>Matching Progress</span>
            <span>80%</span>
          </div>
          <div className={shared.progressBarBg}>
            <div className={shared.progressBarFill} style={{ width: "80%" }} />
          </div>
        </div>
      </div>

      <div className={shared.cardBody}>
        {/* Heading */}
        <h1 className={shared.questionTitle}>
          What language do you <span className={shared.accentWord}>prefer</span>?
        </h1>

        <p className={shared.questionSubtitle}>
          We'll prioritize experts who communicate fluently in your chosen language.
        </p>

        {/* Search Bar */}
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Search languages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Primary Language Label */}
        <div className={styles.sectionHeader}>PRIMARY LANGUAGE</div>

        {/* 3-column Grid */}
        {filteredLanguages.length > 0 ? (
          <div className={styles.languageGrid}>
            {filteredLanguages.map((lang) => {
              const isSelected = selectedLanguage === lang.id;

              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => onSelectLanguage(lang.id)}
                  className={`${styles.languageCard} ${
                    isSelected ? styles.languageCardSelected : ""
                  }`}
                >
                  <span className={styles.languageCode}>{lang.code}</span>
                  <div className={styles.languageInfo}>
                    <span className={styles.languageName}>{lang.name}</span>
                    <span className={styles.expertsCount}>
                      {lang.expertsCount} experts
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span>No languages found matching "{searchQuery}"</span>
          </div>
        )}
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
            <strong>Preferences updated!</strong>
            <small>Guarantees smooth, stress-free consultations.</small>
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
            disabled={!selectedLanguage}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
