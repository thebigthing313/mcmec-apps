#!/bin/bash
# Vercel Ignored Build Step
# https://vercel.com/docs/projects/overview#ignored-build-step
#
# Exit 1 = proceed with build
# Exit 0 = skip build
#
# Production (main branch): always build
# Preview (PRs/branches): skip unless commit message contains [deploy-preview]

if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  echo "✓ Production branch — proceeding with build"
  exit 1
fi

if echo "$VERCEL_GIT_COMMIT_MESSAGE" | grep -q "\[deploy-preview\]"; then
  echo "✓ [deploy-preview] flag found — proceeding with preview build"
  exit 1
fi

echo "⏭ Skipping preview build (add [deploy-preview] to commit message to override)"
exit 0
