/**
 * @mcmec/collections
 *
 * TanStack DB collection factories backed by the Railway API:
 *   - reads  via ElectricSQL shape proxy (`/api/shapes/:table`)
 *   - writes via the generic data API (`/api/data/:table`), permission-gated + audited
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
	createEagerCollection,
	createElectricCollection,
	createOnDemandCollection,
	type EagerCollectionOptions,
	type ElectricCollectionOptions,
	electricParser,
	type OnDemandCollectionOptions,
} from "./collections";
export {
	apiDeleteRows,
	apiInsertRows,
	apiUpdateRow,
	snakeToCamel,
	toCamelCaseKeys,
	type WriteTarget,
} from "./crud";
export {
	type FetchShapeSnapshotOptions,
	fetchShapeSnapshot,
} from "./snapshot";
