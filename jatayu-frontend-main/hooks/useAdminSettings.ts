"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ADMIN_SETTINGS_UPDATED_EVENT,
  DEFAULT_ADMIN_SETTINGS,
  getAdminSettings,
  saveAdminSettings,
  type AdminSettings,
  type MessageTemplate,
} from "@/lib/adminSettings";
import {
  fetchAdminSettingsFromBackend,
  saveAdminSettingsToBackend,
} from "@/lib/adminSettingsSync";

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [ready, setReady] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const remoteSettings = await fetchAdminSettingsFromBackend();
        if (!active) return;
        saveAdminSettings(remoteSettings);
        setSettings(remoteSettings);
      } catch (err) {
        console.warn("Failed to load admin settings from backend, using local cache.", err);
        if (!active) return;
        setSettings(getAdminSettings());
      } finally {
        if (active) setReady(true);
      }
    }

    loadSettings();

    const refresh = () => setSettings(getAdminSettings());

    window.addEventListener(ADMIN_SETTINGS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      active = false;
      window.removeEventListener(ADMIN_SETTINGS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const save = useCallback(async (next: AdminSettings) => {
    setIsSaving(true);
    setError(null);

    try {
      await saveAdminSettingsToBackend(next);
      saveAdminSettings(next);
      setSettings(next);
      setSavedAt(Date.now());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save settings.";
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateTemplate = useCallback(
    (templateId: string, updates: Partial<MessageTemplate>) => {
      const next = {
        ...settings,
        templates: settings.templates.map((template) =>
          template.id === templateId ? { ...template, ...updates } : template,
        ),
      };
      saveAdminSettings(next);
      setSettings(next);
    },
    [settings],
  );

  return {
    ready,
    settings,
    savedAt,
    isSaving,
    error,
    save,
    updateTemplate,
  };
}
