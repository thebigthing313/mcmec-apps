---
"@mcmec/ui": patch
"website-management": patch
---

Stop the register losing your place, and land on what you just created

**Back keeps your place.** `RecordIndex` goes to real trouble to round-trip sort, page, search and
filters through the URL, and then the most obvious control on the record — "Back to Notices" —
navigated to the bare index and threw all of it away. Working a register one record at a time is
exactly the workflow that state exists for. The row link now carries the index's search into the
record, and the record's Back link hands it straight back.

**Create lands on the record.** Every create route navigated to the index, so the one thing you
were not shown was the thing you had just authored. Job Postings already did this correctly, with
a comment explaining that the client-minted id is the id the row will have; the other six never
got it.

Also in this pass:

- The Public Requests index gains Resolve and Reopen row actions. The register whose whole purpose
  is triage was the one with no triage shortcut.
- The insecticide, municipality and category pickers are ordered by name. Two of them were ordered
  on the edit screen and unordered on the create screen — the same list, two orders.
- `TiptapEditor` stops removing the focus ring without putting one back. It was the only place in
  the repo the system's single focus treatment was dropped.
- `ErrorDisplay` stops asking for `font-mono`. Fira Code is declared in `globals.css` and never
  loaded, so that class silently rendered Courier New.
- The router and query devtools are gated to development. They shipped unconditionally, so the
  floating devtools buttons sat on every production staff screen.
- The insecticides form's description — the only form description in the application — is now
  grammatical, and says what the screen is actually for.
