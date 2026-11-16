# Exits, glucose previews and parent explanations

Branch `feat/navigation-and-glucose-demo` builds on main `e4daf2b`. The architecture remains HTML/CSS/JavaScript/Canvas. Backend OAuth, credentials, provider configuration, medical treatment rules and artwork are unchanged.

## Exit audit and resulting behavior

| Flow | Exit and reopen | State behavior |
| --- | --- | --- |
| App tabs | Done / Back to my buddy, sidebar, browser Back/Forward | Whitelisted Home, wardrobe, games and reminders hash routes; known tab hashes restore on refresh. |
| Shared dialogs (name, shop preview, timer setup/invitation, help, stories, rewards, PIN) | Visible Close, native dialog exits, Escape, browser Back | Focus returns to the original control if still mounted, otherwise a useful navigation/help control. Closing details does not resolve a glucose condition. |
| Onboarding / questionnaire | Visible Close and Escape; Demo tools → Resume setup | Existing saved questionnaire fields and step are retained. No new consent or authentication is inferred by closing. |
| Fictional family dialog | Existing Close, Escape, browser Back; family-demo entry button | Existing fictional data remains separate; no real family link is created. |
| Family tutorial | Close tour or Escape | Clears overlay and returns Home; can be reopened through family demo. Fresh-low care still interrupts it. |
| Mini-games | Back to mini-games, Done / Back to buddy, browser navigation | Unfinished chapter models are retained in memory by game/chapter. Resume unfinished chapter or reselect the game. Unfinished boards still reset on browser refresh; chapter records remain saved. |
| Meal generation | Back to buddy, Close preview, normal Home navigation | Unshared dish input is kept in memory across tabs. Closing a preview does not unshare a saved meal or affect a timer. |
| Wardrobe | Done / Back to my buddy, Close item preview | Purchased/equipped items retain the existing saved behavior; a preview is not a purchase. |
| Expanded sections and glucose preview | Collapse section / Exit demo; visible summary reopens | Expanded sections do not become required steps. Glucose preview state is cleared on exit or navigation. |
| Reminder popup / toast | Got it / Close; reminder Escape | Only dismisses presentation. Future reminders and real low-range guidance are not acknowledged or disabled. |
| Parent portal | Done · Child view; browser navigation | Switching out uses the existing lock. Returning to parent settings still requires the existing PIN barrier. |

Native dialogs supply focus containment. A shared helper tracks openers and manages visible exits even when dialog content is replaced. Browser history has separate entries for dialogs and game selection. UI entry replacement avoids stacked history entries during timer setup → invitation. Closing a dialog does not call the separate **Stop timer** action. Browser Back is normal navigation; no code tries to close the browser tab.

Form drafts, including unsaved parent settings, are retained only in memory; passwords/PINs are excluded. A successful native submit clears its draft, and saved settings still require their existing Save buttons. No new discard prompt is needed when drafts/boards are retained. Browser shutdown/refresh can lose unsaved drafts or unfinished boards. This is not server-side draft storage or multi-device sync.

The countdown and existing urgent guidance remain independent. A persistent Parent / help control and a game-header help button provide access while scrolling, with a real-low marker driven only by normal validated readings. Closing help or alert details leaves that low state intact. Sticky exits and game headers use the countdown height as an offset. Physical viewport/focus behavior still needs the manual checks below.

## Demo — simulated glucose

Open the Home summary **Demo — simulated glucose**, or Demo tools → Preview simulated glucose. The preview has a dedicated Canvas using the selected buddy, current outfit, world, existing pixel renderer, `DiaContext.readingState`, and the existing `createDirector` emote selection. It does not overwrite the normal buddy's data source. An explicit preview bypasses ordinary activity/lesson/cosmetic-opt-out priority so all three poses can be inspected; the normal buddy continues to respect those preferences and real low-care rules. Reduced-motion rendering is retained.

- Slider and number field use **mg/dL**, the only glucose unit this app currently supports. Range 39–401 matches the sanitized G7 policy. Invalid input is explained and does not become a reading.
- Low/In range/High samples use the parent's saved thresholds, including low-at-or-below and high-at-or-above boundaries. Quick choices are disabled when no matching value is representable in that range; the UI explains this. A fractional in-range sample is supported between adjacent thresholds.
- Next emote cycles three distinct low, range or high poses using the shared director's timing slots. Missing and stale modes use the shared validation and show a neutral buddy. These are fictional illustrations, not inferred symptoms or treatment instructions.
- Exit demo closes the preview, clears its active state and restores focus to the summary. Normal data status is explained accurately if unavailable. Leaving Home also exits the preview.
- The preview never assigns to `dexcom`, writes health records/storage, calls a caregiver/notification API, awards coins or invokes a timer transition. Real glucose still drives the normal buddy, actual waiting interruption and help marker; changing the separate preview cannot simulate away a real low.

## Parent descriptions

Range settings now explain units, exact boundaries, visual responses, waiting interruption, neutral/stale behavior, no caregiver notification, parent access and explicit Save. The explanation distinguishes thresholds from time-in-range. Native **What does this mean?** details can be opened by touch/keyboard and collapsed; essential facts remain visible.

Meal settings describe the saved fixed duration versus child-approved range, manual/demo permission, Save behavior, optional invitation/mini-games and care-plan timing. Verified meal-bolus offers remain unavailable without a live Tandem adapter. Participation coins show the saved enabled/off state and amount, with fixed reward-at-start eligibility, no demo/manual awards and no scaling with dose, time or glucose. Reward and threshold saves have brief confirmations.

Dexcom's informational card describes current connection state, last recorded timestamp, stale/disconnected/cached reading labeling and exactly what Connect, Refresh and Disconnect do. Authorization saves the encrypted connection server-side automatically; raw credentials/tokens never reach the frontend. There is no glucose-history/time-in-range destination, so none is invented. The separate static demo chart is labeled as an illustration, not current readings or historical statistics. Learning participation and family reward summaries describe their actual local data and save/actions. Fictional insights remain explicitly fictional. Informational cards are not made fake links.

## Checks and limits

New full-app DOM/Canvas tests exercise tab/modal Back and Forward, visible onboarding exits, Escape/focus, input retention, parent Done locking, timer deadline continuity through exits, glucose boundaries, low/range/high selection, emote cycling, missing/stale neutrality, demo isolation and persistent real-low guidance after closing details. Game UI tests check unfinished chapter restoration. Existing OAuth, emote render/policy, naming, parent, family/onboarding, meal, reward and timer tests remain in the suite.

Browser-control tools are unavailable in this environment. These are programmatic DOM/Canvas checks, not proof of native focus trapping, CSS geometry, touch or screen-reader behavior. Before release, review 320/390/768/1440px widths, short landscape, Tab/Shift+Tab/Escape, long labels, nested dialog transitions, browser Back/Forward/reload, parent PIN return, resume-game behavior, scroll offsets with a running timer, all demo controls and a real low while the demo is open. No live Dexcom authorization was completed here. The production integration remains Dexcom sandbox-only; Tandem is unconnected; parent settings remain browser-local PIN-protected prototype state.

This new branch is for review. It does not merge itself, publish a Site, or alter any Site URL, secrets or sharing permissions.
