"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Plus } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import shared from "./onboarding.shared.module.css";
import styles from "./TopicsStep.module.css";

type TopicsStepProps = {
  userName: string;
  activeCategoryLabel: string;
  currentTopicsList: string[];
  selectedTopics: string[];
  onToggleTopic: (topic: string) => void;
  onAddCustomTopic: (topic: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export default function TopicsStep({
  userName,
  activeCategoryLabel,
  currentTopicsList,
  selectedTopics,
  onToggleTopic,
  onAddCustomTopic,
  onBack,
  onContinue,
}: TopicsStepProps) {
  const [newTopicInput, setNewTopicInput] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTopicInput.trim();
    if (!trimmed) return;
    onAddCustomTopic(trimmed);
    setNewTopicInput("");
  };

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
          <div className={shared.stepPill}>
            <span>Step 3 of 12 · Topics</span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className={shared.progressContainer}>
          <div className={shared.progressTextRow}>
            <span>Matching Progress</span>
            <span>30%</span>
          </div>
          <div className={shared.progressBarBg}>
            <div className={shared.progressBarFill} style={{ width: "30%" }} />
          </div>
        </div>
      </div>

      <div className={shared.cardBody}>
        {/* Heading */}
        <h1 className={shared.questionTitle}>
          What specific <span className={shared.accentWord}>topics</span> do you want advice on?
        </h1>

        <p className={shared.questionSubtitle}>
          Select up to 5 topics related to {activeCategoryLabel}. <br />This refines the type of experts we match you with.
        </p>

        {/* Counter Badge */}
        <div className={styles.selectedBadge}>
          Selected: {selectedTopics.length} / 5
        </div>

        {/* Topics Cluster */}
        <div className={styles.topicsCluster}>
          {currentTopicsList.map((topic) => {
            const isSelected = selectedTopics.includes(topic);

            return (
              <button
                key={topic}
                type="button"
                onClick={() => onToggleTopic(topic)}
                className={`${styles.topicPill} ${isSelected ? styles.topicPillSelected : ""}`}
              >
                {topic}
              </button>
            );
          })}
        </div>

        {/* Custom Topic Input */}
        <form className={styles.customInputWrapper} onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Add custom topic..."
            value={newTopicInput}
            onChange={(e) => setNewTopicInput(e.target.value)}
            className={styles.customInput}
          />
          <button
            type="submit"
            className={styles.customInputBtn}
            aria-label="Add custom topic"
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
            <strong>Select multiple topics!</strong>
            <small>Allows us to search wider expert skillsets.</small>
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
            disabled={selectedTopics.length === 0}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
