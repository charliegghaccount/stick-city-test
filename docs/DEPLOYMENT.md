# GitHub Pages deployment

Repository: [`charliegghaccount/stick-city-test`](https://github.com/charliegghaccount/stick-city-test).

Expected public address after successful deployment: `https://charliegghaccount.github.io/stick-city-test/`. **This address currently returns HTTP 404 and is not a verified playable deployment.**

## Current publication status

Source commit [`4efb520f37a01fd1a7e4ac6b9ad047ac849e3638`](https://github.com/charliegghaccount/stick-city-test/commit/4efb520f37a01fd1a7e4ac6b9ad047ac849e3638) was successfully pushed to `main`.

[Actions run 39553746058](https://github.com/charliegghaccount/stick-city-test/actions/runs/39553746058) completed dependency installation, tests and production build successfully. Its `actions/configure-pages` step failed with HTTP 404 because GitHub Pages was not enabled, so the deployment job was skipped.

An API request to enable Pages with `build_type: workflow` was rejected with HTTP 403, `Resource not accessible by integration`. The available integration can push the source but cannot enable this repository feature. The official `actions/configure-pages@v5` enablement path requires a token other than `GITHUB_TOKEN` with administration-write and Pages-write permission.

The remaining action is to enable Pages in the repository settings, then rerun the failed workflow. Installation and the local playable game are verified; public publication is still blocked by this setting.

## Automatic deployment

`.github/workflows/deploy.yml` runs on pushes to `main` and can also be started manually from Actions. It installs the locked dependencies with Node.js 24, runs the game-rule tests and production build, uploads `dist/`, then deploys the artifact with GitHub Pages.

Vite uses `base: '/stick-city-test/'`, so asset URLs work under the repository’s Pages path. The game is entirely static and does not need a backend, database or secret to run.

## Required manual step

1. Open [repository Pages settings](https://github.com/charliegghaccount/stick-city-test/settings/pages).
2. Set **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Open [the failed Actions run](https://github.com/charliegghaccount/stick-city-test/actions/runs/39553746058) and select **Re-run jobs → Re-run failed jobs**. Alternatively, select **Build and deploy Stick City** in [Actions](https://github.com/charliegghaccount/stick-city-test/actions) and run it on `main`.
4. If working with Codex in the setup chat, say when the setting is saved so it can retry and verify publication.
5. Wait for both `build` and `deploy` jobs to succeed, then open the exact Pages address above.

If a run reports that Actions are disabled, enable repository Actions in **Settings → Actions → General**. If a required approval appears for the `github-pages` environment, approve that deployment in Actions. Repository or account policy can require an administrator to change these settings.

## Verification

A successful local build verifies generated files, not public deployment. A successful Actions run verifies publication, but the public page should also be checked for working assets and a playable city.

Confirm that the public address returns a page, the city and HUD render, walking works, a building opens, and refreshing preserves progress. Check the browser console for failed assets. Mobile layout can be checked in an iPhone portrait browser; automated Chromium mobile emulation does not prove real Mobile Safari compatibility.

## Manual fallback

If an automated push or repository setting change is blocked, retain the prepared commit and workflow. An administrator can push the commit to `main`, choose **Source: GitHub Actions**, and start the workflow. Do not enter access tokens into chat or add credentials to source files.

Local inspection remains available with `npm ci`, `npm run dev`, or `npm run build` followed by `npm run preview`. These commands require a development machine and are not a substitute for the requested public playable link.
