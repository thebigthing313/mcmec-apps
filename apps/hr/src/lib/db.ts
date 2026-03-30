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

const EmployeesInsertSchema = z.object({
	display_name: z.string(),
	display_title: z.string().nullable().optional(),
	email: z.string(),
});

const EmployeesUpdateSchema = z.object({
	display_name: z.string().optional(),
	display_title: z.string().nullable().optional(),
	email: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Collections (singleton)
// ---------------------------------------------------------------------------

export const employees = createEagerCollection({
	allowDelete: true,
	insertSchema: EmployeesInsertSchema,
	queryClient,
	schema: EmployeesRowSchema,
	supabase,
	table: "employees",
	updateSchema: EmployeesUpdateSchema,
});

// ---------------------------------------------------------------------------
// Db accessor
// ---------------------------------------------------------------------------

const db = {
	employees,
} as const;

export type Db = typeof db;

export function useDb(): Db {
	return db;
}
