---
"@mcmec/sync": patch
"@mcmec/schemas": patch
"central": patch
"website-management": patch
"hr": patch
"admin": patch
---

Upgrade the TanStack DB stack to its current generation.

- `@tanstack/db` 0.5.33 → **0.8.3**
- `@tanstack/react-db` 0.1.61 → **0.3.3**
- `@tanstack/electric-db-collection` 0.2.41 → **0.4.3**

The three packages pin `@tanstack/db` as a hard dependency rather than a peer, so they move
as one generation; the root `pnpm.overrides` pin moves with them. No source changes were
needed — type-check, lint, build and the schemas test suite all pass against the new
versions untouched.

**The code paths our Electric collection depends on are unchanged.**
`mergePendingMutations` is byte-identical (mutation metadata still merges last-write-wins
via `incoming.metadata ?? existing.metadata`, still replacing the object whole), the
`subscriberCount` getter is identical, and `awaitTxId` still defaults to 5000 ms and still
*rejects* on timeout — which is what `settleTxids` in `electric-collection.ts` exists to
swallow. `PendingMutation.metadata` is still typed `unknown`. Verified by diffing the
installed sources, then by syncing a live shape and driving a mutation against the new
versions.

`@tanstack/electric-db-collection` 0.4.3 still fetches shapes over **GET** with the same
query params and needs `@electric-sql/client ^1.5.15`, which the existing `^1.5.12` range
already resolves to. The shape auth-proxy in `apps/api/src/shapes.ts` needs no change — the
GET → POST migration its comments anticipate has not happened yet.

**Two behavioural changes to know about.**

*Virtual properties.* Rows read out of a collection now carry `$synced`, `$origin`, `$key`
and `$collectionId`, and these survive both object spread and `JSON.stringify`. Mutation
`changes` / `modified` / `original` are clean, so the existing write path is unaffected, and
no call site currently spreads a row into a write body. Anything that starts building a
write payload from a synced row must pick fields explicitly.

*Auto-indexing.* `@tanstack/db` 0.6.0 changed `autoIndex` to default to `off`. We declare no
explicit indexes, so live queries that were implicitly indexed now scan. Nothing was
perceptibly slower in local testing; `mosquito_activity_data` is the collection to watch,
since it is the only one that reaches five figures of rows.
