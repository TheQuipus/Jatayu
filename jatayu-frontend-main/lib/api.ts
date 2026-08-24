/**
 * Jatayu API Client
 * Centralized helper for all backend API calls.
 * Base URL is read from NEXT_PUBLIC_API_URL env variable.
 */

import { type Expert, expertSlug, getExpertById, getTopMatchesByCategory, normalizeExpert } from "@/lib/experts";
import type { ClientRequest, RequestStatus } from "@/lib/expertRequests";
import { publicApiBase } from "@/lib/publicApiBase";
import { parseUtcDate, formatUtcToLocalDate, formatUtcToLocalTime, formatUtcRelativeTime } from "@/lib/dateTimeUtils";

const BASE_URL = publicApiBase();

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Token & Session helpers (Tab-Isolated Session Storage with Local Storage Fallback)
// ---------------------------------------------------------------------------

function getDualStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}

function setDualStorageItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, value);
  localStorage.setItem(key, value);
}

function removeDualStorageItem(key: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
}

export function getToken(): string | null {
  return getDualStorageItem("jatayu_token");
}

export function setToken(token: string): void {
  setDualStorageItem("jatayu_token", token);
}

export function removeToken(): void {
  removeDualStorageItem("jatayu_token");
}

export function getExpertId(): string | null {
  return getDualStorageItem("jatayu_expert_id");
}

export function setExpertId(id: string): void {
  setDualStorageItem("jatayu_expert_id", id);
}

export function removeExpertId(): void {
  removeDualStorageItem("jatayu_expert_id");
}

export function getSeekerId(): string | null {
  return getDualStorageItem("jatayu_seeker_id");
}

export function setSeekerId(id: string): void {
  setDualStorageItem("jatayu_seeker_id", id);
}

export function removeSeekerId(): void {
  removeDualStorageItem("jatayu_seeker_id");
}

export function getAdminToken(): string | null {
  return getDualStorageItem("jatayu_admin_token");
}

export function setAdminToken(token: string): void {
  setDualStorageItem("jatayu_admin_token", token);
}

export function removeAdminToken(): void {
  removeDualStorageItem("jatayu_admin_token");
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

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Cannot reach the API at ${BASE_URL}. Start the backend with npm run dev in backend/ and ensure MySQL/MariaDB is running.`,
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (data as { message?: string }).message ||
      `Request failed with status ${response.status}`;
    const code = (data as { code?: string }).code;
    throw new ApiError(message, response.status, code);
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
  profilePhotoSrc?: string;
  onboardingStep: string;
  status: string;
  role?: string;
  /** True only after wizard submit (`onboardingStep === "success"`) or approval. */
  onboardingComplete?: boolean;
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

function isIncorrectCredentialsMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("incorrect credentials") ||
    lower.includes("invalid email") ||
    lower.includes("invalid password")
  );
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      `Cannot reach the API at ${BASE_URL}. Start the backend with npm run dev in backend/ and ensure MySQL/MariaDB is running.`,
    );
  }

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

  if (response.status === 401) {
    throw new ApiError("incorrect credentials", 401);
  }

  if (!response.ok) {
    const message =
      (data as { message?: string }).message ||
      `Request failed with status ${response.status}`;
    const code = (data as { code?: string }).code;
    if (isIncorrectCredentialsMessage(message)) {
      throw new ApiError("incorrect credentials", response.status, code);
    }
    throw new ApiError(message, response.status, code);
  }

  return data as AuthResponse;
}

// ---------------------------------------------------------------------------

export interface GoogleLoginPayload {
  idToken?: string;
  accessToken?: string;
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

export type DigilockerKycStartResponse = {
  authorizationUrl: string;
  sandbox?: boolean;
};

export type DigilockerKycStatusResponse = {
  configured: boolean;
  sandbox?: boolean;
  kyc?: Record<string, unknown> | null;
  governmentId?: Record<string, unknown> | null;
};

export async function startDigilockerKyc(): Promise<DigilockerKycStartResponse> {
  return apiFetch<DigilockerKycStartResponse>("/api/expert/kyc/digilocker/start", {
    method: "POST",
  });
}

export async function getDigilockerKycStatus(): Promise<DigilockerKycStatusResponse> {
  return apiFetch<DigilockerKycStatusResponse>("/api/expert/kyc/digilocker/status", {
    method: "GET",
  });
}

export type OnboardingAiSuggestPayload = {
  fullName?: string;
  category?: string;
  skills?: string[];
  experienceLevel?: string;
  professionalTitle?: string;
  languages?: string[];
  employment?: Array<{
    jobTitle?: string;
    company?: string;
    responsibilities?: string;
  }>;
  education?: Array<{
    degree?: string;
    fieldOfStudy?: string;
    institution?: string;
  }>;
  currentTagLine?: string;
  currentBio?: string;
  tone?: string;
  intent?: "suggest" | "regenerate" | "improve";
  variantIndex?: number;
  field?: "tagLine" | "bio";
};

export type OnboardingAiSuggestResponse = {
  tagLine: string;
  bio: string;
  briefIntroduction?: string;
  source?: "ai" | "fallback";
  notice?: string;
};

export async function suggestOnboardingIdentityCopy(
  payload: OnboardingAiSuggestPayload,
): Promise<OnboardingAiSuggestResponse> {
  return apiFetch<OnboardingAiSuggestResponse>("/api/expert/onboarding/ai-suggest", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type RecommendSkillsResponse = {
  valid: boolean;
  message?: string;
  skills: string[];
  source?: "ai" | "fallback";
};

export async function recommendSkillsForCategory(
  category: string,
): Promise<RecommendSkillsResponse> {
  return apiFetch<RecommendSkillsResponse>("/api/expert/onboarding/recommend-skills", {
    method: "POST",
    body: JSON.stringify({ category }),
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
  otp?: string;
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
  try {
    return await apiFetch<AdminAuthResponse>("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "incorrect credentials";
    if (isIncorrectCredentialsMessage(message)) {
      throw new Error("incorrect credentials");
    }
    throw error instanceof Error ? error : new Error(message);
  }
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

// ---------------------------------------------------------------------------
// Public Expert API
// ---------------------------------------------------------------------------

export async function getPublicExpert(expertId: string): Promise<Expert | null> {
  if (!expertId) return null;

  // 1. Try direct public expert endpoint by target ID or UUID
  try {
    const res = await apiFetch<unknown>(`/api/public/experts/${encodeURIComponent(expertId)}`, {
      method: "GET",
    });
    if (res && typeof res === "object") {
      const norm = normalizeExpert(res as Record<string, unknown>);
      if (norm && norm.name && norm.name !== "Verified Expert") {
        return norm;
      }
    }
  } catch {
    // continue
  }

  // 2. Search public experts list to match slug (e.g., "aditya-kane") with real database UUID
  try {
    const listRes = await getPublicExperts({ limit: 100 });
    const targetSlug = expertSlug(expertId);

    const match = listRes.rawExperts?.find((item) => {
      const nameSlug = expertSlug(item.fullName || item.name || "");
      return item.id === expertId || nameSlug === targetSlug;
    });

    if (match && match.id) {
      try {
        const detailRes = await apiFetch<unknown>(`/api/public/experts/${encodeURIComponent(match.id)}`, {
          method: "GET",
        });
        if (detailRes && typeof detailRes === "object") {
          return normalizeExpert(detailRes as Record<string, unknown>);
        }
      } catch {
        // fallback to match object
      }
      return normalizeExpert(match as unknown as Record<string, unknown>);
    }
  } catch {
    // continue
  }

  return getExpertById(expertId) ?? null;
}

export interface PublicExpertAvailability {
  id: string;
  days: string[];
  fromTime: string;
  toTime: string;
}

export interface PublicExpertApiItem {
  id: string;
  fullName?: string;
  name?: string;
  professionalTitle?: string;
  role?: string;
  tagLine?: string;
  bio?: string;
  profilePhotoSrc?: string;
  category?: string;
  skills?: string[];
  focusAreas?: string[];
  topics?: string[];
  languages?: string[];
  experienceLevel?: string;
  targetAudience?: string[];
  timezone?: string;
  selectedFormats?: string[];
  selectedLengths?: string[];
  formatPrices?: Record<string, string | number>;
  price?: number;
  replyTime?: string | null;
  replyTimeMinutes?: number | null;
  availabilities?: PublicExpertAvailability[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface FilterOptions {
  categories: string[];
  languages: string[];
  price: {
    min: number;
    max: number;
  };
  availability: Array<{
    value: number;
    label: string;
  }>;
}

export interface PublicExpertsQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  topics?: string[];
  topic?: string;
  languages?: string[];
  language?: string;
  ratings?: string[];
  rating?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: string | number;
  sortBy?: string;
  sort?: string;
}

export interface PublicExpertsResponse {
  experts: Expert[];
  rawExperts?: PublicExpertApiItem[];
  pagination: PaginationInfo;
  filters: FilterOptions;
}

export async function getPublicExperts(
  params: PublicExpertsQueryParams = {}
): Promise<PublicExpertsResponse> {
  const urlParams = new URLSearchParams();
  urlParams.set("page", String(params.page || 1));
  urlParams.set("limit", String(params.limit || 12));

  if (params.category) urlParams.set("category", params.category);
  if (params.search) urlParams.set("search", params.search);
  if (params.topic) {
    urlParams.set("topic", params.topic);
  }
  if (params.topics && params.topics.length > 0) {
    urlParams.set("topics", params.topics.join(","));
  }
  if (params.language) {
    urlParams.set("language", params.language);
  }
  if (params.languages && params.languages.length > 0) {
    urlParams.set("languages", params.languages.join(","));
  }
  if (params.rating) {
    urlParams.set("rating", params.rating);
  }
  if (params.ratings && params.ratings.length > 0) {
    urlParams.set("ratings", params.ratings.join(","));
  }
  if (params.minPrice !== undefined) urlParams.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) urlParams.set("maxPrice", String(params.maxPrice));
  if (params.availability) urlParams.set("availability", String(params.availability));
  const sortVal = params.sort || params.sortBy;
  if (sortVal) {
    urlParams.set("sort", sortVal);
    urlParams.set("sortBy", sortVal);
  }

  const queryString = urlParams.toString();
  const res = await apiFetch<Record<string, unknown>>(`/api/public/experts?${queryString}`, {
    method: "GET",
  });

  const rawExpertsList = (
    Array.isArray(res.experts)
      ? res.experts
      : Array.isArray(res.data)
        ? res.data
        : []
  ) as Record<string, unknown>[];

  const experts = rawExpertsList.map((item) => normalizeExpert(item));

  const paginationRaw = (res.pagination || {}) as Record<string, unknown>;
  const pagination: PaginationInfo = {
    page: Number(paginationRaw.page) || params.page || 1,
    limit: Number(paginationRaw.limit) || params.limit || 12,
    total: typeof paginationRaw.total === "number" ? paginationRaw.total : experts.length,
    totalPages: typeof paginationRaw.totalPages === "number" ? paginationRaw.totalPages : Math.ceil(experts.length / (params.limit || 12)) || 1,
    hasNextPage: typeof paginationRaw.hasNextPage === "boolean" ? paginationRaw.hasNextPage : (params.page || 1) < (Math.ceil(experts.length / (params.limit || 12)) || 1),
    hasPreviousPage: typeof paginationRaw.hasPreviousPage === "boolean" ? paginationRaw.hasPreviousPage : (params.page || 1) > 1,
  };

  const filtersRaw = (res.filters || {}) as Record<string, unknown>;
  const priceRaw = (filtersRaw.price || {}) as Record<string, unknown>;
  const filters: FilterOptions = {
    categories: Array.isArray(filtersRaw.categories) ? filtersRaw.categories.map(String) : [],
    languages: Array.isArray(filtersRaw.languages) ? filtersRaw.languages.map(String) : [],
    price: {
      min: typeof priceRaw.min === "number" ? priceRaw.min : 0,
      max: typeof priceRaw.max === "number" ? priceRaw.max : 300000,
    },
    availability: Array.isArray(filtersRaw.availability)
      ? (filtersRaw.availability as Array<{ value: number; label: string }>)
      : [],
  };

  return {
    experts,
    rawExperts: rawExpertsList as unknown as PublicExpertApiItem[],
    pagination,
    filters,
  };
}

// ---------------------------------------------------------------------------
// Expert Requests API
// ---------------------------------------------------------------------------

export interface ExpertRequestsQueryParams {
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface ExpertRequestsResponse {
  requests: ClientRequest[];
  pagination: PaginationInfo;
  counts?: Record<string, number>;
}

export function normalizeClientRequest(item: Record<string, unknown>): ClientRequest {
  const seekerObj = (item.seeker || {}) as Record<string, unknown>;
  const amountsObj = (item.amounts || {}) as Record<string, unknown>;

  const reqStatusStr = String(item.requestStatus || item.status || "new").toLowerCase();
  const validStatus: RequestStatus =
    reqStatusStr === "accepted" || reqStatusStr === "confirmed"
      ? "accepted"
      : reqStatusStr === "declined" || reqStatusStr === "rejected"
        ? "declined"
        : reqStatusStr === "pending"
          ? "pending"
          : reqStatusStr === "awaiting_expert"
            ? "new"
            : "new";

  const clientName = String(
    seekerObj.fullName || item.seekerName || item.clientName || item.userName || "Client"
  );
  const clientAvatar = String(
    seekerObj.profilePhotoSrc || item.seekerAvatar || item.clientAvatar || item.userAvatar || "/assets/img/avatar1.png"
  );

  const title = String(item.subject || item.title || item.topic || "Consultation Session");
  const description = String(item.context || item.description || item.notes || item.summary || "");

  let price = 0;
  if (typeof amountsObj.total === "number") {
    price = amountsObj.unit === "paise" ? Math.round(amountsObj.total / 100) : amountsObj.total;
  } else if (typeof item.totalAmount === "number") {
    price = item.totalAmount > 1000 ? Math.round(item.totalAmount / 100) : item.totalAmount;
  } else if (typeof item.payableAmount === "number") {
    price = item.payableAmount > 1000 ? Math.round(item.payableAmount / 100) : item.payableAmount;
  } else if (typeof item.price === "number") {
    price = item.price;
  }

  let dateLabel = String(item.dateLabel || item.requestedDate || "");
  let durationLabel = String(item.durationLabel || item.duration || "");

  if (item.scheduledStartAt) {
    const startDate = parseUtcDate(item.scheduledStartAt as string | Date | number);
    if (startDate) {
      dateLabel = formatUtcToLocalDate(startDate, { month: "short", day: "numeric", year: "numeric" });

      if (item.scheduledEndAt) {
        const endDate = parseUtcDate(item.scheduledEndAt as string | Date | number);
        if (endDate) {
          const startTimeStr = formatUtcToLocalTime(startDate);
          const endTimeStr = formatUtcToLocalTime(endDate);
          durationLabel = `${startTimeStr} - ${endTimeStr}`;
        }
      }
    }
  }

  if (!dateLabel) dateLabel = "Dec 20, 2024";
  if (!durationLabel) durationLabel = "30 mins";

  const consultationType = String(item.consultationType || "video").toLowerCase();
  const formatLabel = String(
    item.formatLabel ||
    (consultationType === "video"
      ? "Video call"
      : consultationType === "text" || consultationType === "chat"
        ? "Text chat"
        : "Async consultation")
  );

  const createdAtParsed = parseUtcDate(item.createdAt as string | Date | number);
  const timeAgoLabel = createdAtParsed
    ? formatUtcRelativeTime(createdAtParsed)
    : String(item.timeAgo || "Recently");

  return {
    id: String(item.id || item._id || `req-${Math.random().toString(36).substring(2, 9)}`),
    clientName,
    clientAvatar,
    title,
    description,
    status: validStatus,
    urgent: Boolean(item.urgent),
    repeatClient: Boolean(item.repeatClient),
    isPoked: Boolean(item.isPoked),
    pokeCount: typeof item.pokeCount === "number" ? item.pokeCount : undefined,
    price,
    timeAgo: timeAgoLabel,
    dateLabel,
    durationLabel,
    formatLabel,
    createdAt: createdAtParsed ? createdAtParsed.getTime() : Date.now(),
    declineReason: item.declineReasonNotes
      ? String(item.declineReasonNotes)
      : item.declineReason
        ? String(item.declineReason)
        : undefined,
    declineNotes: item.declineReasonNotes
      ? String(item.declineReasonNotes)
      : item.declineNotes
        ? String(item.declineNotes)
        : undefined,
    expertProfessionalTitle: item.expertProfessionalTitle
      ? String(item.expertProfessionalTitle)
      : seekerObj.category
        ? String(seekerObj.category)
        : undefined,
    rawItem: item,
  };
}

export async function getExpertRequests(
  params: ExpertRequestsQueryParams = {}
): Promise<ExpertRequestsResponse> {
  const urlParams = new URLSearchParams();
  urlParams.set("status", params.status || "all");
  urlParams.set("page", String(params.page || 1));
  urlParams.set("limit", String(params.limit || 20));
  urlParams.set("sort", params.sort || "newest");

  const queryString = urlParams.toString();
  const res = await apiFetch<Record<string, unknown>>(`/api/expert/requests?${queryString}`, {
    method: "GET",
  });

  const rawList = (
    Array.isArray(res.requests)
      ? res.requests
      : Array.isArray(res.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : []
  ) as Record<string, unknown>[];

  const requests = rawList.map((item) => normalizeClientRequest(item));

  const paginationRaw = (res.pagination || {}) as Record<string, unknown>;
  const totalPages =
    typeof paginationRaw.totalPages === "number"
      ? paginationRaw.totalPages
      : typeof paginationRaw.pages === "number"
        ? (paginationRaw.pages as number)
        : Math.ceil(requests.length / (params.limit || 20)) || 1;

  const pagination: PaginationInfo = {
    page: Number(paginationRaw.page) || params.page || 1,
    limit: Number(paginationRaw.limit) || params.limit || 20,
    total: typeof paginationRaw.total === "number" ? paginationRaw.total : requests.length,
    totalPages,
    hasNextPage:
      typeof paginationRaw.hasNextPage === "boolean"
        ? paginationRaw.hasNextPage
        : (params.page || 1) < totalPages,
    hasPreviousPage:
      typeof paginationRaw.hasPreviousPage === "boolean"
        ? paginationRaw.hasPreviousPage
        : (params.page || 1) > 1,
  };

  const counts = (res.counts || {}) as Record<string, number>;

  return {
    requests,
    pagination,
    counts,
  };
}

export interface ExpertRequestDecisionPayload {
  decision: "accept" | "accepted" | "decline" | "declined" | "reschedule";
  reasonCode?: string;
  reasonNotes?: string;
  reason?: string;
  notes?: string;
  proposedSlots?: Array<{ date: string; time: string }>;
}

export function toReasonCode(reason?: string): string {
  if (!reason) return "scheduling_conflict";
  const lower = reason.toLowerCase();
  if (lower.includes("not available") || lower.includes("schedule") || lower.includes("conflict") || lower.includes("available")) {
    return "scheduling_conflict";
  }
  if (lower.includes("outside expertise") || lower.includes("expertise")) {
    return "outside_expertise";
  }
  if (lower.includes("out of scope") || lower.includes("scope")) {
    return "out_of_scope";
  }
  if (lower.includes("budget") || lower.includes("fee")) {
    return "budget_mismatch";
  }
  if (lower.includes("notice") || lower.includes("lead")) {
    return "short_notice";
  }
  return "scheduling_conflict";
}

export async function submitExpertRequestDecision(
  bookingId: string,
  payload: ExpertRequestDecisionPayload
): Promise<{ message: string; request?: ClientRequest }> {
  const res = await apiFetch<Record<string, unknown>>(
    `/api/expert/requests/${encodeURIComponent(bookingId)}/decision`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );

  const requestObj = res.request ? normalizeClientRequest(res.request as Record<string, unknown>) : undefined;

  return {
    message: String(res.message || "Decision submitted successfully"),
    request: requestObj,
  };
}

export async function updateExpertRequestStatusApi(
  requestId: string,
  status: RequestStatus,
  declineReason?: string,
  declineNotes?: string
): Promise<{ message: string; request?: ClientRequest }> {
  try {
    const isDeclined = status === "declined";
    const isAccepted = status === "accepted";
    const decisionVal = isDeclined ? "declined" : isAccepted ? "accepted" : (status as any);

    return await submitExpertRequestDecision(requestId, {
      decision: decisionVal,
      ...(isDeclined
        ? {
          reasonCode: toReasonCode(declineReason),
          reasonNotes: declineNotes || declineReason || "",
          reason: declineReason,
          notes: declineNotes,
        }
        : {}),
    });
  } catch {
    // Fallback to PATCH /api/expert/requests/:requestId/status if decision endpoint fails
    const res = await apiFetch<Record<string, unknown>>(
      `/api/expert/requests/${encodeURIComponent(requestId)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status,
          ...(declineReason ? { declineReason, reasonCode: toReasonCode(declineReason) } : {}),
          ...(declineNotes ? { declineNotes, reasonNotes: declineNotes } : {}),
        }),
      }
    );

    const requestObj = res.request ? normalizeClientRequest(res.request as Record<string, unknown>) : undefined;

    return {
      message: String(res.message || "Status updated successfully"),
      request: requestObj,
    };
  }
}



