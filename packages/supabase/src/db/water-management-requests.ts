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
	created_at: z.coerce.date(),
	created_by: NonEmptyUUID.nullable(),
	email: ValidEmailSchema.nullable(),
	full_name: NonEmptyStringSchema(2),
	id: NonEmptyUUID,
	is_on_my_property: z.boolean().default(false),
	is_on_neighbor_property: z.boolean().default(false),
	is_on_public_property: z.boolean().default(false),
	is_processed: z.boolean().default(false),
	location_of_concern: NonEmptyStringSchema(5),
	other_location_description: z.string().nullable(),
	phone: ValidPhoneNumberSchema,
	updated_at: z.coerce.date(),
	updated_by: NonEmptyUUID.nullable(),
	zip_code_id: NonEmptyUUID,
});

export const WaterManagementRequestsRowSchema = BaseSchema.refine(
	(data) => {
		return (
			data.is_on_my_property ||
			data.is_on_neighbor_property ||
			data.is_on_public_property
		);
	},
	{
		message: "At least one location option must be selected.",
		path: ["is_on_my_property"],
	},
);

export const WaterManagementRequestsInsertSchema = BaseSchema.omit({
	created_at: true,
	created_by: true,
	updated_at: true,
	updated_by: true,
}).refine(
	(data) => {
		return (
			data.is_on_my_property ||
			data.is_on_neighbor_property ||
			data.is_on_public_property
		);
	},
	{
		message: "At least one location option must be selected.",
		path: ["is_on_my_property"],
	},
);

export const WaterManagementRequestsUpdateSchema = BaseSchema.omit({
	created_at: true,
	created_by: true,
	id: true,
	updated_at: true,
	updated_by: true,
}).partial();

export type WaterManagementRequestsRowType = z.infer<
	typeof WaterManagementRequestsRowSchema
>;
export type WaterManagementRequestsInsertType = z.infer<
	typeof WaterManagementRequestsInsertSchema
>;
export type WaterManagementRequestsUpdateType = z.infer<
	typeof WaterManagementRequestsUpdateSchema
>;
