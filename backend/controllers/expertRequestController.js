import {
  decideExpertRequest,
  listExpertRequests,
} from '../services/expert/expertRequestService.js';

const ALLOWED_STATUSES = new Set(['all', 'new', 'pending', 'accepted', 'declined']);
const ERROR_RESPONSES = {
  EXPERT_NOT_FOUND: [403, 'Authenticated expert account was not found'],
  REQUEST_NOT_FOUND: [404, 'Booking request not found'],
  INVALID_DECISION: [422, 'decision must be accepted or declined'],
  INVALID_DECLINE_REASON: [422, 'A supported reasonCode is required when declining'],
  DECLINE_NOTES_TOO_LONG: [422, 'reasonNotes cannot exceed 1000 characters'],
  REQUEST_ALREADY_DECIDED: [409, 'This request has already received the opposite decision'],
  REQUEST_NOT_DECIDABLE: [409, 'This booking is not awaiting an expert decision'],
  PAYMENT_NOT_CAPTURED: [409, 'The captured booking payment could not be found'],
};

function handleError(error, res, operation) {
  const [status, message] = ERROR_RESPONSES[error.message] || [500, `Unable to ${operation}`];
  if (status === 500) console.error(`Expert Request ${operation} Error:`, error);
  return res.status(status).json({ message, code: error.message });
}

export async function getRequests(req, res) {
  const status = String(req.query.status || 'all').toLowerCase();
  const sort = String(req.query.sort || 'newest').toLowerCase();
  const page = Number.parseInt(req.query.page || '1', 10);
  const limit = Number.parseInt(req.query.limit || '20', 10);
  if (!ALLOWED_STATUSES.has(status)) return res.status(422).json({ message: 'Invalid status filter' });
  if (!['newest', 'oldest'].includes(sort)) return res.status(422).json({ message: 'sort must be newest or oldest' });
  if (!Number.isInteger(page) || page < 1) return res.status(422).json({ message: 'page must be a positive integer' });
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(422).json({ message: 'limit must be between 1 and 100' });
  }
  try {
    return res.status(200).json(await listExpertRequests(req.user.id, { status, sort, page, limit }));
  } catch (error) {
    return handleError(error, res, 'list requests');
  }
}

export async function updateRequestDecision(req, res) {
  try {
    const request = await decideExpertRequest(req.user.id, req.params.bookingId, req.body || {});
    return res.status(200).json({
      message: request.requestStatus === 'accepted'
        ? 'Booking request accepted'
        : request.paymentStatus === 'refunded'
          ? 'Booking request declined and refund completed'
          : 'Booking request declined and refund initiated',
      request,
    });
  } catch (error) {
    return handleError(error, res, 'update decision');
  }
}
