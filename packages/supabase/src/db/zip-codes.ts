import z from "zod";

export const ZipCodesRowSchema = z.object({
	city: z.string(),
	code: z.string(),
	created_at: z.coerce.date(),
	created_by: z.string().nullable(),
	id: z.uuid(),
	state: z.string(),
	updated_at: z.coerce.date(),
	updated_by: z.string().nullable(),
});

export const ZipCodesInsertSchema = z.object({
	city: z.string().min(1, "City is required"),
	code: z.string().regex(/^\d{5}$/, "Zip code must be 5 digits"),
	id: z.uuid(),
	state: z.string().min(2, "State is required"),
});

export const ZipCodesUpdateSchema = z.object({
	city: z.string().optional(),
	code: z.string().optional(),
	state: z.string().optional(),
});

export type ZipCodesRowType = z.infer<typeof ZipCodesRowSchema>;
export type ZipCodesInsertType = z.infer<typeof ZipCodesInsertSchema>;
export type ZipCodesUpdateType = z.infer<typeof ZipCodesUpdateSchema>;
