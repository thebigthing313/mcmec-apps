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
	is_processed: z.boolean().default(false),
	location_of_water_body: NonEmptyStringSchema(5),
	phone: ValidPhoneNumberSchema,
	type_of_water_body: NonEmptyStringSchema(3),
	updated_at: z.coerce.date(),
	updated_by: NonEmptyUUID.nullable(),
	zip_code_id: NonEmptyUUID,
});

export const MosquitofishRequestsRowSchema = BaseSchema;

export const MosquitofishRequestsInsertSchema = BaseSchema.omit({
	created_at: true,
	created_by: true,
	updated_at: true,
	updated_by: true,
});

export const MosquitofishRequestsUpdateSchema = BaseSchema.omit({
	created_at: true,
	created_by: true,
	id: true,
	updated_at: true,
	updated_by: true,
}).partial();

export type MosquitofishRequestsRowType = z.infer<
	typeof MosquitofishRequestsRowSchema
>;
export type MosquitofishRequestsInsertType = z.infer<
	typeof MosquitofishRequestsInsertSchema
>;
export type MosquitofishRequestsUpdateType = z.infer<
	typeof MosquitofishRequestsUpdateSchema
>;
