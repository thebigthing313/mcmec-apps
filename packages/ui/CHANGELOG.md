# @mcmec/ui

## 1.7.1

### Patch Changes

- 59c86a6: Ask "Access to Premises" on the service request form as a Yes/No choice instead of a toggle. Residents were unsure which way the switch meant yes; two labelled options make the answer explicit. Adds a `RadioGroupField` to the shared form fields.

## 1.7.0

### Minor Changes

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

- 7cca6ff: Make Weekly Mosquito Activity readable without seeing it

  The page rendered eight charts and nothing else. To assistive technology it was eight unlabelled SVGs, and the plotted figures existed nowhere else on the page — chart-only data with no text equivalent, which is WCAG 1.1.1 at Level A.

  **Each chart now carries its numbers.** A `Show the numbers` disclosure under every chart opens a real table — week, current-year count, five-year average, rainfall — with a caption, column headers, and the week as a row header. Closed by default, so the page looks as it did, but open to anyone: a resident who wants the actual count for their week no longer has to read it off a line.

  **Each chart is one labelled image rather than a heap of fragments.** `role="img"` with a summary label collapses the recharts subtree, which would otherwise announce a stream of unlabelled groups and tick text that conveys nothing. The label names the series and the week range and says the figures follow in a table.

  **Each chart title is a heading.** `CardTitle` renders a `div`, so eight titles sat on the page and none appeared in the heading outline — the page's only headings were its `h1` and the footer's. They are `h2`s now, each labelling a `section`.

  **The series colours come from the palette.** They were `#000000`, `#ec4899` and `#3b82f6` — hex literals in a product whose tokens are the visual authority. The current year takes Commission Green, the five-year average takes `chart-1` and stays dashed so the two are distinguished by stroke pattern and not by colour alone, and rainfall takes `chart-5`.

  **The chart palette itself was unusable and is now fixed.** Measured against the card ground, `chart-2` came out at 1.90:1, `chart-3` at 2.17:1, `chart-4` at 1.49:1 and `chart-5` at 1.85:1 — all under the 3:1 that WCAG 1.4.11 requires of a graphical object carrying meaning. They were pastels, which work as large filled areas and fail as plotted lines. Each hue is kept and its lightness pulled down until it clears 3:1, with chroma raised to stay vivid; `chart-1` already passed and is unchanged. Nothing else in the monorepo consumed these tokens, so the change is contained to this chart. New ratios: 3.68, 4.00, 3.86, 3.65, 3.46.

  The rainfall bars were also drawn at `opacity={0.3}`, putting them at **1.41:1** — the one element on the chart with a filled area was the hardest thing on it to see. They render at full opacity now.

  `DESIGN.md` is updated to match: the new values, why they moved, and the note that the current-year series is drawn in Commission Green rather than from the series palette.

- 4e17f16: Give every re-keyable value on the Public Request detail screen its own copy button.

  `@mcmec/ui` gains a `CopyButton` block: one value, one button, confirming by icon swap and
  raising an error toast only when the clipboard write is refused. `RecordDetail` takes an opt-in
  `titleCopyText`, and `RecordDetailField` an opt-in `copyText` — the eight other detail screens
  pass neither and are unchanged.

  On Public Requests the metadata list now shows address line 1 and line 2 as separate rows and
  zip code, city and state as three, so each button copies exactly the string beside it rather
  than the joined, em-dashed version composed for reading. The details panel copies each free-text
  block, and the "Reported" group copies its true flags as one comma-joined line.

- 30bef37: Fix the focus ring across every frontend, clear the shell's reflow failure, and put the public record on the landing page.

  The focus ring was `oklch(0.5353 …)` at 50% opacity and `--primary` is `oklch(0.5364 …)` — the same lightness — so on the public navigation bar it measured 1.00:1 against its own ground, and 1.95–2.05:1 on every light surface. It is now opaque and dark (9.47:1 on Paper, 3.27:1 on Brackish Teal), and inverts to the pale foreground on Commission Green (4.62:1). This touches all five frontends.

  The public navigation bar needs 842px and was taking over at 768px, so every page scrolled horizontally from 768 to 856 — including a 1536px desktop at 200% zoom. The handover moves to `lg`. The bar also gains a `header` landmark, labels on all four `nav` landmarks, a painted active state driven by the `aria-current` TanStack was already emitting, and 24px touch targets.

  The landing page gains a record strip: next Spray Mission, latest Legal Notice with its date, next Public Meeting — each with a written empty state, none of them claiming "tonight". Its queries are capped so the front door renders whether or not the api answers.

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

- 2851986: Give Brackish Teal a foreground that actually contrasts with it

  The public footer measured 2.17:1, the worst contrast on the site, on the band carrying the office address, phone number and Transparency link on every page. Chasing it found the real defect one level up.

  `--accent-foreground` was a near-white on `--accent`, a mid-tone teal: **2.86:1**, well under the 4.5:1 AA floor for normal text. The footer only made it worse by adding a `/70` alpha on top. And that pair is not a footer choice — it is shadcn's hover and focus state, so 2.86:1 was every hovered dropdown item, menubar entry, context-menu row, command item, calendar cell and outline button **across all five frontends**. DESIGN.md named the pair Brackish Teal and Brackish Teal _Contrast_, which is presumably how it survived this long: the token was named for a property it did not have.

  `--accent-foreground` is Ink now: **5.22:1** on the same teal, one token, fixing every one of those surfaces at once. Brackish Teal itself is untouched. Darkening the ground to rescue the near-white would also have cleared AA, but it was rejected on appearance rather than on the ratio: the teal is a hover tint on hundreds of surfaces, and taking it that dark makes every one of them visibly heavier to rescue the foreground that was at fault. Light mode only: in dark mode `--accent` is a near-black whose near-white foreground already measures 14.48:1, where Ink would be 1.05:1.

  The footer drops its `/70` and keeps its teal ground.

  **Also fixed, found while measuring:** the public nav bar's link hover and focus used `accent/40`, a pale teal laid over Commission Green. It lifted the ground and took the white label from 4.62:1 at rest to **3.96:1** — so pointing at a nav link, or tabbing to it, was the one interaction on the page that pushed it under AA. Hover and focus now darken the green instead of lightening it, at 5.56:1.

  `DESIGN.md` moves with the tokens, as it did for the chart palette. The `brackish-teal-contrast` entry is gone rather than restated — it held the near-white, and its replacement is Ink, which the palette already names; a second token for one colour, still called _contrast_, would re-create the naming that hid this. `button-outline-hover` now cites `{colors.ink}` directly, the Brackish Teal entry records the pair and the ratio it lacked, and the public nav bar's darkening hover is written down as the stated exception it is.

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

- 3b8822d: Rebuild the public masthead as a two-tier identity rail over the navigation, and fit the home page's four bands into one viewport.

  The seal now sits on a light ground at 80px, from `logo192` rather than the square-tiled 128px file. Its disc is transparent, so on Commission Green the arced lettering sat straight on the green and dissolved — the old white "puck" was a crude fix for that, and a fully rounded shape besides, which The Pill Is A Status Rule reserves for record state. The identity rail carries the Commission's name and, in the slot and treatment "Established 1914" held, the standfirst that used to open the home page. Below `lg` the Menu button moves into the rail and the green navigation tier goes entirely — a 56px strip holding one button is 56px of a sticky header charged against a phone viewport for the whole visit — and below `sm` the name steps down to 11px and wraps rather than shortening to an initialism — "MCMEC" identifies the agency only to someone who already knows it, and most arrivals come from a search result knowing nothing. That puts the phone masthead at 65px against the 198px a shared three-band header first measured. The full name and the standfirst move into the navigation sheet, which has the room the rail does not; the sheet keeps "Menu" as its accessible name, because a navigation panel that announces itself as the agency's name tells a screen-reader user nothing about what opened.

  The rail renders at every width: it was briefly desktop-only, which cost a phone visitor the seal, the name and the description, and left the two form factors with different information architectures. The mobile puck is gone with it.

  The home page drops its visible `h1` and standfirst to the masthead, keeping an `sr-only` heading so the route still has one. The hero splits one third register to two thirds photograph, the six destinations stack as equal cards, and the band is `h-[calc(100svh-10rem)]` — the masthead is deliberately fixed at 104px + 56px so that arithmetic holds — so identity, navigation, photograph and record strip land in one viewport with the footer below the fold. Two columns of destinations between `sm` and `xl`, one below and above.

  The footer's band takes a near-black `--footer` / `--footer-foreground` pair instead of borrowing shadcn's `accent`, which is the hover-and-focus state on hundreds of surfaces across five frontends. White on it reads 15.85:1. The standard focus ring measures 1.55:1 on that ground, under what WCAG 1.4.11 asks of a focus indicator, so the band inverts the ring to its own white foreground — the same move Commission Green already makes. The county mark is flattened to white there, since its dark half was within a shade of the new ground.

  `VITE_ASSETS_ORIGIN` optionally overrides the brand-image origin, which otherwise stays production. Unset it behaves exactly as the hardcoded origin did; set to a local api it shows images a branch adds before that branch reaches `main`. The public app's CSP reads the same variable so the policy and the page cannot disagree about where images come from.

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

- a09f4b4: Fix the mechanical WCAG failures on the public site, mostly in shared components

  Six accessibility defects, found by measuring the live DOM rather than reading the source. Most of them were one shared component away from being fixed everywhere at once, which is why the public site had them at all.

  **Checkboxes had no accessible name.** `CheckboxField` rendered its `<Label>` without `htmlFor`, and did not hand the label to `FormField` either — so the Radix checkbox was a button with no name, and clicking the visible text did not toggle it. Six controls on the adult mosquito form alone. One attribute; every checkbox in every MCMEC frontend was affected.

  **The zip code label pointed at nothing.** `AutoComplete` never put an id on its input, so `FormField`'s `htmlFor` matched no element in the page and the visible "Zip Code" label was decorative. The input now takes the field's id.

  **The phone extension input had no label of any kind** — no id, name, `aria-label` or placeholder, only a visual "ext." addon that assistive technology cannot see. It now carries an `aria-label`, an id and a name.

  **The read-only City input was unlabeled** for the same reason, on all three request forms.

  **Required-ness was visual only.** Callers typed the marker into the label text (`label="Full Name *"`), which put a bare asterisk in the accessible name — the field announced as "Full Name star". `FormField` takes a `required` flag now: it draws the asterisk itself with `aria-hidden`, adds a screen-reader-only "(required)", and the text, textarea, phone and autocomplete fields forward `aria-required` to their control. Fourteen labels across the three public request forms converted. `CheckboxField` withholds its label from `FormField` deliberately, so it does not take the flag at all rather than accepting it and drawing nothing.

  **No skip link on the public site.** WCAG 2.4.1 is Level A, and seven nav groups with their popovers sat between a keyboard user and the page on every navigation. `apps/public` had carried the `#main-content` target all along with nothing pointing at it — while the staff layout, which does have a skip link, carried a comment asserting the public site already had one. The link is now a shared `SkipLink` block used by both, so there is a single implementation to be right or wrong, and public's `<main>` takes `tabIndex={-1}` so the jump actually lands.

  **Every interior page opened with an out-of-order heading.** `SectionSidebar` rendered its section title as an `h2` that precedes the page's own `h1` in DOM order, so the real page title was the second thing in the outline on all six interior public pages. It is an eyebrow, not a heading, and the nav around it already carries an `aria-label` built from the same string, so it is a `div` now. No visual change.

  Not included, and still outstanding: the eight charts on Weekly Mosquito Activity have no text or tabular alternative, and the footer's `text-accent-foreground/70` on `bg-accent` measures 2.16:1 against a 4.5:1 requirement. Both need a visible design decision rather than a wiring fix.

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

- 0e45e28: One index page, and a brand colour that finally passes AA

  A critique of `/notices` scored it 13/40 and found the same faults sitting in all eleven staff index routes. Two fixes here: the colour, and the screen.

  **The `primary` / `primary-foreground` pair was failing WCAG AA and nobody had measured it.** White-on-Commission-Green measured **4.24:1** against the 4.5:1 floor for normal-size text, and that pair paints every primary button in five frontends, the skip link in `mcmec-layout`, and every filled status badge at 12px. The foreground is lightened to `oklch(0.985 0.0199 112.9333)`, which measures **4.63:1** on the real rendered elements. Commission Green itself does not move — it is a brand commitment — and the warmth stays, because removing the chroma entirely shifts the ratio by 0.02 and buys nothing. DESIGN.md now records the measured number, which it never did before.

  **`RecordIndex` replaces the eleven hand-rolled index pages.** The duplication was the argument for extracting it: nine copies of the sortable column header, none emitting `aria-sort`; eight copies of the same forty-five-line pagination footer; six different spellings of the empty state; three incompatible ways of getting from a row to a record; and zero loading states anywhere, so every index announced "No results." while its Electric shape was still streaming. On a statutory public record, "there are no notices" is a sentence with legal weight and must never be said by accident.

  The block is opinionated on purpose. `renderRowLink` is required, so an index that cannot be operated by keyboard does not compile — four of the eleven made the whole `<tr>` a click target with no anchor, which left a screen-reader user on a terminal page and cost everyone middle-click and open-in-new-tab. `getRowLabel` is required, because ten triggers all called "Row actions" tell a screen reader nothing about which record is about to change. `state` and `emptyState` are required, because loading and empty are different screens.

  It also adds what no individual route was ever going to add for itself: sort, page, size and search persisted in the URL so returning from a record lands where you left; a debounced search field that keeps its own draft (writing each keystroke to the URL loses focus mid-word and turns the back button into an undo log); a live result count; skeleton rows; and a default page size of 25 rather than 10, because these screens are read at a desk on a large display.

  Per-domain choices stay with the route — columns, `rowActions` builders, which lifecycle actions a row offers, filter dimensions, default sort — so ADR 0001's seam is preserved exactly: the route owns the command vocabulary and passes it in, and the block never learns it.

  **`RowActionsMenu` can now ask first.** A `confirm` on a row action opens an alert dialog naming the record. Unpublishing a Notice removes a statutorily posted legal notice from the public website and previously did it in one click with no confirmation and no acknowledgement, while `delete*` — less publicly consequential — had a whole danger zone. `toastOnError` gained a `success` option for the same reason: a command whose entire effect lands on a website the user is not looking at owes them a sentence when it works.

  `/notices` is migrated as the reference implementation and `notices-table.tsx` is deleted. The rest of the record indexes follow in the same release — see the accompanying changeset.

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

- 0e49037: Make the staff shell navigable without a mouse

  The public site has had a skip link and semantic landmarks all along. The four staff
  applications — the ones people use all day, every day — had neither.

  **The rail is a landmark.** It was `div > div > ul` to the bottom, so the only `nav` on a staff
  screen was the breadcrumb, and that renders on a fraction of screens. A screen-reader user had no
  way to jump to the navigation or past it. `LayoutNav` now renders inside
  `<nav aria-label="{activeApp} sections">` — labelled, because a staff screen has two navigation
  landmarks and calling both "navigation" tells nobody which is which.

  **A skip link, first in the tab order.** Without one, a keyboard user tabbed the sidebar trigger,
  the app switcher, every destination in the rail — eleven of them in Website Management — and the
  user menu before reaching the page, on every navigation. It sits above the viewport until focused
  and then draws as a real control, because someone who tabs into it needs to see where focus went.
  Its target carries `tabIndex={-1}` so focus genuinely moves rather than only changing the hash,
  and it uses the same `#main-content` id the public site already uses.

  **The refusal screen stops centring in a full viewport.** `min-h-screen` with vertical centring
  put the card in the middle of the window, so at 200% zoom the only content on the page sat below
  an empty half-screen. It is padded from the top instead.

  **Browser zoom flipping the rail into a sheet is left alone, deliberately.** `useIsMobile` is a
  width breakpoint, so 200% zoom on a 1280px display reports roughly 640px and the rail becomes an
  overlay. That reads as a surprise, but it is the correct behaviour: WCAG 1.4.10 asks content to
  reflow at 320 CSS px without two-dimensional scrolling, and a 256px rail inside a 640px viewport
  takes 40% of it. Suppressing the sheet at high zoom would trade a small surprise for a likely
  reflow failure, and the hook is shared with `apps/public`, where a `pointer: coarse` guard would
  also change which hero image the home page picks. The reasoning is now recorded in DESIGN.md's
  Desktop-First rule and the shell's README rather than left for someone to rediscover.

### Patch Changes

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

- d00dfe1: Answer the spray schedule question the way it is asked, and stop the notices register burying its own postings

  Three public-site defects, each one a resident reading something the Commission did not mean to say.

  **The spray schedule led with the wrong mission.** Every mission of the current year rendered in one reverse-chronological list, so the top card was the furthest-out or most recently past mission rather than the next one — a resident checking before bed read the top of the page and drew the wrong conclusion. Missions now split into Upcoming, soonest first, and Past, most recent first, over a new pure `spray-periods` module in `@mcmec/lib`.

  There is deliberately no "Tonight" group. Missions run overnight — 3am–8am as readily as 7pm–midnight — so a mission dated the 4th starting at 3am is, to the person who sees the truck, the night of the 3rd. Any "tonight" label would be wrong for a large share of missions and wrong in the direction that tells a resident they are clear when they are not. For the same reason the split is computed from the mission's _end_ rather than its date, so a mission in progress stays under Upcoming instead of dropping into Past at midnight with the trucks still out.

  Mission `status` is not consulted. It is an authored lifecycle value staff advance by hand (ADR 0001), so a past mission legitimately still reads "Scheduled" while it waits to be marked completed; grouping is about the clock and the badge is about the record. Under a "Past spray missions" heading that lag reads as a record awaiting its update, which is what it is. Each group also carries a real heading and count, and an empty Upcoming group now says "No upcoming spray missions scheduled" — the reassurance the page never offered, without which "nothing is scheduled" and "the page told me nothing" looked identical.

  **Consent to enter a yard was pre-granted.** The Access to Premises switch on the adult mosquito request form defaulted to on, so a resident who scrolled past it authorized an inspector to enter their property while nobody was home without ever deciding. It now defaults to off, and both states were reworded so neither answer puts words in the resident's mouth — the old "no" asserted a locked gate and an outdoor pet on their behalf.

  **Current legal notices were paginated and clipped.** The register showed five notices per page and cut each one behind a fade at 192px, on the page whose own opening paragraph designates it the Commission's primary method of publication under P.L. 2025 c.72. Current notices now render in full on one page. `/notices/archive` keeps pagination and clipping — it is a browse surface that grows without bound, not the statutory register — via new `paginate` and `truncate` props.

  Also fixes the React #419 error on `/notices`: the share URL read `window.location.origin` unguarded, which does not exist during SSR and bailed the route's Suspense boundary out to a client re-render. The origin is now read only where there is one.

- e6877ea: Show upcoming meetings first on the public meetings page. The Year selector on the
  meetings table and mobile list now leads with an "Upcoming" option and defaults to it, so
  a meeting scheduled for a future calendar year is visible on first load. The selector's
  options come from the meetings themselves, so it can no longer start on a year with no
  rows behind it.
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

- 4515e79: Sweep the small defects on the public site, one of which was not small

  A pass over the minor findings from the critique. The first one turned out to be a correctness bug on a statutory page rather than a console warning.

  **Meeting times were rendered in whatever timezone the runtime happened to be in.** `formatDateTime` pinned none, so the SSR server — which runs in UTC — rendered a 12:00 PM meeting as `4:00 PM (UTC)`, and the browser then re-rendered it as `12:00 PM (EDT)`. That is the React #418 hydration mismatch on `/notices/meetings`, and it means the server-sent HTML — what a crawler, a reader before hydration, and anyone without JavaScript sees — carried a meeting time wrong by four or five hours, on the page that discharges the Commission's 48-hour OPMA notice.

  It is pinned to `America/New_York` now, named as `COMMISSION_TIME_ZONE` because it is a fact about the agency rather than a formatting option: every meeting on the public record is called in Edison. A resident reading from another state needs the time the doors actually open, not that instant translated into their own zone. Covered by ten new tests with absolute expectations, deliberately not derived from the host clock — the defect was that the output depended on the host clock, so a test computing its expectation the same way the code does would have passed throughout. This also corrects the same wrong time in `central` and `website-management`.

  **The meetings page also chose its layout with a hook.** `useIsMobile` returns false on the server and during the first client render, then flips after an effect, so on a phone the server sent the table and the browser swapped in the list. Both layouts render now and CSS picks one, which is how the navbar has always done it.

  The rest, briefly:

  - **The footer's phone number is a link.** It was plain text, so the one fallback channel a resident has required copying digits off a phone screen by hand. The fax stays text — nothing dials it. Both icons are now `aria-hidden` with a screen-reader label, since a bare icon beside a number does not say which number it is.
  - **Notice cards said "Published on"** over a value that comes from `notice_date`, the notice's own legal date, which is not the day it went up. It reads "Notice date" now. The old fallback printed a literal `[unknown]` to the public; an undated notice shows nothing instead.
  - **A notice whose category did not resolve was published as type "Unknown".** That is a gap in our lookup, not a notice of unknown kind. The row is omitted instead, and the unresolved type is kept out of the filter list — a `SelectItem` with an empty value is a thing Radix throws on, which would have taken both notices routes down in exactly the case this fix is about.
  - **Notice search matched titles only**, so a resident looking for their own street — named in the body of a spray notice and nowhere in its heading — got nothing back. It searches the body text too now.
  - **The Type and Year filters had no way back.** Neither select offered an "All" item, so once you picked one the only route to unfiltered was the Clear button, which only appears once something is already filtered.
  - **An empty register and an over-tight filter now say different things.** The page used to blame filters that were not set.
  - **The notice title looked clickable and was not reachable** — `cursor-pointer`, a hover underline and an `onClick` on a plain div. It is a button now, so it takes focus, answers Enter, and announces itself.
  - **Cancelled spray missions no longer take the destructive red.** Red is the system's refusal colour and was being asked to carry urgency, which the design system rules out — and it read as bad news, when a cancelled spray is neutral or welcome for most people looking at it.

  Deliberately not done: Cloudflare Turnstile still loads on every page rather than only the four intake forms. Moving it would drop a third-party fetch from the rest of the site, but the widget depends on `window.turnstile` existing when it mounts, and getting that wrong breaks Public Request intake entirely. Not a change to make without exercising the submission path.

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

- 0f3b49b: Raise the skip link above the sticky header so it can actually be seen.

  The shared `SkipLink` was `z-50` and every sticky app header is also `z-50`. Both are
  positioned elements in the same stacking context, so paint order falls to DOM order — and
  the header comes later, covering the link completely.

  Nothing about this was detectable from the DOM or from a test: the link was first in tab
  order, `:focus-visible` matched, the reveal transform applied, and pressing Enter moved
  focus to `#main-content`. It was correct in every respect except being visible, which is
  the entire point of a bypass link for a sighted keyboard user. Found by tabbing into it on
  staging and seeing nothing.

- 30bef37: Make the sticky header stick, and let the phone menu say where you are

  Both navigation bars carried `sticky top-0 z-50` and neither one stuck. A sticky element is
  clamped to its parent's box, and each bar's parent was the breakpoint wrapper wrapped directly
  around it — 64px of parent around 64px of child, so the travel range was zero and the bar
  scrolled away like static content. Measured: scroll to 800 and the header's `bottom` reads
  `-836`. On Archived Notices, the spray schedule and Transparency — the long pages a resident
  arrives at from a search result — the only way back to the menu was to scroll to the top of the
  document.

  The declaration moves to `<header>`, whose containing block is the shell's `min-h-screen
flex-col`. One line covers both breakpoints, and `z-50` still clears the home hero's `z-30`
  control plaque.

  **A sticky bar has to pay rent, and the skip link is who it owes.** Jumping to `#main-content`
  scrolls that element's top to the viewport's top, which is now underneath the header: 64px of
  content hidden on a desktop and 47px on a phone, so the accessibility affordance delivered a
  keyboard user to content they could not see. `main` takes `scroll-mt-16 lg:scroll-mt-20`, the
  two bar heights plus a small gap.

  **The phone menu had no idea where it was.** Opened on the spray schedule, every row reported
  `aria-current: null` and no background, and the visitor's own section sat collapsed alongside the
  other six — with two groups beginning "Mosquito" and no descriptions in the sheet, a resident who
  opened the menu to move sideways within a section had to remember which one they had come from.
  The desktop bar gained location feedback in the previous pass; the sheet did not, because the
  active-group rule lived inside `NavPopover` and nowhere else. It is now a shared `isGroupActive`,
  so the two breakpoints cannot drift apart again. The matching group opens on mount, its trigger
  takes Pale Green, and exactly one leaf row is current — `activeOptions={{ exact: true }}`, since
  fuzzy matching would light "Legal Notices" while the visitor is on `/notices/archive`, and two
  current rows answer "where am I" with a question.

  **Two defects in the sheet's dialog wiring.** The close control was 16×16 with no padding — the
  only pointer exit from the menu, at icon size rather than target size. It is now `size-6`, which
  is a change in `@mcmec/ui` and so lands in all five frontends. And the dialog carried
  `aria-describedby` pointing at an element that did not exist: `SheetContent` always wires the id
  whether or not a description is rendered, and the `aria-describedby="Mobile Menu"` sitting on the
  `Sheet` root did not help, because the root does not forward it and that string is not an id. An
  `sr-only` `SheetDescription` gives the reference something to resolve to.

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

- Updated dependencies [0e49037]
- Updated dependencies [62f332a]
- Updated dependencies [9b0ea3c]
- Updated dependencies [ecb366f]
- Updated dependencies [30bef37]
- Updated dependencies [5548a61]
- Updated dependencies [1b5e787]
- Updated dependencies [9f288ec]
- Updated dependencies [229923c]
- Updated dependencies [30bef37]
- Updated dependencies [0e49037]
- Updated dependencies [976244f]
- Updated dependencies [3960d61]
- Updated dependencies [d00dfe1]
- Updated dependencies [e6877ea]
- Updated dependencies [3b8822d]
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
  - @mcmec/auth@0.4.2

## 1.6.1

### Patch Changes

- Updated dependencies [cae7305]
  - @mcmec/lib@0.9.1

## 1.6.0

### Minor Changes

- 76ce7e8: Railway migration Phase 4 — rewire the `hr` and `central` apps to the new backend.

  **hr** — Better Auth cookie client, its own `/login`, and the `(app)` guard verifying `manage_employees` against the auth client instead of a Supabase session. Employees and job postings read through ElectricSQL collections and write through the Hono API; the removed `created_by`/`updated_by` columns are gone from both insert paths. Requires `VITE_API_URL`.

  **central** — same auth wiring, plus the four screens it owns as the employee portal:

  - **Sign in** calls Better Auth and no longer hands sibling apps a session. The old dev-only trick of appending access and refresh tokens to the redirect URL in a hash fragment is deleted — one cookie is shared across every app now — and the redirect param is restricted to same-origin paths.
  - **Forgot password** requests a Better Auth reset email.
  - **Reset password** and **set password** both complete the tokenized reset, reading `?token=` from the URL. Setting a password no longer signs you in, so both finish at sign-in.

  **@mcmec/ui** — new `blocks/invite-button`. HR and admin each had their own copy (HR's still called the deleted Supabase edge function); they now share one that takes `apiUrl`, posts to `/api/invite`, surfaces failures, and distinguishes a login created with a failed invite email.

### Patch Changes

- Updated dependencies [cf2e2aa]
- Updated dependencies [d1cc9c7]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
  - @mcmec/lib@0.9.0

## 1.5.2

### Patch Changes

- 803e1f7: Fix weekly mosquito activity chart rendering when the current year only has a few weeks of data. The week-number domain now spans the union of the current year and the 5-year historical window, so the dashed 5-year average line renders across the full season and the current-year line zero-fills the remaining weeks instead of collapsing to a single point.

## 1.5.1

### Patch Changes

- c45311a: Simplify meeting documents into a single bundled link by dropping the `agenda_url` and `report_url` columns — the consolidated document now lives in `minutes_url`. Updates the notices form, the shared meetings table and mobile list, and the public meetings page to match. Also refreshes the public Job Opportunities page opener with MCMEC's mission and benefits.

## 1.5.0

### Minor Changes

- 705816d: Refresh public website design: add Roboto font, refine color palette and shadows, reduce desktop typography scale, add section sidebar navigation, restructure home page with action cards, expand footer with site-wide links, and improve mobile navigation.
- 74f924d: Add mosquito spray schedule feature with admin CRUD in notices app, public display with filters at /spray-schedule, new TimeField and MultiComboboxField UI components, and dashboard integration.
- d7980a2: Add weekly mosquito activity feature with CSV upload in notices app and recharts-powered visualization on the public site at /mosquito-surveillance/weekly-activity.

### Patch Changes

- 744da27: Add content to under-construction public pages: spray notice, aerial larviciding notice, mosquito source checklist, and municipal packet. Fix CSS @import ordering in globals.css.

## 1.4.5

### Patch Changes

- Updated dependencies [b37462b]
  - @mcmec/lib@0.8.0

## 1.4.4

### Patch Changes

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

## 1.4.3

### Patch Changes

- Updated dependencies [b9b91e2]
  - @mcmec/lib@0.7.3

## 1.4.2

### Patch Changes

- 501ef75: Add HR app for employee management with employees CRUD, invite flow, and TanStack Table. Update app registry with cross-app URLs. Fix layout logo to use Supabase Storage. Add employees RLS policies and manage_employees permission. Add TanStack DB skill mappings to CLAUDE.md.
- Updated dependencies [187f5d9]
- Updated dependencies [95e01c3]
- Updated dependencies [501ef75]
  - @mcmec/lib@0.7.2

## 1.4.1

### Patch Changes

- Updated dependencies [a8b88f5]
  - @mcmec/lib@0.7.1

## 1.4.0

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

## 1.3.1

### Patch Changes

- b5445c3: Fixed insecticides table linking.
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

- Updated dependencies [43306d2]
  - @mcmec/lib@0.6.3

## 1.3.0

### Minor Changes

- 519868d: Public Meetings Dashboard: A new dedicated section for viewing and managing meeting data, accessible via the main navigation.
  Meeting Management Tools: Introduced streamlined forms and workflows to create, edit, and organize meeting details.
  Mobile-Optimized Views: Added a responsive interface including a new mobile-friendly list view for meetings on the go.
  Improved Date/Time Formatting: Meetings now display in localized formats with proper timezone support.
  Refined Navigation: Updated breadcrumbs and menus for more intuitive browsing.
  Stability Fixes: Improved error handling for missing records and resolved a display issue within text input fields.

### Patch Changes

- ad6a006: UI & Design Updates
  New Homepage: Replaced the splash page with a new, modern Hero section.
  Enhanced Navigation: Restructured the navigation bar and updated menu items for better site flow.
  Visual Improvements: Added gradient overlays and scroll indicators to page layouts for a more polished look.
  Refined Footer: Updated the footer design to improve text visibility and overall layout.
  Cleaner Layouts: Streamlined the interface by removing redundant header elements and improving content centering across the app.

  Performance & System
  Cross-Platform Reliability: Updated internal build scripts to ensure consistent performance across different operating systems.
  Asset Management: Improved the way shared assets and dependencies are synced during development and deployment.

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

- Updated dependencies [519868d]
  - @mcmec/lib@0.6.2

## 1.2.1

### Patch Changes

- 1bc6947: Added archived notices feature. Notice feed now has pagination and filtering components.

## 1.2.0

### Minor Changes

- 456bdae: Turned public notice card into a preview card with callbacks to navigate to notice page and share URL.
  Added a new route in public to display a notice.
  Modified design of notice route in notice manager.

## 1.1.0

### Minor Changes

- d00a319: Applied Middlesex County styling guidelines and web/mobile layouts for the public website.

### Patch Changes

- Updated dependencies [d00a319]
- Updated dependencies [fb040ad]
  - @mcmec/lib@0.6.1

## 1.0.1

### Patch Changes

- 3f9666d: Created date functions and refactored all date displays in apps to properly render.
- Updated dependencies [3f9666d]
  - @mcmec/lib@0.6.0
