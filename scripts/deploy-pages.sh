#!/usr/bin/env bash
#
# Build the prototype and publish it to GitHub Pages.
#
#   ./scripts/deploy-pages.sh
#
# Pages is set to serve the `gh-pages` branch, whose contents are exactly the
# static export in out/. That branch holds build output only — it has no shared
# history with main and is force-pushed every time, so never commit to it by hand.
#
# The repo would normally deploy from a GitHub Actions workflow instead, which
# publishes automatically on every push to main. Adding .github/workflows/
# requires the `workflow` OAuth scope, which the current gh login lacks. To move
# to automatic deploys later:
#
#   gh auth refresh -s workflow          # one browser approval
#   git add .github/workflows/pages.yml && git commit && git push
#   gh api --method PUT repos/:owner/:repo/pages -f build_type=workflow
#
# ...and this script becomes unnecessary.

set -euo pipefail

cd "$(dirname "$0")/.."

REMOTE_URL="$(git remote get-url origin)"
SOURCE_SHA="$(git rev-parse --short HEAD)"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

echo "==> Building static export"
npm run build

# Jekyll, which Pages applies by default, ignores every directory starting with
# an underscore — and Next puts all its chunks in _next/. Without this file the
# pages render with no CSS or JS. It lives in public/ so builds carry it, but is
# re-checked here because losing it silently breaks the whole site.
[ -f out/.nojekyll ] || touch out/.nojekyll

echo "==> Publishing out/ to gh-pages"
# The scratch repo starts with no identity of its own, so carry this repo's
# across. GitHub matches the author against the account, so a fallback to the
# machine hostname would be rejected.
AUTHOR_NAME="$(git config user.name)"
AUTHOR_EMAIL="$(git config user.email)"

cp -R out/. "$WORKDIR/"
git -C "$WORKDIR" init -q -b gh-pages
git -C "$WORKDIR" add -A
git -C "$WORKDIR" \
  -c "user.name=$AUTHOR_NAME" -c "user.email=$AUTHOR_EMAIL" \
  commit -q -m "Deploy $SOURCE_SHA"
git -C "$WORKDIR" push -q --force "$REMOTE_URL" gh-pages

echo "==> Published $SOURCE_SHA"
echo "    https://seda-jumbobee.github.io/atlantic-rms-prototype/"
echo "    Pages takes about a minute to serve the new build."
