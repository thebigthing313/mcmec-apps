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
# CURRENTLY: every build is skipped unconditionally — see the block below.
# The per-app logic that follows it is dormant, kept for the revert path:
#   1. Always build if [deploy-preview] is in the commit message
#   2. On main (production) or preview: only build if relevant files changed
#      - The app's own directory (apps/<app-name>/)
#      - Any shared package (packages/)
#      - Root config files (package.json, pnpm-lock.yaml, turbo.json, etc.)

# ---------------------------------------------------------------------------
# Production has moved to Railway. Every Vercel build is skipped until these
# projects are retired.
#
# This is not housekeeping — without it, merging to main takes the live site
# down. The apps now read VITE_API_URL (staff apps) and API_URL (public), which
# are set on the Railway services and NOT in Vercel. Vite inlines a missing
# VITE_* as undefined, so nothing fails at build time: the build goes green,
# publishes over a working production deployment, and lib/queryClient.ts throws
# at module load in the browser. A white screen, from a successful deploy.
#
# The switch lives here rather than in the dashboard's Ignored Build Step field
# because every app's vercel.json sets `ignoreCommand`, and per Vercel's docs
# that value *overrides* the dashboard setting — editing it there does nothing.
# All five vercel.json files call this script, so this one line covers them all,
# and it is version-controlled and reviewable rather than click-state in someone
# else's UI.
#
# It sits above every other check on purpose: exit 1 means "build", so anything
# that can fail must come after the line that stops the build, never before it.
#
# Removing this restores Vercel deploys. Do that only if the migration is being
# reverted — the intended end state is disconnecting Git on each project and
# deleting this script along with the vercel.json files.
# ---------------------------------------------------------------------------
echo "⏭ Skipping build — production is served from Railway (see comment above)"
exit 0

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
