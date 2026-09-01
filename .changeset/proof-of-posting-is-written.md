---
"api": minor
---

Publishing a notice writes its proof-of-posting record

`notice_postings` was fully scaffolded — table, `manage_website`-gated shape, append-only
grants, exclusion from the seven-year purge — and nothing ever inserted a row. Now that the
website is MCMEC's primary method of publishing legal notices under P.L. 2025 c.72, the ledger
is the evidence, so an empty one is the same as no evidence at all.

Every unpublished→published transition now appends exactly one row inside the same transaction
as the write that caused it, with `posted_by` set to the acting user. Two commands can cause
that transition and only those two write:

- `publishNotice` reads the stored `is_published` first — with the row locked, because the
  read decides whether to write and the ledger cannot be corrected by DELETE — and appends only
  on a genuine transition, so publishing an already-published notice forges nothing.
- `createNotice` with `is_published: true` appends, because creating an already-published
  notice is the transition.

`updateNoticeDetails` writes no row and needs no check — the domain omits the lifecycle columns
from its payload schema, so `is_published` cannot move through it.

The snapshot freezes `title`, `notice_date`, `notice_type` (the resolved type name),
`notice_type_id` and `content`, read back from the notice row rather than from the command
payload. That is what makes the canonical two-intent save-and-publish envelope freeze the
*updated* content, and what keeps the record correct however the intents are ordered. The type
name is frozen beside its id so the record stays readable if the type is later renamed.

Unpublish-then-republish appends a second row: two distinct periods of public availability are
two pieces of evidence. No schema change and no migration — the table already had the columns.
