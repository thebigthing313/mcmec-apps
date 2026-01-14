import { fetchNotices, type NoticesRowType } from "@mcmec/supabase/db/notices";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { queryClient, supabase } from "../queryClient";

export const notices = createCollection(
	queryCollectionOptions<NoticesRowType>({
		getKey: (item) => item.id,
		id: "notices",
		queryClient,
		queryFn: () => fetchNotices(supabase),
		queryKey: ["notices"],
		staleTime: 1000 * 60 * 30,
		syncMode: "eager",
	}),
);
