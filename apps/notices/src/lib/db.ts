import { EmployeesRowSchema } from "@mcmec/supabase/db/employees";
import {
	InsecticidesInsertSchema,
	InsecticidesRowSchema,
	InsecticidesUpdateSchema,
} from "@mcmec/supabase/db/insecticides";
import {
	MeetingsInsertSchema,
	MeetingsRowSchema,
	MeetingsUpdateSchema,
} from "@mcmec/supabase/db/meetings";
import {
	NoticeTypesInsertSchema,
	NoticeTypesRowSchema,
	NoticeTypesUpdateSchema,
} from "@mcmec/supabase/db/notice-types";
import {
	NoticesInsertSchema,
	NoticesRowSchema,
	NoticesUpdateSchema,
} from "@mcmec/supabase/db/notices";
import { createEagerCollection } from "@mcmec/supabase-tanstack-db-integration";
import type { SupabaseClient } from "@supabase/supabase-js";
import { queryClient, supabase } from "./queryClient";

// ---------------------------------------------------------------------------
// Collections (singleton)
// ---------------------------------------------------------------------------

const typedSupabase = supabase as unknown as SupabaseClient;

export const employees = createEagerCollection({
	queryClient,
	schema: EmployeesRowSchema,
	supabase: typedSupabase,
	table: "employees",
});

export const noticeTypes = createEagerCollection({
	allowDelete: true,
	insertSchema: NoticeTypesInsertSchema,
	queryClient,
	schema: NoticeTypesRowSchema,
	supabase: typedSupabase,
	table: "notice_types",
	updateSchema: NoticeTypesUpdateSchema,
});

export const notices = createEagerCollection({
	allowDelete: true,
	insertSchema: NoticesInsertSchema,
	queryClient,
	schema: NoticesRowSchema,
	supabase: typedSupabase,
	table: "notices",
	updateSchema: NoticesUpdateSchema,
});

export const meetings = createEagerCollection({
	allowDelete: true,
	insertSchema: MeetingsInsertSchema,
	queryClient,
	schema: MeetingsRowSchema,
	supabase: typedSupabase,
	table: "meetings",
	updateSchema: MeetingsUpdateSchema,
});

export const insecticides = createEagerCollection({
	allowDelete: true,
	insertSchema: InsecticidesInsertSchema,
	queryClient,
	schema: InsecticidesRowSchema,
	supabase: typedSupabase,
	table: "insecticides",
	updateSchema: InsecticidesUpdateSchema,
});

// ---------------------------------------------------------------------------
// Db accessor
// ---------------------------------------------------------------------------

const db = {
	employees,
	insecticides,
	meetings,
	noticeTypes,
	notices,
} as const;

export type Db = typeof db;

export function useDb(): Db {
	return db;
}
