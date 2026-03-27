/**
 * Predicate pushdown parser — converts TanStack DB subset predicates
 * into Supabase PostgREST filter chains.
 *
 * Used by the on-demand collection factory to translate
 * `ctx.meta.loadSubsetOptions` from TanStack DB into Supabase queries.
 * Also exported for consumers who want to apply filters manually.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SimpleComparison {
	field: string[];
	operator: string;
	value: unknown;
}

export interface OrGroup {
	type: "or";
	filters: FilterNode[];
}

export type FilterNode = SimpleComparison | OrGroup;

export interface ParsedOrderBy {
	column: string;
	ascending: boolean;
	nullsFirst?: boolean;
}

export interface ParsedSubsetOptions {
	filters: FilterNode[];
	sorts: ParsedOrderBy[];
	limit?: number;
	offset?: number;
}

export function isOrGroup(node: FilterNode): node is OrGroup {
	return "type" in node && node.type === "or";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** PostgREST URL limit safe batch size for `in` filters */
export const IN_FILTER_BATCH_SIZE = 100;

/** Maps TanStack DB operator names → PostgREST method names */
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

/**
 * Converts a field path array to PostgREST column notation.
 * - `['city']` → `"city"`
 * - `['address_fields', 'city']` → `"address_fields->>city"` (JSONB text extraction)
 * - `['meta', 'nested', 'val']` → `"meta->nested->>val"` (deep JSONB)
 */
export function formatFieldPath(field: string[]): string {
	if (field.length === 1) return field[0] as string;
	const [root, ...rest] = field;
	// biome-ignore lint/style/noNonNullAssertion: rest always has elements when field.length > 1
	const last = rest.pop()!;
	const mid = rest.map((seg) => `->${seg}`).join("");
	return `${root}${mid}->>${last}`;
}

// ---------------------------------------------------------------------------
// OR segment formatting (for .or() string construction)
// ---------------------------------------------------------------------------

/**
 * Converts a SimpleComparison to a PostgREST `.or()` segment string.
 * Returns null for unsupported operators.
 */
function formatOrSegment(filter: SimpleComparison): string | null {
	const column = formatFieldPath(filter.field);
	const op = filter.operator;

	const pgOp = op.startsWith("not_")
		? `not.${OPERATOR_MAP[op] ?? op.slice(4)}`
		: (OPERATOR_MAP[op] ?? op);

	if (op === "isNull") {
		return `${column}.is.null`;
	}

	if (op === "in" && Array.isArray(filter.value)) {
		const vals = filter.value.filter((v: unknown) => v != null).join(",");
		return `${column}.in.(${vals})`;
	}

	const value = formatOrValue(filter);
	return `${column}.${pgOp}.${value}`;
}

/**
 * Formats the value portion of a PostgREST `.or()` segment.
 * - Dates → ISO strings
 * - Like/ilike: SQL `%` → PostgREST `*`
 */
function formatOrValue(filter: SimpleComparison): string {
	const { value, operator } = filter;

	if (value instanceof Date) return value.toISOString();

	if (
		(operator === "like" || operator === "ilike") &&
		typeof value === "string"
	) {
		return value.replace(/%/g, "*");
	}

	return String(value);
}

// ---------------------------------------------------------------------------
// parseSubsetOptions — main parser
// ---------------------------------------------------------------------------

/**
 * Parses TanStack DB loadSubsetOptions into structured filter/sort metadata.
 * Supports like/ilike operators in addition to the standard set.
 */
// biome-ignore lint/suspicious/noExplicitAny: TanStack DB subset options are loosely typed
export function parseSubsetOptions(opts: any): ParsedSubsetOptions {
	if (!opts) return { filters: [], sorts: [] };

	const filters: FilterNode[] = [];
	const sorts: ParsedOrderBy[] = [];

	if (opts.where) {
		parseWhereExpression(opts.where, filters);
	}

	if (opts.orderBy) {
		const orderByArr = Array.isArray(opts.orderBy)
			? opts.orderBy
			: [opts.orderBy];
		for (const ob of orderByArr) {
			if (ob.field) {
				sorts.push({
					column: formatFieldPath(
						Array.isArray(ob.field) ? ob.field : [ob.field],
					),
					ascending: ob.direction !== "desc",
					nullsFirst: ob.nullsFirst,
				});
			}
		}
	}

	return {
		filters,
		sorts,
		limit: opts.limit,
		offset: opts.offset,
	};
}

// biome-ignore lint/suspicious/noExplicitAny: TanStack DB expression nodes are loosely typed
function parseWhereExpression(expr: any, filters: FilterNode[]): void {
	if (!expr || typeof expr !== "object") return;

	if (expr.op === "and" && Array.isArray(expr.conditions)) {
		for (const cond of expr.conditions) {
			parseWhereExpression(cond, filters);
		}
		return;
	}

	if (expr.op === "or" && Array.isArray(expr.conditions)) {
		const orFilters: FilterNode[] = [];
		for (const cond of expr.conditions) {
			parseWhereExpression(cond, orFilters);
		}
		if (orFilters.length > 0) {
			filters.push({ type: "or", filters: orFilters });
		}
		return;
	}

	if (expr.op === "not" && expr.condition) {
		const innerFilters: FilterNode[] = [];
		parseWhereExpression(expr.condition, innerFilters);
		for (const f of innerFilters) {
			if (!isOrGroup(f)) {
				filters.push({ ...f, operator: `not_${f.operator}` });
			} else {
				console.warn("NOT applied to OR group is not supported, skipping");
			}
		}
		return;
	}

	const op = expr.op;
	if (op && expr.field) {
		const field = Array.isArray(expr.field) ? expr.field : [expr.field];
		const value = expr.value;

		if (OPERATOR_MAP[op] || op.startsWith("not_")) {
			filters.push({ field, operator: op, value });
		} else {
			console.warn(`Unknown operator "${op}", skipping`);
		}
	}
}

// ---------------------------------------------------------------------------
// Filter application — applies parsed filters to Supabase query builder
// ---------------------------------------------------------------------------

/**
 * Applies a single SimpleComparison to a Supabase query builder.
 */
// biome-ignore lint/suspicious/noExplicitAny: Supabase query builder is untyped in generic context
export function applyFilter(query: any, filter: SimpleComparison): any {
	const column = formatFieldPath(filter.field);
	const { operator, value } = filter;

	if (operator === "isNull") {
		return query.is(column, null);
	}

	const pgMethod = operator.startsWith("not_")
		? (OPERATOR_MAP[operator] ?? `not_${operator.slice(4)}`)
		: (OPERATOR_MAP[operator] ?? operator);

	if (operator === "in" && Array.isArray(value)) {
		const cleaned = value.filter((v: unknown) => v != null);
		return query[pgMethod](column, cleaned);
	}

	const serialized = value instanceof Date ? value.toISOString() : value;

	return query[pgMethod](column, serialized);
}

/**
 * Applies an OrGroup to a Supabase query builder via `.or()`.
 * Recursively flattens nested OrGroups into a single `.or()` string.
 */
// biome-ignore lint/suspicious/noExplicitAny: Supabase query builder is untyped in generic context
export function applyOrGroup(query: any, group: OrGroup): any {
	const segments: string[] = [];

	function collect(nodes: FilterNode[]) {
		for (const node of nodes) {
			if (isOrGroup(node)) {
				collect(node.filters);
			} else {
				const seg = formatOrSegment(node);
				if (seg) segments.push(seg);
			}
		}
	}

	collect(group.filters);

	if (segments.length > 0) {
		return query.or(segments.join(","));
	}
	return query;
}

/**
 * Dispatches a FilterNode to the appropriate handler.
 */
// biome-ignore lint/suspicious/noExplicitAny: Supabase query builder is untyped in generic context
export function applyFilterNode(query: any, node: FilterNode): any {
	if (isOrGroup(node)) {
		return applyOrGroup(query, node);
	}
	return applyFilter(query, node);
}
