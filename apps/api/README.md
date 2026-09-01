# api

The MCMEC backend: Hono + Better Auth + Drizzle + the ElectricSQL shape proxy. Every write in
every app arrives here as a named command through `POST /api/commands`.

## Tests

`src/commands/dispatch.test.ts` is the command boundary's guard. It drives the real Hono app —
routing, envelope parsing, the permission gate, the dispatcher and the handlers — against a
real Postgres, because most of what it asserts is a property of the database doing the work: a
two-intent envelope commits both effects or neither, and a domain precondition is checked
against stored state rather than against what the client sent.

### Running them

Start a throwaway database once:

```bash
docker run --rm -d --name mcmec-api-test-db -p 54329:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=mcmec_api_test postgres:17-alpine
```

Then:

```bash
pnpm --filter api test        # watch
pnpm --filter api test:run    # single run, what CI runs
```

The suite applies the migrations and `src/db/triggers.sql` itself, before the first test, and
it is idempotent — re-run it against the same container as often as you like. Stop the
container with `docker rm -f mcmec-api-test-db`.

Port **54329** is deliberate: the repo's dev ports and the ports the concurrent project
described in `CLAUDE.md` reserves are both spoken for, and this suite **truncates tables
between tests**. Pointing it at a database you care about would empty it. Set
`TEST_DATABASE_URL` only if you know what is on the other end.

### How a test gets a session

`src/test/helpers.ts` mints one: `sessionWithRoles(["manage_website"])` inserts a user and a
session row and returns the request headers, signing the session cookie the way Better Auth
does. No sign-in happens over HTTP — the cookie-domain and schemeful-same-site handling that
made the old end-to-end suite fragile is not what these tests are about.

### Isolation

By truncation, not by rollback. The request under test opens its **own** transaction on the
app's connection pool, so a `BEGIN` a test issued on a different connection could never
enclose it. `resetDatabase()` runs after each test and truncates with `cascade`, so nothing
has to remember the audit or ledger rows it caused.
