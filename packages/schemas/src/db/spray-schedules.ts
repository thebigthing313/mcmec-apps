import z from "zod";

/**
 * Spray missions.
 *
 * Row schema only: `spray_schedules` is on the named-command path (#162), so its writes are
 * command payloads defined in `@mcmec/domain`, not "a row minus the server columns". The
 * Insert/Update pair went with the generic door.
 */
export const SprayScheduleStatusEnum = z.enum([
	"scheduled",
	"delayed",
	"cancelled",
	"completed",
]);

export type SprayScheduleStatus = z.infer<typeof SprayScheduleStatusEnum>;

export const SpraySchedulesRowSchema = z.object({
	area_description: z.string(),
	created_at: z.coerce.date<Date>(),
	end_time: z.string(),
	id: z.uuid(),
	insecticide_id: z.uuid(),
	map_url: z.url().nullable(),
	mission_date: z.coerce.date<Date>(),
	rain_date: z.coerce.date<Date>().nullable(),
	start_time: z.string(),
	status: SprayScheduleStatusEnum,
	updated_at: z.coerce.date<Date>(),
});

export type SpraySchedulesRowType = z.infer<typeof SpraySchedulesRowSchema>;
