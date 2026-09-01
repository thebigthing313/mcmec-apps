---
"api": patch
---

Test the command boundary

`POST /api/commands` is the one write door, and the runtime invariants it enforces — refusing an
unknown or public command, refusing a malformed envelope, checking permission per command and
*before* any payload is inspected, keeping a targetless command out of a row-scoped envelope,
committing a two-intent envelope whole or not at all — had been verified by hand on staging once
and unguarded since.

`apps/api`'s Vitest suite now drives the real Hono app against a real Postgres and asserts the
status **and** the refusal reason for each. The reason strings are what the UI shows a user, so a
changed reason now fails a test rather than shipping. The `notice_postings` ledger is covered
alongside them: a publish appends exactly one row attributed to the caller, republishing appends
a second, and a refused envelope leaves none behind — which matters because the table is
append-only and a forged entry could never be removed.

Isolation is by truncation, not by a transaction the test opens: the request under test opens its
own transaction on the app's pool, so a `BEGIN` on another connection could never enclose it. A
test gets a session by minting the user and session rows directly and signing the cookie, never
by signing in over HTTP.

CI gains a Postgres service container. Locally it is one `docker run` line, in
`apps/api/README.md`.
