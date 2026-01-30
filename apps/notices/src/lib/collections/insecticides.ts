import { ErrorMessages } from "@mcmec/lib/constants/errors";
import type { Table } from "@mcmec/supabase/data-types";
import {
	fetchInsecticides,
	InsecticidesInsertSchema,
	type InsecticidesRowType,
	InsecticidesUpdateSchema,
} from "@mcmec/supabase/db/insecticides";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { queryClient, supabase } from "../queryClient";

const table: Table = "insecticides";

export const insecticides = createCollection(
	queryCollectionOptions<InsecticidesRowType>({
		getKey: (item) => item.id,
		id: table,
		onDelete: async ({ transaction }) => {
			const deletedKeys = transaction.mutations.map((m) => m.key);
			const { error } = await supabase
				.from(table)
				.delete()
				.in("id", deletedKeys);
			if (error) {
				throw new Error(
					ErrorMessages.DATABASE.UNABLE_TO_DELETE(table, error.message),
				);
			}
		},
		onInsert: async ({ transaction }) => {
			const newItems = transaction.mutations.map((m) => m.modified);
			const parsedItems = newItems.map((item) =>
				InsecticidesInsertSchema.parse(item),
			);
			const { error } = await supabase.from(table).insert(parsedItems);
			if (error) {
				throw new Error(
					ErrorMessages.DATABASE.UNABLE_TO_INSERT(table, error.message),
				);
			}
		},
		onUpdate: async ({ transaction }) => {
			const updatedKeys = transaction.mutations.map((m) => m.key);
			const localChanges = transaction.mutations[0].changes;
			const parsedLocalChanges = InsecticidesUpdateSchema.parse(localChanges);
			const { error } = await supabase
				.from(table)
				.update(parsedLocalChanges)
				.in("id", updatedKeys);
			if (error) {
				throw new Error(
					ErrorMessages.DATABASE.UNABLE_TO_UPDATE(table, error.message),
				);
			}
		},
		queryClient,
		queryFn: () => fetchInsecticides(supabase),
		queryKey: [table],
		staleTime: 1000 * 60 * 30,
		syncMode: "eager",
	}),
);
