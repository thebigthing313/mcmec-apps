import z from "zod";

export const SprayScheduleMunicipalitiesRowSchema = z.object({
	municipality_id: z.uuid(),
	spray_schedule_id: z.uuid(),
});

export const SprayScheduleMunicipalitiesInsertSchema = z.object({
	municipality_id: z.uuid(),
	spray_schedule_id: z.uuid(),
});

export type SprayScheduleMunicipalitiesRowType = z.infer<
	typeof SprayScheduleMunicipalitiesRowSchema
>;
export type SprayScheduleMunicipalitiesInsertType = z.infer<
	typeof SprayScheduleMunicipalitiesInsertSchema
>;
