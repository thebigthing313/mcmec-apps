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
import { queryClient, supabase } from "./queryClient";

export const employees = createEagerCollection({
	queryClient,
	schema: EmployeesRowSchema,
	supabase,
	table: "employees",
});

export const noticeTypes = createEagerCollection({
	allowDelete: true,
	insertSchema: NoticeTypesInsertSchema,
	queryClient,
	schema: NoticeTypesRowSchema,
	supabase,
	table: "notice_types",
	updateSchema: NoticeTypesUpdateSchema,
});

export const notices = createEagerCollection({
	allowDelete: true,
	insertSchema: NoticesInsertSchema,
	queryClient,
	schema: NoticesRowSchema,
	supabase,
	table: "notices",
	updateSchema: NoticesUpdateSchema,
});

export const meetings = createEagerCollection({
	allowDelete: true,
	insertSchema: MeetingsInsertSchema,
	queryClient,
	schema: MeetingsRowSchema,
	supabase,
	table: "meetings",
	updateSchema: MeetingsUpdateSchema,
});

export const insecticides = createEagerCollection({
	allowDelete: true,
	insertSchema: InsecticidesInsertSchema,
	queryClient,
	schema: InsecticidesRowSchema,
	supabase,
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
