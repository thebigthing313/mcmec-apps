/**
 * The session's collections: one instance per table, built the first time something asks.
 *
 * Routes ask for tables by name in `beforeLoad` and hand what comes back down through context:
 *
 *   beforeLoad: ({ context }) => context.collections.use("notices", "noticeTypes"),
 *
 * Whatever `beforeLoad` returns is merged into that route's context and every child's, fully
 * typed, so a component reads `Route.useRouteContext()` and a child route's loader reads its own
 * `context` — nothing imports a collection as a module. A layout may ask on behalf of its
 * children. Each table's definition is its own module behind an `await import()`, so a table
 * nobody has asked for costs neither a download nor an allocation.
 *
 * ## One instance per table
 *
 * Two collections of one table would be two shape streams and two sets of optimistic state
 * that disagree about the same row. So a table is built once per session and every route that
 * asks gets that instance, including the on-demand tables. Screens that want fewer columns or
 * rows narrow in their live query (`select`, `where`); they never get a collection of their own.
 *
 * ## Leaving a route needs no bookkeeping
 *
 * Building a collection opens no stream (the eager tables pass `startSync: false`). Sync starts
 * on the first subscriber or `preload()`, and stops `gcTime` after the last subscriber leaves,
 * when TanStack DB runs `cleanup()` itself. What that does NOT cover is a collection that was
 * preloaded and never subscribed: its GC clock never starts, so it syncs until sign-out. Hence
 * the one rule every route must keep:
 *
 *   **A loader preloads only what its route's components subscribe to** (with `useLiveQuery`).
 *
 * A layout whose component is a bare `<Outlet />` asks for its children's tables in
 * `beforeLoad` but leaves the preloading to the children's loaders. Cleaning up in `onLeave`
 * instead was considered and rejected (#239): it races the next route's subscribers, and a
 * table both routes use would fetch all over again.
 *
 * Two ways to break the rule without meaning to:
 *
 * - A loader that preloads and then throws `notFound()` leaves nothing subscribed. Central's two
 *   record routes do this for a missing or unpublished id; the table then syncs until the next
 *   screen that reads it comes and goes, or sign-out. It is one table, not a growing set, and it
 *   is the table the User was about to read anyway.
 * - Router preloading (`defaultPreload: "intent"`, or `preload` on a `<Link>`) runs loaders on
 *   hover with no component to subscribe. Central leaves it off; turning it on means revisiting
 *   this rule first.
 *
 * ## Sign-out
 *
 * `endSession()` runs `cleanup()` on every collection built so far — including one whose
 * import was still in flight — and throws the whole set away, so nothing one User loaded can
 * reach the next User on a shared workstation. The registry object itself survives (it lives
 * in the router's context); only its contents are discarded.
 *
 * The router may still hold the old instances in cached match contexts. That is harmless
 * because `beforeLoad` runs on every navigation, so the next User's routes ask again and get
 * fresh ones; nothing may keep a collection from context beyond the route that received it.
 */

/** What the registry needs from a collection: a way to stop it. */
export type Cleanable = { cleanup(): Promise<void> };

/** How to build each table's collection, keyed by the name routes ask for it by. */
export type TableDefinitions = Record<string, () => Promise<Cleanable>>;

/** The collection each definition builds. */
export type CollectionsOf<TTables extends TableDefinitions> = {
	[K in keyof TTables]: Awaited<ReturnType<TTables[K]>>;
};

export interface CollectionRegistry<TTables extends TableDefinitions> {
	/**
	 * Resolves the named tables' collections, building any this session has not built yet.
	 * Asking again, or asking concurrently, resolves the same instance.
	 */
	use<const K extends keyof TTables & string>(
		...names: K[]
	): Promise<Pick<CollectionsOf<TTables>, K>>;

	/** Sign-out: cleans up every collection and starts the next session with none. */
	endSession(): Promise<void>;
}

export function createCollectionRegistry<TTables extends TableDefinitions>(
	tables: TTables,
): CollectionRegistry<TTables> {
	// The promise is cached, not the collection, so two callers racing on one table's import
	// share its one build.
	let built = new Map<string, Promise<Cleanable>>();

	const get = (name: keyof TTables & string) => {
		let collection = built.get(name);
		if (!collection) {
			const define = tables[name];
			if (!define) throw new Error(`no collection is defined for "${name}"`);
			const session = built;
			collection = define();
			session.set(name, collection);
			// A failed build (a chunk that did not download) is forgotten, so the next ask tries
			// again rather than failing for the rest of the session.
			collection.catch(() => {
				if (session.get(name) === collection) session.delete(name);
			});
		}
		return collection;
	};

	return {
		async endSession() {
			const ending = [...built.values()];
			built = new Map();
			const settled = await Promise.allSettled(ending);
			await Promise.all(
				settled.map((result) =>
					result.status === "fulfilled" ? result.value.cleanup() : undefined,
				),
			);
		},

		async use(...names) {
			const entries = await Promise.all(
				names.map(async (name) => [name, await get(name)] as const),
			);
			return Object.fromEntries(entries) as Pick<
				CollectionsOf<TTables>,
				(typeof names)[number]
			>;
		},
	};
}
