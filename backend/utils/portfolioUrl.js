export function isValidPortfolioUrl(value) {
  if (typeof value !== 'string') return false;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

    const labels = url.hostname.split('.');
    return labels.length > 1 && labels.every((label) =>
      label.length > 0 &&
      label.length <= 63 &&
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
    );
  } catch {
    return false;
  }
}