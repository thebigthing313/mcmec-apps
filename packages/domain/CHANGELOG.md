# @mcmec/domain

## 0.1.0

### Minor Changes

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

- 1b5e787: Derive a collection's write path from the command vocabulary, so a cut-over table's two halves cannot disagree.

  A command definition now carries the table it is about, bound once per module via `defineDomain(...).table(...)`. `packages/sync` keys its collection options off that union: a commanded table must declare `commands: true` and may carry no Insert/Update schema, and an uncommanded one may not declare it — checked at the call site, with the vocabulary imported type-only so no app pays for it at runtime. `apps/api` refuses at boot to serve a generic write door for a table that has commands. Table names come from a new `@mcmec/schemas/tables` union rather than being free strings.

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

- Updated dependencies [0e49037]
- Updated dependencies [62f332a]
- Updated dependencies [9b0ea3c]
- Updated dependencies [ecb366f]
- Updated dependencies [30bef37]
- Updated dependencies [5548a61]
- Updated dependencies [1b5e787]
- Updated dependencies [9f288ec]
- Updated dependencies [30bef37]
- Updated dependencies [0e49037]
- Updated dependencies [3960d61]
- Updated dependencies [d00dfe1]
- Updated dependencies [e6877ea]
- Updated dependencies [3b8822d]
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
- Updated dependencies [66e8715]
  - @mcmec/lib@0.10.0
  - @mcmec/schemas@3.0.0
