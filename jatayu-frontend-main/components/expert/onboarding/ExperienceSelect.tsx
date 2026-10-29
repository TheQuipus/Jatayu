"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getExperienceSelectMenuPosition,
  shouldScrollExperienceSelectAnchor,
} from "./experienceSelectPosition";
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
  required?: boolean;
  error?: string;
  "aria-label"?: string;
};

export default function ExperienceSelect({
  id,
  value = "",
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  required = false,
  error,
  "aria-label": ariaLabel,
}: ExperienceSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const programmaticScrollAnchorRef = useRef<{ top: number; bottom: number } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);

  const selectedOption = options.find((option) => option.value === value);
  const selectedOptionIndex = options.findIndex((option) => option.value === value);
  const activeIndex = options.length > 0
    ? Math.min(activeOptionIndex, options.length - 1)
    : -1;
  const displayLabel = selectedOption?.label ?? placeholder;

  const updatePosition = () => {
    if (!triggerRef.current || !menuRef.current) return;
    let rect = triggerRef.current.getBoundingClientRect();
    if (
      shouldScrollExperienceSelectAnchor(rect, {
        width: window.innerWidth,
        height: window.innerHeight,
      })
    ) {
      triggerRef.current.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: "instant",
      });
      rect = triggerRef.current.getBoundingClientRect();
      programmaticScrollAnchorRef.current = { top: rect.top, bottom: rect.bottom };
    }
    const position = getExperienceSelectMenuPosition(
      rect,
      { width: window.innerWidth, height: window.innerHeight },
      menuRef.current?.scrollHeight ?? 220,
    );
    setMenuStyle({
      position: "fixed",
      left: position.left,
      width: position.width,
      maxHeight: position.maxHeight,
      top: position.top,
      zIndex: 9999,
    });
  };

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !menuRef.current) return;

    updatePosition();
    const handleScroll = (event: Event) => {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      const rect = triggerRef.current?.getBoundingClientRect();
      const programmaticAnchor = programmaticScrollAnchorRef.current;
      if (
        rect &&
        programmaticAnchor &&
        Math.abs(rect.top - programmaticAnchor.top) < 1 &&
        Math.abs(rect.bottom - programmaticAnchor.bottom) < 1
      ) {
        programmaticScrollAnchorRef.current = null;
        return;
      }
      programmaticScrollAnchorRef.current = null;
      setMenuStyle(null);
      setIsOpen(false);
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", handleScroll, true);
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
    setMenuStyle(null);
    programmaticScrollAnchorRef.current = null;
    if (!isOpen) {
      setActiveOptionIndex(selectedOptionIndex >= 0 ? selectedOptionIndex : 0);
    }
    setIsOpen(!isOpen);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      setMenuStyle(null);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!options.length) return;
      if (!isOpen) {
        setMenuStyle(null);
        setIsOpen(true);
        setActiveOptionIndex(selectedOptionIndex >= 0 ? selectedOptionIndex : 0);
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      const startingIndex = activeIndex < 0 ? 0 : activeIndex;
      setActiveOptionIndex(Math.max(0, Math.min(options.length - 1, startingIndex + step)));
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      if (!isOpen || !options.length) return;
      event.preventDefault();
      setActiveOptionIndex(event.key === "Home" ? 0 : options.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isOpen && activeIndex >= 0) {
        handleSelect(options[activeIndex].value);
      } else {
        handleToggle();
      }
    }
  };

  return (
    <div ref={rootRef} className={styles.selectRoot}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`${styles.selectField} ${
          value ? styles.selectFieldFilled : styles.selectFieldPlaceholder
        } ${isOpen ? styles.selectFieldOpen : ""} ${error ? styles.selectFieldError : ""}`}
        disabled={disabled}
        role="combobox"
        aria-required={required ? true : undefined}
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        aria-describedby={error && id ? `${id}-error` : undefined}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={isOpen && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={styles.selectFieldValue}>{displayLabel}</span>
      </button>
      {error && id ? (
        <span
          id={`${id}-error`}
          className={`${styles.fieldErrorText} ${styles.selectErrorText}`}
          role="alert"
        >
          {error}
        </span>
      ) : null}

      {isOpen &&
        createPortal(
          <ul
            ref={menuRef}
            id={listboxId}
            className={styles.selectMenu}
            style={menuStyle ?? { visibility: "hidden" }}
            role="listbox"
            aria-labelledby={id}
            aria-label={id ? undefined : ariaLabel || placeholder}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value || "__placeholder"}
                  role="presentation"
                >
                  <button
                    type="button"
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={-1}
                    onMouseDown={(event) => event.preventDefault()}
                    className={`${styles.selectMenuItem} ${
                      isSelected ? styles.selectMenuItemSelected : ""
                    } ${index === activeIndex ? styles.selectMenuItemActive : ""}`}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setActiveOptionIndex(index)}
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
