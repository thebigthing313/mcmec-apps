# Collections

TanStack DB collection factories that translate predicate queries into Supabase PostgREST calls.

---

## Two strategies

| | Eager | On-demand |
|---|---|---|
| **Fetch strategy** | Full table on first use | Filtered subset per query |
| **Best for** | Lookup / reference tables | Large operational tables |
| **Typical row count** | < 1 000 per tenant | Unbounded |
| **Mutations** | Yes (optional) | Yes (optional) |
| **`startSync`** | `false` — call `stateWhenReady()` before use | `true` |

---

## `createEagerCollection`

```ts
import { createEagerCollection } from '@simmer/supabase-tanstack-db-integration';

const rolesCollection = createEagerCollection({
  table: 'roles',          // string — Supabase table name
  schema: RolesBaseRowSchema,  // Zod schema for the full row
  queryClient,
  supabase,

  // Mutations (all optional):
  insertSchema: RolesInsertSchema,
  updateSchema: RolesUpdateSchema,
  allowDelete: false,   // default

  // Cache:
  staleTime: 3_600_000, // 1 hour (default)
});
```

### Options

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `table` | `string` | yes | — | Supabase table name |
| `schema` | `ZodObject` | yes | — | Full row schema (SELECT shape) |
| `queryClient` | `QueryClient` | yes | — | TanStack Query client |
| `supabase` | `SupabaseClient` | yes | — | Supabase client |
| `insertSchema` | `ZodObject` | no | — | Enables inserts |
| `updateSchema` | `ZodObject` | no | — | Enables updates |
| `allowDelete` | `boolean` | no | `false` | Enables deletes |
| `staleTime` | `number` (ms) | no | `3_600_000` | Cache freshness window |

### Initializing before use

Eager collections use `startSync: false`. You must call `stateWhenReady()` before the
first query (typically in your auth or router `beforeLoad`):

```ts
await rolesCollection.stateWhenReady();
```

### Reading with `useLiveQuery`

```tsx
import { useLiveQuery } from '@tanstack/react-db';

const { data: roles } = useLiveQuery((q) =>
  q.from({ roles: rolesCollection }).select()
);
```

### Looking up a single row

Do **not** use `or() + findOne()` on eager collections — it returns `null` for
existing rows. Use separate hooks:

```ts
// Correct
const role = useLiveQuery((q) =>
  q.from({ roles: rolesCollection })
    .where(({ roles: r }) => eq(r.id, id))
    .select()
).data[0];
```

---

## `createOnDemandCollection`

```ts
import { createOnDemandCollection } from '@simmer/supabase-tanstack-db-integration';

const ordersCollection = createOnDemandCollection({
  table: 'orders',
  schema: OrdersBaseRowSchema,
  queryClient,
  supabase,

  insertSchema: OrdersInsertSchema,
  updateSchema: OrdersUpdateSchema,
  allowDelete: true,

  staleTime: 3_600_000,
});
```

### Options

Same as eager, with one addition:

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `table` | `string` | yes | — | Supabase table **or view** name |
| ... | | | | (all eager options apply) |

Views are read-only — pass no `insertSchema`/`updateSchema`/`allowDelete` for views.

### Filtered queries with `useLiveInfiniteQuery`

```tsx
import { useLiveInfiniteQuery } from '@tanstack/react-db';
import { eq, desc } from '@tanstack/db';

function OrderList({ status }: { status: string }) {
  const { data, fetchNextPage, hasNextPage } = useLiveInfiniteQuery(
    (q) =>
      q.from({ orders: ordersCollection })
        .where(({ orders: o }) => eq(o.status, status))
        .orderBy(({ orders: o }) => [desc(o.created_at)])
        .select(),
    { pageSize: 50 },
  );

  return (
    <>
      {data.map(order => <OrderRow key={order.id} order={order} />)}
      {hasNextPage && <button onClick={() => fetchNextPage()}>Load more</button>}
    </>
  );
}
```

### Predicate pushdown

Predicates in `where()` are pushed down to Supabase automatically. Supported operators:

| TanStack DB | PostgREST | Notes |
|---|---|---|
| `eq` | `.eq()` | |
| `gt` / `gte` / `lt` / `lte` | `.gt()` etc. | |
| `in` | `.in()` | Batched at 100 IDs per request |
| `like` / `ilike` | `.like()` / `.ilike()` | |
| `isNull` | `.is(col, null)` | |
| `not(eq(...))` | `.neq()` | |
| `or(...)` | `.or()` | Flattened to PostgREST `or` string |

JSONB path filtering is also supported:

```ts
// Filters on metadata->>'city'
eq(o.metadata.city, 'London')
```

### Large `in` filters

When an `in` predicate has more than 100 values, the factory automatically
splits it into parallel batched requests and deduplicates the results. No
action needed on your part.

---

## Mutations

Both factory types support the same mutation options. Mutations are optimistic:
TanStack DB applies the change locally before the network call, then reconciles.

### Insert

```ts
import { useTransact } from '@tanstack/react-db';

function CreateOrder() {
  const transact = useTransact();

  const handleCreate = () => {
    transact(({ mutate }) => {
      mutate(ordersCollection).insert({
        id: crypto.randomUUID(),
        status: 'pending',
        // ... other insert fields
      });
    });
  };
}
```

### Update

```ts
transact(({ mutate }) => {
  mutate(ordersCollection).update(
    (o) => o.id === orderId,
    { status: 'shipped' },
  );
});
```

### Delete

```ts
transact(({ mutate }) => {
  mutate(ordersCollection).delete((o) => o.id === orderId);
});
```

---

## Registering collections (recommended pattern)

Create all collections once (after auth resolves) and share via context or module scope:

```ts
// collections.ts
export function createCollections(supabase, queryClient) {
  return {
    roles: createEagerCollection({ table: 'roles', schema: RolesSchema, supabase, queryClient }),
    orders: createOnDemandCollection({ table: 'orders', schema: OrdersSchema, supabase, queryClient,
      insertSchema: OrdersInsertSchema, updateSchema: OrdersUpdateSchema }),
    // ...
  };
}
```

---

## Known TanStack DB quirks

- **`useLiveSuspenseQuery` + `leftJoin` + `findOne()`** causes infinite Suspense. Use base hooks with resolver components instead.
- **`or() + findOne()`** on eager collections returns `null` for existing rows. Split into separate queries.
- Eager collections must have `startSync: false` and be initialized with `stateWhenReady()` before routes render.
