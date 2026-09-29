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
		documents: async () => (await import("./tables/documents")).create(apiUrl),
		documentTypes: async () =>
			(await import("./tables/document-types")).create(apiUrl),
		employees: async () => (await import("./tables/employees")).create(apiUrl),
		insecticides: async () =>
			(await import("./tables/insecticides")).create(apiUrl),
		jobPostings: async () =>
			(await import("./tables/job-postings")).create(apiUrl),
		meetings: async () => (await import("./tables/meetings")).create(apiUrl),
		// On demand: see ./tables/mosquito-activity-data and `createOnDemandCollection`.
		mosquitoActivityData: async () =>
			(await import("./tables/mosquito-activity-data")).create(apiUrl),
		municipalities: async () =>
			(await import("./tables/municipalities")).create(apiUrl),
		noticeTypes: async () =>
			(await import("./tables/notice-types")).create(apiUrl),
		notices: async () => (await import("./tables/notices")).create(apiUrl),
		// On demand: see ./tables/public-requests and `createOnDemandCollection`.
		publicRequests: async () =>
			(await import("./tables/public-requests")).create(apiUrl),
		sprayScheduleMunicipalities: async () =>
			(await import("./tables/spray-schedule-municipalities")).create(apiUrl),
		spraySchedules: async () =>
			(await import("./tables/spray-schedules")).create(apiUrl),
		zipCodes: async () => (await import("./tables/zip-codes")).create(apiUrl),
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
