#!/usr/bin/env bash
set -euo pipefail
# Heuristic check for UI logic that branches on translatable string values instead
# of a stable key/id. Flags any dictionary VALUE (15+ chars, to reduce noise) that
# also appears inside a direct string-literal comparison in source code
# (===, ==, .includes(, switch/case) -- a strong sign that display text is being
# used as a de-facto identifier, which silently breaks the moment that text is
# translated.
#
# Usage: ./check-string-coupled-logic.sh <default-locale-dict.json> <src-dir>
# Exit code 0 = no flags. Non-zero = flags found, review each one.

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <default-locale-dict.json> <src-dir>"
  exit 2
fi

EN_DICT="$1"
SRC_DIR="$2"

if [[ ! -f "$EN_DICT" ]]; then
  echo "ERROR: default-locale dictionary not found at $EN_DICT"
  exit 1
fi

STRINGS=$(grep -oE '"[^"]{15,}"' "$EN_DICT" | sed 's/^"//;s/"$//' | sort -u)

if [[ -z "$STRINGS" ]]; then
  echo "WARNING: no strings of 15+ characters found in $EN_DICT -- check the dictionary path/format."
fi

FOUND_ISSUES=0

while IFS= read -r STR; do
  [[ -z "$STR" ]] && continue
  # Escape regex-special characters in the string for safe use inside grep -E
  ESCAPED=$(printf '%s' "$STR" | sed -e 's/[.[\*^$()+?{|]/\\&/g')
  MATCHES=$(grep -rEn "(===|==|\.includes\(|case[[:space:]]+)[[:space:]]*['\"]${ESCAPED}['\"]" "$SRC_DIR" 2>/dev/null || true)
  if [[ -n "$MATCHES" ]]; then
    echo "POSSIBLE STRING-COUPLED LOGIC for: \"$STR\""
    echo "$MATCHES" | sed 's/^/  /'
    FOUND_ISSUES=1
  fi
done <<< "$STRINGS"

echo ""
if [[ "$FOUND_ISSUES" -eq 0 ]]; then
  echo "PASS: no direct code comparisons against translatable dictionary strings found."
else
  echo "FAIL: logic appears to branch on translatable text (shown above)."
  echo "Replace each with a stable, untranslated key/id/enum before this ships in a non-English locale --"
  echo "the logic will silently misbehave the moment that text is translated."
fi
