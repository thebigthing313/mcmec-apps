import { ErrorMessages } from "@mcmec/lib/constants/errors";
import z from "zod";
import type { SupabaseClient } from "../client";

export const NoticesRowSchema = z.object({
	content: z.any(),
	created_at: z.coerce.date(),
	created_by: z.string().nullable(),
	id: z.uuid(),
	is_archived: z.boolean(),
	is_published: z.boolean(),
	notice_date: z.coerce.date(),
	notice_type_id: z.uuid(),
	title: z.string(),
	updated_at: z.coerce.date(),
	updated_by: z.string().nullable(),
});

export const NoticesInsertSchema = z.object({
	content: z.any(),
	id: z.uuid(),
	is_archived: z.boolean(),
	is_published: z.boolean(),
	notice_date: z.coerce.date().transform((date) => date.toISOString()),
	notice_type_id: z.uuid(),
	title: z.string(),
});

export const NoticesUpdateSchema = z.object({
	content: z.any().optional(),
	is_archived: z.boolean().optional(),
	is_published: z.boolean().optional(),
	notice_date: z.coerce
		.date()
		.optional()
		.transform((date) => (date ? date.toISOString() : date)),
	notice_type_id: z.uuid().optional(),
	title: z.string().optional(),
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
