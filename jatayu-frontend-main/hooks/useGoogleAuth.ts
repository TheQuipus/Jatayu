"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getPublicConfig,
  getSeekerPublicConfig,
  googleLogin,
  seekerGoogleLogin,
  type AuthResponse,
} from "@/lib/api";

interface GoogleAuthHookOptions {
  onSuccess: (response: AuthResponse) => void;
  onError: (error: string) => void;
  role?: "expert" | "seeker";
}

type GoogleTokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
};

function isRealGoogleClientId(value: string | null | undefined): value is string {
  if (!value) return false;
  const normalized = value.trim();
  if (!normalized) return false;
  const lower = normalized.toLowerCase();
  if (lower.includes("your_google") || lower.includes("placeholder")) return false;
  return normalized.includes(".apps.googleusercontent.com") || normalized.length > 24;
}

function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Sign-In is only available in the browser."));
  }
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  const existing = document.getElementById("google-gsi-client") as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const wait = () => {
        if (window.google?.accounts?.oauth2) {
          resolve();
          return;
        }
        if (Date.now() - started > 10000) {
          reject(new Error("Google Sign-In failed to load. Refresh the page and try again."));
          return;
        }
        window.setTimeout(wait, 50);
      };
      wait();
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google Sign-In. Check your network connection."));
    document.body.appendChild(script);
  });
}

export function useGoogleAuth({ onSuccess, onError, role = "expert" }: GoogleAuthHookOptions) {
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const tokenClientRef = useRef<GoogleTokenClient | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  const handleTokenResponse = useCallback(async (response: { access_token?: string; error?: string; error_description?: string }) => {
    if (response.error) {
      if (response.error === "popup_closed_by_user" || response.error === "access_denied") {
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      onErrorRef.current(response.error_description || "Google authentication failed.");
      return;
    }

    if (!response.access_token) {
      setIsLoading(false);
      onErrorRef.current("Google did not return an access token.");
      return;
    }

    setIsLoading(true);
    try {
      const authenticate = role === "seeker" ? seekerGoogleLogin : googleLogin;
      const authRes = await authenticate({ accessToken: response.access_token });
      onSuccessRef.current(authRes);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google authentication failed.";
      onErrorRef.current(message);
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    let active = true;
    const loadConfig = role === "seeker" ? getSeekerPublicConfig : getPublicConfig;
    loadConfig()
      .then((config) => {
        if (!active) return;
        const clientId = isRealGoogleClientId(config.googleClientId) ? config.googleClientId.trim() : null;
        setGoogleEnabled(Boolean(config.googleLoginEnabled && clientId));
        setGoogleClientId(clientId);
      })
      .catch((err) => {
        console.error("Failed to load public config for Google Sign-In:", err);
      });
    return () => {
      active = false;
    };
  }, [role]);

  useEffect(() => {
    if (!googleEnabled || !googleClientId) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.oauth2) return;
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "openid email profile",
          callback: handleTokenResponse,
          error_callback: (error: any) => {
            setIsLoading(false);
            if (error && error.type !== "popup_closed") {
              onErrorRef.current(error.message || "Google authentication failed.");
            }
          },
        });
      })
      .catch((err: unknown) => {
        console.error("Google GSI script failed to load:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [googleEnabled, googleClientId, handleTokenResponse]);

  const signInWithGoogle = useCallback(() => {
    if (!googleEnabled || !googleClientId) {
      onError("Google Sign-In is not configured. Add a Google client ID in admin settings.");
      return;
    }

    if (!tokenClientRef.current) {
      onError("Google Sign-In is still loading. Please wait a moment and try again.");
      return;
    }

    setIsLoading(true);
    tokenClientRef.current.requestAccessToken({ prompt: "select_account" });
  }, [googleEnabled, googleClientId, onError]);

  return {
    signInWithGoogle,
    isLoading,
    isAvailable: googleEnabled && Boolean(googleClientId),
  };
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
            error_callback?: (error: { type: string; message?: string }) => void;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}
