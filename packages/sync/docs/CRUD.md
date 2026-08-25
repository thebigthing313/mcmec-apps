# Write helpers

Low-level helpers used internally by the collection factories' `onInsert` / `onUpdate` /
`onDelete` handlers. Use them directly only if you need a write outside a collection.

Reads come from Electric (see [COLLECTIONS.md](COLLECTIONS.md)); writes go through the
backend's generic data API — permission-gated and audit-logged:

| Endpoint | Purpose |
|---|---|
| `POST /api/data/:table` | insert (single row) |
| `PATCH /api/data/:table/:id` | update by id |
| `DELETE /api/data/:table/:id` | delete by id |

Every request sets `credentials: "include"` so the Better Auth session cookie is sent.

**This is the retiring path.** Tables cut over to named commands one at a time (#152) and
write through `POST /api/commands` instead — see "Command mode" in
[COLLECTIONS.md](COLLECTIONS.md). `notices`, `job_postings`, `notice_types`, `document_types`
and `insecticides` are already across, so the examples below, which use `notices`, describe how
the tables still on the generic door behave rather than how `notices` behaves today. When the last table crosses (#140) this module is deleted.

---

## Casing

Electric streams **snake_case** (and the `@mcmec/schemas` `db/*` schemas are snake_case),
but the API validates with drizzle-zod, whose keys are the Drizzle TS property names —
**camelCase**. Every write body is converted here. This is the single place the two
conventions meet.

Only top-level keys are converted; `jsonb` values pass through intact.

---

## `txid`

Each endpoint returns the Postgres `txid` of its write transaction. The helpers return it
so the collection handler can hold optimistic state until that txid streams back through
Electric. If the backend omits `txid`, the helpers return `undefined` and the handler
falls back to Electric's match timeout.

---

## `WriteTarget`

Every helper takes the same target:

```ts
interface WriteTarget {
  /** API origin (VITE_API_URL) */
  apiUrl: string;
  /** table segment of /api/data/:table */
  table: string;
}
```

---

## `apiInsertRows`

Validates each row with `insertSchema`, converts keys to camelCase, and POSTs them one at
a time (the generic endpoint is single-row).

```ts
import { apiInsertRows } from "@mcmec/sync";

const txids = await apiInsertRows(
  { apiUrl, table: "notices" },
  NoticesInsertSchema,
  [{ id: crypto.randomUUID(), title: "Spray notice" }],
);
```

**Signature:**
```ts
apiInsertRows<TInsertSchema extends ZodObject>(
  target: WriteTarget,
  insertSchema: TInsertSchema | undefined,
  rows: unknown[],
): Promise<number[]>
```

- Throws if `rows` is empty, or longer than 500 rows.
- Validation is skipped when `insertSchema` is `undefined`.
- Throws a descriptive `Error` on any non-2xx response.
- Returns the txids of the writes that reported one.

---

## `apiUpdateRow`

Validates the changes with `updateSchema`, converts keys to camelCase, and PATCHes by id.

```ts
const txid = await apiUpdateRow(
  { apiUrl, table: "notices" },
  NoticesUpdateSchema,
  noticeId,
  { published: true },
);
```

**Signature:**
```ts
apiUpdateRow<TUpdateSchema extends ZodObject>(
  target: WriteTarget,
  updateSchema: TUpdateSchema | undefined,
  id: string | number,
  changes: unknown,
): Promise<number | undefined>
```

---

## `apiDeleteRows`

DELETEs each id in turn.

```ts
const txids = await apiDeleteRows({ apiUrl, table: "notices" }, [id1, id2]);
```

**Signature:**
```ts
apiDeleteRows(
  target: WriteTarget,
  ids: Array<string | number>,
): Promise<number[]>
```

---

## `snakeToCamel` / `toCamelCaseKeys`

Exported for callers that build request bodies themselves.

```ts
snakeToCamel("notice_type_id");            // "noticeTypeId"
toCamelCaseKeys({ notice_type_id: "…" });  // { noticeTypeId: "…" }
```

---

## `fetchShapeSnapshot`

Not a write helper, but the other direct-use export: a one-shot shape read for callers
that want current rows rather than a live collection — server-side rendering, most of all.

```ts
import { fetchShapeSnapshot } from "@mcmec/sync";

const notices = await fetchShapeSnapshot({ table: "notices", apiUrl, signal });
```

It subscribes, waits for the shape to report up-to-date, then aborts the stream so no
long-poll outlives the request. It carries no session, so the proxy applies its anonymous
policy (published-only rows for notices, documents, and job postings), and it applies the
same `electricParser` the collections use so server and client rows agree.
