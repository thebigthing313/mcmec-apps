import { EmployeesRowSchema } from "@mcmec/schemas/db/employees";
import { createEagerCollection } from "../factories";

export interface CreateHrCollectionsOptions {
	/** API origin (VITE_API_URL) */
	apiUrl: string;
}

export function createHrCollections({ apiUrl }: CreateHrCollectionsOptions) {
	// On the named-command path as of #165 — the last table to cut over. `hr` and `admin` write
	// this collection through the same four `employees.*` commands, which is what stops the two
	// apps' byte-identical write call sites from being two implementations.
	const employees = createEagerCollection({
		allowDelete: true,
		apiUrl,
		commands: true,
		schema: EmployeesRowSchema,
		table: "employees",
	});

	return {
		employees,
	};
}

export type HrCollections = ReturnType<typeof createHrCollections>;
