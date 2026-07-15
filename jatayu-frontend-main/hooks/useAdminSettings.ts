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

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [ready, setReady] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setSettings(getAdminSettings());
    setReady(true);

    const refresh = () => setSettings(getAdminSettings());

    window.addEventListener(ADMIN_SETTINGS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(ADMIN_SETTINGS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const save = useCallback((next: AdminSettings) => {
    saveAdminSettings(next);
    setSettings(next);
    setSavedAt(Date.now());
  }, []);

  const updateTemplate = useCallback(
    (templateId: string, updates: Partial<MessageTemplate>) => {
      const next = {
        ...settings,
        templates: settings.templates.map((template) =>
          template.id === templateId ? { ...template, ...updates } : template,
        ),
      };
      save(next);
    },
    [save, settings],
  );

  return {
    ready,
    settings,
    savedAt,
    save,
    updateTemplate,
  };
}
