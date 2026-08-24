/**
 * Utility for converting UTC timestamps received from API endpoints into system/local timezone.
 */

/**
 * Returns the client system/browser timezone identifier (e.g. "Asia/Kolkata", "America/New_York").
 */
export function getSystemTimezone(): string {
  if (typeof window === "undefined") return "Asia/Kolkata";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  } catch {
    return "Asia/Kolkata";
  }
}

/**
 * Safely parses a UTC date string, epoch number, or Date instance into a Date object.
 * Ensures ISO strings without offset or trailing 'Z' are parsed explicitly as UTC.
 */
export function parseUtcDate(input: string | Date | number | null | undefined): Date | null {
  if (input === null || input === undefined || input === "") return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  if (typeof input === "number") {
    // If seconds timestamp, convert to milliseconds
    const ms = input < 1e11 ? input * 1000 : input;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  let str = String(input).trim();
  if (!str) return null;

  // Replace space separator between date and time with 'T'
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(str)) {
    str = str.replace(" ", "T");
  }

  // If ISO string has no timezone offset specifier ('Z', '+HH:MM', '-HH:MM'), treat it as UTC
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str) && !/[Zz]|[+-]\d{2}:?\d{2}$/.test(str)) {
    str += "Z";
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a UTC timestamp into a system timezone Date string.
 * Default format example: "Mon, Aug 24, 2026"
 */
export function formatUtcToLocalDate(
  utcInput: string | Date | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }
): string {
  const date = parseUtcDate(utcInput);
  if (!date) return "TBD";

  try {
    return date.toLocaleDateString(undefined, options);
  } catch {
    return date.toLocaleDateString("en-US", options);
  }
}

/**
 * Formats a UTC timestamp into a system timezone Time string.
 * Default format example: "5:30 PM"
 */
export function formatUtcToLocalTime(
  utcInput: string | Date | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }
): string {
  const date = parseUtcDate(utcInput);
  if (!date) return "TBD";

  try {
    return date.toLocaleTimeString(undefined, options);
  } catch {
    return date.toLocaleTimeString("en-US", options);
  }
}

/**
 * Formats a UTC timestamp into a full date and time string in system timezone.
 * Example: "Aug 24, 2026 at 5:30 PM"
 */
export function formatUtcToLocalDateTime(
  utcInput: string | Date | number | null | undefined
): string {
  const dateStr = formatUtcToLocalDate(utcInput, { month: "short", day: "numeric", year: "numeric" });
  const timeStr = formatUtcToLocalTime(utcInput);
  if (dateStr === "TBD" || timeStr === "TBD") return "TBD";
  return `${dateStr} at ${timeStr}`;
}

/**
 * Formats a UTC timestamp into a human-readable relative time string.
 * Examples: "Just now", "5m ago", "2h ago", "3d ago", "in 15m"
 */
export function formatUtcRelativeTime(
  utcInput: string | Date | number | null | undefined
): string {
  const date = parseUtcDate(utcInput);
  if (!date) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const absMs = Math.abs(diffMs);
  const isFuture = diffMs < 0;

  const seconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 45) {
    return isFuture ? "In a moment" : "Just now";
  }

  if (minutes < 60) {
    return isFuture ? `In ${minutes}m` : `${minutes}m ago`;
  }

  if (hours < 24) {
    return isFuture ? `In ${hours}h` : `${hours}h ago`;
  }

  if (days < 30) {
    return isFuture ? `In ${days}d` : `${days}d ago`;
  }

  return formatUtcToLocalDate(date, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Extracts system timezone hour, minute, and date offset from a UTC ISO string/Date.
 */
export function utcToLocalDateParts(utcInput: string | Date | number | null | undefined): {
  date: Date | null;
  startHour: number;
  startMinute: number;
  formattedDate: string;
  formattedTime: string;
} {
  const date = parseUtcDate(utcInput);
  if (!date) {
    return {
      date: null,
      startHour: 12,
      startMinute: 0,
      formattedDate: "TBD",
      formattedTime: "TBD",
    };
  }

  return {
    date,
    startHour: date.getHours(),
    startMinute: date.getMinutes(),
    formattedDate: formatUtcToLocalDate(date),
    formattedTime: formatUtcToLocalTime(date),
  };
}
