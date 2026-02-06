import {
	NonEmptyStringSchema,
	NonEmptyUUID,
	ValidEmailSchema,
	ValidPhoneNumberSchema,
} from "@mcmec/lib/constants/validators";
import z from "zod";

const BaseSchema = z.object({
	additional_details: z.string().nullable(),
	address_line_1: NonEmptyStringSchema(2),
	address_line_2: z.string().nullable(),
	created_at: z.coerce.date<Date>(),
	created_by: NonEmptyUUID.nullable(),
	email: ValidEmailSchema.nullable(),
	full_name: NonEmptyStringSchema(2),
	id: NonEmptyUUID,
	is_accessible: z.boolean(),
	is_daytime: z.boolean(),
	is_dusk_dawn: z.boolean(),
	is_front_of_property: z.boolean(),
	is_general_vicinity: z.boolean(),
	is_nighttime: z.boolean(),
	is_processed: z.boolean(),
	is_rear_of_property: z.boolean(),
	phone: ValidPhoneNumberSchema,
	updated_at: z.coerce.date<Date>(),
	updated_by: NonEmptyUUID.nullable(),
	zip_code_id: NonEmptyUUID,
});
export const AdultMosquitoRequestsRowSchema = BaseSchema.refine(
	(data) => {
		return data.is_daytime || data.is_dusk_dawn || data.is_nighttime;
	},
	{
		message: "At least one time of day must be selected.",
		path: ["is_dusk_dawn"],
	},
).refine(
	(data) => {
		return (
			data.is_front_of_property ||
			data.is_rear_of_property ||
			data.is_general_vicinity
		);
	},
	{
		message: "At least one location option must be selected.",
		path: ["is_front_of_property"],
	},
);

export const AdultMosquitoRequestsInsertSchema = BaseSchema.omit({
	created_at: true,
	created_by: true,
	updated_at: true,
	updated_by: true,
})
	.refine(
		(data) => {
			return data.is_daytime || data.is_dusk_dawn || data.is_nighttime;
		},
		{
			message: "At least one time of day must be selected.",
			path: ["is_daytime"],
		},
	)
	.refine(
		(data) => {
			return (
				data.is_front_of_property ||
				data.is_rear_of_property ||
				data.is_general_vicinity
			);
		},
		{
			message: "At least one location option must be selected.",
			path: ["is_front_of_property"],
		},
	);

export const AdultMosquitoRequestsUpdateSchema = BaseSchema.omit({
	created_at: true,
	created_by: true,
	id: true,
	updated_at: true,
	updated_by: true,
}).partial();

export type AdultMosquitoRequestsRowType = z.infer<
	typeof AdultMosquitoRequestsRowSchema
>;
export type AdultMosquitoRequestsInsertType = z.infer<
	typeof AdultMosquitoRequestsInsertSchema
>;
export type AdultMosquitoRequestsUpdateType = z.infer<
	typeof AdultMosquitoRequestsUpdateSchema
>;
