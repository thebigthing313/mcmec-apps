import z from "zod";

export const JobPostingsRowSchema = z.object({
	content: z.any(),
	created_at: z.coerce.date<Date>(),
	created_by: z.uuid().nullable(),
	id: z.uuid(),
	is_closed: z.boolean(),
	published_at: z.coerce.date<Date>().nullable(),
	title: z.string(),
	updated_at: z.coerce.date<Date>(),
	updated_by: z.uuid().nullable(),
});

export const JobPostingsInsertSchema = z.object({
	content: z.any(),
	is_closed: z.boolean().optional(),
	published_at: z.coerce.date<Date>().nullable().optional(),
	title: z.string(),
});

export const JobPostingsUpdateSchema = z.object({
	content: z.any().optional(),
	is_closed: z.boolean().optional(),
	published_at: z.coerce.date<Date>().nullable().optional(),
	title: z.string().optional(),
});

export type JobPostingsRowType = z.infer<typeof JobPostingsRowSchema>;
export type JobPostingsInsertType = z.infer<typeof JobPostingsInsertSchema>;
export type JobPostingsUpdateType = z.infer<typeof JobPostingsUpdateSchema>;
