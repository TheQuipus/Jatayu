export function isDuplicateRegistrationMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("welcome back") ||
    normalized.includes("already exists") ||
    normalized.includes("already registered") ||
    normalized.includes("already in use") ||
    normalized.includes("already taken") ||
    normalized.includes("account exists") ||
    normalized.includes("duplicate") ||
    normalized.includes("email is taken") ||
    normalized.includes("phone number already")
  );
}
