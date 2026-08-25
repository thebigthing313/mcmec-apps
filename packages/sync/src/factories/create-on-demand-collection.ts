/**
 * On-demand collection factory — Electric-backed.
 *
 * Uses Electric's `on-demand` sync mode: the collection is ready immediately and syncs
 * incremental snapshots as live queries request them. Best for larger operational tables.
 *
 * REQUIRES the shape proxy to forward `log` and the `subset__*` params — on-demand syncing
 * sends `log=changes_only` plus `subset__where` / `subset__order_by` / `subset__params` to
 * pull slices. If those are dropped the collection doesn't fail loudly, it just syncs
 * nothing, which is how this surfaced once: a 178-row table rendering as "0 of 0".
 *
 * Forwarding them is safe because Electric intersects a subset with the shape's own `where`
 * rather than replacing it — see the note on `SAFE_PARAM_PREFIX` in apps/api/src/shapes.ts.
 *
 * NOTE: the shape proxy narrows the shape server-side (permission `where`), so on-demand
 * snapshots are bounded by what the session may read; client-side filtering stays in
 * live-query `where()`. The old PostgREST predicate pushdown no longer applies.
 */
import type { TableName } from "@mcmec/schemas/tables";
import type z from "zod";
import type { ZodObject } from "zod";
import {
	createElectricCollection,
	type ElectricCollectionOptions,
} from "./electric-collection";

export type OnDemandCollectionOptions<
	TTable extends TableName,
	TSchema extends ZodObject<z.ZodRawShape>,
	TInsertSchema extends ZodObject<z.ZodRawShape>,
	TUpdateSchema extends ZodObject<z.ZodRawShape>,
> = ElectricCollectionOptions<TTable, TSchema, TInsertSchema, TUpdateSchema>;

export function createOnDemandCollection<
	TTable extends TableName,
	TSchema extends ZodObject<z.ZodRawShape> & {
		_zod: { output: { id: string } };
	},
	TInsertSchema extends ZodObject<z.ZodRawShape>,
	TUpdateSchema extends ZodObject<z.ZodRawShape>,
>(
	options: OnDemandCollectionOptions<
		TTable,
		TSchema,
		TInsertSchema,
		TUpdateSchema
	>,
) {
	return createElectricCollection(options, "on-demand", true);
}
