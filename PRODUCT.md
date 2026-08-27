# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Middlesex County residents and municipal officials** are the primary audience of `apps/public`.
They arrive from search, a mailer, or a neighbor's tip, usually carrying one urgent question —
*is my street being sprayed tonight*, *what was that truck*, *how do I get mosquitoes dealt with
in my yard* — and they leave as soon as it is answered. A second, smaller set of visitors reads
the statutory record: Notices, Meeting agendas and minutes, and published budget and audit
Documents. Public Requests are submitted **anonymously**; the public has no login and no account.

**Commission staff** are the users of the four internal surfaces (`central`, `website-management`,
`hr`, `admin`). Confirmed operating profile:

- Office desktop, deliberate work. Large screens; considered data entry rather than hurried
  capture. Density and keyboard efficiency outrank oversized touch targets.
- A small team with low turnover. Long-tenured people who know the system. Optimize for expert
  speed over newcomer discoverability — while keeping seasonal tasks legible, since some work
  (Weekly Mosquito Activity loads, Spray Missions) only recurs in season.

Staff reach the internal apps by App Role, one role per surface: `manage_website` →
Website Management, `manage_employees` → HR, `manage_users` → Admin, `manage_reference_data` →
reserved and currently grants access to nothing. `central` requires no role — every signed-in
employee has it.

## Product Purpose

The Middlesex County Mosquito Extermination Commission is a New Jersey county agency that has
controlled mosquito populations and published what it does to the public **since 1914**. That
founding year is a stated fact on the public site — it appears in the home page's hero copy
("Protecting the health and comfort of Middlesex County residents and visitors since 1914") and
in its meta description — and it is the Commission's only claim to longevity. Use it; do not
round it, embellish it, or pair it with invented milestones.

This monorepo is both halves of that sentence: the public website that discharges the Commission's duty to inform, and
the staff applications that produce what the website publishes.

Success on the public side is a resident who gets a correct answer fast and, when they need
something done, files a Public Request that reaches staff. Success on the staff side is that the
public record stays accurate and current without the publishing step being the reason it doesn't.

## Positioning

This is a statutory public-record system, not a marketing site. Its authority comes from being
the Commission's own word — a Notice here *is* the legal notice, a Meeting page *is* the public
record that the meeting was called. That is why Cancelled Meetings and Archived Notices remain
visible rather than being deleted, and it is what a neighboring product could not truthfully
claim.

## Operating Context

- The work is **seasonal**. Spray Missions, Weekly Mosquito Activity, and public attention all
  concentrate in mosquito season; the same screens sit near-idle the rest of the year.
- Public content flows one way: staff author in `website-management`, and `apps/public` renders
  what was Published. There is no second authoring path.
- The Commission's four domains — Website, Employees, Users, Reference — are bounded contexts
  named for the work, not for the app the work happens in. `CONTEXT.md` is the ubiquitous
  language and governs the words in every interface. Use its terms; honor its `_Avoid_` lists.
- Lifecycle Actions (publish, archive, cancel, close, resolve) are deliberate acts performed on a
  record, never a status field someone edits and saves. ADR 0001 fixes them as buttons.
- Every write is a named Command carrying its Intent, and every change writes an Audit Entry.
- Environments are siblings under `middlesexmosquito.org` so one SSO cookie spans them; the app
  switcher derives staging vs. production from the hostname.

## Capabilities and Constraints

Public website (`apps/public`, SSR): Notices with archive and transparency views, Meetings,
Spray Schedule and spray/aerial-larviciding notices, mosquito-control explainers, Insecticide
catalogue, Weekly Mosquito Activity, mosquito source checklist and municipal packet, leadership
and mission pages, Job Postings, and four kinds of Public Request intake (general inquiry, adult
mosquito nuisance, water management, mosquitofish) protected by Cloudflare Turnstile.

Website Management (`apps/website-management`): authoring and lifecycle for Notices and their
Categories, Meetings, Documents and their Categories, Insecticides, Spray Missions, Job Postings,
Weekly Mosquito Activity season loads, and Public Request triage.

HR (`apps/hr`) and Admin (`apps/admin`): Employee records and Invites; User accounts and the
Grant/Revoke of App Roles one at a time. `central` is the signed-in home and app switcher.

Constraints:

- **Indexing.** Only production `apps/public` may be indexed. Every staff app carries
  `noindex, nofollow` (production included), as does staging.
- **Anonymous intake.** Public Requests carry no identity beyond what the submitter types.
  Nothing in the public UI may imply an account, a login, or a request-status lookup.
- **Deliberate vocabulary.** Interface copy uses `CONTEXT.md`'s terms — "Spray Mission" not
  "spray event", "Public Request" not "service request" or "ticket", "Notice" not "post".
  Note that the public-facing route is `/contact/service-request`; the URL is legacy and the
  visible language should not follow it.
- **Undecided:** the Reference domain has a role and a permissions-grid column but no commands
  and no screen. Its interface is deliberately unbuilt, not missing.

## Brand Commitments

Confirmed binding — refine, never replace:

- The name **Middlesex County Mosquito Extermination Commission** (short form **MCMEC**), the
  county logo and seal, and the marks in `apps/api/assets/` (`logo.png`, `county-logo.png`,
  `favicon.ico`, `hero.avif`, `building.webp`), referenced through
  `@mcmec/lib/constants/assets`.
- The green-tinted oklch palette and the **Roboto** type family established in
  `packages/ui/src/styles/globals.css`.
- Contact facts in `@mcmec/lib/constants/company`: 200 Parsonage Road, Edison, NJ 08837;
  phone +1 732 549 0665; fax +1 732 603 0280.

Design work stays inside this identity. Improvements are craft within it, not a new visual world.

## Evidence on Hand

- `CONTEXT.md` — the ubiquitous language, authoritative for terminology.
- `docs/adr/0001-lifecycle-actions-are-buttons.md` — the one recorded architectural decision.
- Real brand imagery in `apps/api/assets/`, served at `/assets/*`.
- `packages/ui` — the incumbent design system: tokens in `styles/globals.css`, the shared
  `mcmec-layout` shell (root, sidebar, breadcrumb, app switcher, nav-user), and domain blocks
  including the mosquito activity chart, meetings table and mobile list, insecticides table,
  public notice card and badge, lifecycle button, and the Tiptap editor and renderer.

Absent, and not to be invented: testimonials, endorsements, usage statistics, efficacy claims,
awards, partner logos, staff photography, and any pesticide-safety assertion not already carried
on a published Insecticide label or SDS.

## Product Principles

1. **The record is the product.** Nothing may be deleted to tidy a view. Cancelled Meetings and
   Archived Notices stay visible because the public record must show they existed.
2. **One urgent question, answered fast.** A resident's path to the spray schedule, a notice, or
   a request form is the public site's whole job; everything else defers to it.
3. **Speak the Commission's language.** `CONTEXT.md` governs interface copy across every app.
   Consistent naming is a correctness requirement, not a style preference.
4. **One design system, five frontends.** `packages/ui` is the single visual authority. A pattern
   solved once is solved for every MCMEC frontend that exists now and every one added later;
   app-local styling is the exception that must justify itself.
5. **Staff apps are instruments, not brochures.** Density, consistency, and expert speed win;
   brand lives in precise detail, not in decoration.

## Accessibility & Inclusion

- `apps/public` must meet **WCAG 2.1 AA**. This is a firm requirement: semantic landmarks, full
  keyboard operability, meaningful alt text and accessible names, 4.5:1 contrast for normal text
  and 3:1 for large, labeled form inputs, and a correct heading hierarchy.
- Staff apps carry no formal external standard, but inherit the same shared components and should
  not regress below them.
- **NJ statutory posting obligations constrain the design, not just the content.** The Open
  Public Meetings Act and P.L. 2025 c.72 govern what must be publicly visible and for how long —
  including the seven-day Retention Period a legal Notice must remain on the current notices page
  before it may be Archived. No layout, filter, pagination, collapse, or delayed load may bury or
  truncate a required posting.
