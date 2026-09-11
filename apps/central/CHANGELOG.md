# central

## 1.1.1

### Patch Changes

- Updated dependencies [59c86a6]
  - @mcmec/ui@1.7.1

## 1.1.0

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
  - @mcmec/lib@0.9.0
  - @mcmec/supabase@2.0.0
  - @mcmec/auth@0.4.0
  - @mcmec/ui@1.6.0

## 0.4.4

### Patch Changes

- Updated dependencies [803e1f7]
  - @mcmec/ui@1.5.2

## 0.4.3

### Patch Changes

- Updated dependencies [c45311a]
  - @mcmec/ui@1.5.1
  - @mcmec/supabase@1.7.1

## 0.4.2

### Patch Changes

- Updated dependencies [705816d]
- Updated dependencies [744da27]
- Updated dependencies [74f924d]
- Updated dependencies [d7980a2]
  - @mcmec/ui@1.5.0
  - @mcmec/supabase@1.7.0

## 0.4.1

### Patch Changes

- Updated dependencies [b37462b]
  - @mcmec/supabase@1.6.0
  - @mcmec/lib@0.8.0
  - @mcmec/auth@0.3.1
  - @mcmec/ui@1.4.5

## 0.4.0

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

## 0.3.0

### Minor Changes

- b9b91e2: Centralize login through central app with branded auth layout. PKCE flow with shared cookie domain for production, hash fragment tokens for local dev. Add processAuthRedirect and getCentralLoginUrl helpers.

### Patch Changes

- Updated dependencies [b9b91e2]
- Updated dependencies [1a77b67]
- Updated dependencies [8dc9b46]
- Updated dependencies [5c3f9fd]
  - @mcmec/auth@0.3.0
  - @mcmec/lib@0.7.3
  - @mcmec/supabase@1.4.0
  - @mcmec/ui@1.4.3

## 0.2.1

### Patch Changes

- 95e01c3: Move shared assets to Supabase Storage. Remove packages/assets, sync-assets build step, and shx dependency. Apps now import asset URLs from @mcmec/lib/constants/assets.
- Updated dependencies [187f5d9]
- Updated dependencies [95e01c3]
- Updated dependencies [501ef75]
  - @mcmec/lib@0.7.2
  - @mcmec/supabase@1.3.1
  - @mcmec/ui@1.4.2
  - @mcmec/auth@0.2.1

## 0.2.0

### Minor Changes

- 2cea2d6: Rework auth flow to use email-based invites via Resend SMTP. Replace create-account edge function with invite-employee. Add set-password, forgot-password, and reset-password pages to central. Update both apps to use @mcmec/auth package with typed errors.

### Patch Changes

- dcf90f1: Hotfix for explicit build output directory on Vercel configuration.
- Updated dependencies [a8b88f5]
- Updated dependencies [2affcd1]
- Updated dependencies [184752c]
  - @mcmec/auth@0.2.0
  - @mcmec/lib@0.7.1
  - @mcmec/supabase@1.3.0
  - @mcmec/ui@1.4.1

## 0.1.7

### Patch Changes

- Updated dependencies [43272a7]
  - @mcmec/supabase@1.2.0
  - @mcmec/lib@0.7.0
  - @mcmec/ui@1.4.0

## 0.1.6

### Patch Changes

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

- Updated dependencies [b5445c3]
- Updated dependencies [43306d2]
  - @mcmec/ui@1.3.1
  - @mcmec/lib@0.6.3
  - @mcmec/supabase@1.1.1

## 0.1.5

### Patch Changes

- Updated dependencies [ad6a006]
- Updated dependencies [9dc254d]
- Updated dependencies [519868d]
  - @mcmec/ui@1.3.0
  - @mcmec/supabase@1.1.0
  - @mcmec/lib@0.6.2

## 0.1.4

### Patch Changes

- 2cb183e: Fixed scrollbar not resetting to top of content div when navigating.
- Updated dependencies [1bc6947]
  - @mcmec/ui@1.2.1

## 0.1.3

### Patch Changes

- Updated dependencies [456bdae]
  - @mcmec/ui@1.2.0

## 0.1.2

### Patch Changes

- Updated dependencies [d00a319]
- Updated dependencies [fb040ad]
  - @mcmec/ui@1.1.0
  - @mcmec/lib@0.6.1
  - @mcmec/supabase@1.0.2

## 0.1.1

### Patch Changes

- Updated dependencies [3f9666d]
  - @mcmec/lib@0.6.0
  - @mcmec/ui@1.0.1
  - @mcmec/supabase@1.0.1
