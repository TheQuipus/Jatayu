import { findPublicExpertById, serializePublicExpert } from '../services/publicExpertService.js';

export const getPublicExpert = async (req, res) => {
  try {
    const expert = await findPublicExpertById(req.params.expertId);

    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    return res.status(200).json({ expert: serializePublicExpert(expert) });
  } catch (error) {
    console.error('Get Public Expert Error:', error);
    return res.status(500).json({
      message: 'Server error retrieving expert details',
      error: error.message,
    });
  }
};
