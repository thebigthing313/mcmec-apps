---
"@mcmec/ui": minor
"public": minor
---

Fix the mechanical WCAG failures on the public site, mostly in shared components

Six accessibility defects, found by measuring the live DOM rather than reading the source. Most of them were one shared component away from being fixed everywhere at once, which is why the public site had them at all.

**Checkboxes had no accessible name.** `CheckboxField` rendered its `<Label>` without `htmlFor`, and did not hand the label to `FormField` either — so the Radix checkbox was a button with no name, and clicking the visible text did not toggle it. Six controls on the adult mosquito form alone. One attribute; every checkbox in every MCMEC frontend was affected.

**The zip code label pointed at nothing.** `AutoComplete` never put an id on its input, so `FormField`'s `htmlFor` matched no element in the page and the visible "Zip Code" label was decorative. The input now takes the field's id.

**The phone extension input had no label of any kind** — no id, name, `aria-label` or placeholder, only a visual "ext." addon that assistive technology cannot see. It now carries an `aria-label`, an id and a name.

**The read-only City input was unlabeled** for the same reason, on all three request forms.

**Required-ness was visual only.** Callers typed the marker into the label text (`label="Full Name *"`), which put a bare asterisk in the accessible name — the field announced as "Full Name star". `FormField` takes a `required` flag now: it draws the asterisk itself with `aria-hidden`, adds a screen-reader-only "(required)", and the text, phone and autocomplete fields forward `aria-required` to their control. Fourteen labels across the three public request forms converted.

**No skip link on the public site.** WCAG 2.4.1 is Level A, and seven nav groups with their popovers sat between a keyboard user and the page on every navigation. `apps/public` had carried the `#main-content` target all along with nothing pointing at it — while the staff layout, which does have a skip link, carried a comment asserting the public site already had one. The link is now a shared `SkipLink` block used by both, so there is a single implementation to be right or wrong, and public's `<main>` takes `tabIndex={-1}` so the jump actually lands.

**Every interior page opened with an out-of-order heading.** `SectionSidebar` rendered its section title as an `h2` that precedes the page's own `h1` in DOM order, so the real page title was the second thing in the outline on all six interior public pages. It is an eyebrow, not a heading, and the nav around it already carries an `aria-label` built from the same string, so it is a `div` now. No visual change.

Not included, and still outstanding: the eight charts on Weekly Mosquito Activity have no text or tabular alternative, and the footer's `text-accent-foreground/70` on `bg-accent` measures 2.16:1 against a 4.5:1 requirement. Both need a visible design decision rather than a wiring fix.
