/**
 * On-demand collection factory — fetches filtered subsets via predicate pushdown.
 * Best for operational tables with >1000 rows per tenant.
 *
 * Translates TanStack DB's `loadSubsetOptions` predicate tree into Supabase
 * PostgREST filter chains, including OR groups, JSONB paths, and batched `in`
 * filters for large ID sets.
 *
 * The `table` parameter is a plain string so this factory is not coupled to
 * any project's generated Database types.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createCollection } from "@tanstack/db";
import type { QueryClient } from "@tanstack/query-core";
import {
	type FieldPath,
	type ParsedOrderBy,
	parseOrderByExpression,
	parseWhereExpression,
	queryCollectionOptions,
} from "@tanstack/query-db-collection";
import z, { type ZodObject } from "zod";
import { deleteRows, insertRows, updateRow } from "../crud";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FilterNode {
	field: FieldPath;
	operator: string;
	value?: unknown;
}

interface OrGroup {
	type: "or";
	filters: Array<FilterNode | OrGroup>;
}

type AnyFilter = FilterNode | OrGroup;

function isOrGroup(node: AnyFilter): node is OrGroup {
	return "type" in node && node.type === "or";
}

// ---------------------------------------------------------------------------
// Operator map — TanStack DB operator → Supabase PostgREST method
// ---------------------------------------------------------------------------

const OPERATOR_MAP: Record<string, string> = {
	eq: "eq",
	gt: "gt",
	gte: "gte",
	lt: "lt",
	lte: "lte",
	in: "in",
	like: "like",
	ilike: "ilike",
	isNull: "is",
	not_eq: "neq",
};

// ---------------------------------------------------------------------------
// Field path formatting
// ---------------------------------------------------------------------------

function formatFieldPath(field: FieldPath): string {
	if (field.length === 1) return String(field[0]);
	const parts = field.map(String);
	const [root, ...rest] = parts;
	// biome-ignore lint/style/noNonNullAssertion: rest always has elements when field.length > 1
	const last = rest.pop()!;
	const mid = rest.map((seg) => `->${seg}`).join("");
	return `${root}${mid}->>${last}`;
}

// ---------------------------------------------------------------------------
// Batch size for large `in` filters
// ---------------------------------------------------------------------------

const IN_FILTER_BATCH_SIZE = 100;

// ---------------------------------------------------------------------------
// Predicate parser — uses @tanstack/query-db-collection's parseWhereExpression
// with custom handlers for ilike/like
// ---------------------------------------------------------------------------

function parseSubsetOptions(
	options:
		| {
				where?: Parameters<typeof parseWhereExpression>[0];
				orderBy?: Parameters<typeof parseOrderByExpression>[0];
				limit?: number;
				offset?: number;
		  }
		| undefined
		| null,
): {
	filters: AnyFilter[];
	sorts: ParsedOrderBy[];
	limit?: number;
	offset?: number;
} {
	if (!options) {
		return { filters: [], sorts: [] };
	}

	const comparison = (
		field: FieldPath,
		operator: string,
		value: unknown,
	): AnyFilter[] => [{ field, operator, value }];

	const filters: AnyFilter[] =
		parseWhereExpression<AnyFilter[]>(options.where ?? null, {
			handlers: {
				and: (...groups: AnyFilter[][]) => groups.flat(),
				or: (...groups: AnyFilter[][]) => {
					const orGroup: OrGroup = {
						type: "or",
						filters: groups.flat(),
					};
					return [orGroup];
				},
				not: (...args: AnyFilter[][]) => {
					const inner: AnyFilter[] = args.flat();
					return inner.map((node) => {
						if (isOrGroup(node)) return node;
						return {
							...node,
							operator: node.operator.startsWith("not_")
								? node.operator
								: `not_${node.operator}`,
						};
					});
				},
				eq: (field, value) => comparison(field, "eq", value),
				gt: (field, value) => comparison(field, "gt", value),
				gte: (field, value) => comparison(field, "gte", value),
				lt: (field, value) => comparison(field, "lt", value),
				lte: (field, value) => comparison(field, "lte", value),
				in: (field, value) => comparison(field, "in", value),
				like: (field, value) => comparison(field, "like", value),
				ilike: (field, value) => comparison(field, "ilike", value),
				isNull: (field) => [{ field, operator: "isNull" }],
				isUndefined: (field) => [{ field, operator: "isUndefined" }],
			},
			onUnknownOperator: (operator) => {
				console.warn(
					`[parseSubsetOptions] Skipping unsupported operator: ${operator}`,
				);
				return [];
			},
		}) ?? [];

	return {
		filters,
		sorts: parseOrderByExpression(options.orderBy),
		limit: options.limit,
		offset: options.offset,
	};
}

// ---------------------------------------------------------------------------
// Apply a filter node to a Supabase query
// ---------------------------------------------------------------------------

// biome-ignore lint/suspicious/noExplicitAny: Supabase query builder types don't flow through generics
function applyFilterNode(query: any, node: AnyFilter): any {
	if (isOrGroup(node)) {
		const segments = node.filters
			.filter((f): f is FilterNode => !isOrGroup(f))
			.map((f) => {
				const col = formatFieldPath(f.field);
				const op = f.operator;
				if (op === "isNull") return `${col}.is.null`;
				if (op === "in" && Array.isArray(f.value)) {
					const vals = (f.value as unknown[])
						.filter((v) => v != null)
						.join(",");
					return `${col}.in.(${vals})`;
				}
				const pgOp = OPERATOR_MAP[op] ?? op;
				return `${col}.${pgOp}.${f.value}`;
			})
			.filter(Boolean);

		if (segments.length > 0) {
			return query.or(segments.join(","));
		}
		return query;
	}

	const column = formatFieldPath(node.field);
	const op = node.operator;
	const pgMethod = OPERATOR_MAP[op];

	if (!pgMethod) return query;

	if (op === "isNull") {
		return query.is(column, null);
	}
	if (op === "in" && Array.isArray(node.value)) {
		return query.in(
			column,
			(node.value as unknown[]).filter((v) => v != null),
		);
	}
	return query[pgMethod](column, node.value);
}

// ---------------------------------------------------------------------------
// On-demand collection factory
// ---------------------------------------------------------------------------

export interface OnDemandCollectionOptions<
	TSchema extends ZodObject<z.ZodRawShape>,
	TInsertSchema extends ZodObject<z.ZodRawShape>,
	TUpdateSchema extends ZodObject<z.ZodRawShape>,
> {
	/** Supabase table or view name */
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
	/** How long a loaded subset is considered fresh, in ms. Default: 1 hour */
	staleTime?: number;
}

export function createOnDemandCollection<
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
}: OnDemandCollectionOptions<TSchema, TInsertSchema, TUpdateSchema>) {
	type Row = z.output<TSchema>;

	const fields = Object.keys(schema.shape).join(",");

	return createCollection(
		// @ts-expect-error TanStack DB types lag behind runtime API
		queryCollectionOptions({
			queryKey: (opts) => {
				const { filters, sorts, limit, offset } = parseSubsetOptions(opts);

				const serializeNode = (node: AnyFilter): unknown => {
					if (isOrGroup(node)) {
						return {
							type: "or",
							filters: node.filters.map(serializeNode),
						};
					}
					return {
						field: formatFieldPath(node.field),
						op: node.operator,
						value: node.value,
					};
				};

				return [
					table,
					{
						filters: filters.map(serializeNode),
						sorts: sorts.map((s) => ({
							field: s.field.join("."),
							dir: s.direction,
						})),
						limit,
						offset,
					},
				];
			},

			queryFn: async (ctx): Promise<Row[]> => {
				const { filters, sorts, limit, offset } = parseSubsetOptions(
					ctx.meta?.loadSubsetOptions,
				);

				const normalFilters: AnyFilter[] = [];
				let batchFilter: {
					column: string;
					values: unknown[];
				} | null = null;

				for (const f of filters) {
					if (
						!isOrGroup(f) &&
						f.operator === "in" &&
						Array.isArray(f.value) &&
						(f.value as unknown[]).length > IN_FILTER_BATCH_SIZE
					) {
						const nonNullValues = (f.value as unknown[]).filter(
							(v) => v != null,
						);
						batchFilter = {
							column: formatFieldPath(f.field),
							values: nonNullValues,
						};
					} else {
						normalFilters.push(f);
					}
				}

				// biome-ignore lint/suspicious/noExplicitAny: Supabase query builder types don't flow through generics
				const buildBaseQuery = (): any => {
					// biome-ignore lint/suspicious/noExplicitAny: Supabase .from() overloads
					let query: any = (supabase as any).from(table).select(fields);

					for (const f of normalFilters) {
						query = applyFilterNode(query, f);
					}

					for (const s of sorts) {
						const column = s.field.join(".");
						query = query.order(column, {
							ascending: s.direction === "asc",
							nullsFirst: s.nulls === "first",
						});
					}

					if (limit !== undefined && offset !== undefined) {
						query = query.range(offset, offset + limit - 1);
					} else if (limit !== undefined) {
						query = query.limit(limit);
					}

					if (ctx.signal) {
						query = query.abortSignal(ctx.signal);
					}

					return query;
				};

				// biome-ignore lint/suspicious/noExplicitAny: raw Supabase response
				let allData: any[];

				if (batchFilter && batchFilter.values.length > 0) {
					const { column: batchColumn, values: batchValues } = batchFilter;
					const chunks: unknown[][] = [];
					for (let i = 0; i < batchValues.length; i += IN_FILTER_BATCH_SIZE) {
						chunks.push(batchValues.slice(i, i + IN_FILTER_BATCH_SIZE));
					}

					const results = await Promise.all(
						chunks.map(async (chunk) => {
							const query = buildBaseQuery().in(batchColumn, chunk);
							const { data, error } = await query;
							if (error)
								throw new Error(`Batch fetch ${table}: ${error.message}`);
							return data ?? [];
						}),
					);

					const seen = new Set<string>();
					allData = [];
					for (const batch of results) {
						// biome-ignore lint/suspicious/noExplicitAny: raw Supabase response
						for (const row of batch as any[]) {
							if (!seen.has(row.id)) {
								seen.add(row.id);
								allData.push(row);
							}
						}
					}
				} else {
					const query = buildBaseQuery();
					const { data, error } = await query;
					if (error) throw new Error(`Fetch ${table}: ${error.message}`);
					allData = data ?? [];
				}

				const parsedRows = z.array(schema).safeParse(allData);
				if (!parsedRows.success) {
					throw new Error(
						`Schema validation failed for ${table}: ${parsedRows.error.message}`,
					);
				}

				return parsedRows.data;
			},

			queryClient,
			getKey: (item: Row) => item.id,
			syncMode: "on-demand",
			startSync: true,
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
