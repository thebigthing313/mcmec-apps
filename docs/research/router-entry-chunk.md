# What TanStack Router ships up front in a single route tree

Research for [#235](https://github.com/thebigthing313/mcmec-apps/issues/235), part of the
"one staff SPA" map ([#233](https://github.com/thebigthing313/mcmec-apps/issues/233)): `apps/central`
grows to hold website-management, admin and hr as sections, and a user should not download
every section to open one.

Captured 2026-09-28 on branch `research/router-entry-chunk` (from `develop` @ `3591848`).

## Versions checked

| Package | Installed |
| --- | --- |
| `@tanstack/router-plugin` | 1.157.18 |
| `@tanstack/react-router` | 1.157.18 |
| `@tanstack/router-generator` | 1.157.18 (1.145.7 is also in the store, pulled in by something else) |
| `vite` | 7 (per repo) |

Every app's `vite.config.ts` has `tanstackRouter({ autoCodeSplitting: true, target: "react" })`
and no `codeSplittingOptions`, so the defaults below are what we ship.

## Answer

**With `autoCodeSplitting`, only the route *component* slots leave the entry chunk. Every
route file's remaining options, plus everything those options import, stay in the entry
chunk.** For a merged staff SPA, a section's weight is fine as long as the heavy parts sit
behind components. Anything a section's `beforeLoad`, `loader`, `validateSearch` or
`context` touches, and any module those import at top level, ships to every user.

### What is split, and what is not (source)

`node_modules/@tanstack/router-plugin/dist/esm/core/constants.js`:

```js
const splitRouteIdentNodes = ["loader", "component", "pendingComponent", "errorComponent", "notFoundComponent"];
const defaultCodeSplitGroupings = [["component"], ["errorComponent"], ["notFoundComponent"]];
```

- **Split by default:** `component`, `errorComponent`, `notFoundComponent`. Each becomes a
  virtual module (`route.tsx?tsr-split=component`) loaded through `lazyRouteComponent`.
- **Splittable but off by default:** `loader`, via `lazyFn`, and `pendingComponent`.
- **Never splittable:** everything else in the options object: `beforeLoad`,
  `validateSearch`, `context`, `loaderDeps`, `head`, `staticData`, `params`, `search`
  middlewares and so on. They aren't in `splitRouteIdentNodes`, so the compiler leaves them
  in the reference file.
- **The root route is never split.** `compilers.js` lists `createRootRoute` and
  `createRootRouteWithContext` under `unsplittableCreateRouteFns`. For those it only adds
  HMR and stops (`programPath.stop()`). `__root.tsx`'s component and everything it imports
  sit in the entry.
- **The reference file keeps only what the unsplit options still reference.**
  `compileCodeSplitReferenceRoute` swaps split properties for lazy imports, then runs
  `babel-dead-code-elimination`. Imports used only by the component disappear from the
  reference file. Imports used by `loader`/`beforeLoad`/`validateSearch` stay.
- **Exporting a split property defeats the split.** If a component or loader is exported
  from the route file, the compiler records it in `knownExportedIdents` and emits a
  `console.warn`. The docs say doing this "bundles them into the main application".
- **`routeTree.gen.ts` statically imports every route file** (`import { Route as … } from
  './routes/…'`). With `main.tsx` importing the tree, every reference file across every
  section is in the entry. That costs about 300–900 bytes each (pre-minify) in our build.

Precedence of the knobs (`router-code-splitter-plugin.js`,
`fromCode.groupings || pluginSplitBehavior || getGlobalCodeSplitGroupings()`):

1. a per-route `codeSplitGroupings` property in the route file;
2. `codeSplittingOptions.splitBehavior({ routeId })` in the Vite config;
3. `codeSplittingOptions.defaultBehavior`, which defaults to the groupings above.

`codeSplittingOptions` also has `deleteNodes` (strip named options from reference files)
and `addHmr`.

### What the official docs say

From the [code-splitting guide](https://tanstack.com/router/latest/docs/framework/react/guide/code-splitting):

- Critical, always bundled: "Path Parsing/Serialization, Search Param Validation, Loaders,
  Before Load, Route Context, Static Data, Links, Scripts, Styles".
- Non-critical, lazy: "Route Component, Error Component, Pending Component, Not-found
  Component".
- Why loaders stay put: "The loader is already an asynchronous boundary, so you pay double
  to both get the chunk *and* wait for the loader to execute."
- `.lazy.tsx` still works alongside auto-splitting. The generator emits
  `.lazy(() => import(...))` for these files (`router-generator` `generator.js`, around line
  522). It can only move the same non-critical options that auto-splitting already moves,
  so it adds nothing here.
- `getRouteApi(id)` gives typed access to a route from another file without importing the
  route module.

From the [automatic code-splitting guide](https://tanstack.com/router/latest/docs/framework/react/guide/automatic-code-splitting):
it confirms the default groupings and the precedence above, and calls splitting the loader "a
performance trade-off". It also warns against heavy imports in the reference file.

## Empirical check: `apps/website-management`

Built from this branch with the stock config, plus a throwaway `generateBundle` hook that
dumps each chunk's `modules` and their `renderedLength`. Sizes are minified bytes unless
marked pre-minify.

| | Size | gzip |
| --- | --- | --- |
| Entry chunk `index-*.js` | **1,059 kB** | **307 kB** |
| All JS chunks together (90 chunks) | 2,400 kB | – |
| Entry as a share of all JS | 43% | – |
| CSS (single Tailwind file) | 145 kB | – |

The entry has no static imports of other chunks. Its closure is itself, and it has 47
dynamic imports, one per split component.

**What landed in the entry** (top modules by pre-minify rendered length):

| Pre-minify | Module group | Why it's there |
| ---: | --- | --- |
| 561 k | `react-dom` | runtime |
| 499 k | `zod` | `main.tsx` calls `getDb()` eagerly, and `src/lib/db.ts` builds every collection with its `@mcmec/schemas` row schema |
| 311 k | `@tanstack/db` (+ 56 k `db-ivm`) | collections, same reason |
| 123 k + 40 k | `@tanstack/router-core` + `react-router` | runtime |
| 122 k + 46 k | `@electric-sql/client` + `electric-db-collection` | collections |
| 94 k | `tailwind-merge` | `cn()` from shared UI in `main.tsx`/root |
| 64 k | `sonner` | toaster in root |
| 55 k | `@tanstack/query-core` | `QueryClientProvider` in `main.tsx` |
| 49 k + 33 k + … | `@radix-ui/react-select`, `react-menu`, `dialog`, `floating-ui` | see `record-index` below, plus the root's alert/error UI |
| 31 k + 21 k | `better-auth`, `@better-fetch/fetch` | `authClient` in router context, `verifyClaims` in `(app)/route.tsx` `beforeLoad` |
| 15 k | `@mcmec/ui/blocks/record-index.tsx` | **leak**, see below |
| 10 k | `routeTree.gen.ts` | the tree itself |
| ~25 k total | 48 route reference files | `createFileRoute(...)` with loader, `beforeLoad` and `validateSearch` left in |

**What stayed out** (split correctly behind components): recharts on the weekly-activity page
(448 kB chunk), tiptap/prosemirror (327 kB), TanStack Form plus libphonenumber (257 kB),
`useLiveQuery` and the query compiler (99 kB), react-day-picker plus date-fns format (82 kB),
the `(app)` layout's sidebar (26 kB), and every page component (1–5 kB each).

### The leak worth naming: `validateSearch`

Seven `*/index.tsx` routes have `validateSearch: validateRecordIndexSearch`, imported from
`@mcmec/ui/blocks/record-index`. That module also defines the `RecordIndex` component, and
Rollup assigns whole modules to chunks. So the entry gets all of `record-index.tsx` and its
imports: `Select`, `Table`, `DropdownMenu`, `RowActionsMenu`, `Empty`, and through them Radix
select/menu and floating-ui. It is small today. In a merged SPA, the same pattern would drag
each section's list UI into the entry. The fix is to put the search validators in a
component-free module (for example `record-index-search.ts`).

### Splitting loaders: measured, not worth it here

Rebuilding with `codeSplittingOptions.defaultBehavior` set to `[["loader"], ["component"],
["pendingComponent"], ["errorComponent"], ["notFoundComponent"]]` did three things:

- The entry went from 1,059.46 kB to 1,056.59 kB, only 2.9 kB (0.3%) smaller.
- The chunk count went from 90 to 135: 44 new loader chunks.
- Every navigation gets a second serial round-trip, the one the docs warn about.

Our loaders are tiny (`collection.preload()` plus a crumb). Their weight is the
collections module they import, and that module is already in the entry through `main.tsx`.

## What keeps a section's weight out of the entry

In order of leverage for #233:

1. **Don't build every section's collections at startup.** Today `main.tsx` puts
   `db: getDb()` into router context, and `lib/db.ts` builds every collection at import time.
   That pulls every section's schemas and the Electric and DB runtime into the entry. In a
   merged app, build a section's collection set lazily from that section's layout route:
   `loader: async () => { const { getNoticesDb } = await import("@/sections/website/db"); … }`.
   Or do it in `beforeLoad`, which isn't split, so the `import()` inside it is the split
   point. Components then read the collections via `Route.useLoaderData()`/context or
   `getRouteApi`, and never import them statically. The shared runtime (`@tanstack/db`,
   Electric, zod) still lands in a shared chunk. Only the per-section schemas and collection
   definitions become per-section.
2. **Keep reference files thin.** A route file's `beforeLoad`, `loader`, `validateSearch` and
   `context` must import only light, component-free modules (validators, ids, crumbs). Don't
   pull validators from a module that also exports a component.
3. **Keep the root route and `main.tsx` section-agnostic.** They are never split, so any
   section-specific import there is paid by everyone.
4. **Don't export route components or loaders** from route files. The plugin warns, and the
   split is lost.
5. **Leave `defaultBehavior` alone.** Adding `loader` saves almost nothing (measured above).
   Use per-route `codeSplitGroupings` only for a route whose loader genuinely imports
   something heavy that can't be deferred with `import()`.
6. **`.lazy.tsx` files aren't needed.** They move the same things auto-splitting already
   moves.

The ~25 kB of reference files and the ~10 kB tree grow roughly linearly with the route count.
Folding in three more apps' routes adds roughly that much per app. That's acceptable, and no
option removes it short of splitting into separate route trees.

## How to check what a section pulls in

- **Vite manifest** (`vite build --manifest` → `dist/.vite/manifest.json`): shows the chunk
  graph. `index.html` is `isEntry`, and its `dynamicImports` list every
  `…?tsr-split=component` chunk. Each route chunk's `imports` names the shared chunks it
  needs. It doesn't show which modules are inside a chunk.
- **Module membership:** a 10-line Vite plugin whose `generateBundle(_, bundle)` writes each
  chunk's `isEntry`, `imports` and `Object.entries(chunk.modules)` with `renderedLength`.
  That's what produced the tables above, and it needs no dependency. Group by
  `node_modules/.pnpm/<pkg>` and `packages/<pkg>/src` and the "why is X in the entry"
  question answers itself.
- **`rollup-plugin-visualizer`** (not installed; would be a devDependency): add it as the
  last plugin with `template: "treemap"` (or `"raw-data"`/`"list"` for CI diffing). It
  gives the same membership data as a browsable treemap per chunk.
- A CI guard could fail the build if the entry's module list matches a section path, for
  example `/sections/hr/` or `@mcmec/sync/collections/hr`. That turns "keep it out of the
  entry" into a check.
