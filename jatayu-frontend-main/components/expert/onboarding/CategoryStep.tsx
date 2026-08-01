"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Plus, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import ContinueButton from "@/components/ui/ContinueButton";
import shared from "./onboarding.shared.module.css";
import styles from "./CategoryStep.module.css";

type CategoryOption = {
  id: string;
  label: string;
  icon: LucideIcon;
};



function isCustomCategory(id: string) {
  return id.startsWith("custom-");
}

type CategoryStepProps = {
  userName: string;
  categories: CategoryOption[];
  selectedCategory: string;
  stepCompletion: boolean[];
  onSelectCategory: (id: string) => void;
  onAddCustomCategory: (label: string) => void;
  onRemoveCustomCategory: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
  onJumpToStep?: (step: number) => void;
};

export default function CategoryStep({
  userName,
  categories,
  selectedCategory,
  stepCompletion,
  onSelectCategory,
  onAddCustomCategory,
  onRemoveCustomCategory,
  onBack,
  onContinue,
  onJumpToStep,
}: CategoryStepProps) {
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [showInput, setShowInput] = useState(false);

  const customCategories = categories.filter((cat) => isCustomCategory(cat.id));
  const isMaxCustomReached = customCategories.length >= 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMaxCustomReached) return;
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    onAddCustomCategory(trimmed);
    setNewCategoryInput("");
    setShowInput(false);
  };

  const handleBlur = () => {
    if (isMaxCustomReached) {
      setShowInput(false);
      return;
    }
    const trimmed = newCategoryInput.trim();
    if (trimmed) {
      onAddCustomCategory(trimmed);
      setNewCategoryInput("");
    }
    setShowInput(false);
  };

  const handleSelectCategory = (catId: string, isSelected: boolean) => {
    if (isSelected) {
      onSelectCategory("");
    } else {
      onSelectCategory(catId);
    }
  };

  const predefinedCategories = categories.filter((cat) => !isCustomCategory(cat.id));

  // Directory layout grouping
  const grouped = predefinedCategories.reduce((acc, cat) => {
    const label = cat.label.trim();
    if (!label) return acc;
    const firstChar = label[0].toUpperCase();
    const isLetter = /^[A-Z]$/.test(firstChar);
    const key = isLetter ? firstChar : "#";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(cat);
    return acc;
  }, {} as Record<string, typeof categories>);

  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => a.label.localeCompare(b.label));
  });

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const activeLetters = new Set(Object.keys(grouped));

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
        </div>

        {/* Progress Tracker */}
        <OnboardingProgressBar
          currentStep={1}
          stepCompletion={stepCompletion}
          onStepClick={onJumpToStep}
        />
      </div>

      <div className={`${shared.cardBody} ${styles.categoryCardBody}`}>
        {/* Heading */}
        <h1 className={shared.questionTitle}>
          What is your <span className={shared.accentWord}>primary area</span> of expertise?
        </h1>

        <p className={shared.questionSubtitle}>
          Select your core professional focus. This helps us match you with the right clients.
        </p>

        {/* Directory Wrapper */}
        <div className={styles.directoryWrapper}>
          <div className={styles.alphabetBar}>
            {alphabet.map((letter) => {
              const isActive = activeLetters.has(letter);
              const scrollToGroup = () => {
                if (isActive) {
                  const element = document.getElementById(`group-${letter}`);
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }
              };

              return (
                <button
                  key={letter}
                  type="button"
                  onClick={scrollToGroup}
                  disabled={!isActive}
                  className={`${styles.alphabetLetter} ${isActive ? styles.alphabetLetterActive : ""
                    }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          <div className={styles.groupsContainer}>
            {alphabet.map((letter) => {
              const items = grouped[letter];
              if (!items || items.length === 0) return null;

              return (
                <div key={letter} id={`group-${letter}`} className={styles.groupRow}>
                  <div className={styles.letterBadgeWrap}>
                    <div className={styles.letterBadge}>{letter}</div>
                  </div>

                  <div className={styles.groupItems}>
                    {items.map((cat) => {
                      const isSelected = selectedCategory === cat.id;

                      return (
                        <div className={styles.categoryItemWrapper} key={cat.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectCategory(cat.id, isSelected)}
                            className={`${styles.categoryItem} ${
                              isSelected ? styles.categoryItemSelected : ""
                            }`}
                          >
                            <span className={styles.categoryLabelText}>{cat.label}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Custom Category Input Form */}
            <div className={styles.customInputContainer}>
              {customCategories.length > 0 && (
                <div className={styles.customChipsList}>
                  {customCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <div className={styles.categoryItemWrapper} key={cat.id}>
                        <div
                          className={`${styles.categoryItem} ${styles.categoryItemRemovable} ${
                            isSelected ? styles.categoryItemSelected : ""
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectCategory(cat.id, isSelected)}
                            className={styles.categoryItemMain}
                          >
                            <span className={styles.categoryLabelText}>{cat.label}</span>
                          </button>
                          <button
                            type="button"
                            className={styles.categoryRemoveBtn}
                            aria-label={`Remove ${cat.label}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveCustomCategory(cat.id);
                            }}
                          >
                            <X size={12} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <h3 className={styles.customHeading}>
                Didn&apos;t find what you&apos;re looking for?
              </h3>
              {!isMaxCustomReached && showInput ? (
                <div className={`${styles.categoryItem} ${styles.categoryItemInput}`}>
                  <form onSubmit={handleSubmit} className={styles.categoryInputForm}>
                    <input
                      type="text"
                      placeholder="Add custom category..."
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      className={styles.categoryInlineInput}
                      onBlur={handleBlur}
                      autoFocus
                      aria-label="Add custom category"
                    />
                    <button
                      type="submit"
                      className={styles.categoryAddBtn}
                      onMouseDown={(e) => e.preventDefault()}
                      aria-label="Add custom category"
                    >
                      <Plus size={14} aria-hidden="true" />
                    </button>
                  </form>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => !isMaxCustomReached && setShowInput(true)}
                  disabled={isMaxCustomReached}
                  className={`${styles.categoryItem} ${
                    isMaxCustomReached ? styles.categoryItemDisabled : ""
                  }`}
                >
                  <Plus size={14} />
                  <span>Add custom</span>
                </button>
              )}
              {isMaxCustomReached && (
                <p className={styles.customLimitMessage}>
                  <Info size={14} className={styles.infoIcon} aria-hidden="true" />
                  <span>Only one entry is allowed. Delete to make another</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step 1 Footer */}
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
            <strong>Great start!</strong>
            <small>Your profile foundation is set.</small>
          </div>
        </div>

        <div className={shared.footerActions}>
          <button type="button" className={shared.textBtn} onClick={onBack}>
            Back
          </button>
          <ContinueButton onClick={onContinue} disabled={!selectedCategory} />
        </div>
      </div>
    </section>
  );
}
