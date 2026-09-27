/// <reference path="./.sst/platform/config.d.ts" />

// SST app for the static Recipe Picker PWA (see .planning/notes/sst-aws-hosting-plan.md).
//
// Conventions follow ../lang-learning/infra: region pinned to us-east-1 (CloudFront needs its
// ACM certificate there anyway), the Cloudflare provider takes only the API token (SST's DNS
// adapter reads CLOUDFLARE_DEFAULT_ACCOUNT_ID from the environment), and the only stages
// are "dev" and "prod". The stage string is SST's state namespace, so anything else is
// rejected rather than creating a second stack that claims a mealpicker hostname.
//
// No static imports at the top of this file: SST evaluates it before providers are installed.

const STAGES = ["dev", "prod"];

const HOSTS: Record<string, string> = {
  dev: "mealpicker-dev.bxtn.dev",
  prod: "mealpicker.bxtn.dev",
};

export default $config({
  app(input) {
    const stage = input?.stage;
    if (!stage || !STAGES.includes(stage)) {
      throw new Error(`Unknown stage "${stage}". Use --stage dev or --stage prod.`);
    }
    const isProd = stage === "prod";

    return {
      name: "mealpicker",
      home: "aws",
      providers: {
        aws: { version: "7.20.0", region: "us-east-1" },
        cloudflare: { version: "6.13.0", apiToken: process.env.CLOUDFLARE_API_TOKEN },
      },
      removal: isProd ? "retain" : "remove",
      protect: isProd,
    };
  },
  async run() {
    // "MealPicker" is a frozen logical name: renaming it replaces the bucket and distribution.
    const site = new sst.aws.StaticSite("MealPicker", {
      path: "web",
      build: {
        command: "pnpm run build",
        output: "dist",
      },
      domain: {
        name: HOSTS[$app.stage],
        dns: sst.cloudflare.dns({ proxy: false }),
      },
      assets: {
        fileOptions: [
          { files: "**", cacheControl: "max-age=31536000,public,immutable" },
          { files: ["**/*.html", "sw.js"], cacheControl: "max-age=0,no-cache,no-store,must-revalidate" },
          { files: "manifest.webmanifest", cacheControl: "max-age=300,public" },
        ],
      },
    });

    return {
      url: site.url,
    };
  },
});
