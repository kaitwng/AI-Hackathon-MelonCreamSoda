# SugarPet / DAYBYDAY — official Dexcom v3 sandbox

## Hosting
The existing Sites origin supports a Worker ES module. The build embeds the existing frontend assets in `dist/server/index.js`, preserving the plain HTML/Canvas application. `.openai/hosting.json` declares encrypted server-side R2 blob storage under `BUCKET`. The site's existing access policy and ChatGPT sign-in remain unchanged. The application requires the trusted platform-provided `oai-authenticated-user-id`; it does not create a replacement login system.

## Manual setup before enabling OAuth
1. Keep the registered redirect URI exactly:
   https://mellow-pixel-companion.delicatecurio4.chatgpt.site/api/auth/dexcom/callback
2. Add the registered application's `DEXCOM_CLIENT_ID` and `DEXCOM_CLIENT_SECRET` as **server runtime secrets** through Sites environment configuration. Do not put either into a frontend file, Git, a build-time replacement, or chat.
3. `DEXCOM_SESSION_KEY` must be a 32-byte random AES key encoded as 64 hexadecimal characters. It has been generated and configured as a server secret during implementation. Do not rotate it casually: existing encrypted sessions would be unreadable, requiring reconnection.
4. Redeploy after runtime secret changes. Until configured, the status endpoint reports `configured: false` and Connect stays disabled.
5. Sign in to the private Site, press Connect Dexcom, and select **Sandbox User - G7** in Dexcom's sandbox chooser. Consent at Dexcom. A non-G7 user produces no G7 readings rather than substituting another sensor's data.
6. Test the full hosted consent/callback and refresh cycle. This has not been performed with real application credentials. Verify the platform preserves both the Site login and the SameSite=Lax state cookie across the top-level Dexcom redirect.

## Routes
- GET /api/auth/dexcom/login
- GET /api/auth/dexcom/callback
- GET /api/dexcom/status
- GET /api/dexcom/egvs
- POST /api/dexcom/disconnect (same-origin request and action header required)

All upstream calls are fixed to https://sandbox-api.dexcom.com. No production mode or arbitrary URL proxy exists. Tokens and OAuth-state records are AES-GCM encrypted server-side, with record paths included as authenticated data. The browser holds only random HttpOnly/Secure/SameSite=Lax opaque cookies; the session is bound to the signed-in Site user. Session lifetime is seven days. State expires after ten minutes and is consumed using an R2 ETag conditional update. Refresh tokens rotate under an ETag lock; uncertain refresh outcomes require reauthorization instead of retrying a potentially consumed token. Disconnect removes local encrypted tokens; it does not claim to revoke consent at Dexcom.

## Data behavior
The official `/v3/users/self/egvs` endpoint is used; the latest G7 record in the last day is selected by UTC systemTime. If no recent records exist, `/v3/users/self/dataRange` identifies an available historical sandbox sample. Timestamps are never rewritten. LOW/HIGH sentinels are displayed rather than 39/401. The display is always marked simulated. Readings older than 15 minutes or with a future timestamp do not drive low/high animations. Empty or unavailable readings also use neutral animations. Refresh is cached for one minute server-side and polled once per minute while visible. OAuth tokens and response bodies are never logged. Readings are only held in memory in the browser and briefly inside encrypted server session records; there is no browser-storage glucose history.

Coins, happiness, health, customization ownership, game rewards, and timer eligibility do not consume Dexcom readings. Tandem is not connected; Dexcom event entries cannot establish a delivered pump bolus.

## Retention
Expired cookies and sessions are rejected. Explicit Disconnect deletes the session object. Expired server objects are not automatically purged by a background scheduler in this version; configure a seven-day R2 lifecycle retention rule for the `dexcom/` prefix before production use. This deployment is sandbox-only.

## Build / checks
Run `node scripts/build-worker.mjs` from the checkout after editing frontend or Worker source. Source assets remain in `dist/`; the build excludes `dist/server` and `dist/.openai` from embedding. No Node dependency or framework migration is required. OAuth tests use a mocked provider and R2 conditional-storage implementation. Browser consent with real credentials remains a manual acceptance check.
