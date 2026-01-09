import { ErrorMessages } from "@mcmec/lib/constants/errors";
import z from "zod";
import type { SupabaseClient } from "../client";

export const NoticesRowSchema = z.object({
	id: z.uuid(),
	notice_type_id: z.uuid(),
	title: z.string(),
	notice_date: z.coerce.date(),
	content: z.any(),
	publish_at: z.coerce.date().nullable(),
	created_at: z.coerce.date(),
	created_by: z.string().nullable(),
	updated_at: z.coerce.date(),
	updated_by: z.string().nullable(),
});

export const NoticesInsertSchema = z.object({
	id: z.uuid(),
	notice_type_id: z.uuid(),
	title: z.string(),
	notice_date: z.coerce.date(),
	content: z.any(),
	publish_at: z.coerce.date().nullable().optional(),
});

export const NoticesUpdateSchema = z.object({
	notice_type_id: z.uuid().optional(),
	title: z.string().optional(),
	notice_date: z.coerce.date().optional(),
	content: z.any().optional(),
	publish_at: z.coerce.date().nullable().optional(),
});

export type NoticesRowType = z.infer<typeof NoticesRowSchema>;
export type NoticesInsertType = z.infer<typeof NoticesInsertSchema>;
export type NoticesUpdateType = z.infer<typeof NoticesUpdateSchema>;

export async function fetchNotices(
	supabase: SupabaseClient,
): Promise<Array<NoticesRowType>> {
	const { data, error } = await supabase.from("notices").select("*");
	if (error) {
		throw new Error(ErrorMessages.DATABASE.UNABLE_TO_FETCH("notices"));
	}
	const parsedData = NoticesRowSchema.array().parse(data);
	return parsedData;
}
