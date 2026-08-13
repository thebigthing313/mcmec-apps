# api

## 0.1.0

### Minor Changes

- d1cc9c7: Serve the shared brand images from Railway instead of Supabase Storage. This removes the last runtime dependency on Supabase in the frontends.

  **api** — the nine images (logos, favicon, hero, the 404 illustration) are committed to `apps/api/assets/` and served at `/assets/<filename>` with `Cache-Control: public, max-age=31536000, immutable`, carried over byte-for-byte from what the Supabase upload set. `api` gets the job because it is the only always-on service present in both environments, which preserves the one thing the bucket was buying: a single canonical origin, so all six apps share one copy and one browser cache entry.

  The directory is read once at boot into memory (~2 MB). That keeps a caller-supplied path from ever reaching the filesystem, so traversal is unreachable by construction rather than by validation, and it makes a content-hash `ETag` free — a client that revalidates despite `immutable` gets a 304 instead of 2 MB. The route sits outside `/api/*` and so outside the CORS middleware, deliberately: `<img>` and `<link rel="icon">` loads are not CORS-gated.

  **@mcmec/lib** — `constants/assets` now points at the API origin. It stays hardcoded to production in every environment, including local dev: the bytes are identical everywhere, so this gives one shared cache and adds no build variable a service could be provisioned without — and `public` could not read such a variable anyway, since its API origin is deliberately server-side only.

  Because the filenames are unversioned and served `immutable`, changing an image now requires a **new filename** in both `apps/api/assets/` and `constants/assets`. Overwriting in place will look correct on a fresh browser and stay stale for a year on every returning one.

  **public** — `img-src` drops `https://*.supabase.co` for the API origin, completing the CSP cleanup Phase 4 left open.

  Also removed `scripts/upload-assets-to-storage.ts`, which was the only writer to the bucket. Publishing an image is now a commit.

- 76ce7e8: Run pending migrations automatically on deploy.

  The Railway start command is now `db:migrate && start`, so a merge to `develop` (staging) or `main` (production) applies any new migration before the server boots. `drizzle-kit` moved into `dependencies` so it survives the production install.

  Migrations run as the table owner via a new **`MIGRATION_DATABASE_URL`** service variable — the app's own `DATABASE_URL` is the least-privilege `app_rw` role, which has no DDL rights by design. **This variable must be set on each Railway environment before a deploy carrying a new migration**; without it the migrate step fails, the server never starts, and the previous deployment keeps serving.

  That fail-closed behavior is the point: a broken migration takes the deploy down rather than starting the app against a half-migrated database, and because everything reaches production through `develop`/staging first, a schema break surfaces there.

  Note that `drizzle-kit` auto-loads `apps/api/.env`, so running `db:migrate` locally without `MIGRATION_DATABASE_URL` aims at whatever that file points to. The config warns when it falls back.

- 8f44082: Add the Railway backend API (`apps/api`): a Hono server hosting Better Auth, the ElectricSQL shape auth-proxy, permission-gated write endpoints, public form intake, and employee invites — the self-hosted replacement for the Supabase backend.
- 76ce7e8: Railway migration Phase 4 — rewire the `website-management` app to the new backend.

  **website-management** — auth moves to the Better Auth cookie client, with the app self-hosting its own `/login` and the `(app)` guard verifying `manage_website` (renamed from `public_notices`). All content reads stream from ElectricSQL collections and writes go through the Hono API.

  The four public-intake surfaces (adult mosquito, mosquitofish, water management, contact submissions) collapse into **one "Public Requests" section** backed by the merged `public_requests` table, with request-type and status filters, a triage view that renders each type's `details` generically, and delete. Staff-entered requests are gone: the backend accepts submissions only from the public site's Turnstile-gated intake endpoint, so the four staff create-forms were removed along with the per-type tables and edit forms.

  Spray-schedule municipality links now go through the API's junction endpoints, and the weekly-activity CSV upload posts to the bulk import endpoint — which replaces only the years present in the file instead of wiping the whole dataset, so the confirmation copy changed to match. Audit columns (`created_by`/`updated_by`) are gone from every form and the "Creator" column was dropped from the notices and documents tables. Requires `VITE_API_URL`.

  **@mcmec/supabase** — the notices collection factory gained an on-demand `mosquitoActivityData` collection so the weekly-activity charts read live instead of paging through PostgREST.

  **api** — new `GET /api/spray-schedules/municipalities` (gated `manage_website`) returning the junction rows. The junction has a composite primary key and no `id`, so it can't be an Electric collection; this is its read path.

- 76ce7e8: Give `spray_schedule_municipalities` a surrogate `id` so the junction can sync as a collection.

  **api** — migration `0003` drops the composite primary key, adds `id uuid primary key default gen_random_uuid()`, and keeps the pair unique via `spray_schedule_municipalities_pair_key`. Existing rows keep their pairs and pick up generated ids. Writes still go through `PUT /api/spray-schedules/:id/municipalities` — replacing a schedule's whole set is one transaction, not a series of row writes — but the short-lived `GET /api/spray-schedules/municipalities` added alongside it is gone, since clients now read the junction from its Electric shape.

  **@mcmec/supabase** — new `SprayScheduleMunicipalitiesRowSchema` and a read-only `sprayScheduleMunicipalities` collection in the notices factory.

  **website-management** — the spray-schedule screens read municipality links from the collection instead of polling an endpoint, so a municipality write syncs back on its own with no query invalidation.

### Patch Changes

- 76ce7e8: Fix `manage_users` being unable to list users.

  The admin app's Manage Permissions screen sat on "Loading users…" while `admin/list-users` returned 403. Our access control declared only the custom `website`/`employees`/`users` statements, but the admin plugin authorizes its own routes against its `user`/`session` statements — so a role built purely from our statements could never satisfy them. `adminRoles` doesn't cover this; the plugin's permission check never consults it.

  `defaultStatements` is now spread into the access control, and `manage_users` grants `user: ["list", "get"]` — only what the app calls, since role writes go through our own audited endpoint rather than the plugin's `set-role`.

- 4999432: Env-gate the Better Auth cross-subdomain cookie so local development works. When `COOKIE_DOMAIN` is set (production) the API keeps issuing a `.middlesexmosquito.org` cross-subdomain SSO cookie; when it's unset (local dev) the API now falls back to a host-only `localhost` cookie — every localhost port shares it, giving the same cross-app SSO in dev without a shared parent domain. Production behavior is unchanged. The `dev` script also loads `apps/api/.env` via `tsx --env-file-if-exists`.
- 76ce7e8: Accept timestamps on the generic write endpoints.

  `makeCrud` derives its validators from drizzle-zod, which types every `timestamp` column as `z.date()` and so demands a real JS `Date`. A JSON request body can only ever carry a string, so every write touching such a column was rejected with a 422 — `meetings.meeting_at` is `notNull`, which made meetings entirely uncreatable and uneditable through the UI, and `job_postings.published_at` had the same hole whenever it was set.

  `POST`/`PATCH /api/data/:table` now convert incoming ISO strings back to `Date` for exactly the columns drizzle reports as `dataType: "date"`, so the coercion tracks the schema instead of a hand-kept list. Columns declared in `string` mode (`notices.notice_date`, `spray_schedules.mission_date`) report `"string"` and are left untouched. An empty string is passed through unchanged so it fails as a missing value rather than as an Invalid Date.

- 8ed561d: Make the frontends deployable on Railway.

  Vercel supplied two things these apps silently depended on: a static file server with an SPA
  rewrite, and a build pipeline that knew which app it was building. A Railway service supplies
  neither — it gives you a container and runs your start command. Nothing here could boot.

  **Static serving.** The four SPAs gain `sirv-cli` as a runtime dependency and a start script,
  `sirv dist --single --etag --host 0.0.0.0`. `--single` restores the SPA fallback, without which
  every deep link 404s on refresh. `--host 0.0.0.0` is not optional: `sirv-cli` defaults `--host`
  to `localhost`, so the container would bind loopback and Railway would return 502 with the
  process apparently healthy. It is a regular dependency rather than a devDependency because the
  production install prunes devDependencies.

  **`public`'s start script was broken.** It pointed at `dist/server/server.js` via a `pnpx srvx`
  invocation, but the build emits `.output/server/index.mjs` and `srvx` was never a dependency.
  `pnpm --filter public start` failed on any machine; nothing had run it, so it went unnoticed and
  would have failed on the first SSR deploy. It is now `node .output/server/index.mjs`.

  **Per-service config.** Each app carries `apps/<app>/railway.json` with its own build command,
  start command and watch patterns. This matters because the repo-root `railway.json` belongs to
  `api` and starts with `db:migrate` — any service rooted at the repo root without an explicit
  config path would read it and try to boot the API.

  **Cookie namespacing.** `COOKIE_PREFIX` now namespaces the session cookie. Staging hosts are
  siblings of production under the same parent domain, and the SSO cookie is scoped to that
  shared parent, so without distinct prefixes both environments write the same cookie name at
  the same scope: signing into staging would clobber a production session and vice versa, and
  each API would then receive the other environment's token and reject it. Left alone that
  presents as sporadic unexplained logouts rather than as an error. Unset falls back to Better
  Auth's default, which is correct for local dev.

  `docs/railway-deployment.md` records the topology, per-service settings, build-time variable
  rules, the domain and cookie table, and the dashboard-only steps.

- 76ce7e8: Railway migration Phase 3 — rewire the shared frontend packages to the new backend (breaking; apps are wired in Phase 4).

  **@mcmec/auth** — swap Supabase Auth for a Better Auth client. New `@mcmec/auth/client` factory (`makeAuthClient(baseURL)`); `signIn`/`signOut`/`verifyClaims` now take that client instead of a `SupabaseClient` and read `GET /api/auth/get-session`. `handleCrossAppAuth` is a no-op (SSO is cookie-based now). Errors/types/subpaths unchanged.

  **@mcmec/supabase-tanstack-db-integration** (private) — reads now stream from the ElectricSQL shape proxy (`/api/shapes/:table`) via `@tanstack/electric-db-collection`; writes go through `POST/PATCH/DELETE /api/data/:table` (credentialed, snake_case→camelCase), returning the Postgres `txid` for optimistic reconciliation. PostgREST CRUD + predicate pushdown removed.

  **@mcmec/supabase** — collection factories now take `{ apiUrl }` instead of `{ supabase, queryClient }`; `./client` export removed. Schema deltas: audit columns (`created_by`/`updated_by`) dropped from the row schemas; the four intake tables collapse into one `public_requests` schema/collection; `permissions`/`user_permissions` removed (now Better Auth roles).

  **api** — the write endpoints (`/api/data/*`, `/api/users/:id/roles`, `/api/mosquito-activity/import`, `/api/spray-schedules/:id/municipalities`) now return the transaction `txid` so Electric collections can settle optimistic mutations.

- 76ce7e8: Let on-demand collections sync through the shape proxy.

  On-demand syncing sends `log=changes_only` plus `subset__where` / `subset__order_by` / `subset__params` to pull slices rather than whole tables, and the proxy forwarded only its sync-cursor allowlist. The dropped params didn't fail loudly — the collection simply synced nothing, so the 178-row public-requests table rendered as "0 of 0".

  The proxy now forwards `log` and any `subset__*` param. That's safe because Electric intersects a subset with the shape's own `where` instead of replacing it: verified against staging, a shape pinned to `status = 'resolved'` returned zero rows for `subset__where: status = 'new'` while such a row existed, and `subset__where: true = true` still returned only the resolved set. A client cannot reach rows the policy excludes.

  `public_requests` and `mosquito_activity_data` stay on-demand as intended — both only grow, and pulling them whole on every page load doesn't scale.
