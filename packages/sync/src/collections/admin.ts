import { EmployeesRowSchema } from "@mcmec/schemas/db/employees";
import { createEagerCollection } from "../factories";

export interface CreateAdminCollectionsOptions {
	/** API origin (VITE_API_URL) */
	apiUrl: string;
}

// The old `permissions` / `user_permissions` collections are gone — authorization is Better Auth
// roles, granted and revoked by `users.grantAppRole` / `users.revokeAppRole` against a user list
// the admin plugin serves, not by writing a synced collection.
export function createAdminCollections({
	apiUrl,
}: CreateAdminCollectionsOptions) {
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

export type AdminCollections = ReturnType<typeof createAdminCollections>;
