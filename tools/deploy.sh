#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

STAGE=""
YES=false

usage() {
  cat <<'USAGE'
Usage: tools/deploy.sh --stage <dev|prod> [--yes]

Builds the Recipe Picker PWA and deploys it with SST as a static site:
private S3 bucket, CloudFront, and a Cloudflare DNS record for
mealpicker-dev.bxtn.dev (dev) or mealpicker.bxtn.dev (prod).

Preflight (in order, before `sst deploy` runs):
  - CLOUDFLARE_API_TOKEN and CLOUDFLARE_DEFAULT_ACCOUNT_ID must both be set
  - `aws sts get-caller-identity` must succeed; MEALPICKER_EXPECTED_AWS_ACCOUNT
    refuses a deploy that resolves to a different account (required for prod)
  - the stage must be confirmed: type the stage name, or pass --yes

Export AWS_PROFILE (or another standard AWS credential source) first.

If a deploy is interrupted, reconcile SST's state before retrying:
  pnpm exec sst refresh --stage <stage>
USAGE
}

fail() {
  echo "error: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stage)
      shift
      [[ $# -gt 0 ]] || fail "Missing value for --stage"
      STAGE="$1"
      ;;
    --yes)
      YES=true
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      usage >&2
      fail "Unknown argument: $1"
      ;;
  esac
  shift
done

case "$STAGE" in
  dev|prod) ;;
  "") usage >&2; fail "--stage is required" ;;
  *) fail "Unknown stage \"$STAGE\". Use dev or prod." ;;
esac

[[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || fail "CLOUDFLARE_API_TOKEN is not set"
[[ -n "${CLOUDFLARE_DEFAULT_ACCOUNT_ID:-}" ]] || fail "CLOUDFLARE_DEFAULT_ACCOUNT_ID is not set"

if [[ "$STAGE" == "prod" && -z "${MEALPICKER_EXPECTED_AWS_ACCOUNT:-}" ]]; then
  fail "MEALPICKER_EXPECTED_AWS_ACCOUNT must be set for a prod deploy"
fi

ACCOUNT="$(aws sts get-caller-identity --query Account --output text)" ||
  fail "AWS credentials are not usable; export AWS_PROFILE first"

if [[ -n "${MEALPICKER_EXPECTED_AWS_ACCOUNT:-}" && "$ACCOUNT" != "$MEALPICKER_EXPECTED_AWS_ACCOUNT" ]]; then
  fail "AWS account $ACCOUNT does not match MEALPICKER_EXPECTED_AWS_ACCOUNT ($MEALPICKER_EXPECTED_AWS_ACCOUNT)"
fi

echo "Deploying stage \"$STAGE\" to AWS account $ACCOUNT"
if [[ "$YES" != true ]]; then
  read -r -p "Type the stage name to continue: " CONFIRM
  [[ "$CONFIRM" == "$STAGE" ]] || fail "Confirmation did not match; nothing deployed"
fi

cd "$ROOT_DIR"
pnpm install --frozen-lockfile
pnpm --dir web install --frozen-lockfile
pnpm --dir web lint
pnpm --dir web test
pnpm exec sst deploy --stage "$STAGE"
