# Staff SPA staging check

The manual check each App passed on staging before its old app was retired. #254 ran its
sign-in and gate steps against production `central`. `central`'s Vitest
suite covers the App Role gates and which tables each route asks for (#242). This check covers
what only a real browser against real staging shows: which shapes actually go over the wire,
whether the session cookie survives a refresh, and whether one User's data reaches the next.

## How to use it

1. Each fold-in PR links this doc in its description.
2. After the PR merges, run `pnpm stage` (wake the sleeping staging services first, or Railway
   skips their builds; see `docs/railway-deployment.md`).
3. Work through the App's section on `https://central-staging.middlesexmosquito.org`, signed in
   as the staging Users below.
4. Copy the App's section into a comment on the fold-in PR, ticked. A step that fails gets a line
   saying what happened instead of a tick.
5. The App's retire PR links that comment. An App with an unticked step is not retired.

Re-run the Self Service Portal section on every fold-in, because each one changes the shell.

## Staging Users

Five fixed Users, on plus-addressed aliases of the maintainer's own inbox. Never use a real
`@middlesexmosquito.org` address, and never write a password here or in a PR comment.

They were created through the ordinary invite flow: add the Employee in HR, invite it, set the
password from the mailed link, then grant the App Role in Admin. The no-linked-Employee User was
invited like the others and then had its Employee record deleted, which leaves the login in place.

| Purpose | App Roles | Employee | Address |
| --- | --- | --- | --- |
| Website Management | `manage_website` | Staging Website | `adriankabigting+staging-website@gmail.com` |
| HR | `manage_employees` | Staging HR | `adriankabigting+staging-hr@gmail.com` |
| Admin | `manage_users` | Staging Admin | `adriankabigting+staging-admin@gmail.com` |
| No App Role | none | Staging NoRole | `adriankabigting+staging-norole@gmail.com` |
| No linked Employee | none | none ("Staging NoEmployee" deleted) | `adriankabigting+staging-noemployee@gmail.com` |

Each role-holding User has exactly one App Role, so step 2 can use any of the others as the User
without the role.

## Reading the Network tab

Shape reads go to `api-staging.middlesexmosquito.org/api/shapes/<table>`. In DevTools, filter
Network by `api/shapes/` and tick **Preserve log** so a navigation doesn't clear the evidence.
`employees` belongs to the root and loads for every signed-in User with a linked Employee, in
every App. Any other table is expected only inside the App whose routes use it. The per-App table
sets in `central`'s route tests are the reference if this doc and the code disagree.

## Self Service Portal

`/`, `/calendar`, `/holidays`, `/notices` and `/meetings`. No App Role; any signed-in User with a
linked Employee.

- [ ] 1. As the no-role User, `/` loads and Network shows `employees`, plus the four Calendar
  tables the Upcoming card reads: `staff_events`, `holidays`, `meetings` and `spray_schedules`.
  `notices` and `notice_types` appear only after opening `/notices`.
- [ ] 2. As the no-role User, the app switcher lists only the Self Service Portal and has no
  dropdown. (This App has no App Role to lack, so this step stands in for the deep-link check.)
- [ ] 3. As the no-linked-Employee User, `/` shows the full-page refusal and no shapes load —
  none of the four Calendar tables either.
- [ ] 4. Sign out, then sign in as another User: none of the previous User's shapes resume.
- [ ] 5. Hard-refresh on `/notices`: no bounce to `/login`.

### Calendar (#302)

Seed first, as the HR User: two Holidays this year (one with a **Falls on** date), one next year,
a timed single-day Staff Event, an all-day Staff Event spanning a week boundary, and a Cancelled
one. A Spray Mission Delayed with a rain date and a Meeting already exist on staging, or add them
in Website Management.

- [ ] 6. **Upcoming card** on `/`: up to five rows in Calendar order, each "Tomorrow · 7pm" /
  weekday / date with a date tile and source dot; the Cancelled Staff Event greyed and struck
  through; a Delayed mission's original date absent once its rain date is listed. **Open
  Calendar →** goes to `/calendar`.
- [ ] 7. **`/calendar`** (month): weeks start Sunday; the multi-day Staff Event is one bar squared
  off where it crosses the week; timed items show dot, time and title; a day with more than three
  items offers "+N more". ‹ › and **Today** move the month and keep `?month=` in the URL.
- [ ] 8. **`/calendar?view=agenda`**: the month by day as a list; the multi-day item on the day it
  starts. Status badges: Cancelled, Delayed (with its "Moved to" line), Rain date (dashed),
  Completed.
- [ ] 9. Keyboard only: Tab reaches every item; Enter opens its popover; Escape closes it. A
  Meeting's popover links to `/meetings/<id>`; a Holiday with a falls-on date says "Falls on …;
  offices close on the observed day"; a Spray Mission shows only its map link.
- [ ] 10. **`/holidays`**: this year's Holidays, past ones muted, the next one badged **Next**, the
  count under the table. ‹ › steps a year; a year with none reads "No Holidays entered for ‹year›
  yet. HR adds a year's Holidays once the Commission adopts them." Network shows `holidays` (and
  `employees`) only when `/holidays` is opened directly.
- [ ] 11. A day's dates read the same in the Calendar, the card and HR — no day off by one (the
  `date` columns sync as text; a slip shows as the day before).

## Website Management

`/website-management`, gated by `manage_website`.

- [ ] 1. As the Website Management User, the App loads, and Network shows shape requests only
  for Website Management's tables (+ `employees`), and only after entering `/website-management`.
- [ ] 2. As the HR User, deep-link to `/website-management/notices`: the URL is kept,
  `AppRoleRequired` shows, and no Website Management tables load.
- [ ] 3. As the no-linked-Employee User, `/website-management` shows the full-page refusal.
- [ ] 4. Sign out, then sign in as another User: none of the previous User's shapes resume.
- [ ] 5. Hard-refresh on `/website-management/spray-missions`: no bounce to `/login`.

## HR

`/hr`, gated by `manage_employees`. Screens: `/hr/employees`, `/hr/staff-events` and
`/hr/holidays`.

- [ ] 1. As the HR User, the App loads, and Network shows shape requests only for HR's tables
  (+ `employees`), and only after entering `/hr`. `staff_events` loads only under
  `/hr/staff-events`, `holidays` only under `/hr/holidays`.
- [ ] 2. As the Admin User, deep-link to `/hr/employees` and `/hr/holidays`: the URL is kept,
  `AppRoleRequired` shows, and no HR tables load.
- [ ] 3. As the no-linked-Employee User, `/hr` shows the full-page refusal.
- [ ] 4. Sign out, then sign in as another User: none of the previous User's shapes resume.
- [ ] 5. Hard-refresh on `/hr/employees`: no bounce to `/login`.
- [ ] 6. **Holidays**: add one, edit it, clear its Falls on date, delete it from the danger zone.
  Adding a second Holiday on a day already taken shows "There is already a Holiday on …" under
  **Observed**, and nothing is saved. The ‹ year › stepper moves the list.
- [ ] 7. **Staff Events**: add a timed one and an all-day multi-day one. An end time before the
  start on a single day, or an end date before the start, shows a field error. Cancel Event from
  the row menu, then Reinstate from the detail page; on the edit form, change a field and use
  **Save and Cancel Event** — both land together. Delete from the danger zone.
- [ ] 8. `updated_at` moves on staging: after an edit, the row's `updated_at` (e.g. via the shape
  response in Network) is later than its `created_at` — the custom migrations attached
  `set_updated_at` to both new tables.

## Admin

`/admin`, gated by `manage_users`.

- [ ] 1. As the Admin User, the App loads, and Network shows shape requests only for Admin's
  tables (+ `employees`), and only after entering `/admin`.
- [ ] 2. As the HR User, deep-link to `/admin/users`: the URL is kept, `AppRoleRequired` shows,
  and no Admin tables load.
- [ ] 3. As the no-linked-Employee User, `/admin` shows the full-page refusal.
- [ ] 4. Sign out, then sign in as another User: none of the previous User's shapes resume.
- [ ] 5. Hard-refresh on `/admin/users`: no bounce to `/login`.

Step 4 is the data-leak path on a shared workstation. Step 5 catches a cookie or scheme mismatch
between `central` and `api` (see "Domains and the session cookie" in
`docs/railway-deployment.md`).
