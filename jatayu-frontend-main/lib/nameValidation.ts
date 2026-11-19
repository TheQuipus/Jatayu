const ALLOWED_NAME_CHARACTERS = /^[\p{L}\p{M}\p{N}\p{Zs},'-]+$/u;
const HAS_LETTER = /\p{L}/u;

export function getNameValidationError(value: string): string | null {
  const name = value.trim();

  if (!name) return "Required";
  if (name.length < 2) return "Too short";
  if (!ALLOWED_NAME_CHARACTERS.test(name)) {
    return "Use letters, numbers, spaces, hyphens, commas, or apostrophes";
  }
  if (!HAS_LETTER.test(name)) return "Enter a name containing at least one letter";

  return null;
}