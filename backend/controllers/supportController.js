import { Op } from 'sequelize';
import {
  adminDb,
  Admin,
  Expert,
  Seeker,
  SupportReply,
  SupportTicket,
} from '../models/index.js';
import { getConfiguredSenderEmail, sendGenericEmail } from '../utils/emailService.js';
import { buildSupportEmailFooter } from '../utils/supportEmailFooter.js';
import { upsertUnreadSupportNotification } from '../services/notificationService.js';
import {
  buildViewerStatusWhere,
  deriveViewerStatus,
  isValidStatusFilter,
} from '../utils/supportStatus.js';
import { generateSupportTicketNumber } from '../utils/supportTicketNumber.js';
import { isSeekerSuspended } from './seeker/seekerAuthController.js';

const REQUESTER_ADMIN_DISPLAY_NAME = 'Jatayu Support';
const MAX_REPLY_MESSAGE_LENGTH = 5000;

function validateReplyMessage(body) {
  const rawMessage = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!rawMessage) {
    return { valid: false, message: 'Reply message is required' };
  }
  if (rawMessage.length > MAX_REPLY_MESSAGE_LENGTH) {
    return { valid: false, message: `Reply message must not exceed ${MAX_REPLY_MESSAGE_LENGTH} characters` };
  }
  return { valid: true, message: rawMessage };
}

async function resolveAdminRecipient({ transaction }) {
  const adminRecord = await Admin.findOne({
    order: [['createdAt', 'ASC']],
    transaction,
  });
  return {
    adminEmail: (adminRecord?.email || process.env.ADMIN_EMAIL || 'admin@thequipus.com').trim(),
    adminName: adminRecord?.fullName || process.env.ADMIN_NAME || 'Platform Admin',
  };
}

async function notifyAdminsSupportEvent({ ticket, eventType, title, body }) {
  try {
    const admins = await Admin.findAll({ attributes: ['id'] });
    const href = `/admin/support/${encodeURIComponent(ticket.ticketNumber)}/`;
    await Promise.all(
      admins.map((admin) =>
        upsertUnreadSupportNotification({
          recipientType: 'admin',
          recipientId: admin.id,
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          eventType,
          title,
          body,
          href,
          data: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, requesterType: ticket.requesterType },
        }),
      ),
    );
  } catch (error) {
    console.error('[Support] Admin notification failed:', error?.message || error);
  }
}

async function notifyRequesterSupportReply({ ticket, replyMessage }) {
  try {
    const role = ticket.requesterType === 'expert' ? 'expert' : 'seeker';
    const href = `/${role}/support/?ticket=${encodeURIComponent(ticket.ticketNumber)}`;
    await upsertUnreadSupportNotification({
      recipientType: role,
      recipientId: ticket.requesterId,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      eventType: 'support.reply_received',
      title: `You have a new reply on ${ticket.ticketNumber} (${ticket.subject})`,
      body: replyMessage,
      href,
      data: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
    });
  } catch (error) {
    console.error('[Support] Requester notification failed:', error?.message || error);
  }
}

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
  const footer = buildSupportEmailFooter({
    recipientRole: 'admin',
    ticketNumber: ticket.ticketNumber,
  });

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
      ${footer.htmlFooter}
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
    ...(footer.textFooter ? ['', footer.textFooter] : []),
  ].join('\n');

  return {
    subject: `[Support ${ticket.ticketNumber}] ${ticket.subject} — ${ticket.requesterName} (${roleLabel})`,
    htmlContent,
    textContent,
  };
}

function buildRequesterReplyEmail({ ticket, replyMessage, fromEmail }) {
  const footer = buildSupportEmailFooter({
    recipientRole: ticket.requesterType === 'expert' ? 'expert' : 'seeker',
    ticketNumber: ticket.ticketNumber,
  });

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
      ${footer.htmlFooter}
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
    ...(footer.textFooter ? ['', footer.textFooter] : []),
  ].join('\n');

  return {
    subject: `Re: [${ticket.ticketNumber}] ${ticket.subject}`,
    htmlContent,
    textContent,
  };
}

function buildAdminSupportReplyEmail({ ticket, requester, replyMessage, repliedAt }) {
  const formattedDate = new Date(repliedAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const roleLabel = requester.role === 'expert' ? 'Expert' : 'Seeker';
  const footer = buildSupportEmailFooter({
    recipientRole: 'admin',
    ticketNumber: ticket.ticketNumber,
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; color: #0B0D14;">
      <h2 style="margin-bottom: 12px; color: #E53B17;">New Reply on Support Ticket (${escapeHtml(ticket.ticketNumber)})</h2>
      <p><strong>${escapeHtml(requester.fullName)}</strong> (${escapeHtml(roleLabel)}) replied on ticket <strong>${escapeHtml(ticket.ticketNumber)}</strong> (${escapeHtml(ticket.subject)}):</p>
      <div style="padding: 14px 16px; background: #F8F8F8; border-left: 4px solid #E53B17; margin: 16px 0; white-space: pre-wrap;">${escapeHtml(replyMessage)}</div>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
        <tr>
          <td style="padding: 6px 8px; border: 1px solid #E6E6E6; font-weight: 600; width: 150px;">Requester Email</td>
          <td style="padding: 6px 8px; border: 1px solid #E6E6E6;">${escapeHtml(ticket.email)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 8px; border: 1px solid #E6E6E6; font-weight: 600;">Mobile Number</td>
          <td style="padding: 6px 8px; border: 1px solid #E6E6E6;">+91 ${escapeHtml(ticket.phone)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 8px; border: 1px solid #E6E6E6; font-weight: 600;">Replied At</td>
          <td style="padding: 6px 8px; border: 1px solid #E6E6E6;">${escapeHtml(formattedDate)} (IST)</td>
        </tr>
      </table>
      ${footer.htmlFooter}
    </div>
  `;

  const textContent = [
    `New Reply on Support Ticket (${ticket.ticketNumber})`,
    `From: ${requester.fullName} (${roleLabel})`,
    `Subject: ${ticket.subject}`,
    '',
    replyMessage,
    '',
    `Requester Email: ${ticket.email}`,
    `Mobile Number: +91 ${ticket.phone}`,
    `Replied At: ${formattedDate} (IST)`,
    ...(footer.textFooter ? ['', footer.textFooter] : []),
  ].join('\n');

  return {
    subject: `Re: [Support ${ticket.ticketNumber}] ${ticket.subject} — ${requester.fullName} (${roleLabel})`,
    htmlContent,
    textContent,
  };
}

function sortRepliesChronologically(replies) {
  if (!Array.isArray(replies)) return [];
  return [...replies].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function serializeAdminReply(reply) {
  const authorType = reply.authorType || 'admin';
  const authorName = reply.authorName || reply.adminName || (authorType === 'admin' ? 'Platform Admin' : 'Requester');
  return {
    id: reply.id,
    ticketId: reply.ticketId,
    authorType,
    authorId: reply.authorId ?? reply.adminId ?? null,
    authorName,
    adminId: reply.adminId ?? null,
    adminName: reply.adminName ?? null,
    fromEmail: reply.fromEmail ?? null,
    toEmail: reply.toEmail ?? null,
    message: reply.message,
    createdAt: reply.createdAt,
  };
}

function serializeRequesterReply(reply, ticket) {
  const authorType = reply.authorType || 'admin';
  const isAdminAuthor = authorType === 'admin';
  const safeAuthorName = isAdminAuthor
    ? REQUESTER_ADMIN_DISPLAY_NAME
    : (reply.authorName || ticket.requesterName);

  return {
    id: reply.id,
    authorType,
    authorName: safeAuthorName,
    adminName: safeAuthorName,
    message: reply.message,
    createdAt: reply.createdAt,
  };
}

function buildThreadEntries(ticket, replies, viewerRole) {
  const initialEntry = {
    id: `initial-${ticket.id}`,
    authorType: ticket.requesterType,
    authorName: ticket.requesterName,
    message: ticket.description,
    createdAt: ticket.createdAt,
    isInitial: true,
  };

  const sorted = sortRepliesChronologically(replies);
  const replyEntries = sorted.map((reply) => ({
    ...(viewerRole === 'admin'
      ? serializeAdminReply(reply)
      : serializeRequesterReply(reply, ticket)),
    isInitial: false,
  }));

  return [initialEntry, ...replyEntries];
}

function serializeTicket(ticket, viewerRole = 'admin') {
  const data = ticket.toJSON ? ticket.toJSON() : { ...ticket };
  const viewerStatus = deriveViewerStatus(data, viewerRole);
  const sortedReplies = Array.isArray(data.replies)
    ? sortRepliesChronologically(data.replies)
    : null;

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
    lastReplyBy: data.lastReplyBy ?? null,
    viewerStatus,
    statusLabel: viewerStatus.label,
    adminNotifiedAt: data.adminNotifiedAt,
    lastRepliedAt: data.lastRepliedAt,
    closedAt: data.closedAt ?? null,
    closedByAdminId: data.closedByAdminId ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    ...(sortedReplies
      ? {
          replies: sortedReplies.map(serializeAdminReply),
          thread: buildThreadEntries(data, sortedReplies, viewerRole),
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
    const accountEmail = typeof requester.email === 'string' ? requester.email.trim() : '';
    const accountPhone = normalizeSupportPhone(requester.phone || '');
    const hasAccountEmail = Boolean(accountEmail);
    const hasAccountPhone = /^\d{10}$/.test(accountPhone);

    const validation = validateSupportTicketInput({
      ...req.body,
      email: hasAccountEmail ? accountEmail : req.body?.email,
      phone: hasAccountPhone ? accountPhone : req.body?.phone,
    });
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
              lastReplyBy: null,
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

      const { adminEmail, adminName } = await resolveAdminRecipient({ transaction });

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

    const roleLabel = requester.role === 'expert' ? 'Expert' : 'Seeker';
    await notifyAdminsSupportEvent({
      ticket: createdTicket,
      eventType: 'support.ticket_created',
      title: `New support ticket ${createdTicket.ticketNumber} from ${requester.fullName} (${roleLabel})`,
      body: `${createdTicket.subject} — ${createdTicket.description}`,
    });

    return res.status(201).json({
      message: 'Your support request has been submitted.',
      ticket: serializeTicket(createdTicket, 'requester'),
    });
  } catch (error) {
    console.error('[Support] Ticket creation or admin email failed:', error.message);
    return res.status(502).json({
      message: 'Something went wrong, please raise the ticket again.',
      code: 'SUPPORT_TICKET_SUBMISSION_FAILED',
    });
  }
}

function serializeUserTicketSummary(ticket) {
  const data = ticket.toJSON ? ticket.toJSON() : { ...ticket };
  const viewerStatus = deriveViewerStatus(data, 'requester');
  return {
    id: data.id,
    ticketNumber: data.ticketNumber,
    subject: data.subject,
    description: data.description,
    status: data.status,
    lastReplyBy: data.lastReplyBy ?? null,
    viewerStatus,
    statusLabel: viewerStatus.label,
    createdAt: data.createdAt,
    lastRepliedAt: data.lastRepliedAt,
    closedAt: data.closedAt ?? null,
    replyCount: Array.isArray(data.replies) ? data.replies.length : 0,
  };
}

export async function getMySupportSummary(req, res) {
  try {
    const resolved = await resolveRequesterAccount(req.user);
    if (resolved.error) {
      return res.status(resolved.error.status).json({
        message: resolved.error.message,
        ...(resolved.error.code ? { code: resolved.error.code } : {}),
      });
    }

    const { requester } = resolved;
    const responseReceivedCount = await SupportTicket.count({
      where: {
        requesterType: requester.role,
        requesterId: requester.id,
        ...buildViewerStatusWhere('requester', 'response_received'),
      },
    });

    return res.status(200).json({ responseReceivedCount });
  } catch (error) {
    console.error('[Support] Failed to load requester summary:', error.message);
    return res.status(500).json({ message: 'Unable to load support summary' });
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
    const page = Math.max(1, Number.parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query?.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const statusParam = typeof req.query?.status === 'string' && req.query.status.trim()
      ? req.query.status.trim().toLowerCase()
      : 'all';

    if (!isValidStatusFilter('requester', statusParam)) {
      return res.status(422).json({
        message: 'Status filter must be all, in_progress, response_received, or closed',
        code: 'VALIDATION_ERROR',
      });
    }

    const baseWhere = {
      requesterType: requester.role,
      requesterId: requester.id,
    };

    const [allCount, inProgressCount, responseReceivedCount, closedCount, openCount] = await Promise.all([
      SupportTicket.count({ where: baseWhere }),
      SupportTicket.count({
        where: {
          ...baseWhere,
          ...buildViewerStatusWhere('requester', 'in_progress'),
        },
      }),
      SupportTicket.count({
        where: {
          ...baseWhere,
          ...buildViewerStatusWhere('requester', 'response_received'),
        },
      }),
      SupportTicket.count({
        where: {
          ...baseWhere,
          status: 'closed',
        },
      }),
      SupportTicket.count({ where: { ...baseWhere, status: 'open' } }),
    ]);

    const filterWhere = {
      ...baseWhere,
      ...buildViewerStatusWhere('requester', statusParam),
    };

    const { count, rows: tickets } = await SupportTicket.findAndCountAll({
      where: filterWhere,
      include: [
        {
          model: SupportReply,
          as: 'replies',
          attributes: ['id'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      items: tickets.map(serializeUserTicketSummary),
      counts: {
        all: allCount,
        in_progress: inProgressCount,
        response_received: responseReceivedCount,
        closed: closedCount,
        open: openCount,
        replied: responseReceivedCount,
      },
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.max(1, Math.ceil(count / limit)),
      },
    });
  } catch (error) {
    console.error('[Support] Failed to list requester tickets:', error.message);
    return res.status(500).json({ message: 'Unable to load support tickets' });
  }
}

export async function getMySupportTicketDetail(req, res) {
  try {
    const resolved = await resolveRequesterAccount(req.user);
    if (resolved.error) {
      return res.status(resolved.error.status).json({
        message: resolved.error.message,
        ...(resolved.error.code ? { code: resolved.error.code } : {}),
      });
    }

    const { requester } = resolved;
    const ticket = await findSupportTicketByIdentifier(req.params.ticketId, {
      include: [
        {
          model: SupportReply,
          as: 'replies',
        },
      ],
      order: [[{ model: SupportReply, as: 'replies' }, 'createdAt', 'ASC']],
    });

    if (
      !ticket ||
      ticket.requesterType !== requester.role ||
      String(ticket.requesterId) !== String(requester.id)
    ) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    const sortedReplies = sortRepliesChronologically(ticket.replies);
    const safeReplies = sortedReplies.map((reply) => serializeRequesterReply(reply, ticket));
    const viewerStatus = deriveViewerStatus(ticket, 'requester');

    return res.status(200).json({
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        lastReplyBy: ticket.lastReplyBy ?? null,
        viewerStatus,
        statusLabel: viewerStatus.label,
        createdAt: ticket.createdAt,
        lastRepliedAt: ticket.lastRepliedAt,
        closedAt: ticket.closedAt ?? null,
        replies: safeReplies,
        thread: buildThreadEntries(ticket, sortedReplies, 'requester'),
      },
    });
  } catch (error) {
    console.error('[Support] Failed to get user ticket detail:', error.message);
    return res.status(500).json({ message: 'Unable to load support ticket details' });
  }
}

export async function createMySupportReply(req, res) {
  try {
    const resolved = await resolveRequesterAccount(req.user);
    if (resolved.error) {
      return res.status(resolved.error.status).json({
        message: resolved.error.message,
        ...(resolved.error.code ? { code: resolved.error.code } : {}),
      });
    }

    const validation = validateReplyMessage(req.body);
    if (!validation.valid) {
      return res.status(422).json({
        message: validation.message,
        code: 'VALIDATION_ERROR',
      });
    }

    const { requester } = resolved;
    const rateKey = `reply:${requester.role}:${requester.id}`;
    const rateStatus = checkSupportRateLimit(rateKey);
    if (!rateStatus.allowed) {
      return res.status(429).json({
        message: 'Too many support replies submitted recently. Please wait a moment and try again.',
        code: 'SUPPORT_RATE_LIMITED',
        retryAfterSeconds: rateStatus.retryAfterSeconds,
      });
    }

    const result = await adminDb.transaction(async (transaction) => {
      const lockedTicket = await findSupportTicketByIdentifier(req.params.ticketId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (
        !lockedTicket ||
        lockedTicket.requesterType !== requester.role ||
        String(lockedTicket.requesterId) !== String(requester.id)
      ) {
        const notFoundError = new Error('Support ticket not found');
        notFoundError.statusCode = 404;
        throw notFoundError;
      }

      if (lockedTicket.status === 'closed') {
        const closedError = new Error('This support ticket is closed and cannot receive new replies.');
        closedError.statusCode = 409;
        closedError.code = 'SUPPORT_TICKET_CLOSED';
        throw closedError;
      }

      const now = new Date();
      const reply = await SupportReply.create(
        {
          ticketId: lockedTicket.id,
          authorType: requester.role,
          authorId: requester.id,
          authorName: requester.fullName,
          adminId: null,
          adminName: null,
          fromEmail: null,
          toEmail: null,
          message: validation.message,
        },
        { transaction },
      );

      lockedTicket.status = 'open';
      lockedTicket.lastReplyBy = 'requester';
      lockedTicket.lastRepliedAt = now;
      await lockedTicket.save({ transaction });

      const { adminEmail, adminName } = await resolveAdminRecipient({ transaction });
      const emailPayload = buildAdminSupportReplyEmail({
        ticket: lockedTicket,
        requester,
        replyMessage: validation.message,
        repliedAt: now,
      });

      await sendGenericEmail({
        recipientEmail: adminEmail,
        recipientName: adminName,
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
    const finalTicket = refreshed || result.ticket;
    const sortedReplies = sortRepliesChronologically(finalTicket.replies || [result.reply]);
    const viewerStatus = deriveViewerStatus(finalTicket, 'requester');

    await notifyAdminsSupportEvent({
      ticket: finalTicket,
      eventType: 'support.reply_received',
      title: `New reply on ${finalTicket.ticketNumber} from ${requester.fullName}`,
      body: validation.message,
    });

    return res.status(201).json({
      message: 'Reply sent successfully',
      reply: serializeRequesterReply(result.reply, finalTicket),
      ticket: {
        id: finalTicket.id,
        ticketNumber: finalTicket.ticketNumber,
        subject: finalTicket.subject,
        description: finalTicket.description,
        status: finalTicket.status,
        lastReplyBy: finalTicket.lastReplyBy ?? null,
        viewerStatus,
        statusLabel: viewerStatus.label,
        createdAt: finalTicket.createdAt,
        lastRepliedAt: finalTicket.lastRepliedAt,
        closedAt: finalTicket.closedAt ?? null,
        replies: sortedReplies.map((r) => serializeRequesterReply(r, finalTicket)),
        thread: buildThreadEntries(finalTicket, sortedReplies, 'requester'),
      },
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.statusCode === 409) {
      return res.status(409).json({
        message: error.message,
        code: error.code || 'SUPPORT_TICKET_CLOSED',
      });
    }
    console.error('[Support] Requester reply email or save failed:', error.message);
    return res.status(502).json({
      message: 'Failed to send reply. Please try again.',
      code: 'SUPPORT_REPLY_DELIVERY_FAILED',
    });
  }
}

export async function listAdminSupportTickets(req, res) {
  try {
    const statusFilter = String(req.query?.status || 'all').trim().toLowerCase() || 'all';
    const roleFilter = String(req.query?.requesterType || 'all').trim().toLowerCase();
    const search = String(req.query?.search || '').trim();
    const page = Math.max(1, Number.parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query?.limit, 10) || 25));

    if (!isValidStatusFilter('admin', statusFilter)) {
      return res.status(422).json({
        message: 'Status filter must be all, new, in_progress, response_received, or closed',
      });
    }

    const where = {
      ...buildViewerStatusWhere('admin', statusFilter),
    };

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

    const [
      { rows, count },
      newCount,
      inProgressCount,
      responseReceivedCount,
      closedCount,
    ] = await Promise.all([
      SupportTicket.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit,
      }),
      SupportTicket.count({ where: buildViewerStatusWhere('admin', 'new') }),
      SupportTicket.count({ where: buildViewerStatusWhere('admin', 'in_progress') }),
      SupportTicket.count({ where: buildViewerStatusWhere('admin', 'response_received') }),
      SupportTicket.count({ where: buildViewerStatusWhere('admin', 'closed') }),
    ]);

    const openCount = newCount + inProgressCount + responseReceivedCount;
    const needsAttention = newCount + responseReceivedCount;

    return res.status(200).json({
      items: rows.map((row) => serializeTicket(row, 'admin')),
      counts: {
        all: openCount + closedCount,
        new: newCount,
        in_progress: inProgressCount,
        response_received: responseReceivedCount,
        closed: closedCount,
        needsAttention,
        open: openCount,
        replied: inProgressCount,
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

function findSupportTicketByIdentifier(ticketId, options = {}) {
  const raw = String(ticketId || '').trim();
  if (/^SUP-\d+$/i.test(raw)) {
    return SupportTicket.findOne({
      ...options,
      where: {
        ...(options.where || {}),
        ticketNumber: raw.toUpperCase(),
      },
    });
  }
  return SupportTicket.findByPk(raw, options);
}

export async function getAdminSupportTicket(req, res) {
  try {
    const [ticket, supportFromEmail] = await Promise.all([
      findSupportTicketByIdentifier(req.params.ticketId, {
        include: [
          {
            model: SupportReply,
            as: 'replies',
          },
        ],
        order: [[{ model: SupportReply, as: 'replies' }, 'createdAt', 'ASC']],
      }),
      getConfiguredSenderEmail(),
    ]);

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    return res.status(200).json({
      ticket: serializeTicket(ticket, 'admin'),
      supportFromEmail,
    });
  } catch (error) {
    console.error('[Support] Admin get support ticket failed:', error.message);
    return res.status(500).json({ message: 'Unable to load support ticket details' });
  }
}

export async function replyAdminSupportTicket(req, res) {
  const validation = validateReplyMessage(req.body);
  if (!validation.valid) {
    return res.status(422).json({
      message: validation.message,
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const fromEmail = await getConfiguredSenderEmail();
    if (!fromEmail) {
      return res.status(422).json({
        message: 'Support sender address not configured. Please configure Sender Email or SMTP Username in Admin Settings.',
        code: 'SUPPORT_SENDER_NOT_CONFIGURED',
      });
    }

    const result = await adminDb.transaction(async (transaction) => {
      const lockedTicket = await findSupportTicketByIdentifier(req.params.ticketId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!lockedTicket) {
        const notFoundError = new Error('Support ticket not found');
        notFoundError.statusCode = 404;
        throw notFoundError;
      }

      if (lockedTicket.status === 'closed') {
        const conflictError = new Error('This support ticket is closed. Reopen it before replying.');
        conflictError.statusCode = 409;
        conflictError.code = 'SUPPORT_TICKET_CLOSED';
        throw conflictError;
      }

      const now = new Date();
      const adminId = req.admin?.id || null;
      const adminName = req.admin?.fullName || 'Platform Admin';

      const reply = await SupportReply.create(
        {
          ticketId: lockedTicket.id,
          authorType: 'admin',
          authorId: adminId,
          authorName: adminName,
          adminId,
          adminName,
          fromEmail,
          toEmail: lockedTicket.email,
          message: validation.message,
        },
        { transaction },
      );

      lockedTicket.status = 'open';
      lockedTicket.lastReplyBy = 'admin';
      lockedTicket.lastRepliedAt = now;
      await lockedTicket.save({ transaction });

      const emailPayload = buildRequesterReplyEmail({
        ticket: lockedTicket,
        replyMessage: validation.message,
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
    const finalTicket = refreshed || result.ticket;

    await notifyRequesterSupportReply({
      ticket: finalTicket,
      replyMessage: validation.message,
    });

    return res.status(201).json({
      message: 'Reply sent successfully',
      reply: serializeAdminReply(result.reply),
      ticket: serializeTicket(finalTicket, 'admin'),
      supportFromEmail: fromEmail,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.statusCode === 409) {
      return res.status(409).json({
        message: error.message,
        code: error.code || 'SUPPORT_TICKET_CLOSED',
      });
    }
    console.error('[Support] Admin reply email or save failed:', error.message);
    return res.status(502).json({
      message: 'Failed to send reply email. Please try again.',
      code: 'SUPPORT_REPLY_DELIVERY_FAILED',
    });
  }
}

export async function closeAdminSupportTicket(req, res) {
  try {
    const updated = await adminDb.transaction(async (transaction) => {
      const lockedTicket = await findSupportTicketByIdentifier(req.params.ticketId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!lockedTicket) {
        const notFoundError = new Error('Support ticket not found');
        notFoundError.statusCode = 404;
        throw notFoundError;
      }

      if (lockedTicket.status === 'closed') {
        const conflictError = new Error('This support ticket is already closed.');
        conflictError.statusCode = 409;
        conflictError.code = 'SUPPORT_TICKET_ALREADY_CLOSED';
        throw conflictError;
      }

      lockedTicket.status = 'closed';
      lockedTicket.closedAt = new Date();
      lockedTicket.closedByAdminId = req.admin?.id || null;
      await lockedTicket.save({ transaction });

      return lockedTicket;
    });

    const refreshed = await SupportTicket.findByPk(updated.id, {
      include: [{ model: SupportReply, as: 'replies' }],
      order: [[{ model: SupportReply, as: 'replies' }, 'createdAt', 'ASC']],
    });

    return res.status(200).json({
      message: 'Support ticket marked as closed',
      ticket: serializeTicket(refreshed || updated, 'admin'),
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.statusCode === 409) {
      return res.status(409).json({
        message: error.message,
        code: error.code || 'SUPPORT_TICKET_ALREADY_CLOSED',
      });
    }
    console.error('[Support] Failed to close support ticket:', error.message);
    return res.status(500).json({ message: 'Unable to close support ticket' });
  }
}

export async function reopenAdminSupportTicket(req, res) {
  try {
    const updated = await adminDb.transaction(async (transaction) => {
      const lockedTicket = await findSupportTicketByIdentifier(req.params.ticketId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!lockedTicket) {
        const notFoundError = new Error('Support ticket not found');
        notFoundError.statusCode = 404;
        throw notFoundError;
      }

      if (lockedTicket.status !== 'closed') {
        const conflictError = new Error('Only closed support tickets can be reopened.');
        conflictError.statusCode = 409;
        conflictError.code = 'SUPPORT_TICKET_NOT_CLOSED';
        throw conflictError;
      }

      lockedTicket.status = 'open';
      lockedTicket.lastReplyBy = null;
      lockedTicket.closedAt = null;
      lockedTicket.closedByAdminId = null;
      await lockedTicket.save({ transaction });

      return lockedTicket;
    });

    const refreshed = await SupportTicket.findByPk(updated.id, {
      include: [{ model: SupportReply, as: 'replies' }],
      order: [[{ model: SupportReply, as: 'replies' }, 'createdAt', 'ASC']],
    });

    return res.status(200).json({
      message: 'Support ticket reopened',
      ticket: serializeTicket(refreshed || updated, 'admin'),
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.statusCode === 409) {
      return res.status(409).json({
        message: error.message,
        code: error.code || 'SUPPORT_TICKET_NOT_CLOSED',
      });
    }
    console.error('[Support] Failed to reopen support ticket:', error.message);
    return res.status(500).json({ message: 'Unable to reopen support ticket' });
  }
}
