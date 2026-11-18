
"use client";

import React from "react";
import styles from "./TonePillButton.module.css";

type TonePillButtonProps = {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
  selected?: boolean;
  disabled?: boolean;
  className?: string;
};

export default function TonePillButton({
  label,
  onClick,
  type = "button",
  selected = false,
  disabled = false,
  className,
}: TonePillButtonProps) {
  return (
    <button
      type={type}
      className={`${styles.tonePill} ${
        selected ? styles.selected : ""
      } ${className ?? ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
    >
      <span className={styles.labelText}>
        <span className={styles.labelTrack}>
          <span className={styles.labelUp}>{label}</span>
          <span className={styles.labelUp}>{label}</span>
        </span>
      </span>
    </button>
  );
}
