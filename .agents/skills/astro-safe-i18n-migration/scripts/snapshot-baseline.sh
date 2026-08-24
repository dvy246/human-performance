#!/usr/bin/env bash
set -euo pipefail
# Builds the project and stores the output as a baseline snapshot for later
# regression diffing. Run this ONCE at Phase 0, before any i18n changes exist.
#
# Usage: ./snapshot-baseline.sh [build-dir] [default-locale]

BUILD_DIR="${1:-dist}"
SNAPSHOT_DIR=".i18n-baseline"

echo "Building project (pre-i18n baseline)..."
npm run build

if [[ ! -d "$BUILD_DIR" ]]; then
  echo "ERROR: build directory '$BUILD_DIR' not found after build. Pass the correct dir as arg 1 if it's not 'dist'."
  exit 1
fi

rm -rf "$SNAPSHOT_DIR"
mkdir -p "$SNAPSHOT_DIR"
cp -r "$BUILD_DIR"/. "$SNAPSHOT_DIR"/

echo "Baseline snapshot saved to $SNAPSHOT_DIR/"
echo "This captures the site's output BEFORE any i18n changes."
echo "Do not delete this directory until the full migration is verified and handed off (Phase 5)."
echo "Consider adding '$SNAPSHOT_DIR/' to .gitignore -- it's a local verification aid, not something to commit."
