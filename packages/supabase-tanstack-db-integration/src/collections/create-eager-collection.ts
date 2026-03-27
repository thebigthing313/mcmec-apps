/**
 * Eager collection factory — fetches the entire table once, caches with staleTime.
 * Best for lookup/reference tables with <1000 rows per tenant.
 *
 * The `table` parameter is a plain string so this factory is not coupled to
 * any project's generated Database types. Pass your typed
 * `SupabaseClient<YourDatabase>` for autocomplete on the client side.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createCollection } from "@tanstack/db";
import type { QueryClient } from "@tanstack/query-core";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import type z from "zod";
import type { ZodObject } from "zod";
import { deleteRows, fetchRows, insertRows, updateRow } from "../crud";

export interface EagerCollectionOptions<
	TSchema extends ZodObject<z.ZodRawShape>,
	TInsertSchema extends ZodObject<z.ZodRawShape>,
	TUpdateSchema extends ZodObject<z.ZodRawShape>,
> {
	/** Supabase table name */
	table: string;
	/** Zod schema for the full row shape returned by SELECT */
	schema: TSchema;
	queryClient: QueryClient;
	// biome-ignore lint/suspicious/noExplicitAny: caller passes typed SupabaseClient<TheirDatabase>
	supabase: SupabaseClient<any>;
	/** Zod schema for INSERT payloads (omit audit/generated fields) */
	insertSchema?: TInsertSchema;
	/** Zod schema for UPDATE payloads (all fields optional) */
	updateSchema?: TUpdateSchema;
	/** Allow delete mutations on this collection. Default: false */
	allowDelete?: boolean;
	/** How long cached data is considered fresh, in ms. Default: 1 hour */
	staleTime?: number;
}

export function createEagerCollection<
	TSchema extends ZodObject<z.ZodRawShape> & {
		_zod: { output: { id: string } };
	},
	TInsertSchema extends ZodObject<z.ZodRawShape>,
	TUpdateSchema extends ZodObject<z.ZodRawShape>,
>({
	table,
	schema,
	queryClient,
	supabase,
	insertSchema,
	updateSchema,
	allowDelete = false,
	staleTime = 3_600_000,
}: EagerCollectionOptions<TSchema, TInsertSchema, TUpdateSchema>) {
	type Row = z.output<TSchema>;

	return createCollection(
		// @ts-expect-error TanStack DB types lag behind runtime API
		queryCollectionOptions({
			queryKey: [table],
			queryFn: async (): Promise<Row[]> => {
				const { data, error } = await fetchRows(table, schema, supabase);
				if (error || !data) {
					throw new Error(
						`Failed to fetch ${table}: ${error?.message ?? "No data returned"}`,
					);
				}
				return data;
			},
			queryClient,
			getKey: (item: Row) => item.id,
			syncMode: "eager",
			startSync: false,
			staleTime,

			onInsert: insertSchema
				? async ({ transaction }) => {
						const rows = transaction.mutations.map((m) => m.modified);
						const result = await insertRows(
							table,
							schema,
							insertSchema,
							supabase,
							rows as unknown as z.infer<TInsertSchema>[],
						);
						if (result.error) throw result.error;
					}
				: undefined,

			onUpdate: updateSchema
				? async ({ transaction }) => {
						for (const m of transaction.mutations) {
							const result = await updateRow(
								table,
								schema,
								updateSchema,
								supabase,
								m.changes as z.infer<TUpdateSchema>,
								// biome-ignore lint/suspicious/noExplicitAny: filter callback needs untyped query
								(query: any) => query.eq("id", m.key),
							);
							if (result.error) throw result.error;
						}
					}
				: undefined,

			onDelete: allowDelete
				? async ({ transaction }) => {
						const ids = transaction.mutations.map((m) => m.key);
						const result = await deleteRows(
							table,
							supabase,
							// biome-ignore lint/suspicious/noExplicitAny: filter callback needs untyped query
							(query: any) => query.in("id", ids),
						);
						if (result.error) throw result.error;
					}
				: undefined,
		}),
	);
}
