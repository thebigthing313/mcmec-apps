import { createEagerCollection } from "@mcmec/supabase-tanstack-db-integration";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/query-core";
import type { Database } from "../database.types.ts";
import {
	EmployeesInsertSchema,
	EmployeesRowSchema,
	EmployeesUpdateSchema,
} from "../db/employees";
import {
	JobPostingsInsertSchema,
	JobPostingsRowSchema,
	JobPostingsUpdateSchema,
} from "../db/job-postings";

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

	const jobPostings = createEagerCollection({
		allowDelete: true,
		insertSchema: JobPostingsInsertSchema,
		queryClient,
		schema: JobPostingsRowSchema,
		supabase,
		table: "job_postings",
		updateSchema: JobPostingsUpdateSchema,
	});

	return {
		employees,
		jobPostings,
	};
}

export type HrCollections = ReturnType<typeof createHrCollections>;
