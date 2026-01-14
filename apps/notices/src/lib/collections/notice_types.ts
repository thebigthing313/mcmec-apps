import { ErrorMessages } from "@mcmec/lib/constants/errors";
import {
	fetchNoticeTypes,
	NoticeTypesInsertSchema,
	type NoticeTypesRowType,
	NoticeTypesUpdateSchema,
} from "@mcmec/supabase/db/notice-types";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { queryClient, supabase } from "../queryClient";

export const notice_types = createCollection(
	queryCollectionOptions<NoticeTypesRowType>({
		getKey: (item) => item.id,
		id: "notice_types",
		onDelete: async ({ transaction }) => {
			const deletedKeys = transaction.mutations.map((m) => m.key);
			const { error } = await supabase
				.from("notice_types")
				.delete()
				.in("id", deletedKeys);
			if (error) {
				throw new Error(
					ErrorMessages.DATABASE.UNABLE_TO_DELETE(
						"notice_types",
						error.message,
					),
				);
			}
		},
		onInsert: async ({ transaction }) => {
			const newItems = transaction.mutations.map((m) => m.modified);
			const parsedItems = newItems.map((item) =>
				NoticeTypesInsertSchema.parse(item),
			);
			const { error } = await supabase.from("notice_types").insert(parsedItems);
			if (error) {
				throw new Error(
					ErrorMessages.DATABASE.UNABLE_TO_INSERT(
						"notice_types",
						error.message,
					),
				);
			}
		},
		onUpdate: async ({ transaction }) => {
			const updatedKeys = transaction.mutations.map((m) => m.key);
			const localChanges = transaction.mutations[0].changes;
			const parsedLocalChanges = NoticeTypesUpdateSchema.parse(localChanges);
			const { error } = await supabase
				.from("notice_types")
				.update(parsedLocalChanges)
				.in("id", updatedKeys);
			if (error) {
				throw new Error(
					ErrorMessages.DATABASE.UNABLE_TO_UPDATE(
						"notice_types",
						error.message,
					),
				);
			}
		},
		queryClient,
		queryFn: () => fetchNoticeTypes(supabase),
		queryKey: ["notice_types"],
		staleTime: 1000 * 60 * 30,
		syncMode: "eager",
	}),
);
