---
target: the shared layout shell of the MCMEC apps
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-08-27T20-02-42Z
slug: packages-ui-src-mcmec-layout
---
**Method: dual-agent** (A: design review · B: detector + evidence, run isolated)

# Critique: the shared layout shell

**Target:** `packages/ui/src/mcmec-layout/` — the chrome composed by `central`, `website-management`, `hr`, and `admin`
**Mode:** Operate

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | No active nav state anywhere. `sidebarMenuButtonVariants` keys on `data-[active=true]`; TanStack `Link` emits `data-status="active"`. Nothing tells you where you are. |
| 2 | Match System / Real World | 1 | Rail says "Spray Schedule" — the exact term `CONTEXT.md:107` forbids for **Spray Mission**. "Weekly Activity" drops "Mosquito". Crumbs read "Public Notices Index", "All Requests". |
| 3 | User Control and Freedom | 2 | Collapse writes `sidebar_state` but `LayoutRoot` never reads it into `defaultOpen` — resets on every reload and every app switch. |
| 4 | Consistency and Standards | 1 | Four consumers, four different shells. Shared tokens and primitives are the only thing holding the line. |
| 5 | Error Prevention | 1 | `website-management` passes unfiltered `AVAILABLE_APPS` — offers HR and Admin to users who cannot enter them. |
| 6 | Recognition Rather Than Recall | 1 | Icon-collapsed rail entirely unlabeled. Zero `tooltip` props passed, across all four apps. |
| 7 | Flexibility and Efficiency | 1 | Cmd+1–4 printed and non-functional. Cmd+B real but undocumented. No palette, no search, no recents. |
| 8 | Aesthetic and Minimalist Design | 2 | Three of four apps render a vertical `Separator` separating the trigger from nothing, in 64px of empty header. |
| 9 | Error Recovery | 1 | Permission refusal escapes the shell entirely. "An Error Has Occurred", primary CTA "Try Again" — which re-throws forever. |
| 10 | Help and Documentation | 1 | `README.md` documents a `LayoutProvider`/`LayoutInset` API that `index.tsx` does not export. `README-NEW.md` documents an app that never existed. |
| **Total** | | **18/40** | **Below the 20–32 band** |

Consistency raised from the reviewer's 0 to 1: the four apps do share tokens and primitives, which is why the divergence is recoverable rather than terminal.

## Design Specificity Verdict

**Interchangeable.** This is the shadcn `sidebar-07` block with the MCMEC logo dropped into the header slot — `AppSwitcher` and `NavUser` are the demo components with names swapped, down to the `ChevronsUpDown` trigger, the `min-w-56 rounded-lg` dropdown, and the `size-8 rounded-lg` avatar.

The damning evidence is not the resemblance — it is that unedited demo content is still in it and is now lying to users. `app-switcher.tsx:67` prints Cmd+1–4 shortcuts that do not exist (the only `metaKey` handler in the repo is Cmd+B in `sidebar.tsx`). `nav-user.tsx:81–88` ships permanently-`disabled` "Account" and "Notifications" for features MCMEC does not have.

Product character exists in the dependency graph but sits outside the shell, in `packages/lib/src/constants/apps.tsx`: hostname-derived environment detection, and the "website-management, not website" comment. The shell itself contributes none. No environment ribbon (despite `apps.tsx` computing the suffix), no App Role vocabulary, no audit affordance.

**Deterministic scan:** clean. Six `detect.mjs` invocations across the shell and all four apps' route trees returned exit 0, empty findings. Zero hardcoded color literals outside one `bg-white` chip; zero unpaired `outline-none`; zero fixed-pixel dimensions. The detector's silence is itself the finding — every defect below is architectural or semantic, in the class no linter catches.

**Visual overlays:** none. No https port was listening; only central's raw Vite upstream (3001) was up, which cannot be browsed directly under schemeful same-site. Booting Caddy plus the monorepo was out of scope. Findings are source-derived and independently verified.

## Overall Impression

The seam is well-drawn and the fill is unfinished. `layout-breadcrumb.tsx` inverts the router dependency through `LinkComponent`/`getLinkProps` generics so `packages/ui` never imports TanStack Router — genuinely good architecture, and why all four apps *can* look identical. They currently don't.

Biggest opportunity: the shell ships slots where it should ship primitives. Four teams hand-wrote the same `items.map(SidebarMenuItem → SidebarMenuButton → Link)` block, and all four independently forgot `tooltip` and `isActive`.

## What's Working

1. **Brand is structurally unforgeable.** `layout-root.tsx:16–17` hard-codes `companyLogoUrl`/`companyName` from `@mcmec/lib/constants` and omits them from the public prop type. A consuming app cannot pass a wrong logo or agency name. The one place the shell encodes a product rule.
2. **The compound-component boundary is correct.** `Object.assign(LayoutRoot, {...})` lets apps fill Header/Content/Footer without the shell knowing their routes, while the breadcrumb's generic `LinkComponent` keeps the UI package router-free.
3. **Environment is derived, not configured.** `apps.tsx:27–54` reads staging vs production off the hostname, so the switcher cannot walk a staging user into production data.

## Priority Issues

### [P0] The four apps have not composed the shell — they have each partially copied it

| | breadcrumb | apps list | TooltipProvider | errorComponent |
|---|---|---|---|---|
| central | none | filtered | no | bespoke |
| website-management | yes | unfiltered | yes | none |
| hr | none — but defines crumbs | filtered | yes | none |
| admin | none | filtered | yes | none |

`hr/.../employees/$employeeId.tsx:25` returns `{ crumb: ... }` — dead data, because `hr/(app)/route.tsx:86` renders `Layout.Content` with no `breadcrumb` prop.

**Why it matters:** on a drill-down like `/employees/Jane Smith/edit`, three of four apps offer no path back but browser Back. Central's bespoke error component is the only place in the repo using raw `text-gray-600`/`text-red-600` — a Hue-150 violation the detector cannot see because they are valid Tailwind.

**Fix:** move breadcrumb derivation into `LayoutContent` behind an adapter injected once at `LayoutRoot`. Make `LayoutContextData.apps` accept only the output of `filterAppsByPermissions` via a branded type. Delete central's bespoke error component.
**Suggested command:** `/impeccable extract`

### [P0] The icon-collapsed rail is unlabeled and unusable

`layout-sidebar.tsx:16` hard-codes `collapsible="icon"`. `sidebar.tsx:497–543` supports a `tooltip` prop rendering `hidden={state !== "collapsed"}` — built precisely for this — and not one of the four sidebars passes it. `SidebarGroupLabel` goes `opacity-0` when collapsed. Collapsed Website Management is eleven anonymous glyphs, including four near-identical document metaphors adjacent.

**Why it matters:** using the collapse control destroys navigation, and because the cookie is never read back the user gets a broken rail and loses the setting on reload.

**Fix:** add `LayoutSidebar.Nav` taking `{label, icon, linkProps}[]`, rendering `SidebarMenuButton` with `tooltip={label}` and `isActive` wired to the router. Read `sidebar_state` in `LayoutRoot` and pass `defaultOpen`.
**Suggested command:** `/impeccable extract`

### [P1] Breadcrumbs echo, duplicate, and never mark the current page

`layout-breadcrumb.tsx:46` renders `BreadcrumbPage` only when `href` is absent — but website-management gives every part an `href`. The current page is a live link and `aria-current="page"` is never emitted. Parent and index routes both declare the same crumb, producing "Insecticides / Insecticides", "Documents / Documents", "Notices / Public Notices Index". `(app)/route.tsx` declares no crumb, so the trail never reaches a Home anchor.

**Fix:** drop an index crumb whose label equals its parent's; seed a Dashboard crumb; render the last item as `BreadcrumbPage` regardless of `href`.
**Suggested command:** `/impeccable clarify`

### [P1] Permission refusal is presented as a crash, outside the shell

Thrown in `beforeLoad`, so the shell is torn down. The user lands on a bare card: "Sorry about that! / An Error Has Occurred / You do not have permission to this action or resource" — grammatically broken, non-specific, primary button "Try Again" which re-throws forever. No link to Central, no switcher, no way out but browser Back.

**Why it matters:** App Roles are the product's central access model. The one moment a user meets that model, the system calls it a crash.

**Fix:** catch the refusal in each `(app)/route.tsx` `errorComponent` and render inside `<Layout>` so sidebar and switcher survive. Copy: "Website Management requires the Website App Role. Your account doesn't have it — an Admin can grant it." Primary action links to Central; remove "Try Again". Fix `constants/errors.ts:3` grammar.
**Suggested command:** `/impeccable harden`

### [P2] Fake shortcuts and dead menu items in the two most-used controls

Cmd+1–4 do nothing. Account and Notifications are permanently disabled features never built. `DESIGN.md`'s "Don't hide a disabled action" is about actions that exist and are unavailable; it is being used to justify demo residue.

**Why it matters:** a user who tries Cmd+2 and gets nothing learns the interface lies, and that distrust generalizes.

**Fix:** implement the shortcuts in `LayoutRoot` or delete `DropdownMenuShortcut`. Delete Account and Notifications outright.
**Suggested command:** `/impeccable distill`

## Persona Red Flags

**Alex (power user).** The one advertised keyboard affordance is fake. Cmd+B works but is surfaced nowhere, and pressing it produces the unlabeled rail. App switching is a cross-origin `<a href>` with no prefetch and no loading state: full SPA cold boot plus Electric resync every time — the largest time cost in the product. No active state means reading the URL to know where he is. `SidebarInput` exists in the primitive and is never mounted.

**Sam (accessibility).** No skip link — `apps/public` has one, the staff shell has none, so Sam tabs through the switcher, up to eleven nav items, and the user menu before reaching content on every navigation. No `aria-current` anywhere. At 200% zoom with no color-based active state either, neither a color nor a non-color signal of location. Focus destroyed on every app switch by the cross-origin reload. Decorative `Separator` at the head of every page header has no `aria-hidden`. Inversion worth naming: in the collapsed rail the label span is visually clipped but stays in the a11y tree, so screen-reader users are better served than sighted keyboard users.

**The seasonal returner** (long-tenured staff opening Spray Missions after eight months). Failed hardest. She looks for "Spray Missions"; the rail says "Spray Schedule", the term `CONTEXT.md` forbids. She looks for "Weekly Mosquito Activity" and finds "Weekly Activity". Both recognition failures manufactured by sidebar copy at the moment recognition matters most. She scans an undifferentiated eleven-item group labelled "Menu" with no seasonal grouping, though PRODUCT.md asks explicitly to keep seasonal tasks legible. If a colleague left the sidebar collapsed on the shared desktop, she opens to eleven unlabeled glyphs. Central — the one app every employee has — is `<h3>Welcome Home!</h3>` over an empty "My Apps" group.

## Minor Observations

- Both READMEs are wrong, and not as a migration. `README.md` is newer (Aug 14) than `README-NEW.md` (Jul 28) yet documents `LayoutProvider`/`LayoutInset` — names `index.tsx` does not export. `README-NEW.md` promises those as a compatibility layer never written, and invents a "Public Notices" app.
- `README.md` documents an Error Boundary feature the shell does not have.
- `TooltipProvider` re-wrapped in three apps despite `SidebarProvider` already providing one.
- `app-switcher.tsx:37` — `bg-white` on the logo tile is the shell's only literal color. In dark mode the sidebar goes Commission Green, making it a white chip on green.
- `hr` and `admin` sidebars both ship "Manage Employees" → `/employees`. Same label, same path, different data scopes.
- `app-switcher.tsx:24` — `if (!activeApp) return null` silently removes the brand mark and the only cross-app exit. Should throw in dev.
- `layout-content.tsx:25` — hard-coded `p-4 pt-0` puts every screen's outer gutter at 16px, off the system's 24px rhythm.
- All four apps ship `"[missing name]"` / `"[missing title]"` as both placeholder and loading state, so every user sees them on cold load before Electric syncs.

## Questions to Consider

1. If the app switcher's whole job is App Roles, why does it show a flat unmarked list instead of the model? Website-management shows locked apps as enabled (a trap); the other three vanish them (a mystery). Visible, disabled, captioned is what DESIGN.md already prescribes.
2. Why is a cross-origin page load the atomic unit of "switching apps"? These four share an SSO cookie, a design system, a sidebar, and a user.
3. Should the shell ship a nav primitive rather than a nav slot? Four of four consumers forgot the same two props — a seam in the wrong place, not four careless teams.
4. What would this chrome look like if it knew it was a public record? Every write is a Command writing an Audit Entry, and none of that is visible. An environment ribbon on staging is already computable.
5. Is "Menu" over eleven items an information architecture, or the absence of one?
