"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./ExperienceStep.module.css";

export type ExperienceSelectOption = {
  value: string;
  label: string;
};

type ExperienceSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ExperienceSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

const MENU_MAX_HEIGHT = 220;

export default function ExperienceSelect({
  id,
  value = "",
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  "aria-label": ariaLabel,
}: ExperienceSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < MENU_MAX_HEIGHT && rect.top > MENU_MAX_HEIGHT;

    setMenuStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  };

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((open) => !open);
  };

  return (
    <div ref={rootRef} className={styles.selectRoot}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`${styles.selectField} ${
          value ? styles.selectFieldFilled : styles.selectFieldPlaceholder
        } ${isOpen ? styles.selectFieldOpen : ""}`}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        onClick={handleToggle}
      >
        <span className={styles.selectFieldValue}>{displayLabel}</span>
      </button>

      {isOpen &&
        createPortal(
          <ul
            ref={menuRef}
            id={listboxId}
            className={styles.selectMenu}
            style={menuStyle}
            role="listbox"
            aria-labelledby={id}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value || "__placeholder"} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`${styles.selectMenuItem} ${
                      isSelected ? styles.selectMenuItemSelected : ""
                    }`}
                    onClick={() => handleSelect(option.value)}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
}
