"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminHeartbeat, adminLogout, getAdminToken } from "@/lib/api";
import {
  ADMIN_IDLE_CONFIG_KEY,
  ADMIN_IDLE_CONFIG_UPDATED_EVENT,
  ADMIN_LAST_ACTIVITY_KEY,
  ADMIN_SESSION_CHANNEL,
  getCachedAdminIdleConfig,
  getEffectiveAdminWarningSeconds,
  getLastAdminActivityAt,
  recordAdminActivity,
  setCachedAdminIdleConfig,
  triggerAdminSessionLogout,
  type AdminIdleConfig,
  type AdminSessionBroadcastMessage,
} from "@/lib/adminIdleSession";
import { ADMIN_SETTINGS_UPDATED_EVENT, getAdminSettings } from "@/lib/adminSettings";

const SERVER_HEARTBEAT_INTERVAL_MS = 60_000;

export function useAdminIdleTimeout() {
  const [config, setConfig] = useState<AdminIdleConfig>(() => getCachedAdminIdleConfig());
  const [warningOpen, setWarningOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isExtending, setIsExtending] = useState(false);

  const warningOpenRef = useRef(false);
  const extendingRef = useRef(false);
  const lastServerHeartbeatRef = useRef(0);

  useEffect(() => {
    warningOpenRef.current = warningOpen;
  }, [warningOpen]);

  const syncConfigFromSources = useCallback(() => {
    const cached = getCachedAdminIdleConfig();
    setConfig(cached);
    if (cached.idleTimeoutMinutes <= 0) {
      setWarningOpen(false);
    }
  }, []);

  useEffect(() => {
    const onIdleConfigEvent = (event: Event) => {
      const detail = (event as CustomEvent<AdminIdleConfig>).detail;
      if (detail) {
        setConfig(detail);
        if (detail.idleTimeoutMinutes <= 0) {
          setWarningOpen(false);
        }
      } else {
        syncConfigFromSources();
      }
    };

    const onAdminSettingsUpdated = () => {
      const stored = getAdminSettings();
      const next: AdminIdleConfig = {
        idleTimeoutMinutes: stored.security.adminIdleTimeoutMinutes,
        idleWarningSeconds: stored.security.adminIdleWarningSeconds,
      };
      setCachedAdminIdleConfig(next);
      setConfig(next);
      if (next.idleTimeoutMinutes <= 0) {
        setWarningOpen(false);
      }
    };

    window.addEventListener(ADMIN_IDLE_CONFIG_UPDATED_EVENT, onIdleConfigEvent);
    window.addEventListener(ADMIN_SETTINGS_UPDATED_EVENT, onAdminSettingsUpdated);
    return () => {
      window.removeEventListener(ADMIN_IDLE_CONFIG_UPDATED_EVENT, onIdleConfigEvent);
      window.removeEventListener(ADMIN_SETTINGS_UPDATED_EVENT, onAdminSettingsUpdated);
    };
  }, [syncConfigFromSources]);

  const maybeSendHeartbeat = useCallback((force = false) => {
    if (!getAdminToken()) return;
    const now = Date.now();
    if (!force && now - lastServerHeartbeatRef.current < SERVER_HEARTBEAT_INTERVAL_MS) {
      return;
    }
    lastServerHeartbeatRef.current = now;
    void adminHeartbeat()
      .then((res) => {
        if (res?.idleConfig) {
          setConfig(res.idleConfig);
        }
      })
      .catch(() => {
        // 401 is handled globally by handleAdminApiUnauthorized
      });
  }, []);

  const evaluateIdleState = useCallback(() => {
    if (!getAdminToken()) return;
    if (config.idleTimeoutMinutes <= 0) {
      if (warningOpenRef.current) setWarningOpen(false);
      return;
    }
    if (extendingRef.current) return;

    const timeoutMs = config.idleTimeoutMinutes * 60_000;
    const effectiveWarnSec = getEffectiveAdminWarningSeconds(
      config.idleTimeoutMinutes,
      config.idleWarningSeconds,
    );
    const warningMs = effectiveWarnSec * 1000;

    const lastActivityAt = getLastAdminActivityAt();
    const elapsedMs = Date.now() - lastActivityAt;
    const remainingMs = timeoutMs - elapsedMs;

    if (remainingMs <= 0) {
      setWarningOpen(false);
      void adminLogout();
      triggerAdminSessionLogout("idle_timeout");
      return;
    }

    if (remainingMs <= warningMs) {
      setRemainingSeconds(Math.max(1, Math.ceil(remainingMs / 1000)));
      if (!warningOpenRef.current) {
        setWarningOpen(true);
      }
    } else if (warningOpenRef.current) {
      setWarningOpen(false);
    }
  }, [config.idleTimeoutMinutes, config.idleWarningSeconds]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize shared activity timestamp on mount if missing
    getLastAdminActivityAt();
    evaluateIdleState();

    const handleUserActivity = () => {
      if (warningOpenRef.current || config.idleTimeoutMinutes <= 0) return;
      recordAdminActivity(false);
      maybeSendHeartbeat(false);
    };

    const activityEvents: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "mousemove",
      "wheel",
      "touchstart",
      "scroll",
    ];

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    }

    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        evaluateIdleState();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_LAST_ACTIVITY_KEY && event.newValue) {
        if (warningOpenRef.current) {
          evaluateIdleState();
        }
      } else if (event.key === ADMIN_IDLE_CONFIG_KEY) {
        syncConfigFromSources();
      } else if (event.key === "jatayu_admin_token" && !event.newValue) {
        triggerAdminSessionLogout("manual");
      }
    };
    window.addEventListener("storage", handleStorage);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel(ADMIN_SESSION_CHANNEL);
        channel.onmessage = (event: MessageEvent<AdminSessionBroadcastMessage>) => {
          const msg = event.data;
          if (!msg) return;
          if (msg.type === "LOGOUT") {
            triggerAdminSessionLogout(msg.reason);
          } else if (msg.type === "CONFIG_UPDATED") {
            setConfig(msg.config);
            if (msg.config.idleTimeoutMinutes <= 0) setWarningOpen(false);
          } else if (msg.type === "EXTENDED" || msg.type === "ACTIVITY") {
            evaluateIdleState();
          }
        };
      } catch {
        channel = null;
      }
    }

    const intervalId = window.setInterval(evaluateIdleState, 1000);

    return () => {
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, handleUserActivity);
      }
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      window.removeEventListener("storage", handleStorage);
      if (channel) channel.close();
      window.clearInterval(intervalId);
    };
  }, [config.idleTimeoutMinutes, evaluateIdleState, maybeSendHeartbeat, syncConfigFromSources]);

  const staySignedIn = useCallback(async () => {
    if (extendingRef.current) return;
    extendingRef.current = true;
    setIsExtending(true);
    try {
      const res = await adminHeartbeat();
      recordAdminActivity(true);
      lastServerHeartbeatRef.current = Date.now();
      if (res?.idleConfig) {
        setConfig(res.idleConfig);
      }
      setWarningOpen(false);
    } catch {
      // 401 is handled by handleAdminApiUnauthorized -> logout redirect
    } finally {
      extendingRef.current = false;
      setIsExtending(false);
    }
  }, []);

  const logoutNow = useCallback(() => {
    setWarningOpen(false);
    void adminLogout().finally(() => {
      triggerAdminSessionLogout("manual");
    });
  }, []);

  return {
    idleTimeoutMinutes: config.idleTimeoutMinutes,
    warningOpen,
    remainingSeconds,
    isExtending,
    staySignedIn,
    logoutNow,
  };
}

