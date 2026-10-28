const ALLOWED_NAME_CHARACTERS = /^[\p{L}\p{M}\p{N}\p{Zs},'-]+$/u;
const HAS_LETTER = /\p{L}/u;

export function isValidSeekerFullName(value) {
  if (typeof value !== 'string') return false;

  const name = value.trim();
  return name.length >= 2
    && ALLOWED_NAME_CHARACTERS.test(name)
    && name.split(/[\p{Zs},]+/u).filter(Boolean).every((part) => HAS_LETTER.test(part));
}