export type RescheduleSlot = {
  id: string;
  dayLabel: string;
  timeLabel: string;
  label: string;
  dateIso: string;
};

/**
 * Returns available consultation slots within the next 48 hours for rescheduling.
 */
export function getAvailable48hSlots(): RescheduleSlot[] {
  const now = new Date();
  const date1 = new Date(now);
  date1.setDate(date1.getDate() + 1);

  const date2 = new Date(now);
  date2.setDate(date2.getDate() + 2);

  const formatShort = (d: Date) =>
    d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });

  const d1 = formatShort(date1);
  const d2 = formatShort(date2);

  return [
    {
      id: "slot-1",
      dayLabel: d1,
      timeLabel: "10:00 AM - 11:00 AM",
      label: `${d1} • 10:00 AM`,
      dateIso: date1.toISOString(),
    },
    {
      id: "slot-2",
      dayLabel: d1,
      timeLabel: "02:30 PM - 03:30 PM",
      label: `${d1} • 02:30 PM`,
      dateIso: date1.toISOString(),
    },
    {
      id: "slot-3",
      dayLabel: d1,
      timeLabel: "05:00 PM - 06:00 PM",
      label: `${d1} • 05:00 PM`,
      dateIso: date1.toISOString(),
    },
    {
      id: "slot-4",
      dayLabel: d2,
      timeLabel: "11:00 AM - 12:00 PM",
      label: `${d2} • 11:00 AM`,
      dateIso: date2.toISOString(),
    },
    {
      id: "slot-5",
      dayLabel: d2,
      timeLabel: "03:30 PM - 04:30 PM",
      label: `${d2} • 03:30 PM`,
      dateIso: date2.toISOString(),
    },
    {
      id: "slot-6",
      dayLabel: d2,
      timeLabel: "06:30 PM - 07:30 PM",
      label: `${d2} • 06:30 PM`,
      dateIso: date2.toISOString(),
    },
  ];
}
