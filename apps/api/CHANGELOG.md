# api

## 1.0.0

### Major Changes

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

### Minor Changes

- f38457f: Audit log records the named domain command behind each write

  `audit_log` gains a nullable `command` column, populated by `log_mutation()` from a new
  `app.command` GUC that `setCommand(tx, command)` stamps per command inside the transaction.
  Existing write paths set nothing and log a null command, exactly as before.

- 8fe2bff: Documents write through named domain commands

  `documents` is the first slice to cross with a lifecycle pair, so it is the first bound by
  ADR 0001 rather than only by the command split (#160). Five commands — `createDocument`,
  `updateDocumentDetails`, `publishDocument`, `unpublishDocument`, `deleteDocument` — defined in
  `@mcmec/domain`, implemented in `apps/api/src/commands/website/documents.ts`, and named at all
  five call sites in `website-management`. `documents` leaves `WRITABLE`, so it keeps no generic
  door whose writes would log `audit_log.command = null`.

  A document is a _link_, not a file: `documents.url` is a plain external URL column, so nothing
  in this slice touches storage and no command needs an after-commit thunk.

  The publish switch leaves the edit form. `is_published` appears in no `updateDetails` payload
  schema, so publishing is a button on the detail view, in the edit form as Save-and-Publish, and
  as a row shortcut — never a field you save your way into. Creating a document still offers the
  initial state, because a create is not a transition.

  Delete moves off the edit form into the danger zone on the detail page, which is the one
  placement ADR 0001 fixes.

  Two behaviour changes fall out. Publishing from the detail view no longer navigates away — the
  badge beside the title is live, so the result of the click is visible where the click was; it
  used to bounce to the index because the page had no way to show the answer. And the edit form
  now sends only the fields that actually changed, against the live row, instead of writing back a
  whole row seeded once on mount.

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

- 0562505: Meetings write through named domain commands

  Five commands — `createMeeting`, `updateMeetingDetails`, `cancelMeeting`, `uncancelMeeting`,
  `deleteMeeting` — defined in `@mcmec/domain`, implemented in
  `apps/api/src/commands/website/meetings.ts`, and named at all three call sites in
  `website-management` (#161). `meetings` leaves `WRITABLE`, so it keeps no generic door whose
  writes would log `audit_log.command = null`.

  **A cancelled meeting now has to say why, and the server is the one enforcing it.** This is the
  third and last of the three form-only rules #134 promoted to a server precondition. It lived as
  a conditional `onBlur` validator on the notes field, revalidated by an `onChange` hook on the
  `is_cancelled` switch — a rule `PATCH /api/data/meetings` could not see, because the switch and
  the notes reached it as two indistinguishable columns of one row. `cancelMeeting` now reads the
  STORED notes and refuses with a sentence written for the person who clicked. Re-homing it takes
  two interlocking validators out of the form and leaves one plain optional field.

  Save-and-Cancel works because the two intents share a transaction and run in client order:
  `updateMeetingDetails` lands the reason, then `cancelMeeting` reads it. A refused cancel rolls
  the field save back with it, and the toast says so.

  **Meetings gain the detail page ADR 0001 requires.** `$meetingId` was the edit form; it is now a
  read-only view carrying the Cancel/Reinstate pair, the meeting's links and notes, and the danger
  zone. The form moves to `$meetingId/edit`. Cancelling is also a row shortcut on the index —
  `MeetingsTable` and `MeetingsMobileList` take an optional `rowActions` prop, which the public
  site does not pass.

  Cancelling still changes only what the public meetings page _says_ about a meeting, never
  whether it appears: `shapes.ts` gives `meetings` no predicate at all, and the read side is
  untouched.

  Creating a meeting no longer offers an initial cancelled state. It was never a real choice — a
  meeting is born scheduled, and `createMeeting`'s payload has no `is_cancelled` to set.

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

- d31e49b: Publishing a notice writes its proof-of-posting record

  `notice_postings` was fully scaffolded — table, `manage_website`-gated shape, append-only
  grants, exclusion from the seven-year purge — and nothing ever inserted a row. Now that the
  website is MCMEC's primary method of publishing legal notices under P.L. 2025 c.72, the ledger
  is the evidence, so an empty one is the same as no evidence at all.

  Every unpublished→published transition now appends exactly one row inside the same transaction
  as the write that caused it, with `posted_by` set to the acting user. Two commands can cause
  that transition and only those two write:

  - `publishNotice` reads the stored `is_published` first — with the row locked, because the
    read decides whether to write and the ledger cannot be corrected by DELETE — and appends only
    on a genuine transition, so publishing an already-published notice forges nothing.
  - `createNotice` with `is_published: true` appends, because creating an already-published
    notice is the transition.

  `updateNoticeDetails` writes no row and needs no check — the domain omits the lifecycle columns
  from its payload schema, so `is_published` cannot move through it.

  The snapshot freezes `title`, `notice_date`, `notice_type` (the resolved type name),
  `notice_type_id` and `content`, read back from the notice row rather than from the command
  payload. That is what makes the canonical two-intent save-and-publish envelope freeze the
  _updated_ content, and what keeps the record correct however the intents are ordered. The type
  name is frozen beside its id so the record stays readable if the type is later renamed.

  Unpublish-then-republish appends a second row: two distinct periods of public availability are
  two pieces of evidence. No schema change and no migration — the table already had the columns.

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

- 1b5e787: Derive a collection's write path from the command vocabulary, so a cut-over table's two halves cannot disagree.

  A command definition now carries the table it is about, bound once per module via `defineDomain(...).table(...)`. `packages/sync` keys its collection options off that union: a commanded table must declare `commands: true` and may carry no Insert/Update schema, and an uncommanded one may not declare it — checked at the call site, with the vocabulary imported type-only so no app pays for it at runtime. `apps/api` refuses at boot to serve a generic write door for a table that has commands. Table names come from a new `@mcmec/schemas/tables` union rather than being free strings.

- 9b0ea3c: Move the local dev upstreams out of the 30xx block

  Another project on the development machine maps ElectricSQL to host port 3001 through Docker,
  which is `central`'s Vite port. The collision does not announce itself: Docker's relay accepts
  the connection, so `strictPort` sees nothing to refuse and Caddy answers `https://localhost:3444`
  with a bare `Not found` — an app that looks broken rather than a port that is taken.

  The browse ports are unchanged. Each now proxies to the upstream carrying the same last two
  digits one hundred above:

  | Browse (https) | Upstream (http) | App                |
  | -------------- | --------------- | ------------------ |
  | 3443           | 3543            | api                |
  | 3444           | 3544            | central            |
  | 3445           | 3545            | hr                 |
  | 3446           | 3546            | admin              |
  | 3447           | 3547            | website-management |
  | 3448           | 3548            | public             |

  The rule is _upstream = browse port + 100_, so a URL in the address bar names the port behind it.
  `apps/api`'s `PORT` fallback moves off 3000 for the same reason — that is the other project's
  server, and an unset `PORT` used to hand it away. Railway sets `PORT` itself, so nothing deployed
  changes.

  Picking 35xx is the point rather than picking 3544: 3001–3007 sat adjacent to a range that
  project was already using, and it expanded. Update local `.env` files by pulling the new
  `.env.example` values, and reload Caddy (`caddy reload --address localhost:2020`).

- 30bef37: Rebuild the public home page around a split hero: six photographs of the Commission's own work crossfading on one half, the six ranked destinations on the other.

  The photographs are a plate beside the content, not a ground beneath it — nothing is laid over them, which retires the white-on-scrim heading the old banner used and puts the Commission's name back in Ink on Paper. The destinations are one bordered register in the Signal Band's construction rather than six shadowed cards, led by Request Service and Spray Schedule.

  Auto-advance carries a real pause control and stops entirely under `prefers-reduced-motion`; the six selector hairlines are Muted Ink so they clear WCAG 1.4.11 against Paper. Six new `hero-*.avif` assets ship from the `api` service.

- a88e150: Lift the shared command-handler helpers before the third slice

  Two tables have been cut over to named commands, and both wrote out the same handler code by
  hand. #134 names 49 commands, most of which are one `set` or one `delete` against one row, so a
  third copy would have made the duplication a convention by accident.

  **`setFields`, `deleteRow`, `NOT_FOUND` and `isForeignKeyViolation` move to
  `apps/api/src/commands/rows.ts`.** They stay in the API rather than in `@mcmec/domain`, and
  deliberately so: #135 split the two packages on define-versus-implement, and these take a
  Drizzle table and a transaction. The line to hold is that nothing in `rows.ts` may grow a
  precondition — `archiveNotice` keeps P.L. 2025 c.72 to itself — because a shared helper that
  quietly starts carrying policy is how the define/implement split erodes.

  `deleteRow` deliberately does not handle foreign keys. #137 put the FK→409 mapping on the
  deleting handler, because "still referenced" needs a sentence naming what still references it,
  and only the handler knows; `notices` keeps its wrapper and `job_postings` documents why it has
  none.

  **A Tiptap document has one spelling now.** `notices` typed `content` from
  `NoticesRowSchema.shape.content`, which is `z.any()` — so `updateNoticeDetails` would have
  carried `content: null` into a NOT NULL column and failed as a 500 where a 422 is the truth.
  `job_postings` hand-rolled an object schema. The object is right, and it becomes
  `TiptapDocument` in `@mcmec/domain`, where the shape of a rich-text document belongs: what
  `content` may be is part of what a payload _means_.

  This is the one behavioural change here — `website.createNotice` and
  `website.updateNoticeDetails` now refuse a `content` that is not a JSON object. Nothing in the
  app could send one; the editor emits a document and the column is NOT NULL. `TiptapDocument`
  stops at "a JSON object" rather than describing Tiptap's node grammar, because the grammar is
  the editor's and tightening further would start refusing documents already stored.

  **Two shared components for ADR 0001.** `DangerZoneCard` is where `delete*` lives — the one
  lifecycle action whose placement is not free — and `LifecycleButton` is the rest of them, which
  may sit wherever is convenient but may never be a switch. The button relabels on a dirty form
  ("Publish" → "Save and Publish") and hands `isDirty` back to the caller, which composes the two
  intents into one atomic request; `toastOnError` gains `savedTogether`, so a refusal says the
  field save rolled back with it. Both are presentational and know nothing about the vocabulary.
  They have no callers yet: #167 retrofits notices and job postings onto them.

- ab92401: The `manage_users` self-lockout guard moves to the server

  `users.revokeAppRole` now refuses when the envelope target is the acting session's own user id
  **and** the role being revoked is `manage_users`. The refusal is
  `409 { error: "precondition_failed", reason: "self_revocation", message }`, and the message is a
  finished sentence the permissions grid already renders through `findCommandRefusal`.

  Until now the only thing standing between an admin and locking themselves out was a `disabled`
  prop on one checkbox. Anything that is not that checkbox — curl, a stale tab, a hand-written
  envelope, a future client that forgets — reached the handler and was obeyed, and the way back from
  that is direct database access. The rule is now enforced where an attacker actually runs; the
  client guard stays, demoted to a courtesy that keeps an admin from clicking something the server
  would refuse.

  `409 precondition_failed` rather than the `403` the report proposed. `403 forbidden` already means
  "you may not send this command", and the caller here _does_ hold `manage_users` — dispatch checked
  it. This is a rule about the gesture, checked against stored state, which is the shape
  `archiveNotice`'s retention check already uses.

  Deliberately narrow, and the neighbouring cases are covered by tests rather than left to reading:
  revoking `manage_users` from **someone else** succeeds, revoking **any other** role from yourself
  succeeds, and `grantAppRole` is untouched — granting yourself a role cannot lock you out. Whether
  the caller would still hold `manage_users` by some other route is not asked, and refusing a
  revocation that would leave the system with zero administrators is a different and harder rule
  that this is not.

  `@mcmec/lib` gains a named `MANAGE_USERS` export so the guard and the role list cannot come apart,
  and `apps/api` gains a test runner — these are its first tests, and CI now runs them.

- de15668: Test the command boundary

  `POST /api/commands` is the one write door, and the runtime invariants it enforces — refusing an
  unknown or public command, refusing a malformed envelope, checking permission per command and
  _before_ any payload is inspected, keeping a targetless command out of a row-scoped envelope,
  committing a two-intent envelope whole or not at all — had been verified by hand on staging once
  and unguarded since.

  `apps/api`'s Vitest suite now drives the real Hono app against a real Postgres and asserts the
  status **and** the refusal reason for each. The reason strings are what the UI shows a user, so a
  changed reason now fails a test rather than shipping. The `notice_postings` ledger is covered
  alongside them: a publish appends exactly one row attributed to the caller, republishing appends
  a second, and a refused envelope leaves none behind — which matters because the table is
  append-only and a forged entry could never be removed.

  Isolation is by truncation, not by a transaction the test opens: the request under test opens its
  own transaction on the app's pool, so a `BEGIN` on another connection could never enclose it. A
  test gets a session by minting the user and session rows directly and signing the cookie, never
  by signing in over HTTP.

  CI gains a Postgres service container. Locally it is one `docker run` line, in
  `apps/api/README.md`.

- Updated dependencies [0e49037]
- Updated dependencies [62f332a]
- Updated dependencies [9b0ea3c]
- Updated dependencies [ecb366f]
- Updated dependencies [30bef37]
- Updated dependencies [5548a61]
- Updated dependencies [1b5e787]
- Updated dependencies [8fe2bff]
- Updated dependencies [9f288ec]
- Updated dependencies [229923c]
- Updated dependencies [30bef37]
- Updated dependencies [0e49037]
- Updated dependencies [a88e150]
- Updated dependencies [976244f]
- Updated dependencies [3960d61]
- Updated dependencies [d00dfe1]
- Updated dependencies [e6877ea]
- Updated dependencies [3b8822d]
- Updated dependencies [0562505]
- Updated dependencies [f811615]
- Updated dependencies [06e9b54]
- Updated dependencies [4515e79]
- Updated dependencies [3dd1ec0]
- Updated dependencies [8381e83]
- Updated dependencies [ab92401]
- Updated dependencies [0e49037]
- Updated dependencies [62f332a]
- Updated dependencies [efc7409]
- Updated dependencies [2aefe19]
- Updated dependencies [32de0ba]
- Updated dependencies [51aef15]
  - @mcmec/lib@0.10.0
  - @mcmec/sync@1.0.0
  - @mcmec/domain@0.1.0

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
