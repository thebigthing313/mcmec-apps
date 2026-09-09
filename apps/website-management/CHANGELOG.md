# notices

## 1.1.0

### Minor Changes

- 0e45e28: Move every record index onto RecordIndex

  The eight remaining staff index pages now compose the shared `RecordIndex` instead of hand-rolling
  a table each: Notices, Meetings, Documents, Insecticides, Job Postings, Public Requests and Spray
  Missions in Website Management, and Employees in both HR and Admin.

  Each one gains, without its route asking for it: a real link on every row, so the list is operable
  by keyboard and a record can be opened in a new tab; `aria-sort` on the sorted column and an
  accessible name on the table; row-action triggers that name their record instead of ten buttons all
  called "Row actions"; a loading state distinct from the empty state; an authored empty state instead
  of "No results."; a debounced search field; sort, page, size and search persisted in the URL so
  returning from a record lands where you left; and a default page size of 25.

  **Employees is now one component, not two files.** `apps/admin` and `apps/hr` held byte-identical
  250-line copies of the same screen. Employees are one bounded context read by two surfaces, so the
  screen moved to `packages/ui/blocks/employees-index.tsx` beside the other domain blocks; each app
  supplies only its own typed link, its own invite command and its own add-employee control. The two
  routes are 62 lines each.

  **Meetings and Documents have an `h1` for the first time** — both opened on a bare button. The
  meetings breadcrumb now reads "Meetings" rather than "Meetings Index", which was a developer's word
  for a route rather than the Commission's word for the thing.

  **Closed job postings are no longer Refusal Red.** DESIGN.md reserves that colour for destructive
  commands and validation failures; the end of a hiring round is neither.

  Unpublishing and cancelling now confirm before acting, and every lifecycle command says what it did
  afterwards. The confirmation guards withdrawal, not publication: a cancelled Meeting shows as
  Cancelled on the public calendar under the Open Public Meetings Act and previously did that in one
  click with no acknowledgement at either end, whereas publishing is the forward act these screens
  exist for and is reversible by the guarded action itself. DESIGN.md's Confirm Is For The Public Rule
  is worded to make that distinction explicit rather than incidental.

  `notices-table`, `documents-table`, `public-requests-table` and `spray-schedule-table` are deleted.
  `meetings-table` and `insecticides-table` stay, because `apps/public` renders them. The spray-mission
  status and time formatters moved to `apps/website-management/src/lib/spray-schedule.ts`, so the
  detail view and the dashboard no longer import a table component to borrow two functions from it.

  Not migrated, deliberately: Notice Categories and Document Categories are inline-edit screens with no
  detail route, so there is nothing for a required row link to point at; Manage Permissions is a role
  grid rather than a record list; and Weekly Mosquito Activity is a CSV import screen with a chart.

- 4e17f16: Give every re-keyable value on the Public Request detail screen its own copy button.

  `@mcmec/ui` gains a `CopyButton` block: one value, one button, confirming by icon swap and
  raising an error toast only when the clipboard write is refused. `RecordDetail` takes an opt-in
  `titleCopyText`, and `RecordDetailField` an opt-in `copyText` — the eight other detail screens
  pass neither and are unchanged.

  On Public Requests the metadata list now shows address line 1 and line 2 as separate rows and
  zip code, city and state as three, so each button copies exactly the string beside it rather
  than the joined, em-dashed version composed for reading. The details panel copies each free-text
  block, and the "Reported" group copies its true flags as one comma-joined line.

- 0e45e28: Make the Website Management dashboard a place to start work, not a place to read numbers

  The dashboard opened on four stat cards over a 2×2 grid of list cards. Every count was a dead end —
  the number told you there were twelve open Public Requests and then made you leave the page to see
  one — and nothing on the screen said which of the four mattered first. It also lied: the "Upcoming
  Meetings" card sorted `meeting_at` descending, so it showed the most recent _past_ meetings under a
  heading promising the opposite.

  **One instrument.** A new `SignalBand` block puts five named signals across the top of the screen —
  Spray Missions tonight, Public Requests aging past five days, new Requests awaiting triage, Notices
  not yet public, upcoming Meetings — and opens each one's queue directly beneath it, inside the same
  border. The count is the size of a queue you are one keypress from reading. The screen opens on the
  most consequential signal that actually holds work, so someone signing in during a spray week lands
  on tonight's mission and someone signing in in February lands on whatever is genuinely outstanding.

  **Ranking without colour.** DESIGN.md reserves Commission Green for the active state and Refusal Red
  for destruction, so neither is available to mark urgency. Rank is carried by the cells'
  left-to-right order, by each signal's condition phrase — "open 5+ days", "awaiting triage", "none
  scheduled" — and by which signal the screen opens on. A zero count recedes to Muted Ink so the eye
  lands on the signals holding real work. This is the Status Is A Word Rule applied to a control
  rather than to a badge, and it is recorded in DESIGN.md as **The Count Opens Its Queue Rule**.

  **One row for four domains.** Every queue renders through one row vocabulary — what the record is,
  where or who, when in tabular figures, and its state as a word — so switching signals changes the
  content and nothing about where to look. Left to themselves, five queues across four domains grow
  five arrangements on one surface.

  **Keyboard, because staff live here.** The band is a real WAI-ARIA tablist: Left/Right/Home/End move
  the selection and open the queue as they go, in 200ms, which is the screen's only authored motion.
  ArrowUp/ArrowDown are deliberately absent and `aria-orientation="horizontal"` is declared — below
  `lg` the band wraps to a two-dimensional grid where a vertical arrow would move the selection
  sideways.

  **The lower half confirms rather than repeats.** "What the public sees right now" reports the
  published surface a resident actually loads — Notices on the board with the newest posting's date,
  Documents published, Insecticides listed, Job Postings open. None of it restates a signal above it,
  and it sits a tonal rung down on Muted Surface so the two registers are separated by material rather
  than by margin.

  `SignalBand` lives in `packages/ui`, so `central`, `hr` and `admin` inherit it. The row vocabulary is
  app-local for now and should move beside the band if a second staff application grows a queue.

  One behavioural note for reviewers: the band's auto-open commits once every query behind it reports
  `isReady`, not on a timer and not on the first non-zero count. `publicRequests` is an on-demand
  collection that syncs after the eager ones, so both of the cheaper triggers pick whichever queue
  wins the sync race — which reproducibly opened the screen on Upcoming meetings while an aging Public
  Request sat unread two cells to the left.

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

- 0e45e28: One index page, and a brand colour that finally passes AA

  A critique of `/notices` scored it 13/40 and found the same faults sitting in all eleven staff index routes. Two fixes here: the colour, and the screen.

  **The `primary` / `primary-foreground` pair was failing WCAG AA and nobody had measured it.** White-on-Commission-Green measured **4.24:1** against the 4.5:1 floor for normal-size text, and that pair paints every primary button in five frontends, the skip link in `mcmec-layout`, and every filled status badge at 12px. The foreground is lightened to `oklch(0.985 0.0199 112.9333)`, which measures **4.63:1** on the real rendered elements. Commission Green itself does not move — it is a brand commitment — and the warmth stays, because removing the chroma entirely shifts the ratio by 0.02 and buys nothing. DESIGN.md now records the measured number, which it never did before.

  **`RecordIndex` replaces the eleven hand-rolled index pages.** The duplication was the argument for extracting it: nine copies of the sortable column header, none emitting `aria-sort`; eight copies of the same forty-five-line pagination footer; six different spellings of the empty state; three incompatible ways of getting from a row to a record; and zero loading states anywhere, so every index announced "No results." while its Electric shape was still streaming. On a statutory public record, "there are no notices" is a sentence with legal weight and must never be said by accident.

  The block is opinionated on purpose. `renderRowLink` is required, so an index that cannot be operated by keyboard does not compile — four of the eleven made the whole `<tr>` a click target with no anchor, which left a screen-reader user on a terminal page and cost everyone middle-click and open-in-new-tab. `getRowLabel` is required, because ten triggers all called "Row actions" tell a screen reader nothing about which record is about to change. `state` and `emptyState` are required, because loading and empty are different screens.

  It also adds what no individual route was ever going to add for itself: sort, page, size and search persisted in the URL so returning from a record lands where you left; a debounced search field that keeps its own draft (writing each keystroke to the URL loses focus mid-word and turns the back button into an undo log); a live result count; skeleton rows; and a default page size of 25 rather than 10, because these screens are read at a desk on a large display.

  Per-domain choices stay with the route — columns, `rowActions` builders, which lifecycle actions a row offers, filter dimensions, default sort — so ADR 0001's seam is preserved exactly: the route owns the command vocabulary and passes it in, and the block never learns it.

  **`RowActionsMenu` can now ask first.** A `confirm` on a row action opens an alert dialog naming the record. Unpublishing a Notice removes a statutorily posted legal notice from the public website and previously did it in one click with no confirmation and no acknowledgement, while `delete*` — less publicly consequential — had a whole danger zone. `toastOnError` gained a `success` option for the same reason: a command whose entire effect lands on a website the user is not looking at owes them a sentence when it works.

  `/notices` is migrated as the reference implementation and `notices-table.tsx` is deleted. The rest of the record indexes follow in the same release — see the accompanying changeset.

- 62f332a: Rebuild the staff auth screens as one shared surface

  The four staff applications had four front doors. Central had a real `_auth` layout
  with a split-screen building photograph; admin, hr and website-management each carried
  their own hand-rolled copy of the same login card, differing only in their title. None
  of those differences were decisions, and one SSO cookie already spans all four.

  They now share `AuthShell` — a hairline frame inset from every viewport edge, with the
  Commission's name breaking across the top rule and the destination application opposite
  it, the office address and `Established 1914` across the bottom. The form sits inside on
  an unbounded register rather than in a card. Sign-in, password reset and the invite flow
  are shared blocks, and password recovery lives in Central for all four apps.

  Behaviour kept: the same-origin redirect guard, the deliberately non-committal "if an
  account exists" reset confirmation, and every token-failure message. Behaviour gained:
  `autocomplete` on password fields, which three of the four logins set by hand and
  central set nowhere, and a reserved status line so a failed sign-in no longer shoves the
  button out from under the cursor.

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

- 0e49037: Present an access refusal as a rule, not as a crash

  App Roles are the staff applications' central access model, and the single moment a person met
  that model, the system called it a failure. A `ForbiddenError` from `beforeLoad` fell through to
  `defaultErrorComponent`, which rendered `ErrorDisplay`: a card headed "Sorry about that!", the
  message inside a destructive-red alert titled "An Error Has Occurred", and — as the primary
  button — "Try Again", wired to `router.invalidate()`. Invalidating re-runs the same permission
  check and refuses again. The one action on the screen was a loop, and the copy never said what
  was actually wrong.

  **Two purpose-built notices replace it.** `AppRoleRequired` names the application, names the App
  Role it needs, and names who can grant it: "Website Management requires the Website App Role, and
  your account does not have it. Someone with the Users App Role can grant it to you in the Admin
  application." It says _App Role_ rather than `manage_website`, because the role is the thing a
  person can ask for and the permission string is an implementation detail they cannot act on. Its
  primary action goes to Central — the one application every employee has, and the one carrying a
  switcher listing the applications they can actually open.

  `OnboardingRequired` covers the other outcome, an account with no Employee record behind it. It
  gets its own screen because no App Role would help: the applications read a person's name, title
  and permissions off the Employee, so there is nothing to sign in as. The only action that can
  change the outcome from the user's side is signing out — the account may simply be the wrong one
  — so that is the only action offered.

  **Neither is an `ErrorDisplay`.** No alert, no red, no retry: a lock or a person glyph on muted
  ground, ink on paper, the reason in body text and the remedy beneath it. Refusal Red stays
  reserved for destructive commands and validation failures, which is what DESIGN.md says it is
  for. Genuine failures keep `ErrorDisplay` and keep retry, because a dropped shape request is
  exactly the case retry exists for.

  **Central loses its hand-rolled version.** It carried its own 27-line `errorComponent` on the
  `(app)` route for the not-onboarded case, built from raw `text-gray-600` and `text-red-600` —
  the only literal greys left in the staff applications and a break in the hue-150 neutral family.
  It now uses the shared notice where the other three keep theirs. Central needs no App Role, so it
  wires only the onboarding case.

  `ErrorMessages.AUTH.FORBIDDEN` also loses a missing preposition ("permission to this action" →
  "permission for this action"), which is still the fallback wherever that string is surfaced.

- 62f332a: Close the gaps a code review found in the auth rebuild

  **`prefers-reduced-motion` did nothing.** The override sat inside `@layer base` while
  `.animate-rule-x` is generated from its theme token into Tailwind's `utilities` layer, and layer
  order beats specificity — so the rule animated for everyone, including the people who had asked
  it not to. The file documents this exact trap twelve lines further down, where the `.prose` block
  explains why it is deliberately unlayered. The media query is now unlayered too.

  **The email fields lost `type="email"`.** Three of the four hand-rolled logins set it themselves;
  the shared `TextField` hardcoded `type="text"`, which took the email keyboard off every phone and
  the browser's own address check off every sign-in. `TextField` forwards a `type` now, and both
  auth email fields pass `email`.

  Also in this pass:

  - The masthead's corner stubs draw with the rule they belong to. They carried `origin-left` /
    `origin-right` and no animation, so the line arrived as a middle section growing between two
    pieces that were already there — not what DESIGN.md's Motion section describes.
  - `safeRedirect` is one function in `@mcmec/lib` rather than four copies. Three staff apps had
    byte-identical private versions and Central had it inline as a Zod refinement. The guard that
    refuses `//evil.example` is the half a re-implementation forgets, and it is not the kind of
    thing that should live in four places.
  - `AuthStatus` drops the `tone` prop no caller passed and takes its own `mt-4`, which both call
    sites were adding around it.

- 8381e83: Bring the two category registers inside the system

  Notice Categories and Document Categories were two hand-rolled 315-line screens that differed
  only in the noun — the tenth and eleventh copies of exactly the table `RecordIndex` was written
  to end. Neither had search, sort, `aria-sort`, URL state, or a loading state, so both printed
  "No categories found" while their collection was still syncing. Their Edit and Delete controls
  were icon-only buttons with no accessible name, which made them the only controls in the
  application a screen reader could not identify. And Delete fired on a single click with no
  confirmation, guarded only by a client-side count.

  Both are now composed from `RecordIndex`, with Edit as a named row action and Delete moved to a
  `DangerZoneCard` on a new `$categoryId` detail page — the shape ADR 0001 already required of
  Insecticides for the same reason. The two screens share one `CategoryForm` rather than a second
  pair of copies.

  The reason Delete is unavailable is stated in the detail page's own text rather than in a tooltip
  hung off the disabled button. A disabled button takes no focus, so the previous screen explained
  its own rule only to a mouse pointer that happened to hover.

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

- 524c7d7: Give the create screens and the two category editors a page heading

  #195 gave eight edit routes an `h1` and left the create routes alone, pending a copy decision;
  its note that those eight were the last gap was wrong. Ten form routes in Website Management still
  rendered no heading element — all eight create routes, plus the notice-category and
  document-category editors, which fell outside the eight #195 enumerated. Each was a page whose
  heading hierarchy started empty, so someone navigating by heading found nothing and the first
  thing on the page was a form field.

  All ten now open with `PageHeader`, in the same Headline treatment as the edit routes: "Create
  Notice", "Create Spray Mission", "Edit Notice Category", "Edit Document Category" — the action and
  the record type, with the record itself left to the breadcrumb. The wording is the string each
  route already passed as `formLabel`, so nothing is renamed; it simply moves from a fieldset
  `legend`, which names a field group and never enters the document outline, to the `h1` that does.
  Each route drops the now-duplicate `formLabel`, and `CategoryForm` takes the same optional
  `formLabel` the other six forms took in #195.

  Fields, validation, submit behaviour and navigation on success are untouched. No form route in
  Website Management is left without a heading.

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

- d14fd13: Give the edit screens the heading every other staff screen already has

  Eight edit routes — notices, meetings, documents, insecticides, job postings and spray missions in
  Website Management, plus employees in HR and Admin — rendered no heading element at all. Index
  screens get their `h1` from `RecordIndex` and detail screens from `RecordDetail`, so these were
  staff pages whose heading hierarchy started empty: someone landing there with a screen reader got
  no page title, and the first thing on the page was a form field.

  Each now opens with `PageHeader`, in the same Headline treatment as everywhere else. The heading
  names the action and the record type — "Edit Notice", "Edit Employee" — and not the record itself,
  because the breadcrumb already carries that: `Public Notices > <record> > Edit`. Naming the mode is
  also the only wording that never wraps.

  What used to stand in for a heading was the fieldset legend these forms passed as `formLabel`,
  which said the same words in a `legend` rather than an `h1` — a label for the field group, not a
  title for the page. The eight edit routes now pass the words once, to `PageHeader`, and omit
  `formLabel`; `FormWrapper` already treated it as optional and now says so. Nothing else moves:
  fields, validation, submit behaviour and the lifecycle buttons beneath the form are untouched, and
  the create routes keep their legends until their own copy decision is made.

  Two edit routes are deliberately left alone, because they are outside the eight this issue named
  and their copy has not been decided: the notice-category and document-category editors, which
  still carry a legend and no heading.

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

- 8381e83: Guard the Spray Mission lifecycle, and ask Delay for its rain date

  Cancelling a Meeting asked first and named the meeting. Cancelling a Spray Mission — the record
  residents actually close their windows and move pets for — fired on one click with no
  confirmation anywhere. DESIGN.md's Confirm Is For The Public rule covers both; it had only been
  swept through the domains that were cut over first.

  Cancel and Mark Complete now ask, naming the mission and saying what the public schedule will
  show. Mark Complete says the part that was invisible: Completed is terminal and offers no
  transition back. Reschedule stays unguarded — it puts a mission back on the schedule rather than
  taking one off, and it is the undo for the other two.

  Delay now collects the rain date `CONTEXT.md` says a delayed mission carries. It was setting the
  status and never asking, leaving the record in a state the glossary calls incomplete with nothing
  saying so. Setting one is a Save-and-Delay — `updateSprayMissionDetails` then
  `delaySprayMission`, one request, one transaction — which is exactly what the domain module
  prescribed and nothing had implemented.

  The missions index gains those transitions as row actions and a status filter. The register is
  seasonal, and out of season the default newest-first sort opened on a wall of Completed missions
  with no way to isolate what was still Scheduled. Delay is deliberately absent from the row menu:
  it has a rain date to ask for and a menu has nowhere to ask.

  `DateTimeInput` accepts `id` and `aria-describedby`, which land on the popover trigger. The date
  half of that control is a button rather than an `<input>`, so a `<label htmlFor>` beside it named
  nothing — the field read as "button, Select date" with no clue which date it wanted.

- fa8d19a: Give insecticides the detail page and danger zone ADR 0001 requires

  The insecticide commands were cut over before ADR 0001 settled, so `website.deleteInsecticide`
  landed correctly named but still fired from a plain destructive button at the bottom of the edit
  form. `insecticides/$insecticideId.tsx` splits into a read-only detail page and
  `$insecticideId_.edit.tsx`, matching the shape every other table in the app now has.

  **This is the case that shows the detail page is not about lifecycle.** Insecticides have no
  lifecycle columns, so the page carries no `LifecycleButton` and the edit form takes no `actions`
  render prop — `website.updateInsecticideDetails` is the only command the form can send. The page
  exists because `delete*` is the one command whose placement ADR 0001 does not leave free: detail
  page only, in a `DangerZoneCard`, behind a confirm. The refusal is unchanged — a spray mission
  still naming the product comes back as a 409 saying which one.

  `InsecticidesTable`'s `linkToEdit` prop becomes `linkToDetail`, following the rename the meetings
  slice made for the same reason: the row now opens the record, not the form. `apps/public` passes
  it `false` and is otherwise untouched.

- 0e49037: Give the layout shell the nav, so four applications stop rebuilding it

  DESIGN.md says the shell owns the chrome. It did not: `Layout.Sidebar.Content` was a slot, and
  each of the four staff applications filled it with its own copy of the same
  `items.map(SidebarMenuItem → SidebarMenuButton asChild → Link)` block. All four copies
  independently omitted the same two props, which is the tell that the seam was in the wrong place
  rather than that four people were careless.

  **`Layout.Sidebar.Nav` renders the rail now, and applications supply data.** It takes groups of
  `{ label, icon, linkProps }` and owns the two things everyone forgot. `tooltip` is what makes the
  icon-collapsed rail navigable at all — `SidebarMenuButton` has always supported it, rendering
  only while collapsed, and nobody passed it, so collapsing Website Management produced eleven
  anonymous glyphs including four near-identical document metaphors in a row. `isActive` is what
  tells a user where they are; without it nothing in the chrome ever changed between screens and
  the one place DESIGN.md spends Commission Green on state never fired. The active item also
  carries `aria-current="page"`, because the active state must not be carried by colour alone.

  Active matching is prefix-based so a drill-down keeps its parent lit — standing on
  `/notices/42/edit` shows Notices as current — with `/` exempted, since a loose root match would
  light Dashboard on every screen and mean nothing.

  `LinkComponent` is injected exactly as `LayoutBreadcrumb` already injects it, so `@mcmec/ui`
  still has no router dependency. The shell's entire knowledge of routing is one new required
  context field, `currentPath`, which each application sets once from `useLocation()`. Required
  rather than optional: an app that forgot it would render a rail where nothing is ever current,
  which is the state this field exists to end.

  **The unfiltered app switcher is now a compile error.** Three applications passed
  `filterAppsByPermissions(...)` to the switcher and Website Management passed `AVAILABLE_APPS`
  straight through, so from that app the switcher advertised HR and Admin to people without the
  roles to enter them — a dead end the chrome manufactured. Both values were `App[]`, so nothing
  caught it. `filterAppsByPermissions` now returns a branded `AccessibleApps`, which the layout
  context demands and only that function can produce. Website Management passes the filtered list;
  the type makes the old mistake unrepresentable rather than something to remember.

  **The rail remembers whether it was collapsed.** `SidebarProvider` has always written a
  `sidebar_state` cookie and nothing ever read it, so the setting was lost on every reload — and
  since switching applications is a cross-origin page load, that was constantly. `LayoutRoot` now
  reads it back into `defaultOpen`, defaulting to expanded when it is absent or unreadable.

  **Smaller things in the same surfaces.** The header's vertical rule now renders only when there
  is a breadcrumb beside it to divide; three of the four applications pass none, and each was
  drawing a dangling stroke in otherwise empty chrome and announcing a separator before no content.
  It is `aria-hidden` when it does appear. Website Management's eleven destinations are grouped —
  Publishing, Operations, Intake, Categories, each four items or fewer — instead of sitting flat
  under a heading reading "Menu"; the two- and three-item rails drop their heading entirely rather
  than label it with a word that divides nothing. Central's sidebar showed a group headed "My Apps"
  over empty content, a promise of a list that was never built on the one application every
  employee has, and now shows its one real destination. Central's error screen swaps `text-gray-600`
  and `text-red-600` for `text-muted-foreground` and `text-destructive`, the only raw greys left in
  the staff applications and a break in the hue-150 neutral family.

- 5f817b8: Bring notices and job postings to the lifecycle-action convention

  ADR 0001 was settled after these two tables had already been cut over, so both were built to a
  rule that did not exist yet. Neither was broken; both disagreed with the convention the
  remaining nine slices are meant to copy, which is what makes "copy the last slice" worth saying.

  **Every lifecycle action is now a button that fires its own command.** Notices publishes and
  archives from the detail view, the edit form and — for Publish/Unpublish — a list row. Job
  postings, whose lifecycle actions were reachable only from inside the edit form, gains all four
  on its detail view and Publish/Unpublish on its rows. `delete*` moves the other way: out of both
  edit forms and into a `DangerZoneCard` on the detail page, which is the one placement ADR 0001
  does not leave free.

  **Save-and-X is real now, and it changed a live bug.** The edit forms fired their lifecycle
  command immediately, so publishing with an unsaved title published the old one. A dirty form now
  relabels its button and sends one request carrying both intents, which `dispatch.ts` runs in a
  single transaction — so a refused `archiveNotice` takes the field save back with it, and
  `toastOnError`'s `savedTogether` sentence says so.

  **Dirtiness is a diff, not a flag.** `changedFields` compares the form's current values against
  the live row and drives both the relabel and the payload, so the two cannot disagree. TanStack
  Form's own `isDirty` is sticky — it stays true after the user reverts an edit — and a
  "Save and Publish" built on that would hand `update*Details` an empty payload, which its own
  non-empty refinement refuses with a 400. Dates compare by instant and Tiptap documents by
  serialisation, since both arrive as fresh objects on every render.

  **Two new shared pieces.** `RowActionsMenu` in `@mcmec/ui` is the shortcut surface a list row is
  allowed to be: presentational, vocabulary-free, and never the only way to reach a command.
  `runLifecycle` is app-local to `website-management` and is what composes the two intents, so
  `@mcmec/ui` still never learns a command name. Both forms gained an `actions` render prop rather
  than a plain node, because Save-and-X needs a read of the form's current values and the form
  should keep owning its state.

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

- bde63c1: Order the municipality picker by name, and let it be searched by name

  The spray-mission form listed municipalities in whatever order the collection happened to hold
  them — Electric's sync order, which is neither stable nor meaningful to someone looking for
  "Woodbridge". Both the create and edit routes now `orderBy` the municipality name, the way every
  other lookup select in the app already does.

  Searching that list did not work at all. `MultiComboboxInput` gives each `CommandItem` the
  option's id as its `value`, and cmdk filters on exactly that — so typing a municipality's name
  into "Search municipalities..." matched a list of uuids and emptied the popover. The label is now
  passed as `keywords`, which is what cmdk filters against in addition to the value, so the id stays
  the thing the item is keyed and toggled by.

  `ComboboxInput`, the single-select, had the same bug and takes the same fix. `keywords` is a
  separate argument to cmdk's filter and never reaches `onSelect`, which still receives the
  resolved value — the id. That matters because this is the picker behind Notice Type, Document
  Type and the insecticide select, all of which were being searched against uuids too.

  The insecticide query on both spray-mission routes is ordered as well. It sat four lines above
  the municipality one, with the same defect, on the same form.

- 8381e83: One detail page, and the answer to nine of them

  `RecordIndex` ended eleven copies of the same table. The screens those tables linked _to_ were
  still four different products: a Notice, a Meeting and a Spray Mission put their metadata in
  `<h4>`s inside a `.prose` article; a Job Posting used a `<dl>` in one card with its content in
  another; a Public Request used a two-column grid of `<p>`s; a Document had a bare link and no
  metadata vocabulary at all. Someone who had learned where the date sits on a Notice re-learned it
  on every other record.

  All nine now compose `RecordDetail`, which fixes two things beyond the arrangement:

  - **Metadata is a `<dl>`, not headings.** `<h4>Type: Legal</h4>` under an `<h1>` skips two levels
    and calls a value a section, so the outline a screen reader reads out was a list of sections
    containing nothing. The Insecticides page had already fixed this for itself, with a comment
    saying so; the fix never crossed the folder.
  - **The toolbar is not a `<nav>`.** Every page wrapped Back, Edit _and_ the lifecycle buttons in
    a navigation landmark. Publish and Archive are not navigation, and DESIGN.md already calls the
    shell's breadcrumb the only wayfinding above the page title.

  Three records also change what they lead with, because the index and the detail page disagreed
  about what the record _is_:

  - A **Spray Mission** is titled by its area with the date as subtitle. It was titled by date, so
    searching the index for a truncated area string landed you on a page called "Aug 14".
  - A **Public Request** is titled by the person. The dashboard's aging queue already names the
    resident and puts their address beneath, and then the page it linked to titled itself "Water
    Management" and demoted the person to a grey sub-label.
  - A **Job Posting** drops "Closed: Yes" from beside a badge already reading Closed, along with the
    raw Created and Updated timestamps no other detail page shows, and formats its one remaining
    date with `formatDateShort` like the rest of the product rather than the bare
    `toLocaleDateString` this page alone was calling.

- 8381e83: Give every record one spelling of its own state

  A record's state was a word, but which word depended on which screen you were standing on.

  **"In Progress" is gone.** `CONTEXT.md` is explicit — a Public Request is either New or Resolved,
  and the Commission does not track work in progress on one — and ADR 0001 records that the button
  convention deliberately dropped it. It survived in the display layer, so the status filter offered
  a third choice no command could produce, and it took the filled Commission Green while New, the
  state that actually needs someone, took the muted variant reserved for finished work. Those are
  now the right way round. The column's enum still carries the value, so a legacy row folds into New
  rather than pretending it cannot appear.

  **"Mosquito Fish" and "Adult Mosquito"** become _Mosquitofish_ and _Adult Mosquito Nuisance_ — the
  glossary's words, one of them the name of a fish and the other the name of a complaint.

  **A Meeting is Scheduled, not Pending.** It read "Pending" on the index and "Scheduled" on its own
  page, and a meeting whose date had passed read "Past" on one and "Scheduled" on the other, which
  was simply wrong. "Pending" was also already taken: in Notices it means published against a future
  date. `meetingStatus` now lives in one module that both screens read.

  **A Cancelled Spray Mission is no longer Refusal Red.** DESIGN.md reserves that colour for
  destructive commands and validation failures. A cancelled mission is neither — it is exactly what
  a cancelled Meeting is, and that badge is muted.

  **A Closed Job Posting is `secondary` on both screens.** The index already had the fix, under a
  comment explaining it; the detail page still shipped `destructive`. Both now read one shared map.

  **One verb for one act.** "Create New X" / "Add X" / "New X" become "Create X", and every create
  crumb is "Create". **SDS**, not MSDS, in every visible label. A Notice's date is "Notice date"
  rather than "Published on", which was false on a Draft.

  **`DangerZoneCard` stops asking "Are you absolutely sure?"** — a shadcn default sitting on the most
  consequential control in the product, while `row-actions-menu.tsx` one file over already wrote the
  rule down: say what will happen, naming the record. The dialog now names it, and the two call sites
  that passed no `recordName` — deleting a resident's submission, deleting a spray mission — now do.

- 0e49037: Give every staff screen one heading, and tell people which app they are in

  A re-critique of the layout shell found both of its worst remaining faults on the line where the
  previous pass stopped.

  **One page title, in one treatment.** Fourteen screens invented their own heading —
  `font-bold text-3xl`, `font-bold text-2xl`, `font-semibold text-2xl` — and two had none at all:
  the notices list opened on a button, and Central's home was an `h3` reading "Welcome Home!".
  DESIGN.md names a single Headline role for a staff page title and none of the three matched it.
  `PageHeader` now owns the arrangement — title, optional muted description, optional trailing
  actions — because the screens that drifted all had those parts and each had arranged them
  differently. Every `(app)` screen across the four applications uses it; no bespoke `h1` remains.

  This is a weaker guarantee than the branded `AccessibleApps` type, which makes its mistake
  uncompilable, and the difference is worth naming. The alternative was for the shell to derive the
  title from the last breadcrumb, which cannot be forgotten — but also cannot carry a description or
  an action button, and would have reflowed every screen that has one.

  **Collapsed, the rail now says which application you are in.** The switcher's
  "MCMEC / Website Management" block is clipped to a bare logo at icon width, and it was the one row
  in the rail without a tooltip — the exact guarantee `LayoutNav` makes for every destination.
  Four applications share one mark, one palette and one rail shape, so someone who works collapsed
  could act on the wrong application's data with nothing on screen to catch it. The switcher and the
  user row now carry tooltips, and the header band — empty but for a toggle in three of four
  applications — renders the active application's name while the rail is collapsed, and only then.

  **Breadcrumbs in all four applications.** Previously only Website Management rendered one, so the
  shell's best wayfinding component was off in three quarters of deployments, and HR's two employee
  routes had been declaring crumbs that rendered nowhere at all. Central, HR and Admin now collect
  matches and pass the trail the same way, each seeding a Dashboard crumb so a trail always reaches
  home, and each using `activeOptions: { exact: true }` so an ancestor crumb does not claim to be
  the current page.

  **The rail and the trail agree.** The rail said "Public Notices" while the breadcrumb for the same
  destination said "Notices". Since the crumb dedupe resolves in favour of the section route, that
  is the label that changed.

- 8381e83: Stop the register losing your place, and land on what you just created

  **Back keeps your place.** `RecordIndex` goes to real trouble to round-trip sort, page, search and
  filters through the URL, and then the most obvious control on the record — "Back to Notices" —
  navigated to the bare index and threw all of it away. Working a register one record at a time is
  exactly the workflow that state exists for. The row link now carries the index's search into the
  record, and the record's Back link hands it straight back.

  **Create lands on the record.** Every create route navigated to the index, so the one thing you
  were not shown was the thing you had just authored. Job Postings already did this correctly, with
  a comment explaining that the client-minted id is the id the row will have; the other six never
  got it.

  Also in this pass:

  - The Public Requests index gains Resolve and Reopen row actions. The register whose whole purpose
    is triage was the one with no triage shortcut.
  - The insecticide, municipality and category pickers are ordered by name. Two of them were ordered
    on the edit screen and unordered on the create screen — the same list, two orders.
  - `TiptapEditor` stops removing the focus ring without putting one back. It was the only place in
    the repo the system's single focus treatment was dropped.
  - `ErrorDisplay` stops asking for `font-mono`. Fira Code is declared in `globals.css` and never
    loaded, so that class silently rendered Courier New.
  - The router and query devtools are gated to development. They shipped unconditionally, so the
    floating devtools buttons sat on every production staff screen.
  - The insecticides form's description — the only form description in the application — is now
    grammatical, and says what the screen is actually for.

- 8381e83: Make publishing a Notice or Document an act, not a switch left on

  Creating a Notice opened a form whose "Publish Status" switch defaulted to on. Fill in the
  fields, press Create, and a statutory legal notice was on the public website — without anyone
  having decided to publish it. The Document form carried the same switch defaulted off, so the
  habit learned on one was wrong on the other.

  ADR 0001 says a lifecycle state is performed, never set, and grants create no exemption. Both
  switches are gone. `is_published` is no longer a form value at all: it travels with the submit's
  meta, so the two create buttons — "Create as Draft" and "Create and Publish" — run the same
  validation and the form has no publish state to leave in the wrong position. Editing was already
  correct and is unchanged.

  Also adds the router's missing pending component. The `(app)` shell verifies the session and
  preloads the employee row before it renders anything, and until now that gap was a blank page,
  which is indistinguishable from a broken one.

- 0e49037: Say what the Commission says, and make the breadcrumb do wayfinding

  **The rail uses the Commission's own words.** `CONTEXT.md` is the ubiquitous language, and two of
  Website Management's destinations disagreed with it. "Spray Schedule" is the term the glossary
  explicitly lists under _Avoid_ for **Spray Mission**, and "Weekly Activity" dropped a word from
  **Weekly Mosquito Activity**. Both are now correct in the rail, the breadcrumbs, the page heading,
  the dashboard card and the detail page's back link. This matters most to the person it was
  worst for: someone opening a seasonal screen for the first time in eight months searches for the
  word they use, and the rail was answering with a word the glossary forbids. The `/spray-schedule`
  route path is unchanged — the URL is not the interface. `apps/public` is untouched, since
  residents are not reading the staff glossary.

  **Breadcrumbs stop repeating themselves.** A section route and its index are two matches at one
  pathname and both declare a crumb, so trails read "Insecticides / Insecticides", "Documents /
  Documents" and "Notices / Public Notices Index". `LayoutBreadcrumb` now collapses crumbs that
  resolve to the same URL, keeping the section's name over whatever that one screen was called.
  Trailing slashes are normalised first, because an index route matches at `/spray-schedule/` while
  its section matches at `/spray-schedule`, and comparing the raw strings finds no duplicate at all.

  **The trail marks where you are, and reaches home.** `BreadcrumbPage` rendered only when a crumb
  had no `href`, and the consuming app gives every crumb one — so the current page was a live link
  and `aria-current="page"` was never emitted. The last crumb is now always the page. The `(app)`
  route seeds a Dashboard crumb, so a trail from `/notices/<id>/edit` reaches the dashboard instead
  of dead-ending at the section.

  One thing the shell cannot fix from inside: a TanStack `Link` to `/notices` reports itself active
  on `/notices/42` and sets `aria-current="page"` from that, which put the attribute on an ancestor
  crumb as well as on the real page. The router computes it internally and ignores an `aria-current`
  passed in from outside, so `getLinkProps` now sets `activeOptions: { exact: true }`. Both the prop
  and the README say why.

  **Two controls stop lying.** The app switcher printed ⌘1–⌘4 beside every application, inherited
  from the shadcn block it was built from; nothing ever listened for them, and they were not
  implementable as written because Chrome binds ⌘/Ctrl+1–8 to tab switching. They are gone. The user
  menu shipped permanently-`disabled` "Account" and "Notifications" for features MCMEC has never
  had — two thirds of that menu did nothing — and they are gone too. DESIGN.md's "don't hide a
  disabled action" covers an action that exists and is unavailable, not demo furniture.

  **One README, and it is true.** `README.md` documented a `LayoutProvider`/`LayoutInset` API that
  `index.tsx` has never exported, and `README-NEW.md` — the older file — promised those names as a
  compatibility layer that was never written and invented a "Public Notices" application. Both are
  replaced by one file describing what the shell actually is: the compound surface, the branded
  `apps` and required `currentPath`, what `Layout.Sidebar.Nav` guarantees, the two breadcrumb
  behaviours and the one the consumer owns, and the rail's persisted state.

- 8381e83: Close the gaps a code review found in this branch

  **The rain date opened a day early.** A `date` column reads back as UTC midnight, and
  `<Calendar selected>` compares against the local day — so the Delay dialog highlighted the day
  _before_ the one printed on the button beside it, everywhere west of Greenwich. An operator who
  trusted the highlight and corrected it wrote the wrong rain date to the public spray schedule.
  `@mcmec/lib` gains `toLocalDateOnly` and `toDateOnlyString`, the pair a date-only value needs to
  survive a round trip through a picker, and the Delay dialog uses them at both ends.

  **"Create and Publish" was the less guarded of the two buttons.** `SubmitFormButton` disables
  itself on `!canSubmit`; `LifecycleButton` takes a `disabled` this branch never passed. On an
  invalid or in-flight Notice, "Create as Draft" was greyed out while the irreversible public act
  stayed clickable — the exact inversion the switch removal existed to prevent.

  Also in this pass:

  - A Pending Job Posting takes the filled Commission Green again. DESIGN.md's Badges section says
    "Published and Pending take the filled Commission Green"; consolidating the two screens' maps
    had quietly canonised the muted variant reserved for finished work.
  - A Job Posting's `published_at` is a `timestamptz`, so it is formatted in local time by the new
    `formatTimestampDateShort` rather than by `formatDateShort`, which pins UTC for date-only
    columns and rendered an evening publish as the next day.
  - Insecticides gains the Edit row action every other register has. It was the register whose
    records change most often and the one that made an edit three navigations.
  - Creating a Job Posting is at `/job-postings/create`, not `/job-postings/new`. The copy had
    already been corrected to "Create"; the URL had not.
  - A Document's detail page stops listing Category and Fiscal year beneath a title that already
    reads `${fiscal_year} ${type}`.

- 0e49037: Close the remaining critique findings on the staff shell

  **Two more invariants become types.** `activeApp` was the one field in the layout context with a
  documented rule — "must match an `AVAILABLE_APPS` name" — and nothing enforcing it; it is now the
  `AppName` union. That also retires the switcher's `if (!activeApp) return null`, which answered a
  typo by deleting the sidebar header: the agency's mark and the only route out of the application.
  `onLogout` becomes required, because optional meant an application could ship a "Log out" that
  did nothing.

  **The sidebar stops showing debug text.** All four applications rendered the literal strings
  `"[missing name]"` and `"[missing title]"` — placeholders that doubled as the loading state, so
  every user saw bracket notation in the sidebar of a public agency's tool until Electric synced.
  `user.name` and `user.title` are optional now and `NavUser` renders a skeleton while they are
  absent.

  **The app switcher answers the question people actually have.** Every application was listed
  identically, including the one you were already in, so finding the one you wanted meant reading
  all four. The current application now carries a check and an `(current)` announcement for screen
  readers — kept in the list rather than filtered out, because seeing where you are is the point.
  Each row also shows its description, which was being fetched into context and discarded. DESIGN.md
  calls the same copy load-bearing on the public navigation, on the grounds that it is how someone
  who does not know the difference picks correctly; a staff member returning to a seasonal task
  after eight months is exactly that person.

  **The refusal screen offers a way out that fits the likeliest cause.** "Go to Central" assumed the
  account was right and the role was missing. When the account is simply the wrong one, Central is
  where that same account lands, so there was no route back to a sign-in form from inside the
  application. Sign out sits beside it now.

  **Headings reach the detail pages.** Nine of them titled the record with an `h2` and no `h1` above
  it — a hierarchy that starts at level two. They are `h1` in the Headline treatment now. The eight
  edit forms still have no heading at all and are left for a follow-up; each needs a title decided
  rather than promoted.

  **Smaller things the critique named.** The redundant `TooltipProvider` in three applications is
  gone, since `SidebarProvider` has always supplied one and the shell's README says so. Content
  padding moves from 16px to the system's 24px step. Two stranded comments in the barrel file,
  stated above unrelated exports after an import sort, are removed.

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

- 0e45e28: Give rendered rich text its documented vertical rhythm

  Bulleted lists in Notices, Job Postings and Meeting notes used roughly twice the vertical space they
  needed. A four-item list of insecticide products filled a card preview on its own; a thirteen-item
  meeting list ran most of a screen.

  Two causes, both measured rather than guessed.

  **The existing `.prose` overrides had never applied.** `@tailwindcss/typography` emits its rules into
  the `utilities` cascade layer, and layer order beats specificity — so `.prose p { @apply my-2 }`
  written inside `@layer base` lost to the plugin however specific it was. Paragraphs shipped at the
  plugin's 20px the whole time, while DESIGN.md documented 8px. The rules now sit unlayered, which
  outranks every layer, and DESIGN.md records why so they do not get tidied back into a layer.

  **A list item's paragraph was being treated as a paragraph.** TipTap's StarterKit wraps each list
  item's content in its own `<p>`, so the paragraph rule fired _inside_ every `<li>`, adding 20px above
  and below the text of each bullet on top of the item's own margins. Measured on a real notice: item
  pitch dropped from 46px to 26px for a 26px-tall item, and the gap between bullets from 20px to 2px. A
  paragraph that is the only child of a list item is now the item and takes no margin; only a second
  paragraph within one item is treated as a paragraph.

  Also in this pass: rendered bodies are capped at `max-w-[70ch]`, which DESIGN.md has always required
  and `max-w-none` had always defeated; the editor uses the same measure so an author lays out the line
  breaks a reader will get; and `prose-sm` is gone, so a legal notice is no longer served at 14px on a
  phone. Headings, blockquotes and nested lists get the same rhythm, and a rendered body no longer adds
  a leading or trailing gap inside the card that already owns its padding.

  **Rendered bodies now line up with the headings above them.** The renderer also carried its own
  `px-4 py-3`, which indented a notice's body 16px past its title and date on every surface that
  renders one — the public detail page, the staff detail page, and the notice cards. Every caller
  already sits inside something that owns its spacing, so the padding moved to them: body text now
  shares a left edge with its heading, and the four detail pages ask for the gap under their metadata
  themselves.

- Updated dependencies [0e49037]
- Updated dependencies [0e45e28]
- Updated dependencies [62f332a]
- Updated dependencies [7cca6ff]
- Updated dependencies [9b0ea3c]
- Updated dependencies [ecb366f]
- Updated dependencies [4e17f16]
- Updated dependencies [30bef37]
- Updated dependencies [0e45e28]
- Updated dependencies [5548a61]
- Updated dependencies [1b5e787]
- Updated dependencies [8fe2bff]
- Updated dependencies [d14fd13]
- Updated dependencies [9f288ec]
- Updated dependencies [2851986]
- Updated dependencies [8381e83]
- Updated dependencies [fa8d19a]
- Updated dependencies [229923c]
- Updated dependencies [30bef37]
- Updated dependencies [0e49037]
- Updated dependencies [5f817b8]
- Updated dependencies [a88e150]
- Updated dependencies [976244f]
- Updated dependencies [3960d61]
- Updated dependencies [d00dfe1]
- Updated dependencies [e6877ea]
- Updated dependencies [3b8822d]
- Updated dependencies [0562505]
- Updated dependencies [f811615]
- Updated dependencies [bde63c1]
- Updated dependencies [06e9b54]
- Updated dependencies [a09f4b4]
- Updated dependencies [4515e79]
- Updated dependencies [8381e83]
- Updated dependencies [8381e83]
- Updated dependencies [0e49037]
- Updated dependencies [8381e83]
- Updated dependencies [3dd1ec0]
- Updated dependencies [0e49037]
- Updated dependencies [0e45e28]
- Updated dependencies [8381e83]
- Updated dependencies [ab92401]
- Updated dependencies [0e49037]
- Updated dependencies [62f332a]
- Updated dependencies [0f3b49b]
- Updated dependencies [efc7409]
- Updated dependencies [2aefe19]
- Updated dependencies [0e49037]
- Updated dependencies [32de0ba]
- Updated dependencies [30bef37]
- Updated dependencies [51aef15]
- Updated dependencies [0e45e28]
- Updated dependencies [66e8715]
  - @mcmec/ui@1.7.0
  - @mcmec/lib@0.10.0
  - @mcmec/sync@1.0.0
  - @mcmec/schemas@3.0.0
  - @mcmec/domain@0.1.0
  - @mcmec/auth@0.4.2

## 1.0.1

### Patch Changes

- Updated dependencies [cae7305]
  - @mcmec/lib@0.9.1
  - @mcmec/auth@0.4.1
  - @mcmec/supabase@2.0.1
  - @mcmec/ui@1.6.1

## 1.0.0

### Major Changes

- 76ce7e8: Railway migration Phase 4 — rewire the `website-management` app to the new backend.

  **website-management** — auth moves to the Better Auth cookie client, with the app self-hosting its own `/login` and the `(app)` guard verifying `manage_website` (renamed from `public_notices`). All content reads stream from ElectricSQL collections and writes go through the Hono API.

  The four public-intake surfaces (adult mosquito, mosquitofish, water management, contact submissions) collapse into **one "Public Requests" section** backed by the merged `public_requests` table, with request-type and status filters, a triage view that renders each type's `details` generically, and delete. Staff-entered requests are gone: the backend accepts submissions only from the public site's Turnstile-gated intake endpoint, so the four staff create-forms were removed along with the per-type tables and edit forms.

  Spray-schedule municipality links now go through the API's junction endpoints, and the weekly-activity CSV upload posts to the bulk import endpoint — which replaces only the years present in the file instead of wiping the whole dataset, so the confirmation copy changed to match. Audit columns (`created_by`/`updated_by`) are gone from every form and the "Creator" column was dropped from the notices and documents tables. Requires `VITE_API_URL`.

  **@mcmec/supabase** — the notices collection factory gained an on-demand `mosquitoActivityData` collection so the weekly-activity charts read live instead of paging through PostgREST.

  **api** — new `GET /api/spray-schedules/municipalities` (gated `manage_website`) returning the junction rows. The junction has a composite primary key and no `id`, so it can't be an Electric collection; this is its read path.

- 76ce7e8: Rename the `notices` app to `website-management`.

  The app long ago outgrew its name — it manages every kind of content published on the public website (notices, meetings, insecticides, spray schedules, documents, service requests, weekly activity), not just notices. The workspace package and directory are now `website-management`, the UI calls it "Website Management", and the dev server moved from port 3002 to 3006 (3002 collides with other local tooling).

  The `notices` domain itself is unchanged — the `notices` table, its collections, and the public site's `/notices` routes keep their names.

  **Deployment follow-up:** the production subdomain moves `notices.middlesexmosquito.org` → `website.middlesexmosquito.org` (declared in `@mcmec/lib`'s app registry and the API's `TRUSTED_ORIGINS`), and the Vercel project's root directory must be repointed at `apps/website-management`.

### Patch Changes

- 76ce7e8: Seed edit forms from the live row instead of a one-shot read.

  Route loaders read a collection once — `await c.preload()` then `c.get(id)`. `preload()` resolves when the sync layer marks the collection ready, which Electric does on the `up-to-date` control message — and that message does not mean "current as of now". It arrives on the log catch-up request, which the shape proxy passes through with Electric's `cache-control: public, max-age=60, stale-while-revalidate=300`. A cold page load can therefore replay a cached catch-up ending in `up-to-date`, mark the collection ready, and hand the loader rows up to ~60 seconds old, or ~6 minutes under stale-while-revalidate. The live long-poll lands moments later and the collection converges, but the loader has already read.

  That was not merely cosmetic. `onUpdate` sends the diff between the submitted form value and the live collection row, so any field left stale in the seed differs from current and is written back — silently reverting whatever else had changed, with no error and no warning. The previous PostgREST reads were always current, so this only appeared with the move to synced collections.

  The five edit routes (notices, documents, meetings, insecticides, spray schedules) and the two detail views (notices, documents) now read their record from a live query. Because TanStack Form reads `defaultValues` only on mount, re-seeding means remounting, so the form carries a `key` derived from the row's `updated_at`. That key is latched on the first focus inside the form: until you touch it, it tracks the live row; afterwards it is yours, and a sync landing mid-edit will not pull text out from under you. Whoever saves last wins.

  The spray schedule's municipality set lives in a separate collection with no `updated_at` of its own, so its linked ids are folded into the version stamp.

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

- 76ce7e8: Give `spray_schedule_municipalities` a surrogate `id` so the junction can sync as a collection.

  **api** — migration `0003` drops the composite primary key, adds `id uuid primary key default gen_random_uuid()`, and keeps the pair unique via `spray_schedule_municipalities_pair_key`. Existing rows keep their pairs and pick up generated ids. Writes still go through `PUT /api/spray-schedules/:id/municipalities` — replacing a schedule's whole set is one transaction, not a series of row writes — but the short-lived `GET /api/spray-schedules/municipalities` added alongside it is gone, since clients now read the junction from its Electric shape.

  **@mcmec/supabase** — new `SprayScheduleMunicipalitiesRowSchema` and a read-only `sprayScheduleMunicipalities` collection in the notices factory.

  **website-management** — the spray-schedule screens read municipality links from the collection instead of polling an endpoint, so a municipality write syncs back on its own with no query invalidation.

- f609219: Keep every deployment except the production public site out of search results.

  `public` sets `X-Robots-Tag: noindex, nofollow` from a Nitro response hook and serves a
  `Disallow: /` robots.txt whenever it is not production, so staging cannot be indexed as a
  duplicate of the Commission's official channel for legal notices. The switch asks whether the
  environment _is_ production rather than whether it is staging, so a service missing its
  configuration declines to be indexed instead of quietly appearing in search results.

  The four staff apps carry a `noindex` meta tag and a `Disallow: /` robots.txt in every
  environment — they have no public audience anywhere.

- Updated dependencies [cf2e2aa]
- Updated dependencies [d1cc9c7]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
  - @mcmec/lib@0.9.0
  - @mcmec/supabase@2.0.0
  - @mcmec/auth@0.4.0
  - @mcmec/ui@1.6.0

## 0.10.2

### Patch Changes

- Updated dependencies [803e1f7]
  - @mcmec/ui@1.5.2

## 0.10.1

### Patch Changes

- c45311a: Simplify meeting documents into a single bundled link by dropping the `agenda_url` and `report_url` columns — the consolidated document now lives in `minutes_url`. Updates the notices form, the shared meetings table and mobile list, and the public meetings page to match. Also refreshes the public Job Opportunities page opener with MCMEC's mission and benefits.
- Updated dependencies [c45311a]
  - @mcmec/ui@1.5.1
  - @mcmec/supabase@1.7.1

## 0.10.0

### Minor Changes

- 74f924d: Add mosquito spray schedule feature with admin CRUD in notices app, public display with filters at /spray-schedule, new TimeField and MultiComboboxField UI components, and dashboard integration.
- d7980a2: Add weekly mosquito activity feature with CSV upload in notices app and recharts-powered visualization on the public site at /mosquito-surveillance/weekly-activity.

### Patch Changes

- Updated dependencies [705816d]
- Updated dependencies [744da27]
- Updated dependencies [74f924d]
- Updated dependencies [d7980a2]
  - @mcmec/ui@1.5.0
  - @mcmec/supabase@1.7.0

## 0.9.1

### Patch Changes

- Updated dependencies [b37462b]
  - @mcmec/supabase@1.6.0
  - @mcmec/lib@0.8.0
  - @mcmec/auth@0.3.1
  - @mcmec/ui@1.4.5

## 0.9.0

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

### Patch Changes

- Updated dependencies [0f84145]
  - @mcmec/supabase@1.5.0
  - @mcmec/ui@1.4.4

## 0.8.0

### Minor Changes

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

- b9b91e2: Centralize login through central app with branded auth layout. PKCE flow with shared cookie domain for production, hash fragment tokens for local dev. Add processAuthRedirect and getCentralLoginUrl helpers.
- Updated dependencies [b9b91e2]
- Updated dependencies [1a77b67]
- Updated dependencies [8dc9b46]
- Updated dependencies [5c3f9fd]
  - @mcmec/auth@0.3.0
  - @mcmec/lib@0.7.3
  - @mcmec/supabase@1.4.0
  - @mcmec/ui@1.4.3

## 0.7.3

### Patch Changes

- 95e01c3: Move shared assets to Supabase Storage. Remove packages/assets, sync-assets build step, and shx dependency. Apps now import asset URLs from @mcmec/lib/constants/assets.
- Updated dependencies [187f5d9]
- Updated dependencies [95e01c3]
- Updated dependencies [501ef75]
  - @mcmec/lib@0.7.2
  - @mcmec/supabase@1.3.1
  - @mcmec/ui@1.4.2
  - @mcmec/auth@0.2.1

## 0.7.2

### Patch Changes

- 2cea2d6: Rework auth flow to use email-based invites via Resend SMTP. Replace create-account edge function with invite-employee. Add set-password, forgot-password, and reset-password pages to central. Update both apps to use @mcmec/auth package with typed errors.
- 2affcd1: Replace user_profiles table with employees table. Employees table tracks all agency staff with optional auth user linkage. Rename profiles collection/accessor to employees across supabase package and notices app. Remove avatar_url field. Regenerated database types.
- dcf90f1: Hotfix for explicit build output directory on Vercel configuration.
- Updated dependencies [a8b88f5]
- Updated dependencies [2affcd1]
- Updated dependencies [184752c]
  - @mcmec/auth@0.2.0
  - @mcmec/lib@0.7.1
  - @mcmec/supabase@1.3.0
  - @mcmec/ui@1.4.1

## 0.7.1

### Patch Changes

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

- Updated dependencies [43272a7]
  - @mcmec/supabase@1.2.0
  - @mcmec/lib@0.7.0
  - @mcmec/ui@1.4.0

## 0.7.0

### Minor Changes

- 43306d2: 📱 Public App (apps/public)
  Notice System: Added legal notice descriptions, improved feed layouts, and added an archive view. (Fixes #20)
  Meetings Page: Introduced year-based filtering and a revamped layout for better readability. (Fixes #27, #26)
  Navigation: Enhanced the mobile navigation bar layout and integrated the official logo.
  SEO & Content: Updated heading levels for better accessibility and SEO on the "How We Control Mosquitoes" page.
  Cleanup: Removed the unused scroll indicator component from the homepage.

  ✍️ Notices Management App (apps/notices)
  Form Validation: significantly enhanced validation logic across all forms (Notices, Meetings, and Insecticides) with more descriptive error messages. (Fixes #3)
  Security: Updated title fields to require a minimum of 5 characters to prevent low-quality entries.
  Tables: Added visual sort indicators to all data columns for easier navigation.

  🛠️ UI Component Library (packages/ui)
  Table Enhancements: Implemented column sort indicators for the Meetings and Insecticides tables.
  Mobile UI: Updated the mobile list view for meetings.
  Layouts: Refined the root layout and "Not Found" error pages.

  🏗️ Central App & Core Library (apps/central | packages/lib)
  Asset Management: Streamlined how images and files are handled; removed several unused asset URLs and updated global constants. (Fixes #22)
  Shared Logic: Updated centralized error constants and validation schemas to support the new form requirements.

### Patch Changes

- b5445c3: Fixed insecticides table linking.
- Updated dependencies [b5445c3]
- Updated dependencies [43306d2]
  - @mcmec/ui@1.3.1
  - @mcmec/lib@0.6.3
  - @mcmec/supabase@1.1.1

## 0.6.0

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

- Updated dependencies [ad6a006]
- Updated dependencies [9dc254d]
- Updated dependencies [519868d]
  - @mcmec/ui@1.3.0
  - @mcmec/supabase@1.1.0
  - @mcmec/lib@0.6.2

## 0.5.4

### Patch Changes

- Updated dependencies [1bc6947]
  - @mcmec/ui@1.2.1

## 0.5.3

### Patch Changes

- 456bdae: Turned public notice card into a preview card with callbacks to navigate to notice page and share URL.
  Added a new route in public to display a notice.
  Modified design of notice route in notice manager.
- Updated dependencies [456bdae]
  - @mcmec/ui@1.2.0

## 0.5.2

### Patch Changes

- Updated dependencies [d00a319]
- Updated dependencies [fb040ad]
  - @mcmec/ui@1.1.0
  - @mcmec/lib@0.6.1
  - @mcmec/supabase@1.0.2

## 0.5.1

### Patch Changes

- 3f9666d: Created date functions and refactored all date displays in apps to properly render.
- 895f42b: Fixed dashboard incorrectly showing pending notices (set to publish on a future date).
- a142c42: Public notices tables now default to sorting by notice date descending.
- Updated dependencies [3f9666d]
  - @mcmec/lib@0.6.0
  - @mcmec/ui@1.0.1
  - @mcmec/supabase@1.0.1
