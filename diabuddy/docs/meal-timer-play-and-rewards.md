# Meal timer experience updates

Branch `feat/meal-timer-play-and-rewards`, based on main `832f708` (PR #11). Repository audit: all submitted PRs #1–#11 are merged into main. The remaining unmerged remote refs are two review/preview branches and `feature/meal-calendar`, which has no submitted PR; this task does not merge those unpublished experiments.

## Invitation, help and banner

A successful nonzero timer start opens the existing native dialog with “Want to play while you wait?”, **Choose a mini-game** and **Maybe later**. Both choices leave the same deadline running. The invitation also includes its countdown, Parent / help and Stop routine. The game choice opens the existing arcade; from the parent portal it switches back to the child portal and locks the parent editor. It never requires a game or waiting before eating or care. Zero-minute sessions finish directly instead of showing an obsolete invitation.

The session's invitation flag is persisted with the timer before showing it, and tick/reload/navigation never show it again. Native dialog semantics provide focus containment. The dialog has a heading and description wired through ARIA, an initial focus target, Escape dismissal and sensible focus restoration. Queued native close events are handled so an old setup/invitation close cannot remove a newly opened dialog's accessible name or steal focus from the game chooser. Styling uses a centered, bounded, vertically scrollable dialog with a dimmed, blurred backdrop. No animation is needed; reduced-motion rules also suppress transitions.

Parent / help now uses a scoped grid with readable type, wrapped guidance, separate care-plan and emergency sections, and aligned, wrapping actions. The call action and Back to my buddy become full-width rows on small screens. The native dialog can scroll on short screens. Saved guidance is escaped as text, and the optional phone link retains the existing parent-saved value. Help remains available in the global banner and invitation, including during games. The app does not send parent alerts.

The banner is in normal document flow by default. Only `data-active="true"` enables sticky positioning; stop, low interruption and completion restore normal flow. The banner remains outside page/game content. Mobile active controls use three flexible columns; a measured height sets scroll padding for focused/scrolled content. Existing navigation is not moved or made sticky. The count updates without remounting its controls.

## Mock pump widget

Home includes an original small SVG pump icon and **Demo — simulated pump data**, **MOCK t:slim · NOT CONNECTED**, and a sample “Meal bolus detected · 45 g carbs recorded.” The widget neither contacts a pump nor sends insulin commands, alters Dexcom readings, or produces glucose alerts. **Set meal timer** uses the same setup and start validation with source `demo`, the saved parent-fixed duration or child range, and the parent manual/demo permission. Unconfigured settings cannot be bypassed. Demo timers remain labeled in the banner/home card and are never consumed as real Tandem events or eligible for participation coins.

## Optional participation coins

The parent portal has a separate protected reward form, default off, for a fixed integer amount from 0–1000. A save rechecks the existing parent PIN gate. Settings are validated, persisted in the existing browser save, and rolled back if saving fails. Changing reward settings does not award coins retroactively or alter a running duration.

Exactly one reward can be earned when an explicit approved timer **starts**, and only if its source is the trusted read-only Tandem adapter's recent confirmed delivered meal bolus. The existing delivered/carbs association, recency and consumed-event checks apply again at Start. Explicit simulated/demo/sandbox records are rejected even if they claim source `tandem`. Stable event and delivery keys protect the separate reward-claim ledger from duplicate notifications; Start itself also consumes the event. The reward, ledger keys, invitation flag and timer are saved in one local JSON write, with rollback on failure. Repeated handler calls and reload do not award again. Stopping, eating, low interruption or finishing never remove earned coins. Dose, carb count, duration and glucose do not scale the reward. Manual/demo timers never earn these coins; existing game performance rewards are unchanged.

**Current integration limits:** no live Tandem adapter is connected, so no real meal event currently qualifies. The eligibility/reward path is exercised using explicit synthetic adapter-contract fixtures in tests, not represented as a working provider connection. This app's parent gate and coin balance remain browser-local prototype state, as before. They are not server-enforced family authorization, tamper-resistant accounting or an atomic cross-device/concurrent-tab ledger. Before enabling a production Tandem feed, enforce parent roles, event provenance, per-family/device identities and idempotent reward claims server-side; do not trust browser-submitted `confirmed`/`source` flags. No new unauthenticated ingest or claim endpoint is added. Dexcom OAuth, secrets, token handling and callback URLs are unchanged.

## Care priority and a related fix

Existing fresh-low behavior is preserved: waiting offers and setup/invitation dialogs are suppressed, an active routine is stopped without auto-resume, the game pauses, and family care guidance/help takes priority. No completion is required before eating or care; timer completion is not medical clearance. Unknown/stale/disconnected data remains neutral with the last update time. A high reading does not extend a deadline or generate insulin advice.

Testing revealed that the old arcade pause hook retained an in-memory game after navigating away and tried to update missing game DOM on a later low reading. The hook now pauses that state without rendering unless its game is mounted and visible. It still renders the pause screen when playing in the arcade.

## Checks and manual QA

The repository's `npm test` builds the Worker and checks OAuth security/transport/storage, all mini-games, learning, family features, emotes and routines. Added model/full-app DOM/Canvas checks cover invitation choices, initial focus, Escape, once-only behavior over tick/reload, queued close events, timer continuity, Parent / help during play, demo labels and permissions, default-off reward settings, locked/stale parent forms, invalid amounts, confirmed-event filtering, duplicate delivery/notification/reload claims, retained earned coins, failed-save rollback, low-before-start and interruptions, and active/inactive banner states.

Full browser tooling is unavailable in this environment. These checks do not establish desktop/mobile CSS geometry or actual screen-reader behavior. Before publishing, inspect 320/390/768/1440 px widths and a short landscape viewport: dialog centering and scroll, long multiline care guidance, call/close button wrapping, keyboard Tab containment and focus after each close path, reduced-motion settings, scrolling on Home and each mini-game, and banner return to normal after stop/completion/low interruption. Use real authorized Dexcom/Tandem connections for provider QA; no live clinical or token-exchange success is claimed here.

The new branch and its PR are for review. This change does not merge itself or publish/alter either existing Site's URL, secrets, storage bindings or sharing permissions.
