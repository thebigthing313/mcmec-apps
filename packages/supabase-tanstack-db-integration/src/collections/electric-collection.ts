/**
 * Shared Electric collection builder for the eager/on-demand factories.
 *
 * Reads: `electricCollectionOptions` streams the server-narrowed shape from the API
 * proxy (`/api/shapes/:table`). The proxy sets `table`/`where`/`columns` server-side
 * (authorization); the client only carries sync-cursor params + the session cookie.
 *
 * Writes: `onInsert/onUpdate/onDelete` go through the data API (see ../crud) and return
 * the write's Postgres `txid` so optimistic state settles when Electric streams it back.
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
import { apiDeleteRows, apiInsertRows, apiUpdateRow } from "../crud";

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
			url: `${apiUrl}/api/shapes/${table}`,
			// Electric types `parser` against the row's declared `Extensions`; our schema
			// rows don't brand `Date` as an extension, so a Date-returning parser can't be
			// expressed in that generic. The functions are correct at runtime — cast past it.
			parser: electricParser as never,
			fetchClient: credentialedFetch,
		},

		onInsert: insertSchema
			? async ({ transaction }) => {
					const rows = transaction.mutations.map((m) => m.modified);
					const txids = await apiInsertRows(
						target,
						insertSchema,
						rows as unknown[],
					);
					return txids.length ? { txid: txids } : undefined;
				}
			: undefined,

		onUpdate: updateSchema
			? async ({ transaction }) => {
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
					return txids.length ? { txid: txids } : undefined;
				}
			: undefined,

		onDelete: allowDelete
			? async ({ transaction }) => {
					const ids = transaction.mutations.map((m) => m.key);
					const txids = await apiDeleteRows(target, ids);
					return txids.length ? { txid: txids } : undefined;
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
