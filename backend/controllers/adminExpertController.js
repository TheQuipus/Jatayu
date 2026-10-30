import { Op, fn, col, literal } from 'sequelize';
import {
  Expert,
  Booking,
  BookingReview,
  Credential,
  Availability,
  Notification,
} from '../models/index.js';

const MANAGED_EXPERT_STATUSES = ['approved', 'active', 'on_hold', 'suspended'];

export const adminExpertAction = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('Admin expert request failed:', error.message, error.stack);
    res.status(500).json({ message: 'Unable to process expert request', error: error.message });
  }
};

const numberParam = (value, fallback, maximum) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), maximum) : fallback;
};

export function formatClosedSla(submittedAt, approvedAt) {
  if (!submittedAt || !approvedAt) return '—';
  const start = new Date(submittedAt).getTime();
  const end = new Date(approvedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '—';

  const totalMinutes = Math.round((end - start) / (1000 * 60));
  if (totalMinutes < 1) return '< 1 min';
  if (totalMinutes < 60) return `${totalMinutes} mins`;

  const days = Math.floor(totalMinutes / (60 * 24));
  const remainingHours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const remainingMins = totalMinutes % 60;

  if (days > 0) {
    return remainingHours > 0
      ? `${days} day${days === 1 ? '' : 's'} ${remainingHours} hr${remainingHours === 1 ? '' : 's'}`
      : `${days} day${days === 1 ? '' : 's'}`;
  }

  if (remainingMins > 0) {
    return `${remainingHours} hr${remainingHours === 1 ? '' : 's'} ${remainingMins} min${remainingMins === 1 ? '' : 's'}`;
  }

  return `${remainingHours} hr${remainingHours === 1 ? '' : 's'}`;
}

function formatRelativeTime(date) {
  if (!date) return 'Just now';
  const diffMs = Date.now() - new Date(date).getTime();
  if (diffMs < 0) return 'Just now';
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function serializeExpertUser(expert, stats = {}) {
  const data = expert.toJSON ? expert.toJSON() : expert;
  const metadata = data.onboardingMetadata && typeof data.onboardingMetadata === 'object'
    ? data.onboardingMetadata
    : {};

  let normalizedStatus = 'active';
  if (data.status === 'on_hold') normalizedStatus = 'on_hold';
  else if (data.status === 'suspended') normalizedStatus = 'suspended';
  else if (data.status === 'approved' || data.status === 'active') normalizedStatus = 'active';

  const city =
    metadata.city ||
    metadata.location ||
    (data.timezone ? data.timezone.split('/').pop()?.replace(/_/g, ' ') : '') ||
    'India';

  const subCategory =
    data.professionalTitle ||
    (Array.isArray(data.skills) && data.skills[0]) ||
    (Array.isArray(data.focusAreas) && data.focusAreas[0]) ||
    data.category ||
    'Specialist';

  const hourlyRate =
    (data.formatPrices && typeof data.formatPrices === 'object' && (data.formatPrices['60'] || (data.formatPrices['30'] ? data.formatPrices['30'] * 2 : 0))) ||
    1500;

  const approvalDate = data.approvedAt || (['approved', 'active', 'on_hold', 'suspended'].includes(data.status) ? data.updatedAt : null);
  const closedSla = formatClosedSla(data.submittedAt, approvalDate);

  return {
    id: data.id,
    applicationNumber: data.applicationNumber || '',
    name: data.fullName,
    email: data.email,
    phone: data.phone || '',
    avatar: data.profilePhotoSrc || '/assets/img/manportrait.png',
    category: data.category || 'General Consulting',
    subCategory,
    rating: Number(stats.avgRating || 5.0),
    reviewCount: Number(stats.reviewCount || 0),
    reviewsCount: Number(stats.reviewCount || 0),
    totalSessions: Number(stats.totalBookings || 0),
    completedSessions: Number(stats.completedBookings || 0),
    totalEarnings: Number(stats.totalEarningsPaise || 0) / 100,
    hourlyRate: Number(hourlyRate),
    status: normalizedStatus,
    rawStatus: data.status,
    joinedDate: formatDate(approvalDate || data.createdAt),
    lastActive: formatRelativeTime(data.updatedAt),
    city,
    location: `${city}, India`,
    bio: data.bio || data.tagLine || '',
    closedSla,
    submittedAt: data.submittedAt,
    approvedAt: data.approvedAt || approvalDate,
    onboardingStep: data.onboardingStep,
  };
}

/**
 * List all approved/managed experts for User Management -> Expert
 */
export async function listAdminExperts(req, res) {
  const page = numberParam(req.query.page, 1, 1000000);
  const limit = numberParam(req.query.limit, 100, 100);
  const search = String(req.query.search || '').trim();
  const requestedStatus = String(req.query.status || 'all');

  const where = {
    status: { [Op.in]: MANAGED_EXPERT_STATUSES },
  };

  if (search) {
    const term = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    where[Op.or] = ['fullName', 'email', 'phone', 'applicationNumber', 'category'].map((field) => ({
      [field]: { [Op.like]: term },
    }));
  }

  if (requestedStatus !== 'all') {
    if (requestedStatus === 'active') {
      where.status = { [Op.in]: ['approved', 'active'] };
    } else if (requestedStatus === 'on_hold') {
      where.status = 'on_hold';
    } else if (requestedStatus === 'suspended') {
      where.status = 'suspended';
    } else {
      return res.status(422).json({ message: 'Invalid expert status filter' });
    }
  }

  const { rows, count } = await Expert.findAndCountAll({
    where,
    order: [['approvedAt', 'DESC'], ['updatedAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  const ids = rows.map((item) => item.id);

  // Booking stats from Seeker DB if any
  let aggregates = [];
  try {
    aggregates = ids.length
      ? await Booking.findAll({
          attributes: [
            'expertId',
            [fn('COUNT', col('id')), 'totalBookings'],
            [
              fn(
                'COALESCE',
                fn(
                  'SUM',
                  literal(
                    "CASE WHEN paymentStatus IN ('paid', 'paid_with_credits') THEN totalAmount ELSE 0 END"
                  )
                ),
                0
              ),
              'totalEarningsPaise',
            ],
            [
              fn(
                'COUNT',
                literal("CASE WHEN status = 'completed' THEN 1 ELSE NULL END")
              ),
              'completedBookings',
            ],
          ],
          where: { expertId: { [Op.in]: ids } },
          group: ['expertId'],
          raw: true,
        })
      : [];
  } catch (err) {
    console.warn('Could not aggregate bookings for admin experts:', err.message);
  }

  const statsByExpert = new Map(aggregates.map((item) => [item.expertId, item]));

  // Grouped database count for all managed experts
  const statusGroupCounts = await Expert.findAll({
    attributes: [
      'status',
      [fn('COUNT', col('id')), 'count'],
    ],
    where: { status: { [Op.in]: MANAGED_EXPERT_STATUSES } },
    group: ['status'],
    raw: true,
  });

  const counts = {
    all: 0,
    active: 0,
    on_hold: 0,
    suspended: 0,
  };

  statusGroupCounts.forEach((item) => {
    const total = Number(item.count || 0);
    counts.all += total;
    if (item.status === 'on_hold') {
      counts.on_hold += total;
    } else if (item.status === 'suspended') {
      counts.suspended += total;
    } else {
      // 'approved' and 'active' map to active managed experts
      counts.active += total;
    }
  });

  return res.json({
    items: rows.map((item) => serializeExpertUser(item, statsByExpert.get(item.id))),
    counts,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
    },
  });
}

/**
 * Get single expert details for /admin/users/experts/:expertId
 */
export async function getAdminExpert(req, res) {
  const { expertId } = req.params;

  const expert = await Expert.findOne({
    where: {
      [Op.or]: [{ id: expertId }, { applicationNumber: expertId }],
    },
    include: [
      { model: Credential, as: 'credentials', required: false },
      { model: Availability, as: 'availabilities', required: false },
    ],
  });

  if (!expert) {
    return res.status(404).json({ message: 'Expert not found' });
  }

  let bookings = [];
  try {
    bookings = await Booking.findAll({
      where: { expertId: expert.id },
      order: [['scheduledStartAt', 'DESC']],
    });
  } catch (err) {
    console.warn('Could not load bookings for expert detail:', err.message);
  }

  const completed = bookings.filter((item) => item.status === 'completed');
  const totalEarningsPaise = bookings
    .filter((item) => ['paid', 'paid_with_credits'].includes(item.paymentStatus))
    .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

  const stats = {
    totalBookings: bookings.length,
    completedBookings: completed.length,
    totalEarningsPaise,
  };

  return res.json({
    expert: serializeExpertUser(expert, stats),
    bookings: bookings.map((item) => ({
      id: item.id,
      seekerId: item.seekerId,
      seekerName: item.seekerName,
      subject: item.subject,
      status: item.status,
      consultationType: item.consultationType,
      scheduledStartAt: item.scheduledStartAt,
      scheduledEndAt: item.scheduledEndAt,
      createdAt: item.createdAt,
      amount: Number(item.totalAmount || 0) / 100,
      paymentStatus: item.paymentStatus,
    })),
    credentials: expert.credentials || [],
    availabilities: expert.availabilities || [],
  });
}

/**
 * Update expert user status (active, on_hold, suspended)
 */
export async function updateAdminExpertStatus(req, res) {
  const { expertId } = req.params;
  const { status } = req.body;

  const validStatuses = ['active', 'on_hold', 'suspended'];
  if (!validStatuses.includes(status)) {
    return res.status(422).json({ message: 'Status must be active, on_hold, or suspended' });
  }

  const expert = await Expert.findOne({
    where: {
      [Op.or]: [{ id: expertId }, { applicationNumber: expertId }],
    },
  });

  if (!expert) {
    return res.status(404).json({ message: 'Expert not found' });
  }

  // When admin sets status to active, store 'active' in DB
  expert.status = status;
  await expert.save();

  return res.json({
    message: 'Expert status updated successfully',
    expert: serializeExpertUser(expert),
  });
}
