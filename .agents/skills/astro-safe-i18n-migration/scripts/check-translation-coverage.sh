#!/usr/bin/env bash
set -euo pipefail
# Heuristic check for leftover default-locale text in translated locale output.
# Flags default-locale dictionary strings (15+ chars) found verbatim in another
# locale's built HTML. Not a substitute for the Phase 1 inventory cross-check,
# but catches the most common "forgot to translate this" and "still hardcoded"
# bugs deterministically instead of relying on manual click-through.
#
# Usage: ./check-translation-coverage.sh <build-dir> <default-locale-dict.json> <locale> [locale...]
# Exit code 0 = no flags. Non-zero = flags found, review each one.

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <build-dir> <default-locale-dict.json> <locale> [locale...]"
  exit 2
fi

BUILD_DIR="$1"
EN_DICT="$2"
shift 2
LOCALES=("$@")

if [[ ! -f "$EN_DICT" ]]; then
  echo "ERROR: default-locale dictionary not found at $EN_DICT"
  exit 1
fi

# Extract dictionary VALUES (JSON string values 15+ chars) -- long enough that
# a verbatim match elsewhere is a real signal, not coincidence.
STRINGS=$(grep -oE '"[^"]{15,}"' "$EN_DICT" | sed 's/^"//;s/"$//' | sort -u)

if [[ -z "$STRINGS" ]]; then
  echo "WARNING: no strings of 15+ characters found in $EN_DICT -- check the dictionary path/format."
fi

FOUND_ISSUES=0

for LOCALE in "${LOCALES[@]}"; do
  LOCALE_DIR="$BUILD_DIR/$LOCALE"
  if [[ ! -d "$LOCALE_DIR" ]]; then
    echo "WARNING: no build output found for locale '$LOCALE' at $LOCALE_DIR -- this route may be missing entirely."
    FOUND_ISSUES=1
    continue
  fi
  while IFS= read -r STR; do
    [[ -z "$STR" ]] && continue
    MATCHES=$(grep -rlF -- "$STR" "$LOCALE_DIR" 2>/dev/null || true)
    if [[ -n "$MATCHES" ]]; then
      echo "POSSIBLE UNTRANSLATED STRING in locale '$LOCALE': \"$STR\""
      echo "  Found verbatim in: $MATCHES"
      FOUND_ISSUES=1
    fi
  done <<< "$STRINGS"
done

echo ""
if [[ "$FOUND_ISSUES" -eq 0 ]]; then
  echo "PASS: no known default-locale strings (15+ chars) found verbatim in checked locale output."
else
  echo "FAIL: possible untranslated content found above."
  echo "Cross-check each against the Phase 1 inventory: confirm it's a genuine miss (fix it)"
  echo "or an intentional shared string like a brand name (note it and move on)."
fi
