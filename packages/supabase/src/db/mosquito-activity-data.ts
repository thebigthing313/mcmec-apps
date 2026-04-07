import z from "zod";

export const MosquitoActivityDataRowSchema = z.object({
	created_at: z.coerce.date<Date>(),
	created_by: z.string().nullable(),
	id: z.uuid(),
	mosquito_count: z.number().int(),
	rainfall_inches: z.number(),
	species_group: z.string(),
	species_name: z.string(),
	updated_at: z.coerce.date<Date>(),
	updated_by: z.string().nullable(),
	week_number: z.number().int().min(1).max(53),
	year: z.number().int(),
});

export const MosquitoActivityDataInsertSchema = z.object({
	id: z.uuid(),
	mosquito_count: z.number().int(),
	rainfall_inches: z.number(),
	species_group: z.string(),
	species_name: z.string(),
	week_number: z.number().int().min(1).max(53),
	year: z.number().int(),
});

export const MosquitoActivityDataUpdateSchema = z.object({
	mosquito_count: z.number().int().optional(),
	rainfall_inches: z.number().optional(),
	species_group: z.string().optional(),
	species_name: z.string().optional(),
	week_number: z.number().int().min(1).max(53).optional(),
	year: z.number().int().optional(),
});

export type MosquitoActivityDataRowType = z.infer<
	typeof MosquitoActivityDataRowSchema
>;
export type MosquitoActivityDataInsertType = z.infer<
	typeof MosquitoActivityDataInsertSchema
>;
export type MosquitoActivityDataUpdateType = z.infer<
	typeof MosquitoActivityDataUpdateSchema
>;
