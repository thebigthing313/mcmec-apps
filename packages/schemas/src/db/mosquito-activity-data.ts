import z from "zod";

export const MosquitoActivityDataRowSchema = z.object({
	created_at: z.coerce.date<Date>(),
	id: z.uuid(),
	mosquito_count: z.number().int(),
	rainfall_inches: z.number(),
	species_group: z.string(),
	species_name: z.string(),
	updated_at: z.coerce.date<Date>(),
	week_number: z.number().int().min(1).max(53),
	year: z.number().int(),
});

export type MosquitoActivityDataRowType = z.infer<
	typeof MosquitoActivityDataRowSchema
>;
