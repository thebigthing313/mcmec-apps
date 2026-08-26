---
"api": minor
"website-management": minor
"@mcmec/domain": minor
"@mcmec/sync": minor
---

The mosquito CSV import writes through a named domain command

One command — `website.importMosquitoActivity` — and the smallest slice of the cutover by
vocabulary, but the one that does not fit the shape the dispatcher was built around. Every other
command is about one row addressed by the envelope id; an import is *delete every row for the
years the file names, then insert the file*. There is no row for an id to point at.

So the vocabulary learns one word for it. A definition may declare itself `targetless`, and the
dispatcher then stops demanding an envelope id and refuses to let that command share an envelope
with a row-scoped one — the alternative was minting a uuid that names nothing and letting it ride
through as if it did. A targetless handler is typed without an `id` at all, so it cannot read one.
The population is one command, and the flag is one line in the definition rather than a
classification every future command has to be sorted into.

`POST /api/mosquito-activity/import` is deleted with `apps/api/src/mosquito.ts`, and
`mosquito_activity_data` leaves `WRITABLE` — a second, unused door onto the same table that no app
had ever opened. What is left of the old endpoint is the write itself: the permission check, the
transaction, the actor GUCs and the txid all belong to the dispatcher now. `apiFetch` goes too:
both endpoints it existed to reach have become commands.

The CSV is still parsed in the browser, deliberately. A server-side parse would mean a multipart
upload the flat-JSON envelope cannot describe, and would move per-row error reporting away from
the file the user picked. The rows now travel named for their Postgres columns like every other
payload on this wire, so the client's snake_case→camelCase mapping step disappears. The import
posts through `sendCommand` rather than the collection — a whole-year replacement has no single
optimistic row to write, and the screen reads aggregates — and the new season streams back in
through Electric as it always did.

`toColumnValues` learns that a `numeric` column takes a string: the wire carries
`rainfall_inches` as a number because that is what Electric's parser hands back, and Drizzle
refuses to guess how a float should round. Postgres applies the column's own scale, so the old
`toFixed(2)` was doing nothing the column did not already do.

The guard against replacing the wrong season stays where it is: the preview names the years and
the row count, and the button says what it will do. It is client-side only — the server replaces
whatever years the file names — and promoting that to a year set the request declares would
refuse nothing the preview does not already show.
