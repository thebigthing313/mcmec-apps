---
"api": patch
"@mcmec/domain": patch
"@mcmec/lib": patch
---

The `manage_users` self-lockout guard moves to the server

`users.revokeAppRole` now refuses when the envelope target is the acting session's own user id
**and** the role being revoked is `manage_users`. The refusal is
`409 { error: "precondition_failed", reason: "self_revocation", message }`, and the message is a
finished sentence the permissions grid already renders through `findCommandRefusal`.

Until now the only thing standing between an admin and locking themselves out was a `disabled`
prop on one checkbox. Anything that is not that checkbox — curl, a stale tab, a hand-written
envelope, a future client that forgets — reached the handler and was obeyed, and the way back from
that is direct database access. The rule is now enforced where an attacker actually runs; the
client guard stays, demoted to a courtesy that keeps an admin from clicking something the server
would refuse.

`409 precondition_failed` rather than the `403` the report proposed. `403 forbidden` already means
"you may not send this command", and the caller here *does* hold `manage_users` — dispatch checked
it. This is a rule about the gesture, checked against stored state, which is the shape
`archiveNotice`'s retention check already uses.

Deliberately narrow, and the neighbouring cases are covered by tests rather than left to reading:
revoking `manage_users` from **someone else** succeeds, revoking **any other** role from yourself
succeeds, and `grantAppRole` is untouched — granting yourself a role cannot lock you out. Whether
the caller would still hold `manage_users` by some other route is not asked, and refusing a
revocation that would leave the system with zero administrators is a different and harder rule
that this is not.

`@mcmec/lib` gains a named `MANAGE_USERS` export so the guard and the role list cannot come apart,
and `apps/api` gains a test runner — these are its first tests, and CI now runs them.
