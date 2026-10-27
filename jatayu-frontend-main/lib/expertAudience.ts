export function toggleAudienceSelection(
  selectedAudiences: readonly string[],
  audienceId: string,
): string[] {
  return selectedAudiences.includes(audienceId)
    ? selectedAudiences.filter((id) => id !== audienceId)
    : [...selectedAudiences, audienceId];
}
