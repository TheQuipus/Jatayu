"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Select, {
  components as selectComponents,
  type ClassNamesConfig,
  type DropdownIndicatorProps,
  type ClearIndicatorProps,
  type MenuListProps,
  type OptionProps,
  type SingleValue,
  type StylesConfig,
  type InputActionMeta,
} from "react-select";
import { ChevronDown, Plus, X } from "lucide-react";
import {
  buildMergedOptions,
  DEFAULT_MAX_CUSTOM_OPTION_LENGTH,
  DEFAULT_MAX_CUSTOM_OPTIONS,
  DEFAULT_OTHER_OPTION_LABEL,
  validateAndCreateCustomOption,
  type DropdownFilterOption,
} from "@/lib/dropdownFilterHelpers";
import styles from "./DropdownFilter.module.css";

export type { DropdownFilterOption };

export interface DropdownFilterProps {
  id?: string;
  name?: string;
  label?: string;
  options: readonly DropdownFilterOption[];
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null, option: DropdownFilterOption | null) => void;
  onCreateOption?: (option: DropdownFilterOption) => void;
  placeholder?: string;
  variant?: "dark" | "light";
  size?: "default" | "compact";
  isSearchable?: boolean;
  isClearable?: boolean;
  /**
   * Sorts all dropdown options alphabetically A→Z (keeping "Other" at the bottom).
   * Defaults to true; set to false for chronological lists (e.g., months or years).
   */
  sortAlphabetically?: boolean;
  allowCustomOption?: boolean;
  otherOptionLabel?: string;
  customInputPlaceholder?: string;
  /**
   * When true (default), adding a custom option immediately selects it and closes the dropdown menu.
   * When false, adding a custom option keeps the dropdown menu open.
   */
  selectOnCreate?: boolean;
  maxCustomOptions?: number;
  maxCustomOptionLength?: number;
  customValueTransform?: (label: string) => string;
  validateCustomOption?: (label: string) => string | null;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  "aria-label"?: string;
}

interface DropdownOtherContextValue {
  variant: "dark" | "light";
  allowCustomOption: boolean;
  otherOptionLabel: string;
  customInputPlaceholder: string;
  maxCustomOptions: number;
  maxCustomOptionLength: number;
  customCount: number;
  isEditingOther: boolean;
  otherDraft: string;
  inlineFeedback: { type: "error" | "info"; text: string } | null;
  recentlyCreatedValue: string | null;
  otherInputRef: React.RefObject<HTMLInputElement | null>;
  menuListContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  onStartOtherEdit: () => void;
  onOtherDraftChange: (next: string) => void;
  onCommitOther: () => void;
  onCancelOtherEdit: () => void;
}

const DropdownOtherContext = createContext<DropdownOtherContextValue | null>(null);

/**
 * Module-scoped MenuList so react-select never unmounts/remounts the inline
 * "Other" input on keystrokes. Reads dynamic state via DropdownOtherContext.
 */
function DynamicMenuList(props: MenuListProps<DropdownFilterOption, false>) {
  const ctx = useContext(DropdownOtherContext);
  const otherRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ctx?.isEditingOther) return;
    const rafId = requestAnimationFrame(() => {
      ctx.otherInputRef.current?.focus();
      otherRowRef.current?.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(rafId);
  }, [ctx?.isEditingOther, ctx?.otherInputRef]);

  const setCombinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (ctx) {
        ctx.menuListContainerRef.current = node;
      }
      if (typeof props.innerRef === "function") {
        props.innerRef(node);
      } else if (props.innerRef && "current" in props.innerRef) {
        (props.innerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [ctx, props.innerRef],
  );

  const isDark = ctx?.variant !== "light";
  const isMaxReached = Boolean(ctx && ctx.customCount >= ctx.maxCustomOptions);
  const trimmedDraft = ctx?.otherDraft.trim() ?? "";

  return (
    <selectComponents.MenuList {...props} innerRef={setCombinedRef}>
      {props.children}

      {ctx?.allowCustomOption ? (
        <div
          ref={otherRowRef}
          className={`${styles.otherSection} ${
            isDark ? styles.otherSectionDark : styles.otherSectionLight
          }`}
          onMouseDown={(event) => {
            // Keep react-select from stealing focus back to its control input
            event.stopPropagation();
          }}
        >
          {isMaxReached && !ctx.isEditingOther ? (
            <div
              className={`${styles.maxReachedCaption} ${
                isDark ? styles.maxReachedDark : styles.maxReachedLight
              }`}
            >
              Custom option limit ({ctx.maxCustomOptions}) reached
            </div>
          ) : ctx.isEditingOther ? (
            <div
              className={`${styles.otherEditorRow} ${
                isDark ? styles.otherEditorRowDark : styles.otherEditorRowLight
              } ${
                ctx.inlineFeedback?.type === "error" ? styles.otherEditorRowError : ""
              }`}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <input
                ref={ctx.otherInputRef}
                type="text"
                value={ctx.otherDraft}
                maxLength={ctx.maxCustomOptionLength}
                placeholder={ctx.customInputPlaceholder}
                aria-label={`Add custom ${ctx.otherOptionLabel} option`}
                aria-invalid={ctx.inlineFeedback?.type === "error" ? true : undefined}
                enterKeyHint="done"
                autoComplete="off"
                className={`${styles.otherInput} ${
                  isDark ? styles.otherInputDark : styles.otherInputLight
                }`}
                onChange={(event) => ctx.onOtherDraftChange(event.target.value)}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === "Escape") {
                    event.preventDefault();
                    ctx.onCancelOtherEdit();
                    return;
                  }
                  if (event.key === "Enter") {
                    // Protect IME composition (e.g., Hindi/regional keyboards)
                    if (event.nativeEvent.isComposing || event.keyCode === 229) {
                      return;
                    }
                    event.preventDefault();
                    ctx.onCommitOther();
                  }
                }}
              />
              <button
                type="button"
                className={`${styles.otherAddBtn} ${
                  !isDark ? styles.otherAddBtnLight : ""
                }`}
                disabled={!trimmedDraft}
                aria-label="Add custom option"
                title="Add option"
                onMouseDown={(event) => {
                  // Prevent blur-before-click race condition on the inline input
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  ctx.onCommitOther();
                }}
              >
                <Plus size={15} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={`${styles.otherTriggerBtn} ${
                isDark ? styles.otherTriggerDark : styles.otherTriggerLight
              }`}
              onMouseDown={(event) => {
                // Prevent react-select from closing the menu on control blur
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                ctx.onStartOtherEdit();
              }}
            >
              <span>{ctx.otherOptionLabel}</span>
              <span className={styles.otherTriggerHint} aria-hidden="true">
                <Plus size={12} strokeWidth={2.2} />
                Add custom
              </span>
            </button>
          )}

          {ctx.inlineFeedback ? (
            <div
              role="status"
              aria-live="polite"
              className={`${styles.inlineFeedback} ${
                ctx.inlineFeedback.type === "error"
                  ? styles.inlineFeedbackError
                  : isDark
                    ? styles.inlineFeedbackInfoDark
                    : styles.inlineFeedbackInfoLight
              }`}
            >
              {ctx.inlineFeedback.text}
            </div>
          ) : null}
        </div>
      ) : null}
    </selectComponents.MenuList>
  );
}

function DynamicOption(props: OptionProps<DropdownFilterOption, false>) {
  const ctx = useContext(DropdownOtherContext);
  const optionElRef = useRef<HTMLDivElement | null>(null);
  const isJustCreated =
    Boolean(ctx?.recentlyCreatedValue) &&
    props.data.value === ctx?.recentlyCreatedValue;

  useEffect(() => {
    if (!isJustCreated) return;
    const rafId = requestAnimationFrame(() => {
      optionElRef.current?.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(rafId);
  }, [isJustCreated]);

  const setCombinedOptionRef = useCallback(
    (node: HTMLDivElement | null) => {
      optionElRef.current = node;
      if (typeof props.innerRef === "function") {
        props.innerRef(node);
      } else if (props.innerRef && "current" in props.innerRef) {
        (props.innerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [props.innerRef],
  );

  return (
    <selectComponents.Option
      {...props}
      innerRef={setCombinedOptionRef}
      className={isJustCreated ? styles.optionJustCreated : undefined}
    />
  );
}

function DynamicDropdownIndicator(
  props: DropdownIndicatorProps<DropdownFilterOption, false>,
) {
  const ctx = useContext(DropdownOtherContext);
  const isDark = ctx?.variant !== "light";
  return (
    <selectComponents.DropdownIndicator {...props}>
      <span
        className={`${styles.indicatorBtn} ${
          isDark ? styles.indicatorDark : styles.indicatorLight
        } ${props.selectProps.menuIsOpen ? styles.indicatorOpen : ""}`}
      >
        <ChevronDown size={15} strokeWidth={2} aria-hidden="true" />
      </span>
    </selectComponents.DropdownIndicator>
  );
}

function DynamicClearIndicator(
  props: ClearIndicatorProps<DropdownFilterOption, false>,
) {
  const ctx = useContext(DropdownOtherContext);
  const isDark = ctx?.variant !== "light";
  return (
    <selectComponents.ClearIndicator {...props}>
      <span
        className={`${styles.indicatorBtn} ${
          isDark ? styles.indicatorDark : styles.indicatorLight
        }`}
        aria-label="Clear selection"
      >
        <X size={14} strokeWidth={2.2} aria-hidden="true" />
      </span>
    </selectComponents.ClearIndicator>
  );
}

const SELECT_COMPONENTS = {
  MenuList: DynamicMenuList,
  Option: DynamicOption,
  DropdownIndicator: DynamicDropdownIndicator,
  ClearIndicator: DynamicClearIndicator,
  IndicatorSeparator: () => null,
};

const PORTAL_STYLES: StylesConfig<DropdownFilterOption, false> = {
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

export function DropdownFilter({
  id,
  name,
  label,
  options,
  value,
  defaultValue = null,
  onChange,
  onCreateOption,
  placeholder = "Select an option...",
  variant = "dark",
  size = "default",
  isSearchable = true,
  isClearable = false,
  sortAlphabetically = true,
  allowCustomOption = true,
  otherOptionLabel = DEFAULT_OTHER_OPTION_LABEL,
  customInputPlaceholder = "Enter custom option...",
  selectOnCreate = true,
  maxCustomOptions = DEFAULT_MAX_CUSTOM_OPTIONS,
  maxCustomOptionLength = DEFAULT_MAX_CUSTOM_OPTION_LENGTH,
  customValueTransform,
  validateCustomOption,
  disabled = false,
  required = false,
  error,
  className,
  "aria-label": ariaLabel,
}: DropdownFilterProps) {
  const reactId = useId();
  const inputId = id || `dropdown-filter-${reactId}`;
  const errorId = `${inputId}-error`;
  const isControlled = value !== undefined;

  const [isMounted, setIsMounted] = useState(false);
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue);
  const [customOptions, setCustomOptions] = useState<DropdownFilterOption[]>([]);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isEditingOther, setIsEditingOther] = useState(false);
  const [otherDraft, setOtherDraft] = useState("");
  const [inlineFeedback, setInlineFeedback] = useState<{
    type: "error" | "info";
    text: string;
  } | null>(null);
  const [recentlyCreatedValue, setRecentlyCreatedValue] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuListContainerRef = useRef<HTMLDivElement | null>(null);
  const otherInputRef = useRef<HTMLInputElement | null>(null);
  const isEditingOtherRef = useRef(false);
  const isCommittingRef = useRef(false);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedValue = isControlled ? value : internalValue;

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  // Reset inline editing if disabled flips on
  useEffect(() => {
    if (disabled) {
      isEditingOtherRef.current = false;
      setIsEditingOther(false);
      setMenuIsOpen(false);
      setOtherDraft("");
      setInlineFeedback(null);
    }
  }, [disabled]);

  // Deterministic outside-click close handler (handles portaled MenuList cleanly)
  useEffect(() => {
    if (!menuIsOpen) return;

    const handlePointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuListContainerRef.current?.contains(target)) return;

      if (rootRef.current?.contains(target)) {
        // Clicking the trigger/control while inline "Other" editor is active exits edit mode
        // so react-select can toggle or focus its search control cleanly.
        if (isEditingOtherRef.current) {
          isEditingOtherRef.current = false;
          setIsEditingOther(false);
          setOtherDraft("");
          setInlineFeedback(null);
        }
        return;
      }

      isEditingOtherRef.current = false;
      setIsEditingOther(false);
      setOtherDraft("");
      setInlineFeedback(null);
      setInputValue("");
      setMenuIsOpen(false);
    };

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isEditingOtherRef.current) {
        setMenuIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDownOutside, true);
    document.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside, true);
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [menuIsOpen]);

  const mergedOptions = useMemo(
    () =>
      buildMergedOptions({
        baseOptions: options,
        customOptions,
        selectedValue,
        allowCustomOption,
        otherOptionLabel,
        sortAlphabetically,
      }),
    [options, customOptions, selectedValue, allowCustomOption, otherOptionLabel, sortAlphabetically],
  );

  const selectedOption = useMemo<DropdownFilterOption | null>(() => {
    if (selectedValue == null || selectedValue === "") return null;
    return (
      mergedOptions.find((opt) => opt.value === selectedValue) ??
      mergedOptions.find(
        (opt) => opt.value.toLowerCase() === selectedValue.toLowerCase(),
      ) ??
      null
    );
  }, [mergedOptions, selectedValue]);

  const applySelection = useCallback(
    (nextOption: DropdownFilterOption | null) => {
      const nextValue = nextOption ? nextOption.value : null;
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onChange?.(nextValue, nextOption);
    },
    [isControlled, onChange],
  );

  const handleSelectChange = useCallback(
    (next: SingleValue<DropdownFilterOption>) => {
      const resolved = next ?? null;
      isEditingOtherRef.current = false;
      setIsEditingOther(false);
      setOtherDraft("");
      setInlineFeedback(null);
      setInputValue("");
      applySelection(resolved);
      setMenuIsOpen(false);
    },
    [applySelection],
  );

  const handleMenuOpen = useCallback(() => {
    if (disabled) return;
    setInlineFeedback(null);
    setMenuIsOpen(true);
  }, [disabled]);

  const handleMenuClose = useCallback(() => {
    // Ignore react-select's internal blur-close while focus is inside our inline "Other" editor
    if (isEditingOtherRef.current) {
      return;
    }
    setOtherDraft("");
    setInlineFeedback(null);
    setMenuIsOpen(false);
  }, []);

  const handleInputChange = useCallback(
    (nextInput: string, meta: InputActionMeta) => {
      if (meta.action === "input-change") {
        setInputValue(nextInput);
        if (!menuIsOpen && !disabled) {
          setMenuIsOpen(true);
        }
      } else if (meta.action === "menu-close" || meta.action === "set-value") {
        if (!isEditingOtherRef.current) {
          setInputValue("");
        }
      }
    },
    [disabled, menuIsOpen],
  );

  const handleStartOtherEdit = useCallback(() => {
    if (disabled) return;
    isEditingOtherRef.current = true;
    setInlineFeedback(null);
    setIsEditingOther(true);
    setMenuIsOpen(true);
  }, [disabled]);

  const handleCancelOtherEdit = useCallback(() => {
    isEditingOtherRef.current = false;
    setIsEditingOther(false);
    setOtherDraft("");
    setInlineFeedback(null);
  }, []);

  const handleOtherDraftChange = useCallback((next: string) => {
    setOtherDraft(next);
    setInlineFeedback((current) => (current?.type === "error" ? null : current));
  }, []);

  const handleCommitOther = useCallback(() => {
    // Synchronous guard against rapid double-click / double-Enter race conditions
    if (isCommittingRef.current) return;
    isCommittingRef.current = true;

    try {
      const result = validateAndCreateCustomOption({
        rawInput: otherDraft,
        existingOptions: mergedOptions,
        otherOptionLabel,
        maxLength: maxCustomOptionLength,
        maxCustomOptions,
        currentCustomCount: customOptions.length,
        customValueTransform,
        customValidator: validateCustomOption,
      });

      if (result.status === "invalid") {
        setInlineFeedback({ type: "error", text: result.error });
        setLiveAnnouncement(result.error);
        otherInputRef.current?.focus();
        return;
      }

      if (result.status === "duplicate") {
        isEditingOtherRef.current = false;
        setIsEditingOther(false);
        setOtherDraft("");
        setInputValue("");
        setInlineFeedback({ type: "info", text: result.message });
        setLiveAnnouncement(result.message);
        setRecentlyCreatedValue(result.existingOption.value);
        if (selectOnCreate) {
          applySelection(result.existingOption);
          setMenuIsOpen(false);
        }
        return;
      }

      const created = result.option;

      // Idempotent functional state update prevents any stale-closure duplicate
      setCustomOptions((prev) => {
        const exists = prev.some(
          (item) =>
            item.value.toLowerCase() === created.value.toLowerCase() ||
            item.label.toLowerCase() === created.label.toLowerCase(),
        );
        return exists ? prev : [...prev, created];
      });

      onCreateOption?.(created);

      // Clear search query and drafts
      setInputValue("");
      setOtherDraft("");
      setInlineFeedback(null);
      isEditingOtherRef.current = false;
      setIsEditingOther(false);

      setRecentlyCreatedValue(created.value);
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      highlightTimerRef.current = setTimeout(() => {
        setRecentlyCreatedValue(null);
      }, 1200);

      if (selectOnCreate) {
        applySelection(created);
        setMenuIsOpen(false);
        setLiveAnnouncement(`Added and selected "${created.label}".`);
      } else {
        setMenuIsOpen(true);
        setLiveAnnouncement(`Added "${created.label}" to options.`);
      }
    } finally {
      isCommittingRef.current = false;
    }
  }, [
    applySelection,
    customOptions.length,
    customValueTransform,
    maxCustomOptionLength,
    maxCustomOptions,
    mergedOptions,
    onCreateOption,
    otherDraft,
    otherOptionLabel,
    selectOnCreate,
    validateCustomOption,
  ]);

  const isDark = variant === "dark";

  const classNames = useMemo<ClassNamesConfig<DropdownFilterOption, false>>(
    () => ({
      control: ({ isFocused, isDisabled }) =>
        [
          styles.control,
          size === "compact" ? styles.controlCompact : "",
          isDark ? styles.controlDark : styles.controlLight,
          isFocused
            ? isDark
              ? styles.controlDarkFocused
              : styles.controlLightFocused
            : "",
          isDisabled
            ? isDark
              ? styles.controlDarkDisabled
              : styles.controlLightDisabled
            : "",
          error ? styles.controlError : "",
        ]
          .filter(Boolean)
          .join(" "),
      valueContainer: () => styles.valueContainer,
      placeholder: () => (isDark ? styles.placeholderDark : styles.placeholderLight),
      singleValue: () => (isDark ? styles.singleValueDark : styles.singleValueLight),
      input: () => (isDark ? styles.inputDark : styles.inputLight),
      indicatorsContainer: () => styles.indicatorsContainer,
      menu: () => `${styles.menu} ${isDark ? styles.menuDark : styles.menuLight}`,
      menuList: () =>
        `${styles.menuList} ${isDark ? styles.menuListDark : styles.menuListLight}`,
      option: ({ isFocused, isSelected, isDisabled }) =>
        [
          styles.option,
          isDark ? styles.optionDark : styles.optionLight,
          isFocused
            ? isDark
              ? styles.optionDarkFocused
              : styles.optionLightFocused
            : "",
          isSelected
            ? isDark
              ? styles.optionDarkSelected
              : styles.optionLightSelected
            : "",
          isDisabled ? styles.optionDisabled : "",
        ]
          .filter(Boolean)
          .join(" "),
      noOptionsMessage: () =>
        `${styles.noOptionsMessage} ${
          isDark ? styles.noOptionsDark : styles.noOptionsLight
        }`,
    }),
    [error, isDark, size],
  );

  const contextValue = useMemo<DropdownOtherContextValue>(
    () => ({
      variant,
      allowCustomOption,
      otherOptionLabel,
      customInputPlaceholder,
      maxCustomOptions,
      maxCustomOptionLength,
      customCount: customOptions.length,
      isEditingOther,
      otherDraft,
      inlineFeedback,
      recentlyCreatedValue,
      otherInputRef,
      menuListContainerRef,
      onStartOtherEdit: handleStartOtherEdit,
      onOtherDraftChange: handleOtherDraftChange,
      onCommitOther: handleCommitOther,
      onCancelOtherEdit: handleCancelOtherEdit,
    }),
    [
      allowCustomOption,
      customInputPlaceholder,
      customOptions.length,
      handleCancelOtherEdit,
      handleCommitOther,
      handleOtherDraftChange,
      handleStartOtherEdit,
      inlineFeedback,
      isEditingOther,
      maxCustomOptionLength,
      maxCustomOptions,
      otherDraft,
      otherOptionLabel,
      recentlyCreatedValue,
      variant,
    ],
  );

  return (
    <div ref={rootRef} className={`${styles.root} ${className ?? ""}`}>
      {label ? (
        <label
          htmlFor={inputId}
          className={`${styles.label} ${isDark ? styles.labelDark : styles.labelLight}`}
        >
          {label}
          {required ? (
            <span className={styles.requiredMark} aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <DropdownOtherContext.Provider value={contextValue}>
        <Select<DropdownFilterOption, false>
          instanceId={reactId}
          inputId={inputId}
          name={name}
          options={mergedOptions}
          value={selectedOption}
          onChange={handleSelectChange}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          menuIsOpen={menuIsOpen}
          onMenuOpen={handleMenuOpen}
          onMenuClose={handleMenuClose}
          closeMenuOnSelect={true}
          blurInputOnSelect={false}
          isSearchable={isSearchable}
          isClearable={isClearable}
          isDisabled={disabled}
          required={required}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={error ? true : undefined}
          aria-errormessage={error ? errorId : undefined}
          noOptionsMessage={({ inputValue: searchVal }) =>
            searchVal.trim()
              ? `No matching options for "${searchVal.trim()}"`
              : "No options available"
          }
          unstyled
          classNames={classNames}
          styles={PORTAL_STYLES}
          components={SELECT_COMPONENTS}
          menuPortalTarget={isMounted ? document.body : undefined}
          menuPosition="fixed"
          menuPlacement="auto"
        />
      </DropdownOtherContext.Provider>

      {error ? (
        <span id={errorId} className={styles.fieldError} role="alert">
          {error}
        </span>
      ) : null}

      <span className={styles.srOnly} role="status" aria-live="polite">
        {liveAnnouncement}
      </span>
    </div>
  );
}

export default DropdownFilter;
