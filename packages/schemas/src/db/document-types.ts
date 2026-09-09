import z from "zod";

export const DocumentTypesRowSchema = z.object({
	created_at: z.coerce.date<Date>(),
	description: z.string().nullable(),
	id: z.uuid(),
	name: z.string(),
	updated_at: z.coerce.date<Date>(),
});

export type DocumentTypesRowType = z.infer<typeof DocumentTypesRowSchema>;
