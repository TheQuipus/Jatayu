export const CONSULTATION_FORMATS = [
  {
    id: "video",
    title: "1:1 Video Call",
    desc: "Face-to-face interaction for deep dives,\nstrategy, and mentorship.",
  },
  {
    id: "written",
    title: "Text Messaging",
    desc: "Send and receive messages with\nyour clients anytime.",
  },
  {
    id: "shoutout",
    title: "Shoutout",
    desc: "Quick shoutouts for fast advice when\nclients prefer privacy.",
  },
  {
    id: "group",
    title: "Group Session",
    desc: "Join interactive group Q&A\nand live learning.",
  },
] as const;

export const SESSION_LENGTHS = [
  { id: "15", label: "15 mins" },
  { id: "30", label: "30 mins" },
  { id: "45", label: "45 mins" },
  { id: "60", label: "60 mins" },
  { id: "90", label: "90+ mins" },
] as const;

export type ConsultationFormatId = (typeof CONSULTATION_FORMATS)[number]["id"];

export function getFormatTitle(id: string): string {
  return CONSULTATION_FORMATS.find((format) => format.id === id)?.title ?? id;
}

export function getSessionLengthLabel(id: string): string {
  return SESSION_LENGTHS.find((length) => length.id === id)?.label ?? id;
}

type FormatPriceValue = string | number | Record<string, string | number> | null | undefined;

function collectNumericPrices(value: FormatPriceValue): number[] {
  if (value == null) return [];

  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? [value] : [];
  }

  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return !Number.isNaN(parsed) && parsed > 0 ? [parsed] : [];
  }

  return Object.values(value).flatMap((nested) => collectNumericPrices(nested));
}

export function formatFormatPriceDisplay(value: FormatPriceValue): string {
  if (value == null) return "—";

  if (typeof value === "string" || typeof value === "number") {
    const parsed = typeof value === "number" ? value : parseInt(value, 10);
    return !Number.isNaN(parsed) && parsed > 0 ? `₹${parsed}` : "—";
  }

  const prices = collectNumericPrices(value);
  if (prices.length === 0) return "—";

  const lowest = Math.min(...prices);
  return prices.length === 1 ? `₹${lowest}` : `₹${lowest}+`;
}

export function getLowestFormatPrice(
  formatPrices: Record<string, FormatPriceValue>,
): number {
  const prices = Object.values(formatPrices).flatMap((value) => collectNumericPrices(value));
  return prices.length > 0 ? Math.min(...prices) : 0;
}

export function formatPreferencesPricingSummary(
  selectedFormats: string[],
  formatPrices: Record<string, FormatPriceValue>,
): string {
  if (selectedFormats.length === 0) return "Not selected";

  return selectedFormats
    .map((id) => {
      const title = getFormatTitle(id);
      const price = formatFormatPriceDisplay(formatPrices[id]);
      return price !== "—" ? `${title} (${price}/min)` : title;
    })
    .join(", ");
}
