# Jatayu — Local Development Setup

This repository contains the Jatayu platform:

- `backend/` — Node.js, Express, Sequelize, Socket.IO and Swagger
- `jatayu-frontend-main/` — Next.js frontend
- `postman/` — API collection and local Postman environment

The application uses three MySQL databases. They must all be available before
the backend starts:

| Database | Environment variable | Purpose |
| --- | --- | --- |
| `jatayu_expert_db` | `EXPERT_DB_NAME` | Experts, applications, availability and DigiLocker data |
| `jatayu_seeker_db` | `SEEKER_DB_NAME` | Seekers, bookings, payments, chat and transcripts |
| `jatayu_admin_db` | `ADMIN_DB_NAME` | Admin settings and notifications |

This guide describes running the project directly on a local machine, without
Docker.

Developers using Windows should follow [README-WINDOWS.md](README-WINDOWS.md),
which includes MySQL Server and database setup instructions for Windows.

## 1. Prerequisites

Install:

- Node.js `20.9.0` or newer
- npm (included with Node.js)
- MySQL 8.x
- Git

Check the installed versions:

```bash
node --version
npm --version
mysql --version
```

## 2. Get the code

```bash
git clone <repository-url>
cd Jatayu
```

If the repository was shared as an archive, extract it and open a terminal in
the extracted `Jatayu` directory.

## 3. Create the databases

Sign in to MySQL with a user that can create databases:

```bash
mysql -u root -p
```

Create the three databases and, if needed, a dedicated local user:

```sql
CREATE DATABASE jatayu_expert_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE jatayu_seeker_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE jatayu_admin_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'jatayu_local'@'127.0.0.1'
  IDENTIFIED BY 'replace_with_a_local_password';
GRANT ALL PRIVILEGES ON jatayu_expert_db.* TO 'jatayu_local'@'127.0.0.1';
GRANT ALL PRIVILEGES ON jatayu_seeker_db.* TO 'jatayu_local'@'127.0.0.1';
GRANT ALL PRIVILEGES ON jatayu_admin_db.* TO 'jatayu_local'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

Using an existing local MySQL account is also supported. Put that account in
the backend environment file in the next step.

## 4. Configure the backend

Create the private environment file from the supplied template:

```bash
cd backend
cp .env.example .env
```

At minimum, review and set these values in `backend/.env`:

```dotenv
PORT=5000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_USER=jatayu_local
DB_PASSWORD=replace_with_a_local_password
EXPERT_DB_NAME=jatayu_expert_db
SEEKER_DB_NAME=jatayu_seeker_db
ADMIN_DB_NAME=jatayu_admin_db
DB_SYNC_ALTER=false

JWT_SECRET=replace_with_a_long_random_secret
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
FRONTEND_URL=http://localhost:3000
API_PUBLIC_URL=http://localhost:5000
SWAGGER_ENABLED=true

RAZORPAY_KEY_ID=rzp_test_replace_me
RAZORPAY_KEY_SECRET=replace_me
RAZORPAY_WEBHOOK_SECRET=replace_me
```

Razorpay values are required during backend startup. Use test-mode credentials
for local development. The webhook secret is configured on the Razorpay
webhook; it is not the Razorpay key secret.

Do not commit `backend/.env`. It contains database passwords and service
secrets. Replace the example admin password and every placeholder before using
the project outside a private local environment.

### Optional backend services

Email, AI and legacy provider values are documented in `backend/.env.example`.
These integrations are primarily configured after signing in to the admin
panel, rather than by adding their secrets to frontend code:

- Google and LinkedIn social login
- DigiLocker
- Agora RTC and live transcription
- MSG91 SMS templates and flow IDs
- Email/Brevo settings
- Booking, session-extension and notification rules

The backend must be running and the admin database must be initialized before
these settings can be saved.

## 5. Install and start the backend

From `backend/`:

```bash
npm ci
npm run dev
```

On the first successful start, Sequelize connects to all three databases,
creates missing tables and seeds the default admin account from `ADMIN_EMAIL`
and `ADMIN_PASSWORD`.

Expected local endpoints:

- API health: <http://localhost:5000/health>
- WebSocket health: <http://localhost:5000/health/ws>
- Swagger UI: <http://localhost:5000/api-docs>
- OpenAPI JSON: <http://localhost:5000/api-docs.json>

Keep this terminal running.

### Existing database upgrades

For a new empty database, normal backend startup creates the current tables.
When upgrading an older database containing existing data, run the project
migration scripts from `backend/`:

```bash
npm run migrate:seeker-credits
npm run migrate:seeker-bookings
npm run migrate:digilocker
npm run migrate:agora-transcripts
npm run migrate:booking-extensions
npm run migrate:notifications
npm run migrate:booking-messages
```

Back up populated databases before running migrations. In particular, the
booking migration updates legacy booking records and should not be run casually
against production data.

`DB_SYNC_ALTER` should normally remain `false`. Use the explicit migration
commands for schema upgrades instead of enabling Sequelize ALTER on every
startup.

## 6. Configure and start the frontend

Open a second terminal from the repository root:

```bash
cd jatayu-frontend-main
```

Create `jatayu-frontend-main/.env` with the local public URLs:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

Then install and start the frontend:

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>.

The `NEXT_PUBLIC_*` variables are embedded into the browser build and therefore
must never contain secrets. Restart Next.js after changing them.

## 7. Complete admin configuration

1. Sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` configured in
   `backend/.env`.
2. Open the admin Settings pages.
3. Configure only the integrations needed for the feature being tested.
4. Use provider test/sandbox credentials locally.

Google, LinkedIn and DigiLocker callback/redirect URLs must exactly match the
local URLs registered with the corresponding provider. The local DigiLocker
backend callback is:

```text
http://localhost:5000/api/expert/kyc/digilocker/callback
```

For local Razorpay webhook testing, `localhost` is not publicly reachable. Use
a secure tunnel and register this public route in Razorpay:

```text
https://<your-tunnel-host>/api/payments/webhooks/razorpay
```

## 8. Verify the setup

Run these checks after both applications start:

```bash
curl http://localhost:5000/health
curl http://localhost:5000/health/ws
```

Then verify:

- Swagger loads and can call the backend.
- The frontend loads at port `3000` without a CORS error.
- Admin login works.
- Backend logs report successful connections to the expert, seeker and admin
  databases.
- Browser WebSocket requests connect to `/socket.io`.

The Postman files are available in `postman/`. Import both the collection and
the local environment, select the local environment, and update its credentials
and generated authentication tokens as needed.

### External expert calendars

Run the calendar table migration once:

```bash
cd backend
npm run migrate:calendar-sync
```

Set a stable `CALENDAR_TOKEN_ENCRYPTION_KEY` in `backend/.env`. In Admin →
Settings → Auth Credentials, configure and enable Google Calendar and/or
Microsoft Outlook. Register these production redirect URIs with the providers:

```text
https://jatayuconnect.in/api/expert/calendar-connections/google/callback
https://jatayuconnect.in/api/expert/calendar-connections/microsoft/callback
```

For local provider applications, register the equivalent
`http://localhost:5000/...` URIs. Google needs Calendar API access and Microsoft
needs delegated `Calendars.ReadWrite` permission. Experts connect their own
account from Expert → Availability → Booking preferences. Future confirmed
sessions and paid extensions are then created or updated automatically; “Sync
now” backfills future confirmed sessions.

## 9. Useful commands

Backend:

```bash
cd backend
npm run dev       # Development server with Node watch mode
npm start         # Start without watch mode
```

Frontend:

```bash
cd jatayu-frontend-main
npm run dev       # Next.js development server
npm run build     # Production build and type checking
npm start         # Run a completed production build
npm run lint      # ESLint checks
```

## 10. Troubleshooting

### Backend reports an unknown database

Create all three databases from section 3 and confirm the database names in
`backend/.env` match exactly.

### Backend stops because Razorpay configuration is missing

All three `RAZORPAY_*` variables are required. Local test values must still be
non-empty and should come from a Razorpay test-mode account.

### Frontend calls the production website during local development

Create `jatayu-frontend-main/.env` and set both `NEXT_PUBLIC_API_URL` and
`NEXT_PUBLIC_WS_URL` to `http://localhost:5000`, then restart Next.js.

### Browser reports a CORS error

Add the exact frontend origin to `CORS_ORIGIN` in `backend/.env` and restart the
backend. Origins are comma-separated and do not include a trailing path.

### `npm ci` says `package.json` and `package-lock.json` are out of sync

Do not modify the lock file on the server. On a development machine, run
`npm install` in the affected application directory, test the project, and
commit both `package.json` and `package-lock.json`. After pulling that commit,
other developers and servers should use `npm ci`.

### A recently added database column is missing

Stop the backend, back up the database, run the relevant migration from section
5, and start the backend again.

### Agora video, audio, chat or transcription is unavailable

Confirm Agora is enabled and its App ID/certificate are configured in Admin
Settings. Also confirm `NEXT_PUBLIC_WS_URL` reaches the same backend instance as
the REST API.

## Security checklist before sharing

- Share `.env.example`, never a real `.env` file.
- Do not send API keys or passwords through source control or chat.
- Rotate any credential that has previously been exposed.
- Give each developer their own local database password and provider test
  credentials where possible.
- Never use production payment credentials for local development.
# Booking reviews

After deploying this update, run `cd backend` and `npm run migrate:booking-reviews`, then restart the backend and rebuild the frontend.

Reviews live in the seeker database. Only the booking owner can review a completed session, once per booking (1–5 stars and an optional comment up to 5000 characters). Identical retries are safe; changing an existing review returns 409. The assigned expert can list/filter reviews and save a reply. Review creation and replies generate in-app notifications. Each new review awards 15 credits atomically with a unique booking ledger reference. Identical retries award zero additional credits. Existing reviews are not retroactively rewarded. Recommendation/NPS and category scores are not collected by the existing form and are displayed as unavailable.
