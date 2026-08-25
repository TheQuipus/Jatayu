import { getSetting } from './settingsHelper.js';
import { sendGenericEmail } from './emailService.js';
import { sendSms } from './smsService.js';

/**
 * Replace placeholders like {{name}}, {{otp}}, {{application_number}}, etc.
 */
function interpolate(template = '', data = {}) {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(placeholder, value !== undefined && value !== null ? String(value) : '');
  }
  return result;
}

/**
 * Default HTML layout wrapper for email templates
 */
function buildHtmlWrapper(title, bodyHtml) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; max-width: 580px; margin: 0 auto; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Jatayu Connect</h1>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Jatayu Connect. All rights reserved.</p>
        <p style="margin: 4px 0 0 0;">This is an automated notification. Please do not reply directly to this email.</p>
      </div>
    </div>
  `;
}

/**
 * Built-in default notification templates
 */
export const DEFAULT_TEMPLATES = {
  // --- Expert Templates ---
  EXPERT_OTP: {
    subject: 'Your Jatayu verification code',
    emailBody: `
      <p>Hello {{name}},</p>
      <p>Your verification code for Jatayu Expert Account is:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 20px 0; color: #4f46e5; text-align: center;">{{otp}}</p>
      <p>This code is valid for 10 minutes. Please do not share it with anyone.</p>
    `,
    smsBody: 'Your Jatayu verification code is {{otp}}. It expires in 10 minutes.',
  },

  EXPERT_ONBOARDING_UNDER_REVIEW: {
    subject: 'Your Jatayu Expert application is under review',
    emailBody: `
      <p>Hello {{name}},</p>
      <p>Thank you for completing your onboarding profile!</p>
      <p>Your application number <strong>{{application_number}}</strong> has been received and is currently under review by our admin team.</p>
      <p>We review every application thoroughly to ensure high quality matches. You will receive an update as soon as your profile review is completed.</p>
    `,
    smsBody: 'Hi {{name}}, your Jatayu Expert application ({{application_number}}) is now under review. We will notify you once approved.',
  },

  EXPERT_ONBOARDING_APPROVED: {
    subject: 'Congratulations! Your Jatayu Expert profile is approved',
    emailBody: `
      <p>Hello {{name}},</p>
      <p>Great news! Your Jatayu Expert application (<strong>{{application_number}}</strong>) has been <strong>approved</strong>!</p>
      <p>You can now log in to your expert dashboard, set your availability slots, and start accepting consultations.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{dashboard_link}}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Go to Expert Dashboard</a>
      </div>
    `,
    smsBody: 'Congratulations {{name}}! Your Jatayu Expert profile is approved. Log in to start accepting sessions.',
  },

  EXPERT_ONBOARDING_REJECTED: {
    subject: 'Update regarding your Jatayu Expert application',
    emailBody: `
      <p>Hello {{name}},</p>
      <p>Thank you for your interest in joining Jatayu as an Expert.</p>
      <p>After reviewing your application (<strong>{{application_number}}</strong>), our team requires additional details or revisions:</p>
      <blockquote style="background-color: #f1f5f9; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0; color: #334155;">{{reason}}</blockquote>
      <p>Please log back into your profile to update your details and resubmit for review.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{dashboard_link}}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Update Application</a>
      </div>
    `,
    smsBody: 'Hi {{name}}, your Jatayu Expert application requires revision: {{reason}}. Please log in to update.',
  },

  EXPERT_ONBOARDING_DROPPED: {
    subject: 'Complete your Jatayu Expert profile registration',
    emailBody: `
      <p>Hello {{name}},</p>
      <p>We noticed you started setting up your Jatayu Expert account but haven't finished your profile submission yet.</p>
      <p>It takes only a few minutes to complete your profile and start connecting with seekers in your area of expertise.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{resume_link}}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Resume Registration</a>
      </div>
    `,
    smsBody: 'Hi {{name}}, complete your Jatayu Expert profile today to start accepting consultation sessions.',
  },

  // --- Seeker Templates ---
  SEEKER_OTP: {
    subject: 'Your Jatayu Seeker verification code',
    emailBody: `
      <p>Hello {{name}},</p>
      <p>Your verification code for Jatayu Seeker Account is:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 20px 0; color: #2563eb; text-align: center;">{{otp}}</p>
      <p>This code is valid for 10 minutes. Please do not share it with anyone.</p>
    `,
    smsBody: 'Your Jatayu Seeker verification code is {{otp}}. It expires in 10 minutes.',
  },

  SEEKER_ONBOARDING_COMPLETE: {
    subject: 'Welcome to Jatayu Connect!',
    emailBody: `
      <p>Hello {{name}},</p>
      <p>Welcome to Jatayu Connect! Your account registration is complete.</p>
      <p>You have received <strong>{{credits}} onboarding credits</strong> in your wallet to get started with expert consultations.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{explore_link}}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Explore Experts</a>
      </div>
    `,
    smsBody: 'Welcome to Jatayu {{name}}! Your seeker account is active with {{credits}} free onboarding credits.',
  },

  SEEKER_ONBOARDING_DROPPED: {
    subject: 'Finish setting up your Jatayu account',
    emailBody: `
      <p>Hello {{name}},</p>
      <p>You are just one step away from connecting with top verified experts on Jatayu!</p>
      <p>Complete your registration today to claim your free welcome credits and book your first session.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{resume_link}}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Finish Registration</a>
      </div>
    `,
    smsBody: 'Hi {{name}}, finish your Jatayu account signup today to claim your free welcome credits!',
  },
};

/**
 * Main Trigger Notification Function
 */
export async function triggerNotification(triggerKey, { email, phone, name = 'there', data = {} }) {
  const defaultTpl = DEFAULT_TEMPLATES[triggerKey];
  if (!defaultTpl) {
    console.warn(`[Trigger Error] Unknown trigger key: ${triggerKey}`);
    return { emailSent: false, smsSent: false, errors: ['Unknown notification trigger'] };
  }

  // Fetch subject and body overrides from DB settings if customized
  const customSubject = await getSetting(`EMAIL_TEMPLATE_${triggerKey}_SUBJECT`);
  const customEmailBody = await getSetting(`EMAIL_TEMPLATE_${triggerKey}_BODY`);
  const customSmsBody = await getSetting(`SMS_TEMPLATE_${triggerKey}`);

  const rawSubject = customSubject || defaultTpl.subject;
  const rawEmailBody = customEmailBody || defaultTpl.emailBody;
  const rawSmsBody = customSmsBody || defaultTpl.smsBody;

  const payloadData = { name, ...data };

  const finalSubject = interpolate(rawSubject, payloadData);
  const formattedBody = interpolate(rawEmailBody, payloadData);
  const finalHtml = buildHtmlWrapper(finalSubject, formattedBody);
  const finalSms = interpolate(rawSmsBody, payloadData);
  const result = { emailSent: false, smsSent: false, errors: [] };

  // Send Email if email is provided
  if (email) {
    try {
      await sendGenericEmail({
        recipientEmail: email,
        recipientName: name,
        subject: finalSubject,
        htmlContent: finalHtml,
        textContent: finalSms,
      });
      result.emailSent = true;
      console.log(`[Notification Trigger] ${triggerKey} Email sent to ${email}`);
    } catch (err) {
      result.errors.push(err.message);
      console.error(`[Notification Trigger Error] ${triggerKey} Email failed for ${email}:`, err.message);
    }
  }

  // SMS is provider-agnostic. MSG91 resolves an approved Flow ID per trigger.
  if (phone) {
    try {
      await sendSms({
        recipientPhone: phone,
        message: finalSms,
        templateKey: triggerKey,
        variables: payloadData,
      });
      result.smsSent = true;
      console.log(`[Notification Trigger] ${triggerKey} SMS sent to ${phone}`);
    } catch (err) {
      result.errors.push(err.message);
      console.error(`[Notification Trigger Error] ${triggerKey} SMS failed for ${phone}:`, err.message);
    }
  }

  return result;
}
