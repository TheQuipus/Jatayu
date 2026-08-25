"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated as isExpertAuth } from "@/lib/expertAuth";
import { isSeekerAuthenticated } from "@/lib/seekerAuth";

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    if (isExpertAuth()) {
      router.replace("/expert/profile/");
    } else if (isSeekerAuthenticated()) {
      router.replace("/seeker/profile/");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
