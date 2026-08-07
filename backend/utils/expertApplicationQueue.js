import { generateApplicationNumber } from './applicationNumber.js';

/**
 * Move a newly signed-up expert into the admin application queue.
 * Called when signup is complete (OTP verified or OAuth signup).
 */
export async function promoteExpertToApplicationQueue(expert) {
  if (expert.status !== 'draft') {
    return expert;
  }

  if (!expert.applicationNumber) {
    expert.applicationNumber = await generateApplicationNumber();
  }

  if (!expert.submittedAt) {
    expert.submittedAt = expert.createdAt || new Date();
  }

  expert.status = 'pending_review';
  await expert.save();
  return expert;
}
