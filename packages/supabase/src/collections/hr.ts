import { createEagerCollection } from "@mcmec/supabase-tanstack-db-integration";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/query-core";
import type { Database } from "../database.types.ts";
import {
	EmployeesInsertSchema,
	EmployeesRowSchema,
	EmployeesUpdateSchema,
} from "../db/employees";

export interface CreateHrCollectionsOptions {
	supabase: SupabaseClient<Database>;
	queryClient: QueryClient;
}

export function createHrCollections({
	supabase,
	queryClient,
}: CreateHrCollectionsOptions) {
	const employees = createEagerCollection({
		allowDelete: true,
		insertSchema: EmployeesInsertSchema,
		queryClient,
		schema: EmployeesRowSchema,
		supabase,
		table: "employees",
		updateSchema: EmployeesUpdateSchema,
	});

	return {
		employees,
	};
}

export type HrCollections = ReturnType<typeof createHrCollections>;
