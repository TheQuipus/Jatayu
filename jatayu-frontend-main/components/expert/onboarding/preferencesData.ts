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

export function getLowestFormatPrice(formatPrices: Record<string, string>): number {
  const prices = Object.values(formatPrices)
    .map((value) => parseInt(value, 10))
    .filter((value) => !Number.isNaN(value) && value > 0);

  return prices.length > 0 ? Math.min(...prices) : 0;
}

export function formatPreferencesPricingSummary(
  selectedFormats: string[],
  formatPrices: Record<string, string>,
): string {
  if (selectedFormats.length === 0) return "Not selected";

  return selectedFormats
    .map((id) => {
      const title = getFormatTitle(id);
      const price = formatPrices[id];
      return price ? `${title} (₹${price}/min)` : title;
    })
    .join(", ");
}
