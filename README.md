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

The app is deployed as a static site with [SST](https://sst.dev) (`sst.config.ts`): a private S3 bucket behind
CloudFront, with a Cloudflare DNS record for `mealpicker.bxtn.dev` (stage `prod`) or `mealpicker-dev.bxtn.dev`
(stage `dev`). The plan and its cost rules are in
[`.planning/notes/sst-aws-hosting-plan.md`](.planning/notes/sst-aws-hosting-plan.md).

Deploying needs these in the environment (never commit them):

- `AWS_PROFILE` (or another standard AWS credential source) for the target account.
- `CLOUDFLARE_API_TOKEN`, scoped to Zone:Read and DNS:Edit on the `bxtn.dev` zone only.
- `CLOUDFLARE_DEFAULT_ACCOUNT_ID`.
- `MEALPICKER_EXPECTED_AWS_ACCOUNT` (required for `prod`), so a deploy to the wrong account is refused.

```shell
pnpm install
bash tools/deploy.sh --stage dev
```

`prod` is protected and its resources are retained if the stage is removed.

## Legacy desktop prototype

The original Python/PySide6 implementation and its unfinished MVC experiment are preserved under [`archive/desktop-prototype/`](archive/desktop-prototype/README.md). The React app does not depend on them.
