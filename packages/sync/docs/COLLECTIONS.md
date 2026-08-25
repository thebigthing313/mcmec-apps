# Collections

TanStack DB collection factories backed by the ElectricSQL shape proxy on the Railway API.

Reads stream from `GET /api/shapes/:table`. The proxy sets `table` / `where` / `columns`
server-side — that is the authorization boundary — so the client only carries sync-cursor
params and the session cookie. Writes go through `/api/data/:table` (see [CRUD.md](CRUD.md)).

---

## Two strategies

| | Eager | On-demand |
|---|---|---|
| **Sync mode** | `eager` — the whole server-narrowed shape | `on-demand` — incremental snapshots per query |
| **`startSync`** | `false` — deferred until first preview/`preload()` | `true` — ready immediately |
| **Best for** | Lookup / reference tables | Large operational tables |
| **Typical row count** | < 1 000 | Unbounded |
| **Mutations** | Yes (optional) | Yes (optional) |

---

## Shared options

Both factories take the same `ElectricCollectionOptions`:

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `table` | `string` | yes | — | The `/api/shapes/:table` + `/api/data/:table` segment |
| `schema` | `ZodObject` | yes | — | Full row shape, snake_case; its output must include `id` |
| `apiUrl` | `string` | yes | — | API origin (`VITE_API_URL`) |
| `insertSchema` | `ZodObject` | no | — | Enables inserts |
| `updateSchema` | `ZodObject` | no | — | Enables updates |
| `allowDelete` | `boolean` | no | `false` | Enables deletes |
| `commands` | `boolean` | no | `false` | Routes every write through `POST /api/commands` instead of `/api/data/:table` |

`getKey` is always `row.id`, and the collection `id` is the table name.

### Command mode

`commands: true` puts a collection on the named-command path (#152). Its writes carry an
intent — `collection.update(id, { metadata: { intents: ["website.publishNotice"] } }, draft
=> …)` — and a write without one is refused at runtime, not at compile time. `insertSchema`
and `updateSchema` are ignored, because a command payload is not "a row minus the server
columns": the payload schema lives in `@mcmec/domain`, and the server learns the operation
from the command name rather than from an HTTP verb.

Tables cut over one at a time; when the last one has (#140), this is the only mode and the
flag, `crud.ts` and the Insert/Update pairs all disappear. **`notices` is already across**,
so the CRUD examples below describe the tables still on the generic door.

### Parsing

The collection `schema` is **not** applied to synced rows — only `electricParser` is.
Electric leaves `timestamptz` / `timestamp` / `date` as strings and `numeric` as a string,
so the parser coerces them to `Date` and `number` to match the `@mcmec/schemas` row
schemas. Synced rows and mutated rows therefore agree on types.

---

## `createEagerCollection`

```ts
import { createEagerCollection } from "@mcmec/sync";

const noticeTypesCollection = createEagerCollection({
  table: "notice_types",
  schema: NoticeTypesRowSchema,
  apiUrl,

  // Mutations (all optional):
  insertSchema: NoticeTypesInsertSchema,
  updateSchema: NoticeTypesUpdateSchema,
  allowDelete: false, // default
});
```

### Initializing before use

Eager collections are built with `startSync: false`, so nothing is fetched until the
collection is first previewed. Route loaders call `.preload()`:

```ts
export const Route = createFileRoute("/notices/")({
  loader: ({ context }) => context.db.noticeTypes.preload(),
});
```

### Reading with `useLiveQuery`

```tsx
import { useLiveQuery } from "@tanstack/react-db";

const { data: noticeTypes } = useLiveQuery((q) =>
  q.from({ t: noticeTypesCollection }).select(),
);
```

### Looking up a single row

Do **not** use `or() + findOne()` on eager collections — it returns `null` for existing
rows. Filter and take the first result instead:

```ts
import { eq } from "@tanstack/db";

const noticeType = useLiveQuery((q) =>
  q.from({ t: noticeTypesCollection }).where(({ t }) => eq(t.id, id)).select(),
).data[0];
```

---

## `createOnDemandCollection`

```ts
import { createOnDemandCollection } from "@mcmec/sync";

const noticesCollection = createOnDemandCollection({
  table: "notices",
  schema: NoticesRowSchema,
  apiUrl,

  insertSchema: NoticesInsertSchema,
  updateSchema: NoticesUpdateSchema,
  allowDelete: true,
});
```

Read-only tables (e.g. `mosquito_activity_data`, `zip_codes`) simply omit
`insertSchema` / `updateSchema` / `allowDelete`.

### The `subset__*` requirement

On-demand sync sends `log=changes_only` plus `subset__where` / `subset__order_by` /
`subset__params` to pull slices. **The shape proxy must forward those params.** If they
are dropped, the collection does not fail loudly — it just syncs nothing, which is how
this surfaced once: a 178-row table rendering as "0 of 0".

Forwarding is safe because Electric *intersects* a subset with the shape's own `where`
rather than replacing it. See the note on `SAFE_PARAM_PREFIX` in `apps/api/src/shapes.ts`.

### No predicate pushdown

The shape proxy has already narrowed rows server-side to what the session may read.
Client-side filtering stays in live-query `where()`; the old PostgREST predicate pushdown
no longer applies.

```tsx
import { useLiveQuery } from "@tanstack/react-db";
import { desc, eq } from "@tanstack/db";

function NoticeList({ typeId }: { typeId: string }) {
  const { data: notices } = useLiveQuery((q) =>
    q
      .from({ n: noticesCollection })
      .where(({ n }) => eq(n.notice_type_id, typeId))
      .orderBy(({ n }) => [desc(n.notice_date)])
      .select(),
  );
  // ...
}
```

---

## Mutations

Mutations are optimistic: TanStack DB applies the change locally, the handler calls the
data API, and the optimistic state is held until that write's Postgres `txid` streams
back through Electric.

```ts
noticesCollection.insert({ id: crypto.randomUUID(), title: "Spray notice" /* … */ });
noticesCollection.update(noticeId, (draft) => {
  draft.published = true;
});
noticesCollection.delete(noticeId);
```

### Why the txid wait lives here

Returning `{ txid }` from a handler hands the wait to the collection, whose
`processMatchingStrategy` calls `awaitTxId` with a 5s default — and that call *rejects*
on timeout, marking the transaction failed and rolling the UI back. An edit that Postgres
has already durably committed would disappear from the screen.

So `settleTxids` does the wait in the handler with a 30s budget and swallows a timeout,
returning a result with **no** `txid` key so the collection doesn't wait a second time.
A non-2xx from the API still throws and still rolls back — that is the real failure
signal. Worst case after a timeout is a brief flicker, not a lost edit.

---

## Registering collections

Collections are created once per app by the factories in `@mcmec/schemas`
(`packages/schemas/src/collections/*`), which take `{ apiUrl }` and return the app's
collection map. Apps expose it through a `getDb()` / `useDb()` singleton in
`src/lib/db.ts` and hand it to the router context.

```ts
import { createNoticesCollections } from "@mcmec/sync/collections/notices";

const db = createNoticesCollections({ apiUrl: API_URL });
```

---

## Known TanStack DB quirks

- **`useLiveSuspenseQuery` + `leftJoin` + `findOne()`** causes infinite Suspense. Use base
  hooks with resolver components instead.
- **`or() + findOne()`** on eager collections returns `null` for existing rows. Split into
  separate queries.
- Eager collections use `startSync: false` — preload them in the route loader before the
  route renders.
