# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

This repo is **single-context**: one `CONTEXT.md` and one `docs/adr/` at the root, covering all apps and packages.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — the glossary / ubiquitous language for MCMEC.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-....md
│   └── 0002-....md
├── apps/          ← central, notices, public, admin, hr, api
└── packages/      ← ui, lib, supabase, auth, typescript-config, ...
```

This is a pnpm/Turborepo monorepo, but it models a single domain — the apps are surfaces over the same MCMEC concepts, not separate bounded contexts. If a genuinely distinct context ever emerges, switch to a root `CONTEXT-MAP.md` pointing at per-context `CONTEXT.md` files and update this file.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
