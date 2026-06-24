"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
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
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  onAddCustomCategory: (label: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export default function CategoryStep({
  userName,
  categories,
  selectedCategory,
  onSelectCategory,
  onAddCustomCategory,
  onBack,
  onContinue,
}: CategoryStepProps) {
  const [newCategoryInput, setNewCategoryInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            <span>Step 2 of 12 · Domain</span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className={shared.progressContainer}>
          <div className={shared.progressTextRow}>
            <span>Matching Progress</span>
            <span>20%</span>
          </div>
          <div className={shared.progressBarBg}>
            <div className={shared.progressBarFill} style={{ width: "20%" }} />
          </div>
        </div>
      </div>

      <div className={shared.cardBody}>
        {/* Heading */}
        <h1 className={shared.questionTitle}>
          What area do you <span className={shared.accentWord}>need guidance</span> in?
        </h1>

        <p className={shared.questionSubtitle}>
          Select the domain where you want to connect with verified experts.
        </p>

        {/* Category Grid */}
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

        <form className={styles.customInputWrapper} onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Add custom category..."
            value={newCategoryInput}
            onChange={(e) => setNewCategoryInput(e.target.value)}
            className={styles.customInput}
          />
          <button
            type="submit"
            className={styles.customInputBtn}
            aria-label="Add custom category"
          >
            <Plus size={16} />
          </button>
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
            <strong>Domain selected!</strong>
            <small>This narrows down the ideal pool of matches.</small>
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
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
