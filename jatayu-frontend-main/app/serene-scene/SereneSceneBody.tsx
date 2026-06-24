"use client";

import { useEffect } from "react";
import { isSereneDebugEnabled } from "@/lib/three/serene/inspector";

export default function SereneSceneBody({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.dataset.sereneScene = "true";

    if (isSereneDebugEnabled()) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      delete document.body.dataset.sereneScene;
      document.body.style.overflow = "";
    };
  }, []);

  return children;
}
