---
"@mcmec/ui": minor
"website-management": minor
"admin": minor
"hr": minor
---

Move every record index onto RecordIndex

The eight remaining staff index pages now compose the shared `RecordIndex` instead of hand-rolling
a table each: Notices, Meetings, Documents, Insecticides, Job Postings, Public Requests and Spray
Missions in Website Management, and Employees in both HR and Admin.

Each one gains, without its route asking for it: a real link on every row, so the list is operable
by keyboard and a record can be opened in a new tab; `aria-sort` on the sorted column and an
accessible name on the table; row-action triggers that name their record instead of ten buttons all
called "Row actions"; a loading state distinct from the empty state; an authored empty state instead
of "No results."; a debounced search field; sort, page, size and search persisted in the URL so
returning from a record lands where you left; and a default page size of 25.

**Employees is now one component, not two files.** `apps/admin` and `apps/hr` held byte-identical
250-line copies of the same screen. Employees are one bounded context read by two surfaces, so the
screen moved to `packages/ui/blocks/employees-index.tsx` beside the other domain blocks; each app
supplies only its own typed link, its own invite command and its own add-employee control. The two
routes are 62 lines each.

**Meetings and Documents have an `h1` for the first time** — both opened on a bare button. The
meetings breadcrumb now reads "Meetings" rather than "Meetings Index", which was a developer's word
for a route rather than the Commission's word for the thing.

**Closed job postings are no longer Refusal Red.** DESIGN.md reserves that colour for destructive
commands and validation failures; the end of a hiring round is neither.

Publishing, unpublishing and cancelling now confirm before acting and say so afterwards wherever the
effect lands on the public website — a cancelled Meeting shows as Cancelled on the public calendar
under the Open Public Meetings Act, and previously did that in one click with no acknowledgement at
either end.

`notices-table`, `documents-table`, `public-requests-table` and `spray-schedule-table` are deleted.
`meetings-table` and `insecticides-table` stay, because `apps/public` renders them. The spray-mission
status and time formatters moved to `apps/website-management/src/lib/spray-schedule.ts`, so the
detail view and the dashboard no longer import a table component to borrow two functions from it.

Not migrated, deliberately: Notice Categories and Document Categories are inline-edit screens with no
detail route, so there is nothing for a required row link to point at; Manage Permissions is a role
grid rather than a record list; and Weekly Mosquito Activity is a CSV import screen with a chart.
