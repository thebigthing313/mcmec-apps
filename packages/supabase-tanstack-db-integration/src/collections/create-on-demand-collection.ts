/**
 * On-demand collection factory — Electric-backed.
 *
 * Uses Electric's `on-demand` sync mode: the collection is ready immediately and syncs
 * incremental snapshots as live queries request them. Best for larger operational tables.
 *
 * NOTE: the shape proxy narrows the shape server-side (permission `where`), so on-demand
 * snapshots are bounded by what the session may read; client-side filtering stays in
 * live-query `where()`. The old PostgREST predicate pushdown no longer applies.
 */
import type z from "zod";
import type { ZodObject } from "zod";
import {
	createElectricCollection,
	type ElectricCollectionOptions,
} from "./electric-collection";

export type OnDemandCollectionOptions<
	TSchema extends ZodObject<z.ZodRawShape>,
	TInsertSchema extends ZodObject<z.ZodRawShape>,
	TUpdateSchema extends ZodObject<z.ZodRawShape>,
> = ElectricCollectionOptions<TSchema, TInsertSchema, TUpdateSchema>;

export function createOnDemandCollection<
	TSchema extends ZodObject<z.ZodRawShape> & {
		_zod: { output: { id: string } };
	},
	TInsertSchema extends ZodObject<z.ZodRawShape>,
	TUpdateSchema extends ZodObject<z.ZodRawShape>,
>(options: OnDemandCollectionOptions<TSchema, TInsertSchema, TUpdateSchema>) {
	return createElectricCollection(options, "on-demand", true);
}
