# Fitness Track website

The website turns the repository's Markdown guides into a responsive personal
fitness dashboard. It includes the latest morning routine, vegetarian meal
ideas, an adjustable macro calculator, and all three full guides.

## Run locally

Use Node.js 24 (or 22+) and Python 3:

```sh
npm ci
npm test
npm run build
npm run serve
```

The static output is in `dist/`. There are no runtime dependencies, analytics,
external fonts, or external image requests. The calculator runs in the browser.

## GitHub Pages

In GitHub, open **Settings → Pages → Build and deployment → Source** and select
**GitHub Actions**. The `Deploy Fitness Track` workflow tests, builds, and
deploys on pushes to `main`. If the workflow ran before Pages was enabled,
rerun it from the Actions tab after selecting this setting.

The expected address is **https://anuj1314.github.io/Fitness-track/**.
Publication must be confirmed through a successful deployment and a live
request; adding the workflow alone does not establish that the site is live.

## Updating content

Edit `routine.md`, `diet-plan.md`, or `nutrition.md` and push to `main` to rebuild
the full guides. The website highlights the latest routine; the older diet and
nutrition guides retain their historical assumptions. Curated overview cards
live in `site/index.html` and should be updated when the current plan changes.
Styles and browser interactions live in `site/styles.css` and `site/app.mjs`.

The published site includes the same personal details and medication schedule
already recorded in these guides. It has no login or private storage.
