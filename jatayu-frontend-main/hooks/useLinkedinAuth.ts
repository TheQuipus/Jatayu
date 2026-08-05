"use client";

import { useState, useEffect, useCallback } from "react";
import { getPublicConfig, linkedinLogin, type AuthResponse } from "@/lib/api";

interface LinkedinAuthHookOptions {
  onSuccess: (response: AuthResponse) => void;
  onError: (error: string) => void;
}

export function useLinkedinAuth({ onSuccess, onError }: LinkedinAuthHookOptions) {
  const [isMockOpen, setIsMockOpen] = useState(false);
  const [linkedinClientId, setLinkedinClientId] = useState<string | null>(null);
  const [linkedinEnabled, setLinkedinEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch public config configuration on load
  useEffect(() => {
    let active = true;
    getPublicConfig()
      .then((config) => {
        if (!active) return;
        setLinkedinEnabled(config.linkedinLoginEnabled);
        setLinkedinClientId(config.linkedinClientId || null);
      })
      .catch((err) => {
        console.error("Failed to load public config for LinkedIn Sign-In:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  const signInWithLinkedin = useCallback(() => {
    if (!linkedinEnabled) {
      onError("LinkedIn Sign-In is disabled by the administrator.");
      return;
    }

    const isMock =
      !linkedinClientId ||
      linkedinClientId.includes("your_linkedin_client_id") ||
      linkedinClientId.trim() === "";

    if (isMock) {
      // Simulation mode
      setIsMockOpen(true);
    } else {
      // Real LinkedIn Sign-In (Redirect flow)
      const redirectUri = window.location.origin + window.location.pathname;
      const oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${linkedinClientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&state=linkedin-auth&scope=openid%20profile%20email`;
      
      window.location.assign(oauthUrl);
    }
  }, [linkedinEnabled, linkedinClientId, onError]);

  // Handle OAuth code return from LinkedIn callback redirection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (code && state === "linkedin-auth") {
      // Clear URL params to avoid multiple triggers
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      setIsLoading(true);
      const redirectUri = window.location.origin + window.location.pathname;
      linkedinLogin({
        authCode: code,
        redirectUri,
      })
        .then(onSuccess)
        .catch((err) => onError(err.message || "LinkedIn login failed."))
        .finally(() => setIsLoading(false));
    }
  }, [onSuccess, onError]);

  const handleMockSelect = useCallback(
    async (profile: { email: string; fullName: string; linkedinId: string }) => {
      setIsMockOpen(false);
      setIsLoading(true);
      try {
        const authRes = await linkedinLogin({
          authCode: "mock-linkedin-token",
          email: profile.email,
          fullName: profile.fullName,
          linkedinId: profile.linkedinId,
        });
        onSuccess(authRes);
      } catch (err: any) {
        onError(err.message || "LinkedIn Simulation Login failed.");
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError]
  );

  return {
    signInWithLinkedin,
    isMockOpen,
    closeMockModal: () => setIsMockOpen(false),
    handleMockSelect,
    isLoading,
  };
}
