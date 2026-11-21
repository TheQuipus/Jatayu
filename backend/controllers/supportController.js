import { Op } from 'sequelize';
import {
  adminDb,
  Admin,
  Expert,
  Seeker,
  SupportReply,
  SupportTicket,
} from '../models/index.js';
import { sendGenericEmail } from '../utils/emailService.js';
import { getDatabaseSetting } from '../utils/settingsHelper.js';
import { generateSupportTicketNumber } from '../utils/supportTicketNumber.js';
import { isSeekerSuspended } from './seeker/seekerAuthController.js';

export const PREDEFINED_SUPPORT_SUBJECTS = Object.freeze([
  'Booking & Scheduling Issue',
  'Payment, Wallet & Refunds',
  'Session / Video & Audio Quality',
  'Account, Login & Verification',
  'Profile & Onboarding Help',
  'Report Expert / Client Behaviour',
  'Technical Bug',
  'Other',
]);

const PREDEFINED_SUBJECT_SET = new Set(PREDEFINED_SUPPORT_SUBJECTS);
const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const SUBMISSION_WINDOW_MS = 60 * 1000;
const SUBMISSION_MAX_PER_WINDOW = 5;
const submissionRateTracker = new Map();

export function resetSupportRateLimiter() {
  submissionRateTracker.clear();
}

function checkSupportRateLimit(key, now = Date.now()) {
  const existing = submissionRateTracker.get(key) || [];
  const recent = existing.filter((timestamp) => now - timestamp < SUBMISSION_WINDOW_MS);
  if (recent.length >= SUBMISSION_MAX_PER_WINDOW) {
    const oldest = recent[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((SUBMISSION_WINDOW_MS - (now - oldest)) / 1000));
    submissionRateTracker.set(key, recent);
    return { allowed: false, retryAfterSeconds };
  }
  recent.push(now);
  submissionRateTracker.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function normalizeSupportPhone(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 13 && digits.startsWith('910')) {
    digits = digits.slice(3);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

const HTML_TAG_OR_ANGLE_PATTERN = /[<>]/;

export function validateSupportTicketInput(payload = {}) {
  const errors = {};
  const rawEmail = typeof payload.email === 'string' ? payload.email.trim() : '';
  const rawPhone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
  const rawSubject = typeof payload.subject === 'string' ? payload.subject.trim() : '';
  const rawDescription = typeof payload.description === 'string' ? payload.description.trim() : '';

  if (!rawEmail) {
    errors.email = 'Email address is required';
  } else if (rawEmail.length > 254 || !EMAIL_PATTERN.test(rawEmail)) {
    errors.email = 'Enter a valid email address';
  }

  const normalizedPhone = normalizeSupportPhone(rawPhone);
  if (!rawPhone) {
    errors.phone = 'Mobile number is required';
  } else if (!/^\d{10}$/.test(normalizedPhone)) {
    errors.phone = 'Enter a valid 10-digit mobile number';
  }

  if (!rawSubject) {
    errors.subject = 'Subject is required';
  } else if (!PREDEFINED_SUBJECT_SET.has(rawSubject)) {
    if (rawSubject.length < 2 || rawSubject.length > 120) {
      errors.subject = 'Subject must be between 2 and 120 characters';
    } else if (HTML_TAG_OR_ANGLE_PATTERN.test(rawSubject)) {
      errors.subject = 'Subject must contain plain text only (no HTML tags)';
    }
  }

  if (!rawDescription) {
    errors.description = 'Issue description is required';
  } else if (rawDescription.length < 1 || rawDescription.length > 160) {
    errors.description = 'Issue description must be between 1 and 160 characters';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values: {
      email: rawEmail.toLowerCase(),
      phone: normalizedPhone,
      subject: rawSubject,
      description: rawDescription,
    },
  };
}

async function resolveRequesterAccount(user) {
  const role = user?.role === 'seeker' ? 'seeker' : user?.role === 'expert' ? 'expert' : null;
  if (!role || !user?.id) {
    return { error: { status: 403, message: 'Only signed-in seekers and experts can access support' } };
  }

  if (role === 'seeker') {
    const seeker = await Seeker.findByPk(user.id, {
      attributes: ['id', 'fullName', 'email', 'phone', 'status', 'onboardingMetadata'],
    });
    if (!seeker) {
      return { error: { status: 401, message: 'Not authorized, seeker account not found' } };
    }
    if (isSeekerSuspended(seeker)) {
      return {
        error: {
          status: 403,
          message: 'Your Profile has been suspended. Contact Us?',
          code: 'ACCOUNT_SUSPENDED',
        },
      };
    }
    if (seeker.status === 'deleted') {
      return {
        error: {
          status: 403,
          message: 'Your account has been deleted.',
          code: 'ACCOUNT_DELETED',
        },
      };
    }
    return {
      requester: {
        id: seeker.id,
        role: 'seeker',
        fullName: seeker.fullName || user.fullName || 'Seeker',
        email: seeker.email || user.email || '',
        phone: normalizeSupportPhone(seeker.phone || ''),
      },
    };
  }

  const expert = await Expert.findByPk(user.id, {
    attributes: ['id', 'fullName', 'email', 'phone', 'status'],
  });
  if (!expert) {
    return { error: { status: 401, message: 'Not authorized, expert account not found' } };
  }

  return {
    requester: {
      id: expert.id,
      role: 'expert',
      fullName: expert.fullName || user.fullName || 'Expert',
      email: expert.email || user.email || '',
      phone: normalizeSupportPhone(expert.phone || ''),
    },
  };
}

function buildAdminSupportTicketEmail({ ticket, submittedAt }) {
  const formattedDate = new Date(submittedAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const roleLabel = ticket.requesterType === 'expert' ? 'Expert' : 'Seeker';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; color: #0B0D14;">
      <h2 style="margin-bottom: 12px; color: #E53B17;">New Support Request (${escapeHtml(ticket.ticketNumber)})</h2>
      <p>A new support ticket has been submitted on Jatayu Connect.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #E6E6E6; font-weight: 600; width: 160px;">Ticket Number</td>
          <td style="padding: 8px; border: 1px solid #E6E6E6;">${escapeHtml(ticket.ticketNumber)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #E6E6E6; font-weight: 600;">Requester Name</td>
          <td style="padding: 8px; border: 1px solid #E6E6E6;">${escapeHtml(ticket.requesterName)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #E6E6E6; font-weight: 600;">Role</td>
          <td style="padding: 8px; border: 1px solid #E6E6E6;">${escapeHtml(roleLabel)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #E6E6E6; font-weight: 600;">Email Address</td>
          <td style="padding: 8px; border: 1px solid #E6E6E6;">${escapeHtml(ticket.email)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #E6E6E6; font-weight: 600;">Mobile Number</td>
          <td style="padding: 8px; border: 1px solid #E6E6E6;">+91 ${escapeHtml(ticket.phone)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #E6E6E6; font-weight: 600;">Subject</td>
          <td style="padding: 8px; border: 1px solid #E6E6E6;">${escapeHtml(ticket.subject)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #E6E6E6; font-weight: 600;">Issue Description</td>
          <td style="padding: 8px; border: 1px solid #E6E6E6;">${escapeHtml(ticket.description)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #E6E6E6; font-weight: 600;">Submitted At</td>
          <td style="padding: 8px; border: 1px solid #E6E6E6;">${escapeHtml(formattedDate)} (IST)</td>
        </tr>
      </table>
    </div>
  `;

  const textContent = [
    `New Support Request (${ticket.ticketNumber})`,
    `Requester Name: ${ticket.requesterName}`,
    `Role: ${roleLabel}`,
    `Email Address: ${ticket.email}`,
    `Mobile Number: +91 ${ticket.phone}`,
    `Subject: ${ticket.subject}`,
    `Issue Description: ${ticket.description}`,
    `Submitted At: ${formattedDate} (IST)`,
  ].join('\n');

  return {
    subject: `[Support ${ticket.ticketNumber}] ${ticket.subject} — ${ticket.requesterName} (${roleLabel})`,
    htmlContent,
    textContent,
  };
}

function buildRequesterReplyEmail({ ticket, replyMessage, fromEmail }) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; color: #0B0D14;">
      <h2 style="margin-bottom: 12px; color: #E53B17;">Update on your Support Request (${escapeHtml(ticket.ticketNumber)})</h2>
      <p>Hello ${escapeHtml(ticket.requesterName)},</p>
      <p>Our support team has replied to your enquiry regarding <strong>${escapeHtml(ticket.subject)}</strong>:</p>
      <div style="padding: 14px 16px; background: #F8F8F8; border-left: 4px solid #E53B17; margin: 16px 0; white-space: pre-wrap;">${escapeHtml(replyMessage)}</div>
      <p style="font-size: 13px; color: #555;">
        <strong>Your Original Issue:</strong><br/>
        ${escapeHtml(ticket.description)}
      </p>
      <p style="font-size: 12px; color: #888;">Sent from ${escapeHtml(fromEmail)}</p>
    </div>
  `;

  const textContent = [
    `Hello ${ticket.requesterName},`,
    '',
    `Our support team has replied to your enquiry (${ticket.ticketNumber} - ${ticket.subject}):`,
    '',
    replyMessage,
    '',
    `Your Original Issue: ${ticket.description}`,
  ].join('\n');

  return {
    subject: `Re: [${ticket.ticketNumber}] ${ticket.subject}`,
    htmlContent,
    textContent,
  };
}

function serializeTicket(ticket) {
  const data = ticket.toJSON ? ticket.toJSON() : { ...ticket };
  return {
    id: data.id,
    ticketNumber: data.ticketNumber,
    requesterType: data.requesterType,
    requesterId: data.requesterId,
    requesterName: data.requesterName,
    email: data.email,
    phone: data.phone,
    subject: data.subject,
    description: data.description,
    status: data.status,
    adminNotifiedAt: data.adminNotifiedAt,
    lastRepliedAt: data.lastRepliedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    ...(Array.isArray(data.replies)
      ? {
          replies: data.replies.map((reply) => ({
            id: reply.id,
            ticketId: reply.ticketId,
            adminId: reply.adminId,
            adminName: reply.adminName,
            fromEmail: reply.fromEmail,
            toEmail: reply.toEmail,
            message: reply.message,
            createdAt: reply.createdAt,
          })),
        }
      : {}),
  };
}

export async function getSupportMe(req, res) {
  try {
    const resolved = await resolveRequesterAccount(req.user);
    if (resolved.error) {
      return res.status(resolved.error.status).json({
        message: resolved.error.message,
        ...(resolved.error.code ? { code: resolved.error.code } : {}),
      });
    }

    return res.status(200).json({
      user: resolved.requester,
      categories: PREDEFINED_SUPPORT_SUBJECTS,
    });
  } catch (error) {
    console.error('[Support] Failed to load requester profile:', error.message);
    return res.status(500).json({ message: 'Unable to load support profile' });
  }
}

const MAX_TICKET_NUMBER_RETRIES = 5;

function isTicketNumberUniqueConflict(error) {
  if (!error) return false;
  if (error.name === 'SequelizeUniqueConstraintError') return true;
  if (error.parent?.code === 'ER_DUP_ENTRY' || error.original?.code === 'ER_DUP_ENTRY') return true;
  return /ticketNumber|support_tickets_ticket_number_unique|Duplicate entry/i.test(String(error.message || ''));
}

export async function createSupportTicket(req, res) {
  try {
    const resolved = await resolveRequesterAccount(req.user);
    if (resolved.error) {
      return res.status(resolved.error.status).json({
        message: resolved.error.message,
        ...(resolved.error.code ? { code: resolved.error.code } : {}),
      });
    }

    const { requester } = resolved;
    const validation = validateSupportTicketInput(req.body);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0] || 'Invalid support ticket input';
      return res.status(422).json({
        message: firstError,
        errors: validation.errors,
        code: 'VALIDATION_ERROR',
      });
    }

    const rateKey = `${requester.role}:${requester.id}`;
    const rateStatus = checkSupportRateLimit(rateKey);
    if (!rateStatus.allowed) {
      return res.status(429).json({
        message: 'Too many support requests submitted recently. Please wait a moment and try again.',
        code: 'SUPPORT_RATE_LIMITED',
        retryAfterSeconds: rateStatus.retryAfterSeconds,
      });
    }

    const createdTicket = await adminDb.transaction(async (transaction) => {
      const now = new Date();
      let ticket = null;
      let lastUniqueError = null;

      for (let attempt = 1; attempt <= MAX_TICKET_NUMBER_RETRIES; attempt += 1) {
        const ticketNumber = await generateSupportTicketNumber({ transaction });
        try {
          ticket = await SupportTicket.create(
            {
              ticketNumber,
              requesterType: requester.role,
              requesterId: requester.id,
              requesterName: requester.fullName,
              email: validation.values.email,
              phone: validation.values.phone,
              subject: validation.values.subject,
              description: validation.values.description,
              status: 'open',
              adminNotifiedAt: now,
            },
            { transaction },
          );
          break;
        } catch (createError) {
          if (isTicketNumberUniqueConflict(createError) && attempt < MAX_TICKET_NUMBER_RETRIES) {
            lastUniqueError = createError;
            continue;
          }
          throw createError;
        }
      }

      if (!ticket) {
        throw lastUniqueError || new Error('Unable to generate unique support ticket number');
      }

      const adminRecord = await Admin.findOne({
        order: [['createdAt', 'ASC']],
        transaction,
      });
      const adminEmail = (adminRecord?.email || process.env.ADMIN_EMAIL || 'admin@thequipus.com').trim();
      const adminName = adminRecord?.fullName || process.env.ADMIN_NAME || 'Platform Admin';

      const emailPayload = buildAdminSupportTicketEmail({
        ticket,
        submittedAt: ticket.createdAt || now,
      });

      await sendGenericEmail({
        recipientEmail: adminEmail,
        recipientName: adminName,
        subject: emailPayload.subject,
        htmlContent: emailPayload.htmlContent,
        textContent: emailPayload.textContent,
      });

      return ticket;
    });

    return res.status(201).json({
      message: 'Your support request has been submitted.',
      ticket: serializeTicket(createdTicket),
    });
  } catch (error) {
    console.error('[Support] Ticket creation or admin email failed:', error.message);
    return res.status(502).json({
      message: 'Something went wrong, please raise the ticket again.',
      code: 'SUPPORT_TICKET_SUBMISSION_FAILED',
    });
  }
}

export async function listMySupportTickets(req, res) {
  try {
    const resolved = await resolveRequesterAccount(req.user);
    if (resolved.error) {
      return res.status(resolved.error.status).json({
        message: resolved.error.message,
        ...(resolved.error.code ? { code: resolved.error.code } : {}),
      });
    }

    const { requester } = resolved;
    const tickets = await SupportTicket.findAll({
      where: {
        requesterType: requester.role,
        requesterId: requester.id,
      },
      include: [
        {
          model: SupportReply,
          as: 'replies',
        },
      ],
      order: [
        ['createdAt', 'DESC'],
        [{ model: SupportReply, as: 'replies' }, 'createdAt', 'ASC'],
      ],
    });

    return res.status(200).json({
      items: tickets.map(serializeTicket),
    });
  } catch (error) {
    console.error('[Support] Failed to list requester tickets:', error.message);
    return res.status(500).json({ message: 'Unable to load support tickets' });
  }
}

export async function listAdminSupportTickets(req, res) {
  try {
    const statusFilter = String(req.query?.status || 'all').trim().toLowerCase();
    const roleFilter = String(req.query?.requesterType || 'all').trim().toLowerCase();
    const search = String(req.query?.search || '').trim();
    const page = Math.max(1, Number.parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query?.limit, 10) || 25));

    const where = {};
    if (statusFilter !== 'all') {
      if (!['open', 'replied'].includes(statusFilter)) {
        return res.status(422).json({ message: 'Status filter must be all, open, or replied' });
      }
      where.status = statusFilter;
    }

    if (roleFilter !== 'all') {
      if (!['seeker', 'expert'].includes(roleFilter)) {
        return res.status(422).json({ message: 'Requester type filter must be all, seeker, or expert' });
      }
      where.requesterType = roleFilter;
    }

    if (search) {
      const term = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
      where[Op.or] = [
        { ticketNumber: { [Op.like]: term } },
        { requesterName: { [Op.like]: term } },
        { email: { [Op.like]: term } },
        { phone: { [Op.like]: term } },
        { subject: { [Op.like]: term } },
        { description: { [Op.like]: term } },
      ];
    }

    const [{ rows, count }, openCount, repliedCount] = await Promise.all([
      SupportTicket.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit,
      }),
      SupportTicket.count({ where: { status: 'open' } }),
      SupportTicket.count({ where: { status: 'replied' } }),
    ]);

    return res.status(200).json({
      items: rows.map(serializeTicket),
      counts: {
        all: openCount + repliedCount,
        open: openCount,
        replied: repliedCount,
      },
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.max(1, Math.ceil(count / limit)),
      },
    });
  } catch (error) {
    console.error('[Support] Admin list support tickets failed:', error.message);
    return res.status(500).json({ message: 'Unable to load support tickets' });
  }
}

export async function getAdminSupportTicket(req, res) {
  try {
    const ticket = await SupportTicket.findByPk(req.params.ticketId, {
      include: [
        {
          model: SupportReply,
          as: 'replies',
        },
      ],
      order: [[{ model: SupportReply, as: 'replies' }, 'createdAt', 'ASC']],
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    return res.status(200).json({
      ticket: serializeTicket(ticket),
    });
  } catch (error) {
    console.error('[Support] Admin get support ticket failed:', error.message);
    return res.status(500).json({ message: 'Unable to load support ticket details' });
  }
}

export async function replyAdminSupportTicket(req, res) {
  const rawMessage = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!rawMessage) {
    return res.status(422).json({
      message: 'Reply message is required',
      code: 'VALIDATION_ERROR',
    });
  }
  if (rawMessage.length > 5000) {
    return res.status(422).json({
      message: 'Reply message must not exceed 5000 characters',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const ticket = await SupportTicket.findByPk(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    const fromEmail =
      (await getDatabaseSetting('FROM_EMAIL')) ||
      (await getDatabaseSetting('SMTP_USER')) ||
      process.env.ADMIN_EMAIL ||
      'support@jatayuconnect.in';

    const result = await adminDb.transaction(async (transaction) => {
      const lockedTicket = await SupportTicket.findByPk(ticket.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const now = new Date();
      const reply = await SupportReply.create(
        {
          ticketId: lockedTicket.id,
          adminId: req.admin?.id || null,
          adminName: req.admin?.fullName || 'Platform Admin',
          fromEmail,
          toEmail: lockedTicket.email,
          message: rawMessage,
        },
        { transaction },
      );

      lockedTicket.status = 'replied';
      lockedTicket.lastRepliedAt = now;
      await lockedTicket.save({ transaction });

      const emailPayload = buildRequesterReplyEmail({
        ticket: lockedTicket,
        replyMessage: rawMessage,
        fromEmail,
      });

      await sendGenericEmail({
        recipientEmail: lockedTicket.email,
        recipientName: lockedTicket.requesterName,
        subject: emailPayload.subject,
        htmlContent: emailPayload.htmlContent,
        textContent: emailPayload.textContent,
      });

      return { ticket: lockedTicket, reply };
    });

    const refreshed = await SupportTicket.findByPk(result.ticket.id, {
      include: [{ model: SupportReply, as: 'replies' }],
      order: [[{ model: SupportReply, as: 'replies' }, 'createdAt', 'ASC']],
    });

    return res.status(201).json({
      message: 'Reply sent successfully',
      reply: {
        id: result.reply.id,
        ticketId: result.reply.ticketId,
        adminId: result.reply.adminId,
        adminName: result.reply.adminName,
        fromEmail: result.reply.fromEmail,
        toEmail: result.reply.toEmail,
        message: result.reply.message,
        createdAt: result.reply.createdAt,
      },
      ticket: serializeTicket(refreshed || result.ticket),
    });
  } catch (error) {
    console.error('[Support] Admin reply email or save failed:', error.message);
    return res.status(502).json({
      message: 'Failed to send reply email. Please try again.',
      code: 'SUPPORT_REPLY_DELIVERY_FAILED',
    });
  }
}
