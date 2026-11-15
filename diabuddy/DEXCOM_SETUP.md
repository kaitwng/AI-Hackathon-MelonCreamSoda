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

## Per-Site origin configuration

`DEXCOM_APP_ORIGIN` selects one exact trusted HTTPS deployment origin. The supported origins are the original `https://mellow-pixel-companion.delicatecurio4.chatgpt.site` and the current `https://diabuddy-arcade-review.delicatecurio4.chatgpt.site`. When omitted, the original origin remains the default for backward compatibility. An explicitly invalid/unknown origin fails closed. Requests to the other origin are rejected for that deployment; forwarded headers cannot change this check. There are no wildcard CORS permissions.

The Worker uses the selected origin for request validation, the authorization redirect URI, the token exchange redirect URI and disconnect CSRF validation. Set the current Site's `DEXCOM_APP_ORIGIN` in Sites runtime settings, preserve the three existing Dexcom secrets, and republish to apply the runtime revision. It is a public configuration value, though it may be marked Secret in Sites.

For the current domain, register this exact callback in the Dexcom Developer Portal:

```
https://diabuddy-arcade-review.delicatecurio4.chatgpt.site/api/auth/dexcom/callback
```

The former callback does not set cookies on the new host. Authorize again on the new Site; existing sessions do not migrate between Sites. Do not copy browser cookies or OAuth tokens. A rotated session encryption key also requires reauthorization.

`/api/dexcom/configuration` reports only binding presence/format/storage checks and the public origin/callback. `/api/dexcom/status` still requires a signed-in Site visitor. A service bypass token grants platform access but does not impersonate a signed-in user, so a service-only status check may return `sign_in_required` (401). That is distinct from the former application-level `invalid_origin` (403).

The backend implements actual server-side OAuth and refresh rotation against `https://sandbox-api.dexcom.com/v3/oauth2/login` and `/v3/oauth2/token`, then retrieves `/v3/users/self/egvs`. `simulated: true` labels Dexcom sandbox data; it does not mean the OAuth routes are mock functions. Completing authorization and retrieving readings still require browser consent and a registered callback matching the current origin.

## Safe OAuth callback diagnostics

Callback logs emit fixed event names: `oauth_state_mismatch`, `missing_session`, `token_exchange_failed`, `token_storage_failed`, `callback_redirect_failed`, and `connection_status_failed`. Progress events distinguish receipt, state validation, a successful token exchange, encrypted-storage read-back, and redirect completion. Fields are limited to stage names, booleans, HTTP statuses and allowlisted OAuth error categories. Request URLs/queries, cookie values, identities, arbitrary exception text, codes, client credentials and tokens are never included by the diagnostic logger. Do not add raw request or provider-response logging.

The frontend preserves the specific callback error, opens Preferences & devices after return, and still navigates the browser to `/api/auth/dexcom/login`. A signed-in Site visitor is required; the local Child/Parent selector and parent PIN do not establish that identity. The renamed Demo tools button is independent of the real sandbox OAuth backend. A callback without a Site identity now clearly requests sign-in instead of reporting a generic connection failure.

Encrypted session creation now checks the storage write and reads/decrypts it back before emitting the session cookie. Existing tokens are not replaced until the new record is verified. A fresh authorization is needed to inspect failures from deployments that previously swallowed exceptions; do not replay codes from logs or try to impersonate a visitor with injected identity headers. Full browser consent cannot be completed by service-only API probes.
