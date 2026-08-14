---
"@mcmec/collections": major
"@mcmec/schemas": major
"website-management": patch
"central": patch
"public": patch
"admin": patch
"hr": patch
"@mcmec/ui": patch
---

Remove the last Supabase references now that production runs on Railway.

**Renamed two packages.** Neither contained Supabase code any more, so the names were
actively misleading — a reader could reasonably assume `@mcmec/supabase` was a Supabase
client:

- `@mcmec/supabase` → **`@mcmec/schemas`** — Zod row/insert/update schemas (`db/*`) and the
  per-app TanStack DB collection factories (`collections/*`)
- `@mcmec/supabase-tanstack-db-integration` → **`@mcmec/collections`** — Electric collection
  factories, API write handlers, `fetchShapeSnapshot`

The directories moved to `packages/schemas` and `packages/collections` to match. Every
import site, `exports` map, and tsconfig path alias was updated; no runtime behavior changes.

**Deleted dead code.** `@mcmec/schemas` drops the Supabase-generated `Database` type
(`src/database.types.ts`), the `Table`/`View`/`Row`/`InsertRow`/`UpdateRow` helpers derived
from it (`src/data-types.ts`), the `./database.types` export, and the `Database` re-export
from the barrel. Their last consumers were `public`'s Supabase clients, deleted during the
Phase 4 wiring.

**Removed the root `supabase/` directory** — config, migrations, schemas, seeds, scripts, and
the dead `invite-employee` edge function (replaced by `POST /api/invite`). The schema is
owned by Drizzle in `apps/api/src/db/schema.ts` with migrations in `apps/api/drizzle/`. The
root `gen-types` and `gen-seed` scripts that drove it are gone too.

**Stray references.** `admin` drops its unused `@supabase/supabase-js` and
`@tanstack/query-db-collection` dependencies, and the root `pnpm.overrides` pins for both are
removed. `@mcmec/collections`' README and docs described a Supabase PostgREST API that no
longer exists (`fetchRows`, `selectAndParse`, predicate pushdown, a `supabase` client option)
— rewritten against the Electric + data-API surface the package actually exports. The
Playwright auth setup signed in through the local Supabase API and wrote an `sb-*-auth-token`
localStorage key; it now drives the HR login form and saves the Better Auth session cookie.
`@mcmec/ui`'s layout README referenced a `signOut` export that moved to `@mcmec/auth`.
