import type { Metadata } from "next";
import Bookmark from "@/components/bookmark/Bookmark";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Saved Experts — Jatayu",
  description: "Your bookmarked experts on Jatayu.",
};

export default function SeekerBookmarkPage() {
  return (
    <div className={styles.page}>
      <Bookmark seeker />
    </div>
  );
}
