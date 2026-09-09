import z from "zod";

/**
 * Spray-schedule ↔ municipality junction.
 *
 * The table carries a surrogate `id` purely so it can sync as a collection (TanStack DB keys
 * rows by `id`); the meaningful key is the unique `(spray_schedule_id, municipality_id)` pair.
 * Reads come from this collection; nothing writes it directly. A mission's whole set is
 * replaced by `website.createSprayMission` / `website.updateSprayMissionDetails`, inside the
 * same transaction that writes the mission row (#162) — so there is no insert/update schema
 * here, and no separate endpoint either.
 */
export const SprayScheduleMunicipalitiesRowSchema = z.object({
	id: z.uuid(),
	municipality_id: z.uuid(),
	spray_schedule_id: z.uuid(),
});

export type SprayScheduleMunicipalitiesRowType = z.infer<
	typeof SprayScheduleMunicipalitiesRowSchema
>;
