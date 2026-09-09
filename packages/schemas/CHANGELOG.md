# @mcmec/schemas

## 3.0.0

### Major Changes

- ecb366f: Rename `@mcmec/collections` to `@mcmec/sync` and give it the per-app collection sets

  The package held the Electric collection factories and the write helpers, while the four
  per-app collection sets (`admin`, `central`, `hr`, `notices`) lived in `@mcmec/schemas` — so
  neither name described what it held, and `schemas` depended on `collections` to build them.

  - **`packages/collections` → `packages/sync`.** The shared builders move to `src/factories/`
    and `@mcmec/schemas/src/collections/*` moves in as `src/collections/*`, so an app now
    imports `@mcmec/sync/collections/notices` instead of `@mcmec/schemas/collections/notices`.
  - **`@mcmec/sync/routes` is a new export that imports nothing** — `COMMAND_PATH`,
    `shapePathFor` and `dataPathFor`, the URLs the client and the API agree on. Keeping it
    dependency-free is what lets the Hono server take the paths without the TanStack stack
    behind them. `crud.ts`, `snapshot.ts` and `electric-collection.ts` now derive their URLs
    from it rather than each spelling out its own template string.
  - **`@mcmec/schemas` is a pure Zod leaf.** With the collection sets gone it drops
    `@mcmec/collections`, `@tanstack/react-db`, `@tanstack/react-query` and
    `@tanstack/query-core` — all four unused by the `db/*` schemas — leaving `zod` and
    `@mcmec/lib`. Its tsconfig drops the React preset with them, its dead `src/index.ts` barrel
    (unreachable through the `exports` map, imported by nobody) is deleted, and the
    `./collections/*` export goes with the files. The dependency cycle between the two packages
    is gone: `sync` depends on `schemas`, and `schemas` on nothing of ours but `lib`.
  - `admin`, `central` and `hr` drop their direct `@mcmec/schemas` dependency — they only ever
    reached it for the collection sets.

  `zod` is pinned to 4.3.5 for the v4 range in the root `pnpm.overrides`. Splitting the
  collection sets into a package of their own gave them a second, freshly-resolved zod (4.4.3)
  whose `ZodType` is structurally incompatible with 4.3.5's, which broke the schema arguments
  to the collection factories at the type level. The override is scoped `zod@^4` so the v3 that
  `@tanstack/router-generator` needs is left alone.

  No runtime behaviour changes. `crud.ts` and the Insert/Update schema pairs stay — they still
  serve the tables that have not cut over to named commands.

- 5548a61: Delete the generic write path

  The cutover's last removal. `apps/api/src/data.ts` and `packages/sync/src/crud.ts` are gone,
  along with `POST`/`PATCH`/`DELETE /api/data/:table`, `stripServerCols`, `coerceDates`,
  `toCamelCaseKeys`/`snakeToCamel`, `dataPathFor`, and the `drizzle-zod` dependency they were the
  last consumer of. `POST /api/commands` is now the only write route in the system.

  **`WRITABLE` was already empty**, checked before deleting rather than after: every slice removed
  its own entry as it landed, so the map reading zero is what said the file was a shell. Nothing
  routed through any of this — the three doors had been returning 404 since #165 — so the diff is
  subtraction, not migration.

  **A collection with no commands now has no write handlers at all.** `WriteMode` collapses to one
  branch: `commands: true` stays compulsory-or-forbidden against the vocabulary (#174), but the
  branch it used to exclude — `insertSchema` / `updateSchema` / `allowDelete` — has nowhere to go,
  so read-only is spelled by the absence of `commands` and there is no second path left to forget
  to close. The type earns its place differently than it did: a missing flag was a table on the old
  door, and is now a collection that cannot be written.

  **`@mcmec/schemas` keeps only its Row schemas.** Every `*InsertSchema` / `*UpdateSchema` pair is
  deleted — none was picked from by a command payload, because a payload is not a row minus the
  server columns. That is what makes the package a leaf.

  **One of them was still live, and had drifted.** The weekly-activity CSV screen validated each
  parsed row against `MosquitoActivityDataInsertSchema` — a second spelling of a rule the command
  already owns, which by then demanded an `id` the screen minted and `importMosquitoActivity` has
  no place for. It now checks `mosquitoActivity.MosquitoImportRow`, newly exported from
  `@mcmec/domain`, so a row this screen accepts is a row the server accepts. No behaviour change on
  a valid file; a malformed one is refused by the same schema at both ends.

  **`COMMANDED_TABLES` goes too.** #174 built the runtime set for one reader — the boot assertion
  that refused a `WRITABLE` entry for a commanded table. With `WRITABLE` deleted there is nothing
  to assert against, and the type half (`CommandedTable`) carries the guarantee alone.

  `packages/sync`'s README and `COLLECTIONS.md` taught the retired shape throughout and are
  rewritten; `docs/CRUD.md` documented a deleted module and is deleted. Two doc-comments that
  described the boot assertion and named `data.ts`/`users.ts` as live examples are corrected.

  Not browser-verified — that is deferred wholesale to the end-of-cutover pass.

- 3960d61: Remove the last Supabase references now that production runs on Railway.

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

- 66e8715: Let residents type the zip code instead of picking it

  The three service request forms asked for the zip code through a combobox over the serviced
  zip codes, holding the row id directly. That put a custom listbox in the postal-code slot of a
  form the browser is already autofilling — name, street, city — so autofill and the dropdown
  fought each other on the one field where the browser had the answer ready.

  The field is now a plain `autocomplete="postal-code"` input. The route resolves the five digits
  to a `zip_codes` row on submit, and a validator checks the code against that same list as it is
  typed: `zip_codes` is not a reference list of New Jersey, it is the Commission's service area,
  so a code that isn't in it isn't a typo to correct — it is an address we don't service, and the
  form now says so in words rather than leaving the resident hunting for an option that was never
  in the list. The city beside it is still derived from the code, and a matched code fills it in
  as confirmation that the right one was typed.

  `TextField` forwards `inputMode` and `maxLength` so the field brings up a numeric keypad and
  stops at five digits.

  Breaking, for `@mcmec/schemas` only: the shared contact form schema holds `zip_code` (five
  digits) where it held `zip_code_id` (uuid), so `AdultMosquitoFormType`, `WaterManagementFormType`
  and `MosquitoFishFormType` all change shape, and `toContactPayload` takes the resolved row id as
  a required second argument. Every consumer is in this repo and moves with it. The submission
  payload the api parses is untouched, so nothing on the api or website-management side changes.

### Minor Changes

- 1b5e787: Derive a collection's write path from the command vocabulary, so a cut-over table's two halves cannot disagree.

  A command definition now carries the table it is about, bound once per module via `defineDomain(...).table(...)`. `packages/sync` keys its collection options off that union: a commanded table must declare `commands: true` and may carry no Insert/Update schema, and an uncommanded one may not declare it — checked at the call site, with the vocabulary imported type-only so no app pays for it at runtime. `apps/api` refuses at boot to serve a generic write door for a table that has commands. Table names come from a new `@mcmec/schemas/tables` union rather than being free strings.

- 3dd1ec0: Public request triage writes through named domain commands

  Four commands — `website.submitPublicRequest`, `website.resolveRequest`, `website.reopenRequest`,
  `website.deleteRequest` — and the slice that makes the vocabulary carry the one fact it had so far
  only been able to gesture at: who may send a command when the answer is "anybody".

  `submitPublicRequest` is the only command in forty-five with a **null permission**. A request is
  filed by a member of the public holding no permission at all, and what stands in for one is
  Turnstile and a honeypot. Those guard the _door_ — a request arriving from a browser with no
  session — not the command, so `POST /api/requests` stays while the other three bespoke doors
  folded into the dispatcher and were deleted. The handler is shared; the route is not. What is left
  on the route is the envelope, the honeypot, the Turnstile call and the id it mints so it can tell
  the submitter what was filed. The insert, the transaction and the audit GUCs are the same handler
  the staff commands run through.

  **The boot assertion protecting that split had the wrong shape, and this is the slice that shows
  it.** `dispatch.ts` asserted that the vocabulary contained no null-permission command at all —
  correct for as long as none existed, and a flat contradiction of the design the moment one did.
  The invariant worth protecting is a property of the _route_: `/api/commands` never serves a public
  command. So the check became a derivation. The dispatcher builds its served set from the
  vocabulary, a public command is simply not in it, and an intent naming one is refused the same way
  a misspelled one is. There is nothing left to assert because there is nothing left to leak.
  Filtering is right here in a way it was not for `WRITABLE`, whose entries are cutover debris a
  slice is supposed to delete: the null-permission set is a permanent fact, not a shrinking to-do
  list.

  `permission` is now carried in the _type_, not only in the value, which is what makes the seam
  honest at both ends. `CommandHandler` reads it the way it reads `targetless`: a public command's
  handler is typed `session: null`, and a permissioned one still cannot be handed one. The
  alternative — widening `session` to `SessionInfo | null` for all forty-five — would have made every
  `manage_website` handler narrow a null it can never be given. The dispatcher's permission check
  stops testing truthiness for the same reason, since everything it serves names a permission.

  **`WRITABLE.public_requests` is deleted, and `insertable` goes with it.** It was the map's only
  `insertable: false`, and the cleanest example in this effort of a bespoke boolean becoming a
  vocabulary fact: the generic door had to be told, per table, that one of its three verbs was off,
  with no way to say why or where the insert had gone instead. `WRITABLE` is down to one entry.

  **The intake contract stops being written twice.** The per-type discriminated union lived in
  `apps/api/src/requests.ts` as the authority and in `@mcmec/schemas` as "the client's copy of it",
  under a comment asking whoever changed one to remember the other. The schemas package's copy is now
  the command's payload, imported by the definition and parsed by the API — one spelling, and the
  public app already validates against it before forwarding. The collection's Update schema is
  deleted too: it declared contact corrections that no screen has ever offered and no command names.

  On the screen, the status `<Select>` becomes one button per legal transition (ADR 0001), and Delete
  moves into the danger zone card. That drops `in_progress`, which the dropdown had been offering as
  a third equal choice and `CONTEXT.md` explicitly rejects — a request is either New or Resolved. No
  command mints it; the enum value stays for rows that may already hold one, and Resolve accepts a
  request in any state. #134's declined transition ordering stays declined: the server resolves or
  reopens whatever it finds.

  An anonymous submission now logs `audit_log.command = 'website.submitPublicRequest'` against a null
  actor, where it used to log a null command like every other generic write. `setActor` takes a
  nullable session for that one case, stamping the request's IP and id either way.

- 2aefe19: Spray missions write through named domain commands

  **This slice fixes a live non-atomicity.** Saving a mission used to be two HTTP writes behind
  one button — the schedule through the generic CRUD door, then a full-replace `PUT` of its
  municipality set — with nothing to undo the first if the second failed. A failed junction write
  left a committed mission covering no municipalities, and the user a success toast. Both tables
  now move inside one Postgres transaction, so they land together or roll back together.

  Seven commands — `createSprayMission`, `updateSprayMissionDetails`, `cancelSprayMission`,
  `completeSprayMission`, `delaySprayMission`, `rescheduleSprayMission`, `deleteSprayMission` —
  defined in `@mcmec/domain`, implemented in `apps/api/src/commands/website/spray-missions.ts`.
  `spray_schedules` leaves `WRITABLE`, and `PUT /api/spray-schedules/:id/municipalities` is deleted
  with its module: its full-replace logic is now a command handler, minus the transaction and the
  permission check the dispatcher already owns.

  `municipality_ids` is not a column of `spray_schedules`, so it cannot ride in `mutation.changes`
  like every other field. It travels in the `arguments` metadata channel and is flattened into the
  same envelope. One consequence has no analogue in the earlier slices: a save that changes nothing
  but the municipality set leaves the mission row identical, which TanStack DB treats as a no-op
  and never hands to a collection handler — so that one case posts its command directly through
  `sendCommand` instead. Both paths post the same envelope to the same route.

  The status dropdown becomes four buttons (ADR 0001). A `<Select>` of all four states could not
  say that completing a mission is terminal, or that a cancelled one can be put back; the buttons
  a screen offers now follow the glossary's own account of where a mission can go from where it
  is. Spray missions gain the read-only detail page ADR 0001 requires, with the form moving to
  `$sprayScheduleId_.edit.tsx` and Delete moving into a danger zone card. The create screen no
  longer offers a status at all — a mission is born scheduled.

  Two behaviour changes ride along. A mission's dates are stored as dates rather than as instants:
  `mission_date` and `rain_date` are `date` columns in string mode, so nothing downstream coerces
  them and the payload schema truncates them — the column class that silently disarmed the notices
  retention rule. And the edit form now sends only the fields that actually changed, against the
  live row.

  Three rules stay unenforced and are not invented here: `end_time > start_time`, a rain date being
  required on a delayed mission, and any ordering between statuses. The server accepts any
  transition from any state.

### Patch Changes

- 32de0ba: Upgrade the TanStack DB stack to its current generation.

  - `@tanstack/db` 0.5.33 → **0.8.3**
  - `@tanstack/react-db` 0.1.61 → **0.3.3**
  - `@tanstack/electric-db-collection` 0.2.41 → **0.4.3**

  The three packages pin `@tanstack/db` as a hard dependency rather than a peer, so they move
  as one generation; the root `pnpm.overrides` pin moves with them. No source changes were
  needed — type-check, lint, build and the schemas test suite all pass against the new
  versions untouched.

  **The code paths our Electric collection depends on are unchanged.**
  `mergePendingMutations` is byte-identical (mutation metadata still merges last-write-wins
  via `incoming.metadata ?? existing.metadata`, still replacing the object whole), the
  `subscriberCount` getter is identical, and `awaitTxId` still defaults to 5000 ms and still
  _rejects_ on timeout — which is what `settleTxids` in `electric-collection.ts` exists to
  swallow. `PendingMutation.metadata` is still typed `unknown`. Verified by diffing the
  installed sources, then by syncing a live shape and driving a mutation against the new
  versions.

  `@tanstack/electric-db-collection` 0.4.3 still fetches shapes over **GET** with the same
  query params and needs `@electric-sql/client ^1.5.15`, which the existing `^1.5.12` range
  already resolves to. The shape auth-proxy in `apps/api/src/shapes.ts` needs no change — the
  GET → POST migration its comments anticipate has not happened yet.

  **Two behavioural changes to know about.**

  _Virtual properties._ Rows read out of a collection now carry `$synced`, `$origin`, `$key`
  and `$collectionId`, and these survive both object spread and `JSON.stringify`. Mutation
  `changes` / `modified` / `original` are clean, so the existing write path is unaffected, and
  no call site currently spreads a row into a write body. Anything that starts building a
  write payload from a synced row must pick fields explicitly.

  _Auto-indexing._ `@tanstack/db` 0.6.0 changed `autoIndex` to default to `off`. We declare no
  explicit indexes, so live queries that were implicitly indexed now scan. Nothing was
  perceptibly slower in local testing; `mosquito_activity_data` is the collection to watch,
  since it is the only one that reaches five figures of rows.

- Updated dependencies [0e49037]
- Updated dependencies [62f332a]
- Updated dependencies [9b0ea3c]
- Updated dependencies [30bef37]
- Updated dependencies [9f288ec]
- Updated dependencies [30bef37]
- Updated dependencies [0e49037]
- Updated dependencies [d00dfe1]
- Updated dependencies [e6877ea]
- Updated dependencies [3b8822d]
- Updated dependencies [4515e79]
- Updated dependencies [8381e83]
- Updated dependencies [ab92401]
- Updated dependencies [0e49037]
- Updated dependencies [62f332a]
- Updated dependencies [efc7409]
- Updated dependencies [51aef15]
  - @mcmec/lib@0.10.0

## 2.0.1

### Patch Changes

- Updated dependencies [cae7305]
  - @mcmec/lib@0.9.1

## 2.0.0

### Major Changes

- 76ce7e8: Railway migration Phase 3 — rewire the shared frontend packages to the new backend (breaking; apps are wired in Phase 4).

  **@mcmec/auth** — swap Supabase Auth for a Better Auth client. New `@mcmec/auth/client` factory (`makeAuthClient(baseURL)`); `signIn`/`signOut`/`verifyClaims` now take that client instead of a `SupabaseClient` and read `GET /api/auth/get-session`. `handleCrossAppAuth` is a no-op (SSO is cookie-based now). Errors/types/subpaths unchanged.

  **@mcmec/supabase-tanstack-db-integration** (private) — reads now stream from the ElectricSQL shape proxy (`/api/shapes/:table`) via `@tanstack/electric-db-collection`; writes go through `POST/PATCH/DELETE /api/data/:table` (credentialed, snake_case→camelCase), returning the Postgres `txid` for optimistic reconciliation. PostgREST CRUD + predicate pushdown removed.

  **@mcmec/supabase** — collection factories now take `{ apiUrl }` instead of `{ supabase, queryClient }`; `./client` export removed. Schema deltas: audit columns (`created_by`/`updated_by`) dropped from the row schemas; the four intake tables collapse into one `public_requests` schema/collection; `permissions`/`user_permissions` removed (now Better Auth roles).

  **api** — the write endpoints (`/api/data/*`, `/api/users/:id/roles`, `/api/mosquito-activity/import`, `/api/spray-schedules/:id/municipalities`) now return the transaction `txid` so Electric collections can settle optimistic mutations.

### Minor Changes

- 76ce7e8: Railway migration Phase 4 — rewire the `public` site to the new backend. This completes the frontend migration.

  **public** — every read now comes from the API's ElectricSQL shape proxy instead of Supabase, and the four intake forms post to the merged public-requests endpoint.

  The site stays server-rendered: reads still run inside TanStack Start server functions, so the data is in the SSR response rather than waiting on a client fetch, and the exported `*QueryOptions` are unchanged — no route touched them. Reading anonymously also means the shape proxy applies the public policy server-side, so unpublished notices, documents, and job postings never reach the process. Spray schedules were a nested PostgREST select; shapes are per-table, so the four shapes are read in parallel and joined in the handler.

  The four submit functions collapse into one that forwards to `POST /api/requests`, which owns the honeypot, Turnstile verification, per-type validation and the insert. Forwarding server-side (rather than posting from the browser) keeps the site talking only to its own origin — no CORS, nothing added to the CSP — and the Turnstile secret now lives only in the API. The visitor's IP is passed through so Turnstile still scores the real client.

  Removed: both Supabase clients, the local Turnstile validator, and `@supabase/ssr` / `@supabase/supabase-js`. `connect-src https://*.supabase.co` is dropped from the CSP; `img-src` keeps it until the brand assets are rehosted. Needs `API_URL` server-side, and no longer needs the Supabase or Turnstile-secret variables.

  **@mcmec/supabase** — the public intake contract, shared by the site and mirroring what the API validates: a `requestType` discriminated union of submission payloads, plus the flat form schemas the site's fields bind to and a helper mapping the contact block into a payload.

  **@mcmec/supabase-tanstack-db-integration** — new `fetchShapeSnapshot`: a one-shot shape read for callers that want current rows rather than a live collection. It waits for the shape to report up-to-date, then aborts the stream so no long-poll outlives an SSR request, and applies the same parser the collections use so server and client rows agree.

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

- 76ce7e8: Let on-demand collections sync through the shape proxy.

  On-demand syncing sends `log=changes_only` plus `subset__where` / `subset__order_by` / `subset__params` to pull slices rather than whole tables, and the proxy forwarded only its sync-cursor allowlist. The dropped params didn't fail loudly — the collection simply synced nothing, so the 178-row public-requests table rendered as "0 of 0".

  The proxy now forwards `log` and any `subset__*` param. That's safe because Electric intersects a subset with the shape's own `where` instead of replacing it: verified against staging, a shape pinned to `status = 'resolved'` returned zero rows for `subset__where: status = 'new'` while such a row existed, and `subset__where: true = true` still returned only the resolved set. A client cannot reach rows the policy excludes.

  `public_requests` and `mosquito_activity_data` stay on-demand as intended — both only grow, and pulling them whole on every page load doesn't scale.

- Updated dependencies [cf2e2aa]
- Updated dependencies [d1cc9c7]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
  - @mcmec/lib@0.9.0
  - @mcmec/supabase-tanstack-db-integration@0.3.0

## 1.7.1

### Patch Changes

- c45311a: Simplify meeting documents into a single bundled link by dropping the `agenda_url` and `report_url` columns — the consolidated document now lives in `minutes_url`. Updates the notices form, the shared meetings table and mobile list, and the public meetings page to match. Also refreshes the public Job Opportunities page opener with MCMEC's mission and benefits.

## 1.7.0

### Minor Changes

- 74f924d: Add mosquito spray schedule feature with admin CRUD in notices app, public display with filters at /spray-schedule, new TimeField and MultiComboboxField UI components, and dashboard integration.
- d7980a2: Add weekly mosquito activity feature with CSV upload in notices app and recharts-powered visualization on the public site at /mosquito-surveillance/weekly-activity.

## 1.6.0

### Minor Changes

- b37462b: Add job postings feature with HR management CRUD and public careers pages

### Patch Changes

- Updated dependencies [b37462b]
  - @mcmec/lib@0.8.0

## 1.5.0

### Minor Changes

- 0f84145: Fix auth loop in admin/HR apps, improve public nav bar, and resolve various issues.
  - fix(admin,hr): use shared cookie storage client to fix cross-subdomain auth loop (#80)
  - feat(admin): add employee management (list, view, edit, delete, invite) (#69)
  - fix(public): replace NavigationMenu with Popover for click-based nav and correct positioning (#78, #33)
  - feat(public): move transparency page under /notices routes (#77)
  - fix(public): add img-src and connect-src for Supabase to CSP headers (#76)
  - fix(notices): rename "Categories" to "Notice Categories" in sidebar (#79)
  - feat(notices): add pending notices section to dashboard (#15)
  - fix(supabase): use z.coerce.date<Date>() for proper Date typing in all schemas (#65)
  - fix(ui): auto-prefix https:// on tiptap editor links (#5)
  - refactor: create collection factories in @mcmec/supabase for central, admin, and HR
  - fix: display real employee name/title in sidebar user button for all apps

## 1.4.0

### Minor Changes

- b9b91e2: Centralize login through central app with branded auth layout. PKCE flow with shared cookie domain for production, hash fragment tokens for local dev. Add processAuthRedirect and getCentralLoginUrl helpers.
- 1a77b67: Add documents system, archive search, and retention warning for LFN 2026-01 compliance

  - Add document_types and documents tables with RLS policies and admin CRUD in the notices app
  - Add Document Categories management page mirroring the existing notice categories pattern
  - Add public /transparency page displaying published documents grouped by type and fiscal year
  - Add text search filter to the notice archive feed (NoticeFeed component)
  - Add inline retention warning when archiving notices posted less than 7 days ago

- 8dc9b46: Migrate notices app to supabase-tanstack-db-integration via collection factory in @mcmec/supabase. Remove individual collection files, add unified db.ts with getDb()/useDb() singleton pattern. Remove fetch functions and SupabaseClient imports from schema files (pure Zod). Deduplicate supabase-js and react-router versions via pnpm overrides. Align supabase-js to ^2.100.1 across all packages.
- 5c3f9fd: Add service requests and contact submissions management to the notices app
  - Add on-demand collections for adult mosquito complaints, mosquitofish requests, water management requests, and contact form submissions
  - Add full CRUD routes for all 3 service request types and contact submissions with detail, edit, and create pages
  - Restyle dashboard with stat cards, pending requests, open submissions, recent notices, and meetings
  - Add mutation error toasts via TanStack DB isPersisted — only shown when server rejects and optimistic state rolls back
  - Fix useNotices join duplication bug causing cartesian products with employee left join
  - Fix on-demand collection queryKey prefix validation warnings
  - Replace table cell links with clickable rows using navigate

### Patch Changes

- Updated dependencies [b9b91e2]
- Updated dependencies [5c3f9fd]
  - @mcmec/lib@0.7.3
  - @mcmec/supabase-tanstack-db-integration@0.2.1

## 1.3.1

### Patch Changes

- 187f5d9: Add Admin app for managing user permission assignments. Add admin_rights permission. Add user_permissions audit fields and RLS policies. Update app registry with Admin app entry.
- Updated dependencies [187f5d9]
- Updated dependencies [95e01c3]
- Updated dependencies [501ef75]
  - @mcmec/lib@0.7.2

## 1.3.0

### Minor Changes

- 2affcd1: Replace user_profiles table with employees table. Employees table tracks all agency staff with optional auth user linkage. Rename profiles collection/accessor to employees across supabase package and notices app. Remove avatar_url field. Regenerated database types.
- 184752c: Remove old auth functions (claims, session, signIn, signOut) from @mcmec/supabase. Auth is now handled by the dedicated @mcmec/auth package.

### Patch Changes

- Updated dependencies [a8b88f5]
  - @mcmec/lib@0.7.1

## 1.2.0

### Minor Changes

- 43272a7: 🌐 Public Application (apps/public)
  New Features & Pages
  Service Request Forms: Added dedicated forms and submission logic for Adult Mosquito, Mosquitofish, and Water Management requests.
  Contact Experience: \* Launched a new "Contact Us" page with full form handling.
  Added a "Request Success" confirmation page.
  Updated the navigation bar with clear links to the new service and contact sections.
  Meetings & Notices: Added a new Meetings route and updated navigation links for easier access to public notice archives.
  Bot Protection: Integrated Cloudflare Turnstile and "honeypot" fields across all public forms to prevent spam submissions.

  Enhancements & UI
  Visual Polish: Improved the styling of GlassCard and GlassButton components for better responsiveness and visual hierarchy.
  Form Logic: \* Enhanced zip code handling with automatic city display.
  Integrated libphonenumber-js for robust phone number validation.
  Improved browser autofill support for AutoComplete and Phone components.
  Navigation: Streamlined layout consistency across all "About" and "Contact" sub-pages.

  Bug Fixes
  Corrected broken image paths for the company logo in the header, footer, and mobile navigation.
  Fixed relative pathing issues for the favicon and mission-page images.

  📝 Notices App (apps/notices)
  Form Enhancements
  Switch Controls: Updated SwitchField in both the Notice and Meeting forms with clearer labels and better orientation for true/false states.

  Developer Maintenance: Added linting overrides for environment variable interfaces.

  🛠 Shared Packages (packages/_)
  UI Components (packages/ui)
  New Components: Added CheckboxField, CheckboxInput, TextAreaField, and TextAreaInput.
  Refinements: _ Improved PhoneInput by removing unnecessary country code logic for a cleaner interface.
  Updated FieldLegend and FieldError components for more consistent typography and error visibility.
  The SubmitFormButton now intelligently disables itself based on the form's validation state.

  Database & Backend (packages/supabase & supabase/)
  Schema Updates: Implemented new tables and schemas for adult_mosquito_complaints, water_management_requests, mosquitofish_requests, and zip_codes.
  Security: \* Updated Row Level Security (RLS) policies to require specific public permissions for form insertions.
  Cleaned up unused database fields (e.g., location_of_concern) to streamline the data model.
  Validation: Centralized validation logic for emails and phone numbers to ensure data consistency across the stack.

  Utilities (packages/lib)
  Added standard error messages for invalid phone numbers and updated validation schemas to include phone-specific logic.

### Patch Changes

- Updated dependencies [43272a7]
  - @mcmec/lib@0.7.0

## 1.1.1

### Patch Changes

- Updated dependencies [43306d2]
  - @mcmec/lib@0.6.3

## 1.1.0

### Minor Changes

- 9dc254d: 🌐 Public App (apps/public)
  New "About" Content: Added comprehensive informational pages for Mission, Leadership & Staff, How We Control Mosquitoes, and Mosquito Control Products.
  Navigation Overhaul: Enhanced the navigation bar with descriptive sub-items, a new Home link, and improved mobile accessibility (ARIA attributes).
  Insecticide Directory: Integrated a public-facing view to browse commonly used mosquito control products.

  🔔 Notices App (apps/notices)
  Admin Management: Built a full management suite for insecticides, including Create, Edit, and Delete workflows with safety confirmations.
  Sidebar Integration: Added "Insecticides" to the primary navigation for quick access to data management.
  Data Forms: Implemented specialized forms for handling complex insecticide attributes and data entry.

  🏗️ UI Package (packages/ui)
  Insecticides Table: Created a reusable, high-performance table component featuring built-in sorting and pagination.
  Styling & Polish: Integrated the Tailwind CSS Typography plugin and refined navigation menu animations.

  🗄️ Supabase & Database (packages/supabase & supabase/)
  Database Schema: Designed and deployed the insecticides table with granular attributes and secure Row Level Security (RLS) policies.
  Migration: Streamlined the data structure by removing redundant columns to focus on specific product data.
  Type Safety: Generated updated database types and fetch functions to ensure full end-to-end type safety.

- 519868d: Public Meetings Dashboard: A new dedicated section for viewing and managing meeting data, accessible via the main navigation.
  Meeting Management Tools: Introduced streamlined forms and workflows to create, edit, and organize meeting details.
  Mobile-Optimized Views: Added a responsive interface including a new mobile-friendly list view for meetings on the go.
  Improved Date/Time Formatting: Meetings now display in localized formats with proper timezone support.
  Refined Navigation: Updated breadcrumbs and menus for more intuitive browsing.
  Stability Fixes: Improved error handling for missing records and resolved a display issue within text input fields.

### Patch Changes

- Updated dependencies [519868d]
  - @mcmec/lib@0.6.2

## 1.0.2

### Patch Changes

- Updated dependencies [d00a319]
- Updated dependencies [fb040ad]
  - @mcmec/lib@0.6.1

## 1.0.1

### Patch Changes

- Updated dependencies [3f9666d]
  - @mcmec/lib@0.6.0
