---
"api": patch
---

Test the command boundary

`POST /api/commands` is the one write door, and the runtime invariants it enforces — refusing an
unknown or public command, refusing a malformed envelope, checking permission per command and
*before* any payload is inspected, keeping a targetless command out of a row-scoped envelope,
committing a two-intent envelope whole or not at all — had been verified by hand on staging once
and unguarded since.

`apps/api` now has a Vitest suite that drives the real Hono app against a real Postgres and
asserts the status **and** the refusal reason for each one. The reason strings are what the UI
shows a user, so a changed reason now fails a test rather than shipping.

Two choices worth naming. Isolation is by truncation, not by a transaction the test opens: the
request under test opens its own transaction on the app's pool, so a `BEGIN` on another
connection could never enclose it. And a test gets a session by minting the user and session
rows directly and signing the cookie, never by signing in over HTTP — the cookie-domain and
same-site handling that made the retired end-to-end suite fragile is not what these tests are
about.

CI provisions the database as a service container. Locally it is one `docker run` line, in
`apps/api/README.md`.
