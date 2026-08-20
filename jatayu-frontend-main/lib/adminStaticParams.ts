import { DEMO_APPLICATION_APP_IDS } from "./demoExpertApplications";

/** First APP-* id issued when no prior submissions exist. */
const APP_ID_MIN = 1000;
/** Upper bound pre-rendered for static export (runtime submissions increment from demo IDs). */
const APP_ID_MAX = 1299;

function getAdminAppIdRange(): string[] {
  const ids: string[] = [];
  for (let n = APP_ID_MIN; n <= APP_ID_MAX; n += 1) {
    ids.push(`APP-${n}`);
  }
  return ids;
}

/** App IDs pre-rendered for static export when no local submissions exist yet. */
export const BUILD_TIME_APPLICATION_APP_IDS = [
  ...new Set([...DEMO_APPLICATION_APP_IDS, ...getAdminAppIdRange()]),
];

export function getAdminAppStaticParams() {
  return BUILD_TIME_APPLICATION_APP_IDS.map((appId) => ({ appId }));
}
