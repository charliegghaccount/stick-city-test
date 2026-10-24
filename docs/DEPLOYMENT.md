# GitHub Pages deployment

Repository: [`charliegghaccount/stick-city-test`](https://github.com/charliegghaccount/stick-city-test).

Public game: **[https://charliegghaccount.github.io/stick-city-test/](https://charliegghaccount.github.io/stick-city-test/)**.

## Current publication status

**Version 3 is live** at the existing public address. Branch: `main`. Deployed code: [`8153436ffc45cbdbf1d348e880216baf0b99e111`](https://github.com/charliegghaccount/stick-city-test/commit/8153436ffc45cbdbf1d348e880216baf0b99e111).

[Actions run 40058245755](https://github.com/charliegghaccount/stick-city-test/actions/runs/40058245755) passed installation, 48 rule/navigation/traffic/pursuit tests, type checking, production build and Pages deployment. The 16-case production-browser suite passed locally; four movement/UI cases passed again after the final movement correction.

Public page, JavaScript (`assets/index-C-N4cxAP.js`, 1,311,353 bytes) and stylesheet (`assets/index-BHHYbxgE.css`, 25,683 bytes) all returned HTTP 200. The public-origin browser check verified V2 paid pending work settling once, Thieving initialization, touch movement/stopping, Developer Menu and safe teleport, two successive instant job payments, ten qualifications, Thieving editing, armed police spawning and damage, wanted-state persistence through reload, temporary modifier reset, and 390 × 844 portrait layout. There were no page errors.

The cloud proxy's CA was not trusted directly by Chromium. Public responses were forwarded unmodified through Playwright's certificate-verifying request client, which trusts the platform CA. No local build files or mocked response bodies were substituted. This remains separate from a real iPhone / Mobile Safari test.

Existing V1/V2 saves migrate automatically at the same local-storage key. Paid V2 pending activities settle immediately once without charging costs again. No new deployment URL, Pages setting or player installation is required. See [balance notes](BALANCING.md), [V3 validation](V3_VALIDATION.md), [crime research](THIEVING_REFERENCE.md), and the [live screenshot](screenshots/v3-gameplay-live.png).

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
