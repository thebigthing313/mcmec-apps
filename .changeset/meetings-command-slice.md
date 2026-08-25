---
"api": minor
"website-management": minor
"@mcmec/domain": minor
"@mcmec/ui": minor
---

Meetings write through named domain commands

Five commands — `createMeeting`, `updateMeetingDetails`, `cancelMeeting`, `uncancelMeeting`,
`deleteMeeting` — defined in `@mcmec/domain`, implemented in
`apps/api/src/commands/website/meetings.ts`, and named at all three call sites in
`website-management` (#161). `meetings` leaves `WRITABLE`, so it keeps no generic door whose
writes would log `audit_log.command = null`.

**A cancelled meeting now has to say why, and the server is the one enforcing it.** This is the
third and last of the three form-only rules #134 promoted to a server precondition. It lived as
a conditional `onBlur` validator on the notes field, revalidated by an `onChange` hook on the
`is_cancelled` switch — a rule `PATCH /api/data/meetings` could not see, because the switch and
the notes reached it as two indistinguishable columns of one row. `cancelMeeting` now reads the
STORED notes and refuses with a sentence written for the person who clicked. Re-homing it takes
two interlocking validators out of the form and leaves one plain optional field.

Save-and-Cancel works because the two intents share a transaction and run in client order:
`updateMeetingDetails` lands the reason, then `cancelMeeting` reads it. A refused cancel rolls
the field save back with it, and the toast says so.

**Meetings gain the detail page ADR 0001 requires.** `$meetingId` was the edit form; it is now a
read-only view carrying the Cancel/Reinstate pair, the meeting's links and notes, and the danger
zone. The form moves to `$meetingId/edit`. Cancelling is also a row shortcut on the index —
`MeetingsTable` and `MeetingsMobileList` take an optional `rowActions` prop, which the public
site does not pass.

Cancelling still changes only what the public meetings page *says* about a meeting, never
whether it appears: `shapes.ts` gives `meetings` no predicate at all, and the read side is
untouched.

Creating a meeting no longer offers an initial cancelled state. It was never a real choice — a
meeting is born scheduled, and `createMeeting`'s payload has no `is_cancelled` to set.
