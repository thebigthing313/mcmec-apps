import z from "zod";

export const MunicipalitiesRowSchema = z.object({
	created_at: z.coerce.date<Date>(),
	id: z.uuid(),
	name: z.string(),
	updated_at: z.coerce.date<Date>(),
});

export type MunicipalitiesRowType = z.infer<typeof MunicipalitiesRowSchema>;
