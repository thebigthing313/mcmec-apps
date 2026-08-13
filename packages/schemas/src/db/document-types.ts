import z from "zod";

export const DocumentTypesRowSchema = z.object({
	created_at: z.coerce.date<Date>(),
	description: z.string().nullable(),
	id: z.uuid(),
	name: z.string(),
	updated_at: z.coerce.date<Date>(),
});

export const DocumentTypesInsertSchema = z.object({
	description: z.string().nullable(),
	id: z.uuid(),
	name: z.string(),
});

export const DocumentTypesUpdateSchema = z.object({
	description: z.string().nullable().optional(),
	name: z.string().optional(),
});

export type DocumentTypesRowType = z.infer<typeof DocumentTypesRowSchema>;
export type DocumentTypesInsertType = z.infer<typeof DocumentTypesInsertSchema>;
export type DocumentTypesUpdateType = z.infer<typeof DocumentTypesUpdateSchema>;
