---
"@mcmec/ui": minor
---

Make the staff shell navigable without a mouse

The public site has had a skip link and semantic landmarks all along. The four staff
applications — the ones people use all day, every day — had neither.

**The rail is a landmark.** It was `div > div > ul` to the bottom, so the only `nav` on a staff
screen was the breadcrumb, and that renders on a fraction of screens. A screen-reader user had no
way to jump to the navigation or past it. `LayoutNav` now renders inside
`<nav aria-label="{activeApp} sections">` — labelled, because a staff screen has two navigation
landmarks and calling both "navigation" tells nobody which is which.

**A skip link, first in the tab order.** Without one, a keyboard user tabbed the sidebar trigger,
the app switcher, every destination in the rail — eleven of them in Website Management — and the
user menu before reaching the page, on every navigation. It sits above the viewport until focused
and then draws as a real control, because someone who tabs into it needs to see where focus went.
Its target carries `tabIndex={-1}` so focus genuinely moves rather than only changing the hash,
and it uses the same `#main-content` id the public site already uses.

**The refusal screen stops centring in a full viewport.** `min-h-screen` with vertical centring
put the card in the middle of the window, so at 200% zoom the only content on the page sat below
an empty half-screen. It is padded from the top instead.

**Browser zoom flipping the rail into a sheet is left alone, deliberately.** `useIsMobile` is a
width breakpoint, so 200% zoom on a 1280px display reports roughly 640px and the rail becomes an
overlay. That reads as a surprise, but it is the correct behaviour: WCAG 1.4.10 asks content to
reflow at 320 CSS px without two-dimensional scrolling, and a 256px rail inside a 640px viewport
takes 40% of it. Suppressing the sheet at high zoom would trade a small surprise for a likely
reflow failure, and the hook is shared with `apps/public`, where a `pointer: coarse` guard would
also change which hero image the home page picks. The reasoning is now recorded in DESIGN.md's
Desktop-First rule and the shell's README rather than left for someone to rediscover.
