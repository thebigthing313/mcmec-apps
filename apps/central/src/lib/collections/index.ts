/**
 * Central's session collections — see ./registry for how routes ask for them, and for the rule
 * every loader keeps: **a loader preloads only what its route's components subscribe to.**
 *
 * Every table is behind its own `await import()`, so this module (which the entry chunk imports,
 * to put the registry in the router's context) pulls in no table and no TanStack DB code. A table
 * is downloaded and built the first time a route asks for it, and never twice in one session.
 *
 * Adding a table is one line here plus a module under ./tables that exports `create(apiUrl)`.
 */
import {
	type CollectionRegistry,
	type CollectionsOf,
	createCollectionRegistry,
} from "./registry";

function centralTables(apiUrl: string) {
	return {
		employees: async () => (await import("./tables/employees")).create(apiUrl),
		meetings: async () => (await import("./tables/meetings")).create(apiUrl),
		noticeTypes: async () =>
			(await import("./tables/notice-types")).create(apiUrl),
		notices: async () => (await import("./tables/notices")).create(apiUrl),
	};
}

type CentralTables = ReturnType<typeof centralTables>;

export type CentralCollections = CollectionRegistry<CentralTables>;

/**
 * One table's collection, by the name routes ask for it by. For a component handed a collection
 * as a prop by the route that received it; a type only, so it imports no table.
 */
export type CentralCollection<K extends keyof CentralTables> =
	CollectionsOf<CentralTables>[K];

/** One per session: `main.tsx` puts it in the router's context as `collections`. */
export function createCentralCollections(apiUrl: string): CentralCollections {
	return createCollectionRegistry(centralTables(apiUrl));
}
