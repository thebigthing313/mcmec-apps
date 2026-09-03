---
"@mcmec/lib": minor
"@mcmec/ui": patch
"public": minor
---

Sweep the small defects on the public site, one of which was not small

A pass over the minor findings from the critique. The first one turned out to be a correctness bug on a statutory page rather than a console warning.

**Meeting times were rendered in whatever timezone the runtime happened to be in.** `formatDateTime` pinned none, so the SSR server — which runs in UTC — rendered a 12:00 PM meeting as `4:00 PM (UTC)`, and the browser then re-rendered it as `12:00 PM (EDT)`. That is the React #418 hydration mismatch on `/notices/meetings`, and it means the server-sent HTML — what a crawler, a reader before hydration, and anyone without JavaScript sees — carried a meeting time wrong by four or five hours, on the page that discharges the Commission's 48-hour OPMA notice.

It is pinned to `America/New_York` now, named as `COMMISSION_TIME_ZONE` because it is a fact about the agency rather than a formatting option: every meeting on the public record is called in Edison. A resident reading from another state needs the time the doors actually open, not that instant translated into their own zone. Covered by ten new tests with absolute expectations, deliberately not derived from the host clock — the defect was that the output depended on the host clock, so a test computing its expectation the same way the code does would have passed throughout. This also corrects the same wrong time in `central` and `website-management`.

**The meetings page also chose its layout with a hook.** `useIsMobile` returns false on the server and during the first client render, then flips after an effect, so on a phone the server sent the table and the browser swapped in the list. Both layouts render now and CSS picks one, which is how the navbar has always done it.

The rest, briefly:

- **The footer's phone number is a link.** It was plain text, so the one fallback channel a resident has required copying digits off a phone screen by hand. The fax stays text — nothing dials it. Both icons are now `aria-hidden` with a screen-reader label, since a bare icon beside a number does not say which number it is.
- **Notice cards said "Published on"** over a value that comes from `notice_date`, the notice's own legal date, which is not the day it went up. It reads "Notice date" now. The old fallback printed a literal `[unknown]` to the public; an undated notice shows nothing instead.
- **A notice whose category did not resolve was published as type "Unknown".** That is a gap in our lookup, not a notice of unknown kind. The row is omitted instead.
- **Notice search matched titles only**, so a resident looking for their own street — named in the body of a spray notice and nowhere in its heading — got nothing back. It searches the body text too now.
- **The Type and Year filters had no way back.** Neither select offered an "All" item, so once you picked one the only route to unfiltered was the Clear button, which only appears once something is already filtered.
- **An empty register and an over-tight filter now say different things.** The page used to blame filters that were not set.
- **The notice title looked clickable and was not reachable** — `cursor-pointer`, a hover underline and an `onClick` on a plain div. It is a button now, so it takes focus, answers Enter, and announces itself.
- **Cancelled spray missions no longer take the destructive red.** Red is the system's refusal colour and was being asked to carry urgency, which the design system rules out — and it read as bad news, when a cancelled spray is neutral or welcome for most people looking at it.

Deliberately not done: Cloudflare Turnstile still loads on every page rather than only the four intake forms. Moving it would drop a third-party fetch from the rest of the site, but the widget depends on `window.turnstile` existing when it mounts, and getting that wrong breaks Public Request intake entirely. Not a change to make without exercising the submission path.
