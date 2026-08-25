---
"api": minor
"website-management": minor
"@mcmec/domain": minor
"@mcmec/sync": minor
"@mcmec/schemas": minor
---

Spray missions write through named domain commands

**This slice fixes a live non-atomicity.** Saving a mission used to be two HTTP writes behind
one button — the schedule through the generic CRUD door, then a full-replace `PUT` of its
municipality set — with nothing to undo the first if the second failed. A failed junction write
left a committed mission covering no municipalities, and the user a success toast. Both tables
now move inside one Postgres transaction, so they land together or roll back together.

Seven commands — `createSprayMission`, `updateSprayMissionDetails`, `cancelSprayMission`,
`completeSprayMission`, `delaySprayMission`, `rescheduleSprayMission`, `deleteSprayMission` —
defined in `@mcmec/domain`, implemented in `apps/api/src/commands/website/spray-missions.ts`.
`spray_schedules` leaves `WRITABLE`, and `PUT /api/spray-schedules/:id/municipalities` is deleted
with its module: its full-replace logic is now a command handler, minus the transaction and the
permission check the dispatcher already owns.

`municipality_ids` is not a column of `spray_schedules`, so it cannot ride in `mutation.changes`
like every other field. It travels in the `arguments` metadata channel and is flattened into the
same envelope. One consequence has no analogue in the earlier slices: a save that changes nothing
but the municipality set leaves the mission row identical, which TanStack DB treats as a no-op
and never hands to a collection handler — so that one case posts its command directly through
`sendCommand` instead. Both paths post the same envelope to the same route.

The status dropdown becomes four buttons (ADR 0001). A `<Select>` of all four states could not
say that completing a mission is terminal, or that a cancelled one can be put back; the buttons
a screen offers now follow the glossary's own account of where a mission can go from where it
is. Spray missions gain the read-only detail page ADR 0001 requires, with the form moving to
`$sprayScheduleId_.edit.tsx` and Delete moving into a danger zone card. The create screen no
longer offers a status at all — a mission is born scheduled.

Two behaviour changes ride along. A mission's dates are stored as dates rather than as instants:
`mission_date` and `rain_date` are `date` columns in string mode, so nothing downstream coerces
them and the payload schema truncates them — the column class that silently disarmed the notices
retention rule. And the edit form now sends only the fields that actually changed, against the
live row.

Three rules stay unenforced and are not invented here: `end_time > start_time`, a rain date being
required on a delayed mission, and any ordering between statuses. The server accepts any
transition from any state.
