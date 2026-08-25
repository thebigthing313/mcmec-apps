---
"api": patch
"@mcmec/domain": minor
"@mcmec/ui": minor
"website-management": patch
---

Lift the shared command-handler helpers before the third slice

Two tables have been cut over to named commands, and both wrote out the same handler code by
hand. #134 names 49 commands, most of which are one `set` or one `delete` against one row, so a
third copy would have made the duplication a convention by accident.

**`setFields`, `deleteRow`, `NOT_FOUND` and `isForeignKeyViolation` move to
`apps/api/src/commands/rows.ts`.** They stay in the API rather than in `@mcmec/domain`, and
deliberately so: #135 split the two packages on define-versus-implement, and these take a
Drizzle table and a transaction. The line to hold is that nothing in `rows.ts` may grow a
precondition — `archiveNotice` keeps P.L. 2025 c.72 to itself — because a shared helper that
quietly starts carrying policy is how the define/implement split erodes.

`deleteRow` deliberately does not handle foreign keys. #137 put the FK→409 mapping on the
deleting handler, because "still referenced" needs a sentence naming what still references it,
and only the handler knows; `notices` keeps its wrapper and `job_postings` documents why it has
none.

**A Tiptap document has one spelling now.** `notices` typed `content` from
`NoticesRowSchema.shape.content`, which is `z.any()` — so `updateNoticeDetails` would have
carried `content: null` into a NOT NULL column and failed as a 500 where a 422 is the truth.
`job_postings` hand-rolled an object schema. The object is right, and it becomes
`TiptapDocument` in `@mcmec/domain`, where the shape of a rich-text document belongs: what
`content` may be is part of what a payload *means*.

This is the one behavioural change here — `website.createNotice` and
`website.updateNoticeDetails` now refuse a `content` that is not a JSON object. Nothing in the
app could send one; the editor emits a document and the column is NOT NULL. `TiptapDocument`
stops at "a JSON object" rather than describing Tiptap's node grammar, because the grammar is
the editor's and tightening further would start refusing documents already stored.

**Two shared components for ADR 0001.** `DangerZoneCard` is where `delete*` lives — the one
lifecycle action whose placement is not free — and `LifecycleButton` is the rest of them, which
may sit wherever is convenient but may never be a switch. The button relabels on a dirty form
("Publish" → "Save and Publish") and hands `isDirty` back to the caller, which composes the two
intents into one atomic request; `toastOnError` gains `savedTogether`, so a refusal says the
field save rolled back with it. Both are presentational and know nothing about the vocabulary.
They have no callers yet: #167 retrofits notices and job postings onto them.
