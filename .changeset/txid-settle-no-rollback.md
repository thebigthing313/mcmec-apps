---
"@mcmec/supabase-tanstack-db-integration": patch
---

Stop a slow sync from rolling back a committed write.

The collection handlers returned `{ txid }`, which handed the settle wait to
`@tanstack/electric-db-collection`. Its `processMatchingStrategy` calls `awaitTxId` with a 5
second default, and that call **rejects** on timeout. The rejection propagates out of the
mutation handler, so the transaction is marked failed and the optimistic state rolls back —
the user watches their edit disappear from the screen while Postgres has it durably committed.

Five seconds is comfortable against a local API, but the production path is longer, and a
cold start on a sleeping Serverless service could plausibly exceed it. A write vanishing from
the UI is the worst possible way to report "sync was briefly slow."

The API's 2xx response is the durability signal: `handleWrite` throws on any non-2xx, so
genuine failures still reject and still roll back exactly as before. Only the lag case
changes. Each handler now awaits its own txids, with a 30 second window, and swallows a
timeout rather than failing the mutation — then returns a result with no `txid` key so the
collection does not wait a second time (its check keys off that property's presence).

In the normal case the optimistic overlay persists until the real row arrives, so there is no
flicker. If the window is exceeded, the overlay drops and the row shows its last synced value
until the collection converges — a brief flicker instead of a lost edit, and a console warning
naming the collection.
