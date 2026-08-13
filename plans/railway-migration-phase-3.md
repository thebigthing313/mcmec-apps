# Railway Migration — Phase 3 Handoff (Frontend packages → new backend)

**Status when written:** Phases 0–2 complete. The new backend (`apps/api`) is built, deployed to
Railway, and **merged into `develop`** (PR #106, squash commit `8f44082`). Phase 3 = rewire the shared
frontend packages to talk to the new backend instead of Supabase. **Frontends still run entirely on
Supabase today — nothing in Phase 3 has been started.**

Full original plan: `C:\Users\adria\.claude\plans\i-want-to-migrate-transient-pudding.md` (Phase 3 + 4
sections). Running migration log/decisions: the `railway-backend-migration` auto-memory. This document is
the actionable, repo-grounded version for Phase 3.

---

## 0. The backend contract (what Phase 3 targets)

Everything below is already live. The frontend must be rewired to consume **only** these.

**Base URL:** `https://api-production-5479.up.railway.app` today (Railway-generated). Production will be
`https://api.middlesexmosquito.org` once DNS is set — the cross-subdomain SSO cookie **requires** the API to
be on `*.middlesexmosquito.org`. Introduce a single env var **`VITE_API_URL`** for this base (used for auth
+ shapes + writes).

| Concern | Endpoint | Notes |
|---|---|---|
| Auth (all) | `GET|POST /api/auth/*` | Better Auth handler. Sign-in/out, reset, session, admin plugin. |
| Session | `GET /api/auth/get-session` | Returns `{ user, session, employeeId, permissions }` (our `customSession`). Null if anon. |
| Reads | `GET /api/shapes/:table` | Electric shape **auth-proxy**. Server injects `table`/`where`/`columns` + secret; client may pass only `offset/handle/live/cursor/replica`. |
| Generic writes | `POST /api/data/:table`, `PATCH /api/data/:table/:id`, `DELETE /api/data/:table/:id` | Permission-gated, audit-logged. Zod-validated. Strips client `id`/timestamps. Body/`changes` use **camelCase** keys? **NO — see §4 "casing".** |
| Role assignment | `PUT /api/users/:id/roles` | `manage_users`. Body `{ roles: string[] }` (subset of `manage_website|manage_employees|manage_users`). |
| Mosquito CSV import | `POST /api/mosquito-activity/import` | `manage_website`. Body `{ rows: [...] }`, per-year replace. |
| Spray junction | `PUT /api/spray-schedules/:id/municipalities` | `manage_website`. Body `{ municipalityIds: string[] }`. |
| Public intake | `POST /api/requests` | Anonymous + honeypot + Turnstile. **One merged endpoint** (replaces the 4 submit fns). |
| Employee invite | `POST /api/invite` | `manage_employees`. |

Error contract: `401` unauthenticated, `403` forbidden, `404` unknown/`not found`, `405` insert-not-allowed,
`409`/`422` DB constraint violations, `422` Zod invalid.

**Permission (role) rename map — the apps still use the OLD names:**

| Old (Supabase) | New (Better Auth role) | Used by app |
|---|---|---|
| `public_notices` | **`manage_website`** | notices |
| `admin_rights` | **`manage_users`** | admin |
| `manage_employees` | `manage_employees` (unchanged) | hr |
| (none) | (none) | central (hub) |

Every `verifyClaims({ permission: "public_notices" })` etc. in the app route guards must be updated to the
new name (that's a Phase 4 app change, but keep the map handy — see `apps/*/src/routes/(app)/route.tsx`).

---

## 1. Packages to change (the Phase 3 surface)

Three shared packages sit between the apps and Supabase. The apps import them via subpath exports and
mostly **won't change** if we preserve those package signatures.

### 1a. `@mcmec/auth` — swap Supabase Auth for the Better Auth client

Current public surface (subpath exports the apps import — **keep these paths**):
- `@mcmec/auth/signIn` → `signIn({ email, password, client })` (uses `client.auth.signInWithPassword`)
- `@mcmec/auth/signOut` → `signOut({ client })`
- `@mcmec/auth/verifyClaims` → `verifyClaims({ client, permission? }) → Claims` (reads Supabase JWT
  `app_metadata`)
- `@mcmec/auth/handleCrossAppAuth` → `processAuthRedirect(client)` (dev-only hash-token handoff)
- `@mcmec/auth/errors` → `UnauthenticatedError | ForbiddenError | NotOnboardedError` (**keep as-is**)
- `@mcmec/auth/types` → `Claims { userId, userEmail, employeeId, permissions }` (**keep as-is**)

Work:
1. **Add a Better Auth client factory.** New export, e.g. `@mcmec/auth/client`:
   ```ts
   import { createAuthClient } from "better-auth/react";
   import { adminClient, customSessionClient } from "better-auth/client/plugins";
   import type { auth } from "@mcmec/api-types"; // or a shared type — see note below

   export function makeAuthClient(baseURL: string) {
     return createAuthClient({
       baseURL,                        // VITE_API_URL
       fetchOptions: { credentials: "include" }, // send the cross-subdomain cookie
       plugins: [adminClient(), customSessionClient<typeof auth>()],
     });
   }
   export type AuthClient = ReturnType<typeof makeAuthClient>;
   ```
   `customSessionClient<typeof auth>()` types `getSession()`'s data as our `{ user, session, employeeId,
   permissions }`. Getting `typeof auth` across the package boundary is the fiddly bit — either export the
   `auth` type from `apps/api` as a types-only package, or re-declare the session shape locally. Simplest:
   declare a local `SessionData` interface matching `apps/api/src/session.ts:SessionInfo` and cast.
2. **Rewrite `signIn`** → `authClient.signIn.email({ email, password })`; throw `UnauthenticatedError` on
   `error`. Keep the same `SignInInputSchema` validation.
3. **Rewrite `signOut`** → `authClient.signOut()`.
4. **Rewrite `verifyClaims`** → call `authClient.getSession()`; map to `Claims`:
   - `error || !data` → `UnauthenticatedError`
   - `data.employeeId == null` → `NotOnboardedError`
   - `permission && !data.permissions.includes(permission)` → `ForbiddenError`
   - else return `{ userId: data.user.id, userEmail: data.user.email, employeeId, permissions }`.
   Keep the `ClaimsSchema` parse. **Signature change:** it currently takes `{ client: SupabaseClient }`;
   change to `{ client: AuthClient }` (or a getter). The apps pass `supabase` today — that call site changes
   in Phase 4, so decide whether to keep the `{ client }` shape (recommended, minimal churn).
5. **`handleCrossAppAuth`/`processAuthRedirect`:** in prod the shared cookie on `.middlesexmosquito.org`
   makes this a **no-op** (Better Auth `crossSubDomainCookies` is already enabled server-side). Keep a
   **dev fallback** for localhost (different ports don't share cookies) — see §4 "cross-subdomain cookies".
6. Add `better-auth` as a dep of `@mcmec/auth`. Update `signIn.test.ts`/`verifyClaims.test.ts`/etc. (they
   mock a Supabase client today).

### 1b. `packages/supabase-tanstack-db-integration` — PostgREST → Electric + API writes

This is the seam Electric replaces. Files:
- `collections/create-eager-collection.ts` — `queryCollectionOptions({ queryFn: fetchRows(...) })`, `getKey`,
  Zod schema, `onInsert/onUpdate/onDelete` → `crud.ts` (`supabase.from().insert/update/delete`).
- `collections/create-on-demand-collection.ts` — same, on-demand mode + `predicate-parser.ts` pushdown.
- `crud.ts` — `fetchRows/insertRows/updateRow/deleteRows` via PostgREST (`MAX_INSERT_ROWS = 500`).

Work:
1. **Reads → Electric.** Replace `queryCollectionOptions` with `electricCollectionOptions`
   (`@tanstack/electric-db-collection`, **not yet installed — add it**):
   ```ts
   import { electricCollectionOptions } from "@tanstack/electric-db-collection";
   createCollection(electricCollectionOptions({
     schema,                                   // the @mcmec/supabase/db/* Zod schema (snake_case)
     shapeOptions: {
       url: `${apiUrl}/api/shapes/${table}`,
       fetchClient: (input, init) => fetch(input, { ...init, credentials: "include" }), // cookie auth
     },
     getKey: (row) => row.id,
     onInsert, onUpdate, onDelete,             // → API writes, see below
   }))
   ```
   The proxy sets `where`/`columns` server-side, so drop the on-demand `predicate-parser` pushdown for the
   server filter (keep any client-side live-query `where`). `eager` vs `on-demand` still applies (Electric
   supports `syncMode`).
2. **Writes → API endpoints.** `onInsert/onUpdate/onDelete` call `POST/PATCH/DELETE ${apiUrl}/api/data/
   ${table}` with `credentials: "include"`. Rework `crud.ts` from `supabase.from()` to `fetch`. Keep the
   500-row insert cap and Zod validation.
3. **⚠ Electric txid reconciliation (IMPORTANT — needs a small BACKEND change too).** For optimistic
   mutations to settle correctly, each write handler should return `{ txid }` and the backend must return
   the Postgres txid **from inside the same transaction as the write**. The API's write endpoints
   (`apps/api/src/data.ts`, `users.ts`, `mosquito.ts`, `spray-municipalities.ts`) currently return the row
   but **not** a txid. Add, inside each `db.transaction(...)`:
   ```ts
   const [{ txid }] = await tx.execute(
     sql`select pg_current_xact_id()::xid8::text as txid`
   ); // return this alongside the row
   ```
   Then the collection handler does `return { txid: Number(res.txid) }`. Without this, optimistic state
   falls back to timeout/refetch (works, but janky). **Decision to make:** wire txid now (cleaner) vs. defer
   and rely on shape refetch. Recommend wiring it — it's ~5 lines per endpoint. (See the collection-setup
   skill's "Electric txid queried outside mutation transaction" CRITICAL note.)

### 1c. `@mcmec/supabase` — remove the browser client, keep the schemas

Files:
- `client.ts` — `createClient()` + `cookieStorage` (cross-subdomain PKCE). **Remove** — auth is Better Auth
  now, data is Electric.
- `collections/{central,admin,hr,notices}.ts` — factories that build the app's collections. **Keep the
  return shape**; change the input from `{ supabase, queryClient }` to `{ apiUrl, queryClient, getAuthHeaders? }`
  (Electric needs the API base + cookie/credentials, not a SupabaseClient).
- `db/*.ts` — the hand-written **Zod schemas are the reusable runtime contract. Keep them** (they double as
  the Electric row schemas). Exceptions below.
- `data-types.ts`, `database.types.ts` — generated Supabase types. `database.types.ts` is only needed by the
  Supabase client typing; once that's gone, replace with Drizzle-introspected types or drop.

**Schema deltas (because the DB schema changed in Phase 1):**
- **Merged intake:** `adult_mosquito_complaints`, `contact_form_submissions`, `mosquito_fish_requests`,
  `water_management_requests` → **one `public_requests`** table (discriminated by `request_type`, per-type
  answers in `details jsonb`). The 4 old schemas + their 4 collections collapse into **one `publicRequests`
  collection**. `notices/collections/notices.ts` currently builds 4 on-demand collections for these — replace
  with one, and the notices UI filters by `request_type`.
- **Dropped:** `permissions`, `user_permissions` (→ Better Auth roles). Remove their schemas/usages.
- **New (admin-only, NOT synced to public):** `notice_postings` (proof-of-posting), `audit_log`. No public
  collection.
- Everything else (`notices`, `notice_types`, `meetings`, `insecticides`, `documents`, `document_types`,
  `municipalities`, `spray_schedules`, `spray_schedule_municipalities`, `zip_codes`, `job_postings`,
  `mosquito_activity_data`, `employees`) carries over. **Column names are snake_case in both the old Supabase
  schema and the new Drizzle DB**, and Electric streams snake_case — so the existing snake_case Zod schemas
  and the live-query field access (`eq(employee.user_id, userId)`) keep working. **Verify date/number
  coercion** in each schema tolerates Electric's string output (use `z.coerce`/`z.union([string,date])` where
  a transform exists — see the skill's "TInput superset of TOutput" note).

---

## 2. Type generation

`supabase gen types` (root `pnpm gen-types` → `packages/supabase/src/database.types.ts`) goes away. Replace
with **Drizzle introspection** off `apps/api/src/db/schema.ts` (it's already the source of truth) or drop the
generated `Database` type entirely once the Supabase client is removed. The `db/*` Zod schemas remain the
runtime contract regardless.

---

## 3. Recommended execution order

Prove the pattern on **one app end-to-end before touching the rest** — recommend **`notices`**: it exercises
eager collections, on-demand collections, permission gating, and the merged-intake change, so it surfaces
every integration issue.

1. `@mcmec/auth`: add the Better Auth client factory + rewrite `signIn/signOut/verifyClaims`; keep errors/
   types/subpaths. Green `@mcmec/auth` vitest.
2. `supabase-tanstack-db-integration`: add `@tanstack/electric-db-collection`; convert the two collection
   factories to Electric reads + API writes; add txid to the backend writes (§1b.3).
3. `@mcmec/supabase`: drop `client.ts`; convert `collections/notices.ts` to the new input shape + merged
   `publicRequests`; keep `db/*`.
4. **Phase 4 (app wiring, separate):** `apps/website-management` (renamed from `apps/notices`) — swap `supabase`/`queryClient` wiring for
   `VITE_API_URL` + the auth client; update the route guard permission name (`public_notices` →
   `manage_website`); update the intake UI to one `publicRequests` collection. Verify login→SSO, a gated
   write, live sync across two tabs.
5. Roll the proven pattern to `central`, `admin`, `hr`, then `public` (public has the SSR/SEO caveat — keep
   an SSR snapshot fetch server-side, then hydrate with client Electric; and repoint its 4 forms to the one
   `POST /api/requests`, update `apps/public/vercel.json` CSP to allow the API origin and drop `*.supabase.co`).

---

## 4. Cross-cutting gotchas (read before starting)

- **Casing on writes.** The generic `/api/data` endpoints validate with **drizzle-zod** `createInsertSchema`/
  `createUpdateSchema`, whose keys are the Drizzle **TS property names = camelCase** (e.g. `noticeTypeId`,
  `isPublished`, `zipCodeId`). But the **Electric shape output and the `@mcmec/supabase/db/*` Zod schemas are
  snake_case**. So reads are snake_case and writes expect camelCase. **Decision:** either (a) map
  snake→camel in the collection write handlers, or (b) give the API generic writes a snake_case-tolerant
  schema. Pick one and apply consistently. (The `public_requests` intake endpoint already takes a specific
  camelCase body.) **This is the most likely source of silent write failures — settle it up front.**
- **Cross-subdomain cookies.** Prod: Better Auth sets the session cookie on `.middlesexmosquito.org`
  (`COOKIE_DOMAIN`), so all `*.middlesexmosquito.org` apps + `api.middlesexmosquito.org` share it — SSO is a
  no-op handoff. **Requires** the custom domain (still pending DNS) and every app served over that parent.
  Dev: localhost ports don't share cookies → keep a dev fallback (token in URL hash like today's
  `processAuthRedirect`, or run everything behind one dev origin/proxy). All auth + shape + write fetches
  need `credentials: "include"`, and the API's CORS `origin` allowlist (`TRUSTED_ORIGINS`) + `credentials:true`
  must list each app origin (already wired server-side; verify the dev origins are in `TRUSTED_ORIGINS`).
- **Electric shape = complete server state.** Don't hand a shape a filtered `queryFn` — the proxy already
  narrows via server `where`. Client-side filtering stays in live-query `where()`.
- **`notice_postings` auto-write on publish is not implemented yet.** The table + read policy + append-only
  hardening exist, but nothing writes the proof-of-posting row when `notices.is_published` flips false→true.
  If the notices publish UX needs it, add it to the notices update path (API side).
- **Env vars.** Add `VITE_API_URL` to every app + `turbo.json` env; retire `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Keep `VITE_CLOUDFLARE_TURNSTILE_SITEKEY`.

---

## 5. Not Phase 3 (don't get pulled in)

- **Deploy-time DB steps** (already flagged): apply Drizzle migrations incl. `0002` (`employees.user_id`
  index) and re-apply `apps/api/src/db/triggers.sql` (adds `audit_users`, makes triggers replaceable).
- **Secrets:** user adds `RESEND_API_KEY` + `CLOUDFLARE_TURNSTILE_SECRETKEY` in the Railway dashboard.
- **Custom domain** `api.middlesexmosquito.org` (DNS CNAME) → then update `BETTER_AUTH_URL`.
- **CI rework:** `.github/workflows/ci.yml` still spins up Supabase for tests; rework once the packages no
  longer need it.
- **Asset rehost:** the brand assets in `packages/lib/src/constants/assets.ts` (Supabase Storage) — required
  before Supabase decommission, not for the auth/data cutover. (All DB `*_url` columns are external links,
  already fine.)
- **Data migration + production cutover = Phase 5** (repoint Vercel envs, `pg_dump` reference data, fresh
  invites for employees).

---

## 6. Quick file inventory (current, pre-Phase-3)

- Auth: `packages/auth/src/{signIn,signOut,verifyClaims,handleCrossAppAuth,errors,types}.ts` (+ `.test.ts`).
- Integration: `packages/supabase-tanstack-db-integration/src/{crud.ts,collections/create-eager-collection.ts,
  collections/create-on-demand-collection.ts,collections/predicate-parser.ts,index.ts}`.
- Supabase pkg: `packages/supabase/src/{client.ts,data-types.ts,database.types.ts,collections/{central,admin,
  hr,notices}.ts,db/*.ts}`.
- App consumption (Phase 4): `apps/{notices,central,admin,hr}/src/routes/(app)/route.tsx` (guards),
  `apps/*/src/lib/{db.ts,queryClient.ts}` (wiring). Public: `apps/public/src/lib/{queries.ts,submit-*.ts,
  supabase-*.ts,validate-turnstile.server.ts}` + `apps/public/vercel.json` (CSP).
- Backend (target, do not rebuild): `apps/api/src/{app,auth,session,shapes,data,requests,invite,users,
  mosquito,spray-municipalities,email,actor,db-errors}.ts`, `apps/api/src/db/{schema,triggers.sql,index}.ts`.
