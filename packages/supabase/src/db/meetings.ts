import z from "zod";

export const MeetingsRowSchema = z.object({
	agenda_url: z.url().nullable(),
	created_at: z.coerce.date(),
	created_by: z.string().nullable(),
	id: z.uuid(),
	is_cancelled: z.boolean(),
	location: z.string(),
	meeting_at: z.coerce.date(),
	minutes_url: z.url().nullable(),
	name: z.string(),
	notes: z.string().nullable(),
	notice_url: z.url().nullable(),
	report_url: z.url().nullable(),
	updated_at: z.coerce.date(),
	updated_by: z.string().nullable(),
});

export const MeetingsInsertSchema = z.object({
	agenda_url: z.url().nullable().optional(),
	id: z.uuid(),
	is_cancelled: z.boolean(),
	location: z.string(),
	meeting_at: z.coerce.date().transform((date) => date.toISOString()),
	minutes_url: z.url().nullable().optional(),
	name: z.string(),
	notes: z.string().nullable().optional(),
	notice_url: z.url().nullable().optional(),
	report_url: z.url().nullable().optional(),
});

export const MeetingsUpdateSchema = z.object({
	agenda_url: z.url().nullable().optional(),
	is_cancelled: z.boolean().optional(),
	location: z.string().optional(),
	meeting_at: z.coerce
		.date()
		.optional()
		.transform((date) => (date ? date.toISOString() : date)),
	minutes_url: z.url().nullable().optional(),
	name: z.string().optional(),
	notes: z.string().nullable().optional(),
	notice_url: z.url().nullable().optional(),
	report_url: z.url().nullable().optional(),
});

export type MeetingsRowType = z.infer<typeof MeetingsRowSchema>;
export type MeetingsInsertType = z.infer<typeof MeetingsInsertSchema>;
export type MeetingsUpdateType = z.infer<typeof MeetingsUpdateSchema>;
