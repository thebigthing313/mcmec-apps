# public

## 2.1.0

### Minor Changes

- 7cca6ff: Make Weekly Mosquito Activity readable without seeing it

  The page rendered eight charts and nothing else. To assistive technology it was eight unlabelled SVGs, and the plotted figures existed nowhere else on the page — chart-only data with no text equivalent, which is WCAG 1.1.1 at Level A.

  **Each chart now carries its numbers.** A `Show the numbers` disclosure under every chart opens a real table — week, current-year count, five-year average, rainfall — with a caption, column headers, and the week as a row header. Closed by default, so the page looks as it did, but open to anyone: a resident who wants the actual count for their week no longer has to read it off a line.

  **Each chart is one labelled image rather than a heap of fragments.** `role="img"` with a summary label collapses the recharts subtree, which would otherwise announce a stream of unlabelled groups and tick text that conveys nothing. The label names the series and the week range and says the figures follow in a table.

  **Each chart title is a heading.** `CardTitle` renders a `div`, so eight titles sat on the page and none appeared in the heading outline — the page's only headings were its `h1` and the footer's. They are `h2`s now, each labelling a `section`.

  **The series colours come from the palette.** They were `#000000`, `#ec4899` and `#3b82f6` — hex literals in a product whose tokens are the visual authority. The current year takes Commission Green, the five-year average takes `chart-1` and stays dashed so the two are distinguished by stroke pattern and not by colour alone, and rainfall takes `chart-5`.

  **The chart palette itself was unusable and is now fixed.** Measured against the card ground, `chart-2` came out at 1.90:1, `chart-3` at 2.17:1, `chart-4` at 1.49:1 and `chart-5` at 1.85:1 — all under the 3:1 that WCAG 1.4.11 requires of a graphical object carrying meaning. They were pastels, which work as large filled areas and fail as plotted lines. Each hue is kept and its lightness pulled down until it clears 3:1, with chroma raised to stay vivid; `chart-1` already passed and is unchanged. Nothing else in the monorepo consumed these tokens, so the change is contained to this chart. New ratios: 3.68, 4.00, 3.86, 3.65, 3.46.

  The rainfall bars were also drawn at `opacity={0.3}`, putting them at **1.41:1** — the one element on the chart with a filled area was the hardest thing on it to see. They render at full opacity now.

  `DESIGN.md` is updated to match: the new values, why they moved, and the note that the current-year series is drawn in Commission Green rather than from the series palette.

- 30bef37: Fix the focus ring across every frontend, clear the shell's reflow failure, and put the public record on the landing page.

  The focus ring was `oklch(0.5353 …)` at 50% opacity and `--primary` is `oklch(0.5364 …)` — the same lightness — so on the public navigation bar it measured 1.00:1 against its own ground, and 1.95–2.05:1 on every light surface. It is now opaque and dark (9.47:1 on Paper, 3.27:1 on Brackish Teal), and inverts to the pale foreground on Commission Green (4.62:1). This touches all five frontends.

  The public navigation bar needs 842px and was taking over at 768px, so every page scrolled horizontally from 768 to 856 — including a 1536px desktop at 200% zoom. The handover moves to `lg`. The bar also gains a `header` landmark, labels on all four `nav` landmarks, a painted active state driven by the `aria-current` TanStack was already emitting, and 24px touch targets.

  The landing page gains a record strip: next Spray Mission, latest Legal Notice with its date, next Public Meeting — each with a written empty state, none of them claiming "tonight". Its queries are capped so the front door renders whether or not the api answers.

- 30bef37: Rebuild the public home page around a split hero: six photographs of the Commission's own work crossfading on one half, the six ranked destinations on the other.

  The photographs are a plate beside the content, not a ground beneath it — nothing is laid over them, which retires the white-on-scrim heading the old banner used and puts the Commission's name back in Ink on Paper. The destinations are one bordered register in the Signal Band's construction rather than six shadowed cards, led by Request Service and Spray Schedule.

  Auto-advance carries a real pause control and stops entirely under `prefers-reduced-motion`; the six selector hairlines are Muted Ink so they clear WCAG 1.4.11 against Paper. Six new `hero-*.avif` assets ship from the `api` service.

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

- c44da7f: Call a Public Request a Public Request, and stop telling residents it cannot be anonymous

  Two copy defects on the public site, both measured against `CONTEXT.md` rather than taste.

  **The binding term appeared nowhere.** `CONTEXT.md` defines **Public Request** and lists "service request" in its `_Avoid_` line, yet the public site said Service Request or Request Service in ten places: the home page card, the footer quick link, the nav group, the contact-section sidebar, the page title, the `h1`, the hub and general-inquiry body copy, and the two cross-links from the surveillance pages. The route `/contact/service-request` is unchanged — the URL is legacy and links to it keep working; only the visible language moves.

  Also renamed for the same reason: the third option card was "Interested in Mosquitofish" while its siblings were "Adult Mosquito Nuisance" and "Water Management", which are the kind names verbatim. It is "Mosquitofish" now. The general inquiry form's two toasts said "Submission successful" — _submission_ is on the same `_Avoid_` line — and now say "Thank you — your message has been sent." The Adult Mosquito Nuisance page carried the same noun ("our team will review your submission"); it reviews your _request_ now.

  **The site told residents their request could not be anonymous.** `CONTEXT.md` says a Public Request is "submitted anonymously from the public website", and the product carries no login, no account and no status lookup. The hub page said the opposite — _"Please note that we do not accept anonymous requests"_ — as the second sentence a resident read, before seeing any form, where it lands as a gate rather than as information. The same sentence sat in the Contact Information block of all three intake forms.

  What the forms actually need is a phone number so an inspector can reach someone if they cannot find the problem, which is what they say now: "We ask for your name and phone number so an inspector can reach you if they cannot find the problem. There is no account to create and no password to remember."

  The hub page's closing paragraph is rewritten too: the office number is a `tel:` link instead of plain text, and the general contact form is reached through the words "general inquiry" rather than through a link labelled "here" (WCAG 2.4.4).

  **One adjacent fix**, in the same element being renamed: the three option cards on the hub carried their titles in `div`s, so the whole choice the page offers was absent from the heading outline. They are `h2`s now, with `mt-0` holding prose's heading margin off so the cards keep the spacing they had.

### Patch Changes

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

- 2851986: Give Brackish Teal a foreground that actually contrasts with it

  The public footer measured 2.17:1, the worst contrast on the site, on the band carrying the office address, phone number and Transparency link on every page. Chasing it found the real defect one level up.

  `--accent-foreground` was a near-white on `--accent`, a mid-tone teal: **2.86:1**, well under the 4.5:1 AA floor for normal text. The footer only made it worse by adding a `/70` alpha on top. And that pair is not a footer choice — it is shadcn's hover and focus state, so 2.86:1 was every hovered dropdown item, menubar entry, context-menu row, command item, calendar cell and outline button **across all five frontends**. DESIGN.md named the pair Brackish Teal and Brackish Teal _Contrast_, which is presumably how it survived this long: the token was named for a property it did not have.

  `--accent-foreground` is Ink now: **5.22:1** on the same teal, one token, fixing every one of those surfaces at once. Brackish Teal itself is untouched. Darkening the ground to rescue the near-white would also have cleared AA, but it was rejected on appearance rather than on the ratio: the teal is a hover tint on hundreds of surfaces, and taking it that dark makes every one of them visibly heavier to rescue the foreground that was at fault. Light mode only: in dark mode `--accent` is a near-black whose near-white foreground already measures 14.48:1, where Ink would be 1.05:1.

  The footer drops its `/70` and keeps its teal ground.

  **Also fixed, found while measuring:** the public nav bar's link hover and focus used `accent/40`, a pale teal laid over Commission Green. It lifted the ground and took the white label from 4.62:1 at rest to **3.96:1** — so pointing at a nav link, or tabbing to it, was the one interaction on the page that pushed it under AA. Hover and focus now darken the green instead of lightening it, at 5.56:1.

  `DESIGN.md` moves with the tokens, as it did for the chart palette. The `brackish-teal-contrast` entry is gone rather than restated — it held the near-white, and its replacement is Ink, which the palette already names; a second token for one colour, still called _contrast_, would re-create the naming that hid this. `button-outline-hover` now cites `{colors.ink}` directly, the Brackish Teal entry records the pair and the ratio it lacked, and the public nav bar's darkening hover is written down as the stated exception it is.

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

- c0c0a21: Point residents at the 2026 Rutgers insecticide recommendations

  The Mosquito Control Products page cited "Insecticides Recommended For Mosquito Control in New
  Jersey in 2012" — a publication fourteen years out of date, on a Rutgers URL that describes a
  different document than the one we name. Rutgers has since issued the 2026 Update, so the page
  now links that instead, hosted on the Commission's own SharePoint.

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

- e6877ea: Show upcoming meetings first on the public meetings page. The Year selector on the
  meetings table and mobile list now leads with an "Upcoming" option and defaults to it, so
  a meeting scheduled for a future calendar year is visible on first load. The selector's
  options come from the meetings themselves, so it can no longer start on a year with no
  rows behind it.
- c40aec7: Close up the masthead's two name lines on desktop

  From `lg`, where the agency's name is set at 18px on a rail with room to spare, the two lines
  go from `leading-tight` (1.25) to 1.1. The looser leading read as two separate labels stacked
  on each other rather than as one two-line name.

  Below `lg` the leading is unchanged: the name wraps to three lines on a phone, and tightening
  it there would set wrapped words closer than the deliberate line breaks. The standfirst is
  unaffected either way — it carries its own `leading-snug`.

  A unitless multiple rather than `leading-none`: Tailwind's `leading-none` is the length `1lh`
  resolved at the _container's_ 16px font size, so the 18px lines would sit in a 16px box and
  crop the tail of the Q in "Mosquito".

- 82ef221: Set the standfirst under the agency's name, and drop Weekly Mosquito Activity from the footer

  The masthead's one-line description used to sit at the far right of the identity rail, set in
  uppercase with wide tracking, where it read as a second masthead competing with the name rather
  than as a description of it. It now sits directly under "Mosquito Extermination Commission" in
  sentence case with a full stop — it is a sentence, and setting it as one lets the agency's name
  keep the emphasis.

  It is also visible at every width now rather than from `md` up. A sticky masthead charges every
  pixel against the viewport for the whole visit, which was the argument for hiding it on a phone,
  but the sentence is what tells a first-time arrival what this agency does and a phone visitor
  needs that more, not less. It runs at 10px below `md` to keep the cost down.

  The mobile menu button's label goes `sr-only` below `sm` and returns above it. That gives the
  identity block about 50px back at the width where the name and standfirst have the least room to
  wrap, taking the name from three lines to two. The label is hidden, not removed: an icon-only
  button has no accessible name, and this button is the only route to six of the seven nav groups
  on a phone. It keeps a 44px tap target.

  In the footer, Other Links no longer carries Weekly Mosquito Activity; the page is still reached
  from the Mosquito Surveillance group in the main nav.

- ce4aab0: Set the masthead a point and a half larger, in one ink

  Every line in the identity rail goes up by 1.5pt, which is 2px — the agency's name from
  11/14/16px to 13/16/18px across the breakpoints, the standfirst from 10/12px to 12/14px, and
  the mobile menu sheet's copy of both from 16px and 12px to 18px and 14px. The masthead is what
  tells a first-time arrival whose site they have opened, and it was set smaller than the body
  copy of the page beneath it.

  The second name line and the standfirst also lose `text-muted-foreground` and inherit the
  rail's foreground, so the whole block is the ink "Middlesex County" already used. Setting the
  agency's own name in two greys read as though the second line were a caption on the first.

- e05c0c9: Point Prevention At Home at the Commission's prevention guide

  The front door's "Prevention At Home" tile promised advice on removing habitats, applying
  repellents and avoiding bites, and delivered the mosquito source checklist route instead. It now
  opens the Commission's prevention document on SharePoint, which is the material the tile
  describes.

  `Destination` gains an optional `external` flag, and `DestinationCell` renders an anchor with
  `target="_blank"` and `rel="noopener noreferrer"` for those rather than a router `Link` — the
  router would otherwise try to match an off-site URL against the route tree. The cell's classes
  and contents are shared by both branches, so the six tiles stay identical in appearance and
  focus behaviour.

- ec365a3: Put **Service Request** back on the public site, and rename Contact Us to **General Inquiries**.

  #212 renamed the public-facing language to "Public Request" on the strength of CONTEXT.md's
  `_Avoid_: service request` line. That was the wrong direction: Public Request is the internal
  name for the concept, and residents read "Service Request". The menu, the footer, the contact
  sidebar, the request hub and the two surveillance pages all say it again, the home-page button
  reads "Request Service", and the request hub and all three intake forms carry their original
  copy — including "the Commission does not accept anonymous requests", which is accurate, since
  every intake form requires a name and a phone number.

  The general contact page is now **General Inquiries**, named that in the nav, the footer and
  the contact sidebar, and its page leads with what it is for — questions about the program —
  and points anyone reporting a problem at the service request form instead.

  CONTEXT.md records the split so this does not get "corrected" a third time: the glossary entry
  keeps Public Request as the internal term and now names the public labels next to it, drops
  `service request` from its `_Avoid_` line, and stops describing a Public Request as anonymous.

  Accessibility work from #212 and #209 is untouched: the option cards stay `h2`s, the office
  number stays a `tel:` link, no link is labelled "here", and the forms keep their `aria-required`
  markers.

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

- dc739af: Spray missions now name the insecticide's active ingredient in parentheses after the trade name, and each mission carries a Method line reading "Ultralow Volume Spraying by Truck".
- dc739af: The spray schedule page now links to the general spray notice from its opening description.
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

- dc739af: Spray missions using Zenivex now link its fact sheet alongside the label and SDS.
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
  - @mcmec/schemas@3.0.0

## 2.0.1

### Patch Changes

- Updated dependencies [cae7305]
  - @mcmec/lib@0.9.1
  - @mcmec/supabase@2.0.1
  - @mcmec/ui@1.6.1

## 2.0.0

### Major Changes

- 76ce7e8: Railway migration Phase 4 — rewire the `public` site to the new backend. This completes the frontend migration.

  **public** — every read now comes from the API's ElectricSQL shape proxy instead of Supabase, and the four intake forms post to the merged public-requests endpoint.

  The site stays server-rendered: reads still run inside TanStack Start server functions, so the data is in the SSR response rather than waiting on a client fetch, and the exported `*QueryOptions` are unchanged — no route touched them. Reading anonymously also means the shape proxy applies the public policy server-side, so unpublished notices, documents, and job postings never reach the process. Spray schedules were a nested PostgREST select; shapes are per-table, so the four shapes are read in parallel and joined in the handler.

  The four submit functions collapse into one that forwards to `POST /api/requests`, which owns the honeypot, Turnstile verification, per-type validation and the insert. Forwarding server-side (rather than posting from the browser) keeps the site talking only to its own origin — no CORS, nothing added to the CSP — and the Turnstile secret now lives only in the API. The visitor's IP is passed through so Turnstile still scores the real client.

  Removed: both Supabase clients, the local Turnstile validator, and `@supabase/ssr` / `@supabase/supabase-js`. `connect-src https://*.supabase.co` is dropped from the CSP; `img-src` keeps it until the brand assets are rehosted. Needs `API_URL` server-side, and no longer needs the Supabase or Turnstile-secret variables.

  **@mcmec/supabase** — the public intake contract, shared by the site and mirroring what the API validates: a `requestType` discriminated union of submission payloads, plus the flat form schemas the site's fields bind to and a helper mapping the contact block into a payload.

  **@mcmec/supabase-tanstack-db-integration** — new `fetchShapeSnapshot`: a one-shot shape read for callers that want current rows rather than a live collection. It waits for the shape to report up-to-date, then aborts the stream so no long-poll outlives an SSR request, and applies the same parser the collections use so server and client rows agree.

### Minor Changes

- 6243c99: Serve the Content-Security-Policy from Nitro instead of `vercel.json`, and let the webfont through

  `apps/public/vercel.json` was the only place the CSP was configured, and Railway does not read
  that file — the header would have vanished the moment production moved off Vercel. It now comes
  from `server/plugins/csp.ts`, set on Nitro's `response` hook so it covers SSR pages, static
  assets and error responses alike.

  The policy also gained `fonts.googleapis.com` in `style-src` and `fonts.gstatic.com` in
  `font-src`. `@mcmec/ui`'s `globals.css` opens with an `@import` of Roboto that survives into the
  built stylesheet, and the old policy allowed neither origin — so the font has been blocked in
  production and the site has been rendering in the fallback stack (#99). Applied to both copies
  of the policy, so it takes effect on whichever host serves production first.

  The `vercel.json` long-cache rule was deliberately not carried over: Nitro already sends
  `public, max-age=31536000, immutable` with an `ETag` on its content-hashed `/assets/` output, and
  correctly withholds it from unhashed files copied out of `public/`.

### Patch Changes

- d1cc9c7: Serve the shared brand images from Railway instead of Supabase Storage. This removes the last runtime dependency on Supabase in the frontends.

  **api** — the nine images (logos, favicon, hero, the 404 illustration) are committed to `apps/api/assets/` and served at `/assets/<filename>` with `Cache-Control: public, max-age=31536000, immutable`, carried over byte-for-byte from what the Supabase upload set. `api` gets the job because it is the only always-on service present in both environments, which preserves the one thing the bucket was buying: a single canonical origin, so all six apps share one copy and one browser cache entry.

  The directory is read once at boot into memory (~2 MB). That keeps a caller-supplied path from ever reaching the filesystem, so traversal is unreachable by construction rather than by validation, and it makes a content-hash `ETag` free — a client that revalidates despite `immutable` gets a 304 instead of 2 MB. The route sits outside `/api/*` and so outside the CORS middleware, deliberately: `<img>` and `<link rel="icon">` loads are not CORS-gated.

  **@mcmec/lib** — `constants/assets` now points at the API origin. It stays hardcoded to production in every environment, including local dev: the bytes are identical everywhere, so this gives one shared cache and adds no build variable a service could be provisioned without — and `public` could not read such a variable anyway, since its API origin is deliberately server-side only.

  Because the filenames are unversioned and served `immutable`, changing an image now requires a **new filename** in both `apps/api/assets/` and `constants/assets`. Overwriting in place will look correct on a fresh browser and stay stale for a year on every returning one.

  **public** — `img-src` drops `https://*.supabase.co` for the API origin, completing the CSP cleanup Phase 4 left open.

  Also removed `scripts/upload-assets-to-storage.ts`, which was the only writer to the bucket. Publishing an image is now a commit.

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
  - @mcmec/ui@1.6.0
  - @mcmec/supabase-tanstack-db-integration@0.3.0

## 1.5.2

### Patch Changes

- 803e1f7: Fix weekly mosquito activity chart rendering when the current year only has a few weeks of data. The week-number domain now spans the union of the current year and the 5-year historical window, so the dashed 5-year average line renders across the full season and the current-year line zero-fills the remaining weeks instead of collapsing to a single point.
- Updated dependencies [803e1f7]
  - @mcmec/ui@1.5.2

## 1.5.1

### Patch Changes

- c45311a: Simplify meeting documents into a single bundled link by dropping the `agenda_url` and `report_url` columns — the consolidated document now lives in `minutes_url`. Updates the notices form, the shared meetings table and mobile list, and the public meetings page to match. Also refreshes the public Job Opportunities page opener with MCMEC's mission and benefits.
- Updated dependencies [c45311a]
  - @mcmec/ui@1.5.1
  - @mcmec/supabase@1.7.1

## 1.5.0

### Minor Changes

- 705816d: Refresh public website design: add Roboto font, refine color palette and shadows, reduce desktop typography scale, add section sidebar navigation, restructure home page with action cards, expand footer with site-wide links, and improve mobile navigation.
- aea9286: Improve SEO for the public website: add per-page meta tags, canonical URLs, robots.txt, sitemap.xml, structured data (JSON-LD), custom 404 page, lazy loading, and cache headers
- 74f924d: Add mosquito spray schedule feature with admin CRUD in notices app, public display with filters at /spray-schedule, new TimeField and MultiComboboxField UI components, and dashboard integration.
- abc06a4: Restructure public website navigation: add Mosquito Control, Mosquito Surveillance, and Job Opportunities sections; move existing pages to new URL paths with 301 redirects from old URLs; add stub pages for spray notice, aerial larviciding, weekly activity, source checklist, and municipal packet.
- d7980a2: Add weekly mosquito activity feature with CSV upload in notices app and recharts-powered visualization on the public site at /mosquito-surveillance/weekly-activity.

### Patch Changes

- 744da27: Add content to under-construction public pages: spray notice, aerial larviciding notice, mosquito source checklist, and municipal packet. Fix CSS @import ordering in globals.css.
- Updated dependencies [705816d]
- Updated dependencies [744da27]
- Updated dependencies [74f924d]
- Updated dependencies [d7980a2]
  - @mcmec/ui@1.5.0
  - @mcmec/supabase@1.7.0

## 1.4.0

### Minor Changes

- b37462b: Add job postings feature with HR management CRUD and public careers pages

### Patch Changes

- Updated dependencies [b37462b]
  - @mcmec/supabase@1.6.0
  - @mcmec/lib@0.8.0
  - @mcmec/ui@1.4.5

## 1.3.1

### Patch Changes

- Fix hero image using relative path instead of Supabase Storage URL

## 1.3.0

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

## 1.2.0

### Minor Changes

- 1a77b67: Add documents system, archive search, and retention warning for LFN 2026-01 compliance
  - Add document_types and documents tables with RLS policies and admin CRUD in the notices app
  - Add Document Categories management page mirroring the existing notice categories pattern
  - Add public /transparency page displaying published documents grouped by type and fiscal year
  - Add text search filter to the notice archive feed (NoticeFeed component)
  - Add inline retention warning when archiving notices posted less than 7 days ago

### Patch Changes

- Updated dependencies [b9b91e2]
- Updated dependencies [1a77b67]
- Updated dependencies [8dc9b46]
- Updated dependencies [5c3f9fd]
  - @mcmec/lib@0.7.3
  - @mcmec/supabase@1.4.0
  - @mcmec/ui@1.4.3

## 1.1.2

### Patch Changes

- 95e01c3: Move shared assets to Supabase Storage. Remove packages/assets, sync-assets build step, and shx dependency. Apps now import asset URLs from @mcmec/lib/constants/assets.
- Updated dependencies [187f5d9]
- Updated dependencies [95e01c3]
- Updated dependencies [501ef75]
  - @mcmec/lib@0.7.2
  - @mcmec/supabase@1.3.1
  - @mcmec/ui@1.4.2

## 1.1.1

### Patch Changes

- 062f055: Turnstile hotfix.
- 5fbfb4f: Hotfix for broken link on home page to public meetings page.
- Updated dependencies [a8b88f5]
- Updated dependencies [2affcd1]
- Updated dependencies [184752c]
  - @mcmec/lib@0.7.1
  - @mcmec/supabase@1.3.0
  - @mcmec/ui@1.4.1

## 1.1.0

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
  - @mcmec/supabase@1.2.0
  - @mcmec/lib@0.7.0
  - @mcmec/ui@1.4.0

## 1.0.0

### Major Changes

- 5c472da: Migrated public website to Tanstack Start framework.

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

## 0.9.0

### Minor Changes

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
  - @mcmec/assets@1.0.0
  - @mcmec/ui@1.3.0
  - @mcmec/supabase@1.1.0
  - @mcmec/lib@0.6.2

## 0.8.0

### Minor Changes

- 1bc6947: Added archived notices feature. Notice feed now has pagination and filtering components.

### Patch Changes

- 2cb183e: Fixed scrollbar not resetting to top of content div when navigating.
- Updated dependencies [1bc6947]
  - @mcmec/ui@1.2.1

## 0.7.0

### Minor Changes

- 456bdae: Turned public notice card into a preview card with callbacks to navigate to notice page and share URL.
  Added a new route in public to display a notice.
  Modified design of notice route in notice manager.

### Patch Changes

- c6cc549: Fixed minor styling issues.
- Updated dependencies [456bdae]
  - @mcmec/ui@1.2.0

## 0.6.0

### Minor Changes

- d00a319: Applied Middlesex County styling guidelines and web/mobile layouts for the public website.
- fb040ad: Created footer for public website.

### Patch Changes

- Updated dependencies [d00a319]
- Updated dependencies [fb040ad]
  - @mcmec/ui@1.1.0
  - @mcmec/lib@0.6.1
  - @mcmec/supabase@1.0.2

## 0.5.1

### Patch Changes

- Updated dependencies [3f9666d]
  - @mcmec/lib@0.6.0
  - @mcmec/ui@1.0.1
  - @mcmec/supabase@1.0.1
