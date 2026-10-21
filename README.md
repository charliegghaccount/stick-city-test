# Stick City RPG — Version 1

A playable portrait browser RPG inspired by Thomas Bizal’s 2015 iPhone game. Walk around a small city, work for money, build four skills, meet the Mayor and Gang Leader, and save your progress in your browser.

The game source is pushed to `main` and its automated install, tests and production build pass. Public deployment is waiting for one repository setting: **Settings → Pages → Source: GitHub Actions**. Then rerun [the deployment workflow](https://github.com/charliegghaccount/stick-city-test/actions/runs/39553746058). The expected Pages address currently returns 404; [deployment details](docs/DEPLOYMENT.md) explain the permission blocker and exact remaining step.

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

The district has 16 locations: home, café, general store, diner, college, bank, Town Hall, gym, offices, casino, park, clinic, post depot, library, gang club and garage. Each has an activity or interaction.

Money, bank balance, health, energy, level, XP, skills, inventory, location, elapsed time and mission progress are saved locally. There are four expandable skills: efficiency, charm, intelligence and strength. XP carries over when you level up.

Jobs include washing dishes, delivering post, office assistance and garage work. More demanding jobs require skills or levels. Shops sell consumable items; the café and diner serve food. The bank accepts whole-dollar deposits and withdrawals.

Two Mayor missions introduce exploration and work. The Gang Leader’s mission asks for a successful pickpocket attempt. Timing affects pickpocket success, but even a well-timed attempt carries a risk of losing cash and health. The post depot has a timing-based sorting shift. The casino has animated slot reels, a selectable bet and a displayed paytable.

Cars and pedestrians move through the district. Version 1 does not include driving or vehicle purchases.

## Saving and resetting

Progress is stored on this device in this browser. Refreshing the page preserves it when browser storage is available. The settings menu provides Continue and a confirmed New Game reset.

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
| `src/types.ts` | Shared expandable game data contracts |
| `src/model.ts` | Progression, economy, mission rules and save validation |
| `src/navigation.ts` | Collision-aware walking routes |
| `src/art.ts` | Original procedural 2D city, character and vehicle artwork |
| `src/scene.ts` | Phaser world, camera, movement and animated street life |
| `src/ui.ts`, `src/style.css` | Portrait HUD, mobile menus and minigame controls |
| `tests/` | Game-rule and browser checks |
| `.github/workflows/deploy.yml` | Build and GitHub Pages deployment |

## Publishing and future work

See [deployment instructions and status](docs/DEPLOYMENT.md). The configured Pages address is only a live deliverable after a successful deployment and page check.

Future versions can expand the city and data definitions. Driving, property ownership, stocks, deeper careers, police/combat, the original’s larger skill roster and mission/minigame catalogue are outside Version 1. Five authentic promotional screenshots were inspected and used to refine the artwork and HUD. The original’s exact map, economy and animation remain approximations; the reference notes distinguish observations from those implementation choices. See [the test report](docs/TEST_REPORT.md) for validation and visual differences.
