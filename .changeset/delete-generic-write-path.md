---
"api": major
"@mcmec/sync": major
"@mcmec/schemas": major
"@mcmec/domain": minor
"website-management": patch
---

Delete the generic write path

The cutover's last removal. `apps/api/src/data.ts` and `packages/sync/src/crud.ts` are gone,
along with `POST`/`PATCH`/`DELETE /api/data/:table`, `stripServerCols`, `coerceDates`,
`toCamelCaseKeys`/`snakeToCamel`, `dataPathFor`, and the `drizzle-zod` dependency they were the
last consumer of. `POST /api/commands` is now the only write route in the system.

**`WRITABLE` was already empty**, checked before deleting rather than after: every slice removed
its own entry as it landed, so the map reading zero is what said the file was a shell. Nothing
routed through any of this — the three doors had been returning 404 since #165 — so the diff is
subtraction, not migration.

**A collection with no commands now has no write handlers at all.** `WriteMode` collapses to one
branch: `commands: true` stays compulsory-or-forbidden against the vocabulary (#174), but the
branch it used to exclude — `insertSchema` / `updateSchema` / `allowDelete` — has nowhere to go,
so read-only is spelled by the absence of `commands` and there is no second path left to forget
to close. The type earns its place differently than it did: a missing flag was a table on the old
door, and is now a collection that cannot be written.

**`@mcmec/schemas` keeps only its Row schemas.** Every `*InsertSchema` / `*UpdateSchema` pair is
deleted — none was picked from by a command payload, because a payload is not a row minus the
server columns. That is what makes the package a leaf.

**One of them was still live, and had drifted.** The weekly-activity CSV screen validated each
parsed row against `MosquitoActivityDataInsertSchema` — a second spelling of a rule the command
already owns, which by then demanded an `id` the screen minted and `importMosquitoActivity` has
no place for. It now checks `mosquitoActivity.MosquitoImportRow`, newly exported from
`@mcmec/domain`, so a row this screen accepts is a row the server accepts. No behaviour change on
a valid file; a malformed one is refused by the same schema at both ends.

**`COMMANDED_TABLES` goes too.** #174 built the runtime set for one reader — the boot assertion
that refused a `WRITABLE` entry for a commanded table. With `WRITABLE` deleted there is nothing
to assert against, and the type half (`CommandedTable`) carries the guarantee alone.

`packages/sync`'s README and `COLLECTIONS.md` taught the retired shape throughout and are
rewritten; `docs/CRUD.md` documented a deleted module and is deleted. Two doc-comments that
described the boot assertion and named `data.ts`/`users.ts` as live examples are corrected.

Not browser-verified — that is deferred wholesale to the end-of-cutover pass.
