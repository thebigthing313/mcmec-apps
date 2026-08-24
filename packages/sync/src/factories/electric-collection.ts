/**
 * Shared Electric collection builder for the eager/on-demand factories.
 *
 * Reads: `electricCollectionOptions` streams the server-narrowed shape from the API
 * proxy (`/api/shapes/:table`). The proxy sets `table`/`where`/`columns` server-side
 * (authorization); the client only carries sync-cursor params + the session cookie.
 *
 * Writes: `onInsert/onUpdate/onDelete` go through the data API (see ../crud), then hold the
 * optimistic state until that write's Postgres `txid` streams back through Electric — see
 * `settleTxids` for why we do that wait ourselves rather than handing it to the collection.
 */
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
} from "../command-write";
import { apiDeleteRows, apiInsertRows, apiUpdateRow } from "../crud";
import { shapePathFor } from "../routes";

// Electric leaves these Postgres types as strings on the sync path (the collection
// `schema` is NOT applied to synced rows — only this parser is). Coerce them to match
// the db/* Zod schema outputs (Date / number) so synced and mutated rows agree.
const toDate = (value: string) => new Date(value);
export const electricParser = {
	timestamptz: toDate,
	timestamp: toDate,
	date: toDate,
	numeric: (value: string) => Number(value),
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
 * `processMatchingStrategy` calls `awaitTxId` with a 5s default. That call *rejects* on
 * timeout, and the rejection propagates out of the mutation handler, so the transaction is
 * marked failed and the UI rolls back — an edit disappearing from the screen that Postgres
 * has already durably committed.
 *
 * The API returning 2xx is our durability signal: `handleWrite` in ../crud throws on any
 * non-2xx, so a genuine failure still rejects and still rolls back. Everything after that
 * response is sync latency, which is not the user's problem and must not look like data loss.
 *
 * So we do the wait here and swallow a timeout, then return a result with NO `txid` key —
 * `processMatchingStrategy` keys off that property's presence, so the collection won't wait a
 * second time. Normal case: the overlay persists until the real row lands, no flicker. Slow
 * case: after the timeout the overlay drops and the row shows its last synced value until
 * Electric catches up — a brief flicker instead of a lost edit.
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
 * fields that changed go flat beside it, and anything that is not a column rides in
 * `arguments`. No payload schema ever declares an `id` (#137).
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

export interface ElectricCollectionOptions<
	TSchema extends ZodObject<z.ZodRawShape>,
	TInsertSchema extends ZodObject<z.ZodRawShape>,
	TUpdateSchema extends ZodObject<z.ZodRawShape>,
> {
	/** Table name — the `/api/shapes/:table` + `/api/data/:table` segment */
	table: string;
	/** Zod schema for the full row shape (snake_case; typed against Electric output) */
	schema: TSchema;
	/** API origin (VITE_API_URL) */
	apiUrl: string;
	/** Zod schema for INSERT payloads (omit generated fields) */
	insertSchema?: TInsertSchema;
	/** Zod schema for UPDATE payloads (all fields optional) */
	updateSchema?: TUpdateSchema;
	/** Allow delete mutations on this collection. Default: false */
	allowDelete?: boolean;
	/**
	 * Route writes through the named-command dispatcher instead of the generic data API.
	 * Set per table as it cuts over; when the last one has (#140) this is the only mode and
	 * the flag, `crud.ts` and the Insert/Update schemas all disappear.
	 */
	commands?: boolean;
}

export function createElectricCollection<
	TSchema extends ZodObject<z.ZodRawShape> &
		StandardSchemaV1 & {
			_zod: { output: { id: string } };
		},
	TInsertSchema extends ZodObject<z.ZodRawShape>,
	TUpdateSchema extends ZodObject<z.ZodRawShape>,
>(
	{
		table,
		schema,
		apiUrl,
		insertSchema,
		updateSchema,
		allowDelete = false,
		commands = false,
	}: ElectricCollectionOptions<TSchema, TInsertSchema, TUpdateSchema>,
	syncMode: "eager" | "on-demand",
	startSync: boolean,
): Collection<
	InferSchemaOutput<TSchema>,
	string | number,
	ElectricCollectionUtils<InferSchemaOutput<TSchema>>,
	TSchema,
	InferSchemaInput<TSchema>
> {
	const target = { apiUrl, table };

	// `electricCollectionOptions` validates the full config below. Handing it to
	// createCollection, though, defeats the latter's overload resolution: it reduces
	// cleanly for a concrete schema (verified) but stalls on this generic `TSchema`
	// wrapper. The options are correct, so assert the concrete collection type.
	const config = electricCollectionOptions<TSchema>({
		id: table,
		schema,
		syncMode,
		startSync,
		getKey: (item) => (item as { id: string }).id,
		shapeOptions: {
			url: `${apiUrl}${shapePathFor(table)}`,
			// Electric types `parser` against the row's declared `Extensions`; our schema
			// rows don't brand `Date` as an extension, so a Date-returning parser can't be
			// expressed in that generic. The functions are correct at runtime — cast past it.
			parser: electricParser as never,
			fetchClient: credentialedFetch,
		},

		// Each handler awaits its own txids via settleTxids and returns nothing, so the
		// collection does not re-await them with its rollback-on-timeout default.
		//
		// In command mode all three handlers are the same three lines: read the intent the
		// call site named, post one envelope, settle. The difference between insert, update
		// and delete is which fields go in the body — the server learns the operation from
		// the command name, not from an HTTP verb.
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
			: insertSchema
				? async ({ transaction, collection }) => {
						const rows = transaction.mutations.map((m) => m.modified);
						const txids = await apiInsertRows(
							target,
							insertSchema,
							rows as unknown[],
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
			: updateSchema
				? async ({ transaction, collection }) => {
						const txids: number[] = [];
						for (const m of transaction.mutations) {
							const txid = await apiUpdateRow(
								target,
								updateSchema,
								m.key,
								m.changes,
							);
							if (txid !== undefined) txids.push(txid);
						}
						await settleTxids(collection as TxidSettler, txids, table);
						return undefined;
					}
				: undefined,

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
			: allowDelete
				? async ({ transaction, collection }) => {
						const ids = transaction.mutations.map((m) => m.key);
						const txids = await apiDeleteRows(target, ids);
						await settleTxids(collection as TxidSettler, txids, table);
						return undefined;
					}
				: undefined,
	});

	return createCollection(config as never) as Collection<
		InferSchemaOutput<TSchema>,
		string | number,
		ElectricCollectionUtils<InferSchemaOutput<TSchema>>,
		TSchema,
		InferSchemaInput<TSchema>
	>;
}
