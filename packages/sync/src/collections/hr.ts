import {
	EmployeesInsertSchema,
	EmployeesRowSchema,
	EmployeesUpdateSchema,
} from "@mcmec/schemas/db/employees";
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

	return {
		employees,
	};
}

export type HrCollections = ReturnType<typeof createHrCollections>;
