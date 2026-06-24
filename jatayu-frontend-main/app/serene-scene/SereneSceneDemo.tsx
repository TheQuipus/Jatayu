"use client";

import dynamic from "next/dynamic";
import styles from "./SereneSceneDemo.module.css";

const SereneSceneCanvas = dynamic(
  () => import("@/components/three/SereneSceneCanvas"),
  { ssr: false, loading: () => null }
);

export default function SereneSceneDemo() {
  return (
    <>
      <SereneSceneCanvas />
      <main id="serene-scroll-root" className={styles.scrollSpacer} aria-hidden="true" />
    </>
  );
}
