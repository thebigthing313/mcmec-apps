# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCMEC (Middlesex County Mosquito Extermination Commission) monorepo with three web apps and six shared packages, managed with **pnpm workspaces** and **Turborepo**.

### Apps
- **central** (`apps/central`) — Admin management interface (Vite SPA, port 3544)
- **website-management** (`apps/website-management`) — Public-website content management: notices, meetings, insecticides, documents, spray schedules, service requests (Vite SPA, port 3547)
- **public** (`apps/public`) — Public-facing website with SSR (TanStack Start + Nitro, port 3548)

### Dev ports

Local dev runs behind Caddy. **Browse the https ports** — the Vite/API ports are upstreams
and shouldn't be opened directly.

| Browse (https) | Upstream (http) | App |
| -------------- | --------------- | --- |
| 3443 | 3543 | api (Hono) |
| 3444 | 3544 | central |
| 3445 | 3545 | hr |
| 3446 | 3546 | admin |
| 3447 | 3547 | website-management |
| 3448 | 3548 | public |

**Upstream = browse port + 100.** Every MCMEC port is one of these twelve plus 2020, and the
two columns carry the same last two digits, so a URL in the address bar names the port behind
it without a lookup.

Caddy's admin endpoint is on 2020. Start it with `caddy trust` (once) then `caddy run` from
the repo root.

Caddy is a **separate process from `pnpm dev`** — `pnpm dev` only starts the Vite/API upstreams
in the right-hand column. Without `caddy run` in its own terminal, the https browse ports do not
exist at all.

Everything is https for two reasons, and doing half of it is worse than neither:

- **HTTP/2.** Each ElectricSQL shape holds a long-poll against the API origin, and HTTP/1.1
  caps one origin at ~6 concurrent connections — a page with several live shapes starves.
- **Cookies.** An `http://` page calling an `https://` API is *cross-site* under Chrome's
  schemeful same-site rules, so the `SameSite=Lax` session cookie is withheld and the app
  bounces to `/login` forever. Page and API must share a scheme.

Each app's `server.hmr.clientPort` points at its https port so the HMR socket isn't blocked
as mixed content. `apps/public`'s server-side `API_URL` stays on plain http — that's Node
calling localhost, not the browser.

**Do not use these ports** — a concurrent project on this machine (`F:/simmer-mosquito`) binds
them: **3000** (its Hono server), **3001** (Docker → ElectricSQL), **3002** (its Caddy),
**4173** (`vite preview`), **5173–5176** (its Vite servers and their Caddy fronts), **55432**
(Docker → Postgres), and **80** / **2019** (Caddy defaults). Two of those — 3001 and 55432 —
come up with `docker compose up` and stay up, so they are held even when nobody is running that
project's dev servers.

That list is why our upstreams are in the 35xx block and not, as they were until recently, in
3001–3007. When that project mapped Electric to host 3001 it took `central`'s port, and the
symptom was not a bind error: Docker's relay accepts the connection, so `pnpm dev` reported
nothing and Caddy served a bare `Not found` on `https://localhost:3444`. **The lesson is about
adjacency, not about 3001** — pick blocks that are ours end to end rather than ports that merely
happen to be free today.

Every Vite config here sets `strictPort: true`, so a collision we *can* detect fails loudly
instead of silently landing on a neighbouring port (Windows will happily let two processes both
"listen" on the same port, which makes the origin ambiguous rather than erroring). Our Caddy
sets `admin localhost:2020` and `auto_https disable_redirects` for the same reason — the
defaults would take 2019 and 80.

### Packages
- **ui** (`packages/ui`) — Shared component library (Radix UI + Tailwind CSS v4 + shadcn pattern)
- **lib** (`packages/lib`) — Business logic, constants, validation schemas (Zod)
- **schemas** (`packages/schemas`) — Zod row/insert/update schemas (`db/*`); a pure Zod leaf with no React or TanStack dependency
- **sync** (`packages/sync`) — Electric collection factories, the per-app collection sets (`collections/*`), API write handlers, `fetchShapeSnapshot`, and the shared route paths (`@mcmec/sync/routes`)
- **domain** (`packages/domain`) — the command vocabulary: what a write is called, what payload it takes and which permission it needs. Defines only; `apps/api` implements the handlers
- **auth** (`packages/auth`) — Better Auth client, `signIn`/`signOut`, `verifyClaims`
- **typescript-config** (`packages/typescript-config`) — Shared TS configs (base, react-library, tanstack-start)

## Common Commands

```bash
# Install dependencies
pnpm install

# Run all dev servers (Vite/API upstreams only — run `caddy run` separately
# in another terminal for the https browse ports; see "Dev ports" above)
pnpm dev

# Run a single app dev server
pnpm --filter central dev
pnpm --filter website-management dev
pnpm --filter public dev

# Build all apps
pnpm build

# Build a single app
pnpm turbo run build --filter=central

# Type checking
pnpm check-types

# Lint (Biome)
pnpm lint

# Run tests — @mcmec/auth, @mcmec/lib, @mcmec/schemas and api each have a suite
pnpm --filter @mcmec/schemas test        # watch mode
pnpm --filter @mcmec/schemas test:run     # single run
pnpm --filter api test:run                # any of the four, same scripts —
                                          # api needs a Postgres, see apps/api/README.md

# Changesets (versioning)
pnpm changeset
pnpm version-pkgs
```

## Tech Stack

- **React 19** with strict TypeScript
- **TanStack Router** (file-based routing) for all apps; **TanStack Start** for SSR in public app
- **TanStack Query** for server state, **TanStack Form** for form management, **TanStack Table** for data tables
- **Railway** backend — Postgres + ElectricSQL behind the `api` service (Hono); **Better Auth** for sessions, **Drizzle** for schema and migrations
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin
- **Radix UI** primitives for accessible components
- **Biome** for linting and formatting (no ESLint/Prettier)
- **Vite 7** for bundling; **Nitro** for SSR server in public app
- **Vitest** for unit tests
- **Zod v4** for schema validation

## Architecture Notes

- Apps import shared packages via workspace protocol (`@mcmec/ui`, `@mcmec/lib`, `@mcmec/schemas`)
- `central` and `website-management` are client-side SPAs; `public` is SSR with TanStack Start outputting to `.output/public/`
- Shared brand images live in `apps/api/assets/` and are served by the `api` service at `/assets/*`; apps reference them through `@mcmec/lib/constants/assets`
- Route trees are auto-generated by TanStack Router plugin (`routeTree.gen.ts` — do not edit)
- The database schema is owned by Drizzle in `apps/api/src/db/schema.ts`, with migrations generated into `apps/api/drizzle/` — do not hand-edit generated migrations
- The `packages/ui/src/components/` directory contains generated shadcn-style components excluded from Biome linting

## Code Style & Formatting

- **Biome** is the sole linter/formatter — configured at repo root `biome.json`
- Lint from the repo root with `pnpm lint` — the same command CI runs. Biome walks the whole
  workspace in one pass, so there is deliberately no per-package `lint` script and no turbo
  `lint` task; a second path would only be a way for the two to disagree
- `pnpm lint:fix` (`biome check --write .`) is the root fix-up pass — it also applies formatting
  and the assist actions (import organization, attribute sorting) that `biome lint` only reads
  past. The pre-commit hook runs the same command over staged files
- Tab indentation, double quotes for JS/TS
- Tailwind CSS class sorting enforced (error severity)
- Import organization enforced automatically
- VSCode is configured for format-on-save with Biome

## Accessibility

The public app (`apps/public`) must be **WCAG 2.1 AA** compliant. When working on this app or on shared UI components used by it:
- Use semantic HTML elements (`nav`, `main`, `article`, `section`, etc.)
- Ensure all interactive elements are keyboard accessible
- Provide meaningful `alt` text for images and `aria-label`/`aria-labelledby` for non-text controls
- Maintain minimum color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Ensure form inputs have associated `<label>` elements
- Support screen readers — test with proper heading hierarchy and landmark regions

## Important: Production Monorepo

This monorepo is live in production. Exercise caution when editing code — prefer small, targeted changes and verify builds/types before committing.

## Development Workflow

All changes go through branches and pull requests — never commit directly to `main` or `develop`.

### Branching model
- **`main`** — production. Railway deploys and Drizzle migrations apply on merge.
- **`develop`** — staging. All feature branches merge here first.
- **Feature branches** — created from `develop` (e.g., `feat/contact-form`, `fix/auth-redirect`, `chore/update-deps`)

### Feature → develop → main flow
1. **Create a feature branch** from `develop`
2. **Make changes and commit** — pre-commit hooks auto-run Biome lint/format on staged files
3. **Add a changeset** if the PR affects app behavior: `pnpm change` — skip for CI/config-only changes
4. **Push and open a PR to `develop`** — the PR template pre-fills a checklist; auto-labeler tags the PR by affected area
5. **CI runs automatically** — lint, type-check, build, and tests must all pass
6. **Review, resolve conversations, and squash merge** into `develop`
7. **When ready to release**, run `pnpm release` on `develop` — see below
8. **Vercel deploys only affected apps** to production on merge to `main`

### Releasing (`develop` → `main`)

Run `pnpm release` on a clean, up-to-date `develop`. It consumes the pending changesets
(bumping versions and writing CHANGELOGs), commits `chore: version packages`, pushes, and opens
the promotion PR. `pnpm release --dry-run` prints the plan and changes nothing.

Do not open the `develop` → `main` PR by hand. CI enforces this: a PR into `main` fails if any
unconsumed changeset is still in `.changeset/`, because merging one would promote the code while
silently discarding its changelog. (The check is the mirror image on the other side — a PR into
`develop` fails if changed packages *lack* a changeset.)

The version commit has to land on `develop` rather than being added to the PR by a bot: the
`main` ruleset has no bypass actors, so nothing can push to it directly, and the PR's head branch
*is* `develop`. Pushing straight to `develop` works because that ruleset grants the Admin role a
bypass; without it, PR the version commit into `develop` first, then re-run.

### Preview deployments
Vercel preview deploys are **off by default** on all branches (including `develop`). To trigger one, include `[deploy-preview]` in a commit message.

### Staging deploys (Railway)

Railway's **staging** environment does *not* rebuild on every merge to `develop`. Each
`railway.json` has an `environments.staging` block watching one file, `deploy/staging-release.txt`,
so pushes to `develop` build nothing. When you are ready to browser-test, run `pnpm stage` on a
clean, up-to-date `develop` — it stamps that file, commits and pushes, and all six staging
services rebuild from the latest `develop`. `pnpm stage --dry-run` prints the plan.

Production is unaffected: `main` still deploys on every merge. See `docs/railway-deployment.md`.

### Database changes
- The schema lives in `apps/api/src/db/schema.ts`; migrations are generated into `apps/api/drizzle/`
- After changing the schema, generate a migration: `pnpm --filter api db:generate`
- `api`'s Railway start command is `pnpm --filter api db:migrate && pnpm --filter api start`, so **migrations auto-apply on deploy** — to `develop`'s staging database, and to production when merged to `main`
- Always apply and test a migration against staging before promoting to `main`

### CI checks on every PR
- **Lint, Types & Build** — `pnpm lint`, `pnpm check-types`, `pnpm build` — the same root scripts
  you run locally, so a deleted or broken root script fails CI instead of drifting silently
- **Tests** — `test:run` in `@mcmec/auth`, `@mcmec/lib`, `@mcmec/schemas` and `api` (the last
  against a Postgres service container)
- **Changeset check** — warns (non-blocking) if no changeset is included
- CI runs on PRs to both `develop` and `main`

### Branch protection
**`main`** (strict):
- PRs required — no direct pushes
- CI status checks must pass before merge
- Branches must be up to date before merge
- Force pushes blocked

**`develop`** (relaxed):
- PRs required — no direct pushes
- CI status checks must pass before merge
- Force pushes allowed
- Branches do not need to be up to date

## Deployment

All apps deploy to **Vercel** with Turborepo filtering:
- `central` and `website-management`: SPA output to `dist/`, rewrites `/* → /index.html`
- `public`: SSR output to `.output/public/`, has strict CSP headers and Cloudflare Turnstile integration

## Environment Variables

Required (set via `.env` files per app — see each app's `.env.example`):
- `VITE_API_URL` — admin, central, hr, website-management; the `api` origin they read shapes and write data through
- `VITE_APP_NAME`, `VITE_DOMAIN_NAME` — central app
- `VITE_CLOUDFLARE_TURNSTILE_SITEKEY` — public app
- `API_URL` — public app; it reaches the api server-side only, so this is not a `VITE_` var (stays plain http in local dev)

Server-side, on the `api` service only:
- `DATABASE_URL`, `MIGRATION_DATABASE_URL` — Postgres (pooled / direct)
- `ELECTRIC_URL`, `ELECTRIC_SECRET` — the ElectricSQL service the shape proxy fronts
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `TRUSTED_ORIGINS`, `COOKIE_DOMAIN`, `COOKIE_PREFIX`, `AUTH_RESET_URL`
- `RESEND_API_KEY`, `EMAIL_FROM` — invite + password-reset mail
- `CLOUDFLARE_TURNSTILE_SECRETKEY` — public intake verification

## Agent skills

### Issue tracker

Issues live as GitHub issues in `thebigthing313/mcmec-apps`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one root `CONTEXT.md` plus `docs/adr/`, created lazily. See `docs/agents/domain.md`.

<!-- intent-skills:start -->
## TanStack DB Skill Mappings

When working in these areas, load the linked skill file into context.

skills:
  - task: "Creating or configuring TanStack DB collections (eager, on-demand, collection setup)"
    load: "node_modules/@tanstack/db/skills/db-core/collection-setup/SKILL.md"
  - task: "Writing live queries (from, where, join, select, groupBy, orderBy, operators)"
    load: "node_modules/@tanstack/db/skills/db-core/live-queries/SKILL.md"
  - task: "Optimistic mutations (insert, update, delete, transactions, createOptimisticAction)"
    load: "node_modules/@tanstack/db/skills/db-core/mutations-optimistic/SKILL.md"
  - task: "Integrating TanStack DB with route loaders and meta-frameworks (preloading, SSR caveats)"
    load: "node_modules/@tanstack/db/skills/meta-framework/SKILL.md"
  - task: "Building custom collection adapters or understanding sync internals"
    load: "node_modules/@tanstack/db/skills/db-core/custom-adapter/SKILL.md"
<!-- intent-skills:end -->
