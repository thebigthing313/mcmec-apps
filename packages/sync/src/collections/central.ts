import { EmployeesRowSchema } from "@mcmec/schemas/db/employees";
import { createEagerCollection } from "../factories";

export interface CreateCentralCollectionsOptions {
	/** API origin (VITE_API_URL) */
	apiUrl: string;
}

export function createCentralCollections({
	apiUrl,
}: CreateCentralCollectionsOptions) {
	const employees = createEagerCollection({
		apiUrl,
		schema: EmployeesRowSchema,
		table: "employees",
	});

	return {
		employees,
	};
}

export type CentralCollections = ReturnType<typeof createCentralCollections>;
