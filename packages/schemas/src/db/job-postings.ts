import z from "zod";

export const JobPostingsRowSchema = z.object({
	content: z.any(),
	created_at: z.coerce.date<Date>(),
	id: z.uuid(),
	is_closed: z.boolean(),
	published_at: z.coerce.date<Date>().nullable(),
	title: z.string(),
	updated_at: z.coerce.date<Date>(),
});

export type JobPostingsRowType = z.infer<typeof JobPostingsRowSchema>;
