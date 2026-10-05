# SwimWave Swimming Class Management Portal

Production-oriented monorepo for public class discovery and enrollment, staff operations, attendance, dashboard reporting, and personalized WhatsApp links. The frontend is a React/Vite SPA for GitHub Pages; the API is a bundled TypeScript Google Apps Script Web App backed by Google Sheets.

## Workspaces

- `apps/portal` — mobile-first React portal, FullCalendar schedule, admin experience, live typed API client, Vitest tests.
- `apps/apps-script` — Apps Script API, validation, authentication, Sheets repository, structured logging, Vitest tests.
- `packages/shared` — API entities and Zod request schemas.

## Prerequisites

Node.js 20+, npm 10+, Git, a Google account, and `@google/clasp` for deployment.

## Local setup

1. Run `npm install` at the repository root.
2. Copy `.env.example` to `apps/portal/.env.local` and set `VITE_APPS_SCRIPT_URL` for a deployed Apps Script web app.
3. Run `npm run build` and `npm test`.
4. For local integration, run `npm --prefix apps/apps-script run dev`, then `npm --prefix apps/portal run dev`. Vite proxies `/exec` to the local adapter.

The frontend accesses all data through the typed live client exported by `apps/portal/src/api/index.ts`. No production mock-data layer is included.

## Configuration

Frontend variables:

| Variable | Purpose |
|---|---|
| `VITE_APPS_SCRIPT_URL` | Deployed Apps Script `/exec` URL |
| `VITE_API_PROXY_TARGET` | Local Apps Script adapter target; defaults to `http://127.0.0.1:8787` |
| `VITE_BASE_PATH` | GitHub Pages base path, such as `/swimwave/` |

Apps Script properties (Project Settings → Script Properties):

| Property | Purpose |
|---|---|
| `SPREADSHEET_ID` | Google Sheets system-of-record ID |
| `AUTH_SIGNING_SECRET` | Random signing secret, at least 32 characters |
| `AUTH_ISSUER` | Token issuer; defaults to `swimwave-apps-script` |
| `AUTH_AUDIENCE` | Token audience; defaults to `swimwave-portal` |

Never commit real values. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment and rollback procedures.

## Quality commands

- `npm run build` — builds shared contracts, Apps Script bundle, and portal.
- `npm test` — runs all unit/component tests.
- `npm run typecheck` — strict TypeScript checks in every workspace.
- `npm run lint` — lint all authored TypeScript and JavaScript.

## Data model

`setupSpreadsheet()` creates headers only—never seed records—for `Classes`, `Students`, `Enrollments`, `Attendance`, `MessageTemplates`, and `Users`. Multi-sheet enrollment writes are protected by an Apps Script lock.

## Security notes

Passwords are stored only as salted, iteratively hashed values. Sessions are one-hour HMAC-signed tokens validated for signature, issuer, audience, and expiry. Production secrets live in Script Properties. Public routes are health, class listing, enrollment, login, and registration; administrative routes require a valid session.

Google Apps Script `ContentService` web apps do not allow handlers to set arbitrary HTTP status codes or CORS headers. The dispatcher preserves semantic statuses for tests and internal behavior, while deployed ContentService responses use the platform's HTTP envelope and standardized JSON error bodies.
