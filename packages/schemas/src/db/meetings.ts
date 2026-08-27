import z from "zod";

export const MeetingsRowSchema = z.object({
	created_at: z.coerce.date<Date>(),
	id: z.uuid(),
	is_cancelled: z.boolean(),
	location: z.string(),
	meeting_at: z.coerce.date<Date>(),
	minutes_url: z.url().nullable(),
	name: z.string(),
	notes: z.string().nullable(),
	notice_url: z.url().nullable(),
	updated_at: z.coerce.date<Date>(),
});

export type MeetingsRowType = z.infer<typeof MeetingsRowSchema>;
