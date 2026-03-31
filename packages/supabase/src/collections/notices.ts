import { createEagerCollection } from "@mcmec/supabase-tanstack-db-integration";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/query-core";
import type { Database } from "../database.types.ts";
import { EmployeesRowSchema } from "../db/employees";
import {
	InsecticidesInsertSchema,
	InsecticidesRowSchema,
	InsecticidesUpdateSchema,
} from "../db/insecticides";
import {
	MeetingsInsertSchema,
	MeetingsRowSchema,
	MeetingsUpdateSchema,
} from "../db/meetings";
import {
	NoticeTypesInsertSchema,
	NoticeTypesRowSchema,
	NoticeTypesUpdateSchema,
} from "../db/notice-types";
import {
	NoticesInsertSchema,
	NoticesRowSchema,
	NoticesUpdateSchema,
} from "../db/notices";

export interface CreateNoticesCollectionsOptions {
	supabase: SupabaseClient<Database>;
	queryClient: QueryClient;
}

export function createNoticesCollections({
	supabase,
	queryClient,
}: CreateNoticesCollectionsOptions) {
	const employees = createEagerCollection({
		queryClient,
		schema: EmployeesRowSchema,
		supabase,
		table: "employees",
	});

	const noticeTypes = createEagerCollection({
		allowDelete: true,
		insertSchema: NoticeTypesInsertSchema,
		queryClient,
		schema: NoticeTypesRowSchema,
		supabase,
		table: "notice_types",
		updateSchema: NoticeTypesUpdateSchema,
	});

	const notices = createEagerCollection({
		allowDelete: true,
		insertSchema: NoticesInsertSchema,
		queryClient,
		schema: NoticesRowSchema,
		supabase,
		table: "notices",
		updateSchema: NoticesUpdateSchema,
	});

	const meetings = createEagerCollection({
		allowDelete: true,
		insertSchema: MeetingsInsertSchema,
		queryClient,
		schema: MeetingsRowSchema,
		supabase,
		table: "meetings",
		updateSchema: MeetingsUpdateSchema,
	});

	const insecticides = createEagerCollection({
		allowDelete: true,
		insertSchema: InsecticidesInsertSchema,
		queryClient,
		schema: InsecticidesRowSchema,
		supabase,
		table: "insecticides",
		updateSchema: InsecticidesUpdateSchema,
	});

	return {
		employees,
		insecticides,
		meetings,
		noticeTypes,
		notices,
	} as const;
}

export type NoticesCollections = ReturnType<typeof createNoticesCollections>;
