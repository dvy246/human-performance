#!/usr/bin/env bash
set -euo pipefail
# Verifies the current git state is safe to run i18n migration work in.
# Refuses to proceed on main/master, and refuses if the working tree is dirty.
#
# Usage: ./git-safety-check.sh [expected-branch-prefix]
# Exit code 0 = safe to proceed. Non-zero = STOP, do not make file changes.

PREFIX="${1:-feature/i18n-}"

if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "BLOCKED: not inside a git repository. i18n migration must happen inside version control."
  exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
  echo "BLOCKED: currently on '$CURRENT_BRANCH'."
  echo "i18n migration must never run directly on the production branch."
  echo "Create and switch to a dedicated branch first, e.g.:"
  echo "  git checkout -b ${PREFIX}multilingual"
  exit 1
fi

if [[ "$CURRENT_BRANCH" != ${PREFIX}* ]]; then
  echo "WARNING: current branch '$CURRENT_BRANCH' does not match the expected prefix '$PREFIX'."
  echo "Proceeding, but confirm this is the intended branch before continuing."
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "BLOCKED: working tree has uncommitted changes."
  echo "Commit or stash before starting a new migration batch — never build new changes on top of unverified ones."
  git status --short
  exit 1
fi

echo "OK: on branch '$CURRENT_BRANCH', working tree clean. Safe to proceed."
