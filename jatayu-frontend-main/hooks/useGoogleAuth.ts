"use client";

import { useState, useEffect, useCallback } from "react";
import { getPublicConfig, googleLogin, type AuthResponse } from "@/lib/api";

interface GoogleAuthHookOptions {
  onSuccess: (response: AuthResponse) => void;
  onError: (error: string) => void;
}

export function useGoogleAuth({ onSuccess, onError }: GoogleAuthHookOptions) {
  const [isMockOpen, setIsMockOpen] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the current admin settings configuration for Google Sign-In
  useEffect(() => {
    let active = true;
    getPublicConfig()
      .then((config) => {
        if (!active) return;
        setGoogleEnabled(config.googleLoginEnabled);
        setGoogleClientId(config.googleClientId || null);
      })
      .catch((err) => {
        console.error("Failed to load public config for Google Sign-In:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  // Dynamically load Google GSI client library if a valid Client ID is present
  useEffect(() => {
    if (!googleEnabled || !googleClientId) return;
    if (googleClientId.includes("your_google_client_id") || googleClientId.trim() === "") return;

    // Check if script already exists
    if (document.getElementById("google-gsi-client")) return;

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [googleEnabled, googleClientId]);

  const handleCredentialResponse = useCallback(
    async (response: any) => {
      setIsLoading(true);
      try {
        const authRes = await googleLogin({ idToken: response.credential });
        onSuccess(authRes);
      } catch (err: any) {
        onError(err.message || "Google Authentication failed.");
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError]
  );

  const signInWithGoogle = useCallback(() => {
    if (!googleEnabled) {
      onError("Google Sign-In is disabled by the administrator.");
      return;
    }

    const isMock =
      !googleClientId ||
      googleClientId.includes("your_google_client_id") ||
      googleClientId.trim() === "";

    if (isMock) {
      // In development/mock mode, trigger the mock modal selection
      setIsMockOpen(true);
    } else {
      // Real Google Identity Services flow
      try {
        if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
          const google = (window as any).google;
          google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
          });
          google.accounts.id.prompt();
        } else {
          // If script is still loading or failed, fallback to mock modal for better UX
          console.warn("Google GSI script not fully loaded yet. Falling back to simulation mode.");
          setIsMockOpen(true);
        }
      } catch (e: any) {
        console.error("GSI prompt initialization failed:", e);
        setIsMockOpen(true);
      }
    }
  }, [googleEnabled, googleClientId, handleCredentialResponse, onError]);

  const handleMockSelect = useCallback(
    async (profile: { email: string; fullName: string; googleId: string }) => {
      setIsMockOpen(false);
      setIsLoading(true);
      try {
        const authRes = await googleLogin({
          idToken: "mock-google-token",
          email: profile.email,
          fullName: profile.fullName,
          googleId: profile.googleId,
        });
        onSuccess(authRes);
      } catch (err: any) {
        onError(err.message || "Google Simulation Login failed.");
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError]
  );

  return {
    signInWithGoogle,
    isMockOpen,
    closeMockModal: () => setIsMockOpen(false),
    handleMockSelect,
    isLoading,
  };
}
