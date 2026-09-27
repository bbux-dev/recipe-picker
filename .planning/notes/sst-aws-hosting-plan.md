# SST/AWS hosting plan

## Goal

Publish the Weeknight Recipe Picker at `https://mealpicker.bxtn.dev` using the same general infrastructure pattern as the
other `bxtn.dev` applications: see ../patrimonium or ../lang-learning

- SST manages infrastructure and deployments.
- AWS stores and serves the static application.
- Cloudflare remains authoritative for `bxtn.dev` DNS.
- The application stays public and does not require authentication or a backend.

No cloud resources or DNS records were created as part of this handoff.

## Current application

The maintained application is in `web/` and is a React PWA currently built with Next.js-compatible Vinext tooling.

- Recipe data is imported at build time from `web/data/meals.json`.
- Forty-two optimized WebP images are served from `web/public/assets/`.
- The chosen plan and locked meals are stored in browser `localStorage`.
- There is no database, API, account system, or server-side persistence.
- The service worker provides basic offline caching after the application has been loaded.

The current build emits browser assets under `web/dist/client/` and a Cloudflare-compatible rendering worker under
`web/dist/server/`. It does not emit a standalone `index.html`, so `dist/client` cannot be uploaded directly to a
conventional static host as-is.

## Recommended target architecture

```text
mealpicker.bxtn.dev
        |
  Cloudflare DNS
        |
 Amazon CloudFront
        |
 private S3 bucket
```

Use `sst.aws.StaticSite` rather than a Next.js server deployment. This application has no server-side requirements, so
Lambda, API Gateway, a database, and a second rendering runtime would add complexity without providing a useful
capability.

Keep the Cloudflare DNS record unproxied (`proxy: false`). Cloudflare will remain the DNS provider while CloudFront
handles TLS, caching, and content delivery. This avoids unnecessarily stacking Cloudflare's CDN in front of CloudFront.

## Work required before deployment

### 1. Convert the frontend to a static Vite build

Retain the existing React components, hooks, selection logic, tests, JSON data, images, manifest, icons, and service
worker. Replace the Vinext/Next application shell with a conventional client entry point:

- Add `web/index.html`.
- Add a browser entry such as `web/src/main.tsx` that renders the planner.
- Move or import the global stylesheet from the new entry point.
- Simplify `web/vite.config.ts` to use `@vitejs/plugin-react` and the existing `@` alias.
- Change the package scripts to `vite`, `vite build`, and `vite preview`.
- Remove Next, Vinext, the Cloudflare Vite plugin, Wrangler, and site-preview-only build helpers after confirming they
  are unused.
- Keep Vite's base path at `/`, because the application will be hosted at the root of `mealpicker.bxtn.dev`.

The completed production build should contain at least:

```text
web/dist/index.html
web/dist/assets/*
web/dist/manifest.webmanifest
web/dist/sw.js
```

### 2. Add SST infrastructure

Initialize or integrate this repository with the SST version used by the main development environment. Add the
Cloudflare provider with:

```shell
sst add cloudflare
```

The site resource should be equivalent to:

```ts
const site = new sst.aws.StaticSite("mealpicker", {
    path: "web",
    build: {
        command: "npm run build",
        output: "dist",
    },
    domain: {
        name: "mealpicker.bxtn.dev",
        dns: sst.cloudflare.dns({
            proxy: false,
        }),
    },
});

return {
    url: site.url,
};
```

Merge this into the established `sst.config.ts` conventions on the main development machine rather than assuming a
provider version, AWS region, stage policy, or state backend here.

Suggested production lifecycle settings:

- Protect the production stage from accidental removal.
- Retain production resources on removal unless an explicit teardown is intended.
- Use the same AWS region, account, state backend, and stage naming convention as the other personal applications.

### 3. Configure credentials

Deployment needs:

- AWS credentials for the target account.
- `CLOUDFLARE_API_TOKEN` with access limited to editing DNS for the `bxtn.dev` zone.
- `CLOUDFLARE_DEFAULT_ACCOUNT_ID`, if required by the existing SST setup.

Cloudflare credentials must be available to the deployment environment or CI process; do not place them in the
application bundle or commit them to the repository.

SST should automate ACM certificate creation and DNS validation. CloudFront certificates must be issued in `us-east-1`;
the SST static-site component handles this when it creates the certificate.

## Security baseline

The recipe catalog and images are intentionally public. Do not add authentication or an application backend solely for
access control.

Configure the CloudFront response headers policy with a normal public-static-site baseline:

- Redirect HTTP to HTTPS.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy` allowing only the application's own scripts, styles, images, manifest, worker, and
  connections. Allow `data:` only where required for images. Do not allow framing.
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling unused browser capabilities.
- `frame-ancestors 'none'` and `object-src 'none'` in the CSP.

Also verify that DNSSEC is enabled for the `bxtn.dev` Cloudflare zone and that its DS record is present at the
registrar. TLS plus DNSSEC covers the requested normal domain-spoofing protections. A WAF is not necessary for a static
recipe picker unless traffic patterns later justify it.

## Caching and PWA behavior

Use these cache policies:

- Hashed JavaScript and CSS assets: `public, max-age=31536000, immutable`.
- Versioned recipe images: long-lived public caching; rename or fingerprint an image when replacing it.
- `index.html`: no-cache or a very short TTL so deployments become visible promptly.
- `sw.js`: no-cache so clients discover service-worker updates promptly.
- `manifest.webmanifest`: short TTL.

Review `web/public/sw.js` during the static conversion:

- Increment its cache name for meaningful releases.
- Confirm `/`, `/manifest.webmanifest`, and `/favicon.svg` install successfully from CloudFront.
- Confirm runtime image and asset requests are cached.
- Ensure an old service worker cannot indefinitely pin an obsolete application shell.

## Deployment

From the configured main development machine:

```shell
npm install
npm test --prefix web
npm run build --prefix web
npx sst deploy --stage production
```

Adjust the stage name to match the existing SST convention. Before deploying, verify that `web/dist/index.html` exists
and that the build contains no server or worker runtime.

## Post-deployment verification

- Open `https://mealpicker.bxtn.dev` on desktop and mobile.
- Confirm the certificate covers `mealpicker.bxtn.dev` and HTTP redirects to HTTPS.
- Confirm Cloudflare DNS resolves the hostname to the SST-created CloudFront distribution.
- Confirm recipe images load and shuffling/locking meals works.
- Reload and confirm the selected plan survives through `localStorage`.
- Install the PWA and test a second navigation while offline.
- Inspect response headers for CSP, HSTS, `nosniff`, referrer policy, and permissions policy.
- Confirm `index.html` and `sw.js` are not cached for a year while hashed assets are.
- Run the existing test suite and a Lighthouse PWA/accessibility check.
- Make a small follow-up deployment to verify CloudFront invalidation and service-worker updates behave correctly.

## Expected operating profile

For personal or family usage, costs should be limited to small S3 storage, CloudFront requests and transfer, and normal
SST state/deployment resources. There are no continuously running compute resources. Cloudflare remains responsible only
for authoritative DNS unless proxying is deliberately enabled later.

## Handoff status

- React PWA implementation is complete and its tests/build passed before this note was written.
- The original Python/PySide6 prototype and incomplete MVC experiment are preserved under `archive/desktop-prototype/`.
- Static-build conversion has not been implemented.
- SST infrastructure has not been added.
- AWS and Cloudflare resources have not been created.
