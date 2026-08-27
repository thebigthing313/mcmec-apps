import { EmployeesRowSchema } from "@mcmec/schemas/db/employees";
import { createEagerCollection } from "../factories";

export interface CreateCentralCollectionsOptions {
	/** API origin (VITE_API_URL) */
	apiUrl: string;
}

export function createCentralCollections({
	apiUrl,
}: CreateCentralCollectionsOptions) {
	// Read-only here, and `commands: true` all the same: the flag says how the TABLE is
	// written, not whether this app writes it (#174). `employees` cut over with #165.
	const employees = createEagerCollection({
		apiUrl,
		commands: true,
		schema: EmployeesRowSchema,
		table: "employees",
	});

	return {
		employees,
	};
}

export type CentralCollections = ReturnType<typeof createCentralCollections>;
