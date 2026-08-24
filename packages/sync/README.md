# @mcmec/sync

TanStack DB collection factories backed by the Railway API:

- **reads** stream from the ElectricSQL shape proxy — `GET /api/shapes/:table`
- **writes** go through the generic data API — `POST`/`PATCH`/`DELETE /api/data/:table`

Both are permission-gated server-side, and every request carries the Better Auth session
cookie (`credentials: "include"`).

---

## What this package provides

| Export | Purpose |
|---|---|
| `createEagerCollection` | Full-shape stream, deferred start. For lookup/reference tables. |
| `createOnDemandCollection` | Incremental snapshots per live query. For large operational tables. |
| `createElectricCollection` | Shared builder — `syncMode` and `startSync` are explicit. |
| `apiInsertRows` / `apiUpdateRow` / `apiDeleteRows` | Write helpers the factories use. |
| `toCamelCaseKeys` / `snakeToCamel` | snake_case (Electric) → camelCase (API) key mapping. |
| `fetchShapeSnapshot` | One-shot shape read for SSR — no live stream left open. |
| `electricParser` | Coerces Electric's string `timestamptz`/`date`/`numeric` to `Date`/`number`. |

Two further subpaths:

| Subpath | Purpose |
|---|---|
| `@mcmec/sync/collections/*` | The per-app collection sets — `admin`, `central`, `hr`, `notices` (website-management). An app imports the one set it reads. |
| `@mcmec/sync/routes` | Every URL the client and the API agree on. **Imports nothing**, deliberately: the Hono server takes the paths without the TanStack stack behind them. |

---

## Installation

Workspace-internal — apps depend on it as `"@mcmec/sync": "workspace:*"`.
Its runtime peers (`@electric-sql/client`, `@tanstack/db`,
`@tanstack/electric-db-collection`, `zod`) come with the package.

---

## Quick start

### 1. Bring your own Zod schemas

This package does **not** generate schemas. Row schemas live in `@mcmec/schemas`
(`packages/schemas/src/db/*`) and are written against the **snake_case** column names
Electric streams.

```ts
import {
  NoticesRowSchema,
  NoticesInsertSchema,
  NoticesUpdateSchema,
} from "@mcmec/schemas/db/notices";
```

The row schema's output must include an `id` — it is the collection key.

### 2. Create collections

```ts
import {
  createEagerCollection,
  createOnDemandCollection,
} from "@mcmec/sync";

// Eager — streams the whole (server-narrowed) shape. `startSync: false`, so nothing
// is fetched until a route loader calls `.preload()`.
export const noticeTypesCollection = createEagerCollection({
  table: "notice_types",
  schema: NoticeTypesRowSchema,
  apiUrl,
});

// On-demand — ready immediately, syncs slices as live queries ask for them.
export const noticesCollection = createOnDemandCollection({
  table: "notices",
  schema: NoticesRowSchema,
  apiUrl,
  insertSchema: NoticesInsertSchema,
  updateSchema: NoticesUpdateSchema,
  allowDelete: true,
});
```

See [docs/COLLECTIONS.md](docs/COLLECTIONS.md) for the full option reference.

---

## Using collections in React

```tsx
import { useLiveQuery } from "@tanstack/react-db";
import { eq } from "@tanstack/db";

function NoticeList({ typeId }: { typeId: string }) {
  const { data: notices } = useLiveQuery((q) =>
    q
      .from({ n: noticesCollection })
      .where(({ n }) => eq(n.notice_type_id, typeId))
      .select(),
  );
  return <ul>{notices.map((n) => <li key={n.id}>{n.title}</li>)}</ul>;
}
```

Filtering happens client-side in `where()`. There is no predicate pushdown — the shape
proxy has already narrowed the rows to what the session may read.

---

## Mutations

Pass `insertSchema` / `updateSchema` / `allowDelete` to enable them; the factory wires
`onInsert` / `onUpdate` / `onDelete` to the data API.

```ts
noticesCollection.insert({ title: "Spray notice", published: false /* … */ });
noticesCollection.update(id, (draft) => {
  draft.published = true;
});
noticesCollection.delete(id);
```

Each write returns the Postgres `txid`, and the handler holds optimistic state until
that txid streams back through Electric. A 2xx from the API is the durability signal —
a non-2xx throws and rolls the optimistic state back. See `settleTxids` in
`src/collections/electric-collection.ts` for why the wait is done there rather than
handed to the collection.

---

## Server-side rendering

```ts
import { fetchShapeSnapshot } from "@mcmec/sync";

const notices = await fetchShapeSnapshot({ table: "notices", apiUrl, signal });
```

Carries no session, so the proxy applies its anonymous policy (published-only rows).
The stream is aborted once the snapshot lands, so no long-poll outlives the request.

---

## Docs

- [Collections (eager + on-demand)](docs/COLLECTIONS.md)
- [Write helpers](docs/CRUD.md)

---

## Fixing bugs / contributing

This package lives in the monorepo at `packages/sync`. Edit files directly —
workspace symlinks mean changes are reflected immediately in consuming packages without
rebuilding.
