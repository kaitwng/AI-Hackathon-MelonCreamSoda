# DiaBuddy / DAYBYDAY

A cozy pixel-art diabetes companion prototype with layered characters, customization, meal sharing, journaling, mini games, and an official Dexcom v3 sandbox OAuth backend.

## Project layout

- `dist/`: authored HTML, CSS, browser JavaScript, and original artwork. Edit these files directly.
- `worker/`: Cloudflare Worker entrypoint and sandbox OAuth implementation.
- `scripts/build-worker.mjs`: embeds frontend assets and builds the deployable Worker.
- `.openai/hosting.json`: existing Sites project identity and storage binding. Do not change the project ID or sharing policy without coordinating with the Site owner.
- `DEXCOM_SETUP.md`: sandbox configuration and security details.
- `.env.example`: variable names only. Actual credentials are stored in Sites runtime settings.

## Local frontend preview

No React, Vite, or Next.js installation is needed. From the `diabuddy/` directory:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. This previews the artwork, games, and browser-local interactions. It does **not** run the Cloudflare OAuth backend: the connection panel may report that the backend is unavailable locally. Use the deployed private Site to test Dexcom sandbox authentication.

## Build the Worker

With Node.js 22 or newer:

```sh
node scripts/build-worker.mjs
```

This generates `dist/server/index.js` and copies deployment metadata into `dist/.openai`. Those generated files are ignored by Git. Rebuild whenever frontend or Worker source changes.

## Team editing

1. Clone the repository and create a feature branch.
2. Make a focused change and preview the frontend.
3. Rebuild the Worker if applicable.
4. Open a pull request describing the behavior and checks performed.
5. Have a teammate review before merging.

A GitHub merge does not automatically publish to the existing ChatGPT Site. Coordinate publication with the Site owner. The Site's source repository and runtime secrets are managed separately; do not overwrite the existing deployment from an unreviewed branch.

## Secrets and sandbox limits

Never commit actual credentials, session-encryption keys, OAuth tokens, personal health data, or local environment files. The public repository contains names and placeholder values only. Runtime values belong in the hosting platform's secret configuration.

The Dexcom integration is sandbox-only. Data is simulated, stale data is labeled, and readings affect visual animations only. They never determine coins or game progression. Tandem remains unconnected; the timer's pump events are explicit demo fixtures. Premium payments are disabled.

## Source version

Imported from the latest saved Sites version (version 7), source commit `4fc45cc05581f94d902950203462342f18e1d077`. Runtime secret updates are managed in Sites and are intentionally not exported. This app is separate from the GlucoQuest prototype at the repository root.

## Backend tests

From `diabuddy/` with Node.js 22 or newer:

```sh
node tests/oauth.test.mjs
node scripts/build-worker.mjs
node tests/worker-build.test.mjs
```

Tests use synthetic credentials and mocked upstream responses. They never read live runtime secrets or deliver insulin.
