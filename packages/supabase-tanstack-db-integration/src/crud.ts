/**
 * Generic CRUD utilities for TanStack DB collection handlers.
 *
 * These functions are NOT general-purpose Supabase wrappers — they exist
 * exclusively to power TanStack DB eager and on-demand collections.
 *
 * The `table` parameter is typed as `string` so this package is not coupled
 * to any project's generated `Database` types. Pass your own typed
 * `SupabaseClient<YourDatabase>` for full type-safety at the call site.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import z, { type ZodObject } from "zod";

const MAX_INSERT_ROWS = 500;

// ---------------------------------------------------------------------------
// Shared helper: select fields from schema + parse response
// ---------------------------------------------------------------------------

export async function selectAndParse<TSchema extends ZodObject<z.ZodRawShape>>(
	// biome-ignore lint/suspicious/noExplicitAny: Supabase query builder types don't flow through generics
	query: any,
	schema: TSchema,
): Promise<{ data: z.infer<TSchema>[] | null; error: Error | null }> {
	const fields = Object.keys(schema.shape).join(",");
	const { data, error } = await query.select(fields);

	if (error) {
		return { data: null, error: error as unknown as Error };
	}

	const parsed = z.array(schema).safeParse(data);
	if (!parsed.success) {
		return { data: null, error: parsed.error };
	}

	return { data: parsed.data, error: null };
}

// ---------------------------------------------------------------------------
// fetchRows — used by eager collections ("get all rows")
// ---------------------------------------------------------------------------

type FetchResult<T> = {
	data: T[] | null;
	error: Error | null;
};

export async function fetchRows<TSchema extends ZodObject<z.ZodRawShape>>(
	table: string,
	schema: TSchema,
	// biome-ignore lint/suspicious/noExplicitAny: SupabaseClient generic not constrained here
	supabase: SupabaseClient<any>,
	signal?: AbortSignal,
): Promise<FetchResult<z.infer<TSchema>>> {
	// biome-ignore lint/suspicious/noExplicitAny: Supabase query builder types don't flow through generics
	let query: any = supabase.from(table);

	if (signal) {
		query = query.abortSignal(signal);
	}

	return selectAndParse(query, schema);
}

// ---------------------------------------------------------------------------
// insertRows
// ---------------------------------------------------------------------------

type InsertResult<T> = {
	data: T[] | null;
	count: number;
	error: Error | null;
};

export async function insertRows<
	TRowSchema extends ZodObject<z.ZodRawShape>,
	TInsertSchema extends ZodObject<z.ZodRawShape>,
>(
	table: string,
	rowSchema: TRowSchema,
	insertSchema: TInsertSchema,
	// biome-ignore lint/suspicious/noExplicitAny: SupabaseClient generic not constrained here
	supabase: SupabaseClient<any>,
	rows: Array<z.infer<TInsertSchema>>,
	signal?: AbortSignal,
): Promise<InsertResult<z.infer<TRowSchema>>> {
	if (rows.length === 0) {
		return {
			data: null,
			count: 0,
			error: new Error("No rows provided for insert"),
		};
	}

	if (rows.length > MAX_INSERT_ROWS) {
		return {
			data: null,
			count: 0,
			error: new Error(
				`Cannot insert more than ${MAX_INSERT_ROWS} rows at once`,
			),
		};
	}

	const parsed = z.array(insertSchema).safeParse(rows);
	if (!parsed.success) {
		return { data: null, count: 0, error: parsed.error };
	}

	// biome-ignore lint/suspicious/noExplicitAny: Supabase query builder types don't flow through generics
	let query: any = supabase.from(table).insert(parsed.data as any);

	if (signal) {
		query = query.abortSignal(signal);
	}

	const result = await selectAndParse(query, rowSchema);
	return {
		data: result.data,
		count: result.data?.length ?? 0,
		error: result.error,
	};
}

// ---------------------------------------------------------------------------
// updateRow
// ---------------------------------------------------------------------------

type UpdateResult<T> = {
	data: T[] | null;
	count: number;
	error: Error | null;
};

// biome-ignore lint/suspicious/noExplicitAny: filter callback receives untyped query builder
type FilterFn = (query: any) => any;

export async function updateRow<
	TRowSchema extends ZodObject<z.ZodRawShape>,
	TUpdateSchema extends ZodObject<z.ZodRawShape>,
>(
	table: string,
	rowSchema: TRowSchema,
	updateSchema: TUpdateSchema,
	// biome-ignore lint/suspicious/noExplicitAny: SupabaseClient generic not constrained here
	supabase: SupabaseClient<any>,
	row: z.infer<TUpdateSchema>,
	filter: FilterFn,
	signal?: AbortSignal,
): Promise<UpdateResult<z.infer<TRowSchema>>> {
	if (Object.keys(row).length === 0) {
		return {
			data: null,
			count: 0,
			error: new Error("No fields provided for update"),
		};
	}

	const parsed = updateSchema.safeParse(row);
	if (!parsed.success) {
		return { data: null, count: 0, error: parsed.error };
	}

	// biome-ignore lint/suspicious/noExplicitAny: Supabase query builder types don't flow through generics
	let query: any = supabase.from(table).update(parsed.data as any);
	query = filter(query);

	if (signal) {
		query = query.abortSignal(signal);
	}

	const result = await selectAndParse(query, rowSchema);
	return {
		data: result.data,
		count: result.data?.length ?? 0,
		error: result.error,
	};
}

// ---------------------------------------------------------------------------
// deleteRows
// ---------------------------------------------------------------------------

type DeleteResult =
	| { success: true; error: null; count: number }
	| { success: false; error: Error; count: 0 };

export async function deleteRows(
	table: string,
	// biome-ignore lint/suspicious/noExplicitAny: SupabaseClient generic not constrained here
	supabase: SupabaseClient<any>,
	filter: FilterFn,
	signal?: AbortSignal,
): Promise<DeleteResult> {
	// biome-ignore lint/suspicious/noExplicitAny: Supabase query builder types don't flow through generics
	let query: any = supabase.from(table).delete({ count: "exact" });
	query = filter(query);

	if (signal) {
		query = query.abortSignal(signal);
	}

	const { error, count } = await query;

	if (error) {
		return { success: false, error: error as unknown as Error, count: 0 };
	}

	return { success: true, error: null, count: count ?? 0 };
}

// ---------------------------------------------------------------------------
// TableRegistryEntry — describes a table + its three Zod schemas
// ---------------------------------------------------------------------------

export interface TableRegistryEntry<
	TBaseRow extends ZodObject<z.ZodRawShape> = ZodObject<z.ZodRawShape>,
	TInsert extends ZodObject<z.ZodRawShape> = ZodObject<z.ZodRawShape>,
	TUpdate extends ZodObject<z.ZodRawShape> = ZodObject<z.ZodRawShape>,
> {
	table: string;
	baseRowSchema: TBaseRow;
	insertSchema?: TInsert;
	updateSchema?: TUpdate;
	allowDelete?: boolean;
}
