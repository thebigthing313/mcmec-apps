---
"@mcmec/ui": minor
"website-management": patch
"central": patch
"admin": patch
"hr": patch
---

Give every staff screen one heading, and tell people which app they are in

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
