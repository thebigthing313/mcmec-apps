---
"@mcmec/lib": minor
"@mcmec/ui": patch
"public": minor
---

Answer the spray schedule question the way it is asked, and stop the notices register burying its own postings

Three public-site defects, each one a resident reading something the Commission did not mean to say.

**The spray schedule led with the wrong mission.** Every mission of the current year rendered in one reverse-chronological list, so the top card was the furthest-out or most recently past mission rather than the next one — a resident checking before bed read the top of the page and drew the wrong conclusion. Missions now split into Upcoming, soonest first, and Past, most recent first, over a new pure `spray-periods` module in `@mcmec/lib`.

There is deliberately no "Tonight" group. Missions run overnight — 3am–8am as readily as 7pm–midnight — so a mission dated the 4th starting at 3am is, to the person who sees the truck, the night of the 3rd. Any "tonight" label would be wrong for a large share of missions and wrong in the direction that tells a resident they are clear when they are not. For the same reason the split is computed from the mission's *end* rather than its date, so a mission in progress stays under Upcoming instead of dropping into Past at midnight with the trucks still out.

Mission `status` is not consulted. It is an authored lifecycle value staff advance by hand (ADR 0001), so a past mission legitimately still reads "Scheduled" while it waits to be marked completed; grouping is about the clock and the badge is about the record. Under a "Past spray missions" heading that lag reads as a record awaiting its update, which is what it is. Each group also carries a real heading and count, and an empty Upcoming group now says "No upcoming spray missions scheduled" — the reassurance the page never offered, without which "nothing is scheduled" and "the page told me nothing" looked identical.

**Consent to enter a yard was pre-granted.** The Access to Premises switch on the adult mosquito request form defaulted to on, so a resident who scrolled past it authorized an inspector to enter their property while nobody was home without ever deciding. It now defaults to off, and both states were reworded so neither answer puts words in the resident's mouth — the old "no" asserted a locked gate and an outdoor pet on their behalf.

**Current legal notices were paginated and clipped.** The register showed five notices per page and cut each one behind a fade at 192px, on the page whose own opening paragraph designates it the Commission's primary method of publication under P.L. 2025 c.72. Current notices now render in full on one page. `/notices/archive` keeps pagination and clipping — it is a browse surface that grows without bound, not the statutory register — via new `paginate` and `truncate` props.

Also fixes the React #419 error on `/notices`: the share URL read `window.location.origin` during render, which does not exist during SSR and bailed the route's Suspense boundary out to a client re-render. The origin is now read when the reader asks to share.
