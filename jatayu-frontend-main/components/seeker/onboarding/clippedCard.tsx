import { Check } from "lucide-react";
import styles from "./clippedCard.module.css";

export const CLIP_PATH_D =
  "M0,0.086 L0.018,0 H0.676 L0.696,0.086 H0.978 L1,0.311 V0.743 L0.984,0.839 L0.955,0.845 L0.9,1 H0 V0.086 Z";

export function ClipPathDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute", pointerEvents: "none" }}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="custom-clip" clipPathUnits="objectBoundingBox">
          <path d={CLIP_PATH_D} fillOpacity="0.05" strokeOpacity="0.1" />
        </clipPath>
      </defs>
    </svg>
  );
}

type ClippedCardBorderProps = {
  isSelected: boolean;
  theme?: "dark" | "light";
};

export function ClippedCardBorder({ isSelected, theme = "dark" }: ClippedCardBorderProps) {
  const stroke = isSelected ? "#E53B17" : theme === "light" ? "rgba(30, 30, 30, 0.12)" : "#FFFFFF";
  const strokeOpacity = isSelected ? 1 : theme === "light" ? 1 : 0.08;

  return (
    <svg
      className={styles.cardBorderSvg}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={CLIP_PATH_D}
        fill="none"
        stroke={stroke}
        strokeOpacity={strokeOpacity}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

type SelectionCheckboxProps = {
  isSelected: boolean;
  compact?: boolean;
};

export function SelectionCheckbox({ isSelected, compact = false }: SelectionCheckboxProps) {
  return (
    <div
      className={`${styles.selectionCheckbox} ${
        compact ? styles.selectionCheckboxCompact : ""
      } ${isSelected ? styles.selectionCheckboxSelected : ""}`}
      aria-hidden="true"
    >
      {isSelected && <Check size={compact ? 8 : 10} strokeWidth={3} />}
    </div>
  );
}
