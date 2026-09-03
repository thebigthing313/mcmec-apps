---
"central": minor
"@mcmec/sync": minor
"@mcmec/lib": minor
"@mcmec/ui": patch
"website-management": patch
---

Give every employee the public record to read, in Central

Central had one destination. An employee without `manage_website` who wanted to know when the
next meeting is, whether last month's minutes are posted, or what a notice actually says had to
leave the staff applications for the public website — the one surface in the system that is
written for residents rather than for the people who produce it.

A new **Commission** group in Central's rail answers both questions in place:

- **Public Meetings** — the whole meeting record, read a year at a time, with each meeting's
  48-hour notice and minutes on the row. The year defaults to the most recent one that has
  meetings rather than to `getFullYear()`, so January never opens a full record on an empty
  table.
- **Public Notices** — every notice that is on the public website, filterable by whether a
  resident finds it under Legal Notices or in the Archive, each one opening to its rendered text.

Both are read-only and composed from `RecordIndex` and `RecordDetail`, so they sort, search,
paginate and round-trip their state through the URL like every other staff register. Neither
carries a lifecycle action: publishing, archiving and cancelling are `manage_website` commands,
and Central is the application every employee has.

**Only what the public sees.** The shape proxy hands any authenticated session the whole
`notices` table, drafts included, because its policy is per-table and Website Management authors
against the same shape. Central narrows to `is_published` in the open, in one place — and the
notice route refuses an unpublished id rather than leaving the rule to the list, where a URL
could walk around it.

Two things move out of one application so a second could not fork them: `meetingStatus` goes to
`@mcmec/lib/functions/meeting-status`, beside `job-posting-status`, so Scheduled / Past /
Cancelled is spelled once across the apps that draw it; and `PUBLIC_SITE_URL` joins the app
constants, deriving the public origin from the same hostname the app switcher reads, so a "view
on the public website" link from staging cannot land on the production record.

`RecordIndex` gains an optional `totalRows`. A `filters` control is applied by the route, so the
block receives rows the caller has already narrowed and its "13 of 137" count was rendering the
numerator twice — "13 of 13", which reads as an off-by-one rather than as a filtered list. The
prop defaults to `rows.length`, so a screen whose only narrowing is the search field passes
nothing and is unchanged.
