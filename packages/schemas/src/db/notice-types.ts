import z from "zod";

export const NoticeTypesRowSchema = z.object({
	created_at: z.coerce.date<Date>(),
	description: z.string().nullable(),
	id: z.uuid(),
	name: z.string(),
	updated_at: z.coerce.date<Date>(),
});

export type NoticeTypesRowType = z.infer<typeof NoticeTypesRowSchema>;
