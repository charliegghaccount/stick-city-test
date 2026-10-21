# GitHub Pages deployment

Repository: [`charliegghaccount/stick-city-test`](https://github.com/charliegghaccount/stick-city-test).

Expected public address after successful deployment: `https://charliegghaccount.github.io/stick-city-test/`.

## Status at initial setup

The repository was public and empty, its default branch was `main`, and GitHub Pages was not enabled. The expected address returned HTTP 404. These checks do not establish a live playable deployment. Consult the latest Actions run and verify the page after publishing.

## Automatic deployment

`.github/workflows/deploy.yml` runs on pushes to `main` and can also be started manually from Actions. It installs the locked dependencies with Node.js 24, runs the game-rule tests and production build, uploads `dist/`, then deploys the artifact with GitHub Pages.

Vite uses `base: '/stick-city-test/'`, so asset URLs work under the repository’s Pages path. The game is entirely static and does not need a backend, database or secret to run.

## If Pages needs enabling

1. Open [repository Pages settings](https://github.com/charliegghaccount/stick-city-test/settings/pages).
2. Set **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Open [Actions](https://github.com/charliegghaccount/stick-city-test/actions) and select **Build and deploy Stick City**.
4. Run the workflow on `main`, or push a commit to `main`.
5. Wait for both `build` and `deploy` jobs to succeed, then open the exact Pages address above.

If a run reports that Actions are disabled, enable repository Actions in **Settings → Actions → General**. If a required approval appears for the `github-pages` environment, approve that deployment in Actions. Repository or account policy can require an administrator to change these settings.

## Verification

A successful local build verifies generated files, not public deployment. A successful Actions run verifies publication, but the public page should also be checked for working assets and a playable city.

Confirm that the public address returns a page, the city and HUD render, walking works, a building opens, and refreshing preserves progress. Check the browser console for failed assets. Mobile layout can be checked in an iPhone portrait browser; automated Chromium mobile emulation does not prove real Mobile Safari compatibility.

## Manual fallback

If an automated push or repository setting change is blocked, retain the prepared commit and workflow. An administrator can push the commit to `main`, choose **Source: GitHub Actions**, and start the workflow. Do not enter access tokens into chat or add credentials to source files.

Local inspection remains available with `npm ci`, `npm run dev`, or `npm run build` followed by `npm run preview`. These commands require a development machine and are not a substitute for the requested public playable link.
