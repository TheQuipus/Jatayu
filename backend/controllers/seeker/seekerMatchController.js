import { Seeker } from '../../models/index.js';
import { findFeaturedMatches, parseMatchLimit } from '../../services/seeker/seekerMatchService.js';

async function loadSeekerForMatchRequest(req) {
  const limit = parseMatchLimit(req.query.limit);
  if (limit === null) {
    throw Object.assign(new Error('limit must be an integer between 1 and 20'), { statusCode: 400 });
  }

  const seeker = await Seeker.findByPk(req.user.id);
  if (!seeker) {
    throw Object.assign(new Error('Seeker not found'), { statusCode: 404 });
  }

  return { limit, seeker };
}

function paginateResults(matches, page, limit) {
  const total = matches.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const offset = (safePage - 1) * limit;
  const paginated = matches.slice(offset, offset + limit);

  return {
    experts: paginated,
    suggestions: matches.slice(0, Math.min(total, 4)),
    count: total,
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}

export const getFeaturedMatches = async (req, res) => {
  try {
    const { limit, seeker } = await loadSeekerForMatchRequest(req);
    const matches = await findFeaturedMatches(seeker, undefined, req.query);
    const limitedMatches = matches.slice(0, limit);
    return res.status(200).json({
      matches: limitedMatches,
      count: limitedMatches.length,
      criteria: {
        category: seeker.category,
        topics: seeker.topics || [],
        selectedFormats: seeker.selectedFormats || [],
      },
    });
  } catch (error) {
    const status = error?.statusCode || 500;
    if (status === 400 || status === 404) {
      return res.status(status).json({ message: error.message });
    }
    console.error('Featured Seeker Matches Error:', error);
    return res.status(500).json({
      message: 'Server error retrieving featured matches',
      error: error.message,
    });
  }
};

export const getSeekerDiscover = async (req, res) => {
  try {
    const { limit, seeker } = await loadSeekerForMatchRequest(req);
    const page = Number.parseInt(req.query.page ?? '1', 10);
    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({ message: 'page must be a positive integer' });
    }

    const matches = await findFeaturedMatches(seeker, undefined, req.query);
    return res.status(200).json({
      ...paginateResults(matches, page, limit),
      criteria: {
        category: seeker.category,
        topics: seeker.topics || [],
        selectedFormats: seeker.selectedFormats || [],
      },
    });
  } catch (error) {
    const status = error?.statusCode || 500;
    if (status === 400 || status === 404) {
      return res.status(status).json({ message: error.message });
    }
    console.error('Seeker Discover Error:', error);
    return res.status(500).json({
      message: 'Server error retrieving seeker discover results',
      error: error.message,
    });
  }
};
