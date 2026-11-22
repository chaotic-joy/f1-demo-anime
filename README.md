# Full Throttle

An anime-styled Formula 1 championship tracker. It shows the current drivers' and constructors' standings, the next Grand Prix with a countdown and session times in your local time zone, the rest of the calendar, and recent podiums.

When the season is over, the page switches to the next year's calendar once Jolpica has published it, and names the champions. Before that calendar exists, it shows a season-complete state instead.

## Data source

Race data comes from the free [Jolpica-F1](https://api.jolpi.ca/ergast/f1/) API, which is compatible with the old Ergast routes. No API key and no secrets.

`vite build` and `vite dev` call `scripts/fetch-f1.mjs` before bundling. That script writes `src/data/snapshot.json`. The app imports the file, so the deployed site is static and the browser does not call the API.

The snapshot includes `fetchedAt`. The page shows it as **Last updated**, formatted in the viewer's local time.

If Jolpica is unreachable and a snapshot is already committed, the script keeps that file and the build continues. A missing snapshot with a failed fetch fails the build, because there would be nothing to render.

## Refreshing the data

Redeploy once a day. A [Vercel Deploy Hook](https://vercel.com/docs/deployments/deploy-hooks) is a straightforward trigger: each deployment runs the Vite build, fetches Jolpica, and publishes a new static site.

## Local development

```bash
npm install
npm run dev
```

The dev server refreshes the snapshot on startup. To work offline from the committed file:

```bash
F1_SKIP_FETCH=1 npm run dev
```

Other scripts:

- `npm run build` — typecheck, refresh data, write `dist/`
- `npm run preview` — serve the production build
- `npm test` — schedule logic and the snapshot fallback
- `npm run fetch-data` — refresh `src/data/snapshot.json` only

## Deploying on Vercel

Import the repository. Vercel detects Vite, runs `vite build`, and publishes `dist/`. No adapter, environment variables, or `vercel.json` are required. The data fetch lives in `vite.config.ts`, so the default Vite build command refreshes the snapshot.
