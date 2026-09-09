# @mcmec/sync

TanStack DB collection factories backed by the Railway API:

- **reads** stream from the ElectricSQL shape proxy — `GET /api/shapes/:table`
- **writes** are named commands — `POST /api/commands`, one envelope per command

Both are permission-gated server-side, and every request carries the Better Auth session
cookie (`credentials: "include"`).

---

## What this package provides

| Export | Purpose |
|---|---|
| `createEagerCollection` | Full-shape stream, deferred start. For lookup/reference tables. |
| `createOnDemandCollection` | Incremental snapshots per live query. For large operational tables. |
| `createElectricCollection` | Shared builder — `syncMode` and `startSync` are explicit. |
| `sendCommand` | Posts one command envelope. Used by the factories, and directly for commands no collection owns. |
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
import { NoticesRowSchema } from "@mcmec/schemas/db/notices";
```

The row schema's output must include an `id` — it is the collection key. Row schemas are
all `@mcmec/schemas` holds: what a *write* may carry is a command's payload schema, and
those live in `@mcmec/domain`.

### 2. Create collections

```ts
import {
  createEagerCollection,
  createOnDemandCollection,
} from "@mcmec/sync";

// Eager — streams the whole (server-narrowed) shape. `startSync: false`, so nothing
// is fetched until a route loader calls `.preload()`.
export const zipCodesCollection = createEagerCollection({
  table: "zip_codes",
  schema: ZipCodesRowSchema,
  apiUrl,
  // No `commands` — the vocabulary names no command for this table, so the collection
  // is read-only by construction.
});

// On-demand — ready immediately, syncs slices as live queries ask for them.
export const noticesCollection = createOnDemandCollection({
  table: "notices",
  schema: NoticesRowSchema,
  apiUrl,
  commands: true,
});
```

`commands: true` is not a choice: it is derived from the vocabulary, so a table that has
commands must say it and a table that has none may not — the compiler settles it at the
call site (#174). See [docs/COLLECTIONS.md](docs/COLLECTIONS.md) for the full option
reference.

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

`commands: true` wires `onInsert` / `onUpdate` / `onDelete`; every write names the command
it is, in `metadata.intents`.

```ts
noticesCollection.insert(
  { id: crypto.randomUUID(), title: "Spray notice" /* … */ },
  { metadata: { intents: ["website.createNotice"] } },
);
noticesCollection.update(
  id,
  { metadata: { intents: ["website.publishNotice"] } },
  (draft) => {
    draft.is_published = true;
  },
);
```

A write with no intent is refused by the server, not by the compiler — `@mcmec/sync`
deliberately does not know the vocabulary, so `intents` is `string[]` here. A collection
with no `commands` has no handlers at all and cannot be written.

Each write returns the Postgres `txid`, and the handler holds optimistic state until
that txid streams back through Electric. A 2xx from the API is the durability signal —
a non-2xx throws and rolls the optimistic state back. See `settleTxids` in
`src/factories/electric-collection.ts` for why the wait is done there rather than
handed to the collection.

Some commands own no row to be optimistic about — the mosquito import addresses a year,
Send Invite's only column change is a server-minted id. Those post directly:

```ts
import { sendCommand } from "@mcmec/sync";

await sendCommand(apiUrl, { id, intents: ["employees.inviteEmployee"] });
```

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

---

## Fixing bugs / contributing

This package lives in the monorepo at `packages/sync`. Edit files directly —
workspace symlinks mean changes are reflected immediately in consuming packages without
rebuilding.
