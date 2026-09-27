# Recipe Picker Web

An installable React PWA for choosing four balanced dinners. It preserves the original
prototype's cuisine, difficulty, and household-preference rules while moving the interface
to a responsive web app.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

## Checks

```bash
pnpm lint
pnpm test
pnpm build     # static site in dist/
pnpm preview   # serve dist/ at http://localhost:4173
```

## Structure

- `index.html` and `src/main.tsx` are the static entry point; `src/globals.css` holds the theme.
- `components/meal-planner.tsx` owns the planner interaction and device-local persistence.
- `components/meal-card.tsx` renders one accessible, reusable meal card.
- `lib/meal-selection.ts` contains framework-independent selection rules.
- `data/meals.json` is the migrated meal catalog.
- `public/assets` contains web-optimized copies of the original meal photos.
- `public/manifest.webmanifest` and `public/sw.js` provide installation and offline support.

The current plan and locks are stored in `localStorage`; no backend is required.

## Images and caching

Files in `public/assets/` are served with a one-year immutable `Cache-Control` header. When you replace an image,
give it a new filename and update `data/meals.json`; reusing a filename can leave the old image cached on devices
and at the CDN.
