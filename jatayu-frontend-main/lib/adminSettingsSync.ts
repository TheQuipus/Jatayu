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

function readPositiveNumber(map: Record<string, string>, key: string, fallback: number): number {
  const value = Number(map[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readSmsProvider(map: Record<string, string>): SmsProvider {
  const provider = readString(map, "SMS_PROVIDER", DEFAULT_ADMIN_SETTINGS.sms.provider);
  if (provider === "twilio" || provider === "msg91" || provider === "textlocal") {
    return provider;
  }
  return DEFAULT_ADMIN_SETTINGS.sms.provider;
}

function mapSmsSettingsToBackend(sms: AdminSettings["sms"]): Record<string, string> {
  const mappedFlows = sms.flowMappings
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((result, line) => {
      const separator = line.indexOf("=");
      if (separator < 1) return result;
      const trigger = line.slice(0, separator).trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
      const flowId = line.slice(separator + 1).trim();
      if (trigger && flowId) result[`MSG91_FLOW_ID_${trigger}`] = flowId;
      return result;
    }, {});

  return {
    SMS_PROVIDER: sms.provider,
    SMS_AUTH_TOKEN: sms.authToken,
    MSG91_OTP_FLOW_ID: sms.otpFlowId,
    SMS_CONTACT_NO: sms.contactNo,
    SMS_SENDER_ID: sms.senderId,
    TWILIO_ACCOUNT_SID: sms.provider === "twilio" ? sms.authToken : "",
    TWILIO_PHONE_NUMBER: sms.senderId,
    ...mappedFlows,
  };
}

export function mapBackendSettingsToAdmin(map: Record<string, string>): AdminSettings {
  const smtpEncryption = readString(map, "SMTP_SECURE", "false") === "true" ? "ssl" : "tls";
  const smsProvider = readSmsProvider(map);

  const google: ProviderAuthCredentials = {
    clientId: readString(map, "GOOGLE_CLIENT_ID"),
    clientSecret: "",
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
    clientSecret: "",
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
    clientSecret: readString(map, "LINKEDIN_CLIENT_SECRET"),
    redirectUri: readString(
      map,
      "LINKEDIN_REDIRECT_URIS",
      readString(map, "LINKEDIN_REDIRECT_URI", DEFAULT_ADMIN_SETTINGS.auth.linkedin.redirectUri),
    ),
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
      otpFlowId: readString(map, "MSG91_OTP_FLOW_ID"),
      flowMappings: Object.keys(map)
        .filter((key) => key.startsWith("MSG91_FLOW_ID_"))
        .sort()
        .map((key) => `${key.slice("MSG91_FLOW_ID_".length)}=${map[key]}`)
        .join("\n"),
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
    booking: {
      minimumLeadTimeMinutes: Math.max(0, Number(map.BOOKING_MINIMUM_LEAD_TIME_MINUTES ?? 30) || 0),
      pokeInitialDelayHours: readPositiveNumber(map, "BOOKING_POKE_INITIAL_DELAY_HOURS", 1),
      pokeCooldownHours: readPositiveNumber(map, "BOOKING_POKE_COOLDOWN_HOURS", 4),
      pokeMaxCount: Math.floor(readPositiveNumber(map, "BOOKING_POKE_MAX_COUNT", 2)),
    },
    communication: {
      agoraEnabled: readBool(map, "AGORA_ENABLED", false),
      agoraAppId: readString(map, "AGORA_APP_ID"),
      agoraAppCertificate: readString(map, "AGORA_APP_CERTIFICATE"),
      tokenTtlSeconds: readPositiveNumber(map, "AGORA_TOKEN_TTL_SECONDS", 3600),
      joinBeforeMinutes: readPositiveNumber(map, "AGORA_JOIN_BEFORE_MINUTES", 15),
      joinAfterMinutes: readPositiveNumber(map, "AGORA_JOIN_AFTER_MINUTES", 30),
    },
    auth: {
      google,
      meta,
      linkedin,
      digilocker: {
        enabled: readBool(map, "DIGILOCKER_ENABLED", false),
        sandbox: readBool(map, "DIGILOCKER_SANDBOX", true),
        clientId: readString(map, "DIGILOCKER_CLIENT_ID"),
        clientSecret: readString(map, "DIGILOCKER_CLIENT_SECRET"),
        redirectUri: readString(map, "DIGILOCKER_REDIRECT_URI", DEFAULT_ADMIN_SETTINGS.auth.digilocker.redirectUri),
        frontendReturnUrl: readString(map, "DIGILOCKER_FRONTEND_RETURN_URL", DEFAULT_ADMIN_SETTINGS.auth.digilocker.frontendReturnUrl),
        authorizationUrl: readString(map, "DIGILOCKER_AUTHORIZATION_URL"),
        tokenUrl: readString(map, "DIGILOCKER_TOKEN_URL"),
        accountUrl: readString(map, "DIGILOCKER_ACCOUNT_URL"),
        issuedDocumentsUrl: readString(map, "DIGILOCKER_ISSUED_DOCUMENTS_URL"),
        fileUrlTemplate: readString(map, "DIGILOCKER_FILE_URL_TEMPLATE", DEFAULT_ADMIN_SETTINGS.auth.digilocker.fileUrlTemplate),
        scopes: readString(map, "DIGILOCKER_SCOPES", DEFAULT_ADMIN_SETTINGS.auth.digilocker.scopes),
      },
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
    LINKEDIN_CLIENT_SECRET: settings.auth.linkedin.clientSecret || "",
    LINKEDIN_REDIRECT_URIS: settings.auth.linkedin.redirectUri,
    LINKEDIN_AUTHORIZED_DOMAINS: settings.auth.linkedin.authorizedDomains,
    LINKEDIN_LOGIN_ENABLED: String(settings.auth.linkedin.enableSignIn),
    DIGILOCKER_ENABLED: String(settings.auth.digilocker.enabled),
    DIGILOCKER_SANDBOX: String(settings.auth.digilocker.sandbox),
    DIGILOCKER_CLIENT_ID: settings.auth.digilocker.clientId,
    DIGILOCKER_CLIENT_SECRET: settings.auth.digilocker.clientSecret,
    DIGILOCKER_REDIRECT_URI: settings.auth.digilocker.redirectUri,
    DIGILOCKER_FRONTEND_RETURN_URL: settings.auth.digilocker.frontendReturnUrl,
    DIGILOCKER_AUTHORIZATION_URL: settings.auth.digilocker.authorizationUrl,
    DIGILOCKER_TOKEN_URL: settings.auth.digilocker.tokenUrl,
    DIGILOCKER_ACCOUNT_URL: settings.auth.digilocker.accountUrl,
    DIGILOCKER_ISSUED_DOCUMENTS_URL: settings.auth.digilocker.issuedDocumentsUrl,
    DIGILOCKER_FILE_URL_TEMPLATE: settings.auth.digilocker.fileUrlTemplate,
    DIGILOCKER_SCOPES: settings.auth.digilocker.scopes,
    AI_PROVIDER_NAME: settings.ai.name,
    AI_API_KEY: settings.ai.apiKey,
    BOOKING_POKE_INITIAL_DELAY_HOURS: String(settings.booking.pokeInitialDelayHours),
    BOOKING_MINIMUM_LEAD_TIME_MINUTES: String(settings.booking.minimumLeadTimeMinutes),
    BOOKING_POKE_COOLDOWN_HOURS: String(settings.booking.pokeCooldownHours),
    BOOKING_POKE_MAX_COUNT: String(settings.booking.pokeMaxCount),
    AGORA_ENABLED: String(settings.communication.agoraEnabled),
    AGORA_APP_ID: settings.communication.agoraAppId,
    AGORA_APP_CERTIFICATE: settings.communication.agoraAppCertificate,
    AGORA_TOKEN_TTL_SECONDS: String(settings.communication.tokenTtlSeconds),
    AGORA_JOIN_BEFORE_MINUTES: String(settings.communication.joinBeforeMinutes),
    AGORA_JOIN_AFTER_MINUTES: String(settings.communication.joinAfterMinutes),
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
