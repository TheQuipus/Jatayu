"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

type ExpertShellContextValue = {
  setBreadcrumbs: (node: ReactNode | null) => void;
};

export const ExpertShellContext = createContext<ExpertShellContextValue | null>(null);

export function useExpertBreadcrumbs(node: ReactNode | null) {
  const context = useContext(ExpertShellContext);

  useEffect(() => {
    if (!context) return;

    context.setBreadcrumbs(node);
    return () => context.setBreadcrumbs(null);
  }, [context, node]);
}
