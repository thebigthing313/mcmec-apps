import {
	fetchMeetings,
	type MeetingsRowType,
} from "@mcmec/supabase/db/meetings";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { queryClient, supabase } from "../queryClient";

export const meetings = createCollection(
	queryCollectionOptions<MeetingsRowType>({
		getKey: (item) => item.id,
		id: "meetings",
		queryClient,
		queryFn: () => fetchMeetings(supabase),
		queryKey: ["meetings"],
		staleTime: 1000 * 60 * 30,
		syncMode: "eager",
	}),
);
