import z from "zod";

export const DocumentsRowSchema = z.object({
	created_at: z.coerce.date<Date>(),
	created_by: z.string().nullable(),
	document_type_id: z.uuid(),
	fiscal_year: z.number().int(),
	id: z.uuid(),
	is_published: z.boolean(),
	updated_at: z.coerce.date<Date>(),
	updated_by: z.string().nullable(),
	url: z.url(),
});

export const DocumentsInsertSchema = z.object({
	document_type_id: z.uuid(),
	fiscal_year: z.number().int(),
	id: z.uuid(),
	is_published: z.boolean(),
	url: z.url(),
});

export const DocumentsUpdateSchema = z.object({
	document_type_id: z.uuid().optional(),
	fiscal_year: z.number().int().optional(),
	is_published: z.boolean().optional(),
	url: z.url().optional(),
});

export type DocumentsRowType = z.infer<typeof DocumentsRowSchema>;
export type DocumentsInsertType = z.infer<typeof DocumentsInsertSchema>;
export type DocumentsUpdateType = z.infer<typeof DocumentsUpdateSchema>;
