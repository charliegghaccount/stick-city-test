# Stick City RPG — Version 3

A playable portrait browser RPG inspired by Thomas Bizal’s 2015 iPhone game. Walk around a small city, work for money, build four skills, meet the Mayor and Gang Leader, and save your progress in your browser.

**[Play Stick City](https://charliegghaccount.github.io/stick-city-test/)** — open the link on your Mac or phone. Version 3 adds instant actions and Thieving/police pursuits. Existing V1/V2 progress migrates automatically; refresh an already-open game to load the update. See [deployment details](docs/DEPLOYMENT.md) and [V3 validation](docs/V3_VALIDATION.md) for the validation scope.

This project is an independent recreation. All city artwork is drawn specifically for this game; the original screenshots are research references, not game assets. See [the reference notes](docs/ORIGINAL_REFERENCE.md) for the evidence and approximation limits.

## Playing

The game opens directly into the city. On a computer, the portrait game stays centred on the screen. On a phone, it fits the available portrait viewport.

- Tap or click the ground to walk there. Tap a building to walk to its entrance and open its menu.
- Tap a new destination to change course. Use **Space** or **Escape** to stop. **WASD** and the **arrow keys** also move the player; press **E** near an entrance to enter.
- Use the map to choose a destination. Your character walks there through the city.
- Check your bag, missions and statistics from the bottom toolbar.
- Activities show their cost, time, energy and requirements before you choose them. When tired, sleep at home, rest in the park, or buy food.

An easy first day: visit Town Hall and accept the Mayor’s introduction, explore four locations, wash dishes at the diner, then return to the Mayor. Read or take a college class to qualify for better-paid office work.

## What is playable

V3 retains the original 16-location district: home, café, general store, diner, college, bank, Town Hall, gym, offices, casino, park, clinic, post depot, library, gang club and garage. Each has an activity or interaction.

Money, bank balance, health, energy, level, XP, skills, inventory, location, elapsed time and mission progress are saved locally. There are five skills: efficiency, charm, intelligence, strength and Thieving. Each earns partial skill XP; higher levels require more effort. Character XP also carries over between levels. Courses grant permanent qualifications.

There are 18 career roles across hospitality, retail, corporate, healthcare, public services and trades, including supervisor, administrator, technician, doctor, inspector and electrician positions. Higher positions require clearly listed skills, levels and qualifications. Ten college courses provide those qualifications. Stats → Careers & education shows available/locked roles and your current job; promotions require an explicit choice. Shops sell consumable items; the café and diner serve food. The bank accepts whole-dollar deposits and withdrawals.

Two Mayor missions introduce exploration and work. The Gang Leader’s mission asks for a successful pickpocket attempt. Timing affects pickpocket success, but even a well-timed attempt carries a risk of losing cash and health. The post depot has a timing-based sorting shift. The casino has animated slot reels, a selectable bet and a displayed paytable. All standard transactions resolve immediately. Skill-based games still need player input, but there is no artificial wait after a result.

Cars and pedestrians move through the district. Traffic uses continuous rounded lanes with following gaps, braking and collision checks. Player driving and vehicle purchases remain outside scope.

## Immediate gameplay, Thieving and police

Work, courses, training, sleep, food, treatment, purchases and criminal outcomes resolve on the click. Costs, game time, rewards and saving update together. There are no ordinary activity countdowns or post-animation locks. Existing V2 actions already paid for are completed once during migration, without recharging costs.

Thieving grows through Gang hideout practice, courier work, pickpocketing and robberies. Eligible buildings show the required Thieving/character level, exact calculated success percentage and payout range. Eight targets progress from the café ($25–45) to the bank ($600–950). Failed building robberies start a **30-second armed police pursuit**: run, dodge and use buildings to block shots. If taken down, you revive at the clinic with a bill; bank savings remain safe. Wanted time survives reload, and normal building actions are unavailable while pursued. Healing items can still be used.

Security alert periods use game minutes, not real waiting. Instant work/rest advances that clock. Repeated targeting of the same NPC is also restricted by in-game alertness. The original numerical formulas could not be recovered; see [crime research and balancing](docs/THIEVING_REFERENCE.md).

New supplies include meal boxes, trauma kits, lockpicks, running shoes, a protective vest and a study guide. Equipment works while owned and does not stack. Four new Mayor/Gang tasks track ordinary work earnings, purchases, contacts, skill milestones and robberies.

## Developer Menu

Open **Settings → DEV · TESTING TOOLS**, or press **F2**. Sections provide infinite energy/health, 1×/2×/3×/5× movement, noclip, safe teleports, cash/XP/level/skill editing, all qualifications, time controls, NPC/traffic pause, resource recovery, skill/mission reset, clock/day setting, all-career unlocks, disabling all temporary cheats, save/export/import/reset and coordinates/FPS.

Temporary modifiers reset on reload. Progression-affecting tools and imports mark the save **DEV-ALTERED**. Export before resetting; reset requires confirmation. JSON imports are schema-validated and never evaluated as code. Turning noclip off recovers the player to walkable terrain. Ordinary gameplay restrictions remain active unless a developer control is explicitly used.

## Saving and resetting

V1 and V2 saves migrate automatically at the existing storage key, retaining earned levels, skills, money, items and mission progress. Pre-migration backups are retained, and V2 pending transactions settle once immediately. Progress is stored on this device in this browser. Refreshing the page preserves it when browser storage is available. The settings menu provides Continue and a confirmed New Game reset.

Saves do not sync between a Mac and an iPhone, between browsers, or between different site addresses. Clearing site data removes the save. Private browsing or restricted storage may prevent persistence; the game reports unavailable storage.

## Development

Use Node.js 24 and npm. From the repository directory:

```sh
npm ci
npm run dev
```

Use the Vite address printed in the terminal, including the `/stick-city-test/` path. No server, database or API key is required for gameplay.

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The production files are written to `dist/`. Browser tests use Playwright. The configuration uses `/usr/bin/chromium` when present; otherwise, install Playwright’s Chromium before running browser tests:

```sh
npx playwright install chromium
npm run test:e2e
```

On Linux, Playwright may also require system browser libraries; `npx playwright install --with-deps chromium` installs those on a supported machine with administrator access. Test results should be read from the current run rather than assumed from the presence of this guide.

## Project structure

| File | Purpose |
| --- | --- |
| `src/content.ts` | Buildings, activities, items and missions |
| `src/balance.ts`, `src/careers.ts` | Economy, XP curves, in-game costs, job paths and courses |
| `src/developer.ts` | Isolated developer menu and save tools |
| `src/traffic.ts` | Testable lane following, braking and vehicle spacing |
| `src/crime.ts`, `src/pursuit.ts` | Robbery tiers/odds, wanted state rules, police pathfinding and projectiles |
| `src/types.ts` | Shared expandable game data contracts |
| `src/model.ts` | Progression, economy, mission rules and save validation |
| `src/navigation.ts` | Collision-aware walking routes |
| `src/art.ts`, `src/art-assets.ts` | Original 2D world and reusable building/environment archetypes |
| `src/scene.ts` | Phaser world, camera, movement and animated street life |
| `src/ui.ts`, `src/style.css` | Portrait HUD, mobile menus and minigame controls |
| `tests/` | Game-rule and browser checks |
| `.github/workflows/deploy.yml` | Build and GitHub Pages deployment |

## Publishing and future work

The game is published through [GitHub Pages](https://charliegghaccount.github.io/stick-city-test/). See [deployment instructions and status](docs/DEPLOYMENT.md) for future updates and troubleshooting.

Future versions can expand the city and data definitions. Driving, property ownership, stocks, deeper careers, police/combat, the original’s larger skill roster and mission/minigame catalogue are outside Version 3. Five authentic promotional screenshots were inspected and used to refine the artwork and HUD. The original’s exact map, economy and animation remain approximations; the reference notes distinguish observations from those implementation choices. See [V3 validation](docs/V3_VALIDATION.md), [balance notes](docs/BALANCING.md), and the historical [V1 test report](docs/TEST_REPORT.md).
