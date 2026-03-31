import z from "zod";

export const NoticeTypesRowSchema = z.object({
	created_at: z.coerce.date(),
	created_by: z.string().nullable(),
	description: z.string().nullable(),
	id: z.uuid(),
	name: z.string(),
	updated_at: z.coerce.date(),
	updated_by: z.string().nullable(),
});

export const NoticeTypesInsertSchema = z.object({
	description: z.string().nullable(),
	id: z.uuid(),
	name: z.string(),
});

export const NoticeTypesUpdateSchema = z.object({
	description: z.string().nullable().optional(),
	name: z.string().optional(),
});

export type NoticeTypesRowType = z.infer<typeof NoticeTypesRowSchema>;
export type NoticeTypesInsertType = z.infer<typeof NoticeTypesInsertSchema>;
export type NoticeTypesUpdateType = z.infer<typeof NoticeTypesUpdateSchema>;
