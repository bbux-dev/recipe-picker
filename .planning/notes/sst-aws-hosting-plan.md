# SST/AWS hosting plan

## Goal

Publish the Weeknight Recipe Picker at `https://mealpicker.bxtn.dev` as a static PWA, as simply as possible, using the
same general infrastructure pattern as the other `bxtn.dev` applications (see `../lang-learning/infra` and
`../patrimonium`).

- SST manages infrastructure and deployments.
- AWS stores and serves the static application (private S3 bucket behind CloudFront).
- Cloudflare remains authoritative for `bxtn.dev` DNS (record unproxied).
- The application stays public: no authentication, backend, database, or server runtime.

## How to use this plan

Work is split into small chunks. Each chunk:

- has one goal and a short list of changes,
- ends with a **Verify** block that can be run independently (commands plus expected result),
- is committed on its own once verified (`hosted-app` branch),
- is labeled **Cost: none** (local only) or **Cost: GATE** (creates or changes billable AWS resources).

**Cost rule:** do not start any chunk labeled `Cost: GATE`, and do not run `sst deploy`, `sst diff`, `sst refresh`,
`sst remove`, or any AWS/Cloudflare write outside those chunks, without explicit approval from Brian in the current
session. If any chunk turns up a decision that could cost more than a basic static site (S3 + CloudFront at family
scale), stop and ask before continuing, even if the chunk is otherwise labeled `Cost: none`.

Chunks 0–7 are local only. Chunks 8–10 touch AWS/Cloudflare.

## Current state (verified 2026-09-26)

- The maintained app is in `web/`: React 19 + Tailwind 4 + shadcn components, currently built with Next.js-compatible
  Vinext tooling plus the Cloudflare Vite plugin, Wrangler, and "Sites" build helpers.
- Recipe data is imported at build time from `web/data/meals.json`; 42 WebP images live in `web/public/assets/`.
- The plan and locked meals are stored in `localStorage` (`recipe-picker-plan-v1`). There is no server persistence.
- `web/public/sw.js` provides offline caching; `web/public/manifest.webmanifest` provides installability.
- The current build emits `dist/client/` and a Cloudflare worker in `dist/server/`, with no standalone `index.html`.
- `web/` has both `package-lock.json` and `pnpm-lock.yaml`; the latest commit made pnpm work.

**Blocker found (resolved in 3cf82e2):** the repository-root `.gitignore` is a Python template that ignores `lib/` and `build/`. As a
result, `web/lib/meal-selection.ts` (selection rules: `selectMeals`, `refreshMealPlan`) and `web/lib/utils.ts`
(shadcn `cn` helper) were never committed and do not exist in this checkout. `web/vite.config.ts` also imports
`./build/sites-vite-plugin`, which is likewise missing. The app cannot build or run from a clean clone. Chunk 0 fixes
this.

## Target architecture

```text
mealpicker.bxtn.dev
        |
  Cloudflare DNS (CNAME, proxy: false)
        |
 Amazon CloudFront  (ACM cert in us-east-1, response headers policy)
        |
 private S3 bucket  (origin access control; no public access)
```

`sst.aws.StaticSite` builds `web/`, uploads `web/dist/` to S3, and creates the CloudFront distribution, certificate,
and Cloudflare DNS record. No Lambda, API Gateway, database, or rendering runtime.

## Cost-relevant decisions (need sign-off before Chunk 8)

| # | Decision | Recommendation | Why it matters for cost |
|---|----------|----------------|-------------------------|
| D1 | Put CloudFront in front of S3 | **Yes** | S3 website endpoints are HTTP-only and cannot serve a custom domain over HTTPS; a PWA and service worker require HTTPS. CloudFront is the AWS-native way to get HTTPS. At family scale usage sits inside CloudFront's always-free tier (1 TB transfer and 10M requests per month at the time of writing); verify on the AWS pricing page. The zero-AWS-CDN alternative is a public S3 website bucket behind a proxied Cloudflare record, which needs a public bucket named after the hostname, sends plain HTTP between Cloudflare and S3, and would not use `StaticSite`. |
| D2 | Accept `StaticSite`'s extra edge resources | **Yes** | In SST 4.x `StaticSite` also creates a CloudFront Function (URL rewrite) and a CloudFront KeyValueStore (route table), and runs a cache invalidation per deploy. These are billed per request or per path, but at this scale the cost is expected to round to $0: the function invocations should fit the free tier, KVS reads cost cents per million, and the first 1,000 invalidation paths per month are free. |
| D3 | Deploy a `dev` stage (`mealpicker-dev.bxtn.dev`) before `prod` | **Yes, then remove it** | A second distribution and bucket. The idle cost is effectively $0, but it doubles the resource count. Remove it with `sst remove --stage dev` after prod is verified, unless you want to keep it. |
| D4 | SST state bootstrap | **Reuse the existing account/region** | SST keeps state in an S3 bucket and an SSM parameter in its home region. If the target account already hosts `lessons-delivery` in `us-east-1`, the bootstrap already exists; otherwise the first deploy creates it (a few cents per month at most). |

**Explicitly excluded** (each would add cost beyond a basic static site; do not add without asking): AWS WAF, Route 53
hosted zones, CloudFront standard or real-time logging, S3 access logging, Origin Shield, Lambda@Edge, SST Console or
Autodeploy, CloudWatch alarms or dashboards, and a Cloudflare-proxied record in front of CloudFront.

## Conventions to match (from `../lang-learning/infra`)

- `sst` **4.12.2** (pinned), AWS provider **7.20.0** with `region: "us-east-1"`, Cloudflare provider **6.13.0**
  with only `apiToken` (SST's DNS adapter reads `CLOUDFLARE_DEFAULT_ACCOUNT_ID` from the environment).
- No static imports at the top of `sst.config.ts`; use dynamic `import()` inside `app()`/`run()`.
- Stages are exactly `dev` and `prod`; reject anything else in `app()` so a typo cannot create a new stack that
  claims the prod hostname. `prod` uses `removal: "retain"` and `protect: true`; `dev` uses `removal: "remove"`.
- pnpm with `packageManager` pinned; Node `>=22.12`.
- Credentials come from the environment (`AWS_PROFILE`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_DEFAULT_ACCOUNT_ID`),
  never from committed files.

Layout decision: put `sst.config.ts` and a small SST-only `package.json` at the **repo root**, with
`StaticSite({ path: "web" })`. This is SST's native layout, avoids a `../web` path, and keeps app dependencies in
`web/`. (lang-learning used `infra/` because its root is a Python project; that reason does not apply here.)

---

## Chunk 0: Recover the missing source and fix `.gitignore` (done, 3cf82e2)

**Cost: none.**

Goal: the repository builds from a clean clone.

1. Anchor the Python ignores at the root so they no longer match `web/lib` or `web/build`: change `build/`, `lib/`,
   `dist/`, and similar directory patterns in the root `.gitignore` to `/build/`, `/lib/`, and so on, or scope them
   to `archive/`. `web/.gitignore` already covers `web/dist/`.
2. Restore `web/lib/meal-selection.ts` and any tests beside it:
   - **Preferred:** copy them from the machine or sandbox where the React app was built. The README and handoff say
     tests passed there, so the files exist somewhere.
   - **Fallback:** reimplement from `archive/desktop-prototype/main.py` (`select_suggested_meals`) and
     `meal_selector.py` (seasonal and difficulty rules) using the call sites
     `selectMeals(meals, { random })` → `Meal[]` (4 meals) and `refreshMealPlan(meals, current, lockedIds)` →
     `Meal[]` (keeps locked slots), and add `web/lib/meal-selection.test.ts` covering count, the at-most-one-hard
     rule, lock preservation, and no duplicates.
3. Restore `web/lib/utils.ts` as the standard shadcn helper (`cn = (...inputs) => twMerge(clsx(inputs))`).
4. Do not restore `build/sites-vite-plugin`; Chunk 2 removes the import.

Verify:

```shell
git -C .. check-ignore -v web/lib/meal-selection.ts   # prints nothing (not ignored)
git status --short                                     # shows web/lib/* as new files
cd web && pnpm test                                    # all tests pass, including meal-selection tests
npx tsc --noEmit -p . 2>&1 | grep -c "lib/"            # 0 errors mentioning lib/
```

## Chunk 1: Standardize on pnpm

**Cost: none.**

1. Delete `web/package-lock.json`.
2. Add `"packageManager": "pnpm@<version that produced pnpm-lock.yaml>"` to `web/package.json` (check with `pnpm -v`;
   siblings use 10.33.0, but this machine has 11.1.2, and `allowBuilds` in `pnpm-workspace.yaml` must stay
   compatible).
3. Remove `web/.npmrc` entries that only apply to npm, if any remain relevant.

Verify:

```shell
cd web && rm -rf node_modules && pnpm install --frozen-lockfile   # succeeds
pnpm test                                                          # passes
```

## Chunk 2: Add a static Vite entry point

**Cost: none.**

Goal: `pnpm build` produces a plain static site in `web/dist/`. The old Next/Vinext files may still exist but are no
longer used by the build.

1. Add `web/index.html` carrying what `app/layout.tsx` metadata provided: `lang="en"`, title "Recipe Picker",
   description, `<link rel="manifest" href="/manifest.webmanifest">`, favicon (`/favicon.svg`), apple-touch-icon
   (`/icon-192.png`), `<meta name="theme-color" content="#8d4050">`, `<meta name="color-scheme" content="light">`,
   `<div id="root">`, and `<script type="module" src="/src/main.tsx">`. No inline scripts or styles (CSP).
2. Add `web/src/main.tsx`: import `../app/globals.css` (moved in Chunk 3), compute
   `selectMeals(meals, { random: () => 0.42 })` exactly as `app/page.tsx` does, and render
   `<StrictMode><MealPlanner …/></StrictMode>` with `createRoot`.
3. Replace `web/vite.config.ts` with `@vitejs/plugin-react` and the `@` alias (same as `vitest.config.ts`), plus
   `base: "/"`.
4. Change the scripts to `"dev": "vite"`, `"build": "tsc --noEmit && vite build"`, `"preview": "vite preview"`, and
   remove `start` and `install:ci`.

Verify:

```shell
cd web && pnpm build
ls dist/index.html dist/manifest.webmanifest dist/sw.js dist/favicon.svg   # all exist
ls dist/assets/*.js dist/assets/*.css dist/assets/*.webp | head             # hashed bundles plus meal images
test ! -d dist/server && test ! -d dist/client && echo "no server output"
grep -c "<script" dist/index.html        # 1 (the module entry only; no inline scripts)
pnpm preview --port 4173 &               # open http://localhost:4173: meals render, shuffle and lock work, reload keeps plan
curl -s localhost:4173/ | grep -o "<title>.*</title>"
```

## Chunk 3: Remove Next, Vinext, Cloudflare, and Sites tooling

**Cost: none.**

1. Move `app/globals.css` to `src/globals.css` (update the import) and delete `app/layout.tsx`, `app/page.tsx`, and
   `app/`.
2. Delete `next.config.ts`, `cloudflare-env.d.ts`, `.openai/`, and `scripts/` (every file there is Sites or Wrangler
   plumbing; confirm with `grep -rn "scripts/" package.json`).
3. Remove these dependencies: `next`, `vinext`, `@vitejs/plugin-rsc`, `react-server-dom-webpack`,
   `@cloudflare/vite-plugin`, `@cloudflare/workers-types`, `wrangler`, and `eslint-config-next`. Remove the
   `overrides.miniflare` block and `workerd` from `pnpm-workspace.yaml` `allowBuilds`.
4. ESLint: replace the Next presets with `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, and
   `eslint-plugin-react-refresh` (the standard Vite React template). Keep the `components/ui/**` rule relaxations.
5. `tsconfig.json`: drop the `next` plugin, the `.next` includes, and `@cloudflare/workers-types`; set `types` to
   `["vite/client", "node"]`.
6. `"use client"` directives are harmless in Vite; remove them for tidiness.
7. Update `web/README.md` so the run and build instructions use pnpm and the port is correct.

Verify:

```shell
cd web && pnpm install
grep -rniE "next|vinext|wrangler|cloudflare|miniflare" package.json tsconfig.json vite.config.ts eslint.config.mjs  # no hits
pnpm lint && pnpm test && pnpm build      # all pass
du -sh node_modules                       # noticeably smaller than before (sanity check)
```

## Chunk 4: Service worker and caching review

**Cost: none.**

1. Bump `CACHE_NAME` in `public/sw.js` to `recipe-picker-v2` and add a comment: "bump on releases that change
   `sw.js` behavior".
2. Keep the existing strategy, which is sound for this host: navigations are network-first with a cached `/`
   fallback (so a stale shell cannot be pinned while online), and other same-origin GETs are stale-while-revalidate.
   Hashed bundles get new URLs on every build, so the shell never references stale JS.
3. Confirm the precache list (`/`, `/manifest.webmanifest`, `/favicon.svg`) exists in `dist/`.
4. Decide the image cache contract: the images in `/assets/*.webp` are not content-hashed but will be served with a
   one-year immutable `Cache-Control`. **Rule:** when replacing an image, give it a new filename and update
   `meals.json`. Record this rule in `web/README.md`.

Verify (Chrome, against `pnpm preview`):

- DevTools → Application → Service Workers: `sw.js` is activated; Cache Storage shows `recipe-picker-v2` containing
  `/`, the manifest, and the favicon.
- Reload once, then set Network to Offline and reload again: the app renders with images.
- Lighthouse (Chrome) → PWA / installable checks pass (preview runs on localhost, which counts as a secure context).

## Chunk 5: Security headers module, tested locally first

**Cost: none.**

Goal: one source of truth for response headers, applied by `vite preview` now and by CloudFront later, so a CSP that
breaks the app is caught locally.

1. Add `web/security-headers.ts` exporting a plain object:
   - `Content-Security-Policy`: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;
     font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none';
     base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `X-Frame-Options: DENY`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()`
2. Wire it into `vite.config.ts` as `preview.headers` (not `server.headers`, because the dev server needs inline HMR).
3. If Radix or other components set inline `style=""` attributes and the console shows CSP violations, add
   `'unsafe-inline'` to `style-src` only, and record why in a comment. Never loosen `script-src`.
4. Optional: a tiny vitest that asserts the CSP contains `frame-ancestors 'none'` and `object-src 'none'` and that
   `script-src` has no `unsafe-*`.

Verify:

```shell
cd web && pnpm build && pnpm preview --port 4173 &
curl -sI localhost:4173/ | grep -iE "content-security|strict-transport|nosniff|referrer|permissions|frame-options"  # all 6 present
```

Open the page in Chrome with DevTools Console open: zero CSP violations while shuffling, locking, reloading, and
registering the service worker.

## Chunk 6: SST scaffolding (no deploy)

**Cost: none.** Do **not** run `sst deploy`, `sst diff`, or `sst dev` in this chunk; they contact AWS.

1. Root `package.json`: `private`, `type: module`, `packageManager` (same pnpm as `web/`), and devDependencies
   `sst@4.12.2`, `typescript@5.9.3`, `@types/node`. Scripts: `"typecheck": "tsc --noEmit"`.
2. Root `sst.config.ts`, following the lang-learning conventions above:
   - `app()`: `name: "mealpicker"`, `home: "aws"`, providers `aws: { version: "7.20.0", region: "us-east-1" }` and
     `cloudflare: { version: "6.13.0", apiToken: process.env.CLOUDFLARE_API_TOKEN }`; throw unless the stage is
     exactly `dev` or `prod`; for `prod` use `removal: "retain"` and `protect: true`.
   - `run()`: dynamically import the headers module and create:

     ```ts
     const site = new sst.aws.StaticSite("MealPicker", {
       path: "web",
       build: { command: "pnpm run build", output: "dist" },
       domain: {
         name: $app.stage === "prod" ? "mealpicker.bxtn.dev" : "mealpicker-dev.bxtn.dev",
         dns: sst.cloudflare.dns({ proxy: false }),
       },
       assets: {
         // SST applies these with later entries taking precedence; keep "**" first.
         fileOptions: [
           { files: "**", cacheControl: "max-age=31536000,public,immutable" },
           { files: ["**/*.html", "sw.js"], cacheControl: "max-age=0,no-cache,no-store,must-revalidate" },
           { files: "manifest.webmanifest", cacheControl: "max-age=300,public" },
         ],
       },
       // Chunk 7 adds transform.cdn for the response headers policy.
     });
     return { url: site.url };
     ```

   - Treat the logical name `MealPicker` as frozen after the first deploy (renaming it replaces the bucket and
     distribution).
3. Root `tsconfig.json` including `sst.config.ts` and `.sst/platform/config.d.ts`; add `.sst/` and root
   `node_modules/` to `.gitignore`.
4. Run `pnpm install` then `pnpm exec sst install`, which only downloads providers locally and makes no AWS calls.

Verify:

```shell
pnpm install && pnpm exec sst install     # generates .sst/platform, no AWS calls
pnpm typecheck                            # passes
git status --short                        # .sst/ not listed
```

Before relying on the `fileOptions` precedence comment, confirm it against
`.sst/platform/src/components/aws/static-site.ts` (`uploadAssets`).

## Chunk 7: Attach security headers to CloudFront (still no deploy)

**Cost: none** (a `ResponseHeadersPolicy` itself is free; nothing is created until Chunk 8).

1. In `run()`, create an `aws.cloudfront.ResponseHeadersPolicy("MealPickerHeaders", …)` from the shared headers
   module: `securityHeadersConfig` for HSTS, nosniff, frame options, and referrer policy with `override: true`;
   `contentSecurityPolicy`; and `customHeadersConfig` for `Permissions-Policy`.
2. Attach it through `transform.cdn` on the `StaticSite`, setting `defaultCacheBehavior.responseHeadersPolicyId`.
   Confirm the exact arg shape in `.sst/platform/src/components/aws/static-site.ts` and `cdn.ts`, and keep
   `viewerProtocolPolicy: "redirect-to-https"` (the StaticSite default).
3. Add a deploy script `tools/deploy.sh --stage <dev|prod> [--yes]`, modeled on
   `../lang-learning/tools/operations/deploy-lessons-delivery.sh`: require `CLOUDFLARE_API_TOKEN` and
   `CLOUDFLARE_DEFAULT_ACCOUNT_ID`; run `aws sts get-caller-identity` and refuse if the account does not match
   `MEALPICKER_EXPECTED_AWS_ACCOUNT` (required for prod); require typed stage confirmation unless `--yes`; run
   `pnpm --dir web install --frozen-lockfile`, `pnpm --dir web test`, and then `pnpm exec sst deploy --stage <stage>`.
4. Document the credentials in the root `README.md`: `AWS_PROFILE`, a Cloudflare token scoped to **Zone:Read +
   DNS:Edit on `bxtn.dev` only**, and the account ID. Nothing is committed.

Verify:

```shell
pnpm typecheck                                          # passes
bash -n tools/deploy.sh && shellcheck tools/deploy.sh   # clean (if shellcheck is installed)
env -u CLOUDFLARE_API_TOKEN bash tools/deploy.sh --stage dev   # exits non-zero with a clear message before any AWS call
bash tools/deploy.sh --stage staging                    # rejected: unknown stage
```

## Chunk 8: First deploy to `dev`

**Cost: GATE.** Stop and get approval for D1–D4, the AWS account or profile to use, and confirmation that the
Cloudflare token exists.

1. Optionally, as a read-only check, confirm DNSSEC on `bxtn.dev`: `dig +dnssec bxtn.dev DS` shows a DS record, and
   the Cloudflare dashboard shows DNSSEC as active.
2. `bash tools/deploy.sh --stage dev`. The first run takes a while because ACM validation and CloudFront propagation
   run 5–15 minutes.
3. Record the outputs (URL, distribution ID) in the commit message or the README, not in code.

Verify:

```shell
curl -sI http://mealpicker-dev.bxtn.dev/ | head -3                      # 301 to https
curl -sI https://mealpicker-dev.bxtn.dev/ | grep -iE "^HTTP|cache-control|content-security|strict-transport|x-cache"
curl -sI https://mealpicker-dev.bxtn.dev/sw.js | grep -i cache-control          # no-cache
curl -sI https://mealpicker-dev.bxtn.dev/assets/<hashed>.js | grep -i cache-control   # max-age=31536000, immutable
curl -sI https://mealpicker-dev.bxtn.dev/manifest.webmanifest | grep -i cache-control # max-age=300
dig +short mealpicker-dev.bxtn.dev CNAME                                 # *.cloudfront.net
echo | openssl s_client -connect mealpicker-dev.bxtn.dev:443 -servername mealpicker-dev.bxtn.dev 2>/dev/null | openssl x509 -noout -subject -dates
aws s3api get-public-access-block --bucket <bucket>                      # all four true
```

Then run the browser smoke test against the live site (it fails on certificate errors, CSP violations, broken
images, lost persistence, or a failed offline reload):

```shell
node tools/smoke.mjs https://mealpicker-dev.bxtn.dev/
```

## Chunk 9: Production deploy

**Cost: GATE.** Get approval to deploy `prod`.

1. `MEALPICKER_EXPECTED_AWS_ACCOUNT=<id> bash tools/deploy.sh --stage prod`.
2. Repeat every Chunk 8 check, including `node tools/smoke.mjs https://mealpicker.bxtn.dev/`, against
   `mealpicker.bxtn.dev`.
3. Test on desktop and mobile: install the PWA, shuffle and lock meals, reload (the plan persists), then go offline
   and navigate again.
4. Run Lighthouse against production for installability and accessibility.
5. Remove the dev stage (`pnpm exec sst remove --stage dev`, **Cost: GATE**, needs approval) unless you want to keep
   it.

## Chunk 10: Update round-trip and docs

**Cost: GATE** (one small redeploy).

1. Make a visible, trivial change (for example, the footer text or a new `CACHE_NAME`), then deploy `prod` again.
2. Verify: the SST output shows one invalidation; a hard reload shows the change immediately; an installed PWA picks
   up the new service worker after one reload (DevTools shows the old worker replaced); `index.html` is never served
   stale by CloudFront (`x-cache: Miss from cloudfront` or `RefreshHit` after the deploy).
3. Update the root `README.md` with a short operations section covering deploy, stages, credentials, how to add a
   recipe or image (new filename rule), and teardown (`prod` is retained and protected, so removal needs an
   explicit override).
4. Mark this note's handoff status as complete.

---

## Expected operating profile

For personal or family usage, costs are limited to small S3 storage, CloudFront requests and transfer (expected to
stay within the always-free tier), CloudFront Function and KeyValueStore requests (cents at most), and SST
state. There is no continuously running compute. Cloudflare only provides authoritative DNS.

## Handoff status

- [x] Chunk 0: recover `web/lib`, fix `.gitignore` (3cf82e2)
- [x] Chunk 1: pnpm only (b4b55fc; pinned `pnpm@11.1.2`, which produced the lockfile)
- [x] Chunk 2: static Vite entry (c5c0149)
- [x] Chunk 3: remove Next/Vinext/Cloudflare tooling (173f3cd; also moved the saved-plan read out of an effect into lazy state init, since there is no SSR)
- [x] Chunk 4: service worker review (a67a270)
- [x] Chunk 5: security headers (local) (2432d58; strict `style-src 'self'` works, no `unsafe-inline` needed)
- [x] Chunk 6: SST scaffolding (df2c716; `fileOptions` precedence confirmed in SST 4.12.2 source)
- [x] Chunk 7: CloudFront headers plus deploy script (2171880, plus `tools/smoke.mjs`; the headers transform is only provable after the Chunk 8 deploy)
- [ ] Chunk 8: dev deploy (**cost gate**)
- [ ] Chunk 9: prod deploy (**cost gate**)
- [ ] Chunk 10: update round-trip and docs (**cost gate**)
