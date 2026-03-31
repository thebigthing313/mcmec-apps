// @mcmec/supabase — data layer

export type { SupabaseClient } from "./client";
// Client
export { createClient } from "./client";
// Collections
export {
	type CreateNoticesCollectionsOptions,
	createNoticesCollections,
	type NoticesCollections,
} from "./collections/notices";
// Database types
export type { Database } from "./database.types";
// Schemas
export {
	EmployeesRowSchema,
	type EmployeesRowType,
} from "./db/employees";
export {
	InsecticidesInsertSchema,
	type InsecticidesInsertType,
	InsecticidesRowSchema,
	type InsecticidesRowType,
	InsecticidesUpdateSchema,
	type InsecticidesUpdateType,
} from "./db/insecticides";
export {
	MeetingsInsertSchema,
	type MeetingsInsertType,
	MeetingsRowSchema,
	type MeetingsRowType,
	MeetingsUpdateSchema,
	type MeetingsUpdateType,
} from "./db/meetings";
export {
	NoticeTypesInsertSchema,
	type NoticeTypesInsertType,
	NoticeTypesRowSchema,
	type NoticeTypesRowType,
	NoticeTypesUpdateSchema,
	type NoticeTypesUpdateType,
} from "./db/notice-types";
export {
	NoticesInsertSchema,
	type NoticesInsertType,
	NoticesRowSchema,
	type NoticesRowType,
	NoticesUpdateSchema,
	type NoticesUpdateType,
} from "./db/notices";
