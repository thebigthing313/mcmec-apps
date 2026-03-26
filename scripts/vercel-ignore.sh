#!/bin/bash
# Vercel Ignored Build Step
# https://vercel.com/docs/projects/overview#ignored-build-step
#
# Usage: bash ../../scripts/vercel-ignore.sh <app-name>
#   e.g. bash ../../scripts/vercel-ignore.sh central
#
# Exit 1 = proceed with build
# Exit 0 = skip build
#
# Logic:
#   1. Always build if [deploy-preview] is in the commit message
#   2. On main (production) or preview: only build if relevant files changed
#      - The app's own directory (apps/<app-name>/)
#      - Any shared package (packages/)
#      - Root config files (package.json, pnpm-lock.yaml, turbo.json, etc.)

APP_NAME="$1"

if [ -z "$APP_NAME" ]; then
  echo "⚠ No app name provided — proceeding with build as fallback"
  exit 1
fi

# Force build via commit message flag
if echo "$VERCEL_GIT_COMMIT_MESSAGE" | grep -q "\[deploy-preview\]"; then
  echo "✓ [deploy-preview] flag found — proceeding with build"
  exit 1
fi

# Skip preview builds entirely unless [deploy-preview] was used
if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then
  echo "⏭ Skipping preview build (add [deploy-preview] to commit message to override)"
  exit 0
fi

# On main: check if relevant files changed
# Compare against the previous commit
CHANGED_FILES=$(git diff --name-only HEAD~1 2>/dev/null || echo "DIFF_FAILED")

if [ "$CHANGED_FILES" = "DIFF_FAILED" ]; then
  echo "⚠ Could not diff — proceeding with build as fallback"
  exit 1
fi

# Check for changes in: this app, shared packages, or root config
if echo "$CHANGED_FILES" | grep -qE "^(apps/${APP_NAME}/|packages/|package\.json|pnpm-lock\.yaml|turbo\.json|biome\.json)"; then
  echo "✓ Relevant changes detected for ${APP_NAME} — proceeding with build"
  exit 1
fi

echo "⏭ No changes affecting ${APP_NAME} — skipping build"
exit 0
