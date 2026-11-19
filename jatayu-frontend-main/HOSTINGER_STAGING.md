# Hostinger staging frontend

Deployed on 2026-10-10 to `https://staging.jatayuconnect.com`.
Admin login: `https://staging.jatayuconnect.com/admin/`.
Backend: `https://api-staging.jatayuconnect.com`.

## Build settings

- Hostinger Business Web Hosting, Next.js Node.js Web App.
- Node.js 22, npm.
- Application root: `jatayu-frontend-main`.
- Build script: `build:hostinger` (`next build --webpack`).
- Output directory: `.next`; Hostinger detects the standalone server output.
- Build UUID: `01a124c0-8ccd-7099-8af9-bd328813a593` (completed).

The previous Turbopack build timed out during compilation after 15 minutes.
The Webpack build compiled successfully, passed TypeScript checks and generated
all pages. Hostinger completed deployment in 2 minutes 22 seconds.

Set these environment variables in Hostinger before each build:

```dotenv
NEXT_PUBLIC_API_URL=https://api-staging.jatayuconnect.com
NEXT_PUBLIC_WS_URL=https://api-staging.jatayuconnect.com
NEXT_TELEMETRY_DISABLED=1
```

Public API and WebSocket variables are embedded in the browser bundles.
Changing them requires a new build, rather than only a runtime restart.
No backend passwords or tokens belong in frontend variables.

## Source and future deployments

This release used an archive from local committed source
`1a9ee95418ed0b276e5344d89094caba0cf205d2`, plus the `build:hostinger`
package script. Uncommitted admin UI work was excluded to match the backend
release. Environment files, dependencies, and previous build artifacts were
excluded from the uploaded archive.

Commit and push the new package script to the intended repository before a Git
redeploy: Hostinger's stored build settings now use `build:hostinger`.
The previously connected repository was `TheQuipus/Jatayu`, branch `main`,
while this local checkout's origin is `thequipus18-arch/Jatayu`.
Confirm which repository should drive future deployments.

## Verified

- Homepage and admin login page return HTTP 200 over HTTPS.
- Homepage and admin dashboard render in isolated Chrome; screenshots inspected.
- Staging admin can log in through the frontend and reach `/admin/dashboard/`.
- Browser login, session, notifications, application list, and statistics
  requests target the staging backend and return HTTP 200.
- CORS preflight requests succeed with HTTP 204.
- No JavaScript runtime exceptions or network loading failures were captured.

Browser monitoring also recorded a document request to `/` returning HTTP 403
during the admin flow, despite direct homepage checks returning HTTP 200 and
successful rendering and login. Its cause was not established; it must not be
described as a completely clean HTTP trace.

Staging admin credentials are in the ignored private backend file
`backend/private-storage/hostinger/staging.env`. The current application uses
the email verification code sent after submitting valid admin credentials.

Full onboarding, payments, external OAuth callbacks and video sessions have not
been tested as part of this deployment. Some existing dashboard metrics are
demo content; rendering them does not verify real financial data.
