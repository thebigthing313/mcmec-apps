---
---

Tooling only: add the root `dev`, `build`, `check-types` and `lint` scripts that CLAUDE.md
documents, point CI at them, and drop the redundant per-package `lint` scripts and turbo `lint`
task so there is one way to lint. No package behaviour changes, so nothing to release.
