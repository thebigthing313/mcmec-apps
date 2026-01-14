import {
	fetchProfiles,
	type ProfilesRowType,
} from "@mcmec/supabase/db/profiles";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { queryClient, supabase } from "../queryClient";

export const profiles = createCollection(
	queryCollectionOptions<ProfilesRowType>({
		getKey: (item) => item.id,
		id: "profiles",
		queryClient,
		queryFn: () => fetchProfiles(supabase),
		queryKey: ["profiles"],
		staleTime: 1000 * 60 * 30,
		syncMode: "eager",
	}),
);
