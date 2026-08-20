export type TimeSlot = {
  id: string;
  days: string[];
  from: string;
  to: string;
};

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function createEmptySlot(): TimeSlot {
  return {
    id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    days: [],
    from: "",
    to: "",
  };
}

export function createDefaultSlot(): TimeSlot {
  return {
    id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    days: [],
    from: "09:00 AM",
    to: "05:00 PM",
  };
}

export function getMinutes(timeStr: string) {
  if (!timeStr) return 0;

  if (/AM|PM/i.test(timeStr)) {
    const [time, modifier] = timeStr.split(" ");
    const [hoursStr, minutesStr] = time.split(":");
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr || "0", 10);

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  const [hoursStr, minutesStr] = timeStr.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr || "0", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;

  return hours * 60 + minutes;
}

export function hasValidTimes(slot: TimeSlot) {
  return Boolean(slot.from && slot.to && getMinutes(slot.to) > getMinutes(slot.from));
}

export function getMachineTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function formatTimezoneLabel(timeZone: string) {
  try {
    const longName = new Intl.DateTimeFormat(undefined, {
      timeZone,
      timeZoneName: "long",
    })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;

    if (longName) {
      return longName;
    }

    return timeZone.replace(/_/g, " ");
  } catch {
    return timeZone.replace(/_/g, " ");
  }
}

export function checkHasConflict(slots: TimeSlot[]): boolean {
  for (let i = 0; i < slots.length; i++) {
    const slotA = slots[i];
    if (!slotA.from || !slotA.to || getMinutes(slotA.to) <= getMinutes(slotA.from)) {
      continue;
    }
    for (let j = i + 1; j < slots.length; j++) {
      const slotB = slots[j];
      if (!slotB.from || !slotB.to || getMinutes(slotB.to) <= getMinutes(slotB.from)) {
        continue;
      }
      const shareDay = slotA.days.some((day) => slotB.days.includes(day));
      if (shareDay) {
        const timeAFrom = getMinutes(slotA.from);
        const timeATo = getMinutes(slotA.to);
        const timeBFrom = getMinutes(slotB.from);
        const timeBTo = getMinutes(slotB.to);

        if (timeAFrom < timeBTo && timeBFrom < timeATo) {
          return true;
        }
      }
    }
  }
  return false;
}

export function isAvailabilityValid(timezone: string, slots: TimeSlot[]) {
  const hasValidSlot = slots.some(
    (slot) =>
      slot.days.length > 0 &&
      slot.from &&
      slot.to &&
      getMinutes(slot.to) > getMinutes(slot.from),
  );

  const hasConflict = checkHasConflict(slots);

  return Boolean(timezone) && hasValidSlot && !hasConflict;
}
