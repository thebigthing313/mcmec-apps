---
"@mcmec/sync": major
"@mcmec/schemas": major
"admin": patch
"central": patch
"hr": patch
"public": patch
"website-management": patch
---

Rename `@mcmec/collections` to `@mcmec/sync` and give it the per-app collection sets

The package held the Electric collection factories and the write helpers, while the four
per-app collection sets (`admin`, `central`, `hr`, `notices`) lived in `@mcmec/schemas` — so
neither name described what it held, and `schemas` depended on `collections` to build them.

- **`packages/collections` → `packages/sync`.** The shared builders move to `src/factories/`
  and `@mcmec/schemas/src/collections/*` moves in as `src/collections/*`, so an app now
  imports `@mcmec/sync/collections/notices` instead of `@mcmec/schemas/collections/notices`.
- **`@mcmec/sync/routes` is a new export that imports nothing** — `COMMAND_PATH`,
  `shapePathFor` and `dataPathFor`, the URLs the client and the API agree on. Keeping it
  dependency-free is what lets the Hono server take the paths without the TanStack stack
  behind them. `crud.ts`, `snapshot.ts` and `electric-collection.ts` now derive their URLs
  from it rather than each spelling out its own template string.
- **`@mcmec/schemas` is a pure Zod leaf.** With the collection sets gone it drops
  `@mcmec/collections`, `@tanstack/react-db`, `@tanstack/react-query` and
  `@tanstack/query-core` — all four unused by the `db/*` schemas — leaving `zod` and
  `@mcmec/lib`. Its tsconfig drops the React preset with them, its dead `src/index.ts` barrel
  (unreachable through the `exports` map, imported by nobody) is deleted, and the
  `./collections/*` export goes with the files. The dependency cycle between the two packages
  is gone: `sync` depends on `schemas`, and `schemas` on nothing of ours but `lib`.
- `admin`, `central` and `hr` drop their direct `@mcmec/schemas` dependency — they only ever
  reached it for the collection sets.

`zod` is pinned to 4.3.5 for the v4 range in the root `pnpm.overrides`. Splitting the
collection sets into a package of their own gave them a second, freshly-resolved zod (4.4.3)
whose `ZodType` is structurally incompatible with 4.3.5's, which broke the schema arguments
to the collection factories at the type level. The override is scoped `zod@^4` so the v3 that
`@tanstack/router-generator` needs is left alone.

No runtime behaviour changes. `crud.ts` and the Insert/Update schema pairs stay — they still
serve the tables that have not cut over to named commands.
