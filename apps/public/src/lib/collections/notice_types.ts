import {
	fetchNoticeTypes,
	type NoticeTypesRowType,
} from "@mcmec/supabase/db/notice-types";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { queryClient, supabase } from "../queryClient";

export const notice_types = createCollection(
	queryCollectionOptions<NoticeTypesRowType>({
		getKey: (item) => item.id,
		id: "notice_types",
		queryClient,
		queryFn: () => fetchNoticeTypes(supabase),
		queryKey: ["notice_types"],
		staleTime: 1000 * 60 * 30,
		syncMode: "eager",
	}),
);
