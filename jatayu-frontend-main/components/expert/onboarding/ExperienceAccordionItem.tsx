"use client";

import Image from "next/image";
import { X } from "lucide-react";
import styles from "./ExperienceStep.module.css";

type ExperienceAccordionItemProps = {
  summary: string;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove?: () => void;
  canRemove?: boolean;
  panelClassName?: string;
  itemClassName?: string;
  icon?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
};

export default function ExperienceAccordionItem({
  summary,
  index,
  isExpanded,
  onToggle,
  onRemove,
  canRemove = false,
  panelClassName,
  itemClassName,
  icon,
  required = false,
  children,
}: ExperienceAccordionItemProps) {
  return (
    <li
      className={`${styles.accItem} ${itemClassName ?? ""} ${
        isExpanded ? styles.accItemExpanded : ""
      }`}
    >
      <div className={styles.accMain}>
        <div className={styles.accTopRow}>
          <button
            type="button"
            className={styles.accHeader}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? `Collapse ${summary}` : `Expand ${summary}`}
            onClick={onToggle}
          >
            <span className={styles.accTitle}>
              {icon ? <span className={styles.accTitleIcon}>{icon}</span> : null}
              <span className={styles.accTitleText}>
                {summary}
                {required ? <span className={styles.requiredMark}> *</span> : null}
              </span>
            </span>
            <span className={styles.accPlus} aria-hidden="true">
              <Image src="/assets/plusicon-light.svg" alt="" width={32} height={32} />
            </span>
          </button>
          {canRemove && onRemove ? (
            <button
              type="button"
              className={styles.accDeleteBtn}
              aria-label={`Remove ${summary}`}
              onClick={onRemove}
            >
              <X size={14} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className={`${styles.accPanel} ${panelClassName ?? ""}`}>
          <div className={styles.accPanelInner}>{children}</div>
        </div>
      </div>
    </li>
  );
}
