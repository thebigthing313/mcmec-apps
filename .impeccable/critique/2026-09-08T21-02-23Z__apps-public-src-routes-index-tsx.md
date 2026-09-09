---
target: the shell and landing page
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-09-08T21-02-23Z
slug: apps-public-src-routes-index-tsx
---
Method: dual-agent (A: design review · B: detector + browser evidence)

Scope: the public shell (`__root.tsx`, `nav-bar.tsx`, `footer.tsx`, `skip-link.tsx`) and the landing page (`routes/index.tsx`, `components/hero-carousel.tsx`).

**Coverage gap:** the local `api` service was not running, so every data-backed route (`/notices`, `/notices/meetings`, `/mosquito-control/spray-schedule`, `/mosquito-surveillance/weekly-activity`, `/job-opportunities`, all three intake forms) hung and could not be measured. Evidence is from `/`, `/contact/service-request`, `/contact/contact-us`, `/about/leadership`. No form input was reviewed — placeholder contrast, validation and error states are unassessed.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | No visual active-nav state; focus ring invisible on the navbar (1.00:1); no date or freshness signal |
| 2 | Match System / Real World | 3 | Two adjacent nav groups both open "Mosquito —" — org chart, not resident model |
| 3 | User Control and Freedom | 3 | Carousel pause correct; no breadcrumbs; 404 offers one exit |
| 4 | Consistency and Standards | 1 | `/notices` has four names across the shell; three DESIGN.md rules broken in the navbar |
| 5 | Error Prevention | 2 | Service-request chooser prevents wrong choices; the nav invites one |
| 6 | Recognition Rather Than Recall | 2 | Mobile sheet drops every popover description |
| 7 | Flexibility and Efficiency | 1 | No site search on a statutory archive |
| 8 | Aesthetic and Minimalist Design | 3 | ~55px dead Paper above the footer at >=1280 |
| 9 | Error Recovery | 2 | 404 `alt` duplicates its own `h1`; no route back to urgent destinations |
| 10 | Help and Documentation | 2 | Real inline help exists, no entry point from the shell |
| **Total** | | **21/40** | **Needs work** |

## Design Specificity Verdict

6/10. Specific in the hero band (real Commission photographs, per-slide chosen crops, register-as-one-container, editorial ranking); off-the-shelf municipal template in the shell (green bar + seven ALL-CAPS labels + seal capsule + four-column footer). Sharpest indictment: DESIGN.md's north star is "the public record, legibly kept" and there is not one date anywhere on the landing page.

Deterministic scan: **0 findings** on `routes/index.tsx`, `components/`, `__root.tsx`, and breadth controls `apps/public/src` and `packages/ui/src`. Engine verified live against a synthetic control. One coverage limit: the regex engine does not read React inline style object literals in `.tsx`.

No visual overlays (headless CDP; no [Human] tab).

## Priority Issues

### [P0] The focus ring is invisible on the navbar and fails 3:1 everywhere else

`--ring` is `oklch(0.5353 …)`, `--primary` is `oklch(0.5364 …)` — same lightness. Rendered ring on a navbar link, measured under a real dispatched Tab, composites to **1.00:1** against its green ground. On Paper/Surface/Muted it lands at **1.95-2.05:1**, all under 1.4.11's 3:1. Skip link and logo link fall back to the UA default outline.

Lives in `packages/ui`, so it fails on all five frontends including the staff apps. WCAG 2.4.7 + 1.4.11.

Fix: raise ring opacity and shift its lightness away from `--primary`; measure against `--primary`, `--card`, `--background`, `--muted`.

Command: `/impeccable audit`

### [P1] Horizontal overflow from 768px to 856px, on every page

1px sweep: clean at 767, 89px overflow at 768, 1px over at 856, clean at 857. `scrollWidth` pinned at 842 — the desktop nav's intrinsic width; the bar takes over at `md` (768) but needs 842. WCAG 1.4.10 Reflow. Hits iPad portrait, small laptops, half-screen windows, and a 1536px desktop at 200% zoom.

Fix: move sheet/bar handover from `md` to `lg`; let the bar wrap or shrink above that. Verify `scrollWidth === clientWidth` at 768, 834, 1024, 1280@200%.

Command: `/impeccable adapt`

### [P1] The carousel's selected tick is 1.19:1 against its own track

Track (Muted Ink) measures 5.48:1 against the plaque — good. The Commission Green fill marking the current slide sits on that dark track at **1.19:1**. The control's visibility was fixed and its state indicator broken in the same edit. DESIGN.md's claim that "state is carried by how much of it is green" is currently false.

Fix: lighten the selected tick's unfilled remainder, or invert to a dark fill on a light track. Measure fill against track, not just against plaque.

Command: `/impeccable audit`

### [P2] The landing page contains none of the record it exists to publish

No next Spray Mission, no current Notice, no next Meeting, no "as of". PRODUCT.md Principle 2 names the urgent question; the page answers it with a link. Only dated fact on the page is "1914".

Fix: a "Tonight" strip under the band — next Spray Mission (municipality, date, window, status as a word) or an explicit "No spray missions are scheduled tonight", plus latest Notice with date and next Meeting date.

Command: `/impeccable shape`

### [P2] Every destination has two or three names

`/notices` = "Public Notices" (nav group) / "Legal Notices" (nav item) / "Public Notices" (home register) / "Legal Notices" (footer). `mosquito-source-checklist` = "Mosquito Source Checklist" (nav) / "Prevention at Home" (home). `/contact/service-request` renders an `h1` reading "Service Request" under a sidebar reading "Service Requests". Violates PRODUCT.md Principle 3.

Fix: one label per URL in a single exported map; rename the nav group so it stops colliding with its child.

Command: `/impeccable clarify`

## Persona Red Flags

**Older resident on a phone** (majority case — DESIGN.md line 301 says public-site residents "arrive on phones more often than not"): mobile sheet gives seven bare labels with no descriptions; must know Spray Schedule is under "Mosquito Control" not "Mosquito Surveillance"; **12 elements under 24x24 CSS px at 390** (Menu button 68.7x20, every footer link 342x20); footer phone styled identically to the fax beneath it; reads at 200% zoom, squarely inside the P1 overflow range.

**Resident with an urgent question, 9pm**: landing page gives a link named "Spray Schedule" and not one fact; no hours anywhere; 404 from a stale mailer offers only "Back to Home".

**Municipal official verifying a posting**: no active nav state, no breadcrumb, **no search** across four separate notice destinations; nothing carries an "as of" or retention indication.

**Screen-reader user**: **no header element on any page — no banner landmark**; **four nav landmarks, none labeled** (three unlabeled siblings in the footer); the only `h2` on home is `sr-only`; destination-cell accessible names concatenate title and description with no separator.

## Minor Observations

- 942KB of images on the home page; 818KB is the six hero photos, **all six download on load** — `loading="lazy"` defers nothing already in the viewport. Mount slides 2-6 after first paint.
- `logo512.png` served at 10.67x its rendered box (128KB for a 48x48); `county-logo.png` at 5.58x. ~145KB of easy wins.
- Sidebar active link on `/contact/service-request` measures 4.00:1 — normal-text fail.
- `/contact/service-request` uses off-system slate values instead of the green-cast neutrals.
- Navbar carries `shadow-md` on a resting sticky surface — against Flat-By-Default, and not one of the three named shadows.
- ALL-CAPS primary navigation contradicts the Uppercase Is Structural Rule.
- **DESIGN.md describes the public nav as "five top-level groups". There are seven.**
- ~55px of dead Paper above the footer at 1280 and 1920 — `main` is `flex-1` inside `min-h-screen` and stretches past the section's `-my-8`, contradicting DESIGN.md's "closes flush against the footer".
- Reduced motion fully honored, verified with a control run (no-preference: 0 to 1 to 3 over 15s with `rule-x` running; reduce: stays on slide 0, `getAnimations()` empty).
- Only console errors are the Vite HMR socket blocked by the app's own CSP — an artifact of browsing the http upstream.

## Questions to Consider

1. Why is the front door of a public-record site the only page with no record on it?
2. Which of "Mosquito Control" and "Mosquito Surveillance" contains the spray schedule?
3. The home register ranks its six destinations editorially; the nav ranks its seven by nothing. Why does "About" outrank Spray Schedule?
4. What does this site say at 2am in August when a resident is scratching?
