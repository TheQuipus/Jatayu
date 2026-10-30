import { randomUUID } from "crypto";
import { Op, fn, col, literal } from "sequelize";
import {
  Booking,
  BookingReview,
  Notification,
  Seeker,
  SeekerCreditTransaction,
  seekerDb,
} from "../models/index.js";
const ADMIN_SEEKER_STATUSES = new Set([
  "active",
  "suspended",
  "flagged",
  "deleted",
]);
export const adminSeekerAction = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error("Admin seeker request failed:", error.message);
    res.status(500).json({ message: "Unable to process seeker request" });
  }
};
const numberParam = (value, fallback, maximum) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, 1), maximum)
    : fallback;
};
function serialize(seeker, stats = {}) {
  const data = seeker.toJSON();
  const metadata =
    data.onboardingMetadata && typeof data.onboardingMetadata === "object"
      ? data.onboardingMetadata
      : {};
  const normalizedStatus = ADMIN_SEEKER_STATUSES.has(data.status)
    ? data.status
    : data.status === "draft"
      ? "pending"
      : "active";
  return {
    id: data.id,
    name: data.fullName,
    email: data.email,
    phone: data.phone || "",
    avatar: data.profilePhotoSrc || "",
    city: data.location || "",
    location: data.location || "",
    totalBookings: Number(stats.totalBookings || 0),
    totalSpent: Number(stats.totalSpentPaise || 0) / 100,
    preferredCategory: data.category || "",
    category: data.category || "",
    topics: Array.isArray(data.topics) ? data.topics : [],
    needsSubject: metadata.needsSubject || metadata.subject || "",
    needsText: data.needsText || "",
    needChips: Array.isArray(data.selectedNeedChips)
      ? data.selectedNeedChips
      : [],
    formats: Array.isArray(data.selectedFormats) ? data.selectedFormats : [],
    budgetTier: data.selectedBudget || "",
    languages: Array.isArray(data.selectedLanguages)
      ? data.selectedLanguages
      : [],
    additionalContext: data.additionalContext || "",
    status: normalizedStatus,
    joinedDate: data.createdAt,
    lastActive: data.updatedAt,
    onboardingStep: data.onboardingStep,
    onboardingComplete: Boolean(data.onboardingCompletedAt),
    agreedToTerms: Boolean(data.termsAcceptedAt),
    profileBio: data.needsText || "",
    walletBalance: Number(data.credits || 0),
    isEmailVerified: Boolean(data.isEmailVerified),
    isPhoneVerified: Boolean(data.isPhoneVerified),
  };
}
function bookingStats(bookings) {
  return {
    totalBookings: bookings.length,
    totalSpentPaise: bookings
      .filter((item) =>
        ["paid", "paid_with_credits"].includes(item.paymentStatus),
      )
      .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
  };
}
export async function listAdminSeekers(req, res) {
  const page = numberParam(req.query.page, 1, 1000000);
  const limit = numberParam(req.query.limit, 100, 100);
  const search = String(req.query.search || "").trim();
  const requestedStatus = String(req.query.status || "all");
  const where = {};
  if (search) {
    const term = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
    where[Op.or] = ["fullName", "email", "phone", "location"].map((field) => ({
      [field]: { [Op.like]: term },
    }));
  }
  if (requestedStatus !== "all") {
    if (requestedStatus === "pending") where.status = "draft";
    else if (!ADMIN_SEEKER_STATUSES.has(requestedStatus))
      return res.status(422).json({ message: "Invalid seeker status filter" });
    else where.status = requestedStatus;
  }
  const { rows, count } = await Seeker.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset: (page - 1) * limit,
  });
  const ids = rows.map((item) => item.id);
  const aggregates = ids.length
    ? await Booking.findAll({
        attributes: [
          "seekerId",
          [fn("COUNT", col("id")), "totalBookings"],
          [
            fn(
              "COALESCE",
              fn(
                "SUM",
                literal(
                  "CASE WHEN paymentStatus IN ('paid', 'paid_with_credits') THEN totalAmount ELSE 0 END",
                ),
              ),
              0,
            ),
            "totalSpentPaise",
          ],
        ],
        where: { seekerId: { [Op.in]: ids } },
        group: ["seekerId"],
        raw: true,
      })
    : [];
  const statsBySeeker = new Map(
    aggregates.map((item) => [item.seekerId, item]),
  );
  const statusGroups = await Seeker.findAll({
    attributes: ["status", [fn("COUNT", col("id")), "count"]],
    group: ["status"],
    raw: true,
  });
  const counts = {
    all: 0,
    active: 0,
    suspended: 0,
    deleted: 0,
    flagged: 0,
    pending: 0,
  };
  statusGroups.forEach((item) => {
    const groupCount = Number(item.count || 0);
    const key = ADMIN_SEEKER_STATUSES.has(item.status)
      ? item.status
      : item.status === "draft"
        ? "pending"
        : "active";
    counts[key] = (counts[key] || 0) + groupCount;
    counts.all += groupCount;
  });
  return res.json({
    items: rows.map((item) => serialize(item, statsBySeeker.get(item.id))),
    counts,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
    },
  });
}
export async function getAdminSeeker(req, res) {
  const seeker = await Seeker.findByPk(req.params.seekerId);
  if (!seeker) return res.status(404).json({ message: "Seeker not found" });
  const bookings = await Booking.findAll({
    where: { seekerId: seeker.id },
    order: [["scheduledStartAt", "DESC"]],
  });
  const [reviews, unreadNotificationCount, creditTransactions] =
    await Promise.all([
      BookingReview.findAll({
        where: { seekerId: seeker.id },
        attributes: ["rating"],
      }),
      Notification.count({
        where: {
          recipientType: "seeker",
          recipientId: seeker.id,
          readAt: null,
        },
      }),
      SeekerCreditTransaction.findAll({
        where: { seekerId: seeker.id },
        order: [["createdAt", "DESC"]],
      }),
    ]);
  const completed = bookings.filter((item) => item.status === "completed");
  const types = Object.fromEntries(
    ["video", "audio", "text", "shoutout", "group"].map((type) => [
      type,
      bookings.filter((item) => item.consultationType === type).length,
    ]),
  );
  const creditSummary = creditTransactions.reduce(
    (summary, item) => {
      const amount = Number(item.amount || 0);
      if (amount > 0) summary.earned += amount;
      if (amount < 0) summary.spent += Math.abs(amount);
      if (amount > 0 && String(item.source).includes("refund"))
        summary.refunded += amount;
      return summary;
    },
    { earned: 0, spent: 0, refunded: 0 },
  );
  const totalDurationMinutes = completed.reduce(
    (sum, item) =>
      sum +
      Math.max(
        0,
        (new Date(item.scheduledEndAt) - new Date(item.scheduledStartAt)) /
          60000,
      ),
    0,
  );
  return res.json({
    seeker: serialize(seeker, bookingStats(bookings)),
    bookings: bookings.map((item) => ({
      id: item.id,
      expertId: item.expertId,
      subject: item.subject,
      context: item.context || "",
      expertName: item.expertName,
      expertProfessionalTitle: item.expertProfessionalTitle || "",
      expertProfilePhotoSrc: item.expertProfilePhotoSrc || "",
      status: item.status,
      consultationType: item.consultationType,
      scheduledStartAt: item.scheduledStartAt,
      scheduledEndAt: item.scheduledEndAt,
      createdAt: item.createdAt,
      amount: Number(item.totalAmount || 0) / 100,
      consultationFee: Number(item.consultationFee || 0) / 100,
      platformFee: Number(item.platformFee || 0) / 100,
      gst: Number(item.gst || 0) / 100,
      creditsUsed: Number(item.creditsUsed || 0),
      paymentStatus: item.paymentStatus,
    })),
    metrics: {
      completedBookings: completed.length,
      totalDurationMinutes,
      avgSessionDurationMinutes: completed.length
        ? Math.round(totalDurationMinutes / completed.length)
        : 0,
      ratingCount: reviews.length,
      avgRatingGiven: reviews.length
        ? Number(
            (
              reviews.reduce((sum, item) => sum + item.rating, 0) /
              reviews.length
            ).toFixed(1),
          )
        : null,
      consultationTypes: types,
    },
    verification: {
      emailVerified: Boolean(seeker.isEmailVerified),
      phoneVerified: Boolean(seeker.isPhoneVerified),
      providers: [
        seeker.googleId ? "google" : null,
        seeker.linkedinId ? "linkedin" : null,
      ].filter(Boolean),
    },
    // These interactions are not yet recorded by the platform. Explicit empty arrays
    // prevent the admin UI from showing fabricated saved/viewed experts or campaigns.
    notifications: { unreadCount: unreadNotificationCount },
    credits: {
      balance: Number(seeker.credits || 0),
      earned: creditSummary.earned,
      spent: creditSummary.spent,
      refunded: creditSummary.refunded,
      transactions: creditTransactions.map((item) => ({
        id: item.id,
        amount: Number(item.amount),
        balanceAfter: Number(item.balanceAfter),
        type: item.type,
        source: item.source,
        reference: item.reference,
        description: item.description || "",
        createdAt: item.createdAt,
      })),
    },
    engagement: { savedExperts: [], recentlyViewed: [], automatedOffers: [] },
  });
}
export async function updateAdminSeekerStatus(req, res) {
  const status = String(req.body.status || "");
  if (!["active", "suspended", "flagged"].includes(status))
    return res
      .status(422)
      .json({ message: "Status must be active, suspended, or flagged" });
  const seeker = await Seeker.findByPk(req.params.seekerId);
  if (!seeker) return res.status(404).json({ message: "Seeker not found" });
  if (seeker.status === "deleted")
    return res
      .status(409)
      .json({ message: "Deleted seeker accounts cannot be updated" });
  await seeker.update({ status });
  return res.json({
    message: "Seeker status updated",
    seeker: serialize(seeker),
  });
}

export async function grantAdminSeekerCredits(req, res) {
  const amount = req.body.amount;
  const description =
    typeof req.body.description === "string" ? req.body.description.trim() : "";
  if (!Number.isInteger(amount) || amount < 1 || amount > 100000)
    return res
      .status(422)
      .json({
        message: "Credit amount must be a whole number between 1 and 100000",
      });
  if (description.length > 255)
    return res
      .status(422)
      .json({ message: "Description must not exceed 255 characters" });

  const result = await seekerDb.transaction(async (transaction) => {
    const seeker = await Seeker.findByPk(req.params.seekerId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!seeker) return null;
    if (seeker.status === "deleted") {
      return { conflict: true };
    }
    const balanceAfter = Number(seeker.credits || 0) + amount;
    if (balanceAfter > 4294967295) return { conflict: true };
    const creditTransaction = await SeekerCreditTransaction.create(
      {
        seekerId: seeker.id,
        amount,
        balanceAfter,
        type: "credit",
        source: "admin_adjustment",
        reference: randomUUID(),
        description: description || "Credits added by an administrator",
        metadata: { adminId: req.admin.id },
      },
      { transaction },
    );
    await seeker.update({ credits: balanceAfter }, { transaction });
    return { balance: balanceAfter, transaction: creditTransaction };
  });
  if (!result) return res.status(404).json({ message: "Seeker not found" });
  if (result.conflict)
    return res
      .status(409)
      .json({ message: "Credits cannot be added to this account" });
  return res
    .status(201)
    .json({
      message: "Credits added successfully",
      credits: result.balance,
      transaction: result.transaction,
    });
}

function notificationCategory(eventType = "") {
  if (/booking|session/.test(eventType)) return "bookings";
  if (/chat|message/.test(eventType)) return "messages";
  if (/payment|refund|credit|payout/.test(eventType)) return "payments";
  if (/expert/.test(eventType)) return "expert_updates";
  return "system";
}
function serializeNotification(notification) {
  const item = notification.toJSON();
  return {
    id: item.id,
    eventType: item.eventType,
    title: item.title,
    body: item.body,
    href: item.href || "",
    data: item.data || {},
    readAt: item.readAt,
    createdAt: item.createdAt,
    category: notificationCategory(item.eventType),
  };
}
export async function listAdminSeekerNotifications(req, res) {
  const seeker = await Seeker.findByPk(req.params.seekerId, {
    attributes: ["id"],
  });
  if (!seeker) return res.status(404).json({ message: "Seeker not found" });
  const items = await Notification.findAll({
    where: { recipientType: "seeker", recipientId: seeker.id },
    order: [["createdAt", "DESC"]],
  });
  const unreadCount = await Notification.count({
    where: { recipientType: "seeker", recipientId: seeker.id, readAt: null },
  });
  return res.json({ items: items.map(serializeNotification), unreadCount });
}
export async function markAdminSeekerNotificationRead(req, res) {
  const item = await Notification.findOne({
    where: {
      id: req.params.notificationId,
      recipientType: "seeker",
      recipientId: req.params.seekerId,
    },
  });
  if (!item) return res.status(404).json({ message: "Notification not found" });
  item.readAt ||= new Date();
  await item.save();
  return res.json({ notification: serializeNotification(item) });
}
