import type { ApplicationStatus } from "./expertApplicationSubmission";
import { updateAdminApplicationStatus } from "./api";
import { mapBackendExpertToApplication, type BackendExpertApplication } from "./backendApplicationMapper";
import type { ExpertApplicationSubmission } from "./expertApplicationSubmission";

export const APPLICATIONS_UPDATED_EVENT = "expert-applications-updated";

function dispatchUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(APPLICATIONS_UPDATED_EVENT));
}

export async function updateExpertApplicationStatus(
  appId: string,
  status: ApplicationStatus,
  reviewerNote?: string,
): Promise<ExpertApplicationSubmission> {
  const response = await updateAdminApplicationStatus(appId, {
    status,
    reviewerNote,
  });

  dispatchUpdated();
  return mapBackendExpertToApplication(response.expert as BackendExpertApplication);
}

export async function updateExpertApplicationReviewerNote(
  appId: string,
  reviewerNote: string,
): Promise<ExpertApplicationSubmission> {
  const { getAdminApplication } = await import("./api");
  const current = await getAdminApplication(appId);
  const currentStatus =
    (current.frontendStatus as ApplicationStatus | undefined) ||
    (current.status === "pending_review" ? "pending" : (current.status as ApplicationStatus));

  return updateExpertApplicationStatus(appId, currentStatus, reviewerNote);
}

// Re-export helpers used by admin UI mappers
export {
  computeCompleteness,
  formatSubmittedDate,
  getAskedRate,
  getCategoryColor,
  getExperienceYearsLabel,
  getSlaStatus,
  getSubmittedAgo,
  buildPricingMenu,
} from "./expertApplicationsStore";
