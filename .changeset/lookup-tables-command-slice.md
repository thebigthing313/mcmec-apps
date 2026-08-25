---
"api": minor
"website-management": minor
"@mcmec/domain": minor
"@mcmec/sync": minor
---

Notice categories, document categories and insecticides write through named domain commands

The three plain lookup tables cross together (#159): no lifecycle columns between them, so
each is the same three-command shape — create, updateDetails, delete. Nine commands defined in
`@mcmec/domain`, implemented in `apps/api/src/commands/website/`, and named at all nine call
sites in `website-management`.

One behaviour change falls out of the split. Deleting a category or an insecticide that is
still referenced now refuses with a sentence rather than a generic failure: the FK restriction
was always there, but `PATCH/DELETE /api/data/:table` could only report it as "invalid". The
categories screens already disabled the button while the count was above zero; the handler
closes the race and the insecticides screen — which offers no count at all — gains the
explanation it never had.

`notice_types`, `document_types` and `insecticides` leave `WRITABLE`, so none of the three
keeps a generic door whose writes would log `audit_log.command = null`.

`municipalities` leaves `WRITABLE` too, without commands to replace it. No app has ever
written the table — the only reference is a read — and municipality management belongs to the
reserved `reference` domain, which ships no commands until that screen exists. It was an open
write door on a table with no authoring UI, so it is deleted rather than cut over. The read
shape is untouched.
