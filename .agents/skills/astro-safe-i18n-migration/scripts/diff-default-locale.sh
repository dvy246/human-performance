#!/usr/bin/env bash
set -euo pipefail
# Rebuilds the project and diffs the output against the Phase 0 baseline.
# Any difference here is an unintended regression on the default locale --
# it should render byte-for-byte identical to before the i18n migration started.
#
# ASSUMPTION: the default locale is unprefixed and continues to serve at the
# same paths it always did (routing.prefixDefaultLocale: false or equivalent --
# see the skill's routing recommendation). If the default locale is deliberately
# prefixed (e.g. everything now lives under /en/), this whole-tree diff will show
# expected structural moves alongside any real regressions -- scope the diff to
# specific pre/post paths manually in that case instead of relying on this script alone.
#
# Usage: ./diff-default-locale.sh [build-dir]
# Exit code 0 = PASS, no unexpected differences. Non-zero = FAIL, investigate before continuing.

BUILD_DIR="${1:-dist}"
SNAPSHOT_DIR=".i18n-baseline"

if [[ ! -d "$SNAPSHOT_DIR" ]]; then
  echo "ERROR: no baseline snapshot found at $SNAPSHOT_DIR/."
  echo "Run snapshot-baseline.sh at Phase 0 before any i18n changes, then retry."
  exit 1
fi

echo "Rebuilding project..."
npm run build

echo "Diffing current output against baseline ($SNAPSHOT_DIR)..."
set +e
RAW_DIFF=$(diff -rq "$SNAPSHOT_DIR" "$BUILD_DIR" 2>&1)
set -e

# A brand-new file/dir only in the current build (i.e. a newly added locale) is
# EXPECTED and not a regression -- only these count as real problems:
#   - "Files X and Y differ"            -> content changed in a file that existed before
#   - "Only in $SNAPSHOT_DIR: ..."      -> something that existed before is now missing
REGRESSIONS=$(echo "$RAW_DIFF" | grep -E "^Files .* differ$|^Only in ${SNAPSHOT_DIR//\//\\/}" || true)
NEW_ADDITIONS=$(echo "$RAW_DIFF" | grep -E "^Only in ${BUILD_DIR//\//\\/}" || true)

if [[ -z "$REGRESSIONS" ]]; then
  echo "PASS: no regressions on existing content. Default-locale output matches the pre-migration baseline."
  if [[ -n "$NEW_ADDITIONS" ]]; then
    echo ""
    echo "New paths added since baseline (expected for newly added locales):"
    echo "$NEW_ADDITIONS"
  fi
  exit 0
else
  echo "FAIL: regressions found relative to the pre-migration baseline:"
  echo "$REGRESSIONS"
  echo ""
  echo "'Files ... differ' means content changed inside a file that existed before migration --"
  echo "this is the wording/UI-drift bug. Inspect it directly with:"
  echo "  diff $SNAPSHOT_DIR/<path> $BUILD_DIR/<path>"
  echo "'Only in $SNAPSHOT_DIR' means a file that existed before is now missing -- investigate immediately."
  if [[ -n "$NEW_ADDITIONS" ]]; then
    echo ""
    echo "(New paths only in the current build were also found and are fine -- not shown as failures:)"
    echo "$NEW_ADDITIONS"
  fi
  exit 1
fi
