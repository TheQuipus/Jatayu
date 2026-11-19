export interface DropdownFilterOption {
  value: string;
  label: string;
  isCustom?: boolean;
  isDisabled?: boolean;
}

export type CustomOptionCreationResult =
  | {
      status: "created";
      option: DropdownFilterOption;
    }
  | {
      status: "duplicate";
      existingOption: DropdownFilterOption;
      message: string;
    }
  | {
      status: "invalid";
      error: string;
    };

export const DEFAULT_OTHER_OPTION_LABEL = "Other";
export const DEFAULT_MAX_CUSTOM_OPTIONS = 20;
export const DEFAULT_MAX_CUSTOM_OPTION_LENGTH = 80;

/**
 * Strips ASCII control characters, trims leading/trailing whitespace,
 * and collapses consecutive whitespace into single spaces.
 */
export function normalizeOptionLabel(raw: string): string {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Returns true when an option represents the reserved "Other" trigger label.
 */
export function isOtherTriggerOption(
  option: Pick<DropdownFilterOption, "value" | "label">,
  otherOptionLabel: string = DEFAULT_OTHER_OPTION_LABEL,
): boolean {
  const normalizedTarget = normalizeOptionLabel(otherOptionLabel).toLowerCase();
  if (!normalizedTarget) return false;
  return (
    normalizeOptionLabel(option.label).toLowerCase() === normalizedTarget ||
    normalizeOptionLabel(option.value).toLowerCase() === normalizedTarget
  );
}

export function sortDropdownOptionsAlphabetically(
  options: readonly DropdownFilterOption[],
  otherOptionLabel: string = DEFAULT_OTHER_OPTION_LABEL,
): DropdownFilterOption[] {
  return [...options].sort((a, b) => {
    const aIsOther = isOtherTriggerOption(a, otherOptionLabel);
    const bIsOther = isOtherTriggerOption(b, otherOptionLabel);
    if (aIsOther && !bIsOther) return 1;
    if (!aIsOther && bIsOther) return -1;
    return a.label.localeCompare(b.label, undefined, {
      sensitivity: "base",
      numeric: true,
    });
  });
}

/**
 * Merges static base options, user-created custom options, and any asynchronously
 * hydrated controlled `selectedValue` that is not present in `baseOptions`.
 *
 * When `allowCustomOption` is true, any static "Other" option from `baseOptions`
 * is removed so the interactive "Other" creator row is the sole "Other" entry.
 * When `sortAlphabetically` is true (default), all options are sorted A→Z
 * (with any static "Other" entry kept at the bottom).
 */
export function buildMergedOptions({
  baseOptions,
  customOptions,
  selectedValue,
  allowCustomOption = true,
  otherOptionLabel = DEFAULT_OTHER_OPTION_LABEL,
  sortAlphabetically = true,
}: {
  baseOptions: readonly DropdownFilterOption[];
  customOptions: readonly DropdownFilterOption[];
  selectedValue?: string | null;
  allowCustomOption?: boolean;
  otherOptionLabel?: string;
  sortAlphabetically?: boolean;
}): DropdownFilterOption[] {
  const seenValues = new Set<string>();
  const seenLabels = new Set<string>();
  const merged: DropdownFilterOption[] = [];

  const pushUnique = (option: DropdownFilterOption) => {
    const normalizedVal = option.value.trim().toLowerCase();
    const normalizedLabel = normalizeOptionLabel(option.label).toLowerCase();
    if (!normalizedVal || !normalizedLabel) return;
    if (seenValues.has(normalizedVal) || seenLabels.has(normalizedLabel)) return;
    seenValues.add(normalizedVal);
    seenLabels.add(normalizedLabel);
    merged.push(option);
  };

  for (const option of baseOptions) {
    if (allowCustomOption && isOtherTriggerOption(option, otherOptionLabel)) {
      continue;
    }
    pushUnique(option);
  }

  for (const option of customOptions) {
    pushUnique({ ...option, isCustom: true });
  }

  // Hydrate an async-loaded controlled value not present in static options
  if (typeof selectedValue === "string") {
    const trimmedSelected = normalizeOptionLabel(selectedValue);
    const selectedLower = trimmedSelected.toLowerCase();
    if (
      trimmedSelected &&
      !seenValues.has(selectedLower) &&
      !seenLabels.has(selectedLower) &&
      !(allowCustomOption && selectedLower === normalizeOptionLabel(otherOptionLabel).toLowerCase())
    ) {
      pushUnique({
        value: trimmedSelected,
        label: trimmedSelected,
        isCustom: true,
      });
    }
  }

  return sortAlphabetically
    ? sortDropdownOptionsAlphabetically(merged, otherOptionLabel)
    : merged;
}

/**
 * Case-insensitive substring filter over option label and value.
 */
export function filterDropdownOptions(
  options: readonly DropdownFilterOption[],
  query: string,
): DropdownFilterOption[] {
  const normalizedQuery = normalizeOptionLabel(query).toLowerCase();
  if (!normalizedQuery) return [...options];
  return options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(normalizedQuery) ||
      opt.value.toLowerCase().includes(normalizedQuery),
  );
}

/**
 * Validates raw user input from the inline "Other" text box and creates a
 * normalized, deduplicated custom option (or returns a structured duplicate/error result).
 */
export function validateAndCreateCustomOption({
  rawInput,
  existingOptions,
  otherOptionLabel = DEFAULT_OTHER_OPTION_LABEL,
  maxLength = DEFAULT_MAX_CUSTOM_OPTION_LENGTH,
  maxCustomOptions = DEFAULT_MAX_CUSTOM_OPTIONS,
  currentCustomCount = 0,
  customValueTransform,
  customValidator,
}: {
  rawInput: string;
  existingOptions: readonly DropdownFilterOption[];
  otherOptionLabel?: string;
  maxLength?: number;
  maxCustomOptions?: number;
  currentCustomCount?: number;
  customValueTransform?: (label: string) => string;
  customValidator?: (label: string) => string | null;
}): CustomOptionCreationResult {
  const normalizedLabel = normalizeOptionLabel(rawInput);

  if (!normalizedLabel) {
    return {
      status: "invalid",
      error: "Please enter a value before adding.",
    };
  }

  if (normalizedLabel.length > maxLength) {
    return {
      status: "invalid",
      error: `Keep custom option under ${maxLength} characters.`,
    };
  }

  if (
    normalizedLabel.toLowerCase() ===
    normalizeOptionLabel(otherOptionLabel).toLowerCase()
  ) {
    return {
      status: "invalid",
      error: `Please enter a specific name instead of "${otherOptionLabel}".`,
    };
  }

  if (customValidator) {
    const customError = customValidator(normalizedLabel);
    if (customError) {
      return {
        status: "invalid",
        error: customError,
      };
    }
  }

  const transformedValue = customValueTransform
    ? normalizeOptionLabel(customValueTransform(normalizedLabel))
    : normalizedLabel;

  if (!transformedValue) {
    return {
      status: "invalid",
      error: "Please enter a valid option value.",
    };
  }

  const labelLower = normalizedLabel.toLowerCase();
  const valueLower = transformedValue.toLowerCase();

  const existingMatch = existingOptions.find(
    (opt) =>
      normalizeOptionLabel(opt.label).toLowerCase() === labelLower ||
      opt.value.trim().toLowerCase() === valueLower,
  );

  if (existingMatch) {
    return {
      status: "duplicate",
      existingOption: existingMatch,
      message: `"${existingMatch.label}" is already in the list.`,
    };
  }

  if (currentCustomCount >= maxCustomOptions) {
    return {
      status: "invalid",
      error: `Maximum of ${maxCustomOptions} custom options reached.`,
    };
  }

  return {
    status: "created",
    option: {
      value: transformedValue,
      label: normalizedLabel,
      isCustom: true,
    },
  };
}

