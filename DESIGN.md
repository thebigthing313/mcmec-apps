---
name: MCMEC
description: The shared visual system behind the Middlesex County Mosquito Extermination Commission's public website and its four staff applications.
colors:
  commission-green: "oklch(0.5364 0.1457 150.5842)"
  commission-green-contrast: "oklch(0.9556 0.0199 112.9333)"
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

- **Commission Green** (`oklch(0.5364 0.1457 150.5842)`): The agency's voice. It appears on the primary action in every application, the staff sidebar ground, active navigation, iconography on the public quick-action cards, and the directional scrim over the hero photograph. Its foreground pair is a very pale warm green-white (`oklch(0.9556 0.0199 112.9333)`) rather than pure white — the slight warmth keeps the button from reading as a generic call to action.

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
- **Body** (400, `1rem`, 1.5): All reading text, including Tiptap-rendered notice bodies. Cap the measure at 65–75ch. Prose paragraphs take a `0.5rem` vertical margin and normal leading so a rendered notice stays dense enough to scan.
- **Label** (500, `0.875rem`, 1.25): Buttons, form labels, table cells, badges, metadata. The workhorse size across all four staff applications.
- **Overline** (700, tracking `0.025em`, uppercase): The agency's name in the public footer and the footer's column headings at `0.875rem`; the staff sidebar's group labels at `0.75rem`, a step below the destinations they cover. Structural only.

### Named Rules

**The One Family Rule.** Roboto sets everything. There is no display face, no serif for long reading, and no accent family. A second family is a system change, not a page decision.

**The Uppercase Is Structural Rule.** Uppercase with `0.025em` tracking marks a boundary, never a sentence. It has three homes: the agency's identity block in the public footer, that footer's column headings, and the group labels in the staff sidebar. All three are edges between regions rather than text anyone reads for meaning, which is why caps suit them and why they are set below the size of what they cover. It never appears on a button, never on a heading a visitor reads for content, and never as emphasis inside a sentence.

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

### Lifecycle Button

The system's signature control, and the subject of ADR 0001. A lifecycle action — Publish, Archive, Cancel, Close, Resolve, Reschedule — is always a button that fires its own named command. It is never a switch, never a checkbox, and never a status field the user edits and saves.

It defaults to the outline variant so it reads as a deliberate act rather than the form's primary submit, and it relabels when the form beneath it is dirty: "Publish" becomes "Save and Publish," and the caller then sends both intents in one atomic request. A refused lifecycle command rolls the field save back with it, so the refusal copy must say the changes were not saved either.

### Named Rules

**The Lifecycle Is A Button Rule.** State transitions are performed, not set. If a design shows a record's state as a toggle, a select, or a checkbox, the design is wrong regardless of how it looks — see `docs/adr/0001-lifecycle-actions-are-buttons.md`.

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
- **Don't** reach for gradient meshes, glassmorphism, or marketing-hero patterns. Equally, don't accept clip-art seals, unstyled link lists, or PDFs standing in for an interface.
