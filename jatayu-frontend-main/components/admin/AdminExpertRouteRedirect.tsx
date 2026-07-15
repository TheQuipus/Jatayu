"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getExpertApplications,
  seedDemoApplicationIfEmpty,
} from "@/lib/expertApplicationsStore";

type AdminExpertRouteRedirectProps = {
  basePath: string;
};

export default function AdminExpertRouteRedirect({ basePath }: AdminExpertRouteRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    seedDemoApplicationIfEmpty();
    const applications = getExpertApplications();

    if (applications.length > 0) {
      router.replace(`${basePath}/${applications[0].appId}`);
      return;
    }

    router.replace("/admin/applications");
  }, [basePath, router]);

  return null;
}
