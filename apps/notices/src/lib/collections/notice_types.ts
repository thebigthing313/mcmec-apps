import {
	fetchNoticeTypes,
	NoticeTypesInsertSchema,
	type NoticeTypesRowType,
	NoticeTypesUpdateSchema,
} from "@mcmec/supabase/db/notice-types";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { queryClient, supabase } from "../../main";

export const notice_types = createCollection(
	queryCollectionOptions<NoticeTypesRowType>({
		id: "notice_types",
		queryKey: ["notice_types"],
		queryFn: () => fetchNoticeTypes(supabase),
		queryClient,
		getKey: (item) => item.id,
		syncMode: "eager",
		staleTime: 1000 * 60 * 30,
		onInsert: async ({ transaction }) => {
			const newItems = transaction.mutations.map((m) => m.modified);
			const parsedItems = newItems.map((item) =>
				NoticeTypesInsertSchema.parse(item),
			);
			await supabase.from("notice_types").insert(parsedItems);
		},
		onUpdate: async ({ transaction }) => {
			const updatedKeys = transaction.mutations.map((m) => m.key);
			const localChanges = transaction.mutations[0].changes;
			const parsedLocalChanges = NoticeTypesUpdateSchema.parse(localChanges);
			await supabase
				.from("notice_types")
				.update(parsedLocalChanges)
				.in("id", updatedKeys);
		},
	}),
);
