# Deployment guide

## 1. Prepare Google Sheets

1. Create an empty spreadsheet and copy its ID from the URL.
2. Create an Apps Script project at script.google.com.
3. In Project Settings, add `SPREADSHEET_ID`, a cryptographically random `AUTH_SIGNING_SECRET` of at least 32 characters, `AUTH_ISSUER`, and `AUTH_AUDIENCE`.
4. Install clasp once with `npm install --global @google/clasp`, then run `clasp login`.
5. Copy `apps/apps-script/.clasp.json.example` to `apps/apps-script/.clasp.json` and set the Apps Script project ID.

## 2. Build and publish the API

From the repository root:

1. Run `npm install`.
2. Run `npm --prefix apps/apps-script run build`.
3. Run `npm --prefix apps/apps-script run deploy`.
4. Open the Apps Script editor with `npm --prefix apps/apps-script run open` and execute `setupSpreadsheet` once. Approve only the Spreadsheet permissions shown.
5. Deploy → New deployment → Web app. Execute as the deploying user and allow the intended audience.
6. Record the `/exec` deployment URL. Probe `?action=health`; the response must report `healthy` and `googleSheets: ready`.

Create the first account through the portal. If administrative role separation is required, change its `role` cell from `coach` to `admin` in the protected `Users` sheet and protect that sheet range from non-owner edits.

## 3. Publish the portal to GitHub Pages

1. Add repository variables `VITE_APPS_SCRIPT_URL` and `VITE_BASE_PATH` in GitHub Actions settings. For a project site, the base path is `/<repository-name>/`.
2. Push to `main`. The Pages workflow installs locked dependencies, runs tests, builds, and uploads `apps/portal/dist`.
3. In repository Settings → Pages, choose GitHub Actions as the source.
4. Verify `/`, `/schedule`, `/admin`, `/admin/operations`, and `/admin/messages` using the deployed base URL.

A static host needs a history fallback for direct SPA routes. GitHub Pages uses the generated `404.html` copy of `index.html` from the workflow.

## 4. Operational hardening

- Protect the spreadsheet and restrict Apps Script editor access.
- Rotate `AUTH_SIGNING_SECRET` periodically; rotation invalidates existing one-hour sessions.
- Review Apps Script Executions and Cloud logs for structured `api.request.failed` entries.
- Configure Google account MFA for every script/spreadsheet owner.
- Use a dedicated production spreadsheet; never reuse test data.
- Set Apps Script deployment access to the narrowest audience that still supports public enrollment.

## Rollback

- Portal: redeploy the previous successful GitHub Pages workflow artifact or revert the release commit.
- API: Apps Script Deploy → Manage deployments → edit the active deployment to a previous version.
- Data: restore a named Google Sheets version. Do not roll back the sheet independently while writes are in progress.
