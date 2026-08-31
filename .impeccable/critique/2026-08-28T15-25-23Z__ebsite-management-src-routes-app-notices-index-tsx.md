---
target: /notices index page (reusable basis for all index pages)
total_score: 13
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-08-28T15-25-23Z
slug: ebsite-management-src-routes-app-notices-index-tsx
---
Method: dual-agent (A: design review, isolated | B: detector + browser evidence, isolated). Both completed; no degradation. The parent independently verified the one point where the assessments conflicted, and the one finding that would change already-shipped code.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 1 | No loading state; an unloaded register renders "No results." Publish/Unpublish succeed silently. No `aria-sort`. |
| 2 | Match System / Real World | 2 | "Pending" is an invented fourth state in no glossary; the Retention Period appears nowhere. |
| 3 | User Control and Freedom | 2 | Shell exits solid, but unpublish has no undo and one header click destroys the compound default sort. |
| 4 | Consistency and Standards | 1 | Across 11 indexes: 3 row-navigation mechanisms, 6 empty-state strings, 9 pagination footers, 9 sortable headers. |
| 5 | Error Prevention | 1 | No guard on unpublishing the wrong notice out of three identically-titled rows. |
| 6 | Recognition Rather Than Recall | 1 | Ten triggers all named "Row actions", each hiding exactly one item labelled the inverse of the badge. |
| 7 | Flexibility and Efficiency | 1 | No search, filter, bulk action, or URL state - and no keyboard path to a notice at all. |
| 8 | Aesthetic and Minimalist Design | 2 | Clean and flat, but under-designed: Notice Date is the identity key and the weakest thing on the row. |
| 9 | Error Recovery | 1 | One generic toast on failure; no in-row indication of which record failed. |
| 10 | Help and Documentation | 1 | No status legend, no explanation of "Pending", no hint that Archive lives on the detail view. |
| **Total** | | **13/40** | **Poor - major UX work required** |

All ten heuristics apply (Operate surface).

## Design Specificity Verdict

Generic. Could ship unchanged in any CRUD admin. The Retention Period - the one legally defined deadline in the product, under P.L. 2025 c.72 - is invisible on the index that governs it.

Deterministic scan: 0 findings, exit 0, across 23 files. Verified live with a planted control, directory recursion confirmed, re-run with `--no-config` to prove nothing was suppressed. The static ruleset does not reach this class of problem.

Browser detector: 16-18 findings, 7 of them dev-tooling artifacts (TanStack devtools, verified via `inDevtools: true` ancestors). 11 real: low-contrast x5, layout-transition x2, cramped-padding, nested-cards, overused-font x2.

## What's Working

1. The ADR-0001 wiring is the right seam: the route builds `rowActions` and passes them in, so the table never learns the command vocabulary. Archive is deliberately kept off the row because it can be refused and a 409 reads better next to the notice it is about.
2. `getPublicationStatus` computes state from data and every branch returns a word - the Status Is A Word Rule satisfied by construction.
3. `PageHeader` is properly adopted here; `meetings` and `documents` do not render it at all.

## Priority Issues

### [P0] No keyboard path to a notice, and every row action is anonymous

Whole `tr` is the click target, no `tabindex`, no anchor. 21 tab stops before the first row, then ten buttons all named "Row actions". No table caption or accessible name. Siblings (job-postings, admin/employees, hr/employees) use a real Link, so this is a regression against its own siblings.

Fix: title cell becomes a Link; per-row `label` on `RowActionsMenu` (the prop already exists); add `aria-sort` and a table accessible name.

### [P1] The primary / primary-foreground token pair fails WCAG AA - system-wide

`#f0f2e3` on `#00843d` = 4.239:1 against a 4.5 floor. Confirmed three ways: browser detector (x5), Assessment B, and an independent parent measurement from raw tokens. Affects every primary button in five frontends, the skip link in `mcmec-layout`, every filled Published/Pending badge at 12px, and the Signal Band's selected cell shipped in the previous session. DESIGN.md documents the rail pair (4.57:1, verified marginal pass) but never this one.

Fix: adjust one token pair until it clears 4.5:1; record the measured number in DESIGN.md.

### [P1] Loading and empty are the same screen, and the empty screen says "No results."

`useNotices` returns no `isLoading`. An unloaded register, a broken shape, and a genuinely empty register are pixel-identical. On a public-record system "there are no notices" must never be said by accident.

Fix: surface loading, render skeletons, real empty state, then hoist into the shared component.

### [P1] Unpublishing a live legal notice has no confirmation and no acknowledgement

`toastOnError` fires only on failure; success is silent. The action hides behind an ellipsis holding one item. ADR 0001 puts delete behind a confirm dialog; unpublish is publicly as consequential and got none.

Fix: toast on success naming record and consequence; confirm before unpublishing anything public; promote the single menu item to an inline outline `LifecycleButton`.

### [P2] No way to find a notice; the default sort is unrecoverable

No search or filter. `toggleSorting` replaces the compound default permanently. Sort/page are component state, so returning from a detail page resets to page 1. Page size 10 on ~35 records.

Fix: debounced search + status Select; persist sort/page/size/q in `validateSearch`; default page size 25.

### Retracted finding

Assessment A reported horizontal page overflow on a long title, attributed to a missing `min-w-0` on the table wrapper. Not reproducible. B measured narrow-width overflow as entirely the TanStack devtools launcher (hidden: `scrollWidth === clientWidth`, max `scrollX` 0). The parent reproduced the exact nesting with a 2400px table: `cardWrapEscapes: false`, `scrollerClips: true`. In a column flex the block child is stretched to container width; the prescribed `min-w-0` is not the mechanism. Downgraded to P2: long titles do not truncate, so Status and actions move off-screen and require scrolling inside the table container - sanctioned by DESIGN.md, still friction.

## Persona Red Flags

Alex (power user, the actual staff profile): cannot open a notice without a mouse; cannot Cmd-click into tabs; loses page and sort on every return; cannot recover the default sort; no search on the highest-traffic index.

Sam (screen reader / keyboard): ten buttons named "Row actions"; no `aria-sort` anywhere; no table caption; the index is a terminal page. Note: focus indicators ARE present (3px, 50% alpha) - B's initial "no indicator" report was a measurement artifact of programmatic focus() and was retracted.

Riley (stress tester): three rows with identical titles and only a de-emphasised date to separate them; zero rows reachable only as the loading state; rapid double-click fires navigate twice with no pending state.

## Minor Observations

- `useNotices` selects the full Tiptap content for every notice and throws it away.
- Breadcrumb vocabulary drifts: "Public Notices" / "Meetings Index" / "All Requests".
- `Page 1 of 0` on an empty table.
- job-postings maps Closed to destructive, spending Refusal Red on a non-failure.
- `admin/employees/index.tsx` and `hr/employees/index.tsx` are byte-identical, 250 lines each.
- cramped-padding and nested-cards both point at the same `rounded-md border` table wrapper.

## Questions to Consider

1. If the Retention Period is the one legally defined deadline, why does the index that governs it show no countdown?
2. Is Archived a status, or a second axis? The glossary says an Archived Notice was and remains public.
3. Why does no index page use the Signal Band? The Count Opens Its Queue Rule is written and unapplied.
4. What does a staff member actually come to /notices to do? If it is "publish the thing I just drafted", sorted-by-date-descending-everything is the wrong default view.

## Extraction Analysis

Universal (8-9 of 11 have hand-rolled each): page header (7/11 adopt; meetings and documents have no h1), sortable column header (9 implementations, none emitting `aria-sort`), pagination footer (8 near-identical ~45-line copies), table chrome, empty state (6 different strings), loading state (zero implementations anywhere - the highest-value addition), row-to-detail navigation (3 incompatible mechanisms, one keyboard-operable), URL state persistence (zero implementations).

Per-domain, keep in the route: columns and render functions, rowActions builders (already correctly owned by routes), which lifecycle actions appear on a row, filter dimensions, default sort direction (declare it rather than leaving it to a useState initialiser).

Exclude: `permissions/index.tsx` (role grid, not a record list - but it is the only one of the eleven with real loading and empty states, so borrow its copy quality); `weekly-activity/index.tsx` (CSV import with a chart). The meetings mobile card list is the outlier that over-invested; under the Desktop-First rule the other ten are correct to skip it.

Bottom line: /notices is a defensible structural template and its ADR-0001 seam is right. It is not a defensible experiential template - extract as-is and the P0 and P1s replicate across eleven surfaces at once. Fix first, then extract, so the fixes land eleven times.
