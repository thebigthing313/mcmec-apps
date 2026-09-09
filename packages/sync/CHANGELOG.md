# @mcmec/sync

## 1.0.0

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

- 229923c: Job Postings authoring moves from `hr` to `website-management`, on named commands

  **Who can do this changes.** A job posting is content published to the public website, so
  #134 put `job_postings` in the `website` domain, where its commands inherit `manage_website`.
  Authoring it from `apps/hr` — an app gated end to end on `manage_employees` — would have made
  every save a 403. A per-command permission override was considered and rejected: job postings
  are not an exception to website ownership, the screens were simply in the wrong app. So the
  screens moved.

  An HR-only user loses access to job postings entirely, including the ability to read drafts
  and closed postings. A website-manager gains it. The public careers page is unchanged — it
  reads the anonymous published-and-open shape, which is untouched.

  **Both gates moved, not just the write one.** `apps/api/src/shapes.ts` restricted the full
  `job_postings` shape to `manage_employees`; a read rule that disagreed with the write rule
  would have left the authoring screens able to save a draft they could not then see. The
  legacy `/api/data/job_postings` entry is **deleted** rather than re-gated: a cut-over table
  must not keep a generic door, whose writes would land in `audit_log` with a null command
  (#150).

  **Seven named commands** replace the generic CRUD for this table: `website.createJobPosting`,
  `updateJobPostingDetails`, `publishJobPosting`, `unpublishJobPosting`, `closeJobPosting`,
  `reopenJobPosting`, `deleteJobPosting`. Both lifecycle columns are omitted from
  `updateJobPostingDetails`, so they can only move through a command that names the transition,
  and every audit row now carries that name.

  **`published_at` becomes server-owned.** It was a date picker whose emptiness _meant_ draft
  ("leave empty for draft"), so publishing was spelled as typing a date — and backdating or
  future-dating a posting was a normal thing the form invited. `publishJobPosting` stamps
  `now()`. The form loses the date field and the Closed switch and gains Publish/Unpublish and
  Close/Reopen actions; a new posting is always a draft.

  The `pending` status (a publish date in the future) is now unreachable for new writes.
  `getJobPostingStatus` keeps the branch for rows written before this landed.

  **`@mcmec/sync` is a major** because `HrCollections` no longer carries `jobPostings` — the
  collection moved to the website-management set and onto the command write path, losing its
  Insert/Update schema pair (a command payload is not "a row minus the server columns"). The
  schemas themselves stay in `@mcmec/schemas`' `db/job-postings.ts`, but with the `WRITABLE`
  entry gone nothing imports them any more — the cutover deletes them along with the rest of the
  generic path.

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

### Minor Changes

- 9b0ea3c: Give every employee the public record to read, in Central

  Central had one destination. An employee without `manage_website` who wanted to know when the
  next meeting is, whether last month's minutes are posted, or what a notice actually says had to
  leave the staff applications for the public website — the one surface in the system that is
  written for residents rather than for the people who produce it.

  A new **Commission** group in Central's rail answers both questions in place:

  - **Public Meetings** — the whole meeting record, read a year at a time, with each meeting's
    48-hour notice and minutes on the row. The year defaults to the most recent one that has
    meetings rather than to `getFullYear()`, so January never opens a full record on an empty
    table.
  - **Public Notices** — every notice that is on the public website, filterable by whether a
    resident finds it under Legal Notices or in the Archive, each one opening to its rendered text.

  Both are read-only and composed from `RecordIndex` and `RecordDetail`, so they sort, search,
  paginate and round-trip their state through the URL like every other staff register. Neither
  carries a lifecycle action: publishing, archiving and cancelling are `manage_website` commands,
  and Central is the application every employee has.

  **Only what the public sees.** The shape proxy hands any authenticated session the whole
  `notices` table, drafts included, because its policy is per-table and Website Management authors
  against the same shape. Central narrows to `is_published` in the open, in one place — and the
  notice route refuses an unpublished id rather than leaving the rule to the list, where a URL
  could walk around it.

  Two things move out of one application so a second could not fork them: `meetingStatus` goes to
  `@mcmec/lib/functions/meeting-status`, beside `job-posting-status`, so Scheduled / Past /
  Cancelled is spelled once across the apps that draw it; and `PUBLIC_SITE_URL` joins the app
  constants, deriving the public origin from the same hostname the app switcher reads, so a "view
  on the public website" link from staging cannot land on the production record.

  `RecordIndex` gains an optional `totalRows`. A `filters` control is applied by the route, so the
  block receives rows the caller has already narrowed and its "13 of 137" count was rendering the
  numerator twice — "13 of 13", which reads as an off-by-one rather than as a filtered list. The
  prop defaults to `rows.length`, so a screen whose only narrowing is the search field passes
  nothing and is unchanged.

- 1b5e787: Derive a collection's write path from the command vocabulary, so a cut-over table's two halves cannot disagree.

  A command definition now carries the table it is about, bound once per module via `defineDomain(...).table(...)`. `packages/sync` keys its collection options off that union: a commanded table must declare `commands: true` and may carry no Insert/Update schema, and an uncommanded one may not declare it — checked at the call site, with the vocabulary imported type-only so no app pays for it at runtime. `apps/api` refuses at boot to serve a generic write door for a table that has commands. Table names come from a new `@mcmec/schemas/tables` union rather than being free strings.

- 9f288ec: Employee and user management writes through named domain commands

  The last slice. Six commands across the two domains that are not `website` —
  `employees.addEmployee`, `employees.updateEmployeeDetails`, `employees.deleteEmployee`,
  `employees.inviteEmployee`, `users.grantAppRole`, `users.revokeAppRole` — and with them
  **`WRITABLE` is empty**: no table in the system keeps a generic write door, and every write in
  every app names the command behind it. `POST /api/invite` and `PUT /api/users/:id/roles` are
  deleted, the last two bespoke write routes.

  **Two apps, one command.** `hr` and `admin` shipped byte-identical copies of the add/edit/delete
  trio, which is exactly what #135 meant by putting collections and domains on separate axes: the
  domain is named for the bounded context, not for an app, so one `employees.addEmployee` serves
  both. Both were converted; neither was assumed to follow the other.

  **Send Invite is atomic now, and it was not before.** The old route created the Better Auth login
  first, linked the employee second, and carried a compensating hard delete for when the second step
  failed — a rollback written by hand, correct only for as long as someone maintained it. The
  command writes the `users` row and the `employees.user_id` link with Drizzle on the dispatcher's
  own transaction, so the two are one fact, and sends the set-password mail from an `AfterCommit`
  thunk (#137) because mail is the one thing a transaction cannot take back. There is no throwaway
  password any more either: better-auth's `resetPassword` creates the credential account when the
  invitee follows the link, so the account never holds a password nobody chose.

  That also fixes the audit trail rather than working around it. Writing `users` inside the command
  transaction means the GUCs are set, so `audit_users` names the acting admin and the command;
  through Better Auth's own connection the same insert logs a null actor and a null command. The
  `user-audit.ts` seam stays a no-op and its open question narrows: **no** `users` command routes
  through Better Auth, so what is left in those hooks is sign-in, verification and password reset —
  writes with genuinely no command behind them.

  _Behaviour change:_ the invite response can no longer report `emailSent: false`, because the mail
  goes out after the response is decided. A failed send is a server log, and the "Email Failed" badge
  went with the endpoint.

  **The role grid stops full-replacing.** One checkbox sent the user's whole role set, so two admins
  ticking different boxes clobbered each other and the audit row recorded a list rewritten rather
  than a role moved. `grantAppRole` / `revokeAppRole` are named for the gesture and take **one role,
  not an array** — there is no shape in which a set can be sent — and the server does the
  read-modify-write inside the transaction. The `manage_users` self-lockout hole is untouched and
  still #141.

  **`manage_reference_data` lands, granting nothing.** The `reference` domain ships zero commands
  until the reference-data screen exists, but its AC resource, its role and its column in the
  permissions grid arrive with the cutover so nothing has to be added in two places later.
  `APP_ROLES` was declared twice — once in `apps/api/src/auth.ts`, once in `@mcmec/lib` under a
  comment asking someone to keep them in sync — and `@mcmec/domain` needed it as a third, to
  validate the role payload. It is now one list, in `@mcmec/lib`, read by all three.

  **Three app-local helpers found homes.** `useFormSeed` / `rowVersion` move to `@mcmec/ui/hooks`
  (pure React, and load-bearing: an edit form without the latch silently reverts concurrent edits).
  `toastOnError` moves to `@mcmec/ui/lib` — the one helper needing both sonner and
  `findCommandRefusal`, over a deliberately narrow new edge to the dependency-free
  `@mcmec/sync/command-write` subpath. `intents` stays copied per app: four lines whose whole job is
  to be one app's binding point to the vocabulary.

  On the screen, Delete moves off the edit form into a danger zone card on the detail page (ADR
  0001), warning that an invited employee's login is not deleted with the record. Send Invite is a
  `sendCommand` call rather than a collection write, because a command whose only column change is a
  server-minted id has nothing to be optimistic about — and TanStack DB drops an update with no
  tracked changes, which would have failed it silently behind a success state (#162).

- 976244f: Notice categories, document categories and insecticides write through named domain commands

  The three plain lookup tables cross together (#159): no lifecycle columns between them, so
  each is the same three-command shape — create, updateDetails, delete. Nine commands defined in
  `@mcmec/domain`, implemented in `apps/api/src/commands/website/`, and named at all nine call
  sites in `website-management`.

  One behaviour change falls out of the split. Deleting a category or an insecticide that is
  still referenced now refuses with a sentence rather than a generic failure: the FK restriction
  was always there, but `PATCH/DELETE /api/data/:table` could only report it as "invalid". The
  categories screens already disabled the button while the count was above zero; the handler
  closes the race and the insecticides screen — which offers no count at all — gains the
  explanation it never had.

  `notice_types`, `document_types` and `insecticides` leave `WRITABLE`, so none of the three
  keeps a generic door whose writes would log `audit_log.command = null`.

  `municipalities` leaves `WRITABLE` too, without commands to replace it. No app has ever
  written the table — the only reference is a read — and municipality management belongs to the
  reserved `reference` domain, which ships no commands until that screen exists. It was an open
  write door on a table with no authoring UI, so it is deleted rather than cut over. The read
  shape is untouched.

- f811615: The mosquito CSV import writes through a named domain command

  One command — `website.importMosquitoActivity` — and the smallest slice of the cutover by
  vocabulary, but the one that does not fit the shape the dispatcher was built around. Every other
  command is about one row addressed by the envelope id; an import is _delete every row for the
  years the file names, then insert the file_. There is no row for an id to point at.

  So the vocabulary learns one word for it. A definition may declare itself `targetless`, and the
  dispatcher then stops demanding an envelope id and refuses to let that command share an envelope
  with a row-scoped one — the alternative was minting a uuid that names nothing and letting it ride
  through as if it did. A targetless handler is typed without an `id` at all, so it cannot read one.
  The population is one command, and the flag is one line in the definition rather than a
  classification every future command has to be sorted into.

  `POST /api/mosquito-activity/import` is deleted with `apps/api/src/mosquito.ts`, and
  `mosquito_activity_data` leaves `WRITABLE` — a second, unused door onto the same table that no app
  had ever opened. What is left of the old endpoint is the write itself: the permission check, the
  transaction, the actor GUCs and the txid all belong to the dispatcher now. `apiFetch` goes too:
  both endpoints it existed to reach have become commands.

  The CSV is still parsed in the browser, deliberately. A server-side parse would mean a multipart
  upload the flat-JSON envelope cannot describe, and would move per-row error reporting away from
  the file the user picked. The rows now travel named for their Postgres columns like every other
  payload on this wire, so the client's snake_case→camelCase mapping step disappears. The import
  posts through `sendCommand` rather than the collection — a whole-year replacement has no single
  optimistic row to write, and the screen reads aggregates — and the new season streams back in
  through Electric as it always did.

  `toColumnValues` learns that a `numeric` column takes a string: the wire carries
  `rainfall_inches` as a number because that is what Electric's parser hands back, and Drizzle
  refuses to guess how a float should round. Postgres applies the column's own scale, so the old
  `toFixed(2)` was doing nothing the column did not already do.

  The guard against replacing the wrong season stays where it is: the preview names the years and
  the row count, and the button says what it will do. It is client-side only — the server replaces
  whatever years the file names — and promoting that to a year set the request declares would
  refuse nothing the preview does not already show.

- 06e9b54: Notices write through named domain commands

  The first table on the command path (#152). Seven commands — `website.createNotice`,
  `updateNoticeDetails`, `publishNotice`, `unpublishNotice`, `archiveNotice`,
  `unarchiveNotice`, `deleteNotice` — defined in `@mcmec/domain`, implemented in
  `apps/api/src/commands/website/notices.ts`, and named at each call site. Every notice write
  now lands a real name in `audit_log.command` instead of a null.

  Two behaviour changes fall out of the split:

  - **P.L. 2025 c.72 is enforced, not advised.** The seven-day retention rule was a
    non-blocking amber box in the notice form, invisible to the server. It is now a
    precondition on `archiveNotice`, checked against the stored notice date; archiving too
    early is refused with a 409 whose message is written for the person who clicked.
  - **Publish and archive left the edit form.** They were switches inside a details form and
    are now two buttons, because a lifecycle column can only move through a named command —
    the payload schema for `updateNoticeDetails` omits them entirely. Create still offers the
    initial publish state, which is a choice rather than a transition.

  The client-minted id is now honoured on create, so an optimistic row keeps its key when the
  row commits; the generic `/api/data/notices` door is deleted.

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

- Updated dependencies [ecb366f]
- Updated dependencies [5548a61]
- Updated dependencies [1b5e787]
- Updated dependencies [3960d61]
- Updated dependencies [3dd1ec0]
- Updated dependencies [2aefe19]
- Updated dependencies [32de0ba]
- Updated dependencies [66e8715]
  - @mcmec/schemas@3.0.0

## 0.3.0

### Minor Changes

- 76ce7e8: Railway migration Phase 4 — rewire the `public` site to the new backend. This completes the frontend migration.

  **public** — every read now comes from the API's ElectricSQL shape proxy instead of Supabase, and the four intake forms post to the merged public-requests endpoint.

  The site stays server-rendered: reads still run inside TanStack Start server functions, so the data is in the SSR response rather than waiting on a client fetch, and the exported `*QueryOptions` are unchanged — no route touched them. Reading anonymously also means the shape proxy applies the public policy server-side, so unpublished notices, documents, and job postings never reach the process. Spray schedules were a nested PostgREST select; shapes are per-table, so the four shapes are read in parallel and joined in the handler.

  The four submit functions collapse into one that forwards to `POST /api/requests`, which owns the honeypot, Turnstile verification, per-type validation and the insert. Forwarding server-side (rather than posting from the browser) keeps the site talking only to its own origin — no CORS, nothing added to the CSP — and the Turnstile secret now lives only in the API. The visitor's IP is passed through so Turnstile still scores the real client.

  Removed: both Supabase clients, the local Turnstile validator, and `@supabase/ssr` / `@supabase/supabase-js`. `connect-src https://*.supabase.co` is dropped from the CSP; `img-src` keeps it until the brand assets are rehosted. Needs `API_URL` server-side, and no longer needs the Supabase or Turnstile-secret variables.

  **@mcmec/supabase** — the public intake contract, shared by the site and mirroring what the API validates: a `requestType` discriminated union of submission payloads, plus the flat form schemas the site's fields bind to and a helper mapping the contact block into a payload.

  **@mcmec/supabase-tanstack-db-integration** — new `fetchShapeSnapshot`: a one-shot shape read for callers that want current rows rather than a live collection. It waits for the shape to report up-to-date, then aborts the stream so no long-poll outlives an SSR request, and applies the same parser the collections use so server and client rows agree.

### Patch Changes

- 76ce7e8: Let on-demand collections sync through the shape proxy.

  On-demand syncing sends `log=changes_only` plus `subset__where` / `subset__order_by` / `subset__params` to pull slices rather than whole tables, and the proxy forwarded only its sync-cursor allowlist. The dropped params didn't fail loudly — the collection simply synced nothing, so the 178-row public-requests table rendered as "0 of 0".

  The proxy now forwards `log` and any `subset__*` param. That's safe because Electric intersects a subset with the shape's own `where` instead of replacing it: verified against staging, a shape pinned to `status = 'resolved'` returned zero rows for `subset__where: status = 'new'` while such a row existed, and `subset__where: true = true` still returned only the resolved set. A client cannot reach rows the policy excludes.

  `public_requests` and `mosquito_activity_data` stay on-demand as intended — both only grow, and pulling them whole on every page load doesn't scale.

- 76ce7e8: Stop a slow sync from rolling back a committed write.

  The collection handlers returned `{ txid }`, which handed the settle wait to
  `@tanstack/electric-db-collection`. Its `processMatchingStrategy` calls `awaitTxId` with a 5
  second default, and that call **rejects** on timeout. The rejection propagates out of the
  mutation handler, so the transaction is marked failed and the optimistic state rolls back —
  the user watches their edit disappear from the screen while Postgres has it durably committed.

  Five seconds is comfortable against a local API, but the production path is longer, and a
  cold start on a sleeping Serverless service could plausibly exceed it. A write vanishing from
  the UI is the worst possible way to report "sync was briefly slow."

  The API's 2xx response is the durability signal: `handleWrite` throws on any non-2xx, so
  genuine failures still reject and still roll back exactly as before. Only the lag case
  changes. Each handler now awaits its own txids, with a 30 second window, and swallows a
  timeout rather than failing the mutation — then returns a result with no `txid` key so the
  collection does not wait a second time (its check keys off that property's presence).

  In the normal case the optimistic overlay persists until the real row arrives, so there is no
  flicker. If the window is exceeded, the overlay drops and the row shows its last synced value
  until the collection converges — a brief flicker instead of a lost edit, and a console warning
  naming the collection.

## 0.2.1

### Patch Changes

- 5c3f9fd: Add service requests and contact submissions management to the notices app
  - Add on-demand collections for adult mosquito complaints, mosquitofish requests, water management requests, and contact form submissions
  - Add full CRUD routes for all 3 service request types and contact submissions with detail, edit, and create pages
  - Restyle dashboard with stat cards, pending requests, open submissions, recent notices, and meetings
  - Add mutation error toasts via TanStack DB isPersisted — only shown when server rejects and optimistic state rolls back
  - Fix useNotices join duplication bug causing cartesian products with employee left join
  - Fix on-demand collection queryKey prefix validation warnings
  - Replace table cell links with clickable rows using navigate

## 0.2.0

### Minor Changes

- 9e06271: Add supabase-tanstack-db-integration package. Bridges TanStack DB with Supabase for reactive collections with optimistic mutations.
