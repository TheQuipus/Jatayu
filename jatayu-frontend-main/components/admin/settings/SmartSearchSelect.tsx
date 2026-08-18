"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import styles from "./SmartSearchSelect.module.css";

export type SmartOption = {
  value: string;
  label: string;
};

type SmartSearchSelectProps = {
  value: string;
  options: SmartOption[];
  onChange: (newValue: string) => void;
  placeholder?: string;
};

export default function SmartSearchSelect({
  value,
  options,
  onChange,
  placeholder = "Select or search provider...",
}: SmartSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [customOptions, setCustomOptions] = useState<SmartOption[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

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
  };

  const handleAddCustom = (inputVal: string) => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    const newVal = trimmed.toLowerCase().replace(/\s+/g, "_");
    const newOpt = { value: newVal, label: trimmed };

    setCustomOptions((prev) => [...prev, newOpt]);
    onChange(newVal);
    setIsOpen(false);
    setIsSearching(false);
    setSearch(trimmed);
  };

  const displayValue = isSearching ? search : selectedOption?.label || value || "";

  return (
    <div className={styles.smartSelectContainer} ref={containerRef}>
      <div className={`${styles.smartInputWrapper} ${isOpen ? styles.smartInputWrapperOpen : ""}`}>
        <Search size={16} className={styles.smartSearchIconLeft} />
        <input
          type="text"
          className={styles.smartInput}
          placeholder={placeholder}
          value={displayValue}
          onFocus={() => {
            setIsOpen(true);
            setIsSearching(true);
            setSearch(selectedOption?.label || value || "");
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsSearching(true);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (!hasExactMatch && search.trim()) {
                handleAddCustom(search.trim());
              } else if (filteredOptions.length > 0) {
                handleSelect(filteredOptions[0].value);
              }
            }
          }}
        />
        <button
          type="button"
          className={styles.smartChevronBtn}
          onClick={() => {
            setIsOpen((prev) => !prev);
            if (!isOpen) {
              setIsSearching(true);
              setSearch(selectedOption?.label || value || "");
            }
          }}
          tabIndex={-1}
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
                Provider: <strong>"{search.trim()}"</strong>
              </span>
              <ContinueButton
                label="Add"
                showArrow={false}
                className={styles.compactAddBtn}
                onClick={() => handleAddCustom(search.trim())}
              />
            </div>
          ) : null}

          <ul className={styles.smartOptionsList}>
            {filteredOptions.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  className={`${styles.smartOptionItem} ${
                    opt.value === value ? styles.smartOptionItemActive : ""
                  }`}
                  onClick={() => handleSelect(opt.value)}
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
    </div>
  );
}
