> **Research note.** Captured 2026-09-28 on branch `research/section-scoped-collections` for
> [#234](https://github.com/thebigthing313/mcmec-apps/issues/234), part of the one-staff-SPA map
> ([#233](https://github.com/thebigthing313/mcmec-apps/issues/233)). It is a snapshot against the
> versions below. Check `pnpm-lock.yaml` before relying on a version-specific claim.

# Section-scoped collections: deferring and stopping Electric sync per SPA section

The question: can a TanStack DB collection backed by Electric be created or started only when a
section of the staff SPA is entered, stop syncing and be garbage-collected once the section is
left, and reach the section's routes through TanStack Router context with its types intact?

**Short answer.** Yes, and most of the machinery already exists and is already switched on in our
factories. In TanStack DB, sync lifetime follows **subscribers**, not object lifetime. A
collection with `startSync: false` (which is what `createEagerCollection` passes) opens no shape
stream when it is constructed. It starts syncing on the first subscriber or `preload()`, and
`gcTime` after its last subscriber leaves it aborts the Electric long-poll and drops its rows.
Two things are missing. First, **code** deferral: `getDb()` imports every schema and builds every
collection when the module loads. Second, there is **no GC path for a collection that was
preloaded but never subscribed**. Put collections in a keyed, lazily populated registry (one
instance per table per session), load each section's slice with a dynamic `import()` inside that
section's layout `beforeLoad`, and return it from there. Child routes then see it in `context`,
fully typed.

## Versions checked

| Package | Installed | Where read |
| --- | --- | --- |
| `@tanstack/db` | **0.8.3** | `node_modules/@tanstack/db/package.json`; lock `'@tanstack/db@0.8.3'` |
| `@tanstack/electric-db-collection` | **0.4.3** | `packages/sync/node_modules/@tanstack/electric-db-collection` |
| `@tanstack/react-db` | **0.3.3** | `apps/central/node_modules/@tanstack/react-db` |
| `@tanstack/react-router` / `router-core` | **1.157.18** | `node_modules/.pnpm/@tanstack+router-core@1.157.18` |
| `@tanstack/router-plugin` | 1.145.7 | `node_modules/.pnpm/@tanstack+router-plugin@1.1_…` |

The `dist/esm/*.js` builds are the authority below. One caution: the bundled skill
`node_modules/@tanstack/db/skills/db-core/collection-setup/SKILL.md` declares
`library_version: '0.6.17'`, two minors behind the installed code, so every skill claim used
here was re-checked against the 0.8.3 source.

---

## 1. How our factories behave today

`packages/sync/src/factories/create-eager-collection.ts` calls
`createElectricCollection(options, "eager", false)`, so the third argument, **`startSync`, is
`false`**. `create-on-demand-collection.ts` passes `true`, but no collection set uses the
on-demand factory: `collections/{central,notices,admin,hr}.ts` call only `createEagerCollection`.

The effect at 0.8.3:

- `collection/index.js:115`: the constructor calls `this._sync.startSync()` **only if
  `config.startSync === true`**. Our eager collections are constructed in status `idle` with no
  shape request.
- `collection/changes.js:164` (`addSubscriber`): the first subscriber cancels any GC timer and,
  if status is `idle` or `cleaned-up`, calls `sync.startSync()`.
- `collection/sync.js` (`preload`): `preload()` also calls `startSync()` from `idle` or
  `cleaned-up`, then resolves on `onFirstReady`.
- `collection/lifecycle.js:59` (`validateCollectionUsable`): a mutation on a `cleaned-up`
  collection restarts sync too.

**So an eager collection starts syncing on first subscribe or `preload()`, not at
construction.** Each app's `src/lib/db.ts` builds the whole set eagerly
(`const db = getDb(); export const {...} = db`) and hands it to `createRouter({ context: { db } })`.
The cost of that is **bundle and memory**: every row schema gets imported and every
`Collection` object gets allocated. No network cost comes with it. The network is already
per-route, because loaders call `.preload()`, as in
`apps/central/src/routes/(app)/notices/route.tsx:7` and
`apps/website-management/src/routes/(app)/index.tsx:83-88`.

The on-demand factory's `startSync: true` would open a `log=changes_only, offset=now` stream at
construction (`electric-db-collection/dist/esm/electric.js:749-752`). No one hits that today.
Keep it in mind before a section registry ever builds on-demand collections at module load.

## 2. What stops sync, and what "garbage-collected" means here

From `@tanstack/db` 0.8.3:

- **`gcTime`** (`types.d.ts:419-423`) is the time in ms after which the collection "will be
  garbage collected when it has no active subscribers. Defaults to 5 minutes (300000ms)."
  `lifecycle.js:110` reads `this.config.gcTime ?? 3e5`. A value of `<= 0` or non-finite
  **disables** GC (`lifecycle.js:111`).
- **The timer starts in exactly one place**: `changes.js:179-183` (`removeSubscriber`) calls
  `lifecycle.startGCTimer()` when the count drops to 0. Nothing else calls it (grep of
  `dist/esm`).
- When the timer fires (via the shared `CleanupQueue`, `collection/cleanup-queue.js`), it
  re-checks `activeSubscribersCount === 0`. It then runs `performCleanup` in an idle callback
  (`lifecycle.js:114-181`): `sync.cleanup()`, `state.cleanup()`, `changes.cleanup()`,
  `indexes.cleanup()`, and sets status `cleaned-up`.
- `sync.cleanup()` calls the adapter's cleanup (`sync.js:485`). For Electric this is
  `unsubscribeStream(); abortController.abort();` (`electric.js:1033-1035`), which **aborts
  the long-poll**. The HTTP/2 stream is released and the rows are gone.
- `collection.cleanup()` (`index.js:509`) does the same immediately, without waiting for
  `gcTime`.
- The status machine allows `cleaned-up → loading` (`lifecycle.js:36`). A cleaned-up
  collection **is reusable**: the next subscriber or `preload()` re-syncs it from scratch (no
  `offset` is carried over unless persistence is configured).

In TanStack DB, "garbage-collected" therefore means **stop syncing and free the rows**. The
JS `Collection` object stays alive for as long as something references it. Once sync has
stopped it costs very little, so dropping the object itself buys almost nothing.

**Live queries drive this chain automatically.** `useLiveQuery` builds its live-query collection
with `gcTime: 1` (`react-db/dist/esm/useLiveQuery.js:6,124-131`). On unmount that collection is
cleaned up at once, which unsubscribes from its source collections
(`db/dist/esm/query/live/collection-subscriber.js:76`, `collection/subscription.js:458`). The
source's count hits 0 and its `gcTime` clock starts. **Leaving a section already stops its
shapes after `gcTime` (5 min by default) in the current apps.**

### The gap: preloaded-but-never-subscribed collections never GC

`preload()` does not add a subscriber, and the GC timer only starts on a subscriber count
*falling* to 0. Suppose a loader preloads a collection and no component ever subscribes to it.
This happens when navigation is redirected or cancelled after the loader, when a hover-preload
never becomes a navigation, or when a loader preloads more than the page queries. That
collection **syncs forever**.

The `startSync` doc comment (`types.d.ts:424-431`) says collections "will pause syncing when
there are no active subscribers", but the code only delivers that *after* at least one
subscriber has come and gone. Mitigation: call `collection.cleanup()` for the section's
collections in the section layout's `onLeave` (see §4), or accept the leak for the lifetime of
the tab.

## 3. Where to build the collections: module singleton vs loader vs registry

The skill `node_modules/@tanstack/db/skills/meta-framework/SKILL.md` ("Stable collection
ownership" and the matching Common Mistake) states the rule:

> Collections are stable within a `QueryClient` and business scope; they are not universal
> singletons. Creating several instances in one scope causes duplicate syncs and split state.
> … Memoize it and put it in router/request context rather than using a process-global
> collection. Remove unused entries and call `collection.cleanup()` in long-lived scope maps.

For us the "business scope" is the **signed-in session**, not the section. Two consequences:

1. **Do not construct a fresh collection per section entry.** For example, `hr` and `central`
   both read `employees`. If each section's `beforeLoad` built its own, the app would open
   **two shape streams for one table**, and an optimistic write made through one would not
   appear in the other until Electric echoed it back. Constructing a new set on every navigation
   is worse still. `beforeLoad` runs on every navigation. The route `context` option runs only
   when a match is first created (`router-core/dist/esm/router.js:1265-1283`), but that
   includes hover preloads (`preload: !!match.preload`).
2. **Do memoize per table in a session-scoped registry**, populated lazily. A section asks for
   the tables it needs, and the registry returns the existing instance or creates one. Since
   sync already follows subscribers (§2), a shared, never-evicted registry already gives you
   "sync only while a section is using it" with no teardown code. Use explicit `cleanup()` for
   the preload gap above and for **sign-out / user switch**, where every collection must be
   cleaned up because the shapes are narrowed server-side by that session's permissions (or
   the tab is reloaded).

Our collection `id` is the table name (`electric-collection.ts:204`, `id: table`). Plain
`createCollection` does not enforce unique ids. The per-table registry is what keeps one
instance per id.

### `DbClient`: the library's own scoped registry (0.8.x, SSR-oriented)

`@tanstack/db` 0.8.3 ships a `DbClient` (`dist/esm/client.d.ts`) and `@tanstack/react-db`
0.3.3 a `DbProvider`/`useDbClient`. You declare module-scope **descriptors** with
`collectionOptions(...)`. `electricCollectionOptions` already returns one through
`withCollectionConfigFactory` (`electric.js:485`). `client.collection(descriptor)`
materializes it once per client (`client.js:145-175`: a `WeakMap` by descriptor, and it
**throws on a duplicate id**). `client.cleanup()` cleans up every collection it holds
(`client.js:326`). That is the pattern above, done by the library: descriptors live in each
section's code chunk, and one client per session is disposed on sign-out.

Its API surface (dehydrate/hydrate, SSR streaming) is aimed at SSR. It has no per-collection
eviction. It is new in this minor, and the bundled skills do not document it yet. Treat it as
an option to prototype, not a settled recommendation. A 20-line `Map<TableName, Collection>`
of our own does the same job for an SPA.

## 4. Deferring the code and passing collections through Router context with types

### Code deferral

The apps use `autoCodeSplitting: true` (`apps/*/vite.config.ts:10`). The plugin's default
groupings are `[["component"], ["errorComponent"], ["notFoundComponent"]]`
(`router-plugin/dist/esm/core/constants.js`). `loader` *can* be split, but is not by default.
**`beforeLoad` and `context` are never split** (they are not in `splitRouteIdentNodes`). A
static `import { createHrCollections } from "@mcmec/sync/collections/hr"` at the top of a route
file therefore lands in the main route chunk. To make a section's schemas and collection
factories load only when the section is entered, **dynamic-import them inside the section's
layout `beforeLoad`**:

```ts
// routes/(staff)/hr/route.tsx: the HR section layout
export const Route = createFileRoute("/(staff)/hr")({
	beforeLoad: async ({ context }) => {
		requireRole(context.session, "manage_hr"); // App Role gate (#233)
		const { hrCollections } = await import("@/src/sections/hr/collections");
		const hr = hrCollections(context.registry); // memoized per table, see §3
		return { hr };
	},
	loader: ({ context }) => context.hr.employees.preload(),
	onLeave: ({ context }) => {
		// Optional: close the preload gap (§2). Only safe for tables no other
		// mounted section is subscribed to. cleanup() ignores subscribers.
	},
});
```

### Types

`router-core` 1.157.18 `route.d.ts:135-142`: a route's context is
`Assign<parent context, ContextReturnType<context fn>, ContextAsyncReturnType<beforeLoad>>`.
**`beforeLoad`'s awaited return type is merged into the context of that route and every
descendant**, and `loader`, `beforeLoad`, `onEnter`/`onStay`/`onLeave` and
`Route.useRouteContext()` all receive it typed. The dynamic import keeps its types, because
`await import(...)` is typed as `typeof import(...)`. So `context.hr.employees` in a child
route is a
`Collection<InferSchemaOutput<typeof EmployeesRowSchema>, …, ElectricCollectionUtils<…>>`
with no casts or `Register` augmentation beyond what `createRootRouteWithContext` already does.

Two constraints on what `beforeLoad` may return:

- `ValidateSerializableLifecycleResult` (`router-core/dist/esm/ssr/serializer/transformer.d.ts:83`)
  resolves to `any` when SSR serialization isn't registered, which is the case in our SPAs. A
  `Collection` instance is an allowed return. This would change under TanStack Start SSR, but
  the staff SPA is client-only.
- **Use `beforeLoad` context, not `loader` data, to hand collections down.** Loader data is not
  inherited by child routes' `context`. Only `beforeLoad`/`context` results are.

**Lifecycle hooks.** `onEnter`/`onStay`/`onLeave` fire after a navigation commits
(`router.js:776-786`). Matches are compared by match id, so a param-less section layout gets
`onLeave` exactly once, when the user leaves the section, and not when moving between its child
pages. An exiting match is kept in `cachedMatches` (`router.js:766-771`) until the router's
`gcTime`, which holds a reference to its context. As §2 explains, that does not keep a shape
open.

## Recommendation for #233

1. Replace the per-app `getDb()` with a **session-scoped, lazily populated per-table registry**
   (or a prototyped `DbClient`). Put it in root router context, constructed empty.
2. Split `@mcmec/sync/collections/*` into **per-section modules** that ask the registry for
   their tables. Load each with `await import()` in the section layout's `beforeLoad` after the
   App Role check, and return the slice so it is typed for every child route.
3. Keep `startSync: false` for everything the registry builds, and keep loaders calling
   `.preload()` so data is ready on render. Leave `gcTime` at the default, or set it per table
   for heavy shapes. Leaving a section then closes its shapes `gcTime` after the last
   `useLiveQuery` unmounts.
4. Close the preload gap: either keep loaders from preloading what the page doesn't subscribe
   to, or clean up in the section layout's `onLeave` any collection whose `subscriberCount` is 0.
   Check `collection.subscriberCount` (`index.js:128`) first, because `cleanup()` does not.
5. On sign-out, `cleanup()` every registry entry (or reload), since shapes are narrowed per
   session.

## Sources

- `@tanstack/db` 0.8.3: `dist/esm/collection/{index,lifecycle,changes,sync,cleanup-queue}.js`,
  `dist/esm/types.d.ts`, `dist/esm/client.{js,d.ts}`,
  `dist/esm/query/live/{collection-config-builder,collection-subscriber}.js`;
  `skills/meta-framework/SKILL.md`, `skills/db-core/collection-setup/SKILL.md`
- `@tanstack/electric-db-collection` 0.4.3: `dist/esm/electric.js`
- `@tanstack/react-db` 0.3.3: `dist/esm/{useLiveQuery,DbProvider}.js`
- `@tanstack/router-core` 1.157.18: `dist/esm/router.js`, `dist/esm/route.d.ts`,
  `dist/esm/ssr/serializer/transformer.d.ts`; `@tanstack/router-plugin` 1.145.7
  `dist/esm/core/constants.js`
- This repo: `packages/sync/src/factories/*`, `packages/sync/src/collections/*`,
  `apps/*/src/lib/db.ts`, `apps/*/src/main.tsx`, `apps/*/vite.config.ts`, route loaders cited
  above
