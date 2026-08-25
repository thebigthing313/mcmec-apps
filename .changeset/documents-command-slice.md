---
"api": minor
"website-management": minor
"@mcmec/domain": minor
---

Documents write through named domain commands

`documents` is the first slice to cross with a lifecycle pair, so it is the first bound by
ADR 0001 rather than only by the command split (#160). Five commands — `createDocument`,
`updateDocumentDetails`, `publishDocument`, `unpublishDocument`, `deleteDocument` — defined in
`@mcmec/domain`, implemented in `apps/api/src/commands/website/documents.ts`, and named at all
five call sites in `website-management`. `documents` leaves `WRITABLE`, so it keeps no generic
door whose writes would log `audit_log.command = null`.

A document is a *link*, not a file: `documents.url` is a plain external URL column, so nothing
in this slice touches storage and no command needs an after-commit thunk.

The publish switch leaves the edit form. `is_published` appears in no `updateDetails` payload
schema, so publishing is a button on the detail view, in the edit form as Save-and-Publish, and
as a row shortcut — never a field you save your way into. Creating a document still offers the
initial state, because a create is not a transition.

Delete moves off the edit form into the danger zone on the detail page, which is the one
placement ADR 0001 fixes.

Two behaviour changes fall out. Publishing from the detail view no longer navigates away — the
badge beside the title is live, so the result of the click is visible where the click was; it
used to bounce to the index because the page had no way to show the answer. And the edit form
now sends only the fields that actually changed, against the live row, instead of writing back a
whole row seeded once on mount.
