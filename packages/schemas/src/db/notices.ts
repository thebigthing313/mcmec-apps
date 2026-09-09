import z from "zod";

export const NoticesRowSchema = z.object({
	content: z.any(),
	created_at: z.coerce.date<Date>(),
	id: z.uuid(),
	is_archived: z.boolean(),
	is_published: z.boolean(),
	notice_date: z.coerce.date<Date>(),
	notice_type_id: z.uuid(),
	title: z.string(),
	updated_at: z.coerce.date<Date>(),
});

export type NoticesRowType = z.infer<typeof NoticesRowSchema>;
