---
"api": minor
"admin": minor
"hr": minor
"website-management": patch
"@mcmec/domain": minor
"@mcmec/lib": minor
"@mcmec/sync": minor
"@mcmec/ui": minor
---

Employee and user management writes through named domain commands

The last slice. Six commands across the two domains that are not `website` —
`employees.addEmployee`, `employees.updateEmployeeDetails`, `employees.deleteEmployee`,
`employees.inviteEmployee`, `users.grantAppRole`, `users.revokeAppRole` — and with them
**`WRITABLE` is empty**: no table in the system keeps a generic write door, and every write in
every app names the command behind it. `POST /api/invite` and `PUT /api/users/:id/roles` are
deleted, the last two bespoke write routes.

**Two apps, one command.** `hr` and `admin` shipped byte-identical copies of the add/edit/delete
trio, which is exactly what #135 meant by putting collections and domains on separate axes: the
domain is named for the bounded context, not for an app, so one `employees.addEmployee` serves
both. Both were converted; neither was assumed to follow the other.

**Send Invite is atomic now, and it was not before.** The old route created the Better Auth login
first, linked the employee second, and carried a compensating hard delete for when the second step
failed — a rollback written by hand, correct only for as long as someone maintained it. The
command writes the `users` row and the `employees.user_id` link with Drizzle on the dispatcher's
own transaction, so the two are one fact, and sends the set-password mail from an `AfterCommit`
thunk (#137) because mail is the one thing a transaction cannot take back. There is no throwaway
password any more either: better-auth's `resetPassword` creates the credential account when the
invitee follows the link, so the account never holds a password nobody chose.

That also fixes the audit trail rather than working around it. Writing `users` inside the command
transaction means the GUCs are set, so `audit_users` names the acting admin and the command;
through Better Auth's own connection the same insert logs a null actor and a null command. The
`user-audit.ts` seam stays a no-op and its open question narrows: **no** `users` command routes
through Better Auth, so what is left in those hooks is sign-in, verification and password reset —
writes with genuinely no command behind them.

*Behaviour change:* the invite response can no longer report `emailSent: false`, because the mail
goes out after the response is decided. A failed send is a server log, and the "Email Failed" badge
went with the endpoint.

**The role grid stops full-replacing.** One checkbox sent the user's whole role set, so two admins
ticking different boxes clobbered each other and the audit row recorded a list rewritten rather
than a role moved. `grantAppRole` / `revokeAppRole` are named for the gesture and take **one role,
not an array** — there is no shape in which a set can be sent — and the server does the
read-modify-write inside the transaction. The `manage_users` self-lockout hole is untouched and
still #141.

**`manage_reference_data` lands, granting nothing.** The `reference` domain ships zero commands
until the reference-data screen exists, but its AC resource, its role and its column in the
permissions grid arrive with the cutover so nothing has to be added in two places later.
`APP_ROLES` was declared twice — once in `apps/api/src/auth.ts`, once in `@mcmec/lib` under a
comment asking someone to keep them in sync — and `@mcmec/domain` needed it as a third, to
validate the role payload. It is now one list, in `@mcmec/lib`, read by all three.

**Three app-local helpers found homes.** `useFormSeed` / `rowVersion` move to `@mcmec/ui/hooks`
(pure React, and load-bearing: an edit form without the latch silently reverts concurrent edits).
`toastOnError` moves to `@mcmec/ui/lib` — the one helper needing both sonner and
`findCommandRefusal`, over a deliberately narrow new edge to the dependency-free
`@mcmec/sync/command-write` subpath. `intents` stays copied per app: four lines whose whole job is
to be one app's binding point to the vocabulary.

On the screen, Delete moves off the edit form into a danger zone card on the detail page (ADR
0001), warning that an invited employee's login is not deleted with the record. Send Invite is a
`sendCommand` call rather than a collection write, because a command whose only column change is a
server-minted id has nothing to be optimistic about — and TanStack DB drops an update with no
tracked changes, which would have failed it silently behind a success state (#162).
