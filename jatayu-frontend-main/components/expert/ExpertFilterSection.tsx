"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./Expert.module.css";

type FilterOption = {
  value: string;
  label: string;
};

type ExpertFilterSectionProps = {
  filterKey: string;
  placeholder: string;
  clearLabel?: string;
  options: FilterOption[];
  selectedValues: string[];
  onToggleValue: (value: string) => void;
  onClear: () => void;
  defaultOpen?: boolean;
};

export default function ExpertFilterSection({
  placeholder,
  clearLabel,
  options,
  selectedValues,
  onToggleValue,
  onClear,
  defaultOpen = false,
}: ExpertFilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const selectionCount = selectedValues.length;
  const contentId = useId();
  const headerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      headerRef.current?.focus();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <div className={styles.filterSection}>
      <button
        ref={headerRef}
        type="button"
        className={styles.filterSectionHeader}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span className={styles.filterSectionTitle}>
          {placeholder}
          {selectionCount > 0 && (
            <span className={styles.filterSelectionBadge}>
              {selectionCount}
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={`${styles.filterSectionChevron} ${
            isOpen ? styles.filterSectionChevronOpen : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <div
        id={contentId}
        className={`${styles.filterSectionContent} ${
          isOpen ? styles.filterSectionContentOpen : ""
        }`}
      >
        <div className={styles.filterSectionContentInner}>
          <ul className={styles.filterOptionList}>
            {clearLabel && (
              <li>
                <label className={styles.filterOptionItem}>
                  <input
                    type="checkbox"
                    className={styles.filterCheckboxInput}
                    checked={selectionCount === 0}
                    onChange={onClear}
                  />
                  <span className={styles.filterCheckboxCustom} aria-hidden="true">
                    {selectionCount === 0 && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span
                    className={`${styles.filterOptionLabel} ${
                      selectionCount === 0 ? styles.filterOptionLabelSelected : ""
                    }`}
                  >
                    {clearLabel}
                  </span>
                </label>
              </li>
            )}
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);

              return (
                <li key={option.value}>
                  <label className={styles.filterOptionItem}>
                    <input
                      type="checkbox"
                      className={styles.filterCheckboxInput}
                      checked={isSelected}
                      onChange={() => onToggleValue(option.value)}
                    />
                    <span className={styles.filterCheckboxCustom} aria-hidden="true">
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span
                      className={`${styles.filterOptionLabel} ${
                        isSelected ? styles.filterOptionLabelSelected : ""
                      }`}
                    >
                      {option.label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
