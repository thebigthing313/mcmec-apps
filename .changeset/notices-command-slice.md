---
"api": minor
"website-management": minor
"@mcmec/domain": minor
"@mcmec/sync": minor
---

Notices write through named domain commands

The first table on the command path (#152). Seven commands — `website.createNotice`,
`updateNoticeDetails`, `publishNotice`, `unpublishNotice`, `archiveNotice`,
`unarchiveNotice`, `deleteNotice` — defined in `@mcmec/domain`, implemented in
`apps/api/src/commands/website/notices.ts`, and named at each call site. Every notice write
now lands a real name in `audit_log.command` instead of a null.

Two behaviour changes fall out of the split:

- **P.L. 2025 c.72 is enforced, not advised.** The seven-day retention rule was a
  non-blocking amber box in the notice form, invisible to the server. It is now a
  precondition on `archiveNotice`, checked against the stored notice date; archiving too
  early is refused with a 409 whose message is written for the person who clicked.
- **Publish and archive left the edit form.** They were switches inside a details form and
  are now two buttons, because a lifecycle column can only move through a named command —
  the payload schema for `updateNoticeDetails` omits them entirely. Create still offers the
  initial publish state, which is a choice rather than a transition.

The client-minted id is now honoured on create, so an optimistic row keeps its key when the
row commits; the generic `/api/data/notices` door is deleted.
