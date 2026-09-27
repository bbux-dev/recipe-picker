# Recipe Picker Web

An installable React PWA for choosing four balanced dinners. It preserves the original
prototype's cuisine, difficulty, and household-preference rules while moving the interface
to a responsive web app.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Checks

```bash
npm test
npm run build
```

## Structure

- `components/meal-planner.tsx` owns the planner interaction and device-local persistence.
- `components/meal-card.tsx` renders one accessible, reusable meal card.
- `lib/meal-selection.ts` contains framework-independent selection rules.
- `data/meals.json` is the migrated meal catalog.
- `public/assets` contains web-optimized copies of the original meal photos.
- `public/manifest.webmanifest` and `public/sw.js` provide installation and offline support.

The current plan and locks are stored in `localStorage`; no backend is required.
