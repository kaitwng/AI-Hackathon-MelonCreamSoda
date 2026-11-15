# Character names, meal layout and parent cards

Branch: `feat/character-name-and-layout`, based on main `6185bbb`.

Names now use one resolver (`character-name.js`) backed by the existing saved `state.characterName`. Whitespace/missing names fall back to Miso. HTML is escaped at each rendering boundary; the former blanket replacement of “Miso” in Home HTML is removed so user text such as “Miso soup” is not rewritten or double-escaped. Dynamic meal results now read the current name when they render. Eating buttons/captions, activity dialogs, Home, shop previews, games/Canvas labels, timer invitations, parent learning/routine cards and reminders use the chosen name. Renames remain free, permit up to 48 characters, persist in the normal browser save and refresh parent cards as well as child content. The separate fictional family demo retains its explicit in-memory isolation; its temporary profile does not overwrite the saved real-world name. Internal renderer identifiers and the fictional sample family code `MISO01` are not renamed.

The shared meal summary now has separate content and action containers. Wrapping text, bounded Canvas previews, flexible action rows, and single-column mobile rules prevent long names or dish descriptions from imposing a fixed width. The current activity may briefly say the chosen character is walking over while the existing eating animation transitions into position. This is expected; once arrived it says “Eating with [name].”

Both Home customization and the wardrobe use exactly **A wardrobe of possibilities** and **Change your buddy’s clothes, devices, and character.** The browser document title is **DiaBuddy** in initial HTML and every app render. The separate meta description and visible tagline remain descriptive.

The parent portal uses two independent card stacks. Glucose-range and learning cards occupy the support stack alongside existing support, demo reading and Dexcom cards; timer settings and family reward cards occupy the other stack. Cards align to their intrinsic height instead of stretching to the timer row. Below 800px the stacks become a single column; form inputs and headings wrap within their column. No filler data or clinical content was added.

## Actual emote status

Already implemented in main and retained unchanged:

- Low: candy, juice, a quiet/sweat illustration.
- In range: reading, knitting, gentle stretching.
- High: water, bathroom approach, pump-screen inspection (not insulin delivery).

`dexcom.js` retrieves sanitized readings from the official sandbox OAuth Worker and passes connection/reading state through `DiaContext.readingState`. The parent PIN portal's saved low/high thresholds drive that policy using the app's existing at-or-below low and at-or-above high convention. The director rotates three poses per band, avoids immediately repeating its last contextual selection (including skipped frames), and respects reduced motion. Explicit activities, meals, sleep, open dialogs/lessons and celebrations have priority and quiet intervals, so emotes do not constantly override chosen activities.

Disconnected, missing, invalid, future or over-15-minute-old readings return a neutral ordinary routine; the UI explains unavailable/stale data and shows the last update. These fictional illustrations never assert the child has symptoms. Fresh-low waiting interruption and help priority remain separate from animation preferences. Emotes and glucose do not set reward amounts or game progression.

**Integration limits:** this is connected code, not an always-on medical monitor. Dexcom is sandbox-only, with simulated G7 readings; a signed-in user must complete real sandbox authorization to receive them. These tests do not verify a live user's OAuth/token exchange or current readings. Production Dexcom access is not enabled. Tandem remains unconnected, and the high-range pump pose only checks a screen; there is no correction administration or pump control. Parent thresholds remain browser-local PIN-protected settings.

## Verification and limits

The repository suite covers OAuth, games, names/meals, parent PIN/settings, timers, family onboarding, browser titles, 576 contextual character/frame renders and the emote director. New full-app DOM/Canvas checks exercise long names, names containing HTML/ampersands, rename/save/reload, default fallback, user meal text integrity, async-result rendering, named games and timer dialogs, parent card grouping and exact customization copy.

Browser-control tools are unavailable, so rendered CSS geometry, native screen-reader announcements and actual touch interaction are not claimed tested. Manually review Home/eating, wardrobe and parent portal at 320/390/768/1440px and in landscape with a long name and dish; inspect wrapping, dialog scrolling and action focus. The source remains plain HTML/CSS/JavaScript/Canvas. Backend source, device credentials, artwork, game mechanics and published Sites are not changed by this branch.
