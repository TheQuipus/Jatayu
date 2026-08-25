/**
 * Jatayu AI Text Enhancement Engine for Seeker Needs & Context Steps
 */

export const AI_IMPROVEMENT_STYLES = [
  { id: "professional", label: "More Professional" },
  { id: "casual", label: "Casual" },
  { id: "concise", label: "More Concise" },
] as const;

export type AiImprovementStyleId = (typeof AI_IMPROVEMENT_STYLES)[number]["id"];

export const DEFAULT_AI_IMPROVE_HINT =
  "Select an AI style to preview and refine your question or goals.";

/**
 * Strips common conversational filler phrases and normalizes spacing/capitalization.
 */
function cleanRawInput(input: string): string {
  let cleaned = input.trim();
  if (!cleaned) return "";

  // Remove common prefix filler phrases
  const fillers = [
    /^i (?:just )?(?:want|need|would like) to (?:ask|know|get help with|understand|talk about|figure out)\s+/i,
    /^(?:basically|so|um|uh|hey|hi|hello|like|actually)\b,?\s*/i,
    /^(?:i'm looking for|looking for|i am looking for)\s+/i,
  ];

  for (const filler of fillers) {
    cleaned = cleaned.replace(filler, "");
  }

  cleaned = cleaned.trim();
  if (!cleaned) return input.trim();

  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Splits text into logical phrases or sentences
 */
function extractPoints(text: string): string[] {
  const cleaned = cleanRawInput(text);
  const parts = cleaned
    .split(/(?:\.|\n|;|\band\b|\balso\b)+/)
    .map((p) => p.trim().replace(/^[-•*]\s*/, ""))
    .filter((p) => p.length > 2);

  if (parts.length === 0) return [cleaned];
  return parts;
}

/**
 * Transforms user raw input into an AI-refined text based on the selected style.
 */
export function transformTextWithAi(
  currentText: string,
  styleId: AiImprovementStyleId | string
): string {
  const trimmed = currentText.trim();
  if (!trimmed) return currentText;

  const cleaned = cleanRawInput(trimmed);
  const points = extractPoints(trimmed);

  switch (styleId) {
    case "professional": {
      if (points.length === 1) {
        return `I am seeking expert advisory on the following challenge: ${cleaned}. Specifically, I would like to gain strategic insights and actionable next steps.`;
      }
      const bullets = points.map((pt) => `• ${pt.charAt(0).toUpperCase() + pt.slice(1)}`).join("\n");
      return `I am seeking expert guidance on the following objectives:\n${bullets}\n\nLooking forward to strategic recommendations and actionable insights.`;
    }

    case "casual": {
      if (points.length === 1) {
        return `Hey! I'm looking to get some quick advice on: ${cleaned.charAt(0).toLowerCase() + cleaned.slice(1)}. Excited to hear your thoughts and practical tips!`;
      }
      const list = points.map((p) => p.charAt(0).toLowerCase() + p.slice(1)).join(" and ");
      return `Hey! I'd love to bounce around a few ideas on ${list}. Excited to get your practical feedback!`;
    }

    case "concise": {
      if (points.length === 1) {
        const single = cleaned.replace(/\.$/, "");
        return `Seeking strategic guidance on ${single.charAt(0).toLowerCase() + single.slice(1)}.`;
      }
      const mainPoint = points[0];
      const secondPoint = points[1] ? ` Focus on ${points[1].charAt(0).toLowerCase() + points[1].slice(1)}.` : "";
      return `Seeking guidance on ${mainPoint.charAt(0).toLowerCase() + mainPoint.slice(1)}.${secondPoint}`;
    }

    case "structured": {
      const formattedPoints = points.map((pt, idx) => {
        const label = idx === 0 ? "Primary Goal" : idx === 1 ? "Key Challenge" : `Topic ${idx + 1}`;
        return `• ${label}: ${pt.charAt(0).toUpperCase() + pt.slice(1)}`;
      });
      return `Discussion Agenda & Objectives:\n${formattedPoints.join("\n")}`;
    }

    default:
      return trimmed;
  }
}

/**
 * Generates preview hint for AI improvement UI panels.
 */
export function getAiImprovementHint(
  styleId: AiImprovementStyleId | string | null,
  currentText: string
): string {
  if (!styleId || !currentText.trim()) {
    return DEFAULT_AI_IMPROVE_HINT;
  }
  return transformTextWithAi(currentText, styleId);
}

/**
 * Auto-generates or refines a crisp, professional question/topic subject from context text or current subject.
 */
export function generateAiSubject(contextText: string, currentSubject: string = ""): string {
  const subjectTrimmed = currentSubject.trim();
  if (subjectTrimmed) {
    const cleaned = cleanRawInput(subjectTrimmed).replace(/\.$/, "");
    return cleaned
      .split(" ")
      .map((word) =>
        ["pm", "nri", "ai", "seo", "saas", "api", "ui", "ux"].includes(word.toLowerCase())
          ? word.toUpperCase()
          : word.length > 2
          ? word.charAt(0).toUpperCase() + word.slice(1)
          : word
      )
      .join(" ");
  }

  const cleanedContext = cleanRawInput(contextText);
  if (!cleanedContext) return "Consultation Session & Guidance";

  const points = extractPoints(cleanedContext);
  const leadPoint = points[0] || cleanedContext;

  if (/product management|\bpm\b/i.test(leadPoint)) return "Career Transition: Product Management Strategy";
  if (/startup|fundraising|investor|seed|pitch/i.test(leadPoint)) return "Startup Growth & Fundraising Advisory";
  if (/legal|contract|compliance|agreement/i.test(leadPoint)) return "Legal & Compliance Consultation";
  if (/tax|finance|accounting|nri|audit/i.test(leadPoint)) return "Tax & Financial Advisory Session";
  if (/marketing|seo|growth|customer acquisition/i.test(leadPoint)) return "Marketing & Customer Acquisition Strategy";
  if (/career|job|interview|resume/i.test(leadPoint)) return "Career Development & Professional Guidance";

  const truncated = leadPoint.length > 55 ? leadPoint.slice(0, 52) + "..." : leadPoint;
  return truncated.charAt(0).toUpperCase() + truncated.slice(1);
}
