/**
 * Eager collection factory — Electric-backed.
 *
 * Streams the entire (server-narrowed) shape on first sync. Best for lookup/reference
 * tables with a bounded row count. `startSync: false` defers the stream until the
 * collection is first previewed/preloaded (route loaders call `.preload()`).
 */
import type { TableName } from "@mcmec/schemas/tables";
import type z from "zod";
import type { ZodObject } from "zod";
import {
	createElectricCollection,
	type ElectricCollectionOptions,
} from "./electric-collection";

export type EagerCollectionOptions<
	TTable extends TableName,
	TSchema extends ZodObject<z.ZodRawShape>,
> = ElectricCollectionOptions<TTable, TSchema>;

export function createEagerCollection<
	TTable extends TableName,
	TSchema extends ZodObject<z.ZodRawShape> & {
		_zod: { output: { id: string } };
	},
>(options: EagerCollectionOptions<TTable, TSchema>) {
	return createElectricCollection(options, "eager", false);
}
