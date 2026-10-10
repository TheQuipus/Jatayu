# Hostinger staging backend

Deployed on 2026-10-10 to `https://api-staging.jatayuconnect.com`.
Frontend origin: `https://staging.jatayuconnect.com`.

## Runtime

- Hostinger Business Web Hosting, Node.js Web App (Express).
- Node.js 22, npm, application root `backend`, entry file `server.js`.
- No build script or output directory is required.
- Build UUID: `01a124bb-9e21-7140-90a7-7c80d4a81182`.
- Deployment source: archive of committed local source
  `1a9ee95418ed0b276e5344d89094caba0cf205d2`, plus the database credential
  configuration change. Existing uncommitted admin changes were excluded.

## Databases and configuration

Fresh databases were created; AWS staging data was not imported:

| Module | Database | User |
| --- | --- | --- |
| Expert | `u363148475_jtstg_expert` | `u363148475_jtstg_app` |
| Seeker | `u363148475_jtstg_seeker` | `u363148475_jtstg_seeker` |
| Admin | `u363148475_jtstg_admin` | `u363148475_jtstg_admin` |

The deployed app uses `DB_HOST=127.0.0.1`. Module-specific credentials use
`EXPERT_DB_USER` / `EXPERT_DB_PASSWORD`, `SEEKER_DB_USER` /
`SEEKER_DB_PASSWORD`, and `ADMIN_DB_USER` / `ADMIN_DB_PASSWORD`.
Unset module credentials fall back to `DB_USER` / `DB_PASSWORD`.
`DB_SYNC_ALTER=false`; startup creates missing tables in these empty databases.

The full private environment is saved locally in
`backend/private-storage/hostinger/staging.env`, ignored by git with owner-only
permissions. It contains the generated staging admin password and database
credentials. Do not commit or publish it. Staging admin email is
`staging-admin@jatayuconnect.com`.

Hostinger's environment update API replaces the entire variable set. Values
returned by its read API are masked and must not be written back as credentials.

## Verified

- Database credential overrides, shared fallback, and explicit empty passwords.
- All three MySQL connections and table initialization in runtime logs.
- `GET /health` and `GET /health/ws`: HTTP 200.
- CORS permits the configured staging frontend origin.
- Seeded staging admin login: HTTP 200 with a JWT.
- Engine.IO polling handshake: HTTP 200.
- WebSocket transport upgrade: HTTP 101.

Payment transactions, provider callbacks, email/SMS, persistent uploads across
redeploys, and authenticated multi-client chat were not tested.

## Future deployments

Commit and push the database credential configuration change to the repository
used by Hostinger before switching back to Git deployment. The previous build
used `TheQuipus/Jatayu` branch `main`; this local checkout's origin points to
`thequipus18-arch/Jatayu`. Confirm the intended repository before configuring
automatic deployment, or a Git build may omit the credential fix.

Configure external integrations and callback/webhook URLs for staging separately.
The frontend deployment must set both public API and WebSocket URLs to
`https://api-staging.jatayuconnect.com` before its build.
