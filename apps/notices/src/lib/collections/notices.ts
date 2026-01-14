import {
	fetchNotices,
	NoticesInsertSchema,
	type NoticesRowType,
	NoticesUpdateSchema,
} from "@mcmec/supabase/db/notices";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { queryClient, supabase } from "../queryClient";

export const notices = createCollection(
	queryCollectionOptions<NoticesRowType>({
		getKey: (item) => item.id,
		id: "notices",
		onDelete: async ({ transaction }) => {
			const deletedKeys = transaction.mutations.map((m) => m.key);
			await supabase.from("notices").delete().in("id", deletedKeys);
		},
		onInsert: async ({ transaction }) => {
			const newItems = transaction.mutations.map((m) => m.modified);
			const parsedItems = newItems.map((item) =>
				NoticesInsertSchema.parse(item),
			);
			await supabase.from("notices").insert(parsedItems);
		},
		onUpdate: async ({ transaction }) => {
			const updatedKeys = transaction.mutations.map((m) => m.key);
			const localChanges = transaction.mutations[0].changes;
			const parsedLocalChanges = NoticesUpdateSchema.parse(localChanges);
			await supabase
				.from("notices")
				.update(parsedLocalChanges)
				.in("id", updatedKeys);
		},
		queryClient,
		queryFn: () => fetchNotices(supabase),
		queryKey: ["notices"],
		staleTime: 1000 * 60 * 30,
		syncMode: "eager",
	}),
);
