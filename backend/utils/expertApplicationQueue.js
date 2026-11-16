import { generateApplicationNumber } from './applicationNumber.js';

/**
 * Initialize newly signed-up expert into the admin application queue.
 * Called when signup is complete (OTP verified or OAuth signup).
 * Keep status as 'draft' and submittedAt as null so SLA timer does NOT start.
 * The application is visible under the "Not Submitted" card in Admin Console
 * until the expert submits onboarding for review.
 */
export async function promoteExpertToApplicationQueue(expert) {
  let changed = false;

  if (!expert.applicationNumber) {
    expert.applicationNumber = await generateApplicationNumber();
    changed = true;
  }

  // Ensure submittedAt is not set prematurely on draft profiles
  if (expert.status === 'draft' && expert.submittedAt) {
    expert.submittedAt = null;
    changed = true;
  }

  if (changed) {
    await expert.save();
  }
  return expert;
}
