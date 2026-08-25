/**
 * Jatayu AI Improve Needs API Integration Client
 */

import { getToken } from "@/lib/api";
import { publicApiBase } from "@/lib/publicApiBase";
import { NEED_STEP_CHIPS } from "@/components/seeker/onboarding/seekerOutcomeOptions";

const BASE_URL = publicApiBase();

export interface AiImproveNeedsRequest {
  subject?: string;
  userText: string;
  selectedGoals?: string[];
}

export interface AiImproveNeedsResponse {
  subject: string;
  selectedGoals: string[];
  autoSelected: boolean;
  options: {
    professional: string;
    casual: string;
    concise: string;
    [key: string]: string;
  };
  suggestions?: {
    professional: string;
    casual: string;
    concise: string;
    [key: string]: string;
  };
  source: string;
}

/**
 * Maps frontend chip IDs (e.g. ['clarity', 'plan']) to standard backend goal names:
 * 'clarity' -> 'Clarity & Direction'
 * 'plan' -> 'Actionable Plan'
 * 'knowledge' -> 'Deep Knowledge'
 * 'support' -> 'Help & Support'
 * 'solution' -> 'Specific Solution'
 */
export function mapChipIdsToGoalNames(chipIds: string[]): string[] {
  const result: string[] = [];
  for (const id of chipIds) {
    const chip = NEED_STEP_CHIPS.find((c) => c.id === id);
    if (chip) {
      result.push(chip.label);
    }
  }
  return result;
}

/**
 * Maps backend goal names back to frontend chip IDs.
 */
export function mapGoalNamesToChipIds(goalNames: string[]): string[] {
  const result: string[] = [];
  for (const name of goalNames) {
    const chip = NEED_STEP_CHIPS.find(
      (c) =>
        c.label.toLowerCase() === name.toLowerCase() ||
        c.id.toLowerCase() === name.toLowerCase()
    );
    if (chip) {
      result.push(chip.id);
    }
  }
  return result;
}

/**
 * Executes POST call to Jatayu AI Improvement API:
 * - Onboarding endpoint: POST /api/seeker/onboarding/ai-improve-needs
 * - Checkout/General endpoint: POST /api/seeker/ai-improve-needs
 *
 * Headers: Content-Type: application/json, Authorization: Bearer <seeker_jwt_token> (Optional)
 */
export async function callAiImproveNeeds(
  payload: AiImproveNeedsRequest,
  isOnboarding: boolean = false
): Promise<AiImproveNeedsResponse> {
  const token = getToken();
  const primaryEndpoint = isOnboarding
    ? `${BASE_URL}/api/seeker/onboarding/ai-improve-needs`
    : `${BASE_URL}/api/seeker/ai-improve-needs`;

  const fallbackEndpoint = isOnboarding
    ? `${BASE_URL}/api/seeker/ai-improve-needs`
    : `${BASE_URL}/api/seeker/onboarding/ai-improve-needs`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const requestBody = {
    subject: payload.subject || "",
    userText: payload.userText || "",
    selectedGoals: payload.selectedGoals || [],
  };

  console.log("[Seeker AI Improve API Request]:", requestBody);

  let response = await fetch(primaryEndpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });

  // If primary returns 404, attempt fallback endpoint
  if (!response.ok && response.status === 404) {
    response = await fetch(fallbackEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `AI Improvement failed (${response.status})`);
  }

  const data = (await response.json()) as AiImproveNeedsResponse;
  console.log("[Seeker AI Improve API Response]:", data);
  return data;
}
