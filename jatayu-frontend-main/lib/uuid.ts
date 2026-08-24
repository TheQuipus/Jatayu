export function generateUUID(): string {
  try {
    if (typeof window !== "undefined" && window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
  } catch {
    // Fall back to timestamp + random string if crypto.randomUUID is not available or throws
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
