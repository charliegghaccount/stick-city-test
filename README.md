# Stick City RPG — Version 2

A playable portrait browser RPG inspired by Thomas Bizal’s 2015 iPhone game. Walk around a small city, work for money, build four skills, meet the Mayor and Gang Leader, and save your progress in your browser.

**[Play Stick City](https://charliegghaccount.github.io/stick-city-test/)** — open the link on your Mac or phone. GitHub Pages deployment succeeded, and the public page and game assets return HTTP 200. See [deployment details](docs/DEPLOYMENT.md) and [the test report](docs/TEST_REPORT.md) for the validation scope.

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

V2 retains the original 16-location district: home, café, general store, diner, college, bank, Town Hall, gym, offices, casino, park, clinic, post depot, library, gang club and garage. Each has an activity or interaction.

Money, bank balance, health, energy, level, XP, skills, inventory, location, elapsed time and mission progress are saved locally. There are four skills: efficiency, charm, intelligence and strength. Each earns partial skill XP; higher levels require more effort. Character XP also carries over between levels. Courses grant permanent qualifications.

There are 12 working job roles: three hospitality roles, three corporate roles, two healthcare roles, two retail roles, and the existing postal/workshop jobs. Higher positions require clearly listed skills, levels and qualifications. Six college courses provide those qualifications. Shops sell consumable items; the café and diner serve food. The bank accepts whole-dollar deposits and withdrawals.

Two Mayor missions introduce exploration and work. The Gang Leader’s mission asks for a successful pickpocket attempt. Timing affects pickpocket success, but even a well-timed attempt carries a risk of losing cash and health. The post depot has a timing-based sorting shift. The casino has animated slot reels, a selectable bet and a displayed paytable. Repeatable rewards are reduced and activity timers prevent instant job/training spam.

Cars and pedestrians move through the district. V2 uses continuous rounded traffic lanes with following gaps, braking and collision checks. Player driving and vehicle purchases remain outside scope.

## Activity timing and progression

Activities reserve costs when started and pay rewards once their visible timer finishes. You can browse menus or explore while they run. The footer's ACTIVITY button shows progress. Only active-tab time counts; pending progress survives reload. Free sleep/rest grants no XP. The initial worker-and-rest simulation reaches level 5 in approximately 74 active minutes, excluding travel and menus. This is a provisional model, not a measured human playthrough; see [BALANCING.md](docs/BALANCING.md).

## Developer Menu

Open **Settings → DEV · TESTING TOOLS**, or press **F2**. Sections provide infinite energy/health, 1×/2×/3×/5× movement, noclip, safe teleports, cash/XP/level/skill editing, all qualifications, time controls, NPC/traffic pause, resource recovery, explicit activity completion, save/export/import/reset and coordinates/FPS.

Temporary modifiers reset on reload. Progression-affecting tools and imports mark the save **DEV-ALTERED**. Export before resetting; reset requires confirmation. JSON imports are schema-validated and never evaluated as code. Turning noclip off recovers the player to walkable terrain. Ordinary gameplay restrictions remain active unless a developer control is explicitly used.

## Saving and resetting

V1 saves migrate automatically at the existing storage key, retaining earned levels, skills, money, items and mission progress. A pre-migration backup is retained. Progress is stored on this device in this browser. Refreshing the page preserves it when browser storage is available. The settings menu provides Continue and a confirmed New Game reset.

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
| `src/balance.ts`, `src/careers.ts` | Economy, XP curves, timer scaling, job paths and courses |
| `src/developer.ts` | Isolated developer menu and save tools |
| `src/traffic.ts` | Testable lane following, braking and vehicle spacing |
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

Future versions can expand the city and data definitions. Driving, property ownership, stocks, deeper careers, police/combat, the original’s larger skill roster and mission/minigame catalogue are outside Version 2. Five authentic promotional screenshots were inspected and used to refine the artwork and HUD. The original’s exact map, economy and animation remain approximations; the reference notes distinguish observations from those implementation choices. See [V2 validation](docs/V2_VALIDATION.md), [balance notes](docs/BALANCING.md), and the historical [V1 test report](docs/TEST_REPORT.md).
