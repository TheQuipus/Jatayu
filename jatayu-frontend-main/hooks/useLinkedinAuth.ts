"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPublicConfig,
  getSeekerPublicConfig,
  linkedinLogin,
  seekerLinkedinLogin,
  type AuthResponse,
} from "@/lib/api";

interface LinkedinAuthHookOptions {
  onSuccess: (response: AuthResponse) => void;
  onError: (error: string) => void;
  role?: "expert" | "seeker";
}

function getLinkedinRedirectUri(role: "expert" | "seeker") {
  const callbackPath = role === "seeker"
    ? "/seeker/seeker-onboarding"
    : "/expert/expert-onboarding";
  return `${window.location.origin}${callbackPath}`;
}

export function useLinkedinAuth({ onSuccess, onError, role = "expert" }: LinkedinAuthHookOptions) {
  const [linkedinClientId, setLinkedinClientId] = useState<string | null>(null);
  const [linkedinEnabled, setLinkedinEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch public config configuration on load
  useEffect(() => {
    let active = true;
    const loadConfig = role === "seeker" ? getSeekerPublicConfig : getPublicConfig;
    loadConfig()
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
  }, [role]);

  const signInWithLinkedin = useCallback(() => {
    if (!linkedinEnabled) {
      onError("LinkedIn Sign-In is disabled by the administrator.");
      return;
    }

    if (!linkedinClientId || linkedinClientId.trim() === "") {
      onError("LinkedIn Sign-In is not configured.");
      return;
    }

    const redirectUri = getLinkedinRedirectUri(role);
    const state = crypto.randomUUID();
    sessionStorage.setItem(`jatayu_linkedin_oauth_state_${role}`, state);
    const oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${linkedinClientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${encodeURIComponent(state)}&scope=openid%20profile%20email`;
    window.location.assign(oauthUrl);
  }, [linkedinEnabled, linkedinClientId, onError, role]);

  // Handle OAuth code return from LinkedIn callback redirection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    const expectedState = sessionStorage.getItem(`jatayu_linkedin_oauth_state_${role}`);
    if (code && state && expectedState && state === expectedState) {
      sessionStorage.removeItem(`jatayu_linkedin_oauth_state_${role}`);
      // Clear URL params to avoid multiple triggers
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      queueMicrotask(() => setIsLoading(true));
      const redirectUri = getLinkedinRedirectUri(role);
      const authenticate = role === "seeker" ? seekerLinkedinLogin : linkedinLogin;
      authenticate({
        authCode: code,
        redirectUri,
      })
        .then(onSuccess)
        .catch((err) => onError(err.message || "LinkedIn login failed."))
        .finally(() => setIsLoading(false));
    } else if (code && state) {
      window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
      onError("LinkedIn login session could not be verified. Please try again.");
    }
  }, [onSuccess, onError, role]);

  return {
    signInWithLinkedin,
    isLoading,
    isAvailable: linkedinEnabled && Boolean(linkedinClientId),
  };
}
