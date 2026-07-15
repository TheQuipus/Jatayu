"use client";

import { ChevronDown } from "lucide-react";
import styles from "./Expert.module.css";

export type ExpertFilterKey =
  | "topic"
  | "language"
  | "rating"
  | "price"
  | "availability";

type FilterOption = {
  value: string;
  label: string;
};

type ExpertFilterDropdownProps = {
  filterKey: ExpertFilterKey;
  triggerId: string;
  placeholder: string;
  clearLabel: string;
  options: FilterOption[];
  selectedValues: string[];
  openDropdown: ExpertFilterKey | null;
  onToggle: (key: ExpertFilterKey) => void;
  onToggleValue: (value: string) => void;
  onClear: () => void;
};

export default function ExpertFilterDropdown({
  filterKey,
  triggerId,
  placeholder,
  clearLabel,
  options,
  selectedValues,
  openDropdown,
  onToggle,
  onToggleValue,
  onClear,
}: ExpertFilterDropdownProps) {
  const isOpen = openDropdown === filterKey;
  const selectionCount = selectedValues.length;
  const listboxId = `${triggerId}-listbox`;

  return (
    <div className={`${styles.topicDropdown} ${isOpen ? styles.topicDropdownOpen : ""}`}>
      <button
        type="button"
        id={triggerId}
        className={`${styles.topicPill} ${styles.topicDropdownTrigger} ${
          selectionCount > 0 ? styles.topicPillActive : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => onToggle(filterKey)}
      >
        <span>{placeholder}</span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={styles.topicDropdownChevron}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <ul
          id={listboxId}
          className={styles.topicDropdownMenu}
          role="listbox"
          aria-multiselectable="true"
          aria-labelledby={triggerId}
        >
          <li role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={selectionCount === 0}
              className={`${styles.topicPill} ${styles.topicDropdownOption} ${
                selectionCount === 0 ? styles.topicPillActive : ""
              }`}
              onClick={onClear}
            >
              {clearLabel}
            </button>
          </li>
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);

            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.topicPill} ${styles.topicDropdownOption} ${
                    isSelected ? styles.topicPillActive : ""
                  }`}
                  onClick={() => onToggleValue(option.value)}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
