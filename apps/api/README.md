# api

The MCMEC backend: Hono + Better Auth + Drizzle + the ElectricSQL shape proxy. Every write in
every app arrives here as a named command through `POST /api/commands`.

## Tests

`pnpm --filter api test` (watch) / `test:run` (single run, what CI runs).

**The suite needs a Postgres.** Start a throwaway one once:

```bash
docker run --rm -d --name mcmec-api-test-db -p 54329:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=mcmec_api_test postgres:17-alpine
```

Stop it with `docker rm -f mcmec-api-test-db`. The suite applies the migrations and
`src/db/triggers.sql` itself before the first test, and is idempotent — re-run it against the
same container as often as you like. CI provisions the same database as a service container.

Port **54329** is deliberate: the repo's dev ports and the ports the concurrent project
described in `CLAUDE.md` reserves are both spoken for, and this suite **truncates tables
between tests**. Pointing `TEST_DATABASE_URL` at a database you care about would empty it.

### The two kinds of test here

- **`src/commands/dispatch.test.ts`** — the command boundary (#184). It drives the real Hono
  app against the database, because most of what it asserts is a property of Postgres doing the
  work: a two-intent envelope commits both effects or neither, a domain precondition is checked
  against stored state rather than against what the client sent, and the append-only
  `notice_postings` ledger must carry no row for a publish that was rolled back.
- **`src/commands/users/users.test.ts`** — a rule about the acting session and the envelope
  target, which the database has no opinion on, so it runs against a stand-in transaction.

Both run under one Vitest config, so a unit test file still waits for the migrations. That is
the price of one runner, and it is a few seconds.

### How a test gets a session

`src/test/helpers.ts` mints one: `sessionWithRoles(["manage_website"])` inserts a user and a
session row and returns the request headers, signing the session cookie the way Better Auth
does. No sign-in happens over HTTP — the cookie-domain and schemeful-same-site handling that
made the retired end-to-end suite fragile is not what these tests are about.

### Isolation

By truncation, not by rollback. The request under test opens its **own** transaction on the
app's connection pool, so a `BEGIN` a test issued on a different connection could never enclose
it. `resetDatabase()` runs after each test and truncates with `cascade`, so nothing has to
remember the audit or ledger rows it caused. `fileParallelism` is off for the same reason: two
files sharing one database would truncate each other's rows mid-request.
