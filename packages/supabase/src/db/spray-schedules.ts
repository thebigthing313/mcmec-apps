import z from "zod";

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
	created_by: z.string().nullable(),
	end_time: z.string(),
	id: z.uuid(),
	insecticide_id: z.uuid(),
	map_url: z.url().nullable(),
	mission_date: z.coerce.date<Date>(),
	rain_date: z.coerce.date<Date>().nullable(),
	start_time: z.string(),
	status: SprayScheduleStatusEnum,
	updated_at: z.coerce.date<Date>(),
	updated_by: z.string().nullable(),
});

export const SpraySchedulesInsertSchema = z.object({
	area_description: z.string(),
	end_time: z.string(),
	id: z.uuid(),
	insecticide_id: z.uuid(),
	map_url: z.url().nullable().optional(),
	mission_date: z.coerce.date<Date>().transform((date) => date.toISOString()),
	rain_date: z.coerce
		.date<Date>()
		.nullable()
		.optional()
		.transform((date) => (date ? date.toISOString() : date)),
	start_time: z.string(),
	status: SprayScheduleStatusEnum,
});

export const SpraySchedulesUpdateSchema = z.object({
	area_description: z.string().optional(),
	end_time: z.string().optional(),
	insecticide_id: z.uuid().optional(),
	map_url: z.url().nullable().optional(),
	mission_date: z.coerce
		.date()
		.optional()
		.transform((date) => (date ? date.toISOString() : date)),
	rain_date: z.coerce
		.date()
		.nullable()
		.optional()
		.transform((date) => (date ? date.toISOString() : date)),
	start_time: z.string().optional(),
	status: SprayScheduleStatusEnum.optional(),
});

export type SpraySchedulesRowType = z.infer<typeof SpraySchedulesRowSchema>;
export type SpraySchedulesInsertType = z.infer<
	typeof SpraySchedulesInsertSchema
>;
export type SpraySchedulesUpdateType = z.infer<
	typeof SpraySchedulesUpdateSchema
>;
