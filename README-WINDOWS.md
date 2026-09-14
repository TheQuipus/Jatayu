# Jatayu — Windows Local Setup

This guide explains how to run Jatayu locally on Windows without Docker,
including installing MySQL and creating the three required databases.

The repository contains:

- `backend` — Express API, Sequelize, Socket.IO and Swagger
- `jatayu-frontend-main` — Next.js frontend
- `postman` — Postman collection and local environment

## 1. Install the required software

### Git

Download and install Git for Windows:

<https://git-scm.com/download/win>

The default installer options are suitable. Afterwards, open PowerShell and
check:

```powershell
git --version
```

### Node.js

Install a Node.js LTS release that is version `20.9.0` or newer:

<https://nodejs.org/en/download>

Enable the option that adds Node.js to `PATH`. Close and reopen PowerShell, then
check:

```powershell
node --version
npm --version
```

### MySQL Server and Workbench

Download MySQL Installer for Windows:

<https://dev.mysql.com/downloads/installer/>

In MySQL Installer:

1. Select **Developer Default**, or manually select **MySQL Server 8.x** and
   **MySQL Workbench**.
2. Keep the default port `3306` unless it is already used.
3. Select the recommended strong-password authentication method.
4. Set and safely record the MySQL `root` password.
5. Configure MySQL as a Windows service.
6. Enable **Start the MySQL Server at System Startup**.
7. Complete the installation and product configuration.

Confirm the Windows service is running:

```powershell
Get-Service *mysql*
```

If it is stopped, use the service name displayed by the previous command. A
common name is `MySQL80`:

```powershell
Start-Service MySQL80
```

Starting a Windows service may require PowerShell to be opened as
Administrator.

## 2. Get the project

Choose a development directory and clone the repository:

```powershell
cd C:\Projects
git clone <repository-url> Jatayu
cd Jatayu
```

Replace `<repository-url>` with the repository URL shared by the project owner.

If the project was provided as a ZIP file, extract it and open PowerShell in
the extracted `Jatayu` folder.

## 3. Create the MySQL databases

Jatayu uses separate databases for expert, seeker and admin data:

| Database | Purpose |
| --- | --- |
| `jatayu_expert_db` | Experts, applications, availability and DigiLocker |
| `jatayu_seeker_db` | Seekers, bookings, payments, messages and transcripts |
| `jatayu_admin_db` | Admin settings and notifications |

You can create them with MySQL Workbench or the MySQL command line.

### Option A: MySQL Workbench

1. Open MySQL Workbench.
2. Open the local MySQL connection.
3. Enter the `root` password created during installation.
4. Open a new SQL tab.
5. Paste and execute the following SQL:

```sql
CREATE DATABASE IF NOT EXISTS jatayu_expert_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS jatayu_seeker_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS jatayu_admin_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'jatayu_local'@'127.0.0.1'
  IDENTIFIED BY 'replace_with_a_local_password';
GRANT ALL PRIVILEGES ON jatayu_expert_db.* TO 'jatayu_local'@'127.0.0.1';
GRANT ALL PRIVILEGES ON jatayu_seeker_db.* TO 'jatayu_local'@'127.0.0.1';
GRANT ALL PRIVILEGES ON jatayu_admin_db.* TO 'jatayu_local'@'127.0.0.1';
FLUSH PRIVILEGES;
```

Change `replace_with_a_local_password` to a private local password. Refresh the
Schemas panel and confirm that all three databases are visible.

### Option B: MySQL command line

MySQL Installer commonly places the client here:

```text
C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
```

Run it from PowerShell:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

Enter the root password, then execute the same SQL from Option A. Type `exit`
when finished.

If `mysql` is already available in `PATH`, this shorter command also works:

```powershell
mysql -u root -p
```

## 4. Configure the backend

Move into the backend directory and copy the environment template:

```powershell
cd C:\Projects\Jatayu\backend
Copy-Item .env.example .env
```

Open `backend\.env` in VS Code or another text editor. At minimum, configure:

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

The database password must match the password used in the SQL from section 3.

All three Razorpay values are required for the backend to start. Use test-mode
credentials for local development. `RAZORPAY_WEBHOOK_SECRET` is the secret
configured for the webhook; it is different from `RAZORPAY_KEY_SECRET`.

Generate a suitable local JWT secret in PowerShell if OpenSSL is available:

```powershell
openssl rand -base64 48
```

Otherwise, use a long, private random value from a trusted password manager.

Never commit `backend\.env`. Share `.env.example`, not actual passwords, tokens
or API secrets.

## 5. Install and start the backend

In PowerShell, from `C:\Projects\Jatayu\backend`:

```powershell
npm ci
npm run dev
```

The first successful start will:

1. Validate the required Razorpay configuration.
2. Connect to all three MySQL databases.
3. Create missing Sequelize tables.
4. Seed the default admin account using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from
   `backend\.env`.
5. Start REST APIs and Socket.IO on port `5000`.

Leave this PowerShell window open.

Verify the backend in a browser:

- Health: <http://localhost:5000/health>
- WebSocket health: <http://localhost:5000/health/ws>
- Swagger API documentation: <http://localhost:5000/api-docs>

You can also test health from another PowerShell window:

```powershell
Invoke-RestMethod http://localhost:5000/health
```

## 6. Run migrations when upgrading an existing database

A fresh database normally receives the current tables when the backend starts.
For an older database that already contains project data, stop the backend with
`Ctrl+C`, back up the databases, then run the applicable migrations:

```powershell
npm run migrate:seeker-credits
npm run migrate:seeker-bookings
npm run migrate:digilocker
npm run migrate:agora-transcripts
npm run migrate:booking-extensions
npm run migrate:notifications
npm run migrate:booking-messages
```

The seeker-bookings migration changes legacy booking records. Do not run these
commands against production data without a verified backup.

Keep `DB_SYNC_ALTER=false` during normal development. Use the explicit
migrations instead of altering every table automatically on each restart.

## 7. Configure the frontend

Open a second PowerShell window:

```powershell
cd C:\Projects\Jatayu\jatayu-frontend-main
```

Create the frontend environment file:

```powershell
@"
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
"@ | Set-Content .env
```

These variables are visible to the browser. Never put passwords or secret keys
in any `NEXT_PUBLIC_*` variable.

Install and start the frontend:

```powershell
npm ci
npm run dev
```

Open <http://localhost:3000> and keep this PowerShell window running.

## 8. Configure integrations through Admin Settings

Sign in using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `backend\.env`, then
open the admin Settings pages. Configure only the integrations needed locally:

- Google and LinkedIn login
- DigiLocker
- Agora video/audio and transcription
- MSG91 SMS
- Email/Brevo
- Booking and session rules

Use sandbox or test credentials. Provider redirect URLs must match the local
URLs exactly. The local DigiLocker callback is:

```text
http://localhost:5000/api/expert/kyc/digilocker/callback
```

Razorpay cannot call a webhook hosted only on `localhost`. For webhook testing,
expose the backend using an approved HTTPS tunnel and configure:

```text
https://<public-tunnel-host>/api/payments/webhooks/razorpay
```

## 9. Import the Postman collection

1. Open Postman.
2. Import `postman\Jatayu API.postman_collection.json`.
3. Import `postman\Jatayu Local.postman_environment.json`.
4. Select the Jatayu Local environment.
5. Confirm its API base URL is `http://localhost:5000`.
6. Run the appropriate login requests so the collection stores fresh tokens.

## 10. Windows troubleshooting

### PowerShell says script execution is disabled

If `npm.ps1` is blocked, open PowerShell as the current user and run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Review the security prompt before accepting. Alternatively, run npm through
Command Prompt rather than changing the PowerShell policy.

### `node`, `npm`, `git` or `mysql` is not recognized

Close and reopen the terminal after installation. If MySQL alone is missing,
use the full `mysql.exe` path shown in section 3 or add its `bin` directory to
the Windows user `PATH`.

### MySQL connection is refused

Check the service and port:

```powershell
Get-Service *mysql*
Test-NetConnection 127.0.0.1 -Port 3306
```

Start the MySQL service if necessary and confirm `DB_HOST`, `DB_USER`,
`DB_PASSWORD` and the database names in `backend\.env`.

### Access denied for the database user

Sign in as root through Workbench and rerun the `CREATE USER`, `GRANT` and
`FLUSH PRIVILEGES` statements from section 3. The account host should be
`127.0.0.1` because that is the configured backend host.

### Port 3000 or 5000 is already in use

Find the process using the port:

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
```

Stop the conflicting application. If the backend port is changed, update both
frontend URL variables and `API_PUBLIC_URL` accordingly.

### Frontend connects to the production server

Confirm `jatayu-frontend-main\.env` exists and contains the two localhost URLs.
Restart `npm run dev` after editing it.

### Browser shows a CORS error

Ensure the exact frontend origin is included in `CORS_ORIGIN` in
`backend\.env`, then restart the backend.

### `npm ci` reports that package files are not synchronized

The committed `package.json` and `package-lock.json` should be used together.
On a development machine, run `npm install` in the affected application folder,
test the result, and commit both files. Other developers should pull that commit
and then use `npm ci`.

### A column such as `pokeCount` is missing

Stop the backend, back up the databases, run the relevant migration from
section 6 and restart the backend.

## 11. Daily startup

After the initial setup, make sure MySQL is running and start two terminals.

Backend terminal:

```powershell
cd C:\Projects\Jatayu\backend
npm run dev
```

Frontend terminal:

```powershell
cd C:\Projects\Jatayu\jatayu-frontend-main
npm run dev
```

Then open <http://localhost:3000>.

## Security before sharing access

- Do not commit either frontend or backend `.env` files.
- Never share production database, payment or OAuth credentials.
- Use individual local database accounts where possible.
- Rotate any credential that was pasted into chat, logs or source control.
- Use Razorpay and other providers in test/sandbox mode locally.
