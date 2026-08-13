/**
 * Jatayu API Client
 * Centralized helper for all backend API calls.
 * Base URL is read from NEXT_PUBLIC_API_URL env variable.
 */

import { type Expert, getTopMatchesByCategory, normalizeExpert } from "@/lib/experts";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ---------------------------------------------------------------------------
// Token helpers (localStorage)
// ---------------------------------------------------------------------------

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("jatayu_token");
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("jatayu_token", token);
}

export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("jatayu_token");
}

export function getExpertId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("jatayu_expert_id");
}

export function setExpertId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("jatayu_expert_id", id);
}

export function removeExpertId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("jatayu_expert_id");
}

export function getSeekerId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("jatayu_seeker_id");
}

export function setSeekerId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("jatayu_seeker_id", id);
}

export function removeSeekerId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("jatayu_seeker_id");
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("jatayu_admin_token");
}

export function setAdminToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("jatayu_admin_token", token);
}

export function removeAdminToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("jatayu_admin_token");
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Attach auth header if token is provided
  const authToken = token ?? getToken();
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  // Only set Content-Type for non-FormData bodies
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (data as { message?: string }).message ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

async function adminApiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  return apiFetch<T>(path, options, getAdminToken());
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

export interface RegisterResponse {
  message: string;
  expertId: string;
  email: string;
  phone: string;
  /** Returned in development mode for easy testing */
  otp?: string;
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------

export interface VerifyOtpPayload {
  expertId: string;
  code: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  onboardingStep: string;
  status: string;
  role?: string;
}

export interface AuthResponse {
  message?: string;
  token: string;
  user: AuthUser;
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------

export interface ResendOtpPayload {
  expertId: string;
}

export interface ResendOtpResponse {
  message: string;
  email: string;
  phone: string;
}

export async function resendOtp(payload: ResendOtpPayload): Promise<ResendOtpResponse> {
  return apiFetch<ResendOtpResponse>("/api/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------

export interface LoginPayload {
  email: string;
  password: string;
}

export class OtpRequiredError extends Error {
  expertId: string;
  email: string;
  phone: string;

  constructor(payload: {
    message: string;
    expertId: string;
    email: string;
    phone: string;
  }) {
    super(payload.message);
    this.name = "OtpRequiredError";
    this.expertId = payload.expertId;
    this.email = payload.email;
    this.phone = payload.phone || "";
  }
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 403 && (data as { requiresOtp?: boolean }).requiresOtp) {
    const otpData = data as {
      message: string;
      expertId: string;
      email: string;
      phone?: string;
    };
    throw new OtpRequiredError({
      message: otpData.message,
      expertId: otpData.expertId,
      email: otpData.email,
      phone: otpData.phone || "",
    });
  }

  if (!response.ok) {
    const message =
      (data as { message?: string }).message ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as AuthResponse;
}

// ---------------------------------------------------------------------------

export interface GoogleLoginPayload {
  idToken: string;
  /** Used in mock mode */
  email?: string;
  fullName?: string;
  googleId?: string;
}

export async function googleLogin(payload: GoogleLoginPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Expert API
// ---------------------------------------------------------------------------

export interface UpdateProfilePayload {
  step?: string;
  category?: string;
  skills?: string[];
  experienceLevel?: string;
  professionalTitle?: string;
  tagLine?: string;
  bio?: string;
  credentials?: Array<{
    type: string;
    title: string;
    institution: string;
    startYear: number;
    endYear?: number | null;
    description?: string | null;
  }>;
  selectedFormats?: string[];
  selectedLengths?: string[];
  formatPrices?: Record<string, string>;
  targetAudience?: string[];
  focusAreas?: string[];
  timezone?: string;
  availabilitySlots?: Array<{ days: string[]; from: string; to: string }>;
  profilePhotoSrc?: string;
  onboardingMetadata?: Record<string, unknown>;
}

export interface UpdateProfileResponse {
  message: string;
  expert: Record<string, unknown>;
}

/**
 * Update expert profile for a given onboarding step.
 * Supports both JSON and multipart/form-data (for photo uploads).
 */
export async function updateProfile(
  payload: UpdateProfilePayload,
  photoFile?: File | null
): Promise<UpdateProfileResponse> {
  const token = getToken();

  if (photoFile) {
    // Use FormData for multipart upload
    const form = new FormData();
    form.append("profilePhoto", photoFile);
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        form.append(
          key,
          typeof value === "object" ? JSON.stringify(value) : String(value)
        );
      }
    });

    return apiFetch<UpdateProfileResponse>(
      "/api/expert/profile",
      { method: "PUT", body: form },
      token
    );
  }

  return apiFetch<UpdateProfileResponse>(
    "/api/expert/profile",
    { method: "PUT", body: JSON.stringify(payload) },
    token
  );
}

// ---------------------------------------------------------------------------

export interface SubmitOnboardingResponse {
  message: string;
  expert: Record<string, unknown>;
}

export async function submitOnboarding(): Promise<SubmitOnboardingResponse> {
  return apiFetch<SubmitOnboardingResponse>("/api/expert/submit", {
    method: "POST",
  });
}

// ---------------------------------------------------------------------------

export async function getProfile(): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>("/api/expert/me", {
    method: "GET",
  });
}

// ---------------------------------------------------------------------------
// LinkedIn Login API
// ---------------------------------------------------------------------------

export interface LinkedinLoginPayload {
  authCode: string;
  email?: string;
  fullName?: string;
  linkedinId?: string;
  redirectUri?: string;
}

export async function linkedinLogin(payload: LinkedinLoginPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/linkedin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Admin Auth API
// ---------------------------------------------------------------------------

export interface AdminLoginPayload {
  email: string;
  password: string;
  otp: string;
}

export interface AdminAuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AdminAuthResponse {
  token: string;
  user: AdminAuthUser;
}

export async function adminLogin(payload: AdminLoginPayload): Promise<AdminAuthResponse> {
  return apiFetch<AdminAuthResponse>("/api/admin/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAdminMe(): Promise<AdminAuthUser> {
  return adminApiFetch<AdminAuthUser>("/api/admin/auth/me", {
    method: "GET",
  });
}

// ---------------------------------------------------------------------------
// Admin Settings & Public Config API
// ---------------------------------------------------------------------------

export interface SettingItem {
  key: string;
  value: string;
  description?: string;
}

export interface PublicConfig {
  emailEnabled: boolean;
  smsEnabled: boolean;
  googleLoginEnabled: boolean;
  linkedinLoginEnabled: boolean;
  googleClientId?: string;
  linkedinClientId?: string;
}

export async function getPublicConfig(): Promise<PublicConfig> {
  return apiFetch<PublicConfig>("/api/auth/config", {
    method: "GET",
  });
}

export async function getSettings(): Promise<SettingItem[]> {
  return adminApiFetch<SettingItem[]>("/api/admin/settings", {
    method: "GET",
  });
}

export async function updateSettings(settings: Record<string, string>): Promise<{ message: string }> {
  return adminApiFetch<{ message: string }>("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify({ settings }),
  });
}

// ---------------------------------------------------------------------------
// Admin Applications API
// ---------------------------------------------------------------------------

export interface BackendExpertApplicationRecord extends Record<string, unknown> {
  id: string;
  applicationNumber?: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  status?: string | null;
  frontendStatus?: string;
  submittedAt?: string | null;
  updatedAt?: string | null;
  reviewerNote?: string | null;
}

export async function getAdminApplications(
  status?: string,
): Promise<BackendExpertApplicationRecord[]> {
  const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  return adminApiFetch<BackendExpertApplicationRecord[]>(`/api/admin/applications${query}`, {
    method: "GET",
  });
}

export async function getAdminApplication(
  appId: string,
): Promise<BackendExpertApplicationRecord> {
  return adminApiFetch<BackendExpertApplicationRecord>(`/api/admin/applications/${encodeURIComponent(appId)}`, {
    method: "GET",
  });
}

export interface UpdateApplicationStatusPayload {
  status: "pending" | "in_review" | "on_hold" | "approved" | "rejected";
  reviewerNote?: string;
}

export async function updateAdminApplicationStatus(
  appId: string,
  payload: UpdateApplicationStatusPayload,
): Promise<{ message: string; expert: BackendExpertApplicationRecord }> {
  return adminApiFetch<{ message: string; expert: BackendExpertApplicationRecord }>(
    `/api/admin/applications/${encodeURIComponent(appId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function getAdminApplicationStats(): Promise<Record<string, number>> {
  return adminApiFetch<Record<string, number>>("/api/admin/applications/stats", {
    method: "GET",
  });
}

// ---------------------------------------------------------------------------
// Seeker Auth API
// ---------------------------------------------------------------------------

export interface SeekerRegisterResponse {
  message: string;
  seekerId: string;
  email: string;
  phone: string;
}

export async function registerSeeker(payload: RegisterPayload): Promise<SeekerRegisterResponse> {
  return apiFetch<SeekerRegisterResponse>("/api/seeker-auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface VerifySeekerOtpPayload {
  seekerId: string;
  code: string;
}

export async function verifySeekerOtp(payload: VerifySeekerOtpPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/seeker-auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface ResendSeekerOtpPayload {
  seekerId: string;
}

export async function resendSeekerOtp(payload: ResendSeekerOtpPayload): Promise<ResendOtpResponse> {
  return apiFetch<ResendOtpResponse>("/api/seeker-auth/resend-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export class SeekerOtpRequiredError extends Error {
  seekerId: string;
  email: string;
  phone: string;

  constructor(payload: {
    message: string;
    seekerId: string;
    email: string;
    phone: string;
  }) {
    super(payload.message);
    this.name = "SeekerOtpRequiredError";
    this.seekerId = payload.seekerId;
    this.email = payload.email;
    this.phone = payload.phone || "";
  }
}

export async function seekerLogin(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/api/seeker-auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 403 && (data as { requiresOtp?: boolean }).requiresOtp) {
    const otpData = data as {
      message: string;
      seekerId: string;
      email: string;
      phone?: string;
    };
    throw new SeekerOtpRequiredError({
      message: otpData.message,
      seekerId: otpData.seekerId,
      email: otpData.email,
      phone: otpData.phone || "",
    });
  }

  if (!response.ok) {
    const message =
      (data as { message?: string }).message ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as AuthResponse;
}

export async function getSeekerPublicConfig(): Promise<PublicConfig> {
  return apiFetch<PublicConfig>("/api/seeker-auth/config", {
    method: "GET",
  });
}

export interface SeekerOnboardingPayload {
  selectedCategory: string;
  selectedTopics: string[];
  needsText: string;
  selectedNeedChips: string[];
  selectedFormats: string[];
  selectedBudget: string;
  selectedLanguages: string[];
  location: string;
  additionalContext: string;
  profilePhotoSrc?: string;
  onboardingMetadata?: Record<string, unknown>;
}

export type SeekerOnboardingStep =
  | "category"
  | "needs"
  | "format"
  | "budget"
  | "personalisation"
  | "review";

export type UpdateSeekerOnboardingPayload = Partial<SeekerOnboardingPayload> & {
  step: SeekerOnboardingStep;
};

export interface UpdateSeekerOnboardingResponse {
  message: string;
  seeker: Record<string, unknown>;
}

export async function updateSeekerOnboarding(
  payload: UpdateSeekerOnboardingPayload,
): Promise<UpdateSeekerOnboardingResponse> {
  return apiFetch<UpdateSeekerOnboardingResponse>("/api/seeker/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export interface SubmitSeekerOnboardingResponse {
  message: string;
  seeker: Record<string, unknown>;
}

export async function submitSeekerOnboarding(
  payload: SeekerOnboardingPayload,
): Promise<SubmitSeekerOnboardingResponse> {
  return apiFetch<SubmitSeekerOnboardingResponse>("/api/seeker/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getSeekerProfile(): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>("/api/seeker/me", {
    method: "GET",
  });
}

// ---------------------------------------------------------------------------
// Featured Matches API
// ---------------------------------------------------------------------------

export interface FeaturedMatchQuery {
  category?: string;
  topics?: string[];
  limit?: number;
}

export async function getFeaturedMatches(
  query?: FeaturedMatchQuery,
): Promise<Expert[]> {
  const params = new URLSearchParams();
  if (query?.category) params.set("category", query.category);
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.topics && query.topics.length > 0) {
    params.set("topics", query.topics.join(","));
  }

  const queryString = params.toString() ? `?${params.toString()}` : "";

  return apiFetch<unknown>(`/api/seeker/featured-matches${queryString}`, {
    method: "GET",
  })
    .then((res) => {
      let rawList: Record<string, unknown>[] = [];
      if (Array.isArray(res)) {
        rawList = res as Record<string, unknown>[];
      } else if (res && typeof res === "object") {
        const obj = res as Record<string, unknown>;
        if (Array.isArray(obj.matches)) {
          rawList = obj.matches as Record<string, unknown>[];
        } else if (Array.isArray(obj.data)) {
          rawList = obj.data as Record<string, unknown>[];
        }
      }

      return rawList.map((item) => normalizeExpert(item));
    })
    .catch(() => {
      return [];
    });
}
