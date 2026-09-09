---
"@mcmec/ui": patch
"public": patch
---

Make the sticky header stick, and let the phone menu say where you are

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
