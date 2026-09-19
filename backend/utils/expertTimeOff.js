export function validateTimeOff(value) {
  if (!Array.isArray(value) || value.length > 100) throw new TypeError('Time off must be an array with at most 100 ranges');
  const validDate = (date) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
  return value.map((item, index) => {
    if (!item || !validDate(item.fromDate) || !validDate(item.toDate) || item.fromDate > item.toDate) {
      throw new TypeError('Time off requires valid fromDate and toDate (YYYY-MM-DD) in date order');
    }
    if (typeof item.title !== 'string' || !item.title.trim() || item.title.length > 200) {
      throw new TypeError('Time off reason is required and must not exceed 200 characters');
    }
    return { id: String(index), title: item.title.trim(), fromDate: item.fromDate, toDate: item.toDate };
  });
}

export function getExpertTimeOff(expert) {
  let metadata = expert.onboardingMetadata;
  for (let i = 0; i < 3 && typeof metadata === 'string'; i++) {
    try { metadata = JSON.parse(metadata); } catch { return []; }
  }
  return Array.isArray(metadata?.timeOff) ? validateTimeOff(metadata.timeOff) : [];
}

// Resolve midnight in the expert's timezone, not the server's timezone.
function midnight(date, timezone) {
  const target = Date.parse(`${date}T00:00:00Z`);
  let instant = target;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  for (let i = 0; i < 4; i++) {
    const p = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(({ type, value }) => [type, value]));
    const local = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
    const correction = target - local;
    instant += correction;
    if (!correction) break;
  }
  return new Date(instant).toISOString();
}

export function expertTimeOffSlots(expert) {
  return getExpertTimeOff(expert).map(({ fromDate, toDate }) => ({
    startAt: midnight(fromDate, expert.timezone || 'Asia/Kolkata'),
    endAt: midnight(new Date(Date.parse(toDate) + 86400000).toISOString().slice(0, 10), expert.timezone || 'Asia/Kolkata'),
  }));
}
