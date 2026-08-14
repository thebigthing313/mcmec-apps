import z from "zod";

/**
 * Spray-schedule ↔ municipality junction.
 *
 * The table carries a surrogate `id` purely so it can sync as a collection (TanStack DB keys
 * rows by `id`); the meaningful key is the unique `(spray_schedule_id, municipality_id)` pair.
 * Reads come from this collection; writes go through
 * `PUT /api/spray-schedules/:id/municipalities`, which replaces a schedule's whole set in one
 * transaction — so there is no insert/update schema here.
 */
export const SprayScheduleMunicipalitiesRowSchema = z.object({
	id: z.uuid(),
	municipality_id: z.uuid(),
	spray_schedule_id: z.uuid(),
});

export type SprayScheduleMunicipalitiesRowType = z.infer<
	typeof SprayScheduleMunicipalitiesRowSchema
>;
