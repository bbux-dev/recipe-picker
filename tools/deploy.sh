#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'USAGE'
Usage: tools/deploy.sh

Lints, tests, and builds the Recipe Picker PWA, then deploys it with SST
(stage "prod") as a static site: private S3 bucket, CloudFront, and a
Cloudflare DNS record for mealpicker.bxtn.dev.

Required environment (never commit these):
  AWS_PROFILE (or another AWS credential source)
  CLOUDFLARE_API_TOKEN, CLOUDFLARE_DEFAULT_ACCOUNT_ID
  MEALPICKER_EXPECTED_AWS_ACCOUNT  deploy is refused if credentials resolve elsewhere

If a deploy is interrupted, reconcile SST's state before retrying:
  pnpm exec sst refresh --stage prod
USAGE
}

fail() {
  echo "error: $*" >&2
  exit 1
}

case "${1:-}" in
  "") ;;
  --help|-h) usage; exit 0 ;;
  *) usage >&2; fail "Unknown argument: $1" ;;
esac

[[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || fail "CLOUDFLARE_API_TOKEN is not set"
[[ -n "${CLOUDFLARE_DEFAULT_ACCOUNT_ID:-}" ]] || fail "CLOUDFLARE_DEFAULT_ACCOUNT_ID is not set"
[[ -n "${MEALPICKER_EXPECTED_AWS_ACCOUNT:-}" ]] || fail "MEALPICKER_EXPECTED_AWS_ACCOUNT is not set"

ACCOUNT="$(aws sts get-caller-identity --query Account --output text)" ||
  fail "AWS credentials are not usable; export AWS_PROFILE and run 'aws sso login' if needed"

if [[ "$ACCOUNT" != "$MEALPICKER_EXPECTED_AWS_ACCOUNT" ]]; then
  fail "AWS account $ACCOUNT does not match MEALPICKER_EXPECTED_AWS_ACCOUNT ($MEALPICKER_EXPECTED_AWS_ACCOUNT)"
fi

echo "Deploying mealpicker.bxtn.dev to AWS account $ACCOUNT"

cd "$ROOT_DIR"
pnpm install --frozen-lockfile
pnpm --dir web install --frozen-lockfile
pnpm --dir web lint
pnpm --dir web test
pnpm exec sst deploy --stage prod
