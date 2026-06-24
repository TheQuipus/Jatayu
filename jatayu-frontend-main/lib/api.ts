/**
 * Jatayu API Client
 * Centralized helper for all backend API calls.
 * Base URL is read from NEXT_PUBLIC_API_URL env variable.
 */

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

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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
