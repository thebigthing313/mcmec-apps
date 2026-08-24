import {
	EmployeesInsertSchema,
	EmployeesRowSchema,
	EmployeesUpdateSchema,
} from "@mcmec/schemas/db/employees";
import { createEagerCollection } from "../factories";

export interface CreateAdminCollectionsOptions {
	/** API origin (VITE_API_URL) */
	apiUrl: string;
}

// The old `permissions` / `user_permissions` collections are gone — authorization is now
// Better Auth roles, assigned via PUT /api/users/:id/roles (not a synced collection).
export function createAdminCollections({
	apiUrl,
}: CreateAdminCollectionsOptions) {
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

export type AdminCollections = ReturnType<typeof createAdminCollections>;
