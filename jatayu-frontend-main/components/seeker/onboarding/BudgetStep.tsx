"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import shared from "./onboarding.shared.module.css";
import styles from "./BudgetStep.module.css";

type BudgetOption = {
  id: string;
  title: string;
  emoji: string;
  expertsCount: string;
  minPrice: number;
  maxPrice: number;
  priceText: string;
  desc: string;
};

const budgetOptions: BudgetOption[] = [
  {
    id: "budget",
    title: "Budget-Friendly",
    emoji: "💚",
    expertsCount: "1,240",
    minPrice: 10,
    maxPrice: 30,
    priceText: "$10–$30",
    desc: "Great for quick guidance, Q&A, single sessions",
  },
  {
    id: "standard",
    title: "Standard",
    emoji: "💛",
    expertsCount: "3,510",
    minPrice: 31,
    maxPrice: 80,
    priceText: "$30–$80",
    desc: "Professional advice, mid-tier expertise",
  },
  {
    id: "premium",
    title: "Premium",
    emoji: "🔶",
    expertsCount: "2,180",
    minPrice: 81,
    maxPrice: 200,
    priceText: "$80–$200",
    desc: "Senior experts, specialized knowledge",
  },
  {
    id: "elite",
    title: "Elite",
    emoji: "💎",
    expertsCount: "450",
    minPrice: 201,
    maxPrice: 500,
    priceText: "$200+",
    desc: "Top 1% experts, executive-level guidance",
  },
];

type BudgetStepProps = {
  userName: string;
  selectedBudget: string; // id of option
  onSelectBudget: (id: string) => void;
  budgetValue: number;
  onChangeBudgetValue: (val: number) => void;
  onBack: () => void;
  onContinue: () => void;
};

export default function BudgetStep({
  userName,
  selectedBudget,
  onSelectBudget,
  budgetValue,
  onChangeBudgetValue,
  onBack,
  onContinue,
}: BudgetStepProps) {
  // Sync the card highlight state dynamically when slider changes
  useEffect(() => {
    let matchedId = "standard";
    if (budgetValue <= 30) {
      matchedId = "budget";
    } else if (budgetValue > 30 && budgetValue <= 80) {
      matchedId = "standard";
    } else if (budgetValue > 80 && budgetValue <= 200) {
      matchedId = "premium";
    } else {
      matchedId = "elite";
    }

    if (matchedId !== selectedBudget) {
      onSelectBudget(matchedId);
    }
  }, [budgetValue, selectedBudget, onSelectBudget]);

  const handleCardClick = (opt: BudgetOption) => {
    onSelectBudget(opt.id);
    // Move slider to default values for specific ranges
    if (opt.id === "budget") {
      onChangeBudgetValue(20);
    } else if (opt.id === "standard") {
      onChangeBudgetValue(50);
    } else if (opt.id === "premium") {
      onChangeBudgetValue(140);
    } else if (opt.id === "elite") {
      onChangeBudgetValue(350);
    }
  };

  const getPercentage = () => {
    // Math to position progress bar
    const min = 10;
    const max = 500;
    return ((budgetValue - min) / (max - min)) * 100;
  };

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
          <div className={shared.stepPill}>
            <span>Step 9 of 12 · Budget</span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className={shared.progressContainer}>
          <div className={shared.progressTextRow}>
            <span>Matching Progress</span>
            <span>90%</span>
          </div>
          <div className={shared.progressBarBg}>
            <div className={shared.progressBarFill} style={{ width: "90%" }} />
          </div>
        </div>
      </div>

      <div className={shared.cardBody}>
        {/* Heading */}
        <h1 className={shared.questionTitle}>
          What's your <span className={shared.accentWord}>budget comfort</span>?
        </h1>

        <p className={shared.questionSubtitle}>
          Be honest — we have verified experts across all price ranges. No judgment here.
        </p>

        {/* 2x2 Budget Options Grid */}
        <div className={styles.budgetGrid}>
          {budgetOptions.map((opt) => {
            const isSelected = selectedBudget === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleCardClick(opt)}
                className={`${styles.budgetCard} ${
                  isSelected ? styles.budgetCardSelected : ""
                }`}
              >
                {/* Check Badge Top Right */}
                {isSelected && (
                  <div className={styles.checkBadge}>
                    <Check size={12} strokeWidth={3} className={styles.checkIcon} />
                  </div>
                )}

                {/* Top Row: Icon & Expert count */}
                <div className={styles.cardHeaderRow}>
                  <span className={styles.emoji}>{opt.emoji}</span>
                  <span className={styles.expertsBadge}>
                    {opt.expertsCount} EXPERTS
                  </span>
                </div>

                {/* Info Text block */}
                <div className={styles.textWrap}>
                  <h3 className={styles.cardTitle}>{opt.title}</h3>
                  <div className={styles.priceRow}>
                    <span className={styles.priceValue}>{opt.priceText}</span>
                    <span className={styles.priceLabel}> / session</span>
                  </div>
                  <p className={styles.cardDesc}>{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Fine-tune Budget Slider */}
        <div className={styles.sliderContainer}>
          <div className={styles.sliderHeaderRow}>
            <span className={styles.sliderTitle}>FINE-TUNE BUDGET</span>
            <div className={styles.sliderValueWrap}>
              <span className={styles.sliderValue}>${budgetValue}</span>
              <span className={styles.sliderUnit}> / session</span>
            </div>
          </div>

          <div className={styles.sliderTrackWrapper}>
            <input
              type="range"
              min="10"
              max="500"
              step="5"
              value={budgetValue}
              onChange={(e) => onChangeBudgetValue(Number(e.target.value))}
              className={styles.rangeInput}
              style={{
                background: `linear-gradient(to right, #E9681E 0%, #E9681E ${getPercentage()}%, rgba(255, 255, 255, 0.08) ${getPercentage()}%, rgba(255, 255, 255, 0.08) 100%)`,
              }}
            />
            
            {/* Tick Marks */}
            <div className={styles.tickLabelRow}>
              <span>$10</span>
              <span>$100</span>
              <span>$200</span>
              <span>$300</span>
              <span>$400</span>
              <span>$500+</span>
            </div>
          </div>
        </div>
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
            <strong>Secure budget!</strong>
            <small>You will only see experts within this price tier.</small>
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
            disabled={!selectedBudget}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
