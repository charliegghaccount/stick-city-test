# Version 1 validation

Validation date: 21 October 2026. This report records the current implementation and separates completed checks from checks still in progress. It does not establish publication or real-device Safari compatibility.

## Completed development checks

| Check | Result | What it demonstrates |
| --- | --- | --- |
| Dependency installation | Passed | Initial installation and a repeatable frozen-lockfile `npm ci` both completed |
| Type checking | Passed | `npm run typecheck` accepts the game and test sources |
| Production build | Passed | `npm run build` produces the static site in `dist/` with the `/stick-city-test/` base path |
| Game-rule and navigation tests | **18 passed** | Economy, progression, persistence, mission/minigame outcomes and district walking routes |
| Browser gameplay checks | **7 passed** | The final production-build Chromium suite completed in 54.8 seconds; gameplay checks are detailed below |
| Public deployment | Not yet verified | A local build does not establish a publicly playable site |
| Real iPhone / Mobile Safari | Not run | Chromium emulation cannot prove actual Mobile Safari behavior |

The 18 automated tests cover:

- Job payments, time and energy consumption; level, education and efficiency requirements; XP carry-over; rejected unaffordable/exhausted activities.
- Buying and consuming inventory once, whole-dollar banking, preservation of total funds, and rejection of invalid transfers.
- Mission acceptance, prerequisites, objective progress and one-time rewards.
- Timing-dependent job payouts, both crime rewards and failure costs, and charged slot bets with checked reel payouts.
- Saved-state restoration, reset, malformed-save repair and in-memory operation when storage is unavailable.
- Sixteen distinct usable locations and at least three job types.
- A route from home to every entrance, including segment samples that catch diagonal corner cutting; solid-building exclusion and walkable park terrain.

These checks use controlled game-state inputs where appropriate. They verify the rules separately from pointer input, menu rendering and browser persistence; those require the browser checks.

The final browser suite passed all seven cases against the production build:

1. The city launches with 12 pedestrians and 8 cars; keyboard movement collides with buildings; tap movement reaches its destination; Space stops walking; the camera scrolls; no page errors are reported.
2. A diner job changes cash, energy, clock and efficiency, and those values survive a reload.
3. A shop purchase adds an item, consuming it restores energy once, and bank deposits/withdrawals preserve total funds.
4. A Mayor mission accepts, tracks distinct visits and pays its completion reward.
5. Slot reels play and charge a spin; the sorting challenge waits for the player to stop the timing meter before changing rewards.
6. NPC dialogue, Gang mission acceptance and a failed criminal attempt produce the expected state changes and failure costs.
7. A 390 × 844 touch viewport fits without horizontal overflow, and touch input moves the player.

Building-specific cases load a valid saved position at an entrance and press the real interaction key; they do not time a full cross-city walk for each menu. Route tests separately cover every entrance. Controlled randomness is used where needed to make criminal failure reproducible. These browser cases do not substitute for a real iPhone / Mobile Safari run.

Final gameplay captures were generated and visually inspected:

- [Desktop gameplay](screenshots/gameplay-desktop.png)
- [Phone portrait gameplay](screenshots/gameplay-phone.png)

The final renderer uses Phaser’s Canvas backend with cached static city artwork. This resolved sluggish software-WebGL rendering in the cloud browser. Entrance interaction is event driven, and movement is clamped on low-frame-rate updates. These are implementation choices for the tested environment, not a measurement of performance on every device.

## Visual research and comparison

All five required source pages were accessed after the initial network restriction was resolved. Five authentic 322 × 572 promotional screenshots from the original developer’s MacRumors announcement were downloaded and visually inspected. The source audit and detailed observations are in [ORIGINAL_REFERENCE.md](ORIGINAL_REFERENCE.md).

The city and HUD were refined using those images:

- Roads use medium-dark grey asphalt, white dashed markings and wider streets, with square-slab grey pavements.
- Building roofs and walls use grey geometric forms, dark outlines and cyan windows.
- World characters use small, brightly coloured circular forms with tiny black limbs; cars have saturated outlined bodies, windows and larger top-down proportions.
- The portrait interface uses a compact dark grey HUD, bold labels, icon-led values and a green XP bar. Activity panels use the original’s straightforward grey, bordered mobile-menu language.

The result is a reconstruction with deliberate differences, not an exact reproduction:

- The user requested a strictly overhead world. The original promotional images show some oblique building façades; this version uses overhead roofs and low wall/window strips.
- The explorable district has 16 locations. The original advertised nearly 100 buildings across a much larger world.
- Names, map layout, economy, XP thresholds, skill effects, mission objectives and movement tuning are new approximations, not recovered original data.
- The casino uses three reels on one row. The original screenshot shows a 3 × 3 reel grid and a middle payline.
- Promotional images supply useful visual references but cannot establish the original’s exact animations or interaction feel. No original executable or gameplay video was tested.

The inspected gameplay captures show the current city/HUD treatment with these differences remaining. The current build is a playable visual approximation, not a perfect match to the original.

## Reproducing the checks

From the repository directory with Node.js 24:

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Use the current runner output as the authoritative result when rerunning tests. The Playwright configuration controls its browser and server; browser artifacts are generated by that run. See [DEPLOYMENT.md](DEPLOYMENT.md) for the separate publication checks.
