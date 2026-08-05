import { getSettings, updateSettings, type SettingItem } from "@/lib/api";
import {
  DEFAULT_ADMIN_SETTINGS,
  type AdminSettings,
  type LinkedinCredentialsSettings,
} from "@/lib/adminSettings";

function settingsArrayToMap(items: SettingItem[]): Record<string, string> {
  return items.reduce<Record<string, string>>((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
}

function readBool(map: Record<string, string>, key: string, fallback: boolean): boolean {
  if (!(key in map)) return fallback;
  return map[key] === "true";
}

function readString(map: Record<string, string>, key: string, fallback = ""): string {
  return map[key] ?? fallback;
}

export function mapBackendSettingsToAdmin(map: Record<string, string>): AdminSettings {
  const smtpEncryption = readString(map, "SMTP_SECURE", "false") === "true" ? "ssl" : "tls";

  const linkedin: LinkedinCredentialsSettings = {
    clientId: readString(map, "LINKEDIN_CLIENT_ID"),
    clientSecret: readString(map, "LINKEDIN_CLIENT_SECRET"),
    redirectUri: readString(
      map,
      "LINKEDIN_REDIRECT_URI",
      DEFAULT_ADMIN_SETTINGS.linkedin.redirectUri,
    ),
    enableSignIn: readBool(map, "LINKEDIN_LOGIN_ENABLED", true),
  };

  return {
    sms: {
      provider: "twilio",
      apiKey: readString(map, "TWILIO_ACCOUNT_SID"),
      apiSecret: readString(map, "TWILIO_AUTH_TOKEN"),
      senderId: readString(map, "TWILIO_PHONE_NUMBER", DEFAULT_ADMIN_SETTINGS.sms.senderId),
      defaultCountryCode: readString(
        map,
        "SMS_DEFAULT_COUNTRY_CODE",
        DEFAULT_ADMIN_SETTINGS.sms.defaultCountryCode,
      ),
    },
    email: {
      fromName: readString(map, "EMAIL_FROM_NAME", DEFAULT_ADMIN_SETTINGS.email.fromName),
      fromEmail: readString(map, "FROM_EMAIL", DEFAULT_ADMIN_SETTINGS.email.fromEmail),
      replyToEmail: readString(map, "EMAIL_REPLY_TO", DEFAULT_ADMIN_SETTINGS.email.replyToEmail),
      footerText: readString(map, "EMAIL_FOOTER_TEXT", DEFAULT_ADMIN_SETTINGS.email.footerText),
    },
    smtp: {
      host: readString(map, "SMTP_HOST", DEFAULT_ADMIN_SETTINGS.smtp.host),
      port: readString(map, "SMTP_PORT", DEFAULT_ADMIN_SETTINGS.smtp.port),
      username: readString(map, "SMTP_USER"),
      password: readString(map, "SMTP_PASS"),
      encryption: smtpEncryption,
    },
    payment: DEFAULT_ADMIN_SETTINGS.payment,
    google: {
      clientId: readString(map, "GOOGLE_CLIENT_ID"),
      clientSecret: readString(map, "GOOGLE_CLIENT_SECRET"),
      redirectUri: readString(map, "GOOGLE_REDIRECT_URI", DEFAULT_ADMIN_SETTINGS.google.redirectUri),
      authorizedDomains: readString(
        map,
        "GOOGLE_AUTHORIZED_DOMAINS",
        DEFAULT_ADMIN_SETTINGS.google.authorizedDomains,
      ),
      enableSignIn: readBool(map, "GOOGLE_LOGIN_ENABLED", true),
      enableCalendar: readBool(map, "GOOGLE_ENABLE_CALENDAR", false),
    },
    linkedin,
    templates: DEFAULT_ADMIN_SETTINGS.templates,
  };
}

export function mapAdminSettingsToBackend(settings: AdminSettings): Record<string, string> {
  return {
    SMS_ENABLED: "true",
    TWILIO_ACCOUNT_SID: settings.sms.apiKey,
    TWILIO_AUTH_TOKEN: settings.sms.apiSecret,
    TWILIO_PHONE_NUMBER: settings.sms.senderId,
    SMS_DEFAULT_COUNTRY_CODE: settings.sms.defaultCountryCode,
    EMAIL_ENABLED: "true",
    EMAIL_FROM_NAME: settings.email.fromName,
    FROM_EMAIL: settings.email.fromEmail,
    EMAIL_REPLY_TO: settings.email.replyToEmail,
    EMAIL_FOOTER_TEXT: settings.email.footerText,
    SMTP_HOST: settings.smtp.host,
    SMTP_PORT: settings.smtp.port,
    SMTP_USER: settings.smtp.username,
    SMTP_PASS: settings.smtp.password,
    SMTP_SECURE: settings.smtp.encryption === "ssl" ? "true" : "false",
    GOOGLE_CLIENT_ID: settings.google.clientId,
    GOOGLE_CLIENT_SECRET: settings.google.clientSecret,
    GOOGLE_REDIRECT_URI: settings.google.redirectUri,
    GOOGLE_AUTHORIZED_DOMAINS: settings.google.authorizedDomains,
    GOOGLE_LOGIN_ENABLED: String(settings.google.enableSignIn),
    GOOGLE_ENABLE_CALENDAR: String(settings.google.enableCalendar),
    LINKEDIN_CLIENT_ID: settings.linkedin.clientId,
    LINKEDIN_CLIENT_SECRET: settings.linkedin.clientSecret,
    LINKEDIN_REDIRECT_URI: settings.linkedin.redirectUri,
    LINKEDIN_LOGIN_ENABLED: String(settings.linkedin.enableSignIn),
  };
}

export async function fetchAdminSettingsFromBackend(): Promise<AdminSettings> {
  const items = await getSettings();
  if (!items.length) return DEFAULT_ADMIN_SETTINGS;
  return mapBackendSettingsToAdmin(settingsArrayToMap(items));
}

export async function saveAdminSettingsToBackend(settings: AdminSettings): Promise<void> {
  await updateSettings(mapAdminSettingsToBackend(settings));
}
