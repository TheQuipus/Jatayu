export type SmsProvider = "twilio" | "msg91" | "textlocal" | (string & {});

export type SmtpEncryption = "tls" | "ssl" | "none";

export type MessageTemplateChannel = "sms" | "email" | "notification";

export type MessageTemplateRecipient = "expert" | "seeker";

export type MessageTemplateCategory =
  | "application_approved"
  | "application_rejected"
  | "application_on_hold"
  | "otp_verification"
  | "booking_confirmed"
  | "session_reminder";

export type SmsSettings = {
  provider: SmsProvider;
  authToken: string;
  otpFlowId: string;
  flowMappings: string;
  contactNo: string;
  senderId: string;
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

export type ProviderAuthCredentials = {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  authorizedDomains: string;
  enableSignIn: boolean;
  enableCalendar: boolean;
};

export type AuthCredentialsSettings = {
  google: ProviderAuthCredentials;
  meta: ProviderAuthCredentials;
  linkedin: ProviderAuthCredentials;
  digilocker: DigilockerSettings;
};

export type DigilockerSettings = {
  enabled: boolean;
  sandbox: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  frontendReturnUrl: string;
  authorizationUrl: string;
  tokenUrl: string;
  accountUrl: string;
  issuedDocumentsUrl: string;
  scopes: string;
};

export type MessageTemplate = {
  id: string;
  name: string;
  channel: MessageTemplateChannel;
  category: MessageTemplateCategory;
  recipient: MessageTemplateRecipient;
  subject?: string;
  body: string;
  variables: string[];
  status?: "active" | "disabled";
};

export type AiSettings = {
  name: string;
  apiKey: string;
};

export type AdminSettings = {
  sms: SmsSettings;
  smtp: SmtpSettings;
  payment: PaymentSettings;
  auth: AuthCredentialsSettings;
  ai: AiSettings;
  templates: MessageTemplate[];
};

export type SettingsSection =
  | "sms"
  | "smtp"
  | "auth"
  | "payment"
  | "ai"
  | "templates";

export const SETTINGS_SECTIONS: {
  id: SettingsSection;
  label: string;
  description: string;
}[] = [
  { id: "sms", label: "SMS Config", description: "Provider credentials and sender ID" },
  { id: "smtp", label: "SMTP", description: "Outbound mail server configuration" },
  {
    id: "auth",
    label: "Auth Credentials",
    description: "OAuth client ID, secret, and sign-in configuration",
  },
  { id: "payment", label: "Payment", description: "Gateway keys, webhooks, and payout mode" },
  { id: "ai", label: "AI Config", description: "AI provider model name and API credentials" },
  { id: "templates", label: "Templates", description: "SMS and email notification templates for experts and seekers" },
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
  email: "Emails",
  notification: "Notification",
};

export const TEMPLATE_RECIPIENT_LABELS: Record<MessageTemplateRecipient, string> = {
  expert: "Expert",
  seeker: "Seeker",
};

const STORAGE_KEY = "jatayu_admin_settings";
export const ADMIN_SETTINGS_UPDATED_EVENT = "admin-settings-updated";

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  sms: {
    provider: "msg91",
    authToken: "",
    otpFlowId: "",
    flowMappings: "",
    contactNo: "",
    senderId: "JATAYU",
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
  auth: {
    google: {
      clientId: "",
      clientSecret: "",
      redirectUri: "https://jatayu.com/api/auth/google/callback",
      authorizedDomains: "jatayu.com",
      enableSignIn: true,
      enableCalendar: false,
    },
    meta: {
      clientId: "",
      clientSecret: "",
      redirectUri: "https://jatayu.com/api/auth/meta/callback",
      authorizedDomains: "jatayu.com",
      enableSignIn: false,
      enableCalendar: false,
    },
    linkedin: {
      clientId: "",
      clientSecret: "",
      redirectUri: "https://jatayu.com/api/auth/linkedin/callback",
      authorizedDomains: "jatayu.com",
      enableSignIn: false,
      enableCalendar: false,
    },
    digilocker: {
      enabled: false,
      sandbox: true,
      clientId: "",
      clientSecret: "",
      redirectUri: "https://jatayuconnect.in/api/expert/kyc/digilocker/callback",
      frontendReturnUrl: "https://jatayuconnect.in/expert/expert-onboarding/",
      authorizationUrl: "",
      tokenUrl: "",
      accountUrl: "",
      issuedDocumentsUrl: "https://digilocker.meripehchaan.gov.in/public/oauth2/1/files/issued",
      scopes: "openid files.issueddocs",
    },
  },
  ai: {
    name: "OpenAI GPT-4",
    apiKey: "",
  },
  templates: [
    {
      id: "tpl-seeker-otp",
      name: "OTP sent SMS",
      channel: "sms",
      category: "otp_verification",
      recipient: "seeker",
      body: "Your Jatayu verification code is {{otp_code}}. Valid for {{expiry_minutes}} minutes.",
      variables: ["{{otp_code}}", "{{expiry_minutes}}"],
    },
    {
      id: "tpl-seeker-login",
      name: "Login successful",
      channel: "sms",
      category: "otp_verification",
      recipient: "seeker",
      body: "Hi {{seeker_name}}, you successfully logged in to Jatayu from {{device_info}}.",
      variables: ["{{seeker_name}}", "{{device_info}}"],
    },
    {
      id: "tpl-seeker-dropoff",
      name: "Drop-off with continue onboarding link",
      channel: "sms",
      category: "otp_verification",
      recipient: "seeker",
      body: "Hi {{seeker_name}}, you left off during onboarding. Click to continue: {{onboarding_link}}",
      variables: ["{{seeker_name}}", "{{onboarding_link}}"],
    },
    {
      id: "tpl-seeker-booking-conf",
      name: "Booking Confirmation",
      channel: "sms",
      category: "booking_confirmed",
      recipient: "seeker",
      body: "Your session with {{expert_name}} is confirmed for {{session_date}} at {{session_time}}.",
      variables: ["{{expert_name}}", "{{session_date}}", "{{session_time}}"],
    },
    {
      id: "tpl-seeker-booking-req",
      name: "Booking Request Confirmed",
      channel: "sms",
      category: "booking_confirmed",
      recipient: "seeker",
      body: "Your booking request #{{booking_id}} has been accepted by {{expert_name}}.",
      variables: ["{{booking_id}}", "{{expert_name}}"],
    },
    {
      id: "tpl-seeker-booking-resched",
      name: "Booking Reschedule",
      channel: "sms",
      category: "booking_confirmed",
      recipient: "seeker",
      body: "Your booking with {{expert_name}} was rescheduled to {{new_date}} at {{new_time}}.",
      variables: ["{{expert_name}}", "{{new_date}}", "{{new_time}}"],
    },
    {
      id: "tpl-seeker-booking-cancel",
      name: "Booking Cancelled",
      channel: "sms",
      category: "booking_confirmed",
      recipient: "seeker",
      body: "Your booking #{{booking_id}} with {{expert_name}} has been cancelled.",
      variables: ["{{booking_id}}", "{{expert_name}}"],
    },
    {
      id: "tpl-seeker-remind-1st",
      name: "Booking Reminder 1st (2hrs prior)",
      channel: "sms",
      category: "session_reminder",
      recipient: "seeker",
      body: "Reminder: Your Jatayu session with {{expert_name}} starts in 2 hours. Link: {{session_link}}",
      variables: ["{{expert_name}}", "{{session_link}}"],
    },
    {
      id: "tpl-seeker-remind-2nd",
      name: "Booking Reminder 2nd (15min prior)",
      channel: "sms",
      category: "session_reminder",
      recipient: "seeker",
      body: "Reminder: Your Jatayu session with {{expert_name}} starts in 15 minutes! Link: {{session_link}}",
      variables: ["{{expert_name}}", "{{session_link}}"],
    },
    {
      id: "tpl-expert-otp",
      name: "OTP sent SMS",
      channel: "sms",
      category: "otp_verification",
      recipient: "expert",
      body: "Your Jatayu verification code is {{otp_code}}. Valid for {{expiry_minutes}} minutes.",
      variables: ["{{otp_code}}", "{{expiry_minutes}}"],
    },
    {
      id: "tpl-expert-approval",
      name: "Application Approved",
      channel: "sms",
      category: "application_approved",
      recipient: "expert",
      body: "Hi {{expert_name}}, your Jatayu application has been approved. Complete profile: {{profile_link}}",
      variables: ["{{expert_name}}", "{{profile_link}}"],
    },
    {
      id: "tpl-expert-rejection",
      name: "Application Rejected",
      channel: "sms",
      category: "application_rejected",
      recipient: "expert",
      body: "Hi {{expert_name}}, your application was not approved. Reason: {{rejection_reason}}",
      variables: ["{{expert_name}}", "{{rejection_reason}}"],
    },
    {
      id: "tpl-expert-booking-conf",
      name: "Booking Confirmation",
      channel: "sms",
      category: "booking_confirmed",
      recipient: "expert",
      body: "Hi {{expert_name}}, new booking confirmed with {{seeker_name}} on {{session_date}}.",
      variables: ["{{expert_name}}", "{{seeker_name}}", "{{session_date}}"],
    },
    {
      id: "tpl-expert-remind-1st",
      name: "Booking Reminder 1st (2hrs prior)",
      channel: "sms",
      category: "session_reminder",
      recipient: "expert",
      body: "Reminder: Session with {{seeker_name}} starts in 2 hours. Link: {{session_link}}",
      variables: ["{{seeker_name}}", "{{session_link}}"],
    },
    {
      id: "tpl-expert-email-welcome",
      name: "Welcome Email",
      channel: "email",
      category: "application_approved",
      recipient: "expert",
      subject: "Welcome to Jatayu Expert Platform",
      body: "Dear {{expert_name}},\n\nWelcome to Jatayu! We are excited to have you onboard.\n\nBest regards,\nJatayu Team",
      variables: ["{{expert_name}}"],
    },
    {
      id: "tpl-seeker-email-conf",
      name: "Booking Confirmation Email",
      channel: "email",
      category: "booking_confirmed",
      recipient: "seeker",
      subject: "Your Booking with {{expert_name}} is Confirmed",
      body: "Dear {{seeker_name}},\n\nYour session with {{expert_name}} on {{session_date}} at {{session_time}} has been confirmed.\n\nJoin link: {{session_link}}",
      variables: ["{{seeker_name}}", "{{expert_name}}", "{{session_date}}", "{{session_time}}", "{{session_link}}"],
    },
  ],
};

function dispatchUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADMIN_SETTINGS_UPDATED_EVENT));
}

function mergeWithDefaults(partial: Partial<AdminSettings>): AdminSettings {
  const templates = (partial.templates ?? DEFAULT_ADMIN_SETTINGS.templates).filter(
    (template) =>
      template.channel === "sms" ||
      template.channel === "email" ||
      template.channel === "notification",
  );

  return {
    sms: { ...DEFAULT_ADMIN_SETTINGS.sms, ...partial.sms },
    smtp: { ...DEFAULT_ADMIN_SETTINGS.smtp, ...partial.smtp },
    payment: { ...DEFAULT_ADMIN_SETTINGS.payment, ...partial.payment },
    auth: {
      google: { ...DEFAULT_ADMIN_SETTINGS.auth.google, ...partial.auth?.google },
      meta: { ...DEFAULT_ADMIN_SETTINGS.auth.meta, ...partial.auth?.meta },
      linkedin: { ...DEFAULT_ADMIN_SETTINGS.auth.linkedin, ...partial.auth?.linkedin },
      digilocker: { ...DEFAULT_ADMIN_SETTINGS.auth.digilocker, ...partial.auth?.digilocker },
    },
    ai: { ...DEFAULT_ADMIN_SETTINGS.ai, ...partial.ai },
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
