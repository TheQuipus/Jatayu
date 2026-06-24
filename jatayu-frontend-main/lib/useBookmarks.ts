"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "jatayu-bookmarked-experts";

type Listener = () => void;
const listeners = new Set<Listener>();

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

function parseBookmarks(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((name) => typeof name === "string") : [];
  } catch {
    return [];
  }
}

let cachedRaw = "";
let cachedSnapshot: Set<string> = new Set();

function getSnapshot(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }

  const raw = localStorage.getItem(STORAGE_KEY) ?? "";
  if (raw === cachedRaw) {
    return cachedSnapshot;
  }

  cachedRaw = raw;
  cachedSnapshot = new Set(parseBookmarks(raw));
  return cachedSnapshot;
}

const emptySet = new Set<string>();

function getServerSnapshot(): Set<string> {
  return emptySet;
}

export function useBookmarks() {
  const bookmarkedExperts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleBookmark = useCallback((name: string) => {
    const next = new Set(getSnapshot());
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }

    cachedRaw = JSON.stringify([...next]);
    cachedSnapshot = next;
    localStorage.setItem(STORAGE_KEY, cachedRaw);
    notify();
  }, []);

  return { bookmarkedExperts, toggleBookmark };
}
