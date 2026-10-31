"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import styles from "./SmartSearchSelect.module.css";

export type SmartOption = {
  value: string;
  label: string;
};

type SmartSearchSelectProps = {
  id?: string;
  value: string;
  options: SmartOption[];
  onChange: (newValue: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  disabled?: boolean;
  error?: string;
  customValueTransform?: (label: string) => string;
};

export default function SmartSearchSelect({
  id,
  value,
  options,
  onChange,
  placeholder = "Select or search provider...",
  "aria-label": ariaLabel,
  disabled = false,
  error,
  customValueTransform,
}: SmartSearchSelectProps) {
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [customOptions, setCustomOptions] = useState<SmartOption[]>([]);
  const [activeOptionIndex, setActiveOptionIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suppressFocusOpenRef = useRef(false);

  const allOptions = useMemo(() => {
    const map = new Map<string, SmartOption>();
    options.forEach((opt) => map.set(opt.value, opt));
    customOptions.forEach((opt) => map.set(opt.value, opt));

    if (value && !map.has(value)) {
      const formattedLabel = value.charAt(0).toUpperCase() + value.slice(1);
      map.set(value, { value, label: formattedLabel });
    }

    return Array.from(map.values());
  }, [options, customOptions, value]);

  const selectedOption = allOptions.find((opt) => opt.value === value);

  const filteredOptions = useMemo(() => {
    if (!isSearching || !search.trim()) return allOptions;
    const query = search.toLowerCase();
    return allOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query)
    );
  }, [allOptions, search, isSearching]);

  const hasExactMatch = useMemo(() => {
    if (!isSearching || !search.trim()) return true;
    const query = search.trim().toLowerCase();
    return allOptions.some(
      (opt) =>
        opt.label.toLowerCase() === query || opt.value.toLowerCase() === query
    );
  }, [allOptions, search, isSearching]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsSearching(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setIsSearching(false);
    const sel = allOptions.find((opt) => opt.value === val);
    setSearch(sel?.label || val);
    requestAnimationFrame(() => {
      suppressFocusOpenRef.current = true;
      inputRef.current?.focus();
      suppressFocusOpenRef.current = false;
    });
  };

  const handleAddCustom = (inputVal: string) => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    const newVal = customValueTransform
      ? customValueTransform(trimmed)
      : trimmed.toLowerCase().replace(/\s+/g, "_");
    const newOpt = { value: newVal, label: trimmed };

    setCustomOptions((prev) => [...prev, newOpt]);
    onChange(newVal);
    setIsOpen(false);
    setIsSearching(false);
    setSearch(trimmed);
    requestAnimationFrame(() => {
      suppressFocusOpenRef.current = true;
      inputRef.current?.focus();
      suppressFocusOpenRef.current = false;
    });
  };

  const displayValue = isSearching ? search : selectedOption?.label || value || "";
  const activeIndex = filteredOptions.length > 0
    ? Math.min(activeOptionIndex, filteredOptions.length - 1)
    : -1;

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      setIsSearching(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setIsSearching(true);
        setSearch(selectedOption?.label || value || "");
      }
      if (!filteredOptions.length) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = activeIndex < 0
        ? (event.key === "ArrowDown" ? 0 : filteredOptions.length - 1)
        : Math.max(0, Math.min(filteredOptions.length - 1, activeIndex + step));
      setActiveOptionIndex(nextIndex);
      return;
    }

    if ((event.key === "Home" || event.key === "End") && isOpen && filteredOptions.length) {
      event.preventDefault();
      setActiveOptionIndex(event.key === "Home" ? 0 : filteredOptions.length - 1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (!hasExactMatch && search.trim()) {
        handleAddCustom(search.trim());
      } else if (activeIndex >= 0) {
        handleSelect(filteredOptions[activeIndex].value);
      } else if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0].value);
      }
    }
  };

  return (
    <div className={`${styles.smartSelectContainer} ${error ? styles.smartSelectContainerError : ""}`} ref={containerRef}>
      <div className={`${styles.smartInputWrapper} ${isOpen ? styles.smartInputWrapperOpen : ""}`}>
        <Search size={16} className={styles.smartSearchIconLeft} />
        <input
          ref={inputRef}
          id={id}
          type="text"
          className={styles.smartInput}
          placeholder={placeholder}
          value={displayValue}
          disabled={disabled}
          role="combobox"
          aria-label={ariaLabel || placeholder}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={isOpen && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${listboxId}-error` : undefined}
          onFocus={() => {
            if (suppressFocusOpenRef.current) return;
            setActiveOptionIndex(-1);
            setIsOpen(true);
            setIsSearching(true);
            setSearch(selectedOption?.label || value || "");
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            setActiveOptionIndex(-1);
            setIsSearching(true);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleInputKeyDown}
        />
        <button
          type="button"
          className={styles.smartChevronBtn}
          aria-label="Toggle options"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listboxId : undefined}
          disabled={disabled}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              setIsSearching(false);
            } else {
              setActiveOptionIndex(0);
              setIsOpen(true);
              setIsSearching(true);
              setSearch(selectedOption?.label || value || "");
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && isOpen) {
              event.preventDefault();
              setIsOpen(false);
              setIsSearching(false);
            }
          }}
        >
          <ChevronDown
            size={16}
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </button>
      </div>

      {isOpen && (
        <div className={styles.smartDropdownMenu}>
          {!hasExactMatch && search.trim() ? (
            <div className={styles.smartAddBtnContainer}>
              <span className={styles.smartAddText}>
                Provider: <strong>&quot;{search.trim()}&quot;</strong>
              </span>
              <ContinueButton
                label="Add"
                showArrow={false}
                className={styles.compactAddBtn}
                onClick={() => handleAddCustom(search.trim())}
              />
            </div>
          ) : null}

          <ul id={listboxId} className={styles.smartOptionsList} role="listbox" aria-label={ariaLabel || placeholder}>
            {filteredOptions.map((opt, index) => (
              <li key={opt.value}>
                <button
                  type="button"
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={opt.value === value}
                  className={`${styles.smartOptionItem} ${
                    opt.value === value ? styles.smartOptionItemActive : ""
                  } ${index === activeIndex ? styles.smartOptionItemFocused : ""}`}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setActiveOptionIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <span>{opt.label}</span>
                </button>
              </li>
            ))}

            {filteredOptions.length === 0 && hasExactMatch && (
              <li className={styles.smartNoOptions}>
                No matching provider found
              </li>
            )}
          </ul>
        </div>
      )}
      {error ? <p id={`${listboxId}-error`} className={styles.smartSelectError} role="alert">{error}</p> : null}
    </div>
  );
}
