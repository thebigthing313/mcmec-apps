/**
 * @simmer/supabase-tanstack-db-integration
 *
 * Generic TanStack DB collection factories backed by Supabase PostgREST.
 * Works with any Supabase project — not coupled to any generated Database type.
 *
 * Main exports:
 *   createEagerCollection   — full-table fetch, cached. Best for <1000-row lookups.
 *   createOnDemandCollection — predicate-pushdown fetch. Best for large operational tables.
 *   fetchRows / insertRows / updateRow / deleteRows — raw CRUD helpers used by factories.
 *   selectAndParse          — low-level Supabase query + Zod parse helper.
 *   parseSubsetOptions      — parses TanStack DB where/orderBy expressions into filter AST.
 *   applyFilterNode         — applies a parsed filter to a Supabase query builder.
 */

export {
	applyFilter,
	applyFilterNode,
	applyOrGroup,
	createEagerCollection,
	createOnDemandCollection,
	type EagerCollectionOptions,
	type FilterNode,
	formatFieldPath,
	IN_FILTER_BATCH_SIZE,
	isOrGroup,
	type OnDemandCollectionOptions,
	type OrGroup,
	type ParsedOrderBy,
	type ParsedSubsetOptions,
	parseSubsetOptions,
	type SimpleComparison,
} from "./collections";
export {
	deleteRows,
	fetchRows,
	insertRows,
	selectAndParse,
	type TableRegistryEntry,
	updateRow,
} from "./crud";
