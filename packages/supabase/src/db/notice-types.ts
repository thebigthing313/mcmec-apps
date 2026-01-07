import { ErrorMessages } from "@mcmec/lib/constants/errors";
import z from "zod";
import type { SupabaseClient } from "../client";

export const NoticeTypesRowSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	description: z.string().nullable(),
	created_at: z.coerce.date(),
	created_by: z.string().nullable(),
	updated_at: z.coerce.date(),
	updated_by: z.string().nullable(),
});

export const NoticeTypesInsertSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	description: z.string().optional(),
});

export const NoticeTypesUpdateSchema = z.object({
	name: z.string().optional(),
	description: z.string().nullable().optional(),
});

export type NoticeTypesRowType = z.infer<typeof NoticeTypesRowSchema>;
export type NoticeTypesInsertType = z.infer<typeof NoticeTypesInsertSchema>;
export type NoticeTypesUpdateType = z.infer<typeof NoticeTypesUpdateSchema>;

export async function fetchNoticeTypes(
	supabase: SupabaseClient,
): Promise<Array<NoticeTypesRowType>> {
	const { data, error } = await supabase.from("notice_types").select("*");

	if (error) {
		throw new Error(ErrorMessages.DATABASE.UNABLE_TO_FETCH("notice_types"));
	}

	const parsedData = NoticeTypesRowSchema.array().parse(data);
	return parsedData;
}
