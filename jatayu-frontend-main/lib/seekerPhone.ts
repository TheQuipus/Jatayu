export function normalizeSeekerPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  return digits;
}

export function isValidSeekerPhone(value: string): boolean {
  return /^\d{10}$/.test(value);
}
