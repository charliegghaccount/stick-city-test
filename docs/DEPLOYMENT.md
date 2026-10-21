# GitHub Pages deployment

Repository: [`charliegghaccount/stick-city-test`](https://github.com/charliegghaccount/stick-city-test).

Public game: **[https://charliegghaccount.github.io/stick-city-test/](https://charliegghaccount.github.io/stick-city-test/)**.

## Current publication status

Branch: `main`. Published commit: [`d1d90d643de64e76c3b0bad30d792b983479e12f`](https://github.com/charliegghaccount/stick-city-test/commit/d1d90d643de64e76c3b0bad30d792b983479e12f).

[Actions run 39555540365](https://github.com/charliegghaccount/stick-city-test/actions/runs/39555540365) completed successfully, including both the build and deployment jobs. GitHub Pages is enabled with `build_type: workflow` and HTTPS enforcement.

Verified public HTTPS requests returned HTTP 200 for the page, its JavaScript (`assets/index-D5wGov7C.js`, 1,257,762 bytes) and its stylesheet (`assets/index-CstyJ7dd.css`, 21,473 bytes). The page title is `Stick City · A new life`. Certificate verification remained enabled for these checks.

The initial run was blocked because Pages was disabled and the integration could not enable it. The repository owner enabled **Settings → Pages → Source: GitHub Actions**, resolving that blocker. No further Pages setting change is required for the current deployment.

Public-browser gameplay verification passed at the live origin: touch walking, stopping, reaching a building entrance, opening the home menu, sleeping, restoring saved time/cash/position after reload, and a 390 × 844 portrait viewport. The page and assets returned HTTP 200 without page errors. See the [live gameplay screenshot](screenshots/gameplay-live.png).

The cloud proxy's CA was not trusted directly by Chromium. The live check forwarded unmodified public responses through Playwright's certificate-verifying request client, which trusts the platform CA. HTTPS verification remained enabled; no responses were replaced with local build files. This checks live application behavior and remains separate from a real iPhone / Mobile Safari test.

## Automatic deployment

`.github/workflows/deploy.yml` runs on pushes to `main` and can also be started manually from Actions. It installs the locked dependencies with Node.js 24, runs the game-rule tests and production build, uploads `dist/`, then deploys the artifact with GitHub Pages.

Vite uses `base: '/stick-city-test/'`, so asset URLs work under the repository’s Pages path. The game is entirely static and does not need a backend, database or secret to run.

## Future deployment troubleshooting

Pages is already configured. If a future run reports that Pages is disabled, open [repository Pages settings](https://github.com/charliegghaccount/stick-city-test/settings/pages) and check **Settings → Pages → Build and deployment → Source: GitHub Actions**. Then select **Re-run jobs → Re-run failed jobs** on the affected run, or start **Build and deploy Stick City** manually on `main` from [Actions](https://github.com/charliegghaccount/stick-city-test/actions).

If a run reports that Actions are disabled, enable repository Actions in **Settings → Actions → General**. If a required approval appears for the `github-pages` environment, approve that deployment in Actions. Repository or account policy can require an administrator to change these settings.

## Verification

A successful local build verifies generated files, not public deployment. A successful Actions run verifies publication, but the public page should also be checked for working assets and a playable city.

Confirm that the public address returns a page, the city and HUD render, walking works, a building opens, and refreshing preserves progress. Check the browser console for failed assets. Mobile layout can be checked in an iPhone portrait browser; automated Chromium mobile emulation does not prove real Mobile Safari compatibility.

## Manual fallback

If an automated push or repository setting change is blocked, retain the prepared commit and workflow. An administrator can push the commit to `main`, choose **Source: GitHub Actions**, and start the workflow. Do not enter access tokens into chat or add credentials to source files.

Local inspection remains available with `npm ci`, `npm run dev`, or `npm run build` followed by `npm run preview`. Players can use the public game link without installing development tools.
