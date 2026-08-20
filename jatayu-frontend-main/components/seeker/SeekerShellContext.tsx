"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

type SeekerShellContextValue = {
  setBreadcrumbs: (node: ReactNode | null) => void;
};

export const SeekerShellContext = createContext<SeekerShellContextValue | null>(null);

export function useSeekerBreadcrumbs(node: ReactNode | null) {
  const context = useContext(SeekerShellContext);

  useEffect(() => {
    if (!context) return;

    context.setBreadcrumbs(node);
    return () => context.setBreadcrumbs(null);
  }, [context, node]);
}
