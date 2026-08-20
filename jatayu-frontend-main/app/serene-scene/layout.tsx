import type { Metadata } from "next";
import SereneSceneBody from "./SereneSceneBody";

export const metadata: Metadata = {
  title: "Serene Scene",
};

export default function SereneSceneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SereneSceneBody>{children}</SereneSceneBody>;
}
