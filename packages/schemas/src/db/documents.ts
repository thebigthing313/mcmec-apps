import z from "zod";

export const DocumentsRowSchema = z.object({
	created_at: z.coerce.date<Date>(),
	document_type_id: z.uuid(),
	fiscal_year: z.number().int(),
	id: z.uuid(),
	is_published: z.boolean(),
	updated_at: z.coerce.date<Date>(),
	url: z.url(),
});

export type DocumentsRowType = z.infer<typeof DocumentsRowSchema>;
