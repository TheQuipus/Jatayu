import { getSettings, updateSettings, type SettingItem } from "@/lib/api";
import {
  DEFAULT_ADMIN_SETTINGS,
  type AdminSettings,
  type ProviderAuthCredentials,
  type SmsProvider,
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

function readSmsProvider(map: Record<string, string>): SmsProvider {
  const provider = readString(map, "SMS_PROVIDER", DEFAULT_ADMIN_SETTINGS.sms.provider);
  if (provider === "twilio" || provider === "msg91" || provider === "textlocal") {
    return provider;
  }
  return DEFAULT_ADMIN_SETTINGS.sms.provider;
}

function mapSmsSettingsToBackend(sms: AdminSettings["sms"]): Record<string, string> {
  return {
    SMS_PROVIDER: sms.provider,
    SMS_AUTH_TOKEN: sms.authToken,
    SMS_CONTACT_NO: sms.contactNo,
    SMS_SENDER_ID: sms.senderId,
    TWILIO_ACCOUNT_SID: sms.provider === "twilio" ? sms.authToken : "",
    TWILIO_PHONE_NUMBER: sms.senderId,
  };
}

export function mapBackendSettingsToAdmin(map: Record<string, string>): AdminSettings {
  const smtpEncryption = readString(map, "SMTP_SECURE", "false") === "true" ? "ssl" : "tls";
  const smsProvider = readSmsProvider(map);

  const google: ProviderAuthCredentials = {
    clientId: readString(map, "GOOGLE_CLIENT_ID"),
    redirectUri: readString(map, "GOOGLE_REDIRECT_URI", DEFAULT_ADMIN_SETTINGS.auth.google.redirectUri),
    authorizedDomains: readString(
      map,
      "GOOGLE_AUTHORIZED_DOMAINS",
      DEFAULT_ADMIN_SETTINGS.auth.google.authorizedDomains,
    ),
    enableSignIn: readBool(map, "GOOGLE_LOGIN_ENABLED", true),
    enableCalendar: readBool(map, "GOOGLE_ENABLE_CALENDAR", false),
  };

  const meta: ProviderAuthCredentials = {
    clientId: readString(map, "META_CLIENT_ID"),
    redirectUri: readString(map, "META_REDIRECT_URI", DEFAULT_ADMIN_SETTINGS.auth.meta.redirectUri),
    authorizedDomains: readString(
      map,
      "META_AUTHORIZED_DOMAINS",
      DEFAULT_ADMIN_SETTINGS.auth.meta.authorizedDomains,
    ),
    enableSignIn: readBool(map, "META_LOGIN_ENABLED", false),
    enableCalendar: false,
  };

  const linkedin: ProviderAuthCredentials = {
    clientId: readString(map, "LINKEDIN_CLIENT_ID"),
    redirectUri: readString(map, "LINKEDIN_REDIRECT_URI", DEFAULT_ADMIN_SETTINGS.auth.linkedin.redirectUri),
    authorizedDomains: readString(
      map,
      "LINKEDIN_AUTHORIZED_DOMAINS",
      DEFAULT_ADMIN_SETTINGS.auth.linkedin.authorizedDomains,
    ),
    enableSignIn: readBool(map, "LINKEDIN_LOGIN_ENABLED", false),
    enableCalendar: false,
  };

  return {
    sms: {
      provider: smsProvider,
      authToken: readString(map, "SMS_AUTH_TOKEN") || readString(map, "TWILIO_ACCOUNT_SID"),
      contactNo: readString(map, "SMS_CONTACT_NO"),
      senderId: readString(map, "SMS_SENDER_ID", DEFAULT_ADMIN_SETTINGS.sms.senderId),
    },
    smtp: {
      host: readString(map, "SMTP_HOST", DEFAULT_ADMIN_SETTINGS.smtp.host),
      port: readString(map, "SMTP_PORT", DEFAULT_ADMIN_SETTINGS.smtp.port),
      username: readString(map, "SMTP_USER"),
      password: readString(map, "SMTP_PASS"),
      encryption: smtpEncryption === "ssl" || smtpEncryption === "tls" ? smtpEncryption : "tls",
    },
    payment: DEFAULT_ADMIN_SETTINGS.payment,
    auth: {
      google,
      meta,
      linkedin,
    },
    ai: {
      name: readString(map, "AI_PROVIDER_NAME", DEFAULT_ADMIN_SETTINGS.ai.name),
      apiKey: readString(map, "AI_API_KEY"),
    },
    templates: DEFAULT_ADMIN_SETTINGS.templates,
  };
}

export function mapAdminSettingsToBackend(settings: AdminSettings): Record<string, string> {
  return {
    SMS_ENABLED: "true",
    ...mapSmsSettingsToBackend(settings.sms),
    EMAIL_ENABLED: "true",
    SMTP_HOST: settings.smtp.host,
    SMTP_PORT: settings.smtp.port,
    SMTP_USER: settings.smtp.username,
    SMTP_PASS: settings.smtp.password,
    SMTP_SECURE: settings.smtp.encryption === "ssl" ? "true" : "false",
    GOOGLE_CLIENT_ID: settings.auth.google.clientId,
    GOOGLE_REDIRECT_URI: settings.auth.google.redirectUri,
    GOOGLE_AUTHORIZED_DOMAINS: settings.auth.google.authorizedDomains,
    GOOGLE_LOGIN_ENABLED: String(settings.auth.google.enableSignIn),
    GOOGLE_ENABLE_CALENDAR: String(settings.auth.google.enableCalendar),
    LINKEDIN_CLIENT_ID: settings.auth.linkedin.clientId,
    LINKEDIN_REDIRECT_URI: settings.auth.linkedin.redirectUri,
    LINKEDIN_AUTHORIZED_DOMAINS: settings.auth.linkedin.authorizedDomains,
    LINKEDIN_LOGIN_ENABLED: String(settings.auth.linkedin.enableSignIn),
    AI_PROVIDER_NAME: settings.ai.name,
    AI_API_KEY: settings.ai.apiKey,
  };
}

export async function fetchAdminSettingsFromBackend(): Promise<AdminSettings> {
  const items = await getSettings();
  const map = settingsArrayToMap(items);
  return mapBackendSettingsToAdmin(map);
}

export async function saveAdminSettingsToBackend(settings: AdminSettings): Promise<void> {
  const map = mapAdminSettingsToBackend(settings);
  await updateSettings(map);
}
