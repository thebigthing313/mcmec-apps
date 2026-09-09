/**
 * Shared Electric collection builder for the eager/on-demand factories.
 *
 * Reads: `electricCollectionOptions` streams the server-narrowed shape from the API
 * proxy (`/api/shapes/:table`). The proxy sets `table`/`where`/`columns` server-side
 * (authorization); the client only carries sync-cursor params + the session cookie.
 *
 * Writes: `onInsert/onUpdate/onDelete` post one command envelope each (see ../command-write),
 * then hold the optimistic state until that write's Postgres `txid` streams back through
 * Electric — see `settleTxids` for why we do that wait ourselves rather than handing it to the
 * collection.
 *
 * A collection that names no command has no write handlers at all. That is not a degraded
 * mode: the generic door those tables used to write through is gone (#140), so a read-only
 * collection is now spelled by the absence of `commands`, and the type below is what makes the
 * spelling compulsory.
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
} from "../command-write";
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
 * The API returning 2xx is our durability signal: `sendCommand` throws on any non-2xx, so a
 * genuine failure still rejects and still rolls back. Everything after that
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

/**
 * Whether a table writes — derived from the vocabulary, not declared twice.
 *
 * `CommandedTable` is the union of tables the vocabulary names, and this conditional keys off
 * the `table` literal: a commanded table MUST say `commands: true`, an uncommanded table may
 * not say it at all. The compiler settles it at the call site.
 *
 * The guard was built (#174) against a table cutting over in two places that nothing tied
 * together — leaving `WRITABLE` in `apps/api/src/data.ts` while its collection stayed generic,
 * which is what the documents slice shipped (#160) and what came back `404 not writable`. That
 * failure mode died with `WRITABLE` (#140), but the type earns its place twice over now: with
 * no generic path left, a missing `commands: true` is not a table on the old door, it is a
 * collection that cannot be written at all.
 *
 * `import type` on purpose — the vocabulary is erased at build, so `hr`, `admin` and
 * `central`, which name no intent, pay nothing at runtime to be correct by construction.
 */
type WriteMode<TTable extends TableName> = TTable extends CommandedTable
	? {
			/**
			 * Writes carry an intent and go to POST /api/commands. Required, because this
			 * table has commands.
			 */
			commands: true;
		}
	: {
			/**
			 * Forbidden, because this table has no commands — and with the generic door
			 * gone there is no other way for it to be written, so its collection is
			 * read-only by construction.
			 */
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

export function createElectricCollection<
	TTable extends TableName,
	TSchema extends ZodObject<z.ZodRawShape> &
		StandardSchemaV1 & {
			_zod: { output: { id: string } };
		},
>(
	options: ElectricCollectionOptions<TTable, TSchema>,
	syncMode: "eager" | "on-demand",
	startSync: boolean,
): Collection<
	InferSchemaOutput<TSchema>,
	string | number,
	ElectricCollectionUtils<InferSchemaOutput<TSchema>>,
	TSchema,
	InferSchemaInput<TSchema>
> {
	// `WriteMode` is a conditional on a still-generic `TTable`, so nothing can be read off
	// `options` until it resolves. One widening at the implementation seam is the price —
	// the safety lives at the call site, which is where the two halves used to disagree.
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
		// All three are the same three lines: read the intent the call site named, post one
		// envelope, settle. The difference between insert, update and delete is which fields
		// go in the body — the server learns the operation from the command name, not from
		// an HTTP verb. A collection that names no command leaves all three undefined, which
		// is what makes TanStack DB refuse the mutation.
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
	});

	return createCollection(config as never) as Collection<
		InferSchemaOutput<TSchema>,
		string | number,
		ElectricCollectionUtils<InferSchemaOutput<TSchema>>,
		TSchema,
		InferSchemaInput<TSchema>
	>;
}
