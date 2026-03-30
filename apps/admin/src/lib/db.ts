import { createEagerCollection } from "@mcmec/supabase-tanstack-db-integration";
import z from "zod";
import { queryClient, supabaseUntyped as supabase } from "./queryClient";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const EmployeesRowSchema = z.object({
	created_at: z.coerce.date(),
	created_by: z.uuid().nullable(),
	display_name: z.string(),
	display_title: z.string().nullable(),
	email: z.string(),
	id: z.uuid(),
	updated_at: z.coerce.date(),
	updated_by: z.uuid().nullable(),
	user_id: z.uuid().nullable(),
});

const PermissionsRowSchema = z.object({
	created_at: z.coerce.date(),
	id: z.uuid(),
	permission_description: z.string().nullable(),
	permission_name: z.string(),
});

const UserPermissionsRowSchema = z.object({
	created_at: z.coerce.date(),
	created_by: z.uuid().nullable(),
	id: z.uuid(),
	permission_name: z.string(),
	updated_at: z.coerce.date(),
	updated_by: z.uuid().nullable(),
	user_id: z.uuid(),
});

const UserPermissionsInsertSchema = z.object({
	id: z.uuid(),
	permission_name: z.string(),
	user_id: z.uuid(),
});

// ---------------------------------------------------------------------------
// Collections (singleton)
// ---------------------------------------------------------------------------

export const employees = createEagerCollection({
	queryClient,
	schema: EmployeesRowSchema,
	supabase,
	table: "employees",
});

export const permissions = createEagerCollection({
	queryClient,
	schema: PermissionsRowSchema,
	supabase,
	table: "permissions",
});

export const userPermissions = createEagerCollection({
	allowDelete: true,
	insertSchema: UserPermissionsInsertSchema,
	queryClient,
	schema: UserPermissionsRowSchema,
	supabase,
	table: "user_permissions",
});

// ---------------------------------------------------------------------------
// Db accessor
// ---------------------------------------------------------------------------

const db = {
	employees,
	permissions,
	userPermissions,
} as const;

export type Db = typeof db;

export function useDb(): Db {
	return db;
}
