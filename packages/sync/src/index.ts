/**
 * @mcmec/sync
 *
 * The client half of the sync boundary: what an app reads, and how it writes.
 *   - reads  via ElectricSQL shape proxy (`/api/shapes/:table`)
 *   - writes via the generic data API (`/api/data/:table`), permission-gated + audited
 *
 * The per-app collection sets live behind their own subpaths (`@mcmec/sync/collections/*`) so
 * an app pulls only the collections it reads; the URLs both halves agree on live in
 * `@mcmec/sync/routes`, which imports nothing so the API can take the paths without the
 * TanStack stack behind them.
 *
 * Main exports:
 *   createEagerCollection    — full-shape stream, deferred start. Best for lookups.
 *   createOnDemandCollection — incremental snapshots on query. Best for large tables.
 *   createElectricCollection — shared builder (syncMode + startSync are explicit).
 *   apiInsertRows / apiUpdateRow / apiDeleteRows — the write helpers the factories use.
 *   toCamelCaseKeys / snakeToCamel — snake_case (Electric) -> camelCase (API) mapping.
 *   fetchShapeSnapshot — one-shot shape read for SSR (no live stream left open).
 */

export {
	apiDeleteRows,
	apiInsertRows,
	apiUpdateRow,
	snakeToCamel,
	toCamelCaseKeys,
	type WriteTarget,
} from "./crud";
export {
	createEagerCollection,
	createElectricCollection,
	createOnDemandCollection,
	type EagerCollectionOptions,
	type ElectricCollectionOptions,
	electricParser,
	type OnDemandCollectionOptions,
} from "./factories";
export {
	COMMAND_PATH,
	dataPathFor,
	shapePathFor,
} from "./routes";
export {
	type FetchShapeSnapshotOptions,
	fetchShapeSnapshot,
} from "./snapshot";
