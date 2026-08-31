---
name: MCMEC
description: The shared visual system behind the Middlesex County Mosquito Extermination Commission's public website and its four staff applications.
colors:
  commission-green: "oklch(0.5364 0.1457 150.5842)"
  commission-green-contrast: "oklch(0.985 0.0199 112.9333)"
  brackish-teal: "oklch(0.6638 0.0267 183.8599)"
  brackish-teal-contrast: "oklch(0.98 0.005 150)"
  paper: "oklch(0.985 0.002 150)"
  surface: "oklch(0.98 0.005 150)"
  sidebar-ground: "oklch(0.96 0.01 150)"
  pale-green: "oklch(0.92 0.03 150)"
  muted-surface: "oklch(0.94 0.01 150)"
  ink: "oklch(0.2537 0.0035 164.7797)"
  muted-ink: "oklch(0.45 0.02 150)"
  rule: "oklch(0.8 0.02 150)"
  field: "oklch(0.92 0.01 150)"
  focus-ring: "oklch(0.5353 0.1357 153.5529)"
  refusal-red: "oklch(0.5046 0.2053 29.0423)"
  chart-1: "oklch(0.6104 0.0767 299.7335)"
  chart-2: "oklch(0.7889 0.0802 359.9375)"
  chart-3: "oklch(0.7321 0.0749 169.867)"
  chart-4: "oklch(0.854 0.0882 76.8292)"
  chart-5: "oklch(0.7857 0.0645 258.0839)"
typography:
  display:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 2vw, 1.25rem)"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  title:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "normal"
  overline:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.025em"
  masthead:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.16em"
  auth-heading:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 2.5vw, 1.875rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  full: "9999px"
spacing:
  base: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "56px"
components:
  button-primary:
    backgroundColor: "{colors.commission-green}"
    textColor: "{colors.commission-green-contrast}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "oklch(0.5364 0.1457 150.5842 / 0.9)"
    textColor: "{colors.commission-green-contrast}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-outline-hover:
    backgroundColor: "{colors.brackish-teal}"
    textColor: "{colors.brackish-teal-contrast}"
  button-destructive:
    backgroundColor: "{colors.refusal-red}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px 0"
  badge-status:
    backgroundColor: "{colors.commission-green}"
    textColor: "{colors.commission-green-contrast}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-status-draft:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  signal-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "12px 16px"
  signal-cell-hover:
    backgroundColor: "{colors.pale-green}"
    textColor: "{colors.ink}"
  signal-cell-selected:
    backgroundColor: "{colors.commission-green}"
    textColor: "{colors.commission-green-contrast}"
    padding: "12px 16px"
  signal-queue-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "10px 16px"
  auth-frame:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    borderColor: "{colors.rule}"
    rounded: "0px"
    padding: "40px 56px"
  auth-masthead:
    backgroundColor: "transparent"
    textColor: "{colors.muted-ink}"
    typography: "{typography.masthead}"
---

# Design System: MCMEC

## Overview

**Creative North Star: "The Public Record, Legibly Kept"**

This is an archival register that happens to be a website. The Commission's authority does not come from persuasion — it comes from the fact that what is posted here *is* the legal notice, and that nothing posted is ever quietly lost. Cancelled meetings stay visible. Archived notices stay reachable. The visual system exists to make that permanence feel deliberate rather than accidental: hairline rules, generous dates, columnar order, and a green so specific to this agency that it needs no explanation.

The surfaces are warm, not clinical. Every neutral in the light theme carries a faint green cast (hue 150), so backgrounds read as paper in daylight rather than as a gray dashboard. Structure is carried entirely by borders and tonal steps, never by shadow. The result should feel crisp and institutional — tight registration, consistent rhythm, a faint formality — without ever tipping into decoration. A resident who arrives asking whether their street is being sprayed should get the answer and forget the interface existed.

Two failure modes are rejected by name. The first is **startup SaaS**: gradient meshes, glassmorphism, oversized marketing heroes, "Get Started Free." This is a New Jersey county agency, not a product launch. The second is **municipal-site decay**: clip-art seals, unstyled link lists, tables from 2006, PDFs used as the interface. Being civic is not a license to be ugly. The system lives in the narrow band between them, and both edges are equally out of bounds.

**Key Characteristics:**

- Green-cast neutrals throughout — warm paper, not cold gray
- Flat by default; borders and tonal steps carry all structure
- One type family, Roboto, working across five applications
- Status is always spelled as a word, never encoded in color alone
- Uppercase and letterspacing are structural, never decorative
- One design system, five frontends: `packages/ui` is the only visual authority

## Colors

A single institutional green against a family of neutrals that share its hue, so the palette reads as one material rather than an accent dropped onto gray.

### Primary

- **Commission Green** (`oklch(0.5364 0.1457 150.5842)`): The agency's voice. It appears on the primary action in every application, the staff sidebar ground, active navigation, iconography on the public quick-action cards, and the directional scrim over the hero photograph. Its foreground pair is a very pale warm green-white (`oklch(0.985 0.0199 112.9333)`) rather than pure white — the slight warmth keeps the button from reading as a generic call to action. **The pair measures 4.63:1**, which clears the 4.5:1 AA floor for normal-size text; it has to, because that foreground lands on 12px status badges as well as on buttons.

  The foreground was lightened from `oklch(0.9556 …)` on 2026-08-28. The old value measured **4.24:1** and had been failing AA on every primary button, the skip link, and every filled status badge in all five frontends. Commission Green itself did not move — it is a brand commitment — and the warmth was kept, because removing the chroma entirely changes the ratio by 0.02 and so buys nothing worth the loss. The lesson is recorded rather than just the number: this pair is the system's most-reused colour relationship, and it went years undocumented and unmeasured.

### Secondary

- **Pale Green** (`oklch(0.92 0.03 150)`): The quiet fill. Secondary buttons, the hover ground for staff sidebar rows, the Archived badge, and any surface that needs to separate from paper without introducing a border. It marks *hover*, never *location* — the active row is Commission Green, and a pale-green active state a single step off the rail's own background is the version that reads as nothing from a normal seated distance.

### Tertiary

- **Brackish Teal** (`oklch(0.6638 0.0267 183.8599)`): Desaturated gray-teal — the color of standing water. It grounds the public footer as a full-bleed band and supplies the hover ground for outline and ghost buttons. It is a *surface* color and a hover state; it never carries an action.

### Neutral

- **Paper** (`oklch(0.985 0.002 150)`): The page. Near-white with just enough green to be warm under daylight.
- **Surface** (`oklch(0.98 0.005 150)`): Cards and popovers. A half-step off paper, which is why cards need no shadow to separate.
- **Sidebar Ground** (`oklch(0.96 0.01 150)`): The staff navigation rail in the light theme.
- **Muted Surface** (`oklch(0.94 0.01 150)`): Table header rows, disabled fields, skeleton states.
- **Ink** (`oklch(0.2537 0.0035 164.7797)`): All primary text. Near-black with a trace of green — never pure `#000`.
- **Muted Ink** (`oklch(0.45 0.02 150)`): Timestamps, helper text, card descriptions, secondary metadata.
- **Rule** (`oklch(0.8 0.02 150)`): Every border, divider, and table line. This token does the work shadows would do in another system.
- **Field** (`oklch(0.92 0.01 150)`): Input ground.
- **Focus Ring** (`oklch(0.5353 0.1357 153.5529)`): A green a hair cooler than the primary, rendered at 50% opacity in a 3px ring.
- **Refusal Red** (`oklch(0.5046 0.2053 29.0423)`): Destructive commands and validation failures. Nothing else.

### Series

`chart-1` through `chart-5` are a deliberately separate species: light, desaturated pastels (violet, rose, mint, sand, periwinkle) used only by the Weekly Mosquito Activity chart to distinguish mosquito species across a season. They are tuned for adjacency in a dense multi-series plot, not for the interface, and must never leak into UI chrome.

### Named Rules

**The One Green Rule.** Commission Green is the only color on a resting screen that carries meaning by itself. Reserve it for the agency's mark, the primary action, and the active navigation state. It is never a background for decoration, never a highlight, and never used twice in the same visual group.

**The Status Is A Word Rule.** A record's state — Draft, Published, Pending, Archived, Cancelled, Closed, Resolved, New — is always spelled out in the badge. Color may reinforce it; color may never be the only thing carrying it. This is a WCAG requirement on the public site and a legibility requirement everywhere else.

**The Hue-150 Rule.** Every neutral in the light theme sits on hue 150 at low chroma. A neutral pulled from outside that family will read as a foreign gray against the rest of the page, however close its lightness.

**The Unowned Surfaces Rule.** Selection, the caret, and the focus ring are painted by the browser unless the system paints them, and a stock blue highlight is the loudest foreign colour on a warm hue-150 page. `::selection` takes Pale Green on Ink — the same pair that already means "touched but not chosen" on a sidebar row — and the caret takes Commission Green. These are set once in `globals.css` and apply everywhere; no component re-declares them.

**Known drift.** The dark theme abandons this palette entirely: `.dark` is stock neutral gray at chroma 0, with `--primary` inverted to near-white and only `--sidebar` retaining Commission Green. Light and dark are not currently the same identity. Documented as observed, not endorsed.

## Typography

**Display Font:** Roboto (with `system-ui`, `sans-serif`)
**Body Font:** Roboto (with `system-ui`, `sans-serif`)
**Label/Mono Font:** Roboto — see known drift below

**Character:** One family, worked hard. Roboto is the least remarkable choice available and that is precisely the point — it is the type of a form, a schedule, a posted notice. Personality is carried by weight, case, and letterspacing rather than by the letterforms themselves, which keeps five applications visually identical without any of them feeling styled.

### Hierarchy

- **Display** (700, `clamp(1.5rem, 4vw, 2.25rem)`, 1.25, tracking `-0.025em`): The hero headline on the public home page, set in white over the green scrim. One per page, and only where a photograph backs it.
- **Headline** (600, `clamp(1.125rem, 2vw, 1.25rem)`, 1.4): Section headings on public pages — "How Can We Help You Today?" Also the page title in staff applications.
- **Title** (600, `1.25rem`, 1.0): Card titles, including notice titles in the public feed. The 1.0 line-height is deliberate: titles are one or two lines and should sit tight against their date line.
- **Body** (400, `1rem`, 1.5): All reading text, including Tiptap-rendered notice bodies. Cap the measure at 65–75ch — `TiptapRenderer` and `TiptapEditor` both set `max-w-[70ch]`, and the editor matches the renderer so an author lays out the line breaks a reader will actually get. Prose paragraphs take a `0.5rem` vertical margin and normal leading so a rendered notice stays dense enough to scan.

  **The `.prose` overrides must stay unlayered.** `@tailwindcss/typography` emits into the `utilities` layer, and layer order beats specificity, so the same rules written inside `@layer base` lose to the plugin no matter how specific they are. They were written that way once and silently did nothing for as long as they existed: paragraphs shipped at the plugin's `1.25em` while this line claimed `0.5rem`. The rules now sit unlayered at the end of `globals.css`, which outranks every layer.

  **A list item's paragraph is the item.** TipTap's StarterKit wraps each `<li>`'s content in its own `<p>`, so a paragraph rule fires inside every bullet: a 26px item occupied 46px of pitch and a thirteen-item list ran 600px. `.prose li > p` therefore takes no margin at all, and only a *second* paragraph inside one item is treated as a paragraph.
- **Label** (500, `0.875rem`, 1.25): Buttons, form labels, table cells, badges, metadata. The workhorse size across all four staff applications.
- **Overline** (700, tracking `0.025em`, uppercase): The agency's name in the public footer and the footer's column headings at `0.875rem`; the staff sidebar's group labels at `0.75rem`, a step below the destinations they cover. Structural only.

- **Auth heading** (600, `1.5rem`, `1.875rem` from `sm`, 1.25, tracking `-0.025em`): The single heading on a sign-in, password-reset or invite screen. It is the one step between Headline and Display, and it exists because those screens hold one heading and nothing competing with it: the staff Headline is sized for a page title inside a dense shell, and inside a full-viewport frame it reads undersized. It does not travel — no other staff screen may use it, and it never appears twice on a page.

### Named Rules

**The One Family Rule.** Roboto sets everything. There is no display face, no serif for long reading, and no accent family. A second family is a system change, not a page decision.

**The Uppercase Is Structural Rule.** Uppercase marks a boundary, never a sentence. It has four homes: the agency's identity block in the public footer, that footer's column headings, the group labels in the staff sidebar, and the auth frame's masthead. All four are edges between regions rather than text anyone reads for meaning, which is why caps suit them and why they are set below the size of what they cover. It never appears on a button, never on a heading a visitor reads for content, and never as emphasis inside a sentence.

The masthead is the widest tracking in the system at `0.16em`, against `0.025em` everywhere else, and the exception is load-bearing rather than expressive: that type sits *on* a hairline with the rule running out of both ends of it, so the letters have to read as a ruled band rather than as a word dropped on a line. At `0.025em` it reads as a caption that has collided with a border. Both mastheads are set at `0.75rem`, the same step as the sidebar's group labels.

**Known drift.** `--font-serif: "Lora"` and `--font-mono: "Fira Code"` are declared in `globals.css`, but only Roboto is imported from Google Fonts. Any consumer of those tokens silently falls back to Georgia and Courier New. Treat both as unavailable until they are actually loaded or the tokens are removed.

## Layout

The public site and the staff applications use two different spatial models over one spacing scale.

**Public (`apps/public`).** A single centered column, `max-w-7xl` (80rem), with `1.5rem` gutters rising to `3rem` at `md`. Sections breathe at `2.5rem` vertical padding, `3.5rem` at `md`. The home page is the sole exception: it breaks the container to run the hero full-bleed at `60vh` (minimum `20rem`), then returns to the container for everything below. Every other route mounts inside a `max-w-7xl` wrapper with `1rem` padding and `2rem` of vertical margin around `<main>`.

**Staff (`central`, `website-management`, `hr`, `admin`).** A persistent icon-collapsible sidebar rail against a content pane, provided by the shared `mcmec-layout` shell — root, sidebar, breadcrumb, content, app switcher, and user menu. Every staff application composes the same shell; none of them define their own chrome. The breadcrumb is the only wayfinding above the page title.

**Rhythm.** A `4px` base unit. The recurring steps are `8px` (inline gaps), `16px` (form-field stacks), `24px` (card padding and card-to-card gaps), `40px` and `56px` (section separation). Card internals are uniformly `24px` horizontal with a `24px` vertical block, and cards stack their sections with a `24px` gap.

**Responsive.** Grids move 1 → 2 → 3 columns at `sm` and `lg`. Text alignment shifts from centered on mobile to left-aligned from `sm` up in the public footer. Body text steps down from `1rem` to `0.875rem` at `md` inside form controls so a field doesn't dominate a dense staff form — the reverse of the usual direction, and correct here because staff work on large screens.

### Named Rules

**The Eighty-Rem Rule.** No content region exceeds `max-w-7xl` (80rem). The hero photograph may bleed past it; nothing readable may.

**The Shell Owns The Chrome Rule.** Staff applications import `mcmec-layout` and fill it. An app that defines its own sidebar, header, or breadcrumb has forked the system, and four forks is how five applications stop looking like one.

**The Desktop-First, Mobile-Survivable Rule.** The four staff applications are designed for the screen they are actually used on: a desk, a large display, a considered edit. Density, column count, keyboard reach, and information-per-screen are decided at desktop widths and are not compromised to suit a phone.

But narrow is a state they must *survive*, because the job occasionally follows someone out of the building — a meeting cancelled from a car, a spray mission delayed from the field. On a phone every staff screen must therefore: fit the viewport with no horizontal page scroll; keep wide content (tables, toolbars, date ranges) scrolling inside its own `overflow-x: auto` container rather than pushing the page; keep every primary action reachable without a hover; and lose no destination — the rail becomes a sheet, never a truncation.

The distinction is between a floor and a target. Nothing here asks for a phone-optimised layout, a thumb-zone action bar, or a mobile-specific flow; spending design effort there is spending it in the wrong place. What it forbids is the failure mode where a staff screen is unusable rather than merely cramped. A cramped table someone can scroll is fine. A form whose Save button sits outside the viewport is not.

Browser zoom counts as narrow here, and should. A staff screen at 200% zoom has roughly the
viewport of a phone, and WCAG 1.4.10 asks it to reflow rather than scroll in two directions — so
the same collapse that serves a phone serves a magnified desktop, and the rail becoming an overlay
at that size is the rule working rather than misfiring.

`apps/public` is the exact inverse and is not covered by this rule: residents arrive on phones more often than not, and its layouts are decided at both ends.

## Elevation & Depth

The system is flat. Depth comes from a tonal ladder — paper → surface → sidebar ground → muted surface, each a small lightness step on the same hue — and from `1px` borders in Rule. A card separates from the page because it is a half-step lighter and outlined, not because it floats.

Shadows exist only for elements that genuinely leave the page plane: popovers, dropdown menus, dialogs, sheets, and toasts. Resting surfaces do not cast them. The two exceptions in the current code are vestigial — outline buttons and inputs carry `shadow-xs`, a hairline that is effectively a second border.

### Shadow Vocabulary

- **Hairline** (`box-shadow: 0 1px 3px 0 hsl(150 3% 13% / 0.06)`): The vestigial edge on inputs and outline buttons. Do not extend it to new components.
- **Resting card** (`box-shadow: 0 1px 3px 0 hsl(150 3% 13% / 0.08), 0 1px 2px -1px hsl(150 3% 13% / 0.08)`): The single step cards take today. Borders do the real work.
- **Floating layer** (`box-shadow: 0 8px 16px -2px hsl(150 3% 13% / 0.1), 0 4px 6px -2px hsl(150 3% 13% / 0.06)`): Popovers, dropdowns, dialogs, sheets, toasts.

All shadows are cast in `hsl(150 3% 13%)` — the same green-black as Ink — never in neutral black.

### Named Rules

**The Flat-By-Default Rule.** A shadow means the element is genuinely above the page and can be dismissed. Cards, tables, inputs, buttons, and panels are held by their border and their tonal step. If a new component wants a shadow to feel separated, it needs a border instead.

**Known drift.** `globals.css` defines a full eight-step shadow scale (`2xs` through `2xl`) of which three steps are ever used. The unused steps are headroom nobody claimed; do not treat their existence as permission to layer.

## Motion

The system is almost entirely still, and that is a position rather than an omission: these are screens people work in every day, and an interface that performs on arrival becomes an interface that wastes a second of every visit.

There is one authored gesture, and it belongs to the auth frame: **a rule is drawn**. The four hairlines scale from the corner each one starts at — the top rule first, the vertical edges at `180ms`, the bottom rule at `360ms` — over `620ms` on `cubic-bezier(0.16, 1, 0.3, 1)`. The easing is exponential ease-out, fast off the mark and long in the settle, so the line reads as ruled rather than as slid into place. Nothing else on the page moves, and no content ever animates: the type is present on the first frame, and only the rules arrive.

The tokens are `--animate-rule-x` and `--animate-rule-y`. `prefers-reduced-motion: reduce` removes the animation entirely, which leaves each rule at its untransformed size — the frame is simply there.

### Named Rules

**The Motion Is A Rule Being Drawn Rule.** If a new surface wants motion, it animates a hairline. Content does not fade, rise, stagger, or scale in. A system whose structure is carried by borders has exactly one thing worth animating, and scattering entrance effects across content is how five applications stop feeling like one instrument.

## Shapes

A tight, closely-spaced radius family derived from one `--radius` of `0.625rem` (10px): `6px` (sm), `8px` (md), `10px` (lg), `14px` (xl). The range is narrow on purpose — the difference between a button and a card is legible but never expressive.

Buttons, inputs, and selects take `8px`. Cards and panels take `14px`, the softest corner in the system. Status badges are the sole break: fully rounded at `9999px`.

Borders are always `1px` in Rule. There are no double borders, no dashed borders outside a drop target, and no decorative dividers — a divider exists to separate two things a reader would otherwise merge. Card headers close with a bottom border and card footers open with a top border; both are structural, marking where metadata stops and content begins.

Icons are Lucide, at `1rem` inside buttons and badges, `1.5rem` on public quick-action cards, and `0.875rem` inline beside footer contact details. They inherit `currentColor` except on the quick-action cards, where they carry Commission Green.

### Named Rules

**The Pill Is A Status Rule.** A fully rounded shape means "this is the state of a record." Nothing else in the system — no button, no tag, no avatar frame, no input — is a pill.

## Components

### Buttons

- **Character:** Crisp and institutional. Tight height, precise label, no swagger.
- **Shape:** Gently rounded (`8px`), `36px` tall at default, `32px` small, `40px` large. Icon-only buttons are square at the same three heights.
- **Primary:** Commission Green ground, pale warm-white label, `8px 16px` padding, `0.875rem` medium weight. Hover drops the ground to 90% opacity.
- **Outline:** Paper ground with a Rule border and a hairline shadow. Hover swaps to Brackish Teal ground. This is the default for lifecycle actions.
- **Secondary / Ghost / Link:** Pale Green ground; transparent with a Brackish Teal hover; and a Commission Green label with an underline on hover, respectively.
- **Destructive:** Refusal Red ground with white text and a red-tinted focus ring.
- **Focus:** A `3px` ring at 50% opacity in Focus Ring, plus a border shift to the same hue. Never removed, never replaced with an outline-none.
- **Disabled:** 50% opacity and pointer events off. Never hidden — a staff member should be able to see that an action exists and is unavailable.

### Inputs / Fields

- **Style:** Transparent ground, `1px` Rule border, `8px` radius, `36px` tall, `4px 12px` padding. Text is `1rem` on mobile and `0.875rem` from `md` up.
- **Focus:** Border shifts to Focus Ring and a `3px` ring at 50% opacity appears. No glow, no ground change.
- **Error:** `aria-invalid` drives everything — the border goes Refusal Red and the ring tints to match. The invalid state is announced by the attribute, not only drawn.
- **Disabled:** 50% opacity, `not-allowed` cursor.
- **Placeholder:** Muted Ink. Never a substitute for a label; every input has a real `<label>`.

### Cards / Containers

- **Corner Style:** `14px`.
- **Background:** Surface, a half-step above Paper.
- **Border:** `1px` Rule. This is what separates the card, not the shadow.
- **Shadow Strategy:** Resting card only. See Elevation & Depth.
- **Internal Padding:** `24px` horizontal, `24px` vertical block, `24px` between stacked sections.
- **Header / Footer:** The header is a two-column grid that reserves the right column for an action slot; it closes with a bottom border. The footer opens with a top border and `16px` of padding above its content.

### Badges

- **Style:** Fully rounded, `2px 8px`, `0.75rem` medium weight, transparent border on filled variants.
- **State mapping:** Published and Pending take the filled Commission Green; Archived takes Pale Green; Draft takes the outline variant. The word is always present.

### Navigation

**Public.** A horizontal bar of five top-level groups — Home, About, Contact, Public Notices, Mosquito Control (plus surveillance and careers) — each opening a popover of titled links with one-line descriptions. Those descriptions are load-bearing: they are how a resident who does not know the difference between a legal notice and an archived one picks correctly. Below `md` the whole bar collapses into a sheet with the same groups as collapsibles. A skip link targets `#main-content`.

**Staff.** The `mcmec-layout` sidebar, collapsible to an icon rail, with the MCMEC mark in the header, navigation in the content, and the user menu in the footer. The app switcher lists only the applications the signed-in user's App Roles permit.

The rail is rendered by the shell, not by each application: `Layout.Sidebar.Nav` takes groups of destinations and owns the three things a hand-rolled rail keeps losing. Every row carries a tooltip, which is the only label a collapsed rail has. The current destination takes Commission Green (`4.57:1` against its own label, `4.33:1` against the rail) and carries `aria-current="page"`, so location is never signalled by colour alone. Matching is by path prefix, so a drill-down keeps its parent lit. Groups run to four items or fewer and are labelled in the Overline; a rail of three or fewer destinations drops the label rather than inventing one.

### Auth Frame

- **Character:** The title page of the register. It is the only screen in the system with no shell, no card and no page chrome — the frame *is* the chrome.
- **Structure:** A hairline in Rule inset from every viewport edge (`0.75rem`, `1.5rem` at `sm`, `2.5rem` at `md`). The top and bottom rules are drawn as flex children rather than borders so type can interrupt them: a short stub turns the corner, a masthead label breaks the line, the remainder runs to the far edge. The Commission's name sits on the top rule at the left and the destination application at the right; the office address and `Established 1914` sit on the bottom rule the same way. Below `sm` the name shortens to `MCMEC` and the address to `Edison, NJ` so neither masthead pushes its rule off-screen.
- **Interior:** One column capped at `max-w-7xl` and centred, holding the heading, a field block bracketed top and bottom by rules in Rule, a reserved status line, and the action row. The bracketing rules span the whole column; the entries occupy its first `28rem`. The blank to their right is a ledger column left empty, not a layout that ran out.
- **Frontispiece:** The Commission's building sits above the heading as a *plate* — bordered, square-cornered, at the action row's `42rem` measure — not as a backdrop. Nothing is laid over it, it carries no scrim or gradient, and it never shares pixels with the form. That is the whole licence for a photograph here: the arrangement this system rejects by name is the marketing split-screen, a photo owning half the viewport with the form floating on it. The crop is chosen rather than defaulted (`object-position: center 45%`), because `building.webp` puts its roofline in the top quarter and a third of dull winter lawn at the foot, and a centred wide slice lands on the ramp railing with the roof cut off.
- **Height budget:** Below `1000px` of viewport height the vertical rhythm tightens and the plate scales with the viewport; below `600px` the plate goes entirely. A 1280x800 laptop is the common staff display, not an edge case, and at full padding the primary action landed on the fold there. The picture yields before the form does.
- **States:** The status line reserves its height whether or not it has a message, so a failed sign-in never moves the button out from under the cursor about to press it again.
- **Why no card:** A card here would be a container inside a container. The four staff logins were four copies of exactly that, and the frame replaces all of them.

### Record Index

The one index page, and the answer to eleven of them. Every staff list — Notices, Meetings, Documents, Insecticides, Job Postings, Public Requests, Spray Missions, Employees — is composed from `RecordIndex` in `packages/ui`, which owns the whole screen: heading, search and filter bar, table chrome, sorting, pagination, loading, and empty states.

It is deliberately opinionated, because the unopinionated version was tried and produced nine copies of the sortable header (not one of which emitted `aria-sort`), eight copies of the pagination footer, six spellings of the empty state, three incompatible ways to reach a record, and zero loading states.

- **Structure:** page heading, then an optional search-and-filter row carrying a live result count, then one `14px` rounded bordered container holding the table, then the pagination footer — which appears only when there is more than one page.
- **The identity column is a link.** `renderRowLink` is required, so an index that cannot be operated by keyboard does not compile. Not a whole-row click target and not a stretched overlay: the first is invisible to assistive technology, and the second takes text selection away from every other cell.
- **Row actions name their record.** The trigger reads "Actions for <record>, <date>", never a bare "Row actions" repeated down the column.
- **Sorting is announced.** The sorted column carries `aria-sort`, and the table carries the page title as its accessible name.
- **Loading and empty are different screens.** `state="loading"` renders skeleton rows; an empty register gets an authored empty state, and a search that matches nothing gets a different one that offers to clear itself. A register must never say "there are no records" while it is still syncing.
- **State lives in the URL.** Sort, direction, page, size, and the search term round-trip through the route's search params, so returning from a record lands where you left. Search input is debounced and holds its own draft: writing each keystroke to the URL loses focus mid-word and turns the back button into an undo log.
- **Default page size is 25**, because these screens are read at a desk on a large display.

Per-domain choices stay with the route: the columns and their renderers, the `rowActions` builders, which lifecycle actions a row offers, the filter dimensions, and the default sort. The arrangement belongs to the system; the domain belongs to the screen.

### Lifecycle Button

The system's signature control, and the subject of ADR 0001. A lifecycle action — Publish, Archive, Cancel, Close, Resolve, Reschedule — is always a button that fires its own named command. It is never a switch, never a checkbox, and never a status field the user edits and saves.

It defaults to the outline variant so it reads as a deliberate act rather than the form's primary submit, and it relabels when the form beneath it is dirty: "Publish" becomes "Save and Publish," and the caller then sends both intents in one atomic request. A refused lifecycle command rolls the field save back with it, so the refusal copy must say the changes were not saved either.

### Signal Band

A band of named signals across the top of a staff screen, each opening its own queue in place. It answers the stat-card grid, where every count was a dead end: the number is not the work, so the count and the queue it counts share one surface and reading that queue costs a keypress rather than a page.

- **Structure:** One `14px` rounded container, one border, both halves inside it. The cells sit on a `1px` gap over a Rule-coloured ground, which draws every divider at once and holds them exact when the cells wrap; the panel sits directly beneath under a top border, opening with its own header row — the queue's name, its condition, and a trailing action slot. Band and panel read as one instrument, not a toolbar above an unrelated list.
- **Cell:** the count first at `1.5rem` semibold in tabular figures, then the queue's name at `0.875rem` medium, then its condition at `0.75rem` in Muted Ink. A count of zero recedes to muted so the eye lands on the signals holding real work.
- **Selected:** Commission Green ground with the pale warm-white label — the active-navigation state, the same job the colour does in the staff rail. On the lit cell the two lower lines tint down from the foreground rather than dropping to muted grey, which would fall under `4.5:1` against the green. A small rotated square joins the lit cell to its panel on the single-row band only; once the cells wrap it would point at another cell, and a pointer aimed at the wrong thing is worse than none.
- **Rest / hover / focus:** Surface ground, Pale Green on hover, and the system's `3px` focus ring with the cell raised above its neighbours so the ring is not clipped by the divider.
- **Labels:** Sentence case. The Uppercase Is Structural Rule gives uppercase three homes and a control is not one of them.
- **Urgency:** carried by the caller's left-to-right ordering, by each signal's condition phrase — "open 5+ days," "awaiting triage," "none scheduled" — and by which signal the screen opens on. Never by colour. This is The Status Is A Word Rule applied to a control instead of a badge.
- **Behavior:** a real WAI-ARIA tablist with roving focus and automatic activation. Left / Right / Home / End move the selection and open the queue as they go. `aria-orientation="horizontal"` is declared and ArrowUp / ArrowDown are deliberately absent: below `lg` the band wraps to a two-dimensional grid where a vertical arrow would move the selection sideways. The panel is itself focusable, because an empty queue offers a keyboard user nothing else to land on.
- **Responsive:** five columns at `lg`, three at `sm`, two below. Breakpoint-aware filler cells square off the trailing row at each column count for any number of signals, so the grid's own ground never shows through as a dead block. The panel carries a `min-height` floor from `sm` up only — enough that switching to an empty queue on a desktop does not collapse the instrument and drag the page beneath it upward, while narrow widths reflow, which is the point of reflowing.
- **Motion:** the swap settles rather than cuts — a `200ms` fade and one-step slide keyed to the selected signal, `motion-reduce` honoured. It is the screen's one authored moment; nothing else on it moves.
- **Copy:** an optional panel label overrides the cell's label in the header, where there is room the cell does not have. A five-across cell fits "Missions tonight"; the header says "Spray Missions tonight," which is the word the rest of the product uses.

It lives in `packages/ui/src/blocks/signal-band.tsx`, so it is available to all four staff frontends, not only the one that uses it today.

### Signal Queue Row

One row vocabulary for every queue a Signal Band opens, whatever domain the record comes from. Left to themselves, five queues across four domains grow five arrangements on one surface, and the eye has to re-learn where the important word sits every time the panel changes.

- **Slots:** four, always in the same places. `primary` — what the record is — leads at `0.875rem` medium and truncates rather than wrapping, so the row stays one line tall. `secondary` — where or who — sits under it at `0.75rem` in Muted Ink. `meta` — when: a date, a time range, an age — is right-aligned in tabular figures so the column holds as the panel changes. `badge` closes the row, carrying the word.
- **Shape:** a two-column grid (`minmax(0,1fr) auto`), `16px` between the columns, `16px` horizontal and `10px` vertical padding, a Rule bottom border on every row but the last. No radius and no card of its own; the band's container is the only edge.
- **Row target:** the whole row is a typed route link. Hover takes Pale Green; focus takes the standard `3px` ring and raises the row above its siblings.
- **Empty:** the queue states its own empty case — an icon, a short title, a line of description — rather than leaving the panel blank. An empty signal is a legitimate answer and should read as one.

It lives in `apps/website-management/src/components/signal-queue.tsx` and is app-local today. If a second staff application grows a queue, promote it to `packages/ui` beside the band rather than copying it.

### Named Rules

**The Confirm Is For The Public Rule.** A row action asks before it fires when it **withdraws or contradicts something the public is already relying on**. Unpublishing a Notice takes a statutorily posted legal notice off the public website; cancelling a Meeting contradicts a calendar entry the Open Public Meetings Act made people plan around. Both name the record before they act and again after. `delete*`, which is less publicly consequential, always had a danger zone.

Publishing is deliberately **not** guarded, and the rule is worded to say so. It is the forward act these screens exist for, performed routinely by a small expert team (PRODUCT.md's operating profile), and it is immediately reversible by the very action that *is* guarded. An earlier wording — "does a stranger see the result" — would have caught publishing too, and a confirmation on the primary workflow is friction rather than care. Actions whose result the user can watch land on their own screen need no ceremony either.

**The Lifecycle Is A Button Rule.** State transitions are performed, not set. If a design shows a record's state as a toggle, a select, or a checkbox, the design is wrong regardless of how it looks — see `docs/adr/0001-lifecycle-actions-are-buttons.md`.

**The Count Opens Its Queue Rule.** A number on the **work half** of a staff dashboard opens the records it counts, in place. A count that only links somewhere else is a statistic, and a statistic is not the work — see Signal Band.

One deliberate exemption: a **confirming register**, like the dashboard's "What the public sees right now" strip. Its numbers are facts about the published record rather than queues of work — nobody triages "12 Documents published" — so they answer a question instead of starting a task, and a plain link to the index is the honest affordance. The exemption is narrow: it holds only where the register reports the *public's* state and repeats nothing the work half already shows. A count of outstanding work, anywhere on the screen, opens its queue.

## Do's and Don'ts

### Do:

- **Do** keep every neutral on hue 150 at low chroma so surfaces read as one warm material.
- **Do** let borders in Rule (`oklch(0.8 0.02 150)`) carry structure. Reach for a border before a shadow, every time.
- **Do** spell out record state as a word inside the badge, with color as reinforcement only.
- **Do** compose staff screens from `mcmec-layout` and `packages/ui`. A pattern solved once is solved for all five frontends and every one added later.
- **Do** use the `CONTEXT.md` vocabulary in visible copy — "Spray Mission," "Public Request," "Notice" — regardless of what a legacy route path says.
- **Do** cap reading measure at 65–75ch on the public site and keep `max-w-7xl` as the outer bound everywhere.
- **Do** preserve the `3px` focus ring at 50% opacity on every interactive element. It is the only focus treatment in the system.
- **Do** keep uppercase and letterspacing structural — the public footer's identity block and column headings, and the staff rail's group labels, nothing else.
- **Do** cap a content region at `max-w-7xl` even inside a full-bleed frame. The frame may reach the viewport edge — it is the edge of the page, not content — but a rule drawn 2500px across a wide office display is a different design, not a longer one.
- **Do** decide staff layouts at desktop widths, then confirm nothing is unreachable or clipped at `375px`. Survivable, not optimised.

### Don't:

- **Don't** add a second type family. Roboto sets everything until the system says otherwise.
- **Don't** consume `--font-serif` or `--font-mono` while Lora and Fira Code remain unloaded.
- **Don't** put a shadow on a resting surface. Cards, tables, panels, and inputs are flat.
- **Don't** use Commission Green decoratively. It marks the agency, the primary action, and the active state — nothing else.
- **Don't** let the `chart-1`–`chart-5` pastels out of the Weekly Mosquito Activity chart. They are a species series, not a UI palette.
- **Don't** use a pill radius for anything that isn't a status badge.
- **Don't** render a lifecycle action as a switch, checkbox, or status dropdown.
- **Don't** hide a disabled action. Show it disabled so staff can see the action exists.
- **Don't** let a staff screen scroll horizontally at the page level, or strand a primary action outside a narrow viewport. Wide content scrolls inside its own container; the rail becomes a sheet rather than losing destinations.
- **Don't** spend design effort on phone-optimised staff layouts — thumb-zone bars, mobile-only flows. The floor is that narrow works, not that narrow is the target.
- **Don't** bury, paginate, collapse, or lazily defer a statutorily required posting — a legal Notice within its seven-day Retention Period, a meeting agenda, or a cancelled meeting. Layout may never obstruct the public record.
- **Don't** put a card on the auth screens. They were four copies of a centered card and are now one frame; a card inside that frame is a container inside a container.
- **Don't** animate content. Motion belongs to rules being drawn — see The Motion Is A Rule Being Drawn Rule.
- **Don't** reach for gradient meshes, glassmorphism, or marketing-hero patterns. Equally, don't accept clip-art seals, unstyled link lists, or PDFs standing in for an interface.
