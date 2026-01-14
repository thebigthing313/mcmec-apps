import {
	fetchProfiles,
	type ProfilesRowType,
} from "@mcmec/supabase/db/profiles";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { queryClient, supabase } from "../queryClient";

export const profiles = createCollection(
	queryCollectionOptions<ProfilesRowType>({
		id: "profiles",
		queryKey: ["profiles"],
		queryFn: () => fetchProfiles(supabase),
		queryClient,
		getKey: (item) => item.id,
		syncMode: "eager",
		staleTime: 1000 * 60 * 30,
	}),
);
