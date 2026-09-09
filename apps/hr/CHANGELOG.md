# hr

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

- 76ce7e8: Railway migration Phase 4 — rewire the `hr` and `central` apps to the new backend.

  **hr** — Better Auth cookie client, its own `/login`, and the `(app)` guard verifying `manage_employees` against the auth client instead of a Supabase session. Employees and job postings read through ElectricSQL collections and write through the Hono API; the removed `created_by`/`updated_by` columns are gone from both insert paths. Requires `VITE_API_URL`.

  **central** — same auth wiring, plus the four screens it owns as the employee portal:

  - **Sign in** calls Better Auth and no longer hands sibling apps a session. The old dev-only trick of appending access and refresh tokens to the redirect URL in a hash fragment is deleted — one cookie is shared across every app now — and the redirect param is restricted to same-origin paths.
  - **Forgot password** requests a Better Auth reset email.
  - **Reset password** and **set password** both complete the tokenized reset, reading `?token=` from the URL. Setting a password no longer signs you in, so both finish at sign-in.

  **@mcmec/ui** — new `blocks/invite-button`. HR and admin each had their own copy (HR's still called the deleted Supabase edge function); they now share one that takes `apiUrl`, posts to `/api/invite`, surfaces failures, and distinguishes a login created with a failed invite email.

### Patch Changes

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
- Updated dependencies [76ce7e8]
  - @mcmec/lib@0.9.0
  - @mcmec/supabase@2.0.0
  - @mcmec/auth@0.4.0
  - @mcmec/ui@1.6.0
  - @mcmec/supabase-tanstack-db-integration@0.3.0

## 0.4.3

### Patch Changes

- Updated dependencies [803e1f7]
  - @mcmec/ui@1.5.2

## 0.4.2

### Patch Changes

- Updated dependencies [c45311a]
  - @mcmec/ui@1.5.1
  - @mcmec/supabase@1.7.1

## 0.4.1

### Patch Changes

- Updated dependencies [705816d]
- Updated dependencies [744da27]
- Updated dependencies [74f924d]
- Updated dependencies [d7980a2]
  - @mcmec/ui@1.5.0
  - @mcmec/supabase@1.7.0

## 0.4.0

### Minor Changes

- b37462b: Add job postings feature with HR management CRUD and public careers pages

### Patch Changes

- Updated dependencies [b37462b]
  - @mcmec/supabase@1.6.0
  - @mcmec/lib@0.8.0
  - @mcmec/auth@0.3.1
  - @mcmec/ui@1.4.5

## 0.3.0

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

## 0.2.1

### Patch Changes

- b9b91e2: Centralize login through central app with branded auth layout. PKCE flow with shared cookie domain for production, hash fragment tokens for local dev. Add processAuthRedirect and getCentralLoginUrl helpers.
- Updated dependencies [b9b91e2]
- Updated dependencies [1a77b67]
- Updated dependencies [8dc9b46]
- Updated dependencies [5c3f9fd]
  - @mcmec/auth@0.3.0
  - @mcmec/lib@0.7.3
  - @mcmec/supabase@1.4.0
  - @mcmec/supabase-tanstack-db-integration@0.2.1
  - @mcmec/ui@1.4.3

## 0.2.0

### Minor Changes

- 501ef75: Add HR app for employee management with employees CRUD, invite flow, and TanStack Table. Update app registry with cross-app URLs. Fix layout logo to use Supabase Storage. Add employees RLS policies and manage_employees permission. Add TanStack DB skill mappings to CLAUDE.md.

### Patch Changes

- Updated dependencies [187f5d9]
- Updated dependencies [95e01c3]
- Updated dependencies [501ef75]
- Updated dependencies [9e06271]
  - @mcmec/lib@0.7.2
  - @mcmec/supabase@1.3.1
  - @mcmec/ui@1.4.2
  - @mcmec/supabase-tanstack-db-integration@0.2.0
  - @mcmec/auth@0.2.1
