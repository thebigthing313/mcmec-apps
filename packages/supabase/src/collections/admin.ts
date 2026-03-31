import { createEagerCollection } from "@mcmec/supabase-tanstack-db-integration";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/query-core";
import type { Database } from "../database.types.ts";
import {
	EmployeesInsertSchema,
	EmployeesRowSchema,
	EmployeesUpdateSchema,
} from "../db/employees";
import { PermissionsRowSchema } from "../db/permissions";
import {
	UserPermissionsInsertSchema,
	UserPermissionsRowSchema,
} from "../db/user-permissions";

export interface CreateAdminCollectionsOptions {
	supabase: SupabaseClient<Database>;
	queryClient: QueryClient;
}

export function createAdminCollections({
	supabase,
	queryClient,
}: CreateAdminCollectionsOptions) {
	const employees = createEagerCollection({
		allowDelete: true,
		insertSchema: EmployeesInsertSchema,
		queryClient,
		schema: EmployeesRowSchema,
		supabase,
		table: "employees",
		updateSchema: EmployeesUpdateSchema,
	});

	const permissions = createEagerCollection({
		queryClient,
		schema: PermissionsRowSchema,
		supabase,
		table: "permissions",
	});

	const userPermissions = createEagerCollection({
		allowDelete: true,
		insertSchema: UserPermissionsInsertSchema,
		queryClient,
		schema: UserPermissionsRowSchema,
		supabase,
		table: "user_permissions",
	});

	return {
		employees,
		permissions,
		userPermissions,
	};
}

export type AdminCollections = ReturnType<typeof createAdminCollections>;
