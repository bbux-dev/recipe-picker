/// <reference path="./.sst/platform/config.d.ts" />

// SST app for the static Recipe Picker PWA (see .planning/notes/sst-aws-hosting-plan.md).
//
// Conventions follow ../lang-learning/infra: region pinned to us-east-1 (CloudFront needs its
// ACM certificate there anyway) and the Cloudflare provider takes only the API token (SST's DNS
// adapter reads CLOUDFLARE_DEFAULT_ACCOUNT_ID from the environment).
//
// There is a single stage, "prod". The stage string is SST's state namespace, so any other
// stage is rejected rather than creating a second stack that claims the same hostname.
//
// No static imports at the top of this file: SST evaluates it before providers are installed.

const STAGE = "prod";
const HOST = "mealpicker.bxtn.dev";

export default $config({
  app(input) {
    if (input?.stage !== STAGE) {
      throw new Error(`Unknown stage "${input?.stage}". This app only deploys --stage ${STAGE}.`);
    }

    return {
      name: "mealpicker",
      home: "aws",
      providers: {
        aws: { version: "7.20.0", region: "us-east-1" },
        cloudflare: { version: "6.13.0", apiToken: process.env.CLOUDFLARE_API_TOKEN },
      },
      removal: "retain",
      protect: true,
    };
  },
  async run() {
    const headers = await import("./web/security-headers");

    // The same values `vite preview` sends locally (web/security-headers.ts).
    const responseHeaders = new aws.cloudfront.ResponseHeadersPolicy("MealPickerHeaders", {
      comment: "mealpicker security headers",
      securityHeadersConfig: {
        contentSecurityPolicy: {
          contentSecurityPolicy: headers.CONTENT_SECURITY_POLICY,
          override: true,
        },
        strictTransportSecurity: {
          accessControlMaxAgeSec: headers.STRICT_TRANSPORT_SECURITY_MAX_AGE,
          includeSubdomains: true,
          override: true,
        },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: "DENY", override: true },
        referrerPolicy: { referrerPolicy: "strict-origin-when-cross-origin", override: true },
      },
      customHeadersConfig: {
        items: [{ header: "Permissions-Policy", value: headers.PERMISSIONS_POLICY, override: true }],
      },
    });

    // "MealPicker" is a frozen logical name: renaming it replaces the bucket and distribution.
    const site = new sst.aws.StaticSite("MealPicker", {
      path: "web",
      build: {
        command: "pnpm run build",
        output: "dist",
      },
      domain: {
        name: HOST,
        dns: sst.cloudflare.dns({ proxy: false }),
      },
      assets: {
        fileOptions: [
          { files: "**", cacheControl: "max-age=31536000,public,immutable" },
          { files: ["**/*.html", "sw.js"], cacheControl: "max-age=0,no-cache,no-store,must-revalidate" },
          { files: "manifest.webmanifest", cacheControl: "max-age=300,public" },
        ],
      },
      transform: {
        cdn: (args) => {
          args.defaultCacheBehavior = $resolve({
            behavior: args.defaultCacheBehavior,
            responseHeadersPolicyId: responseHeaders.id,
          }).apply(({ behavior, responseHeadersPolicyId }) => ({ ...behavior, responseHeadersPolicyId }));
        },
      },
    });

    return {
      url: site.url,
    };
  },
});
