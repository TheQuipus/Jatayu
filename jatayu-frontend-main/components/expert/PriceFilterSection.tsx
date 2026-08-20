"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import styles from "./Expert.module.css";

type PriceFilterSectionProps = {
  minPrice: number;
  maxPrice: number;
  absoluteMin?: number;
  absoluteMax?: number;
  onChange: (min: number, max: number) => void;
  defaultOpen?: boolean;
};

export default function PriceFilterSection({
  minPrice,
  maxPrice,
  absoluteMin = 0,
  absoluteMax = 300000,
  onChange,
  defaultOpen = true,
}: PriceFilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isFiltered = minPrice > absoluteMin || maxPrice < absoluteMax;

  const range = absoluteMax - absoluteMin;
  const leftPercent = range > 0 ? Math.max(0, Math.min(100, ((minPrice - absoluteMin) / range) * 100)) : 0;
  const rightPercent = range > 0 ? Math.max(0, Math.min(100, ((absoluteMax - maxPrice) / range) * 100)) : 0;

  return (
    <div className={styles.filterSection}>
      <button
        type="button"
        className={styles.filterSectionHeader}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className={styles.filterSectionTitle}>
          Price
          {isFiltered && <span className={styles.filterSelectionBadge}>1</span>}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={`${styles.filterSectionChevron} ${isOpen ? styles.filterSectionChevronOpen : ""
            }`}
          aria-hidden="true"
        />
      </button>

      <div
        className={`${styles.filterSectionContent} ${isOpen ? styles.filterSectionContentOpen : ""
          }`}
      >
        <div className={styles.filterSectionContentInner}>
          <div className={styles.priceSliderBox}>
            <div className={styles.priceValueText}>
              ₹{minPrice.toLocaleString("en-IN")} – ₹{maxPrice.toLocaleString("en-IN")}
            </div>

            <div className={styles.sliderTrackWrapper}>
              <div className={styles.sliderTrackBg} />
              <div
                className={styles.sliderTrackHighlight}
                style={{
                  left: `${leftPercent}%`,
                  right: `${rightPercent}%`,
                }}
              />
              <input
                type="range"
                min={absoluteMin}
                max={absoluteMax}
                step={50}
                value={minPrice}
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), maxPrice - 50);
                  onChange(val, maxPrice);
                }}
                className={`${styles.rangeInput} ${styles.rangeInputMin}`}
                style={{ zIndex: minPrice > absoluteMax - 200 ? 5 : 3 }}
                aria-label="Minimum price"
              />
              <input
                type="range"
                min={absoluteMin}
                max={absoluteMax}
                step={50}
                value={maxPrice}
                onChange={(e) => {
                  const val = Math.max(Number(e.target.value), minPrice + 50);
                  onChange(minPrice, val);
                }}
                className={`${styles.rangeInput} ${styles.rangeInputMax}`}
                style={{ zIndex: 4 }}
                aria-label="Maximum price"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
