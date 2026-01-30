import {
	fetchInsecticides,
	type InsecticidesRowType,
} from "@mcmec/supabase/db/insecticides";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { queryClient, supabase } from "../queryClient";

export const insecticides = createCollection(
	queryCollectionOptions<InsecticidesRowType>({
		getKey: (item) => item.id,
		id: "insecticides",
		queryClient,
		queryFn: () => fetchInsecticides(supabase),
		queryKey: ["insecticides"],
		staleTime: 1000 * 60 * 30,
		syncMode: "eager",
	}),
);
