/**
 * Electric collection builder for central's tables.
 *
 * Moved here from the shared sync package's factories (#243), a package since removed (#251).
 * Nothing here imports a table: each table module under
 * `./tables/` calls `createEagerCollection` itself, and the registry imports that module the
 * first time a route asks for the table.
 *
 * Reads: `electricCollectionOptions` streams the server-narrowed shape from the API proxy
 * (`/api/shapes/:table`). The proxy sets `table`/`where`/`columns` server-side (authorization);
 * the client only carries sync-cursor params + the session cookie.
 *
 * Writes: `onInsert/onUpdate/onDelete` post one command envelope each (see ./command-write), then
 * hold the optimistic state until that write's Postgres `txid` streams back through Electric —
 * see `settleTxids` for why we do that wait ourselves rather than handing it to the collection.
 *
 * A collection that names no command has no write handlers at all: a read-only collection is
 * spelled by the absence of `commands`, and the `WriteMode` type makes the spelling compulsory.
 */
import type { CommandedTable } from "@mcmec/domain";
import type { TableName } from "@mcmec/schemas/tables";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import {
	type Collection,
	createCollection,
	type InferSchemaInput,
	type InferSchemaOutput,
} from "@tanstack/db";
import {
	type ElectricCollectionUtils,
	electricCollectionOptions,
} from "@tanstack/electric-db-collection";
import type z from "zod";
import type { ZodObject } from "zod";
import {
	type CommandEnvelope,
	readCommandMetadata,
	sendCommand,
} from "./command-write";

/**
 * The shape proxy's path for a table.
 *
 * A copy, on purpose (#239): its twin is `shapePathFor` in `apps/public/src/lib/electric-shape.ts`,
 * and `apps/api` serves the path at `/api/shapes/:table`. Six lines are cheaper to keep twice
 * than a package is to keep once, and drift is loud — a 404 on every shape request.
 * `./shape-twins.test.ts` pins both copies to the same answers; that is the only reason this is
 * exported.
 */
export function shapePathFor(table: string): string {
	return `/api/shapes/${table}`;
}

/**
 * Electric leaves these Postgres types as strings on the sync path (the collection `schema` is
 * NOT applied to synced rows — only this parser is). Coerce them to match the `db/*` Zod schema
 * outputs (Date / number) so synced and mutated rows agree.
 *
 * A copy, like `shapePathFor`: its twin is `electricParser` in
 * `apps/public/src/lib/electric-shape.ts`, and `./shape-twins.test.ts` pins both. Drift is loud
 * here too — dates arriving as strings.
 */
const toDate = (value: string) => new Date(value);
export const electricParser = {
	date: toDate,
	numeric: (value: string) => Number(value),
	timestamp: toDate,
	timestamptz: toDate,
};

const credentialedFetch = (input: RequestInfo | URL, init?: RequestInit) =>
	fetch(input, { ...init, credentials: "include" });

// How long to hold optimistic state while waiting for a write to sync back.
const TXID_SETTLE_TIMEOUT_MS = 30_000;

type TxidSettler = {
	utils: { awaitTxId: (txId: number, timeout?: number) => Promise<boolean> };
};

/**
 * Hold optimistic state until Electric streams the write back — WITHOUT letting a slow sync
 * undo it.
 *
 * Returning `{ txid }` from a handler hands the wait to the collection, whose
 * `processMatchingStrategy` calls `awaitTxId` with a 5s default. That call *rejects* on timeout,
 * the rejection marks the transaction failed, and the UI rolls back an edit Postgres has already
 * durably committed.
 *
 * The API returning 2xx is our durability signal: `sendCommand` throws on any non-2xx, so a
 * genuine failure still rejects and still rolls back. Everything after that response is sync
 * latency, so we do the wait here, swallow a timeout, and return a result with NO `txid` key so
 * the collection won't wait a second time.
 */
async function settleTxids(
	collection: TxidSettler,
	txids: number[],
	table: string,
): Promise<void> {
	if (!txids.length) return;
	try {
		await Promise.all(
			txids.map((txid) =>
				collection.utils.awaitTxId(txid, TXID_SETTLE_TIMEOUT_MS),
			),
		);
	} catch (error) {
		console.warn(
			`[${table}] write committed but has not synced back within ${TXID_SETTLE_TIMEOUT_MS}ms — ` +
				`keeping it and letting the collection converge`,
			error,
		);
	}
}

/**
 * Builds the request body: the row this command is about goes in the envelope as `id`, the
 * fields that changed go flat beside it, and anything that is not a column rides in `arguments`.
 */
function envelopeFor(
	key: string | number,
	fields: unknown,
	metadata: unknown,
): CommandEnvelope {
	const { intents, arguments: args } = readCommandMetadata(metadata);
	return {
		...(fields as Record<string, unknown>),
		...args,
		id: String(key),
		intents,
	};
}

/**
 * Whether a table writes — derived from the vocabulary, not declared twice (#174).
 *
 * A commanded table MUST say `commands: true`; an uncommanded table may not say it at all.
 * `import type` on purpose: the vocabulary is erased at build.
 */
type WriteMode<TTable extends TableName> = TTable extends CommandedTable
	? {
			/** Writes carry an intent and go to POST /api/commands. */
			commands: true;
		}
	: {
			/** Forbidden: this table has no commands, so its collection is read-only. */
			commands?: never;
		};

export type ElectricCollectionOptions<
	TTable extends TableName,
	TSchema extends ZodObject<z.ZodRawShape>,
> = {
	/** Table name — the `/api/shapes/:table` segment */
	table: TTable;
	/** Zod schema for the full row shape (snake_case; typed against Electric output) */
	schema: TSchema;
	/** API origin (VITE_API_URL) */
	apiUrl: string;
} & WriteMode<TTable>;

type ElectricCollection<
	TSchema extends ZodObject<z.ZodRawShape> & StandardSchemaV1,
> = Collection<
	InferSchemaOutput<TSchema>,
	string | number,
	ElectricCollectionUtils<InferSchemaOutput<TSchema>>,
	TSchema,
	InferSchemaInput<TSchema>
>;

function createElectricCollection<
	TTable extends TableName,
	TSchema extends ZodObject<z.ZodRawShape> &
		StandardSchemaV1 & {
			_zod: { output: { id: string } };
		},
>(
	options: ElectricCollectionOptions<TTable, TSchema>,
	syncMode: "eager" | "on-demand",
	startSync: boolean,
): ElectricCollection<TSchema> {
	// `WriteMode` is a conditional on a still-generic `TTable`, so nothing can be read off
	// `options` until it resolves. One widening at the implementation seam is the price.
	const {
		table,
		schema,
		apiUrl,
		commands = false,
	} = options as {
		table: TTable;
		schema: TSchema;
		apiUrl: string;
		commands?: boolean;
	};

	// `electricCollectionOptions` validates the full config below. Handing it to
	// createCollection, though, defeats the latter's overload resolution on this generic
	// `TSchema`, so the concrete collection type is asserted at the end.
	const config = electricCollectionOptions<TSchema>({
		getKey: (item) => (item as { id: string }).id,
		id: table,

		// Each handler awaits its own txids via settleTxids and returns nothing, so the
		// collection does not re-await them with its rollback-on-timeout default. A collection
		// that names no command leaves all three undefined, which makes TanStack DB refuse the
		// mutation.
		onDelete: commands
			? async ({ transaction, collection }) => {
					const txids = await Promise.all(
						transaction.mutations.map((m) =>
							sendCommand(apiUrl, envelopeFor(m.key, {}, m.metadata)),
						),
					);
					await settleTxids(collection as TxidSettler, txids, table);
					return undefined;
				}
			: undefined,

		onInsert: commands
			? async ({ transaction, collection }) => {
					const txids = await Promise.all(
						transaction.mutations.map((m) =>
							sendCommand(apiUrl, envelopeFor(m.key, m.modified, m.metadata)),
						),
					);
					await settleTxids(collection as TxidSettler, txids, table);
					return undefined;
				}
			: undefined,

		onUpdate: commands
			? async ({ transaction, collection }) => {
					const txids: number[] = [];
					// Sequential: intents within one request run in client order, and two
					// mutations against the same row must not race each other either.
					for (const m of transaction.mutations) {
						txids.push(
							await sendCommand(
								apiUrl,
								envelopeFor(m.key, m.changes, m.metadata),
							),
						);
					}
					await settleTxids(collection as TxidSettler, txids, table);
					return undefined;
				}
			: undefined,
		schema,
		shapeOptions: {
			fetchClient: credentialedFetch,
			// Electric types `parser` against the row's declared `Extensions`; our schema rows
			// don't brand `Date` as an extension, so a Date-returning parser can't be expressed
			// in that generic. The functions are correct at runtime — cast past it.
			parser: electricParser as never,
			url: `${apiUrl}${shapePathFor(table)}`,
		},
		startSync,
		syncMode,
	});

	return createCollection(config as never) as ElectricCollection<TSchema>;
}

/**
 * Eager: streams the whole (server-narrowed) shape once something subscribes or preloads.
 * `startSync: false`, so building one opens no stream — which is what lets the registry build
 * a table on request without that request costing a network connection.
 */
export function createEagerCollection<
	TTable extends TableName,
	TSchema extends ZodObject<z.ZodRawShape> & {
		_zod: { output: { id: string } };
	},
>(options: ElectricCollectionOptions<TTable, TSchema>) {
	return createElectricCollection(options, "eager", false);
}

/**
 * On-demand: for the tables that only grow (`public_requests`, `mosquito_activity_data`). It
 * syncs no snapshot; each live query's `where`/`orderBy` is sent to the shape proxy as
 * `subset__where` / `subset__order_by` / `subset__params` (with `log=changes_only`), and only
 * that slice comes back.
 *
 * That makes it depend on the proxy forwarding `log` and every `subset__*` param
 * (apps/api/src/shapes.ts). If they are dropped nothing fails loudly: the collection syncs zero
 * rows. Forwarding them is safe because Electric intersects a subset with the shape's own
 * server-side `where` rather than replacing it.
 *
 * Two differences from the shared sync package's copy (removed in #251), both because of the
 * registry:
 *
 * - `startSync: false`, like the eager tables, so building one opens no stream. The first live
 *   query subscribing starts it, and `gcTime` stops it after the last one leaves. The sync
 *   package started these at construction, which was harmless in an app that built every table
 *   once and never stopped any.
 * - `collection.preload()` is a no-op here (TanStack DB warns and returns). A loader therefore
 *   preloads nothing for an on-demand table; the screen's own live query loads its slice and
 *   reports `isReady` when it has.
 */
export function createOnDemandCollection<
	TTable extends TableName,
	TSchema extends ZodObject<z.ZodRawShape> & {
		_zod: { output: { id: string } };
	},
>(options: ElectricCollectionOptions<TTable, TSchema>) {
	return createElectricCollection(options, "on-demand", false);
}
