"use client";

import { useCallback, useEffect, useState } from "react";
import {
  connectExpertLinkedin,
  getPublicConfig,
  type LinkedinConnectResponse,
} from "@/lib/api";

const STATE_KEY = "jatayu_linkedin_oauth_state_expert_connect";

function redirectUri() {
  return `${window.location.origin}/expert/expert-onboarding`;
}

type Options = {
  onSuccess: (response: LinkedinConnectResponse) => void;
  onError: (message: string) => void;
};

export function useLinkedinProfileSync({ onSuccess, onError }: Options) {
  const [clientId, setClientId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    getPublicConfig()
      .then((config) => {
        if (!active) return;
        setEnabled(config.linkedinLoginEnabled);
        setClientId(config.linkedinClientId || "");
        setConfigLoaded(true);
      })
      .catch(() => {
        setConfigLoaded(true);
        onError("Could not load LinkedIn configuration.");
      });
    return () => { active = false; };
  }, [onError]);

  const start = useCallback(() => {
    if (!configLoaded) {
      onError("LinkedIn configuration is still loading. Please try again.");
      return;
    }
    if (!enabled || !clientId) {
      onError("LinkedIn is disabled or not configured.");
      return;
    }
    const state = crypto.randomUUID();
    sessionStorage.setItem(STATE_KEY, state);
    const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri(),
      state,
      scope: "openid profile email",
    }).toString();
    window.location.assign(url.toString());
  }, [clientId, configLoaded, enabled, onError]);

  useEffect(() => {
    const expectedState = sessionStorage.getItem(STATE_KEY);
    if (!expectedState) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");
    if (!state || (!code && !oauthError)) return;

    sessionStorage.removeItem(STATE_KEY);
    window.history.replaceState({}, document.title, window.location.pathname);
    if (state !== expectedState) {
      onError("LinkedIn authorization session could not be verified.");
      return;
    }
    if (oauthError) {
      onError(params.get("error_description") || "LinkedIn authorization was cancelled.");
      return;
    }
    if (!code) return;

    queueMicrotask(() => setIsLoading(true));
    connectExpertLinkedin({ authCode: code, redirectUri: redirectUri() })
      .then(onSuccess)
      .catch((error: Error) => onError(error.message || "LinkedIn connection failed."))
      .finally(() => setIsLoading(false));
  }, [onError, onSuccess]);

  return { start, isLoading, isAvailable: enabled && Boolean(clientId) };
}
