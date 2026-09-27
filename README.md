# Weeknight Recipe Picker

The maintained application lives in [`web/`](web/). It is a self-contained React PWA with its own recipe catalog and image assets.

## Run the current app

```shell
cd web
pnpm install
pnpm dev
```

## Verify it

```shell
cd web
pnpm lint
pnpm test
pnpm build
```

## Hosting

The app is deployed as a static site with [SST](https://sst.dev) (`sst.config.ts`, single stage `prod`): a private
S3 bucket behind CloudFront, with a Cloudflare DNS record for `mealpicker.bxtn.dev`. The plan and its cost rules are
in [`.planning/notes/sst-aws-hosting-plan.md`](.planning/notes/sst-aws-hosting-plan.md).

Deploy settings live in a gitignored `.env` that [direnv](https://direnv.net) loads through `.envrc`. Copy
`.env-example` to `.env`, fill it in, and run `direnv allow` once. It holds:

- `AWS_PROFILE` for the target account.
- `MEALPICKER_EXPECTED_AWS_ACCOUNT`, so a deploy to the wrong account is refused.
- `CLOUDFLARE_API_TOKEN`, scoped to Zone:Read and DNS:Edit on the `bxtn.dev` zone only.
- `CLOUDFLARE_DEFAULT_ACCOUNT_ID`.

```shell
pnpm install
bash tools/deploy.sh
node tools/smoke.mjs https://mealpicker.bxtn.dev/   # browser smoke test against the live site
```

The stage is protected and its resources are retained if it is ever removed.

## Legacy desktop prototype

The original Python/PySide6 implementation and its unfinished MVC experiment are preserved under [`archive/desktop-prototype/`](archive/desktop-prototype/README.md). The React app does not depend on them.
