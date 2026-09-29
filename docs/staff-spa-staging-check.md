# Staff SPA staging check

The manual check each App passes on staging before its old app is retired. `central`'s Vitest
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

> [!IMPORTANT]
> **TODO (maintainer):** create these five Users on staging and replace each placeholder with its
> real alias. Until then the addresses below are placeholders.

| Purpose | App Roles | Linked Employee | Address |
| --- | --- | --- | --- |
| Website Management | `manage_website` | yes | `<maintainer>+staging-website@<domain>` |
| HR | `manage_employees` | yes | `<maintainer>+staging-hr@<domain>` |
| Admin | `manage_users` | yes | `<maintainer>+staging-admin@<domain>` |
| No App Role | none | yes | `<maintainer>+staging-norole@<domain>` |
| No linked Employee | none | no | `<maintainer>+staging-noemployee@<domain>` |

Each role-holding User has exactly one App Role, so step 2 can use any of the others as the User
without the role.

## Reading the Network tab

Shape reads go to `api-staging.middlesexmosquito.org/api/shapes/<table>`. In DevTools, filter
Network by `api/shapes/` and tick **Preserve log** so a navigation doesn't clear the evidence.
`employees` belongs to the root and loads for every signed-in User with a linked Employee, in
every App. Any other table is expected only inside the App whose routes use it. The per-App table
sets in `central`'s route tests are the reference if this doc and the code disagree.

## Self Service Portal

`/`, `/notices` and `/meetings`. No App Role; any signed-in User with a linked Employee.

- [ ] 1. As the no-role User, `/` loads and Network shows `employees` only. `notices`,
  `notice_types` and `meetings` appear only after opening `/notices` or `/meetings`.
- [ ] 2. As the no-role User, the app switcher lists only the Self Service Portal and has no
  dropdown. (This App has no App Role to lack, so this step stands in for the deep-link check.)
- [ ] 3. As the no-linked-Employee User, `/` shows the full-page refusal and no shapes load.
- [ ] 4. Sign out, then sign in as another User: none of the previous User's shapes resume.
- [ ] 5. Hard-refresh on `/notices`: no bounce to `/login`.

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

`/hr`, gated by `manage_employees`.

- [ ] 1. As the HR User, the App loads, and Network shows shape requests only for HR's tables
  (+ `employees`), and only after entering `/hr`.
- [ ] 2. As the Admin User, deep-link to `/hr/employees`: the URL is kept, `AppRoleRequired`
  shows, and no HR tables load.
- [ ] 3. As the no-linked-Employee User, `/hr` shows the full-page refusal.
- [ ] 4. Sign out, then sign in as another User: none of the previous User's shapes resume.
- [ ] 5. Hard-refresh on `/hr/employees`: no bounce to `/login`.

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
