/**
 * @mcmec/sync
 *
 * The client half of the sync boundary: what an app reads, and how it writes.
 *   - reads  via ElectricSQL shape proxy (`/api/shapes/:table`)
 *   - writes via named commands (`POST /api/commands`), permission-gated + audited
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
 *   sendCommand — post one envelope for a command no collection owns.
 *   fetchShapeSnapshot — one-shot shape read for SSR (no live stream left open).
 */

export {
	type CommandEnvelope,
	type CommandMetadata,
	CommandRefusedError,
	findCommandRefusal,
	readCommandMetadata,
	sendCommand,
} from "./command-write";
export {
	createEagerCollection,
	createElectricCollection,
	createOnDemandCollection,
	type EagerCollectionOptions,
	type ElectricCollectionOptions,
	electricParser,
	type OnDemandCollectionOptions,
} from "./factories";
export { COMMAND_PATH, shapePathFor } from "./routes";
export {
	type FetchShapeSnapshotOptions,
	fetchShapeSnapshot,
} from "./snapshot";
