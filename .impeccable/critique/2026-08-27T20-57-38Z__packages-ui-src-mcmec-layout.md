---
target: the shared layout shell of the MCMEC apps
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-08-27T20-57-38Z
slug: packages-ui-src-mcmec-layout
---
Method: dual-agent (A: design review, B: detector + static). Assessment B's browser step FAILED
(hidden-pane trap: its fresh tab was never the visible pane, Electric stalled, nothing hydrated).
Its detector and static sweep stand; live measurements below are the parent's own, not independent.

# Critique: the shared layout shell (re-run)

Target: packages/ui/src/mcmec-layout/ - Mode: Operate

## Design Health Score - 27/40 (was 18/40, +9)

| # | Heuristic | Was | Now | Key issue |
|---|---|:--:|:--:|---|
| 1 | Visibility of System Status | 1 | 2 | Collapsed, nothing names which of four apps you are in; switcher passes no tooltip |
| 2 | Match System / Real World | 1 | 3 | Vocabulary fixed; rail "Public Notices" vs breadcrumb "Notices" for one place |
| 3 | User Control and Freedom | 2 | 2 | AppRoleRequired offers only Go to Central; no sign-out, wrong-account login loops |
| 4 | Consistency and Standards | 1 | 2 | Breadcrumb 1/4 apps; redundant TooltipProvider 3/4; three loader shapes |
| 5 | Error Prevention | 1 | 4 | Branded AccessibleApps, required currentPath, omitted brand props - structural |
| 6 | Recognition Rather Than Recall | 1 | 3 | Nav rows tooltipped; header and footer rows exempt from the same guarantee |
| 7 | Flexibility and Efficiency | 1 | 2 | Cmd+B and a persisted rail is the whole expert affordance; no skip link |
| 8 | Aesthetic and Minimalist | 2 | 3 | Real subtraction, undercut by a 64px header holding one icon in 3/4 apps |
| 9 | Error Recovery | 1 | 3 | access-notice.tsx is strong; loses points for the no-sign-out exit |
| 10 | Help and Documentation | 1 | 3 | README largely accurate; cookie-scope claim wrong, TooltipProvider note ignored |

## Design specificity

Was "interchangeable shadcn chrome". Now "authored", specifically in its constraints: brand props
the type refuses, AccessibleApps making an unfiltered switcher uncompilable, and deleted shortcuts
carrying the reason for their deletion.

Deterministic scan clean: six detect.mjs runs, exit 0, zero findings. Zero hardcoded colours, zero
unnamed interactive elements, zero unpaired outline-none, zero remaining "Spray Schedule" /
"Weekly Activity" in staff src/.

## Claims checked before repeating

REFUTED - "Dashboard announces as current page on every screen". Measured on /notices/<id>:
exactly one nav row carries aria-current; Dashboard is null. TanStack matches routes, not string
prefixes, so to="/" (the index route) is absent from that match chain. The breadcrumb instance of
this bug was real; the nav instance does not exist.

CONFIRMED - no shell-owned page title; no nav landmark or skip link; cookie is host-scoped.

## What's working

1. Type-enforced permission honesty: all four apps pass filterAppsByPermissions and the brand makes
   the alternative a compile error.
2. The nav moved to the right side of the seam: every row tooltipped, active row Commission Green
   plus aria-current.
3. Subtraction with recorded reasoning: dead shortcuts, disabled menu items, a separator dividing
   nothing, a heading over emptiness - each removed with the reason written down.

## Priority issues

[P0] The shell owns no page title. Verified: 8x font-bold text-2xl, 3x text-3xl, 3x font-semibold
text-2xl across leaf screens; notices/index.tsx has no heading at all; h1Count measured 0 on the
notice detail page. DESIGN.md specifies Headline at 1.25rem; nothing matches. Fix: LayoutContent
takes a required title and renders the h1 itself. Command: /impeccable extract

[P0] Collapsed, the rail cannot tell you which app you are in. size-8! plus overflow-hidden clips
the switcher's identity block to a bare logo and the switcher passes no tooltip - the exact
guarantee LayoutNav makes for every other row. Fix: tooltip on switcher and NavUser triggers;
render activeApp in the header when collapsed. Command: /impeccable extract

[P1] No nav landmark, no skip link. Verified: rail is a > li > ul > div; only labelled nav is the
breadcrumb; no skip link. Up to 15 tab stops before content. Command: /impeccable harden

[P1] The README overstates the rail-state fix. Verified: cookie written path=/ with no domain=, so
host-scoped. Production apps are separate subdomains, so a collapsed rail survives a reload but not
an app switch. Correct the README or give the cookie a domain. Command: /impeccable harden

[P2] Zoom flips the rail into a modal sheet. useIsMobile is a width breakpoint, so 200% zoom on a
1280px display reports ~640px and turns persistent navigation into an overlay. The Desktop-First
rule covers phones and never considered zoom.

## Persona red flags

Alex: loses the app name when collapsed; Cmd+B advertised nowhere; switcher makes him re-read four
rows to find the one he is not in.
Sam: no landmark, no skip link; SidebarGroupLabel hides with opacity-0 so a collapsed rail still
reads out headings that are not on screen; 200% zoom silently converts the rail to a modal.
Seasonal returner: much better served (vocabulary, grouping, tooltips), but rail "Public Notices"
vs crumb "Notices", and the switcher's App.description is fetched into context and discarded.

## Questions

1. If four forks is how five apps stop looking like one, why does the shell stop at the header bar?
2. AccessibleApps proves a design failure can be made uncompilable. What stops the same move on
   activeApp: string?
3. Three of four apps render no breadcrumb and the fix was to hide the separator. Is the empty
   header the design, or is the missing breadcrumb the bug?
4. Why is a resident owed the switcher's descriptions and an employee eight months away not?
