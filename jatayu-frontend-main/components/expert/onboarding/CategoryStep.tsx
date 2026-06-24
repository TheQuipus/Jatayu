"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import shared from "./onboarding.shared.module.css";
import styles from "./CategoryStep.module.css";

type CategoryOption = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type CategoryStepProps = {
  userName: string;
  categories: CategoryOption[];
  presetCategoryIds: string[];
  selectedCategory: string;
  stepCompletion: boolean[];
  onSelectCategory: (id: string) => void;
  onAddCustomCategory: (label: string) => void;
  onBack: () => void;
  onContinue: () => void;
  onJumpToStep?: (step: number) => void;
};

export default function CategoryStep({
  userName,
  categories,
  presetCategoryIds,
  selectedCategory,
  stepCompletion,
  onSelectCategory,
  onAddCustomCategory,
  onBack,
  onContinue,
  onJumpToStep,
}: CategoryStepProps) {
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const isGivenCategorySelected =
    selectedCategory !== "" && presetCategoryIds.includes(selectedCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGivenCategorySelected) return;
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    onAddCustomCategory(trimmed);
    setNewCategoryInput("");
  };

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
      <div className={shared.topHeader}>
        <OnboardingStepTitle userName={userName} />
        <div className={shared.stepPill}>
          <span>Step 1 of 9 - Category</span>
        </div>
      </div>

      {/* Progress Tracker */}
      <OnboardingProgressBar currentStep={1} stepCompletion={stepCompletion} onStepClick={onJumpToStep} />

      </div>

      <div className={`${shared.cardBody} ${styles.categoryCardBody}`}>
{/* Heading */}
      <h1 className={shared.questionTitle}>
        What is your <span className={shared.accentWord}>primary area</span> <br /> of expertise?
      </h1>

      <p className={shared.questionSubtitle}>
        Select your core professional focus. <br /> This helps us match you with the right clients.
      </p>

      <div className={styles.categoryBodyContent}>
        {/* Category Grid */}
        <div className={styles.categoryGridScroll}>
          <div className={styles.categoryGrid}>
            {categories.map((cat) => {
              const IconComponent = cat.icon;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(isSelected ? "" : cat.id)}
                  className={`${styles.categoryCard} ${isSelected ? styles.categoryCardSelected : ""}`}
                >
                  <IconComponent className={styles.categoryIcon} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form className={styles.customInputWrapper} onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Add custom category..."
            value={newCategoryInput}
            onChange={(e) => setNewCategoryInput(e.target.value)}
            className={styles.customInput}
            disabled={isGivenCategorySelected}
          />
          <button
            type="submit"
            className={styles.customInputBtn}
            aria-label="Add custom category"
            disabled={isGivenCategorySelected}
          >
            <Plus size={16} />
          </button>
        </form>
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
          <button
            type="button"
            className={shared.textBtn}
            onClick={onBack}
          >
            Back
          </button>
          <button
            type="button"
            className={shared.textBtn}
            onClick={onContinue}
          >
            Skip
          </button>
          <button
            type="button"
            className={shared.continueBtn}
            onClick={onContinue}
            disabled={!selectedCategory}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
