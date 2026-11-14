# GlucoQuest

A static, installable character game. Run `node scripts/build.mjs` to copy public assets into `dist/`.

No runtime AI calls, API keys, paid services, billing integration, advertising network, or real device connection are configured. Meals use a local illustration library and remain in browser storage. Membership and partner slots are labeled previews. Parent PIN is a browser-local convenience lock.

The original room, avatar outfit atlas, and ramen illustration were created during design and are reused as bundled assets.

The device screen demonstrates read-only connection status and simulated event prompts; it cannot issue pump commands.

## Pitch reminders and character options

The Pitch Lab defaults to an in-app notification every 10 seconds while visible, with Pause and Show Next controls. Building dwell (60 seconds) and food-app-open are simulations, not OS integrations. Meal prompts ask players to check their own plan and never decide whether insulin is needed. There are no push subscriptions or medical alerts.

Skin tones, gender identity, hairstyles, hair/eye colors, and pump accessories are local cosmetic choices; all are free. Device art has no connection to real equipment. Light/dark theme persists in local browser storage.

## DiaBuddy / DAYBYDAY source

The separate [`diabuddy/`](diabuddy/README.md) directory contains the latest DiaBuddy/ DAYBYDAY pixel companion and sandbox-only Dexcom OAuth Worker. It includes original sprite assets, customization, meal matching, journaling, mini games, and team setup instructions. The GlucoQuest prototype above is preserved.

GitHub changes do not automatically deploy to the existing ChatGPT Site. Dexcom credentials and the session encryption key remain in Sites runtime secrets and must never be committed here.
