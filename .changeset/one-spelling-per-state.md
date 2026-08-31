---
"@mcmec/ui": patch
"website-management": patch
---

Give every record one spelling of its own state

A record's state was a word, but which word depended on which screen you were standing on.

**"In Progress" is gone.** `CONTEXT.md` is explicit — a Public Request is either New or Resolved,
and the Commission does not track work in progress on one — and ADR 0001 records that the button
convention deliberately dropped it. It survived in the display layer, so the status filter offered
a third choice no command could produce, and it took the filled Commission Green while New, the
state that actually needs someone, took the muted variant reserved for finished work. Those are
now the right way round. The column's enum still carries the value, so a legacy row folds into New
rather than pretending it cannot appear.

**"Mosquito Fish" and "Adult Mosquito"** become *Mosquitofish* and *Adult Mosquito Nuisance* — the
glossary's words, one of them the name of a fish and the other the name of a complaint.

**A Meeting is Scheduled, not Pending.** It read "Pending" on the index and "Scheduled" on its own
page, and a meeting whose date had passed read "Past" on one and "Scheduled" on the other, which
was simply wrong. "Pending" was also already taken: in Notices it means published against a future
date. `meetingStatus` now lives in one module that both screens read.

**A Cancelled Spray Mission is no longer Refusal Red.** DESIGN.md reserves that colour for
destructive commands and validation failures. A cancelled mission is neither — it is exactly what
a cancelled Meeting is, and that badge is muted.

**A Closed Job Posting is `secondary` on both screens.** The index already had the fix, under a
comment explaining it; the detail page still shipped `destructive`. Both now read one shared map.

**One verb for one act.** "Create New X" / "Add X" / "New X" become "Create X", and every create
crumb is "Create". **SDS**, not MSDS, in every visible label. A Notice's date is "Notice date"
rather than "Published on", which was false on a Draft.

**`DangerZoneCard` stops asking "Are you absolutely sure?"** — a shadcn default sitting on the most
consequential control in the product, while `row-actions-menu.tsx` one file over already wrote the
rule down: say what will happen, naming the record. The dialog now names it, and the two call sites
that passed no `recordName` — deleting a resident's submission, deleting a spray mission — now do.
