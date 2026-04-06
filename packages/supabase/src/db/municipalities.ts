import z from "zod";

export const MunicipalitiesRowSchema = z.object({
	created_at: z.coerce.date<Date>(),
	created_by: z.string().nullable(),
	id: z.uuid(),
	name: z.string(),
	updated_at: z.coerce.date<Date>(),
	updated_by: z.string().nullable(),
});

export const MunicipalitiesInsertSchema = z.object({
	id: z.uuid(),
	name: z.string(),
});

export const MunicipalitiesUpdateSchema = z.object({
	name: z.string().optional(),
});

export type MunicipalitiesRowType = z.infer<typeof MunicipalitiesRowSchema>;
export type MunicipalitiesInsertType = z.infer<
	typeof MunicipalitiesInsertSchema
>;
export type MunicipalitiesUpdateType = z.infer<
	typeof MunicipalitiesUpdateSchema
>;
