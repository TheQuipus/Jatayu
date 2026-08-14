import {
  findPublicExpertById,
  findPublicExperts,
  parsePublicExpertListQuery,
  serializePublicExpert,
} from '../services/publicExpertService.js';

export const getPublicExperts = async (req, res) => {
  const filters = parsePublicExpertListQuery(req.query);
  if (filters.errors.length > 0) {
    return res.status(422).json({ message: 'Invalid expert filters', errors: filters.errors });
  }
  try {
    return res.status(200).json(await findPublicExperts(filters));
  } catch (error) {
    console.error('Get Public Experts Error:', error);
    return res.status(500).json({ message: 'Server error retrieving experts' });
  }
};

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
