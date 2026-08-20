import type { ExpertApplicationSubmission } from "./expertApplicationSubmission";
import { getDefaultReviewAppId } from "./adminApplicationReview";

const DEFAULT_APP_ID = getDefaultReviewAppId();

/** Shared demo expert detail page (ExpertDetail / seeker preview). */
export const ADMIN_EXPERT_DETAIL_HREF = `/admin/expert-profile/${DEFAULT_APP_ID}`;

export function getAdminReviewHref(appId: string): string {
  return `/admin/review/${appId}`;
}

/** First item in the demo review queue. */
export const ADMIN_REVIEW_HREF = getAdminReviewHref(DEFAULT_APP_ID);

export function getReviewQueueApplications(
  applications: ExpertApplicationSubmission[],
): ExpertApplicationSubmission[] {
  return applications.filter(
    (application) => application.status === "pending" || application.status === "in_review",
  );
}

export function getReviewQueueAppIds(applications: ExpertApplicationSubmission[]): string[] {
  return getReviewQueueApplications(applications).map((application) => application.appId);
}

export function getAdjacentReviewAppId(
  applications: ExpertApplicationSubmission[],
  currentAppId: string,
  direction: "prev" | "next",
): string | null {
  const queue = getReviewQueueAppIds(applications);
  const index = queue.indexOf(currentAppId);

  if (index === -1) {
    return direction === "next" ? (queue[0] ?? null) : (queue[queue.length - 1] ?? null);
  }

  if (direction === "prev") {
    return index > 0 ? queue[index - 1] : null;
  }

  return index < queue.length - 1 ? queue[index + 1] : null;
}

export function getFirstReviewAppId(applications: ExpertApplicationSubmission[]): string | null {
  return getReviewQueueAppIds(applications)[0] ?? applications[0]?.appId ?? null;
}
