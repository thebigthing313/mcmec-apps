---
"@mcmec/ui": minor
"website-management": patch
---

Say what the Commission says, and make the breadcrumb do wayfinding

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
