import { Seeker } from '../../models/index.js';
import { findFeaturedMatches, parseMatchLimit } from '../../services/seeker/seekerMatchService.js';

export const getFeaturedMatches = async (req, res) => {
  const limit = parseMatchLimit(req.query.limit);
  if (limit === null) {
    return res.status(400).json({ message: 'limit must be an integer between 1 and 20' });
  }

  try {
    const seeker = await Seeker.findByPk(req.user.id);
    if (!seeker) return res.status(404).json({ message: 'Seeker not found' });

    const matches = await findFeaturedMatches(seeker, limit);
    return res.status(200).json({
      matches,
      count: matches.length,
      criteria: {
        category: seeker.category,
        topics: seeker.topics || [],
        selectedFormats: seeker.selectedFormats || [],
      },
    });
  } catch (error) {
    console.error('Featured Seeker Matches Error:', error);
    return res.status(500).json({
      message: 'Server error retrieving featured matches',
      error: error.message,
    });
  }
};
