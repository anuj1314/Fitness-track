# Fitness Track website

A responsive fitness dashboard with an automatically generated guide library.
The current routine, vegetarian meal ideas, and macro calculator are complemented
by every Markdown guide in `content/`.

## Repository layout

```text
content/                 # Nutrition, diet, routine, and future Markdown guides
website/
  src/                   # HTML template, styles, browser code, illustrations
  scripts/build.mjs      # Discovers and renders content automatically
  tests/                 # Calculator and content build checks
  package.json
  package-lock.json
  dist/                  # Generated site; ignored by Git
.github/workflows/pages.yml
```

## Add or update a guide

1. Add a `.md` file anywhere under `content/`, or edit an existing one.
2. Start new files with a `# Title` heading. The title becomes the guide's menu
   label; without one, the filename is used. Use descriptive filenames with
   letters/numbers, such as `workout-plan.md`.
3. Commit and push to `main`. GitHub Actions tests, rebuilds, and deploys the site
   when GitHub Pages is enabled.

New guides automatically appear in the guide picker and title search. No HTML,
JavaScript, or hardcoded file list needs editing. Nested folders are supported,
for example `content/training/workout.md`. Relative links between Markdown
files open the corresponding guide. Downloads are published under `content/`;
existing top-level guide download URLs remain available for compatibility.

The three original guides keep their short menu labels and appear first;
additional guides are sorted alphabetically by title. Each filename becomes a
stable `#guide-…` URL. Names that produce the same URL cause a clear build error
instead of ambiguous navigation. Removing a file removes it from the next build.

The build publishes repository-authored Markdown, including any raw HTML. Add
only content you intend to publish. Website development notes outside `content/`
are excluded from the guide library.

## Run locally

From the repository root, use Node.js 24 (or 22+) and Python 3:

```sh
cd website
npm ci
npm test
npm run build
npm run serve
```

The static output is in `website/dist/`. The build regenerates it each time.
There are no runtime dependencies, analytics, external fonts, or external image
requests. The calculator runs in the browser.

## GitHub Pages

In GitHub, select **Settings → Pages → Build and deployment → Source → GitHub
Actions**. The `Deploy Fitness Track` workflow tests, builds from `website/`,
and publishes `website/dist/` on pushes to `main`. Rerun the workflow from the
Actions tab if it ran before Pages was enabled.

Expected address: **https://anuj1314.github.io/Fitness-track/**.
A successful build alone does not confirm a live deployment.

## Website presentation

The guide library is generated entirely from `content/` at every build. The
curated dashboard cards and illustrations are in `website/src/index.html`;
update those separately when you want to change the overview or its design.
Styling and interactions are in `website/src/styles.css` and `website/src/app.mjs`.

The daily routine remains the current plan; older diet and nutrition guides
retain their earlier running and breakfast assumptions. The published site
includes the same personal information recorded in the guides, with no login
or private storage.
