# Collections

TanStack DB collection factories backed by the ElectricSQL shape proxy on the Railway API.

Reads stream from `GET /api/shapes/:table`. The proxy sets `table` / `where` / `columns`
server-side — that is the authorization boundary — so the client only carries sync-cursor
params and the session cookie. Writes are named commands — one envelope per command to
`POST /api/commands`, whose payload schemas and permissions live in `@mcmec/domain`.

---

## Two strategies

| | Eager | On-demand |
|---|---|---|
| **Sync mode** | `eager` — the whole server-narrowed shape | `on-demand` — incremental snapshots per query |
| **`startSync`** | `false` — deferred until first preview/`preload()` | `true` — ready immediately |
| **Best for** | Lookup / reference tables | Large operational tables |
| **Typical row count** | < 1 000 | Unbounded |
| **Mutations** | Iff the table has commands | Iff the table has commands |

---

## Shared options

Both factories take the same `ElectricCollectionOptions`:

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `table` | `TableName` | yes | — | The `/api/shapes/:table` segment |
| `schema` | `ZodObject` | yes | — | Full row shape, snake_case; its output must include `id` |
| `apiUrl` | `string` | yes | — | API origin (`VITE_API_URL`) |
| `commands` | `true` | iff the table has commands | — | Wires the write handlers |

`getKey` is always `row.id`, and the collection `id` is the table name.

### `commands` is derived, not chosen

`commands: true` is **compulsory** on a table the vocabulary names and **forbidden** on one
it does not — the type keys off the `table` literal against `CommandedTable`, so the
compiler settles it at the call site (#174). It is `import type`, so the vocabulary erases
at build and an app that names no intent pays nothing for it.

A collection without it has no `onInsert` / `onUpdate` / `onDelete` at all. That is the
whole of read-only now: the generic write door those tables used to share was deleted with
the last slice (#140), so there is no second path to forget to close.

Writes carry the command they are in `metadata.intents`:

```ts
collection.update(
  id,
  { metadata: { intents: ["website.publishNotice"] } },
  (draft) => { draft.is_published = true; },
);
```

A write with no intent is refused by the server, not by the compiler: `@mcmec/sync` does
not know the vocabulary, so `intents` is `string[]` here. A command payload is not "a row
minus the server columns" — its schema lives in `@mcmec/domain`, and the server learns the
operation from the command name rather than from an HTTP verb.

### Parsing

The collection `schema` is **not** applied to synced rows — only `electricParser` is.
Electric leaves `timestamptz` / `timestamp` / `date` as strings and `numeric` as a string,
so the parser coerces them to `Date` and `number` to match the `@mcmec/schemas` row
schemas. Synced rows and mutated rows therefore agree on types.

---

## `createEagerCollection`

```ts
import { createEagerCollection } from "@mcmec/sync";

const meetingsCollection = createEagerCollection({
  table: "meetings",
  schema: MeetingsRowSchema,
  apiUrl,
  commands: true, // `meetings` has commands, so this is compulsory
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
  commands: true,
});
```

Tables the vocabulary does not name (e.g. `zip_codes`, `municipalities`) omit `commands`
and get no write handlers. `mosquito_activity_data` is the odd one: it *has* a command, but
that command addresses a year rather than a row, so it goes through `sendCommand` and the
collection is read in this app and written by nobody.

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

Mutations are optimistic: TanStack DB applies the change locally, the handler posts one
command envelope, and the optimistic state is held until that write's Postgres `txid`
streams back through Electric.

```ts
noticesCollection.insert(
  { id: crypto.randomUUID(), title: "Spray notice" /* … */ },
  { metadata: { intents: ["website.createNotice"] } },
);
noticesCollection.update(
  noticeId,
  { metadata: { intents: ["website.publishNotice"] } },
  (draft) => { draft.is_published = true; },
);
noticesCollection.delete(noticeId, {
  metadata: { intents: ["website.deleteNotice"] },
});
```

Two intents may ride one envelope — that is what Save-and-Publish is, and it is atomic, so
a refused lifecycle command rolls the field save back with it.

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

Collections are created once per app by the sets in `@mcmec/sync/collections/*`
(`packages/sync/src/collections/*`), which take `{ apiUrl }` and return the app's
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
