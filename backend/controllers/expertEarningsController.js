import { getExpertEarnings } from '../services/expertEarningsService.js';

export async function getEarnings(req, res) {
  try { return res.json(await getExpertEarnings(req.user.id)); }
  catch (error) {
    console.error('Expert earnings error:', error);
    return res.status(error.message === 'EXPERT_NOT_FOUND' ? 404 : 500).json({ message: 'Unable to load earnings', code: error.message });
  }
}
