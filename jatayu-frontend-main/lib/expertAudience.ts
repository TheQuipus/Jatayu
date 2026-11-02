export function normalizeExpertSelectionValues(...values: unknown[]): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    let candidates: unknown = value;
    if (typeof value === "string") {
      try {
        const parsed: unknown = JSON.parse(value);
        candidates = Array.isArray(parsed) ? parsed : value.split(",");
      } catch {
        candidates = value.split(",");
      }
    }

    if (!Array.isArray(candidates)) continue;
    for (const candidate of candidates) {
      if (typeof candidate !== "string") continue;
      const item = candidate.trim();
      const key = item.toLocaleLowerCase();
      if (item && !seen.has(key)) {
        seen.add(key);
        normalized.push(item);
      }
    }
  }

  return normalized;
}

export function getExpertProfileAudienceValues(
  targetAudience: unknown,
  metadataAudiences: unknown,
): string[] {
  const savedAudience = normalizeExpertSelectionValues(targetAudience);
  return savedAudience.length > 0
    ? savedAudience
    : normalizeExpertSelectionValues(metadataAudiences);
}

export function getPreferredExpertSelectionValues(
  primary: unknown,
  fallback: unknown,
): string[] {
  const primaryValues = normalizeExpertSelectionValues(primary);
  return primaryValues.length > 0
    ? primaryValues
    : normalizeExpertSelectionValues(fallback);
}

export function reconcileHydratedSelections(
  current: string[],
  incoming: unknown,
  userHasEdited: boolean,
): string[] {
  return userHasEdited ? current : normalizeExpertSelectionValues(incoming);
}

export function buildAudiencePersistencePayload(
  languages: string[],
  audiences: string[],
) {
  const savedLanguages = normalizeExpertSelectionValues(languages);
  const savedAudiences = normalizeExpertSelectionValues(audiences);

  return {
    step: "availability" as const,
    focusAreas: savedLanguages,
    targetAudience: savedAudiences,
    onboardingMetadata: {
      languages: savedLanguages,
      audiences: savedAudiences,
    },
  };
}

export function toggleAudienceSelection(
  selectedAudiences: readonly string[],
  audienceId: string,
): string[] {
  return selectedAudiences.includes(audienceId)
    ? selectedAudiences.filter((id) => id !== audienceId)
    : [...selectedAudiences, audienceId];
}
