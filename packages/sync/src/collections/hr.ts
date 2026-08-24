import {
	EmployeesInsertSchema,
	EmployeesRowSchema,
	EmployeesUpdateSchema,
} from "@mcmec/schemas/db/employees";
import {
	JobPostingsInsertSchema,
	JobPostingsRowSchema,
	JobPostingsUpdateSchema,
} from "@mcmec/schemas/db/job-postings";
import { createEagerCollection } from "../factories";

export interface CreateHrCollectionsOptions {
	/** API origin (VITE_API_URL) */
	apiUrl: string;
}

export function createHrCollections({ apiUrl }: CreateHrCollectionsOptions) {
	const employees = createEagerCollection({
		allowDelete: true,
		apiUrl,
		insertSchema: EmployeesInsertSchema,
		schema: EmployeesRowSchema,
		table: "employees",
		updateSchema: EmployeesUpdateSchema,
	});

	const jobPostings = createEagerCollection({
		allowDelete: true,
		apiUrl,
		insertSchema: JobPostingsInsertSchema,
		schema: JobPostingsRowSchema,
		table: "job_postings",
		updateSchema: JobPostingsUpdateSchema,
	});

	return {
		employees,
		jobPostings,
	};
}

export type HrCollections = ReturnType<typeof createHrCollections>;
