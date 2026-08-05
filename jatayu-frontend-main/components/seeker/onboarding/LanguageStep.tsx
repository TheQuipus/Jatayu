"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Search } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import MatchingProgress from "./MatchingProgress";
import type { ProgressCompletion, ProgressStepKey } from "./MatchingProgress";
import ContinueButton from "@/components/ui/ContinueButton";
import shared from "./onboarding.shared.module.css";
import styles from "./LanguageStep.module.css";
import register from "./register.shared.module.css";

type LanguageOption = {
  id: string;
  code: string;
  name: string;
};

type LanguageStepProps = {
  userName: string;
  selectedLanguages: string[];
  onSelectedLanguagesChange: (languages: string[]) => void;
  onBack: () => void;
  onContinue: () => void;
  progressCompletion: ProgressCompletion;
  onProgressStepClick: (step: ProgressStepKey) => void;
};

const languageOptions: LanguageOption[] = [
  { id: "hindi", code: "HI", name: "Hindi" },
  { id: "bengali", code: "BN", name: "Bengali" },
  { id: "telugu", code: "TE", name: "Telugu" },
  { id: "marathi", code: "MR", name: "Marathi" },
  { id: "tamil", code: "TA", name: "Tamil" },
  { id: "urdu", code: "UR", name: "Urdu" },
  { id: "gujarati", code: "GU", name: "Gujarati" },
  { id: "kannada", code: "KN", name: "Kannada" },
  { id: "malayalam", code: "ML", name: "Malayalam" },
  { id: "odia", code: "OR", name: "Odia" },
  { id: "punjabi", code: "PA", name: "Punjabi" },
  { id: "assamese", code: "AS", name: "Assamese" },
  { id: "english", code: "EN", name: "English" },
  { id: "konkani", code: "KO", name: "Konkani" },
  { id: "kashmiri", code: "KS", name: "Kashmiri" },
  { id: "sindhi", code: "SD", name: "Sindhi" },
  { id: "nepali", code: "NE", name: "Nepali" },
  { id: "maithili", code: "MT", name: "Maithili" },
  { id: "santali", code: "ST", name: "Santali" },
  { id: "bodo", code: "BO", name: "Bodo" },
  { id: "dogri", code: "DG", name: "Dogri" },
  { id: "manipuri", code: "MN", name: "Manipuri" },
  { id: "sanskrit", code: "SA", name: "Sanskrit" },
];

export function getLanguageName(id: string): string {
  return languageOptions.find((lang) => lang.id === id)?.name ?? id;
}

export default function LanguageStep({
  userName,
  selectedLanguages,
  onSelectedLanguagesChange,
  onBack,
  onContinue,
  progressCompletion,
  onProgressStepClick,
}: LanguageStepProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLanguages = languageOptions.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleLanguage = (id: string) => {
    if (selectedLanguages.includes(id)) {
      onSelectedLanguagesChange(selectedLanguages.filter((langId) => langId !== id));
    } else {
      onSelectedLanguagesChange([...selectedLanguages, id]);
    }
  };

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
          <div className={shared.stepPill}>
            <span>Language preferences</span>
          </div>
        </div>

        <MatchingProgress
          completion={progressCompletion}
          onStepClick={onProgressStepClick}
        />
      </div>

      <div className={shared.cardBody}>
        <h1 className={`${shared.questionTitle} ${styles.questionTitle}`}>
          What languages do you <span className={shared.accentWord}>prefer</span>?
        </h1>

        <p className={`${shared.questionSubtitle} ${styles.questionSubtitle}`}>
          Select all languages you&apos;re comfortable with. We&apos;ll match experts who speak them fluently.
        </p>

        <div className={styles.searchWrapper}>
          <div className={register.inputWithIconWrap}>
            <Search className={register.inputInnerIcon} size={16} />
            <input
              type="text"
              placeholder="Search Indian languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={register.textFieldWithIcon}
            />
          </div>
        </div>

        {filteredLanguages.length > 0 ? (
          <div className={styles.languageCluster}>
            {filteredLanguages.map((lang) => {
              const isSelected = selectedLanguages.includes(lang.id);

              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => handleToggleLanguage(lang.id)}
                  className={`${styles.languagePill} ${
                    isSelected ? styles.languagePillSelected : ""
                  }`}
                >
                  {lang.name}
                </button>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span>No languages found matching &quot;{searchQuery}&quot;</span>
          </div>
        )}
      </div>

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
          <button type="button" className={shared.textBtn} onClick={onContinue}>
            Skip
          </button>
          <ContinueButton
            onClick={onContinue}
            disabled={selectedLanguages.length === 0}
          />
        </div>
      </div>
    </section>
  );
}
