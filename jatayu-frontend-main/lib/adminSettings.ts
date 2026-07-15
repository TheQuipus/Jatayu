export type SmsProvider = "twilio" | "msg91" | "textlocal";

export type SmtpEncryption = "tls" | "ssl" | "none";

export type MessageTemplateChannel = "sms" | "email";

export type MessageTemplateCategory =
  | "application_approved"
  | "application_rejected"
  | "application_on_hold"
  | "otp_verification"
  | "booking_confirmed"
  | "session_reminder";

export type SmsSettings = {
  provider: SmsProvider;
  apiKey: string;
  apiSecret: string;
  senderId: string;
  defaultCountryCode: string;
};

export type EmailSettings = {
  fromName: string;
  fromEmail: string;
  replyToEmail: string;
  footerText: string;
};

export type SmtpSettings = {
  host: string;
  port: string;
  username: string;
  password: string;
  encryption: SmtpEncryption;
};

export type PaymentProvider = "razorpay" | "stripe" | "cashfree";

export type PaymentSettings = {
  provider: PaymentProvider;
  keyId: string;
  secretKey: string;
  webhookSecret: string;
  currency: string;
  testMode: boolean;
};

export type GoogleCredentialsSettings = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizedDomains: string;
  enableSignIn: boolean;
  enableCalendar: boolean;
};

export type MessageTemplate = {
  id: string;
  name: string;
  channel: MessageTemplateChannel;
  category: MessageTemplateCategory;
  subject?: string;
  body: string;
  variables: string[];
};

export type AdminSettings = {
  sms: SmsSettings;
  email: EmailSettings;
  smtp: SmtpSettings;
  payment: PaymentSettings;
  google: GoogleCredentialsSettings;
  templates: MessageTemplate[];
};

export type SettingsSection =
  | "sms"
  | "email"
  | "smtp"
  | "payment"
  | "google"
  | "templates";

export const SETTINGS_SECTIONS: {
  id: SettingsSection;
  label: string;
  description: string;
}[] = [
  { id: "sms", label: "SMS", description: "Provider credentials and sender ID" },
  { id: "email", label: "Email", description: "From address, reply-to, and footer" },
  { id: "smtp", label: "SMTP", description: "Outbound mail server configuration" },
  { id: "payment", label: "Payment", description: "Gateway keys, webhooks, and payout mode" },
  {
    id: "google",
    label: "Google Credentials",
    description: "OAuth client ID, secret, and sign-in configuration",
  },
  { id: "templates", label: "Message Templates", description: "SMS and email notification templates" },
];

export const ADMIN_SETTINGS_BASE = "/admin/settings";

export function getSettingsSectionHref(section: SettingsSection): string {
  return `${ADMIN_SETTINGS_BASE}/${section}`;
}

export function parseSettingsSection(value: string | undefined): SettingsSection {
  if (value && SETTINGS_SECTIONS.some((section) => section.id === value)) {
    return value as SettingsSection;
  }

  return "sms";
}

export const SMS_PROVIDER_OPTIONS: { value: SmsProvider; label: string }[] = [
  { value: "twilio", label: "Twilio" },
  { value: "msg91", label: "MSG91" },
  { value: "textlocal", label: "Textlocal" },
];

export const SMTP_ENCRYPTION_OPTIONS: { value: SmtpEncryption; label: string }[] = [
  { value: "tls", label: "TLS (STARTTLS)" },
  { value: "ssl", label: "SSL" },
  { value: "none", label: "None" },
];

export const PAYMENT_PROVIDER_OPTIONS: { value: PaymentProvider; label: string }[] = [
  { value: "razorpay", label: "Razorpay" },
  { value: "stripe", label: "Stripe" },
  { value: "cashfree", label: "Cashfree" },
];

export const TEMPLATE_CATEGORY_LABELS: Record<MessageTemplateCategory, string> = {
  application_approved: "Application Approved",
  application_rejected: "Application Rejected",
  application_on_hold: "Application On Hold",
  otp_verification: "OTP Verification",
  booking_confirmed: "Booking Confirmed",
  session_reminder: "Session Reminder",
};

export const TEMPLATE_CHANNEL_LABELS: Record<MessageTemplateChannel, string> = {
  sms: "SMS",
  email: "Email",
};

const STORAGE_KEY = "jatayu_admin_settings";
export const ADMIN_SETTINGS_UPDATED_EVENT = "admin-settings-updated";

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  sms: {
    provider: "msg91",
    apiKey: "",
    apiSecret: "",
    senderId: "JATAYU",
    defaultCountryCode: "+91",
  },
  email: {
    fromName: "Jatayu",
    fromEmail: "noreply@jatayu.com",
    replyToEmail: "support@jatayu.com",
    footerText: "© Jatayu. All rights reserved.",
  },
  smtp: {
    host: "smtp.gmail.com",
    port: "587",
    username: "",
    password: "",
    encryption: "tls",
  },
  payment: {
    provider: "razorpay",
    keyId: "",
    secretKey: "",
    webhookSecret: "",
    currency: "INR",
    testMode: true,
  },
  google: {
    clientId: "",
    clientSecret: "",
    redirectUri: "https://jatayu.com/api/auth/google/callback",
    authorizedDomains: "jatayu.com",
    enableSignIn: true,
    enableCalendar: false,
  },
  templates: [
    {
      id: "tpl-approval-sms",
      name: "Expert Application Approved",
      channel: "sms",
      category: "application_approved",
      body: "Hi {{expert_name}}, your Jatayu expert application ({{app_id}}) has been approved. Log in to complete your profile: {{profile_link}}",
      variables: ["{{expert_name}}", "{{app_id}}", "{{profile_link}}"],
    },
    {
      id: "tpl-approval-email",
      name: "Expert Application Approved",
      channel: "email",
      category: "application_approved",
      subject: "Welcome to Jatayu — Your Expert Application is Approved",
      body: "Dear {{expert_name}},\n\nCongratulations! Your expert application ({{app_id}}) has been approved. You can now complete your profile and start accepting consultations.\n\nGet started: {{profile_link}}\n\nBest regards,\nThe Jatayu Team",
      variables: ["{{expert_name}}", "{{app_id}}", "{{profile_link}}"],
    },
    {
      id: "tpl-rejection-sms",
      name: "Expert Application Rejected",
      channel: "sms",
      category: "application_rejected",
      body: "Hi {{expert_name}}, your Jatayu expert application ({{app_id}}) was not approved. Reason: {{rejection_reason}}. You may reapply after {{reapply_date}}. View guidance: {{guidance_link}}",
      variables: [
        "{{expert_name}}",
        "{{app_id}}",
        "{{rejection_reason}}",
        "{{reapply_date}}",
        "{{guidance_link}}",
      ],
    },
    {
      id: "tpl-rejection-email",
      name: "Expert Application Rejected",
      channel: "email",
      category: "application_rejected",
      subject: "Update on your Jatayu Expert Application",
      body: "Dear {{expert_name}},\n\nWe regret to inform you that your expert application ({{app_id}}) was not approved at this time.\n\nReason: {{rejection_reason}}\n\nYou may reapply after {{reapply_date}}. View detailed guidance here: {{guidance_link}}\n\nBest regards,\nThe Jatayu Team",
      variables: [
        "{{expert_name}}",
        "{{app_id}}",
        "{{rejection_reason}}",
        "{{reapply_date}}",
        "{{guidance_link}}",
      ],
    },
    {
      id: "tpl-hold-sms",
      name: "Application On Hold",
      channel: "sms",
      category: "application_on_hold",
      body: "Hi {{expert_name}}, your Jatayu expert application ({{app_id}}) is on hold pending additional review. We will contact you within {{review_days}} business days.",
      variables: ["{{expert_name}}", "{{app_id}}", "{{review_days}}"],
    },
    {
      id: "tpl-otp-sms",
      name: "OTP Verification",
      channel: "sms",
      category: "otp_verification",
      body: "Your Jatayu verification code is {{otp_code}}. Valid for {{expiry_minutes}} minutes. Do not share this code with anyone.",
      variables: ["{{otp_code}}", "{{expiry_minutes}}"],
    },
    {
      id: "tpl-booking-email",
      name: "Booking Confirmed",
      channel: "email",
      category: "booking_confirmed",
      subject: "Your Jatayu Session is Confirmed — {{session_date}}",
      body: "Dear {{seeker_name}},\n\nYour session with {{expert_name}} is confirmed for {{session_date}} at {{session_time}}.\n\nSession type: {{session_type}}\nBooking ID: {{booking_id}}\n\nJoin link: {{session_link}}\n\nBest regards,\nThe Jatayu Team",
      variables: [
        "{{seeker_name}}",
        "{{expert_name}}",
        "{{session_date}}",
        "{{session_time}}",
        "{{session_type}}",
        "{{booking_id}}",
        "{{session_link}}",
      ],
    },
    {
      id: "tpl-reminder-sms",
      name: "Session Reminder",
      channel: "sms",
      category: "session_reminder",
      body: "Reminder: Your Jatayu session with {{expert_name}} starts in {{minutes_until}} minutes. Join here: {{session_link}}",
      variables: ["{{expert_name}}", "{{minutes_until}}", "{{session_link}}"],
    },
  ],
};

function dispatchUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADMIN_SETTINGS_UPDATED_EVENT));
}

function mergeWithDefaults(partial: Partial<AdminSettings>): AdminSettings {
  const templates = (partial.templates ?? DEFAULT_ADMIN_SETTINGS.templates).filter(
    (template) => template.channel === "sms" || template.channel === "email",
  );

  return {
    sms: { ...DEFAULT_ADMIN_SETTINGS.sms, ...partial.sms },
    email: { ...DEFAULT_ADMIN_SETTINGS.email, ...partial.email },
    smtp: { ...DEFAULT_ADMIN_SETTINGS.smtp, ...partial.smtp },
    payment: { ...DEFAULT_ADMIN_SETTINGS.payment, ...partial.payment },
    google: { ...DEFAULT_ADMIN_SETTINGS.google, ...partial.google },
    templates: templates.length > 0 ? templates : DEFAULT_ADMIN_SETTINGS.templates,
  };
}

export function getAdminSettings(): AdminSettings {
  if (typeof window === "undefined") return DEFAULT_ADMIN_SETTINGS;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_ADMIN_SETTINGS;

  try {
    return mergeWithDefaults(JSON.parse(raw) as Partial<AdminSettings>);
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

export function saveAdminSettings(settings: AdminSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  dispatchUpdated();
}

export function updateMessageTemplate(
  templateId: string,
  updates: Partial<MessageTemplate>,
): AdminSettings {
  const current = getAdminSettings();
  const templates = current.templates.map((template) =>
    template.id === templateId ? { ...template, ...updates } : template,
  );
  const next = { ...current, templates };
  saveAdminSettings(next);
  return next;
}
