---
target: apps/website-management as a whole
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-31T18-49-11Z
slug: apps-website-management
---
Method: dual-agent (A: design review, source-only · B: detector + browser evidence, isolated)

# Critique — apps/website-management

Mode: Operate.

## Design Health Score — 22/40

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | delete* handlers fire and navigate in the same tick, so a 409 refusal toasts on the index while the record is still in the table (notices/$noticeId.tsx:124). Unauthenticated `/` renders a blank page instead of redirecting to /login (browser-confirmed). |
| 2 | Match System / Real World | 2 | "In Progress" ships as a live filter and badge — the term CONTEXT.md rejects and ADR 0001 dropped (lib/public-requests.ts:19). Same PDF is "SDS" on the index, "MSDS" on the detail. |
| 3 | User Control and Freedom | 2 | None of the seven forms has Cancel/Discard; none guard unsaved changes on navigate-away (notice-form.tsx:117). |
| 4 | Consistency and Standards | 2 | A Closed Job Posting is `secondary` on the index and `destructive` on its detail page (job-postings/index.tsx:26 vs $postingId.tsx:48). |
| 5 | Error Prevention | 2 | New Notice defaults to published:true; new Document to false. The riskier record publishes by accident (notice-form.tsx:59). |
| 6 | Recognition Rather Than Recall | 3 | Season CSV screen recites six exact snake_case columns in prose; no template, no example row (weekly-activity/index.tsx:224). |
| 7 | Flexibility and Efficiency | 3 | Spray Missions is the only lifecycle table with no row actions and no status filter (spray-schedule/index.tsx:112). |
| 8 | Aesthetic and Minimalist Design | 3 | Job Posting detail prints `Closed: Yes` beside a badge already reading Closed, plus raw timestamps ($postingId.tsx:173). |
| 9 | Error Recovery | 1 | No errorComponent, notFoundComponent or pendingComponent anywhere. Five detail loaders throw notFound() into the router default; Forbidden has no boundary. packages/ui's not-found.tsx, error.tsx, access-notice.tsx exist, unused. |
| 10 | Help and Documentation | 2 | Highest-stakes copy is a shadcn default: "Are you absolutely sure?" (danger-zone-card.tsx:150), while row-actions-menu.tsx:37's own doc comment forbids exactly that. |
| **Total** | | **22/40** | **Competent core, unfinished edges** |

## Design Specificity Verdict

Partly authored; a generic admin CRUD template could be swapped into roughly a third of this app unnoticed.

Authored: the dashboard signal band ranks work by statutory consequence and auto-opens on the most consequential non-empty signal only once every query reports ready ((app)/index.tsx:266); Notices invents "Pending" for a notice committed against a future date; RowActionsMenu's confirm rule reasons about "does a stranger see the result" rather than "is it destructive".

Generic: categories.tsx and document-categories.tsx are the same 315-line screen twice, bypassing RecordIndex; weekly-activity/index.tsx:255 uses bg-green-500/10 and text-green-700 from outside the Hue-150 family; login.tsx:66 is the front door to a statutory record system with no mark, no agency name, titled "Website sign in".

**Verdict: one coherent instrument across seven registers, plus four bolt-ons.**

### Deterministic scan

detect.mjs returned 0 findings on apps/website-management/src and on packages/ui/src/blocks. Verified as not a false negative by calibration: a synthetic file with onClick-on-div, a raw hex, shadow-lg, rounded-full, an arbitrary px padding, focus:outline-none and an img without alt ALSO returned an empty result, while a CSS-in-JS probe correctly flagged bounce-easing. The engine reads CSS-in-JS, not Tailwind class strings. Read the zero as "no CSS-in-JS slop", not "clean". Exit code was 0 even on the probe that produced a finding, so exit status is not a pass/fail signal in this build.

Targeted static sweep — mostly clean and genuinely disciplined: 0 raw hex or arbitrary colors in the app, 0 shadows on resting surfaces, 0 stray rounded-full, 0 uppercase outside the sanctioned sidebar group label, 0 max-w above max-w-7xl, 0 window.confirm, every table wrapped in overflow-x-auto (table.tsx:11).

Surviving hits:
- 4 icon-only buttons with no accessible name — categories.tsx:174,184; document-categories.tsx:169,179 (found independently by both assessments)
- bare focus:outline-none with no replacement ring — tiptap-editor.tsx:70
- 3 raw hex series colors — mosquito-activity-chart.tsx:38-46, not the documented chart-1..5 pastels
- font-mono at error.tsx:52 against a Fira Code that globals.css:53 declares and never loads

### Visual overlays

Not available. The dev server is up at https://localhost:3447 (Caddy, 200) but the browser profile has no authenticated session, and Assessment B was not permitted to sign in. No injection, no live server started, no console findings. From the attempt: `/` renders a blank page when unauthenticated rather than redirecting to /login — Priority Issue 2 reproducing in a browser.

## Overall Impression

The spine is better than most production admin software. RecordIndex made keyboard-inoperable indexes fail to compile, and seven registers inherit aria-sort, URL round-tripping, distinct loading-vs-empty screens and record-naming row actions for free. What is unfinished is everything the abstraction did not reach. The biggest opportunity is not a new idea — it is finishing the migration that is already roughly 70% done and sweeping the rules that were applied only to the domains cut over first.

## What's Working

1. RecordIndex is load-bearing and earns it — renderRowLink required so a keyboard-inoperable index does not compile; aria-sort emitted; the page title as the table's accessible name; loading and empty as different screens so a statutory register never says "no notices" mid-sync (record-index.tsx:355).
2. The dashboard's counts and their queues share one surface, ordered by consequence, urgency carried by position and a condition phrase rather than color. SignalQueue reduces four domains to four fixed slots (components/signal-queue.tsx:26).
3. Lifecycle toasts name the record AND the consequence; detail pages stay put after a lifecycle click so the live badge confirms the act where the click happened (documents/$documentId.tsx:52).

## Priority Issues

### [P1] The publish switch on Create, defaulting to on, on the legal-notice form

notice-form.tsx:105 renders a SwitchField labelled "Publish Status"; line 59 seeds it is_published:true. ADR 0001 and DESIGN.md's Lifecycle Is A Button rule have no create-mode exception, and CONTEXT.md says Draft is the state everything starts in unless the author chooses otherwise. A staff member who fills the form and presses Create has published a statutory legal notice without ever making a publishing decision. document-form.tsx:127 has the same switch seeded false, so the habit learned on Documents is wrong on Notices.

Fix: delete both SwitchFields, seed both create forms to Draft, and give create the footer edit already has — a primary Create plus a LifecycleButton labelled "Create and Publish", using the Save-and-X vocabulary at lib/lifecycle.ts:71.

Command: /impeccable harden

### [P1] No error, not-found, or permission-denied screen anywhere in the app

No errorComponent, notFoundComponent or pendingComponent exists in the app, and the browser reproduced the consequence (blank unauthenticated `/`). A user without manage_website following a link from central hits (app)/route.tsx:37's rethrown Forbidden on their first click; a bookmark to a deleted Notice hits notices/$noticeId.tsx:31. packages/ui's not-found.tsx, error.tsx and access-notice.tsx already exist and are unused.

Fix: add notFoundComponent and errorComponent to __root.tsx, and an errorComponent to (app)/route.tsx rendering AccessNotice for Forbidden, naming the App Role required and linking back to central.

Command: /impeccable harden

### [P2] Categories and Document Categories are outside the system

Two 315-line hand-rolled screens that are the same screen twice: no search, no sort, no aria-sort, no URL state, a container mx-auto py-6 wrapper nothing else uses, "No categories found" printed while the collection is still syncing (categories.tsx:206), and a delete that fires on one click with no confirm (categories.tsx:186) — the one command ADR 0001 says belongs behind a confirm in a danger zone. The detector sweep independently flagged the four Edit/Delete icon buttons here as the app's only controls with no accessible name; the tooltip explaining why Delete is disabled is unreachable because disabled buttons take no focus. These are the two screens RecordIndex was written to eliminate.

Fix: compose both from RecordIndex with an Edit row action, and move Delete to a DangerZoneCard on a $categoryId detail page — the shape ADR 0001 already forced on Insecticides for this exact reason.

Command: /impeccable harden

### [P2] Cancelling a Spray Mission is unguarded while cancelling a Meeting is guarded

meetings/index.tsx:152 wraps Cancel in a confirm that names the meeting and says it stays on the record. spray-schedule/$sprayScheduleId.tsx:105 renders Cancel Mission as a bare LifecycleButton, and the missions index offers no row actions at all. DESIGN.md's rule is "withdraws or contradicts something the public is already relying on" — residents close windows and move pets because of a Spray Mission. Related: CONTEXT.md says a Delayed mission carries a rain date, and the Delay button sets the status without ever asking for one (spray-mission-transitions.tsx:37).

Fix: give MissionTransition an optional confirm, populate it on CANCEL and on the terminal COMPLETE, have Delay collect the rain date in the same dialog, and add rowActions plus a status filter to the missions index.

Command: /impeccable harden

### [P2] "In Progress" is still in the interface, in Commission Green

lib/public-requests.ts:19 defines an In Progress label and gives it the filled Commission Green badge; public-requests/index.tsx:190 iterates it into the status filter as a first-class choice. CONTEXT.md is explicit that a Public Request is either New or Resolved. The filter offers a state no command can produce, and the dashboard would badge it in the agency's signature green — while New, the state that actually needs someone, gets Pale Green, the Archived color. REQUEST_TYPE_LABELS also ships "Mosquito Fish" and "Adult Mosquito" against CONTEXT's mosquitofish and adult mosquito nuisance.

Fix: remove in_progress from the labels, variants and search validator; render any legacy row as New; correct the two type labels; swap the variants so New is filled and Resolved is muted.

Command: /impeccable clarify

## Persona Red Flags

**Long-tenured expert** (PRODUCT.md's stated operating profile): every "Back to X" button navigates to the bare index (notices/$noticeId.tsx:134), discarding the sort/page/search state RecordIndex round-trips through the URL — the most obvious control on the page destroys the state that exists for exactly this workflow. No Cancel on any of the seven forms. Insecticides has no row actions, making an edit three navigations for a URL change.

**Seasonal returner** (opens Weekly Mosquito Activity once a year): six exact snake_case column names recited in a paragraph, no template, no example row (weekly-activity/index.tsx:224). A destructive-variant "Confirm & Replace These Years" button sitting inside a green success panel, and not a dialog. "Successfully uploaded 456 rows." as the only confirmation that a season replaced a season. The chart section does not render when there is no data — no empty state.

**Screen-reader user**: categories.tsx:174,184 and document-categories.tsx:169,179 — icon-only buttons with no accessible name. weekly-activity/index.tsx:231 — a bare file input with no label and no id, on the screen that replaces a season of records. notices/$noticeId.tsx:169 — h4 metadata skipping two heading levels under the h1; the sibling Insecticides page carries a comment saying this exact bug was fixed there.

**Public Request triager** (anonymous intake; the resident cannot chase it): no Resolve row action on the register whose whole purpose is triage. DangerZoneCard passed no recordName ($requestId.tsx:210), so deleting a submission containing a person's name, phone and street address warns about "this record". The dashboard queue names the resident in primary and their address in secondary, while the detail page titles itself with the request type and demotes the person's name to a grey sub-label.

## Minor Observations

- The same record described differently on two screens: a Meeting is "Pending" on the index and "Scheduled" on the detail — and "Pending" simultaneously means published-against-a-future-date in Notices. A Cancelled Spray Mission is Refusal Red; a Cancelled Meeting is Pale Green. A Spray Mission's identity is the Area on the index and the Date on the detail.
- Create is spelled three ways ("Create New Notice" / "Create" / "New"); the route is /new for job postings and /create everywhere else. Primary actions split across Create New / Add / New.
- Four detail-page dialects, not one.
- After Create every route navigates to the index; after Edit, to the detail.
- notices/create.tsx:19 queries categories with no orderBy while $noticeId_.edit.tsx:55 orders the identical picker by name. Same split in spray-schedule/create.tsx.
- job-postings/$postingId.tsx:177 uses raw toLocaleDateString() while every other screen uses formatDateShort/formatDateTime from @mcmec/lib.
- insecticides-form.tsx:36 ships an ungrammatical description, and it is the only form in the app with a description at all.
- Every detail page wraps Back, Edit and lifecycle buttons in a nav element. Publish and Archive are not navigation.
- weekly-activity/index.tsx:197 resets the file input via document.querySelector; __root.tsx:18 renders TanStackRouterDevtools unconditionally.
- Bare focus:outline-none on tiptap-editor.tsx:70; font-mono at error.tsx:52 against an unloaded Fira Code.

## Questions to Consider

1. If RecordIndex was built because nine hand-rolled tables produced six spellings of the empty state, why do categories.tsx and document-categories.tsx still exist as the tenth and eleventh? Is the blocker that a category has no detail page to hold its danger zone?
2. Two forms still render a publish switch, each with a comment asserting that creating is the one place the publish state is a choice, and the two disagree about the default. Is create genuinely exempt from ADR 0001, or is the comment a rationalisation for the last un-migrated switch?
3. The Status Is A Word Rule says color may never carry state alone, but says nothing about the word being the same word. Should DESIGN.md gain that clause, and should status vocabulary move into @mcmec/lib where a domain can only spell itself one way?
4. Every delete* handler fires the transaction and navigates in the same synchronous tick, while the server refuses with a 409 naming the blocking record. If a refusal is a designed part of the flow, shouldn't the danger-zone dialog await it and stay put?
