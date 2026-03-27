# @simmer/supabase-tanstack-db-integration

Generic [TanStack DB](https://tanstack.com/db) collection factories backed by [Supabase](https://supabase.com) PostgREST.

Works with **any Supabase project** — not coupled to any generated `Database` type.

---

## What this package provides

| Export | Purpose |
|---|---|
| `createEagerCollection` | Full-table fetch, cached. For lookup tables (<1000 rows). |
| `createOnDemandCollection` | Predicate-pushdown fetch. For large operational tables. |
| `fetchRows` / `insertRows` / `updateRow` / `deleteRows` | Raw CRUD helpers (used internally by the factories). |
| `selectAndParse` | Low-level Supabase query + Zod parse. |
| `parseSubsetOptions` | Parses TanStack DB `where`/`orderBy` expressions into a filter AST. |
| `applyFilterNode` | Applies a parsed filter node to a Supabase query builder. |

---

## Installation

```bash
pnpm add @simmer/supabase-tanstack-db-integration
# peer deps (if not already present):
pnpm add @supabase/supabase-js @tanstack/db @tanstack/query-core @tanstack/query-db-collection zod
```

---

## Quick start

### 1. Generate your Supabase types

```bash
supabase gen types typescript --local > src/database.types.ts
```

### 2. Create your Supabase client

```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);
```

### 3. Generate Zod schemas from your Drizzle tables

This package does **not** generate schemas — bring your own. The recommended
approach is [drizzle-zod](https://orm.drizzle.team/docs/zod):

```ts
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { roles } from './tables/roles';

export const RolesBaseRowSchema = createSelectSchema(roles);
export const RolesInsertSchema = createInsertSchema(roles);
```

### 4. Create collections

```ts
import { createEagerCollection, createOnDemandCollection } from '@simmer/supabase-tanstack-db-integration';
import { queryClient } from './query-client';
import { supabase } from './supabase';
import { RolesBaseRowSchema, RolesInsertSchema } from './schemas/roles';
import { OrdersBaseRowSchema, OrdersInsertSchema, OrdersUpdateSchema } from './schemas/orders';

// Eager — fetches all rows once, re-fetches on stale
export const rolesCollection = createEagerCollection({
  table: 'roles',
  schema: RolesBaseRowSchema,
  queryClient,
  supabase,
});

// On-demand — fetches filtered subsets, pushes predicates to Supabase
export const ordersCollection = createOnDemandCollection({
  table: 'orders',
  schema: OrdersBaseRowSchema,
  queryClient,
  supabase,
  insertSchema: OrdersInsertSchema,
  updateSchema: OrdersUpdateSchema,
  allowDelete: true,
});
```

See [docs/COLLECTIONS.md](docs/COLLECTIONS.md) for full API reference and patterns.

---

## Using collections in React

```tsx
import { useLiveQuery, useLiveInfiniteQuery } from '@tanstack/react-db';

// Eager collection — subscribe to all roles
function RoleList() {
  const { data: roles } = useLiveQuery((q) =>
    q.from({ roles: rolesCollection }).select()
  );
  return <ul>{roles.map(r => <li key={r.id}>{r.name}</li>)}</ul>;
}

// On-demand collection — filtered + paginated
function OrderList({ status }: { status: string }) {
  const { data: orders, fetchNextPage } = useLiveInfiniteQuery(
    (q) =>
      q.from({ orders: ordersCollection })
        .where(({ orders: o }) => eq(o.status, status))
        .orderBy(({ orders: o }) => [desc(o.created_at)])
        .select(),
    { pageSize: 50 },
  );
  // ...
}
```

---

## Mutations

Mutations are handled automatically by TanStack DB's optimistic update system.
Pass `insertSchema` / `updateSchema` / `allowDelete` to the factory to enable them.

```ts
import { useMutation } from '@tanstack/react-db';

function CreateOrder() {
  const { mutate } = useMutation({
    mutationFn: async (draft) => {
      await ordersCollection.insert(draft);
    },
  });
}
```

See [docs/COLLECTIONS.md](docs/COLLECTIONS.md) for the full mutations pattern.

---

## Docs

- [Collections (eager + on-demand)](docs/COLLECTIONS.md)
- [CRUD utilities](docs/CRUD.md)

---

## Adapting for your project

This package is intentionally **schema-agnostic**:

- `table` is typed as `string` — no coupling to your `Database` type.
- You can restore narrow typing in your own wrapper by constraining `table` to
  `keyof YourDatabase['public']['Tables']`.
- `SupabaseClient<YourDatabase>` is accepted anywhere `SupabaseClient<any>` is
  expected, so you keep full PostgREST type-safety on the client instance.

---

## Fixing bugs / contributing

This package lives in the monorepo at `packages/supabase-tanstack-db-integration`.
Edit files directly — workspace symlinks mean changes are reflected immediately
in consuming packages without rebuilding.
