import { createEagerCollection } from "@mcmec/supabase-tanstack-db-integration";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/query-core";
import type { Database } from "../database.types.ts";
import { EmployeesRowSchema } from "../db/employees";

export interface CreateCentralCollectionsOptions {
	supabase: SupabaseClient<Database>;
	queryClient: QueryClient;
}

export function createCentralCollections({
	supabase,
	queryClient,
}: CreateCentralCollectionsOptions) {
	const employees = createEagerCollection({
		queryClient,
		schema: EmployeesRowSchema,
		supabase,
		table: "employees",
	});

	return {
		employees,
	};
}

export type CentralCollections = ReturnType<typeof createCentralCollections>;
