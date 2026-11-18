"use client";

import React from "react";
import styles from "./TextButton.module.css";

type TextButtonProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
};

export default function TextButton({
  label,
  onClick,
  disabled = false,
  type = "button",
  className,
}: TextButtonProps) {
  return (
    <button
      type={type}
      className={`${styles.textBtn} ${className ?? ""}`}
      onClick={onClick}
      disabled={disabled}
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