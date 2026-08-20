import type { PortfolioSampleFile } from "./expertApplicationSubmission";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function persistMediaUrl(url: string): Promise<string> {
  if (!url || !url.startsWith("blob:")) return url;

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    return url;
  }
}

export async function persistPortfolioSamples(
  samples: PortfolioSampleFile[],
): Promise<PortfolioSampleFile[]> {
  return Promise.all(
    samples.map(async (sample) => {
      if (!sample.url?.startsWith("blob:")) return sample;
      return {
        ...sample,
        url: await persistMediaUrl(sample.url),
      };
    }),
  );
}

export function deriveLocationFromTimezone(timezone: string): string {
  if (!timezone.trim()) return "India";

  const citySegment = timezone.split("/").pop();
  if (citySegment) {
    return citySegment.replace(/_/g, " ");
  }

  return timezone;
}
