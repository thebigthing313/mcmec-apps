# @mcmec/lib

## 0.10.0

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

- 30bef37: Rebuild the public home page around a split hero: six photographs of the Commission's own work crossfading on one half, the six ranked destinations on the other.

  The photographs are a plate beside the content, not a ground beneath it — nothing is laid over them, which retires the white-on-scrim heading the old banner used and puts the Commission's name back in Ink on Paper. The destinations are one bordered register in the Signal Band's construction rather than six shadowed cards, led by Request Service and Spray Schedule.

  Auto-advance carries a real pause control and stops entirely under `prefers-reduced-motion`; the six selector hairlines are Muted Ink so they clear WCAG 1.4.11 against Paper. Six new `hero-*.avif` assets ship from the `api` service.

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

- d00dfe1: Answer the spray schedule question the way it is asked, and stop the notices register burying its own postings

  Three public-site defects, each one a resident reading something the Commission did not mean to say.

  **The spray schedule led with the wrong mission.** Every mission of the current year rendered in one reverse-chronological list, so the top card was the furthest-out or most recently past mission rather than the next one — a resident checking before bed read the top of the page and drew the wrong conclusion. Missions now split into Upcoming, soonest first, and Past, most recent first, over a new pure `spray-periods` module in `@mcmec/lib`.

  There is deliberately no "Tonight" group. Missions run overnight — 3am–8am as readily as 7pm–midnight — so a mission dated the 4th starting at 3am is, to the person who sees the truck, the night of the 3rd. Any "tonight" label would be wrong for a large share of missions and wrong in the direction that tells a resident they are clear when they are not. For the same reason the split is computed from the mission's _end_ rather than its date, so a mission in progress stays under Upcoming instead of dropping into Past at midnight with the trucks still out.

  Mission `status` is not consulted. It is an authored lifecycle value staff advance by hand (ADR 0001), so a past mission legitimately still reads "Scheduled" while it waits to be marked completed; grouping is about the clock and the badge is about the record. Under a "Past spray missions" heading that lag reads as a record awaiting its update, which is what it is. Each group also carries a real heading and count, and an empty Upcoming group now says "No upcoming spray missions scheduled" — the reassurance the page never offered, without which "nothing is scheduled" and "the page told me nothing" looked identical.

  **Consent to enter a yard was pre-granted.** The Access to Premises switch on the adult mosquito request form defaulted to on, so a resident who scrolled past it authorized an inspector to enter their property while nobody was home without ever deciding. It now defaults to off, and both states were reworded so neither answer puts words in the resident's mouth — the old "no" asserted a locked gate and an outdoor pet on their behalf.

  **Current legal notices were paginated and clipped.** The register showed five notices per page and cut each one behind a fade at 192px, on the page whose own opening paragraph designates it the Commission's primary method of publication under P.L. 2025 c.72. Current notices now render in full on one page. `/notices/archive` keeps pagination and clipping — it is a browse surface that grows without bound, not the statutory register — via new `paginate` and `truncate` props.

  Also fixes the React #419 error on `/notices`: the share URL read `window.location.origin` unguarded, which does not exist during SSR and bailed the route's Suspense boundary out to a client re-render. The origin is now read only where there is one.

- 3b8822d: Rebuild the public masthead as a two-tier identity rail over the navigation, and fit the home page's four bands into one viewport.

  The seal now sits on a light ground at 80px, from `logo192` rather than the square-tiled 128px file. Its disc is transparent, so on Commission Green the arced lettering sat straight on the green and dissolved — the old white "puck" was a crude fix for that, and a fully rounded shape besides, which The Pill Is A Status Rule reserves for record state. The identity rail carries the Commission's name and, in the slot and treatment "Established 1914" held, the standfirst that used to open the home page. Below `lg` the Menu button moves into the rail and the green navigation tier goes entirely — a 56px strip holding one button is 56px of a sticky header charged against a phone viewport for the whole visit — and below `sm` the name steps down to 11px and wraps rather than shortening to an initialism — "MCMEC" identifies the agency only to someone who already knows it, and most arrivals come from a search result knowing nothing. That puts the phone masthead at 65px against the 198px a shared three-band header first measured. The full name and the standfirst move into the navigation sheet, which has the room the rail does not; the sheet keeps "Menu" as its accessible name, because a navigation panel that announces itself as the agency's name tells a screen-reader user nothing about what opened.

  The rail renders at every width: it was briefly desktop-only, which cost a phone visitor the seal, the name and the description, and left the two form factors with different information architectures. The mobile puck is gone with it.

  The home page drops its visible `h1` and standfirst to the masthead, keeping an `sr-only` heading so the route still has one. The hero splits one third register to two thirds photograph, the six destinations stack as equal cards, and the band is `h-[calc(100svh-10rem)]` — the masthead is deliberately fixed at 104px + 56px so that arithmetic holds — so identity, navigation, photograph and record strip land in one viewport with the footer below the fold. Two columns of destinations between `sm` and `xl`, one below and above.

  The footer's band takes a near-black `--footer` / `--footer-foreground` pair instead of borrowing shadcn's `accent`, which is the hover-and-focus state on hundreds of surfaces across five frontends. White on it reads 15.85:1. The standard focus ring measures 1.55:1 on that ground, under what WCAG 1.4.11 asks of a focus indicator, so the band inverts the ring to its own white foreground — the same move Commission Green already makes. The county mark is flattened to white there, since its dark half was within a shade of the new ground.

  `VITE_ASSETS_ORIGIN` optionally overrides the brand-image origin, which otherwise stays production. Unset it behaves exactly as the hardcoded origin did; set to a local api it shows images a branch adds before that branch reaches `main`. The public app's CSP reads the same variable so the policy and the page cannot disagree about where images come from.

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

- efc7409: Name the weekday, and tell the clock the way a resident reads it

  A spray mission is something a resident plans an evening around — close the windows, bring the
  dog in, move the barbecue. "September 04, 2026" and "19:00" both make them do work the page
  should have done: count on a calendar to find out whether that is a school night, and subtract
  twelve to find out whether it is before or after dinner. Both now read as they are spoken:
  "Friday, September 04, 2026", "7:00 PM – 11:00 PM", on the schedule cards and in the front
  door's record strip alike.

  `formatDateWithWeekday`, `formatDateShortWithWeekday` and `formatClockTime` join
  `@mcmec/lib/functions/date-fns`. The clock formatter is a string transform rather than a `Date`
  formatter on purpose: a `time` column has no date and no zone to attach one to, and building a
  `Date` around it invites exactly the timezone shift that module exists to avoid. The card's
  private time helper is gone in its favour, so one rule now governs every clock on the site.

  The strip also stops under-reporting a busy night. It has room for one mission, and the
  Commission sprays several municipalities on the same date; showing the first alone told a
  resident of the second town that their street was not being treated — the one direction a wrong
  answer must never point. It now adds "and 2 others" beneath the mission it names.

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

- 30bef37: Fix the focus ring across every frontend, clear the shell's reflow failure, and put the public record on the landing page.

  The focus ring was `oklch(0.5353 …)` at 50% opacity and `--primary` is `oklch(0.5364 …)` — the same lightness — so on the public navigation bar it measured 1.00:1 against its own ground, and 1.95–2.05:1 on every light surface. It is now opaque and dark (9.47:1 on Paper, 3.27:1 on Brackish Teal), and inverts to the pale foreground on Commission Green (4.62:1). This touches all five frontends.

  The public navigation bar needs 842px and was taking over at 768px, so every page scrolled horizontally from 768 to 856 — including a 1536px desktop at 200% zoom. The handover moves to `lg`. The bar also gains a `header` landmark, labels on all four `nav` landmarks, a painted active state driven by the `aria-current` TanStack was already emitting, and 24px touch targets.

  The landing page gains a record strip: next Spray Mission, latest Legal Notice with its date, next Public Meeting — each with a written empty state, none of them claiming "tonight". Its queries are capped so the front door renders whether or not the api answers.

- e6877ea: Show upcoming meetings first on the public meetings page. The Year selector on the
  meetings table and mobile list now leads with an "Upcoming" option and defaults to it, so
  a meeting scheduled for a future calendar year is visible on first load. The selector's
  options come from the meetings themselves, so it can no longer start on a year with no
  rows behind it.
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

- 51aef15: Show three years of history on the transparency and meetings pages

  Both public lists showed everything the Commission had ever published, so an FY2018 budget sat
  with the same weight as this year's and the meetings table's year selector kept growing. Each
  list is now windowed to the three most recent years that actually _have_ content — not a rolling
  cutoff from today, which would empty a page whose category has not been filed in for a while.

  On the transparency page the window is counted per Document Category. Budgets filed for FY2026,
  FY2025 and FY2024 and audits filed for FY2025, FY2023 and FY2021 both show three entries; gaps
  are skipped rather than counted, and a category with fewer than three years shows what it has.
  Grouping, alphabetical group order and the fiscal-year-descending sort inside a group are
  unchanged.

  On the meetings page every meeting at or after now shows, whatever year it falls in — the page
  commits to posting legal notices at least 48 hours ahead under P.L. 2025 c.72, so the window must
  never hide an upcoming one. Past meetings are limited to the three most recent calendar years
  that contain one. The filter is on the meeting's own date and not on whether its minutes are
  posted, so a meeting still waiting to be minuted keeps carrying its notice. Three years is
  comfortably above the one-year archive minimum the page's own copy promises.

  The rule is one helper, `keepRecentYears`, in `@mcmec/lib` — the same computation over a
  different year field, an integer fiscal year on documents and the calendar year of `meeting_at`
  on meetings — with `keepUpcomingAndRecentYears` layering the "upcoming always shows" half on top,
  and `RECENT_YEARS_SHOWN` as the one place the window size is written down.

  The meetings table and mobile list are unchanged: they still take shaped rows and still pick one
  year at a time from their own Year selector. The window narrows what that selector offers, and
  nothing else about how the page reads.

  This is a display filter and nothing else. No row is unpublished, archived or deleted, the staff
  apps still show full history, and anything that has dropped off a public page comes back by
  changing this filter alone. Neither page's intro copy changed: telling the reader that older
  records exist, and how to ask for them, is a public statement with legal weight and is the
  Commission's to write.

## 0.9.1

### Patch Changes

- cae7305: Point the app-switcher at the host `website-management` is actually served on

  `appUrl("website", …)` produced `website.middlesexmosquito.org` in production and
  `website-staging.middlesexmosquito.org` on staging. Neither host has ever existed — the service
  is provisioned as `website-management` and `website-management-staging` — so the Website
  Management entry in every app's switcher was a dead link in both environments.

  `appUrl` appends `-staging` to the label outside production, so the label has to be the
  production host minus the root domain, and the staging host has to be exactly that label plus
  `-staging`. `website-management` satisfies both; `website` satisfied neither.

  Also corrects `TRUSTED_ORIGINS` in `apps/api/.env.example`, which carried the same wrong host,
  and drops the apex from that list — `public` forwards form submissions server-side and never
  calls the API from the browser, so it needs no origin entry.

## 0.9.0

### Minor Changes

- d1cc9c7: Serve the shared brand images from Railway instead of Supabase Storage. This removes the last runtime dependency on Supabase in the frontends.

  **api** — the nine images (logos, favicon, hero, the 404 illustration) are committed to `apps/api/assets/` and served at `/assets/<filename>` with `Cache-Control: public, max-age=31536000, immutable`, carried over byte-for-byte from what the Supabase upload set. `api` gets the job because it is the only always-on service present in both environments, which preserves the one thing the bucket was buying: a single canonical origin, so all six apps share one copy and one browser cache entry.

  The directory is read once at boot into memory (~2 MB). That keeps a caller-supplied path from ever reaching the filesystem, so traversal is unreachable by construction rather than by validation, and it makes a content-hash `ETag` free — a client that revalidates despite `immutable` gets a 304 instead of 2 MB. The route sits outside `/api/*` and so outside the CORS middleware, deliberately: `<img>` and `<link rel="icon">` loads are not CORS-gated.

  **@mcmec/lib** — `constants/assets` now points at the API origin. It stays hardcoded to production in every environment, including local dev: the bytes are identical everywhere, so this gives one shared cache and adds no build variable a service could be provisioned without — and `public` could not read such a variable anyway, since its API origin is deliberately server-side only.

  Because the filenames are unversioned and served `immutable`, changing an image now requires a **new filename** in both `apps/api/assets/` and `constants/assets`. Overwriting in place will look correct on a fresh browser and stay stale for a year on every returning one.

  **public** — `img-src` drops `https://*.supabase.co` for the API origin, completing the CSP cleanup Phase 4 left open.

  Also removed `scripts/upload-assets-to-storage.ts`, which was the only writer to the bucket. Publishing an image is now a commit.

- 76ce7e8: Railway migration Phase 4 — rewire the `admin` app to the new backend.

  **admin** — auth moves to the Better Auth cookie client (`makeAuthClient(VITE_API_URL)`); the router context carries `authClient` instead of a Supabase client, and the app now self-hosts its own `/login` (one shared session cookie does SSO across apps, so there is no cross-app redirect hub). The `(app)` guard verifies `manage_users` (renamed from `admin_rights`) and redirects unauthenticated users to the local login with a same-origin-only `redirect` param. Employee data reads through the ElectricSQL `employees` collection and writes through `/api/data/employees`. Manage Permissions is rebuilt on Better Auth roles: users are read via the admin plugin and role sets are full-replaced through `PUT /api/users/:id/roles`, with a guard against revoking your own `manage_users`. Invites now `POST /api/invite` (extracted into a shared `InviteButton` that surfaces failures and a login-created-but-email-failed result) instead of calling a Supabase edge function. Requires `VITE_API_URL`.

  **@mcmec/lib** — new `constants/roles` module exporting `APP_ROLES`, the `AppRole` union, display labels, and a `parseRoles` helper for Better Auth's comma-separated `users.role`; app definitions renamed their required permissions (`public_notices`→`manage_website`, `admin_rights`→`manage_users`) and now type them as `AppRole`.

### Patch Changes

- cf2e2aa: Make the app switcher environment-aware. It decided production by testing whether the hostname
  merely _contained_ `middlesexmosquito.org`, which is true on the staging siblings too — so every
  switcher link on `*-staging.middlesexmosquito.org` pointed at production, silently walking a
  staging session into live data. The environment is now derived from the subdomain label left of
  the root domain, so staging links to staging and production to production with no per-service
  configuration to forget.

  Local dev links now use the Caddy https ports (3444–3447) instead of the raw Vite upstreams. An
  `http://` page calling the `https://` API is cross-site under schemeful same-site, so the session
  cookie was withheld and switching apps in dev bounced straight to `/login`.

- 76ce7e8: Rename the `notices` app to `website-management`.

  The app long ago outgrew its name — it manages every kind of content published on the public website (notices, meetings, insecticides, spray schedules, documents, service requests, weekly activity), not just notices. The workspace package and directory are now `website-management`, the UI calls it "Website Management", and the dev server moved from port 3002 to 3006 (3002 collides with other local tooling).

  The `notices` domain itself is unchanged — the `notices` table, its collections, and the public site's `/notices` routes keep their names.

  **Deployment follow-up:** the production subdomain moves `notices.middlesexmosquito.org` → `website.middlesexmosquito.org` (declared in `@mcmec/lib`'s app registry and the API's `TRUSTED_ORIGINS`), and the Vercel project's root directory must be repointed at `apps/website-management`.

## 0.8.0

### Minor Changes

- b37462b: Add job postings feature with HR management CRUD and public careers pages

## 0.7.3

### Patch Changes

- b9b91e2: Centralize login through central app with branded auth layout. PKCE flow with shared cookie domain for production, hash fragment tokens for local dev. Add processAuthRedirect and getCentralLoginUrl helpers.

## 0.7.2

### Patch Changes

- 187f5d9: Add Admin app for managing user permission assignments. Add admin_rights permission. Add user_permissions audit fields and RLS policies. Update app registry with Admin app entry.
- 95e01c3: Move shared assets to Supabase Storage. Remove packages/assets, sync-assets build step, and shx dependency. Apps now import asset URLs from @mcmec/lib/constants/assets.
- 501ef75: Add HR app for employee management with employees CRUD, invite flow, and TanStack Table. Update app registry with cross-app URLs. Fix layout logo to use Supabase Storage. Add employees RLS policies and manage_employees permission. Add TanStack DB skill mappings to CLAUDE.md.

## 0.7.1

### Patch Changes

- a8b88f5: New @mcmec/auth package with typed errors, canonical Claims type, and dependency injection pattern. Update PasswordSchema minimum from 8 to 6 characters.

## 0.7.0

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

## 0.6.3

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

## 0.6.2

### Patch Changes

- 519868d: Public Meetings Dashboard: A new dedicated section for viewing and managing meeting data, accessible via the main navigation.
  Meeting Management Tools: Introduced streamlined forms and workflows to create, edit, and organize meeting details.
  Mobile-Optimized Views: Added a responsive interface including a new mobile-friendly list view for meetings on the go.
  Improved Date/Time Formatting: Meetings now display in localized formats with proper timezone support.
  Refined Navigation: Updated breadcrumbs and menus for more intuitive browsing.
  Stability Fixes: Improved error handling for missing records and resolved a display issue within text input fields.

## 0.6.1

### Patch Changes

- d00a319: Applied Middlesex County styling guidelines and web/mobile layouts for the public website.
- fb040ad: Created footer for public website.

## 0.6.0

### Minor Changes

- 3f9666d: Created date functions and refactored all date displays in apps to properly render.
