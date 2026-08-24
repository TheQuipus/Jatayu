"use client";

import Image from "next/image";
import { ArrowRight, Wallet, Star, Crown, Gem } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import MatchingProgress from "./MatchingProgress";
import type { ProgressCompletion, ProgressStepKey } from "./MatchingProgress";
import ContinueButton from "@/components/ui/ContinueButton";
import shared from "./onboarding.shared.module.css";
import styles from "./BudgetStep.module.css";
import cards from "./preferenceCard.shared.module.css";
import { ClipPathDefs, ClippedCardBorder, SelectionCheckbox } from "./clippedCard";
import clipped from "./clippedCard.module.css";
type BudgetOption = {
  id: string;
  title: string;
  icon: LucideIcon;
  minPrice: number;
  maxPrice: number;
  priceText: string;
  desc: string;
};

const budgetOptions: BudgetOption[] = [
  {
    id: "budget",
    title: "Budget-Friendly",
    icon: Wallet,
    minPrice: 49,
    maxPrice: 2500,
    priceText: "₹49–₹2,500",
    desc: "Great for quick guidance, Q&A, single sessions",
  },
  {
    id: "standard",
    title: "Standard",
    icon: Star,
    minPrice: 2501,
    maxPrice: 8000,
    priceText: "₹2,500–₹8,000",
    desc: "Professional advice, mid-tier expertise",
  },
  {
    id: "premium",
    title: "Premium",
    icon: Crown,
    minPrice: 8001,
    maxPrice: 20000,
    priceText: "₹8,000–₹20,000",
    desc: "Senior experts, specialized knowledge",
  },
  {
    id: "elite",
    title: "Elite",
    icon: Gem,
    minPrice: 20001,
    maxPrice: 25000,
    priceText: "₹20,000+",
    desc: "Top 1% experts, executive-level guidance",
  },
];

type BudgetStepProps = {
  userName: string;
  selectedBudget: string; // id of option
  onSelectBudget: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
  progressCompletion: ProgressCompletion;
  onProgressStepClick: (step: ProgressStepKey) => void;
};

export default function BudgetStep({
  userName,
  selectedBudget,
  onSelectBudget,
  onBack,
  onContinue,
  progressCompletion,
  onProgressStepClick,
}: BudgetStepProps) {
  const handleCardClick = (opt: BudgetOption) => {
    onSelectBudget(selectedBudget === opt.id ? "" : opt.id);
  };

  return (
    <section className={shared.card}>
      <ClipPathDefs />
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
        </div>

        <MatchingProgress
          currentStep="budget"
          completion={progressCompletion}
          onStepClick={onProgressStepClick}
        />
      </div>

      <div className={shared.cardBody}>
        <h1 className={`${shared.questionTitle} ${styles.questionTitle}`}>
          What&apos;s your <span className={shared.accentWord}>budget comfort?</span>
        </h1>

        <p className={`${shared.questionSubtitle} ${styles.questionSubtitle}`}>
          Be honest — we have verified experts across all price ranges. No judgment here.
        </p>

        <div className={cards.optionsSection}>
          <div className={cards.optionsGrid}>
            {budgetOptions.map((opt) => {
              const IconComponent = opt.icon;
              const isSelected = selectedBudget === opt.id;

              return (
                <div
                  key={opt.id}
                  className={`${cards.optionCard} ${clipped.clippedCard} ${isSelected ? `${cards.optionCardSelected} ${clipped.clippedCardSelected}` : ""
                    }`}
                >
                  <ClippedCardBorder isSelected={isSelected} />
                  <SelectionCheckbox isSelected={isSelected} />

                  <button
                    type="button"
                    onClick={() => handleCardClick(opt)}
                    className={cards.optionCardSelect}
                    aria-pressed={isSelected}
                  >
                    <div className={cards.optionCardInner}>
                      <div className={cards.optionIconCircle}>
                        <IconComponent className={cards.optionIcon} />
                      </div>
                      <div className={cards.optionInfo}>
                        <h3 className={`${cards.optionTitle} ${styles.optionTitle}`}>{opt.title}</h3>
                        <div className={styles.priceRow}>
                          <span className={styles.priceValue}>{opt.priceText}</span>
                          <span className={styles.priceLabel}>/min</span>
                        </div>
                        <p className={cards.optionDesc}>{opt.desc}</p>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
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
          <button type="button" className={shared.textBtn} onClick={onContinue}>
            Skip
          </button>
          <ContinueButton onClick={onContinue} disabled={!selectedBudget} />
        </div>
      </div>
    </section>
  );
}
