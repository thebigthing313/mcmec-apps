---
"api": minor
---

Run pending migrations automatically on deploy.

The Railway start command is now `db:migrate && start`, so a merge to `develop` (staging) or `main` (production) applies any new migration before the server boots. `drizzle-kit` moved into `dependencies` so it survives the production install.

Migrations run as the table owner via a new **`MIGRATION_DATABASE_URL`** service variable — the app's own `DATABASE_URL` is the least-privilege `app_rw` role, which has no DDL rights by design. **This variable must be set on each Railway environment before a deploy carrying a new migration**; without it the migrate step fails, the server never starts, and the previous deployment keeps serving.

That fail-closed behavior is the point: a broken migration takes the deploy down rather than starting the app against a half-migrated database, and because everything reaches production through `develop`/staging first, a schema break surfaces there.

Note that `drizzle-kit` auto-loads `apps/api/.env`, so running `db:migrate` locally without `MIGRATION_DATABASE_URL` aims at whatever that file points to. The config warns when it falls back.
