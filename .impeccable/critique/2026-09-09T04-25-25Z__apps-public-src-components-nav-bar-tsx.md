---
target: the header
total_score: 21
max_score: 36
na_heuristics: 9
p0_count: 1
p1_count: 2
timestamp: 2026-09-09T04-25-25Z
slug: apps-public-src-components-nav-bar-tsx
---
⚠️ DEGRADED: single-context (session policy forbids spawning sub-agents unless the user asks)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Desktop paints the active group; the mobile sheet paints nothing. And because the bar isn't actually sticky, there is no persistent "where am I" chrome on any long page. |
| 2 | Match System / Real World | 3 | Plain language throughout. "Service Requests" (plural) reads as *my* requests rather than *make one*; "Public Notice for Adult Mosquito Control Treatment" is a 49-character menu label. |
| 3 | User Control and Freedom | 2 | On the archive, the spray schedule and transparency, the only route back to navigation is scrolling to the top. The sheet's escape hatch is a 16px, 70%-opacity ×. |
| 4 | Consistency and Standards | 2 | One destination carries three names; the header menu and the section rail order the same group's children differently; desktop and mobile diverge on active state and descriptions. |
| 5 | Error Prevention | 3 | Desktop descriptions do real work preventing a wrong click among two "Mosquito —" groups. Mobile drops them and reinstates the guess. |
| 6 | Recognition Rather Than Recall | 2 | Seven top-level groups, two beginning "Mosquito", and on mobile no descriptions and no current-section marker to disambiguate them. |
| 7 | Flexibility and Efficiency | 2 | Skip link is real and works. No search, no way to reach a group's own landing page from its trigger. |
| 8 | Aesthetic and Minimalist Design | 3 | The green bar is confident, flat and uncluttered. The sheet's seven full-width separators are heavier than a seven-item list needs. |
| 9 | Error Recovery | n/a | The header has no error surface. |
| 10 | Help and Documentation | 2 | The popover descriptions *are* the contextual help, and mobile has none. |
| **Total** | | **21/36** | **Acceptable (58%)** |

## Design Specificity Verdict

**LLM assessment.** The desktop bar is authored, not generic. Full-bleed Commission Green, uppercase tracked labels, and the seal in a white puck that breaks the band — that is a municipal-authority register, not a SaaS navbar, and it matches the world DESIGN.md commits to. The active-group chip and the inverted focus ring are specific, correct decisions.

The mobile sheet is the opposite: default shadcn. Ghost buttons, a separator between every row, a 16px ×, and no trace of the green, the uppercase, or the seal. Half of Middlesex County meets the Commission through a menu that could belong to any product.

**Deterministic scan.** `detect.mjs --json apps/public/src/components/nav-bar.tsx` returned `[]` — clean, exit 0. Every finding below came from measurement in the page, which is where the sticky failure lives; it is invisible to a static scan because the classes are all present and correct.

**Browser evidence.** Headless Chrome over CDP against `localhost:3548`, at 1440×900 and 390×844. No overlay injection was attempted, so there is nothing to look at in a browser tab; the evidence is the measurements quoted inline.

## Overall Impression

The bar looks finished and is not. Its single most important behaviour — staying on screen — has never worked at either breakpoint, and everything else here is downstream of a mobile menu that was never given the same attention as the desktop one. Fix the sticky bug and bring the sheet up to the bar's standard and this header goes from Acceptable to Good without touching the information architecture.

## What's Working

- **The desktop active state.** On `/notices/archive` the "Public Notices" trigger reports `data-active="true"` while the other four report `false`. Prefix matching means a group stays lit anywhere inside it, which is the behaviour a button-triggered group cannot get from `aria-current` on its own.
- **The focus ring inversion.** Tab stops 3–9 all measure `oklch(0.985 0.0199 112.933) 0 0 0 3px` — the pale ring, opaque, on Commission Green. Every nav control has a visible, correctly-contrasting indicator.
- **The popover descriptions.** "Notice for aerial larviciding operations" under a label a resident would otherwise have to guess at is the difference between a menu and a directory.

## Priority Issues

### [P0] The sticky header is not sticky — at either breakpoint

`sticky top-0 z-50` sits on the bar `<div>`, whose parent is the `lg:hidden` / `hidden lg:block` wrapper. A sticky element is clamped to its parent's box, and that wrapper is exactly the bar's own height — so the travel range is zero. Measured: `parentH: 64, selfH: 64`; scroll to 800 and `top` goes to `-800`; `header.getBoundingClientRect().bottom` reads `-836`. Mobile is the same with 56.

**Why it matters.** Archived Notices, the spray schedule, and Transparency are long pages, and they are the pages a resident arrives at from a search result. Once they scroll, the only way back to navigation is to scroll all the way up. That is also the one Nielsen-1 affordance the header exists to provide.

**Fix.** Move `sticky top-0 z-50` from the two inner bars onto `<header>` itself. Its containing block is the shell's `min-h-screen flex-col` div, which has the height for it, and one move fixes both breakpoints. Keep `z-50` above the hero's `z-30` plaque.

**Suggested command:** `/impeccable polish`

### [P1] The mobile menu never says where you are

Opened on `/mosquito-control/spray-schedule`: every row reports `aria-current: null`, `data-status: null`, `backgroundColor: rgba(0,0,0,0)`, and `[data-state=open]` matches nothing — the visitor's own section is collapsed shut like the other five. Desktop got location feedback last pass; the sheet did not.

**Why it matters.** A resident on a phone opens the menu to move sideways within the section they are reading, and the menu has forgotten which section that is. With two groups starting "Mosquito" and no descriptions in the sheet, they now have to remember which one they came from.

**Fix.** Give the sheet's leaf links the same active treatment the bar's links take, and default the matching `Collapsible` to open by prefix — the group `NavPopover` already computes.

**Suggested command:** `/impeccable adapt`

### [P1] Two defects in the sheet's dialog wiring

The close control measures **16×16 with `opacity-70`** and no padding — icon-sized, not target-sized. It clears WCAG 2.5.8 only on the spacing exception (nothing else is within 24px of it), which is not a reason to ship a 16px tap target as the only pointer exit from a modal.

Separately, the dialog carries `aria-describedby="radix-_R_aj6H2_"` pointing at **an element that does not exist** — Radix auto-wires a description id and no `SheetDescription` is rendered. The `aria-describedby="Mobile Menu"` on `<Sheet>` is inert; it is not a prop the Root forwards, and "Mobile Menu" is not an id.

**Why it matters.** A dangling `aria-describedby` is a broken reference a screen reader resolves to nothing, on the only navigation a mobile AT user has.

**Fix.** Pad the close button to a 24px minimum (it lives in `packages/ui`, so this lands in all five frontends). Render an `sr-only` `SheetDescription`, or pass `aria-describedby={undefined}`, and delete the inert prop on `<Sheet>`.

**Suggested command:** `/impeccable harden`

### [P2] One destination, three names

`/contact/service-request` is **"Service Requests"** in the nav, **"Request Service"** in the footer, and **"Request Service"** on the landing page. `/notices` sits inside a group called **"Public Notices"** while the item itself, the footer, and the landing page all call it **"Legal Notices"** — the group still collides with its own child, which is the collision the landing-page rename was supposed to end. It was fixed in one of the two places.

**Why it matters.** A resident told by a mailer to "submit a service request" scans a menu for those words and finds a group called Contact. Plural also reads as a list of requests they have made rather than an action they can take.

**Fix.** "Request Service" everywhere. Rename the nav group to something that does not restate its child — "Notices & Meetings" covers all four members honestly.

**Suggested command:** `/impeccable clarify`

### [P2] The header menu and the section rail disagree on order

Under Public Notices the popover reads Public Meetings → Legal Notices → Archived Notices → Transparency. The section rail on the same page reads Legal Notices → Public Meetings → Archived Notices → Transparency. Same four links, same group, two orders, both visible in the same viewport.

**Why it matters.** Positional memory is most of how anyone uses a menu twice. Two orders means neither one can be learned.

**Fix.** One source of truth for the group's children, consumed by both. Lead with Legal Notices — it is the group's own landing page.

**Suggested command:** `/impeccable polish`

## Persona Red Flags

**Jordan (First-Timer).** Reads "Contact" and does not expect a service request behind it — the mailer said "service request", and the word is one level down. Sees "Mosquito Control" and "Mosquito Surveillance" side by side with no idea which holds the spray schedule; on desktop the descriptions rescue this, on mobile nothing does.

**Sam (Accessibility-Dependent).** Keyboard focus is excellent through the bar — nine stops, all with a visible 3px ring. Then: the logo link's indicator is the browser's own `1px auto` outline rather than the system's ring, the only control in the header that differs. In the sheet, `aria-describedby` resolves to nothing, and no row is marked current so the rotor gives no position. At 200% zoom on a 1536px display the bar renders at its 768px-equivalent width, which is the reflow case the `lg` breakpoint was moved to cover — that one holds.

**Casey (Distracted Mobile).** Opens the spray schedule from a text message, scrolls to their town, gets interrupted, comes back, wants the menu — it is 3000px up the page. Taps the 16px × to close the sheet and misses.

## Minor Observations

- The desktop logo `<Link>` carries no class at all, so it takes the UA focus ring instead of the system's `ring-[3px]`. It is visible and contrasts fine on the white puck, but it is the one inconsistent focus indicator on the page.
- Its accessible name is "MCMEC Logo". A link's name should be its destination: "MCMEC home".
- The seal sits in an 80px `rounded-r-full` puck on desktop and a 64px `rounded-l-full` puck on mobile — the brand anchor swaps sides across the breakpoint. Defensible on a phone, worth being a decision rather than an accident.
- In the sheet, the leaf rows ("Home", "Job Opportunities") sit about 4px left of the group rows. A vertical list with two left edges.
- Seven full-width separators for seven items gives every row the same weight, so nothing distinguishes "this navigates" from "this expands" except the chevron.
- Seven top-level groups is above the ≤5 working-memory guideline, and two of them begin with the same word. Explicitly deferred last pass; still true.
- "Public Notice for Adult Mosquito Control Treatment" as a menu item is 49 characters and wraps to two lines in a `w-80` popover.

## Questions to Consider

- If the bar has never actually stuck, has anyone been navigating this site from halfway down a long page — or has everyone been testing from the top?
- What is the mobile menu *for*? If it is "move within the section I am reading", it should open into that section rather than into seven closed drawers.
- Two of seven groups begin with "Mosquito". Is that the county's vocabulary, or ours?
