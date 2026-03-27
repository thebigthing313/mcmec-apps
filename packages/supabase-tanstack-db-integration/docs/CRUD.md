# CRUD Utilities

Low-level helpers used internally by the collection factories.
You can also use them directly if you need custom query logic outside a collection.

---

## `fetchRows`

Fetches all rows from a table, selecting only the fields defined in the schema.

```ts
import { fetchRows } from '@simmer/supabase-tanstack-db-integration';

const { data, error } = await fetchRows('roles', RolesBaseRowSchema, supabase);
```

**Signature:**
```ts
fetchRows<TSchema>(
  table: string,
  schema: ZodObject,
  supabase: SupabaseClient,
  signal?: AbortSignal,
): Promise<{ data: z.infer<TSchema>[] | null; error: Error | null }>
```

- Selects only the fields present in `schema.shape` (comma-joined column list).
- Validates the response against `z.array(schema)`.
- Returns `{ data: null, error }` on failure — never throws.

---

## `insertRows`

Inserts one or more rows, validates with `insertSchema`, returns the inserted rows.

```ts
const { data, count, error } = await insertRows(
  'orders',
  OrdersBaseRowSchema,
  OrdersInsertSchema,
  supabase,
  [{ id: crypto.randomUUID(), status: 'pending', customer_id: '...' }],
);
```

**Signature:**
```ts
insertRows<TRowSchema, TInsertSchema>(
  table: string,
  rowSchema: ZodObject,       // shape of returned rows
  insertSchema: ZodObject,    // shape of insert payload
  supabase: SupabaseClient,
  rows: z.infer<TInsertSchema>[],
  signal?: AbortSignal,
): Promise<{ data: Row[] | null; count: number; error: Error | null }>
```

- Hard cap of 500 rows per call.
- Validates `rows` against `insertSchema` before sending.

---

## `updateRow`

Updates rows matching a filter predicate.

```ts
const { data, error } = await updateRow(
  'orders',
  OrdersBaseRowSchema,
  OrdersUpdateSchema,
  supabase,
  { status: 'shipped' },
  (q) => q.eq('id', orderId),
);
```

**Signature:**
```ts
updateRow<TRowSchema, TUpdateSchema>(
  table: string,
  rowSchema: ZodObject,
  updateSchema: ZodObject,
  supabase: SupabaseClient,
  row: z.infer<TUpdateSchema>,
  filter: (query: any) => any,   // PostgREST filter chain
  signal?: AbortSignal,
): Promise<{ data: Row[] | null; count: number; error: Error | null }>
```

- The `filter` callback receives the raw Supabase query builder and must return it after applying `.eq()` / `.in()` etc.
- Validates payload against `updateSchema` before sending.
- Returns an error (does not throw) if `row` is empty.

---

## `deleteRows`

Deletes rows matching a filter predicate.

```ts
const { success, count, error } = await deleteRows(
  'orders',
  supabase,
  (q) => q.in('id', ['id-1', 'id-2']),
);
```

**Signature:**
```ts
deleteRows(
  table: string,
  supabase: SupabaseClient,
  filter: (query: any) => any,
  signal?: AbortSignal,
): Promise<
  | { success: true;  error: null;  count: number }
  | { success: false; error: Error; count: 0 }
>
```

---

## `selectAndParse`

Lower-level helper: runs `.select(fields)` on an existing query builder and
parses the result with a Zod schema.

```ts
import { selectAndParse } from '@simmer/supabase-tanstack-db-integration';

const query = supabase.from('roles').eq('name', 'admin');
const { data, error } = await selectAndParse(query, RolesBaseRowSchema);
```

Useful when you need to build a custom filter chain before handing off to Zod.

---

## `TableRegistryEntry`

Type helper for building a collection registry map.

```ts
import type { TableRegistryEntry } from '@simmer/supabase-tanstack-db-integration';

const REGISTRY: Record<string, TableRegistryEntry> = {
  orders: {
    table: 'orders',
    baseRowSchema: OrdersBaseRowSchema,
    insertSchema: OrdersInsertSchema,
    updateSchema: OrdersUpdateSchema,
    allowDelete: true,
  },
};
```

```ts
interface TableRegistryEntry<TBaseRow, TInsert, TUpdate> {
  table: string;
  baseRowSchema: TBaseRow;
  insertSchema?: TInsert;
  updateSchema?: TUpdate;
  allowDelete?: boolean;
}
```
