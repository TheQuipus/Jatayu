"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Plus, Info, Loader2, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import ContinueButton from "@/components/ui/ContinueButton";
import { recommendSkillsForCategory } from "@/lib/api";
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
  onAddCustomCategory: (label: string, aiSkills?: string[]) => void;
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
  const [isRecommending, setIsRecommending] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const customCategories = categories.filter((cat) => isCustomCategory(cat.id));
  const isMaxCustomReached = customCategories.length >= 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMaxCustomReached || isRecommending) return;
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;

    setValidationError(null);
    setIsRecommending(true);

    try {
      const res = await recommendSkillsForCategory(trimmed);
      if (!res.valid) {
        setValidationError(res.message || "Please enter a valid professional category name.");
        setIsRecommending(false);
        return;
      }

      onAddCustomCategory(trimmed, res.skills);
      setNewCategoryInput("");
      setShowInput(false);
    } catch (err) {
      console.warn("AI category recommendation error:", err);
      onAddCustomCategory(trimmed);
      setNewCategoryInput("");
      setShowInput(false);
    } finally {
      setIsRecommending(false);
    }
  };

  const handleBlur = () => {
    if (!newCategoryInput.trim() && !isRecommending) {
      setShowInput(false);
      setValidationError(null);
    }
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
                            className={`${styles.categoryItem} ${isSelected ? styles.categoryItemSelected : ""
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
              {isMaxCustomReached ? (
                <>
                  <h3 className={styles.customHeading}>
                    Only one entry is allowed.
                  </h3>
                  {customCategories.length > 0 && (
                    <div className={styles.customChipsList}>
                      {customCategories.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                          <div className={styles.categoryItemWrapper} key={cat.id}>
                            <div
                              className={`${styles.categoryItem} ${styles.categoryItemRemovable} ${isSelected ? styles.categoryItemSelected : ""
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
                </>
              ) : (
                <>
                  <h3 className={styles.customHeading}>
                    Didn&apos;t find what you&apos;re looking for?
                  </h3>
                  {showInput ? (
                    <div className={`${styles.categoryItem} ${styles.categoryItemInput}`}>
                      <form onSubmit={handleSubmit} className={styles.categoryInputForm}>
                        <input
                          type="text"
                          placeholder={isRecommending ? "Validating & recommending..." : "Add custom category..."}
                          value={newCategoryInput}
                          onChange={(e) => {
                            setNewCategoryInput(e.target.value);
                            setValidationError(null);
                          }}
                          disabled={isRecommending}
                          className={styles.categoryInlineInput}
                          onBlur={handleBlur}
                          autoFocus
                          aria-label="Add custom category"
                        />
                        <button
                          type="submit"
                          disabled={isRecommending}
                          className={styles.categoryAddBtn}
                          onMouseDown={(e) => e.preventDefault()}
                          aria-label="Add custom category"
                        >
                          {isRecommending ? (
                            <Loader2 size={14} className={styles.spin} aria-hidden="true" />
                          ) : (
                            <Plus size={14} aria-hidden="true" />
                          )}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowInput(true)}
                      className={styles.categoryItem}
                    >
                      <Plus size={14} />
                      <span>Add custom</span>
                    </button>
                  )}

                  {validationError && (
                    <p className={styles.customErrorMessage}>
                      <AlertCircle size={14} className={styles.errorIcon} aria-hidden="true" />
                      <span>{validationError}</span>
                    </p>
                  )}
                </>
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
