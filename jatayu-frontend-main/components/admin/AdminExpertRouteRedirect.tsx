"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAdminApplications } from "@/lib/api";
import { mapBackendExpertsToApplications, type BackendExpertApplication } from "@/lib/backendApplicationMapper";
import { getFirstReviewAppId } from "@/lib/adminNavigation";

type AdminExpertRouteRedirectProps = {
  basePath: string;
};

export default function AdminExpertRouteRedirect({ basePath }: AdminExpertRouteRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function redirectToFirstApplication() {
      try {
        const records = await getAdminApplications();
        if (!active) return;

        const applications = mapBackendExpertsToApplications(records as BackendExpertApplication[]);
        const firstAppId = getFirstReviewAppId(applications);

        if (firstAppId) {
          router.replace(`${basePath}/${firstAppId}`);
          return;
        }
      } catch {
        // Fall through to applications list.
      }

      router.replace("/admin/applications");
    }

    void redirectToFirstApplication();

    return () => {
      active = false;
    };
  }, [basePath, router]);

  return null;
}
